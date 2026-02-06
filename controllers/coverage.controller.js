const mongoose = require('mongoose');
const CoveragePlan = require('../models/coveragePlan.model');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const DoctorCoveragePlan = require('../models/doctorCoveragePlan.model');
const Visit = require('../models/Visit');

const parseMonthYear = (query) => {
  const now = new Date();
  const month = Number(query.month || now.getMonth() + 1);
  const year = Number(query.year || now.getFullYear());
  return { month, year };
};

const getMonthRange = (month, year) => {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

const getManagerMrIds = async (managerId) => {
  const mrs = await User.find({ managerId, role: 'MR', isActive: true }).select('_id');
  return mrs.map((mr) => mr._id);
};

// @desc    Create coverage plan
// @route   POST /api/coverage-plans
// @access  Private (Owner, Manager)
exports.createCoveragePlan = async (req, res, next) => {
  try {
    const { doctorId, mrId, month, year, monthlyTarget, notes, status } = req.body;

    if (!doctorId || !month || !year || !monthlyTarget) {
      return res.status(400).json({
        success: false,
        message: 'doctorId, month, year, and monthlyTarget are required',
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    let assignedMrId = mrId || doctor.assignedMR;
    if (!assignedMrId) {
      return res.status(400).json({
        success: false,
        message: 'MR is required. Assign the doctor to an MR or provide mrId.',
      });
    }

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

    const exists = await CoveragePlan.findOne({
      doctorId,
      mrId: assignedMrId,
      month,
      year,
    });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Coverage plan already exists for this doctor and month',
      });
    }

    const plan = await CoveragePlan.create({
      doctorId,
      mrId: assignedMrId,
      month,
      year,
      monthlyTarget,
      notes,
      status,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: { plan },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get coverage plans
// @route   GET /api/coverage-plans
// @access  Private (Owner, Manager)
exports.getCoveragePlans = async (req, res, next) => {
  try {
    const { doctorId, mrId, month, year, status } = req.query;
    const query = {};

    if (doctorId) query.doctorId = doctorId;
    if (mrId) query.mrId = mrId;
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (status) query.status = status;

    if (req.user.role === 'Manager') {
      const managerMrIds = await getManagerMrIds(req.user.id);
      query.mrId = query.mrId
        ? query.mrId
        : { $in: managerMrIds };
    }

    const plans = await CoveragePlan.find(query)
      .populate('doctorId', 'name specialization clinicName city')
      .populate('mrId', 'name email employeeId')
      .sort({ year: -1, month: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: plans.length,
      data: { plans },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update coverage plan
// @route   PUT /api/coverage-plans/:id
// @access  Private (Owner, Manager)
exports.updateCoveragePlan = async (req, res, next) => {
  try {
    const plan = await CoveragePlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Coverage plan not found',
      });
    }

    if (req.user.role === 'Manager') {
      const managerMrIds = await getManagerMrIds(req.user.id);
      const isAllowed = managerMrIds.some((id) => id.toString() === plan.mrId.toString());
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this plan',
        });
      }
    }

    const updates = { ...req.body };
    delete updates.createdBy;

    // Prevent duplicate if changing month/year/doctor/mr
    if (updates.month || updates.year || updates.doctorId || updates.mrId) {
      const month = updates.month || plan.month;
      const year = updates.year || plan.year;
      const doctorId = updates.doctorId || plan.doctorId;
      const mrId = updates.mrId || plan.mrId;

      const exists = await CoveragePlan.findOne({
        _id: { $ne: plan._id },
        doctorId,
        mrId,
        month,
        year,
      });
      if (exists) {
        return res.status(409).json({
          success: false,
          message: 'Coverage plan already exists for this doctor and month',
        });
      }
    }

    const updated = await CoveragePlan.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: { plan: updated },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Coverage summary (planned vs actual)
// @route   GET /api/coverage-plans/summary
// @access  Private (Owner, Manager)
exports.getCoverageSummary = async (req, res, next) => {
  try {
    const { month, year } = parseMonthYear(req.query);
    const { start, end } = getMonthRange(month, year);

    let mrIds = null;
    if (req.user.role === 'Manager') {
      mrIds = await getManagerMrIds(req.user.id);
    }

    const match = {
      month,
      year,
    };
    if (mrIds) {
      match.mrId = { $in: mrIds };
    }
    if (req.query.mrId) {
      match.mrId = req.query.mrId;
    }
    if (req.query.doctorId) {
      match.doctorId = req.query.doctorId;
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'visits',
          let: { doctorId: '$doctorId', mrId: '$mrId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$doctorId', '$$doctorId'] },
                    { $eq: ['$mrId', '$$mrId'] },
                    { $gte: ['$visitDate', start] },
                    { $lte: ['$visitDate', end] },
                    { $ne: ['$status', 'Cancelled'] },
                  ],
                },
              },
            },
          ],
          as: 'visits',
        },
      },
      {
        $addFields: {
          actualVisits: { $size: '$visits' },
        },
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctor',
        },
      },
      { $unwind: '$doctor' },
      {
        $lookup: {
          from: 'users',
          localField: 'mrId',
          foreignField: '_id',
          as: 'mr',
        },
      },
      { $unwind: '$mr' },
      {
        $project: {
          doctorId: 1,
          mrId: 1,
          month: 1,
          year: 1,
          monthlyTarget: 1,
          actualVisits: 1,
          status: 1,
          doctor: {
            _id: '$doctor._id',
            name: '$doctor.name',
            specialization: '$doctor.specialization',
            clinicName: '$doctor.clinicName',
            city: '$doctor.city',
          },
          mr: {
            _id: '$mr._id',
            name: '$mr.name',
            employeeId: '$mr.employeeId',
          },
        },
      },
    ];

    const results = await CoveragePlan.aggregate(pipeline);

    const now = new Date();
    const monthEnd = end;

    const summary = results.map((item) => {
      const compliance = item.monthlyTarget > 0 ? (item.actualVisits / item.monthlyTarget) * 100 : 0;
      const overdue = now > monthEnd && item.actualVisits < item.monthlyTarget;
      const missed = now <= monthEnd && item.actualVisits === 0;
      return {
        ...item,
        compliance: Number(compliance.toFixed(2)),
        overdue,
        missed,
      };
    });

    const totals = summary.reduce(
      (acc, item) => {
        acc.totalPlans += 1;
        acc.totalTarget += item.monthlyTarget;
        acc.totalActual += item.actualVisits;
        if (item.overdue) acc.overdueCount += 1;
        if (item.missed) acc.missedCount += 1;
        return acc;
      },
      { totalPlans: 0, totalTarget: 0, totalActual: 0, overdueCount: 0, missedCount: 0 }
    );

    const overallCompliance = totals.totalTarget
      ? (totals.totalActual / totals.totalTarget) * 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        month,
        year,
        totals: {
          ...totals,
          overallCompliance: Number(overallCompliance.toFixed(2)),
        },
        plans: summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------
