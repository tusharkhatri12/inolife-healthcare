const Visit = require('../models/Visit');
const Doctor = require('../models/Doctor');
const DoctorCoveragePlan = require('../models/doctorCoveragePlan.model');
const mongoose = require('mongoose');
const { parsePagination, formatPaginationResponse } = require('../utils/pagination');
const { validateLocation, validateVisitTimes, validateVisitDate, getDayRange } = require('../utils/validators');

// @desc    Get all visits
// @route   GET /api/visits
// @access  Private
exports.getVisits = async (req, res, next) => {
  try {
    const { mrId, doctorId, startDate, endDate, status, visitOutcome, outcomeFilter } = req.query;
    const query = {};

    // MRs can only see their own visits
    if (req.user.role === 'MR') {
      query.mrId = req.user.id;
    } else if (mrId) {
      query.mrId = mrId;
    }

    // Filter by doctor
    if (doctorId) {
      query.doctorId = doctorId;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.visitDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.visitDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.visitDate.$lte = end;
      }
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by visit outcome (MET_DOCTOR vs attempted)
    if (visitOutcome) {
      query.visitOutcome = visitOutcome;
    } else if (outcomeFilter === 'met') {
      query.$or = [
        { visitOutcome: 'MET_DOCTOR' },
        { visitOutcome: { $exists: false } },
        { visitOutcome: null },
      ];
    } else if (outcomeFilter === 'not_met') {
      query.visitOutcome = { $in: ['DOCTOR_NOT_AVAILABLE', 'DOCTOR_DID_NOT_MEET', 'CLINIC_CLOSED', 'OTHER'] };
    }

    // Managers can see visits of their MRs
    if (req.user.role === 'Manager') {
      // If no specific mrId filter, show all MRs under this manager
      if (!mrId) {
        const User = require('../models/User');
        const mrs = await User.find({ managerId: req.user.id }).select('_id');
        const mrIds = mrs.map((mr) => mr._id);
        query.mrId = { $in: mrIds };
      }
    }

    // Pagination
    const { page, limit, skip } = parsePagination(req.query);

    // Get total count for pagination
    const total = await Visit.countDocuments(query);

    // Get visits with pagination
    const visits = await Visit.find(query)
      .populate('mrId', 'name email phone employeeId')
      .populate('doctorId', 'name specialization clinicName city')
      .populate('productsDiscussed.productId', 'name code')
      .populate('samplesGiven.productId', 'name code')
      .populate('orders.productId', 'name code mrp')
      .sort({ visitDate: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(
      formatPaginationResponse({
        data: { visits },
        total,
        page,
        limit,
      })
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get single visit
// @route   GET /api/visits/:id
// @access  Private
exports.getVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('mrId', 'name email phone employeeId')
      .populate('doctorId', 'name specialization clinicName city')
      .populate('productsDiscussed.productId', 'name code')
      .populate('samplesGiven.productId', 'name code')
      .populate('orders.productId', 'name code mrp');

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found',
      });
    }

    // MRs can only see their own visits
    if (req.user.role === 'MR' && visit.mrId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this visit',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        visit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create visit
// @route   POST /api/visits
// @access  Private
exports.createVisit = async (req, res, next) => {
  try {
    // BUSINESS RULE: Always assign MR from JWT token - never trust client
    const mrId = req.user.id;
    
    // Only Owner and Manager can create visits for other MRs
    if (req.user.role === 'MR') {
      // MRs can only create visits for themselves
      if (req.body.mrId && req.body.mrId !== mrId) {
        return res.status(403).json({
          success: false,
          message: 'You can only create visits for yourself',
        });
      }
    }

    // Remove mrId from body to prevent client manipulation
    delete req.body.mrId;
    req.body.mrId = mrId;

    // Validate required fields
    if (!req.body.doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required',
      });
    }

    const visitOutcomeVal = req.body.visitOutcome || 'MET_DOCTOR';
    const isMet = visitOutcomeVal === 'MET_DOCTOR';
    if (!isMet && (!req.body.notMetReason || !String(req.body.notMetReason).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required when visit outcome is not "Met Doctor"',
      });
    }

    // Verify doctor exists
    const doctor = await Doctor.findById(req.body.doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // BUSINESS RULE: MRs can only visit assigned doctors
    if (req.user.role === 'MR' && doctor.assignedMR?.toString() !== mrId) {
      return res.status(403).json({
        success: false,
        message: 'Doctor is not assigned to you',
      });
    }

    // BUSINESS RULE: Prevent duplicate visits by same MR to same doctor on same day
    const visitDate = req.body.visitDate ? new Date(req.body.visitDate) : new Date();
    const { start, end } = getDayRange(visitDate);

    const existingVisit = await Visit.findOne({
      mrId,
      doctorId: req.body.doctorId,
      visitDate: {
        $gte: start,
        $lte: end,
      },
      status: { $ne: 'Cancelled' }, // Allow cancelled visits to be recreated
    });

    if (existingVisit) {
      // Return existing visit info so client can handle it appropriately
      return res.status(409).json({
        success: false,
        message: 'A visit to this doctor already exists for this date. Please update the existing visit or cancel it first.',
        data: {
          existingVisitId: existingVisit._id,
          existingVisit: existingVisit,
        },
      });
    }

    // BUSINESS RULE: Validate visit date
    if (req.body.visitDate) {
      const dateValidation = validateVisitDate(req.body.visitDate);
      if (!dateValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: dateValidation.errors.join(', '),
        });
      }
    }

    // BUSINESS RULE: Validate check-in < check-out
    if (req.body.checkInTime || req.body.checkOutTime) {
      const timeValidation = validateVisitTimes(req.body.checkInTime, req.body.checkOutTime);
      if (!timeValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: timeValidation.errors.join(', '),
        });
      }
    }

    // BUSINESS RULE: Validate GPS coordinates (India range)
    if (req.body.location) {
      const locationValidation = validateLocation(req.body.location);
      if (!locationValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: locationValidation.errors.join(', '),
        });
      }
    }

    // Set visit date if not provided
    if (!req.body.visitDate) {
      req.body.visitDate = visitDate;
    }

    // Get month string in YYYY-MM format for coverage plan lookup
    const visitDateForMonth = req.body.visitDate ? new Date(req.body.visitDate) : visitDate;
    const year = visitDateForMonth.getFullYear();
    const month = String(visitDateForMonth.getMonth() + 1).padStart(2, '0');
    const monthString = `${year}-${month}`;

    // Determine if visit should be counted toward coverage (completed meeting only)
    const visitStatus = req.body.status || 'Completed';
    const shouldCountVisit =
      visitStatus !== 'Cancelled' && (visitOutcomeVal === 'MET_DOCTOR' || !req.body.visitOutcome);

    // For attempted (not met) visits: ensure duration/products optional
    if (!isMet) {
      req.body.duration = req.body.duration != null ? req.body.duration : 0;
      if (!req.body.productsDiscussed || !Array.isArray(req.body.productsDiscussed)) {
        req.body.productsDiscussed = [];
      }
      if (!req.body.samplesGiven || !Array.isArray(req.body.samplesGiven)) {
        req.body.samplesGiven = [];
      }
      if (!req.body.orders || !Array.isArray(req.body.orders)) {
        req.body.orders = [];
      }
    }

    // Create visit (without transaction for standalone MongoDB)
    const visit = await Visit.create(req.body);
    const createdVisitId = visit._id;

    // Update coverage plan if visit should be counted
    // Note: Without transactions, this is not atomic, but it's safe for most use cases
    if (shouldCountVisit) {
      try {
        // Ensure ObjectId matching for assignedMR
        const assignedMRId = mongoose.Types.ObjectId.isValid(mrId)
          ? new mongoose.Types.ObjectId(mrId)
          : mrId;
        
        const coveragePlan = await DoctorCoveragePlan.findOne({
          doctorId: req.body.doctorId,
          assignedMR: assignedMRId,
          month: monthString,
          isActive: true,
        });

        if (coveragePlan) {
          // Recalculate actualVisits from all visits (more accurate than incrementing)
          // Parse month string (YYYY-MM) to get start and end of month
          const [year, month] = monthString.split('-').map(Number);
          const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
          const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
          
          // Count only visits where doctor was met (coverage completion)
          const actualVisitsCount = await Visit.countDocuments({
            doctorId: req.body.doctorId,
            mrId: assignedMRId,
            visitDate: {
              $gte: startOfMonth,
              $lte: endOfMonth,
            },
            status: { $ne: 'Cancelled' },
            $or: [
              { visitOutcome: 'MET_DOCTOR' },
              { visitOutcome: { $exists: false } },
              { visitOutcome: null },
            ],
          });

          // Update coverage plan with recalculated values
          coveragePlan.actualVisits = actualVisitsCount;
          
          // Recalculate compliance percentage
          if (coveragePlan.plannedVisits && coveragePlan.plannedVisits > 0) {
            coveragePlan.compliancePercentage = Number(
              ((coveragePlan.actualVisits / coveragePlan.plannedVisits) * 100).toFixed(2)
            );
          } else {
            coveragePlan.compliancePercentage = 0;
          }

          // Recalculate status: >80% = ON_TRACK, 50–80% = AT_RISK, <50% = MISSED
          if (coveragePlan.compliancePercentage > 80) {
            coveragePlan.status = 'ON_TRACK';
          } else if (coveragePlan.compliancePercentage >= 50) {
            coveragePlan.status = 'AT_RISK';
          } else {
            coveragePlan.status = 'MISSED';
          }

          await coveragePlan.save();
          console.log(`[Visit] Updated coverage plan for doctor ${req.body.doctorId}, month ${monthString}: actualVisits=${coveragePlan.actualVisits}, compliance=${coveragePlan.compliancePercentage}%`);
        } else {
          console.log(`[Visit] No coverage plan found for doctor ${req.body.doctorId}, MR ${mrId}, month ${monthString}`);
        }
      } catch (coverageError) {
        // Log error but don't fail visit creation
        console.error(`[Visit] Error updating coverage plan:`, coverageError);
      }
    }

    // Populate and return visit
    const populatedVisit = await Visit.findById(createdVisitId)
      .populate('mrId', 'name email phone employeeId')
      .populate('doctorId', 'name specialization clinicName city')
      .populate('productsDiscussed.productId', 'name code')
      .populate('samplesGiven.productId', 'name code')
      .populate('orders.productId', 'name code mrp');

    res.status(201).json({
      success: true,
      data: {
        visit: populatedVisit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update visit
// @route   PUT /api/visits/:id
// @access  Private
exports.updateVisit = async (req, res, next) => {
  try {
    let visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found',
      });
    }

    // BUSINESS RULE: MRs can only update their own visits
    if (req.user.role === 'MR' && visit.mrId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this visit',
      });
    }

    // BUSINESS RULE: Never allow changing mrId - always from JWT
    delete req.body.mrId;

    // BUSINESS RULE: If updating visitDate, check for duplicate visits
    if (req.body.visitDate) {
      const newVisitDate = new Date(req.body.visitDate);
      const { start, end } = getDayRange(newVisitDate);
      const currentVisitDate = new Date(visit.visitDate);
      const currentDayRange = getDayRange(currentVisitDate);

      // Only check for duplicates if date is actually changing
      if (
        newVisitDate.getTime() < currentDayRange.start.getTime() ||
        newVisitDate.getTime() > currentDayRange.end.getTime()
      ) {
        const existingVisit = await Visit.findOne({
          _id: { $ne: visit._id }, // Exclude current visit
          mrId: visit.mrId,
          doctorId: visit.doctorId,
          visitDate: {
            $gte: start,
            $lte: end,
          },
          status: { $ne: 'Cancelled' },
        });

        if (existingVisit) {
          return res.status(409).json({
            success: false,
            message: 'A visit to this doctor already exists on the selected date',
            data: {
              existingVisitId: existingVisit._id,
            },
          });
        }

        // Validate new visit date
        const dateValidation = validateVisitDate(req.body.visitDate);
        if (!dateValidation.isValid) {
          return res.status(400).json({
            success: false,
            message: dateValidation.errors.join(', '),
          });
        }
      }
    }

    // BUSINESS RULE: Validate check-in < check-out
    const checkInTime = req.body.checkInTime || visit.checkInTime;
    const checkOutTime = req.body.checkOutTime || visit.checkOutTime;
    
    if (checkInTime && checkOutTime) {
      const timeValidation = validateVisitTimes(checkInTime, checkOutTime);
      if (!timeValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: timeValidation.errors.join(', '),
        });
      }
    }

    // BUSINESS RULE: Validate GPS coordinates if location is being updated
    if (req.body.location) {
      const locationValidation = validateLocation(req.body.location);
      if (!locationValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: locationValidation.errors.join(', '),
        });
      }
    }

    visit = await Visit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('mrId', 'name email phone employeeId')
      .populate('doctorId', 'name specialization clinicName city')
      .populate('productsDiscussed.productId', 'name code')
      .populate('samplesGiven.productId', 'name code')
      .populate('orders.productId', 'name code mrp');

    res.status(200).json({
      success: true,
      data: {
        visit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete visit
// @route   DELETE /api/visits/:id
// @access  Private
exports.deleteVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found',
      });
    }

    // MRs can only delete their own visits
    if (req.user.role === 'MR' && visit.mrId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this visit',
      });
    }

    await visit.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Visit deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
