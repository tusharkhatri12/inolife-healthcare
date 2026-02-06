const BeatPlan = require('../models/beatPlan.model');
const Visit = require('../models/Visit');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

const getManagerMrIds = async (managerId) => {
  const mrs = await User.find({ managerId, role: 'MR', isActive: true }).select('_id');
  return mrs.map((mr) => mr._id);
};

const getDayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Create daily beat plan
// @route   POST /api/beat-plans
// @access  Private
exports.createBeatPlan = async (req, res, next) => {
  try {
    const { date, plannedDoctors, notes } = req.body;

    if (!date || !plannedDoctors || !Array.isArray(plannedDoctors) || plannedDoctors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'date and plannedDoctors (array with at least one doctor) are required',
      });
    }

    // Auto-assign mrId from JWT if MR, otherwise use provided mrId
    let assignedMrId = req.user.role === 'MR' ? req.user.id : req.body.mrId;

    if (!assignedMrId) {
      return res.status(400).json({
        success: false,
        message: 'mrId is required for non-MR users',
      });
    }

    // Validate MR exists and is active
    const mr = await User.findById(assignedMrId);
    if (!mr || mr.role !== 'MR' || !mr.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive MR',
      });
    }

    // Role-based authorization: Managers can only create for their MRs
    if (req.user.role === 'Manager') {
      const managerMrIds = await getManagerMrIds(req.user.id);
      const isAllowed = managerMrIds.some((id) => id.toString() === assignedMrId.toString());
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to create plans for this MR',
        });
      }
    }

    // Check if plan already exists for this MR and date
    const planDate = new Date(date);
    planDate.setHours(0, 0, 0, 0);
    const existingPlan = await BeatPlan.findOne({
      mrId: assignedMrId,
      date: {
        $gte: new Date(planDate),
        $lt: new Date(planDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingPlan) {
      return res.status(409).json({
        success: false,
        message: 'Beat plan already exists for this MR and date',
      });
    }

    // Validate all planned doctors exist and are assigned to this MR
    const doctors = await Doctor.find({
      _id: { $in: plannedDoctors },
      isActive: true,
    });

    if (doctors.length !== plannedDoctors.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more doctors not found or inactive',
      });
    }

    // Check if all doctors are assigned to this MR
    const unassignedDoctors = doctors.filter(
      (doc) => !doc.assignedMR || doc.assignedMR.toString() !== assignedMrId.toString()
    );

    if (unassignedDoctors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more doctors are not assigned to this MR',
        unassignedDoctors: unassignedDoctors.map((d) => ({
          id: d._id,
          name: d.name,
        })),
      });
    }

    const plan = await BeatPlan.create({
      mrId: assignedMrId,
      date: planDate,
      plannedDoctors,
      notes,
      createdBy: req.user.id,
    });

    const populatedPlan = await BeatPlan.findById(plan._id)
      .populate('mrId', 'name email employeeId')
      .populate('plannedDoctors', 'name specialization clinicName city');

    res.status(201).json({
      success: true,
      data: { plan: populatedPlan },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get beat plans
// @route   GET /api/beat-plans
// @access  Private
exports.getBeatPlans = async (req, res, next) => {
  try {
    const { mrId, startDate, endDate } = req.query;
    const query = {};

    // MRs can only see their own plans
    if (req.user.role === 'MR') {
      query.mrId = req.user.id;
    } else if (mrId) {
      query.mrId = mrId;
    }

    // Managers can see plans of their MRs only
    if (req.user.role === 'Manager') {
      if (!mrId) {
        const managerMrIds = await getManagerMrIds(req.user.id);
        query.mrId = { $in: managerMrIds };
      } else {
        const managerMrIds = await getManagerMrIds(req.user.id);
        const isAllowed = managerMrIds.some((id) => id.toString() === mrId);
        if (!isAllowed) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to view plans for this MR',
          });
        }
      }
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const plans = await BeatPlan.find(query)
      .populate('mrId', 'name email employeeId')
      .populate('plannedDoctors', 'name specialization clinicName city')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: plans.length,
      data: { plans },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update beat plan
// @route   PUT /api/beat-plans/:id
// @access  Private
exports.updateBeatPlan = async (req, res, next) => {
  try {
    const plan = await BeatPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Beat plan not found',
      });
    }

    // Role-based authorization
    if (req.user.role === 'MR') {
      if (plan.mrId.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this plan',
        });
      }
    } else if (req.user.role === 'Manager') {
      const managerMrIds = await getManagerMrIds(req.user.id);
      const isAllowed = managerMrIds.some((id) => id.toString() === plan.mrId.toString());
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this plan',
        });
      }
    }

    const { plannedDoctors, notes, deviationReason } = req.body;
    const updates = {};

    if (plannedDoctors !== undefined) {
      if (!Array.isArray(plannedDoctors) || plannedDoctors.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'plannedDoctors must be an array with at least one doctor',
        });
      }

      // Validate all planned doctors exist and are assigned to this MR
      const doctors = await Doctor.find({
        _id: { $in: plannedDoctors },
        isActive: true,
      });

      if (doctors.length !== plannedDoctors.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more doctors not found or inactive',
        });
      }

      const unassignedDoctors = doctors.filter(
        (doc) => !doc.assignedMR || doc.assignedMR.toString() !== plan.mrId.toString()
      );

      if (unassignedDoctors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'One or more doctors are not assigned to this MR',
        });
      }

      updates.plannedDoctors = plannedDoctors;
    }

    if (notes !== undefined) updates.notes = notes;
    if (deviationReason !== undefined) updates.deviationReason = deviationReason;

    const updated = await BeatPlan.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('mrId', 'name email employeeId')
      .populate('plannedDoctors', 'name specialization clinicName city');

    res.status(200).json({
      success: true,
      data: { plan: updated },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get beat plan comparison (planned vs actual)
// @route   GET /api/beat-plans/:id/comparison
// @access  Private
exports.getBeatPlanComparison = async (req, res, next) => {
  try {
    const plan = await BeatPlan.findById(req.params.id)
      .populate('mrId', 'name email employeeId')
      .populate('plannedDoctors', 'name specialization clinicName city');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Beat plan not found',
      });
    }

    // Role-based authorization
    if (req.user.role === 'MR') {
      if (plan.mrId._id.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this plan',
        });
      }
    } else if (req.user.role === 'Manager') {
      const managerMrIds = await getManagerMrIds(req.user.id);
      const isAllowed = managerMrIds.some((id) => id.toString() === plan.mrId._id.toString());
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this plan',
        });
      }
    }

    const { start, end } = getDayRange(plan.date);

    // Get actual visits for this MR on this date
    const actualVisits = await Visit.find({
      mrId: plan.mrId._id,
      visitDate: {
        $gte: start,
        $lte: end,
      },
      status: { $ne: 'Cancelled' },
    })
      .populate('doctorId', 'name specialization clinicName city')
      .select('doctorId visitDate checkInTime checkOutTime purpose notes');

    const plannedDoctorIds = plan.plannedDoctors.map((doc) => doc._id.toString());
    const actualDoctorIds = actualVisits.map((visit) => visit.doctorId._id.toString());

    // Find deviations
    const plannedButNotVisited = plan.plannedDoctors.filter(
      (doc) => !actualDoctorIds.includes(doc._id.toString())
    );

    const visitedButNotPlanned = actualVisits.filter(
      (visit) => !plannedDoctorIds.includes(visit.doctorId._id.toString())
    );

    const visitedAsPlanned = actualVisits.filter((visit) =>
      plannedDoctorIds.includes(visit.doctorId._id.toString())
    );

    const hasDeviation = plannedButNotVisited.length > 0 || visitedButNotPlanned.length > 0;

    // Check if deviation reason is required but missing
    const deviationReasonRequired = hasDeviation && !plan.deviationReason;

    res.status(200).json({
      success: true,
      data: {
        plan: {
          _id: plan._id,
          date: plan.date,
          mr: {
            _id: plan.mrId._id,
            name: plan.mrId.name,
            employeeId: plan.mrId.employeeId,
          },
          plannedDoctors: plan.plannedDoctors,
          notes: plan.notes,
          deviationReason: plan.deviationReason,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
        },
        comparison: {
          plannedCount: plan.plannedDoctors.length,
          actualCount: actualVisits.length,
          visitedAsPlannedCount: visitedAsPlanned.length,
          plannedButNotVisitedCount: plannedButNotVisited.length,
          visitedButNotPlannedCount: visitedButNotPlanned.length,
          hasDeviation,
          deviationReasonRequired,
        },
        plannedButNotVisited: plannedButNotVisited.map((doc) => ({
          _id: doc._id,
          name: doc.name,
          specialization: doc.specialization,
          clinicName: doc.clinicName,
          city: doc.city,
        })),
        visitedButNotPlanned: visitedButNotPlanned.map((visit) => ({
          _id: visit._id,
          doctor: {
            _id: visit.doctorId._id,
            name: visit.doctorId.name,
            specialization: visit.doctorId.specialization,
            clinicName: visit.doctorId.clinicName,
            city: visit.doctorId.city,
          },
          visitDate: visit.visitDate,
          checkInTime: visit.checkInTime,
          checkOutTime: visit.checkOutTime,
          purpose: visit.purpose,
          notes: visit.notes,
        })),
        visitedAsPlanned: visitedAsPlanned.map((visit) => ({
          _id: visit._id,
          doctor: {
            _id: visit.doctorId._id,
            name: visit.doctorId.name,
            specialization: visit.doctorId.specialization,
            clinicName: visit.doctorId.clinicName,
            city: visit.doctorId.city,
          },
          visitDate: visit.visitDate,
          checkInTime: visit.checkInTime,
          checkOutTime: visit.checkOutTime,
          purpose: visit.purpose,
          notes: visit.notes,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update deviation reason (mandatory when deviation exists)
// @route   PUT /api/beat-plans/:id/deviation-reason
// @access  Private
exports.updateDeviationReason = async (req, res, next) => {
  try {
    const { deviationReason } = req.body;

    if (!deviationReason || deviationReason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'deviationReason is required',
      });
    }

    const plan = await BeatPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Beat plan not found',
      });
    }

    // Role-based authorization
    if (req.user.role === 'MR') {
      if (plan.mrId.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this plan',
        });
      }
    } else if (req.user.role === 'Manager') {
      const managerMrIds = await getManagerMrIds(req.user.id);
      const isAllowed = managerMrIds.some((id) => id.toString() === plan.mrId.toString());
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this plan',
        });
      }
    }

    // Check if deviation actually exists
    const { start, end } = getDayRange(plan.date);
    const actualVisits = await Visit.find({
      mrId: plan.mrId,
      visitDate: {
        $gte: start,
        $lte: end,
      },
      status: { $ne: 'Cancelled' },
    }).select('doctorId');

    const plannedDoctorIds = plan.plannedDoctors.map((id) => id.toString());
    const actualDoctorIds = actualVisits.map((visit) => visit.doctorId.toString());

    const plannedButNotVisited = plan.plannedDoctors.filter(
      (id) => !actualDoctorIds.includes(id.toString())
    );
    const visitedButNotPlanned = actualVisits.filter(
      (visit) => !plannedDoctorIds.includes(visit.doctorId.toString())
    );

    const hasDeviation = plannedButNotVisited.length > 0 || visitedButNotPlanned.length > 0;

    if (!hasDeviation) {
      return res.status(400).json({
        success: false,
        message: 'No deviation found. Deviation reason is only required when there is a deviation.',
      });
    }

    plan.deviationReason = deviationReason.trim();
    await plan.save();

    const updated = await BeatPlan.findById(plan._id)
      .populate('mrId', 'name email employeeId')
      .populate('plannedDoctors', 'name specialization clinicName city');

    res.status(200).json({
      success: true,
      data: { plan: updated },
    });
  } catch (error) {
    next(error);
  }
};