// Doctor Coverage Plan (new)
// ----------------------------

const parseMonthString = (monthStr) => {
  // monthStr expected in "YYYY-MM"
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthStr || '');
  if (!match) {
    throw new Error('Month must be in YYYY-MM format');
  }
  const year = Number(match[1]);
  const month = Number(match[2]); // 1-12
  return { year, month };
};

const getMonthRangeFromString = (monthStr) => {
  const { year, month } = parseMonthString(monthStr);
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

const computeDoctorCoverageStats = async ({ doctorId, mrId, month, plannedVisits }) => {
  const { start, end } = getMonthRangeFromString(month);

  const actualVisits = await Visit.countDocuments({
    doctorId,
    mrId,
    visitDate: {
      $gte: start,
      $lte: end,
    },
    status: { $ne: 'Cancelled' },
  });

  let compliancePercentage = 0;
  if (plannedVisits && plannedVisits > 0) {
    compliancePercentage = Number(((actualVisits / plannedVisits) * 100).toFixed(2));
  }

  let status;
  if (compliancePercentage > 80) {
    status = 'ON_TRACK';
  } else if (compliancePercentage >= 50) {
    status = 'AT_RISK';
  } else {
    status = 'MISSED';
  }

  return { actualVisits, compliancePercentage, status };
};

// @desc    Create doctor coverage plan (monthly, per doctor)
// @route   POST /api/doctor-coverage-plans
// @access  Private (Owner, Manager)
exports.createDoctorCoveragePlan = async (req, res, next) => {
  try {
    const { doctorId, month, plannedVisits, assignedMR } = req.body;

    if (!doctorId || !month || plannedVisits === undefined) {
      return res.status(400).json({
        success: false,
        message: 'doctorId, month (YYYY-MM), and plannedVisits are required',
      });
    }

    // Only Owner / Manager should be allowed (enforced via routes' authorize middleware)
    // Additional Manager-level scoping: can only create for their own MRs

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    let mrId = assignedMR || doctor.assignedMR;
    if (!mrId) {
      return res.status(400).json({
        success: false,
        message: 'Assigned MR is required. Assign doctor to an MR or provide assignedMR.',
      });
    }

    if (req.user.role === 'Manager') {
      const managerMrIds = await getManagerMrIds(req.user.id);
      const isAllowed = managerMrIds.some((id) => id.toString() === mrId.toString());
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to create coverage plans for this MR',
        });
      }
    }

    // Validate month format
    try {
      parseMonthString(month);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // Ensure one plan per doctor per month
    const existing = await DoctorCoveragePlan.findOne({
      doctorId,
      month,
      isActive: true,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Coverage plan already exists for this doctor and month',
      });
    }

    const { actualVisits, compliancePercentage, status } = await computeDoctorCoverageStats({
      doctorId,
      mrId,
      month,
      plannedVisits,
    });

    const plan = await DoctorCoveragePlan.create({
      doctorId,
      assignedMR: mrId,
      month,
      plannedVisits,
      actualVisits,
      compliancePercentage,
      status,
      createdBy: req.user.id,
      isActive: true,
    });

    const populated = await DoctorCoveragePlan.findById(plan._id)
      .populate('doctorId', 'name specialization clinicName city')
      .populate('assignedMR', 'name email employeeId');

    res.status(201).json({
      success: true,
      data: { plan: populated },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update planned visits for a doctor coverage plan
// @route   PUT /api/doctor-coverage-plans/:id
// @access  Private (Owner, Manager)
exports.updateDoctorCoveragePlannedVisits = async (req, res, next) => {
  try {
    const { plannedVisits, isActive } = req.body;

    const plan = await DoctorCoveragePlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Doctor coverage plan not found',
      });
    }

    // Manager can only manage their own MRs' plans
    if (req.user.role === 'Manager') {
      const managerMrIds = await getManagerMrIds(req.user.id);
      const isAllowed = managerMrIds.some(
        (id) => id.toString() === plan.assignedMR.toString()
      );
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this coverage plan',
        });
      }
    }

    const newPlannedVisits =
      plannedVisits !== undefined ? Number(plannedVisits) : plan.plannedVisits;

    if (Number.isNaN(newPlannedVisits) || newPlannedVisits < 0) {
      return res.status(400).json({
        success: false,
        message: 'plannedVisits must be a non-negative number',
      });
    }

    const { actualVisits, compliancePercentage, status } = await computeDoctorCoverageStats({
      doctorId: plan.doctorId,
      mrId: plan.assignedMR,
      month: plan.month,
      plannedVisits: newPlannedVisits,
    });

    plan.plannedVisits = newPlannedVisits;
    plan.actualVisits = actualVisits;
    plan.compliancePercentage = compliancePercentage;
    plan.status = status;
    if (isActive !== undefined) {
      plan.isActive = !!isActive;
    }

    await plan.save();

    const populated = await DoctorCoveragePlan.findById(plan._id)
      .populate('doctorId', 'name specialization clinicName city')
      .populate('assignedMR', 'name email employeeId');

    res.status(200).json({
      success: true,
      data: { plan: populated },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Doctor coverage summary (MR-wise / Doctor-wise / Month-wise)
// @route   GET /api/doctor-coverage-plans/summary
// @access  Private (Owner, Manager)
exports.getDoctorCoverageSummary = async (req, res, next) => {
  try {
    const { groupBy = 'mr', month, doctorId, mrId } = req.query;

    const match = {
      isActive: true,
    };

    if (month) {
      match.month = month;
    }
    if (doctorId) {
      match.doctorId = doctorId;
    }
    // MRs can only see their own coverage
    if (req.user.role === 'MR') {
      // Ensure proper ObjectId matching
      match.assignedMR = mongoose.Types.ObjectId.isValid(req.user.id)
        ? new mongoose.Types.ObjectId(req.user.id)
        : req.user.id;
    } else if (mrId) {
      // For Owner/Manager, use provided mrId
      match.assignedMR = mongoose.Types.ObjectId.isValid(mrId)
        ? new mongoose.Types.ObjectId(mrId)
        : mrId;
    }
    // Managers only see their own MRs
    if (req.user.role === 'Manager') {
      const managerMrIds = await getManagerMrIds(req.user.id);
      match.assignedMR = match.assignedMR
        ? match.assignedMR
        : { $in: managerMrIds };
    }

    let groupStage;
    if (groupBy === 'doctor') {
      groupStage = {
        _id: '$doctorId',
        totalPlanned: { $sum: '$plannedVisits' },
        totalActual: { $sum: '$actualVisits' },
        avgCompliance: { $avg: '$compliancePercentage' },
        planCount: { $sum: 1 },
      };
    } else if (groupBy === 'month') {
      groupStage = {
        _id: '$month',
        totalPlanned: { $sum: '$plannedVisits' },
        totalActual: { $sum: '$actualVisits' },
        avgCompliance: { $avg: '$compliancePercentage' },
        planCount: { $sum: 1 },
      };
    } else {
      // Default: groupBy MR
      groupStage = {
        _id: '$assignedMR',
        totalPlanned: { $sum: '$plannedVisits' },
        totalActual: { $sum: '$actualVisits' },
        avgCompliance: { $avg: '$compliancePercentage' },
        planCount: { $sum: 1 },
      };
    }

    const pipeline = [
      { $match: match },
      { $group: groupStage },
    ];

    if (groupBy === 'doctor') {
      pipeline.push(
        {
          $lookup: {
            from: 'doctors',
            localField: '_id',
            foreignField: '_id',
            as: 'doctor',
          },
        },
        { $unwind: '$doctor' },
        {
          $addFields: {
            calculatedCompliance: {
              $cond: {
                if: { $gt: ['$totalPlanned', 0] },
                then: {
                  $multiply: [
                    { $divide: ['$totalActual', '$totalPlanned'] },
                    100,
                  ],
                },
                else: 0,
              },
            },
          },
        },
        {
          $addFields: {
            status: {
              $cond: {
                if: { $gt: ['$calculatedCompliance', 80] },
                then: 'ON_TRACK',
                else: {
                  $cond: {
                    if: { $gte: ['$calculatedCompliance', 50] },
                    then: 'AT_RISK',
                    else: 'MISSED',
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            doctor: {
              _id: '$doctor._id',
              name: '$doctor.name',
              specialization: '$doctor.specialization',
              clinicName: '$doctor.clinicName',
              city: '$doctor.city',
            },
            totalPlanned: 1,
            totalActual: 1,
            avgCompliance: { $round: ['$avgCompliance', 2] },
            compliance: { $round: ['$calculatedCompliance', 2] },
            status: 1,
            planCount: 1,
          },
        }
      );
    } else if (groupBy === 'month') {
      pipeline.push({
        $project: {
          _id: 0,
          month: '$_id',
          totalPlanned: 1,
          totalActual: 1,
          avgCompliance: { $round: ['$avgCompliance', 2] },
          planCount: 1,
        },
      });
    } else {
      // groupBy MR
      pipeline.push(
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'mr',
          },
        },
        { $unwind: '$mr' },
        {
          $project: {
            _id: 0,
            mr: {
              _id: '$mr._id',
              name: '$mr.name',
              employeeId: '$mr.employeeId',
            },
            totalPlanned: 1,
            totalActual: 1,
            avgCompliance: { $round: ['$avgCompliance', 2] },
            planCount: 1,
          },
        }
      );
    }

    // Debug logging (remove in production)
    if (req.user.role === 'MR') {
      // Also check if plans exist without aggregation
      const directQuery = {
        isActive: true,
        assignedMR: match.assignedMR,
      };
      if (month) {
        directQuery.month = month;
      }
      const directCount = await DoctorCoveragePlan.countDocuments(directQuery);
      
      console.log('[Coverage API] MR Query Debug:', {
        mrId: req.user.id,
        mrIdType: typeof req.user.id,
        month,
        match: JSON.stringify(match),
        directQueryCount: directCount,
      });
    }

    const results = await DoctorCoveragePlan.aggregate(pipeline);

    // Debug logging
    if (req.user.role === 'MR') {
      console.log('[Coverage API] Aggregation results count:', results.length);
    }

    res.status(200).json({
      success: true,
      data: {
        groupBy,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get individual doctor coverage plans (for table view)
// @route   GET /api/coverage/plans
// @access  Private (Owner, Manager)
exports.getDoctorCoveragePlans = async (req, res, next) => {
  try {
    const { month, doctorId, mrId, status } = req.query;
    const query = {
      isActive: true,
    };

    if (month) {
      query.month = month;
    }
    if (doctorId) {
      query.doctorId = doctorId;
    }
    if (mrId) {
      query.assignedMR = mrId;
    }
    if (status) {
      query.status = status;
    }

    // MRs can only see their own coverage
    if (req.user.role === 'MR') {
      query.assignedMR = req.user.id;
    }
    // Managers only see their own MRs
    else if (req.user.role === 'Manager') {
      const managerMrIds = await getManagerMrIds(req.user.id);
      query.assignedMR = query.assignedMR
        ? query.assignedMR
        : { $in: managerMrIds };
    }

    const plans = await DoctorCoveragePlan.find(query)
      .populate('doctorId', 'name specialization clinicName city')
      .populate('assignedMR', 'name email employeeId')
      .sort({ month: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: plans.length,
      data: { plans },
    });
  } catch (error) {
    next(error);
  }
};

