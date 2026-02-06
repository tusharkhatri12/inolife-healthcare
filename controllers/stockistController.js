const Stockist = require('../models/Stockist');

// @desc    Get all stockists
// @route   GET /api/stockists
// @access  Private (Owner, Manager, MR)
exports.getStockists = async (req, res, next) => {
  try {
    const { city, area, isActive } = req.query;
    const query = {};

    if (city) query.city = new RegExp(city, 'i');
    if (area) query.area = new RegExp(area, 'i');
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const stockists = await Stockist.find(query)
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: stockists.length,
      data: {
        stockists,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single stockist
// @route   GET /api/stockists/:id
// @access  Private (Owner, Manager, MR)
exports.getStockist = async (req, res, next) => {
  try {
    const stockist = await Stockist.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!stockist) {
      return res.status(404).json({
        success: false,
        message: 'Stockist not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        stockist,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create stockist
// @route   POST /api/stockists
// @access  Private (Owner, Manager only)
exports.createStockist = async (req, res, next) => {
  try {
    const { name, area, city, contactPerson, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Stockist name is required',
      });
    }

    const stockist = await Stockist.create({
      name: name.trim(),
      area: area ? area.trim() : undefined,
      city: city ? city.trim() : undefined,
      contactPerson: contactPerson ? contactPerson.trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      isActive: true,
      createdBy: req.user.id,
    });

    const populated = await Stockist.findById(stockist._id).populate(
      'createdBy',
      'name email'
    );

    res.status(201).json({
      success: true,
      data: {
        stockist: populated,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update stockist
// @route   PUT /api/stockists/:id
// @access  Private (Owner, Manager only)
exports.updateStockist = async (req, res, next) => {
  try {
    let stockist = await Stockist.findById(req.params.id);

    if (!stockist) {
      return res.status(404).json({
        success: false,
        message: 'Stockist not found',
      });
    }

    const { name, area, city, contactPerson, phone } = req.body;

    if (name !== undefined) stockist.name = name.trim();
    if (area !== undefined) stockist.area = area ? area.trim() : undefined;
    if (city !== undefined) stockist.city = city ? city.trim() : undefined;
    if (contactPerson !== undefined)
      stockist.contactPerson = contactPerson ? contactPerson.trim() : undefined;
    if (phone !== undefined) stockist.phone = phone ? phone.trim() : undefined;

    await stockist.save();

    const populated = await Stockist.findById(stockist._id).populate(
      'createdBy',
      'name email'
    );

    res.status(200).json({
      success: true,
      data: {
        stockist: populated,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate stockist (soft delete)
// @route   PATCH /api/stockists/:id/deactivate
// @access  Private (Owner, Manager only)
exports.deactivateStockist = async (req, res, next) => {
  try {
    const stockist = await Stockist.findById(req.params.id);

    if (!stockist) {
      return res.status(404).json({
        success: false,
        message: 'Stockist not found',
      });
    }

    stockist.isActive = false;
    await stockist.save();

    res.status(200).json({
      success: true,
      data: {
        stockist,
      },
      message: 'Stockist deactivated',
    });
  } catch (error) {
    next(error);
  }
};
