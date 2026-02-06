const LocationLog = require('../models/LocationLog');
const { validateLocation } = require('../utils/validators');

// @desc    Get all location logs
// @route   GET /api/location-logs
// @access  Private
exports.getLocationLogs = async (req, res, next) => {
  try {
    const { mrId, startDate, endDate } = req.query;
    const query = {};

    // MRs can only see their own location logs
    if (req.user.role === 'MR') {
      query.mrId = req.user.id;
    } else if (mrId) {
      query.mrId = mrId;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Managers can see location logs of their MRs
    if (req.user.role === 'Manager' && !mrId) {
      const User = require('../models/User');
      const mrs = await User.find({ managerId: req.user.id }).select('_id');
      const mrIds = mrs.map((mr) => mr._id);
      query.mrId = { $in: mrIds };
    }

    const locationLogs = await LocationLog.find(query)
      .populate('mrId', 'name email phone employeeId')
      .sort({ timestamp: -1 })
      .limit(parseInt(req.query.limit) || 1000); // Limit to prevent huge responses

    res.status(200).json({
      success: true,
      count: locationLogs.length,
      data: {
        locationLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single location log
// @route   GET /api/location-logs/:id
// @access  Private
exports.getLocationLog = async (req, res, next) => {
  try {
    const locationLog = await LocationLog.findById(req.params.id).populate('mrId', 'name email phone employeeId');

    if (!locationLog) {
      return res.status(404).json({
        success: false,
        message: 'Location log not found',
      });
    }

    // MRs can only see their own location logs
    if (req.user.role === 'MR' && locationLog.mrId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this location log',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        locationLog,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create location log
// @route   POST /api/location-logs
// @access  Private
exports.createLocationLog = async (req, res, next) => {
  try {
    // BUSINESS RULE: Always assign MR from JWT token - never trust client
    const mrId = req.user.id;
    
    // Only Owner and Manager can create location logs for other MRs
    if (req.user.role === 'MR') {
      // MRs can only create location logs for themselves
      if (req.body.mrId && req.body.mrId !== mrId) {
        return res.status(403).json({
          success: false,
          message: 'You can only create location logs for yourself',
        });
      }
    }

    // Remove mrId from body to prevent client manipulation
    delete req.body.mrId;
    req.body.mrId = mrId;

    // BUSINESS RULE: Validate location coordinates (India range)
    if (!req.body.location) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required',
      });
    }

    const locationValidation = validateLocation(req.body.location);
    if (!locationValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: locationValidation.errors.join(', '),
      });
    }

    const locationLog = await LocationLog.create(req.body);

    const populatedLog = await LocationLog.findById(locationLog._id).populate('mrId', 'name email phone employeeId');

    res.status(201).json({
      success: true,
      data: {
        locationLog: populatedLog,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current location of MR
// @route   GET /api/location-logs/current/:mrId
// @access  Private
exports.getCurrentLocation = async (req, res, next) => {
  try {
    const mrId = req.params.mrId || req.user.id;

    // MRs can only see their own current location
    if (req.user.role === 'MR' && mrId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this location',
      });
    }

    const locationLog = await LocationLog.findOne({ mrId })
      .populate('mrId', 'name email phone employeeId territory')
      .sort({ timestamp: -1 });

    if (!locationLog) {
      return res.status(404).json({
        success: false,
        message: 'No location data found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        locationLog,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all current MR locations (for tracking map)
// @route   GET /api/location-logs/current-all
// @access  Private (Owner, Manager)
exports.getAllCurrentLocations = async (req, res, next) => {
  try {
    // Only Owner can view individual MR live locations; Manager sees aggregated data on Dashboard only
    if (req.user.role !== 'Owner') {
      return res.status(403).json({
        success: false,
        message: 'Only Owner can access MR live location view',
      });
    }

    const User = require('../models/User');
    const mrs = await User.find({ role: 'MR', isActive: true }).select('_id');
    const mrIds = mrs.map((mr) => mr._id);

    if (mrIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: {
          locations: [],
        },
      });
    }

    // Get latest location for each MR using aggregation
    const locations = await LocationLog.aggregate([
      {
        $match: {
          mrId: { $in: mrIds },
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: '$mrId',
          locationLog: { $first: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'locationLog.mrId',
          foreignField: '_id',
          as: 'mrDetails',
        },
      },
      {
        $unwind: {
          path: '$mrDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          mrId: '$locationLog.mrId',
          location: '$locationLog.location',
          address: '$locationLog.address',
          city: '$locationLog.city',
          state: '$locationLog.state',
          pincode: '$locationLog.pincode',
          accuracy: '$locationLog.accuracy',
          timestamp: '$locationLog.timestamp',
          createdAt: '$locationLog.createdAt',
          mr: {
            _id: '$mrDetails._id',
            name: '$mrDetails.name',
            email: '$mrDetails.email',
            phone: '$mrDetails.phone',
            employeeId: '$mrDetails.employeeId',
            territory: '$mrDetails.territory',
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: locations.length,
      data: {
        locations,
      },
    });
  } catch (error) {
    next(error);
  }
};
