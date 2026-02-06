const Scheme = require('../models/Scheme');
const Stockist = require('../models/Stockist');

// @desc    Get schemes (filter by stockistId)
// @route   GET /api/schemes?stockistId=
// @access  Private (Owner, Manager, MR)
exports.getSchemes = async (req, res, next) => {
  try {
    const { stockistId, isActive, schemeType } = req.query;
    const query = {};

    if (stockistId) query.stockistId = stockistId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (schemeType) query.schemeType = schemeType;

    const schemes = await Scheme.find(query)
      .populate('stockistId', 'name city area')
      .populate('createdBy', 'name email')
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: schemes.length,
      data: {
        schemes,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single scheme
// @route   GET /api/schemes/:id
// @access  Private (Owner, Manager, MR)
exports.getScheme = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.id)
      .populate('stockistId', 'name city area contactPerson phone')
      .populate('createdBy', 'name email');

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        scheme,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create scheme (MR can add; Admin can edit later)
// @route   POST /api/schemes
// @access  Private (Owner, Manager, MR)
exports.createScheme = async (req, res, next) => {
  try {
    const { stockistId, schemeType, description, startDate, endDate } = req.body;

    if (!stockistId || !schemeType || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'stockistId, schemeType and startDate are required',
      });
    }

    const stockist = await Stockist.findById(stockistId);
    if (!stockist || !stockist.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Stockist not found or inactive',
      });
    }

    const scheme = await Scheme.create({
      stockistId,
      schemeType,
      description: description ? description.trim() : undefined,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      isActive: true,
      createdBy: req.user.id,
    });

    const populated = await Scheme.findById(scheme._id)
      .populate('stockistId', 'name city area')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: {
        scheme: populated,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update scheme (Owner, Manager only)
// @route   PUT /api/schemes/:id
// @access  Private (Owner, Manager only)
exports.updateScheme = async (req, res, next) => {
  try {
    let scheme = await Scheme.findById(req.params.id);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found',
      });
    }

    const { schemeType, description, startDate, endDate } = req.body;

    if (schemeType !== undefined) scheme.schemeType = schemeType;
    if (description !== undefined) scheme.description = description ? description.trim() : undefined;
    if (startDate !== undefined) scheme.startDate = new Date(startDate);
    if (endDate !== undefined) scheme.endDate = endDate ? new Date(endDate) : undefined;

    await scheme.save();

    const populated = await Scheme.findById(scheme._id)
      .populate('stockistId', 'name city area')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      data: {
        scheme: populated,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate scheme (soft; history preserved)
// @route   PATCH /api/schemes/:id/deactivate
// @access  Private (Owner, Manager only)
exports.deactivateScheme = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.id);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found',
      });
    }

    scheme.isActive = false;
    await scheme.save();

    res.status(200).json({
      success: true,
      data: { scheme },
      message: 'Scheme deactivated',
    });
  } catch (error) {
    next(error);
  }
};
