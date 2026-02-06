const Visit = require('../models/Visit');
const Doctor = require('../models/Doctor');
const Product = require('../models/Product');
const User = require('../models/User');
const BeatPlan = require('../models/beatPlan.model');
const LocationLog = require('../models/LocationLog');

// @desc    Daily MR Performance Report
// @route   GET /api/reports/mr-performance
// @access  Private (Owner, Manager)
exports.getMRPerformance = async (req, res, next) => {
  try {
    const { mrId, startDate, endDate, groupBy = 'day' } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.visitDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.visitDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.visitDate.$lte = end;
      }
    }

    // Filter by MR if Manager (only their MRs)
    if (req.user.role === 'Manager') {
      const mrs = await User.find({ managerId: req.user.id, role: 'MR' }).select('_id');
      const mrIds = mrs.map((mr) => mr._id);
      dateFilter.mrId = { $in: mrIds };
    } else if (mrId) {
      dateFilter.mrId = mrId;
    }

    // Only completed visits where doctor was met (exclude attempted-but-not-met)
    dateFilter.status = 'Completed';
    dateFilter.$or = [
      { visitOutcome: 'MET_DOCTOR' },
      { visitOutcome: { $exists: false } },
      { visitOutcome: null },
    ];

    // Group by day, week, or month
    let groupFormat;
    switch (groupBy) {
      case 'week':
        groupFormat = {
          year: { $year: '$visitDate' },
          week: { $week: '$visitDate' },
        };
        break;
      case 'month':
        groupFormat = {
          year: { $year: '$visitDate' },
          month: { $month: '$visitDate' },
        };
        break;
      default: // 'day'
        groupFormat = {
          year: { $year: '$visitDate' },
          month: { $month: '$visitDate' },
          day: { $dayOfMonth: '$visitDate' },
        };
    }

    const pipeline = [
      // Match visits
      { $match: dateFilter },

      // Group by MR and date period
      {
        $group: {
          _id: {
            mrId: '$mrId',
            ...groupFormat,
          },
          totalVisits: { $sum: 1 },
          uniqueDoctors: { $addToSet: '$doctorId' },
          productsPromoted: {
            $push: {
              $cond: [
                { $gt: [{ $size: '$productsDiscussed' }, 0] },
                '$productsDiscussed.productId',
                [],
              ],
            },
          },
        },
      },

      // Flatten products array
      {
        $project: {
          _id: 1,
          totalVisits: 1,
          uniqueDoctors: { $size: '$uniqueDoctors' },
          productsPromoted: {
            $size: {
              $setUnion: {
                $reduce: {
                  input: '$productsPromoted',
                  initialValue: [],
                  in: { $setUnion: ['$$value', '$$this'] },
                },
              },
            },
          },
        },
      },

      // Lookup MR details
      {
        $lookup: {
          from: 'users',
          localField: '_id.mrId',
          foreignField: '_id',
          as: 'mrDetails',
        },
      },

      // Unwind MR details
      {
        $unwind: {
          path: '$mrDetails',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Format output
      {
        $project: {
          _id: 0,
          mrId: '$_id.mrId',
          mrName: '$mrDetails.name',
          mrEmployeeId: '$mrDetails.employeeId',
          period: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day',
            week: '$_id.week',
          },
          metrics: {
            totalVisits: '$totalVisits',
            doctorsCovered: '$uniqueDoctors',
            productsPromoted: '$productsPromoted',
          },
        },
      },

      // Sort by date and MR
      {
        $sort: {
          'period.year': -1,
          'period.month': -1,
          'period.day': -1,
          'period.week': -1,
          mrName: 1,
        },
      },
    ];

    const results = await Visit.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: results.length,
      data: {
        reports: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Doctor Analytics Report
// @route   GET /api/reports/doctor-analytics
// @access  Private (Owner, Manager)
exports.getDoctorAnalytics = async (req, res, next) => {
  try {
    const { doctorId, startDate, endDate, limit = 100 } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.visitDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.visitDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.visitDate.$lte = end;
      }
    }

    // Filter by MR if Manager
    if (req.user.role === 'Manager') {
      const mrs = await User.find({ managerId: req.user.id, role: 'MR' }).select('_id');
      const mrIds = mrs.map((mr) => mr._id);
      dateFilter.mrId = { $in: mrIds };
    }

    // Filter by specific doctor
    if (doctorId) {
      dateFilter.doctorId = doctorId;
    }

    // Only completed visits where doctor was met
    dateFilter.status = 'Completed';
    dateFilter.$or = [
      { visitOutcome: 'MET_DOCTOR' },
      { visitOutcome: { $exists: false } },
      { visitOutcome: null },
    ];

    const pipeline = [
      // Match visits
      { $match: dateFilter },

      // Group by doctor
      {
        $group: {
          _id: '$doctorId',
          visitFrequency: { $sum: 1 },
          lastVisitDate: { $max: '$visitDate' },
          firstVisitDate: { $min: '$visitDate' },
          productsDiscussed: {
            $push: {
              $cond: [
                { $gt: [{ $size: '$productsDiscussed' }, 0] },
                '$productsDiscussed.productId',
                [],
              ],
            },
          },
          totalOrders: {
            $sum: {
              $cond: [
                { $gt: [{ $size: '$orders' }, 0] },
                { $size: '$orders' },
                0,
              ],
            },
          },
          orderValue: {
            $sum: {
              $reduce: {
                input: '$orders',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $multiply: ['$$this.quantity', { $ifNull: ['$$this.unitPrice', 0] }] },
                  ],
                },
              },
            },
          },
        },
      },

      // Flatten and count unique products
      {
        $project: {
          _id: 1,
          visitFrequency: 1,
          lastVisitDate: 1,
          firstVisitDate: 1,
          uniqueProductsDiscussed: {
            $size: {
              $setUnion: {
                $reduce: {
                  input: '$productsDiscussed',
                  initialValue: [],
                  in: { $setUnion: ['$$value', '$$this'] },
                },
              },
            },
          },
          totalOrders: 1,
          orderValue: 1,
        },
      },

      // Lookup doctor details
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctorDetails',
        },
      },

      // Unwind doctor details
      {
        $unwind: {
          path: '$doctorDetails',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Format output
      {
        $project: {
          _id: 0,
          doctorId: '$_id',
          doctorName: '$doctorDetails.name',
          specialization: '$doctorDetails.specialization',
          clinicName: '$doctorDetails.clinicName',
          city: '$doctorDetails.city',
          state: '$doctorDetails.state',
          category: '$doctorDetails.category',
          analytics: {
            visitFrequency: '$visitFrequency',
            uniqueProductsDiscussed: '$uniqueProductsDiscussed',
            lastVisitDate: '$lastVisitDate',
            firstVisitDate: '$firstVisitDate',
            totalOrders: '$totalOrders',
            orderValue: '$orderValue',
            averageOrderValue: {
              $cond: [
                { $gt: ['$totalOrders', 0] },
                { $divide: ['$orderValue', '$totalOrders'] },
                0,
              ],
            },
          },
        },
      },

      // Sort by visit frequency
      {
        $sort: {
          'analytics.visitFrequency': -1,
        },
      },

      // Limit results
      {
        $limit: parseInt(limit),
      },
    ];

    const results = await Visit.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: results.length,
      data: {
        reports: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Product Push vs Sales Report
// @route   GET /api/reports/product-push-sales
// @access  Private (Owner, Manager)
exports.getProductPushSales = async (req, res, next) => {
  try {
    const { productId, startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.visitDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.visitDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.visitDate.$lte = end;
      }
    }

    // Filter by MR if Manager
    if (req.user.role === 'Manager') {
      const mrs = await User.find({ managerId: req.user.id, role: 'MR' }).select('_id');
      const mrIds = mrs.map((mr) => mr._id);
      dateFilter.mrId = { $in: mrIds };
    }

    // Filter by product
    if (productId) {
      dateFilter.$or = [
        { 'productsDiscussed.productId': productId },
        { 'orders.productId': productId },
      ];
    }

    // Only completed visits where doctor was met
    dateFilter.status = 'Completed';
    dateFilter.$or = [
      { visitOutcome: 'MET_DOCTOR' },
      { visitOutcome: { $exists: false } },
      { visitOutcome: null },
    ];

    const pipeline = [
      // Match visits
      { $match: dateFilter },

      // Unwind products discussed
      {
        $unwind: {
          path: '$productsDiscussed',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Unwind orders
      {
        $unwind: {
          path: '$orders',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Group by product
      {
        $group: {
          _id: {
            $cond: [
              { $ne: ['$productsDiscussed.productId', null] },
              '$productsDiscussed.productId',
              '$orders.productId',
            ],
          },
          pushVisits: {
            $sum: {
              $cond: [
                { $ne: ['$productsDiscussed.productId', null] },
                1,
                0,
              ],
            },
          },
          uniqueDoctorsPushed: {
            $addToSet: {
              $cond: [
                { $ne: ['$productsDiscussed.productId', null] },
                '$doctorId',
                null,
              ],
            },
          },
          salesVisits: {
            $sum: {
              $cond: [
                { $ne: ['$orders.productId', null] },
                1,
                0,
              ],
            },
          },
          totalQuantitySold: {
            $sum: {
              $cond: [
                { $ne: ['$orders.productId', null] },
                '$orders.quantity',
                0,
              ],
            },
          },
          totalSalesValue: {
            $sum: {
              $cond: [
                { $ne: ['$orders.productId', null] },
                {
                  $multiply: [
                    '$orders.quantity',
                    { $ifNull: ['$orders.unitPrice', 0] },
                  ],
                },
                0,
              ],
            },
          },
          uniqueDoctorsSold: {
            $addToSet: {
              $cond: [
                { $ne: ['$orders.productId', null] },
                '$doctorId',
                null,
              ],
            },
          },
        },
      },

      // Filter out null products
      {
        $match: {
          _id: { $ne: null },
        },
      },

      // Calculate unique doctors
      {
        $project: {
          _id: 1,
          pushVisits: 1,
          uniqueDoctorsPushed: {
            $size: {
              $filter: {
                input: '$uniqueDoctorsPushed',
                as: 'doctor',
                cond: { $ne: ['$$doctor', null] },
              },
            },
          },
          salesVisits: 1,
          totalQuantitySold: 1,
          totalSalesValue: 1,
          uniqueDoctorsSold: {
            $size: {
              $filter: {
                input: '$uniqueDoctorsSold',
                as: 'doctor',
                cond: { $ne: ['$$doctor', null] },
              },
            },
          },
        },
      },

      // Lookup product details
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails',
        },
      },

      // Unwind product details
      {
        $unwind: {
          path: '$productDetails',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Calculate conversion metrics
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: '$productDetails.name',
          productCode: '$productDetails.code',
          category: '$productDetails.category',
          mrp: '$productDetails.mrp',
          pushMetrics: {
            visits: '$pushVisits',
            uniqueDoctors: '$uniqueDoctorsPushed',
          },
          salesMetrics: {
            visits: '$salesVisits',
            uniqueDoctors: '$uniqueDoctorsSold',
            totalQuantity: '$totalQuantitySold',
            totalValue: '$totalSalesValue',
            averageOrderValue: {
              $cond: [
                { $gt: ['$salesVisits', 0] },
                { $divide: ['$totalSalesValue', '$salesVisits'] },
                0,
              ],
            },
          },
          conversionRate: {
            $cond: [
              { $gt: ['$pushVisits', 0] },
              {
                $multiply: [
                  { $divide: ['$salesVisits', '$pushVisits'] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },

      // Sort by total sales value
      {
        $sort: {
          'salesMetrics.totalValue': -1,
        },
      },
    ];

    const results = await Visit.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: results.length,
      data: {
        reports: results,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    MR Leaderboard
// @route   GET /api/reports/mr-leaderboard
// @access  Private (Owner, Manager)
exports.getMRLeaderboard = async (req, res, next) => {
  try {
    const { startDate, endDate, sortBy = 'visits' } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.visitDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.visitDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.visitDate.$lte = end;
      }
    }

    // Filter by MR if Manager
    if (req.user.role === 'Manager') {
      const mrs = await User.find({ managerId: req.user.id, role: 'MR' }).select('_id');
      const mrIds = mrs.map((mr) => mr._id);
      dateFilter.mrId = { $in: mrIds };
    }

    // Only completed visits where doctor was met
    dateFilter.status = 'Completed';
    dateFilter.$or = [
      { visitOutcome: 'MET_DOCTOR' },
      { visitOutcome: { $exists: false } },
      { visitOutcome: null },
    ];

    // Determine sort field
    let sortField;
    switch (sortBy) {
      case 'coverage':
        sortField = 'uniqueDoctors';
        break;
      case 'sales':
        sortField = 'totalSalesValue';
        break;
      default:
        sortField = 'totalVisits';
    }

    const pipeline = [
      // Match visits
      { $match: dateFilter },

      // Group by MR
      {
        $group: {
          _id: '$mrId',
          totalVisits: { $sum: 1 },
          uniqueDoctors: { $addToSet: '$doctorId' },
          totalOrders: {
            $sum: {
              $cond: [
                { $gt: [{ $size: '$orders' }, 0] },
                { $size: '$orders' },
                0,
              ],
            },
          },
          totalSalesValue: {
            $sum: {
              $reduce: {
                input: '$orders',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    { $multiply: ['$$this.quantity', { $ifNull: ['$$this.unitPrice', 0] }] },
                  ],
                },
              },
            },
          },
        },
      },

      // Calculate unique doctors count
      {
        $project: {
          _id: 1,
          totalVisits: 1,
          uniqueDoctors: { $size: '$uniqueDoctors' },
          totalOrders: 1,
          totalSalesValue: 1,
        },
      },

      // Lookup MR details
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'mrDetails',
        },
      },

      // Unwind MR details
      {
        $unwind: {
          path: '$mrDetails',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Format output
      {
        $project: {
          _id: 0,
          mrId: '$_id',
          mrName: '$mrDetails.name',
          mrEmployeeId: '$mrDetails.employeeId',
          territory: '$mrDetails.territory',
          metrics: {
            totalVisits: '$totalVisits',
            uniqueDoctors: '$uniqueDoctors',
            totalOrders: '$totalOrders',
            totalSalesValue: '$totalSalesValue',
            averageOrderValue: {
              $cond: [
                { $gt: ['$totalOrders', 0] },
                { $divide: ['$totalSalesValue', '$totalOrders'] },
                0,
              ],
            },
            visitsPerDoctor: {
              $cond: [
                { $gt: ['$uniqueDoctors', 0] },
                { $divide: ['$totalVisits', '$uniqueDoctors'] },
                0,
              ],
            },
          },
        },
      },

      // Sort by selected metric
      {
        $sort: {
          [`metrics.${sortField}`]: -1,
        },
      },
    ];

    const results = await Visit.aggregate(pipeline);

    // Add rank in JavaScript for better compatibility
    const leaderboard = results.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    res.status(200).json({
      success: true,
      count: leaderboard.length,
      data: {
        leaderboard,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Today's Field Activity (per-MR: active, beat, planned vs visited, deviation)
// @route   GET /api/reports/todays-field-activity
// @access  Private (Owner, Manager)
const getDayRange = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

exports.getTodaysFieldActivity = async (req, res, next) => {
  try {
    const today = new Date();
    const { start, end } = getDayRange(today);

    let mrsList;
    if (req.user.role === 'Manager') {
      mrsList = await User.find({ managerId: req.user.id, role: 'MR', isActive: true }).select('_id name employeeId');
    } else {
      mrsList = await User.find({ role: 'MR', isActive: true }).select('_id name employeeId');
    }
    const mrIds = mrsList.map((m) => m._id);
    const mrMap = {};
    mrsList.forEach((m) => {
      mrMap[m._id.toString()] = { name: m.name, employeeId: m.employeeId };
    });

    const [beatPlans, visitsToday, locationLogsToday] = await Promise.all([
      BeatPlan.find({
        mrId: { $in: mrIds },
        date: { $gte: start, $lte: end },
      }).populate('plannedDoctors', 'name'),
      Visit.find({
        mrId: { $in: mrIds },
        visitDate: { $gte: start, $lte: end },
        status: { $ne: 'Cancelled' },
      }).select('mrId doctorId visitOutcome notMetReason'),
      LocationLog.find({
        mrId: { $in: mrIds },
        createdAt: { $gte: start, $lte: end },
      }).select('mrId'),
    ]);

    const beatByMr = {};
    beatPlans.forEach((p) => {
      const id = p.mrId.toString();
      beatByMr[id] = p;
    });

    const visitsByMr = {};
    const metVisitsByMr = {};
    const notMetVisitsByMr = {};
    const doctorIdsVisitedByMr = {};
    const metDoctorIdsByMr = {};
    const notMetReasonsByMr = {}; // { mrId: { reason: count } }
    visitsToday.forEach((v) => {
      const id = v.mrId.toString();
      visitsByMr[id] = (visitsByMr[id] || 0) + 1;
      if (!doctorIdsVisitedByMr[id]) doctorIdsVisitedByMr[id] = new Set();
      doctorIdsVisitedByMr[id].add(v.doctorId.toString());

      const met = v.visitOutcome === 'MET_DOCTOR' || !v.visitOutcome;
      if (met) {
        metVisitsByMr[id] = (metVisitsByMr[id] || 0) + 1;
        if (!metDoctorIdsByMr[id]) metDoctorIdsByMr[id] = new Set();
        metDoctorIdsByMr[id].add(v.doctorId.toString());
      } else {
        notMetVisitsByMr[id] = (notMetVisitsByMr[id] || 0) + 1;
        const reason = v.notMetReason || 'OTHER';
        if (!notMetReasonsByMr[id]) notMetReasonsByMr[id] = {};
        notMetReasonsByMr[id][reason] = (notMetReasonsByMr[id][reason] || 0) + 1;
      }
    });

    const hasLocationTodayByMr = {};
    locationLogsToday.forEach((l) => {
      hasLocationTodayByMr[l.mrId.toString()] = true;
    });

    const activity = mrIds.map((mrId) => {
      const id = mrId.toString();
      const plan = beatByMr[id];
      const plannedCount = plan ? (plan.plannedDoctors && plan.plannedDoctors.length) || 0 : 0;
      const visitedSet = doctorIdsVisitedByMr[id] || new Set();
      const metSet = metDoctorIdsByMr[id] || new Set();
      const visitedCount = visitedSet.size;
      const metCount = metVisitsByMr[id] || 0;
      const notMetCount = notMetVisitsByMr[id] || 0;
      const plannedDoctorIds = plan && plan.plannedDoctors ? plan.plannedDoctors.map((d) => d._id.toString()) : [];
      const visitedAsPlanned = plannedDoctorIds.filter((did) => metSet.has(did)).length; // beat % = met only
      const plannedButNotVisited = plannedDoctorIds.filter((did) => !visitedSet.has(did));
      const beatCompletion = plannedCount > 0 ? Math.round((visitedAsPlanned / plannedCount) * 100) : 0;
      const hasVisitToday = (visitsByMr[id] || 0) > 0;
      const hasLocationToday = !!hasLocationTodayByMr[id];
      const active = hasVisitToday || hasLocationToday;

      const reasonCounts = notMetReasonsByMr[id] || {};
      const commonReason =
        Object.keys(reasonCounts).length > 0
          ? Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0][0]
          : null;

      const mr = mrMap[id] || {};

      return {
        mrId: id,
        mrName: mr.name || '–',
        employeeId: mr.employeeId || '–',
        active,
        beatAssigned: !!plan,
        doctorsPlanned: plannedCount,
        doctorsVisited: visitedCount,
        metCount,
        notMetCount,
        beatCompletion,
        commonNotMetReason: commonReason,
        deviation: plannedButNotVisited.length,
        deviationDoctorNames: plan && plan.plannedDoctors
          ? plan.plannedDoctors
              .filter((d) => plannedButNotVisited.includes(d._id.toString()))
              .map((d) => d.name)
          : [],
      };
    });

    res.status(200).json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        activity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Today's Visit Summary (totals + reasons for admin dashboard)
// @route   GET /api/reports/todays-visit-summary
// @access  Private (Owner, Manager)
exports.getTodaysVisitSummary = async (req, res, next) => {
  try {
    const today = new Date();
    const { start, end } = getDayRange(today);

    let mrIds;
    if (req.user.role === 'Manager') {
      const mrs = await User.find({ managerId: req.user.id, role: 'MR', isActive: true }).select('_id');
      mrIds = mrs.map((m) => m._id);
    } else {
      const mrs = await User.find({ role: 'MR', isActive: true }).select('_id');
      mrIds = mrs.map((m) => m._id);
    }

    const [beatPlans, visitsToday] = await Promise.all([
      BeatPlan.find({
        mrId: { $in: mrIds },
        date: { $gte: start, $lte: end },
      }).select('plannedDoctors'),
      Visit.find({
        mrId: { $in: mrIds },
        visitDate: { $gte: start, $lte: end },
        status: { $ne: 'Cancelled' },
      }).select('visitOutcome notMetReason'),
    ]);

    let totalPlanned = 0;
    beatPlans.forEach((p) => {
      totalPlanned += (p.plannedDoctors && p.plannedDoctors.length) || 0;
    });

    let visitsMet = 0;
    let visitsNotMet = 0;
    const reasonsSummary = {};
    visitsToday.forEach((v) => {
      const met = v.visitOutcome === 'MET_DOCTOR' || !v.visitOutcome;
      if (met) visitsMet += 1;
      else {
        visitsNotMet += 1;
        const reason = v.notMetReason || 'OTHER';
        reasonsSummary[reason] = (reasonsSummary[reason] || 0) + 1;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        totalPlanned,
        visitsMet,
        visitsNotMet,
        reasonsSummary,
      },
    });
  } catch (error) {
    next(error);
  }
};
