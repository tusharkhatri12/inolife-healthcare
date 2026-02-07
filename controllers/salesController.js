const SalesRecord = require('../models/SalesRecord');
const Doctor = require('../models/Doctor');
const Stockist = require('../models/Stockist');
const User = require('../models/User');

// Map sales so each product line includes productName (from populated productId). Backward compatible.
function withProductNames(sales) {
  if (!Array.isArray(sales)) return sales;
  return sales.map((s) => {
    const doc = typeof s.toObject === 'function' ? s.toObject() : { ...s };
    if (Array.isArray(doc.products)) {
      doc.products = doc.products.map((p) => {
        const name = p.productId && (p.productId.name || p.productId.title);
        return {
          productId: p.productId,
          productName: name || null,
          quantity: p.quantity,
          free: p.free != null ? p.free : 0,
          value: p.value,
        };
      });
    }
    return doc;
  });
}

// @desc    Create sales record
// @route   POST /api/sales
// @access  Private (Owner, Manager, MR)
exports.createSale = async (req, res, next) => {
  try {
    const { date, doctorId, stockistId, products, remarks } = req.body;

    if (!date || !stockistId || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'date, stockistId and products (non-empty array) are required',
      });
    }

    const stockist = await Stockist.findById(stockistId);
    if (!stockist || !stockist.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Stockist not found or inactive',
      });
    }

    const isAdmin = req.user.role === 'Owner' || req.user.role === 'Manager';
    const mrId = isAdmin ? (req.body.mrId || req.user.id) : req.user.id;

    if (doctorId) {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(400).json({
          success: false,
          message: 'Doctor not found',
        });
      }
      if (!isAdmin && doctor.assignedMR?.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only add sales for your assigned doctors',
        });
      }
    }

    let totalValue = 0;
    const productLines = products.map((p) => {
      const qty = Number(p.quantity) || 0;
      const freeQty = Number(p.free) || 0;
      const val = Number(p.value) || 0;
      totalValue += val;
      return {
        productId: p.productId,
        quantity: qty,
        free: freeQty,
        value: val,
      };
    });

    if (totalValue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total value cannot be negative',
      });
    }

    const saleDate = new Date(date);
    const saleMonth = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
    const sale = await SalesRecord.create({
      date: saleDate,
      saleMonth,
      saleType: 'SECONDARY',
      mrId,
      doctorId: doctorId || undefined,
      stockistId,
      products: productLines,
      totalValue,
      source: isAdmin ? 'ADMIN_ENTRY' : 'MR_ENTRY',
      createdBy: isAdmin ? 'ADMIN' : 'MR',
      remarks: remarks ? remarks.trim() : undefined,
    });

    const populated = await SalesRecord.findById(sale._id)
      .populate('mrId', 'name email employeeId')
      .populate('doctorId', 'name specialization city')
      .populate('stockistId', 'name city area')
      .populate('products.productId', 'name code');

    res.status(201).json({
      success: true,
      data: {
        sale: populated,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper: ensure saleMonth on doc for backward compat (derive from date if missing)
function ensureSaleMonth(doc) {
  if (doc.saleMonth) return doc;
  const d = doc.date;
  if (!d) return doc;
  const date = typeof d === 'string' ? new Date(d) : d;
  doc.saleMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  return doc;
}

// @desc    Get sales (list with optional filters)
// @route   GET /api/sales?startDate=&endDate=&mrId=&stockistId=&doctorId=&saleType=&saleMonthStart=&saleMonthEnd=
// @access  Private (Owner, Manager see all; MR sees own only)
exports.getSales = async (req, res, next) => {
  try {
    const { startDate, endDate, mrId, stockistId, doctorId, saleType, saleMonthStart, saleMonthEnd } = req.query;
    const query = {};

    if (req.user.role === 'MR') {
      query.mrId = req.user.id;
    } else {
      if (mrId) query.mrId = mrId;
      if (stockistId) query.stockistId = stockistId;
      if (doctorId) query.doctorId = doctorId;
      if (saleType) query.saleType = saleType;
    }

    if (saleMonthStart || saleMonthEnd) {
      const monthCond = {};
      if (saleMonthStart) monthCond.$gte = saleMonthStart;
      if (saleMonthEnd) monthCond.$lte = saleMonthEnd;
      const dateRange = buildDateRangeFromMonthRange(saleMonthStart, saleMonthEnd);
      query.$or = [
        Object.keys(monthCond).length ? { saleMonth: monthCond } : {},
        dateRange ? { $and: [{ saleMonth: { $in: [null, ''] } }, { date: dateRange }] } : {},
      ].filter((c) => Object.keys(c).length > 0);
      if (query.$or.length === 0) delete query.$or;
    } else if (startDate || endDate) {
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

    const sales = await SalesRecord.find(query)
      .populate('mrId', 'name email employeeId')
      .populate('doctorId', 'name specialization city')
      .populate('stockistId', 'name city area')
      .populate('products.productId', 'name code')
      .sort({ date: -1 })
      .lean();

    const normalized = withProductNames(sales).map(ensureSaleMonth);

    res.status(200).json({
      success: true,
      count: normalized.length,
      data: {
        sales: normalized,
      },
    });
  } catch (error) {
    next(error);
  }
};

function buildDateRangeFromMonthRange(saleMonthStart, saleMonthEnd) {
  const range = {};
  if (saleMonthStart) {
    const [y, m] = saleMonthStart.split('-').map(Number);
    range.$gte = new Date(y, m - 1, 1, 0, 0, 0, 0);
  }
  if (saleMonthEnd) {
    const [y, m] = saleMonthEnd.split('-').map(Number);
    range.$lte = new Date(y, m, 0, 23, 59, 59, 999);
  }
  return Object.keys(range).length ? range : undefined;
}

// @desc    Create admin-only sale (Primary/Secondary, month-wise, no product lines)
// @route   POST /api/sales/admin
// @access  Private (Owner, Manager)
exports.createAdminSale = async (req, res, next) => {
  try {
    const { saleType, saleMonth, stockistId, mrId, totalValue, remarks } = req.body;

    if (!saleType || !['PRIMARY', 'SECONDARY'].includes(saleType)) {
      return res.status(400).json({
        success: false,
        message: 'saleType must be PRIMARY or SECONDARY',
      });
    }
    if (!saleMonth || !/^\d{4}-\d{2}$/.test(saleMonth)) {
      return res.status(400).json({
        success: false,
        message: 'saleMonth is required (YYYY-MM)',
      });
    }
    if (!stockistId) {
      return res.status(400).json({
        success: false,
        message: 'Stockist is required',
      });
    }
    const value = Number(totalValue);
    if (isNaN(value) || value < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total value must be a non-negative number',
      });
    }

    const stockist = await Stockist.findById(stockistId);
    if (!stockist || !stockist.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Stockist not found or inactive',
      });
    }

    if (mrId) {
      const mr = await User.findById(mrId);
      if (!mr || mr.role !== 'MR') {
        return res.status(400).json({
          success: false,
          message: 'MR not found or not an MR user',
        });
      }
    }

    const [y, m] = saleMonth.split('-').map(Number);
    const date = new Date(y, m - 1, 1, 0, 0, 0, 0);

    const sale = await SalesRecord.create({
      date,
      saleMonth,
      saleType,
      stockistId,
      mrId: mrId || undefined,
      doctorId: undefined,
      products: [],
      totalValue: value,
      source: 'ADMIN_ENTRY',
      createdBy: 'ADMIN',
      remarks: remarks ? String(remarks).trim() : undefined,
    });

    const populated = await SalesRecord.findById(sale._id)
      .populate('mrId', 'name email employeeId')
      .populate('stockistId', 'name city area')
      .lean();

    res.status(201).json({
      success: true,
      data: {
        sale: { ...populated, saleType, saleMonth, createdBy: 'ADMIN' },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update admin-only sale (Owner/Manager)
// @route   PUT /api/sales/admin/:id
// @access  Private (Owner, Manager)
exports.updateAdminSale = async (req, res, next) => {
  try {
    const sale = await SalesRecord.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }
    if (sale.createdBy !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Only admin-created sales can be updated from dashboard',
      });
    }

    const { saleType, saleMonth, stockistId, mrId, totalValue, remarks } = req.body;
    if (saleType && !['PRIMARY', 'SECONDARY'].includes(saleType)) {
      return res.status(400).json({
        success: false,
        message: 'saleType must be PRIMARY or SECONDARY',
      });
    }
    if (saleMonth && !/^\d{4}-\d{2}$/.test(saleMonth)) {
      return res.status(400).json({
        success: false,
        message: 'saleMonth must be YYYY-MM',
      });
    }
    if (stockistId) {
      const stockist = await Stockist.findById(stockistId);
      if (!stockist || !stockist.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Stockist not found or inactive',
        });
      }
    }
    const value = totalValue !== undefined ? Number(totalValue) : sale.totalValue;
    if (isNaN(value) || value < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total value must be non-negative',
      });
    }

    if (saleType) sale.saleType = saleType;
    if (saleMonth) {
      sale.saleMonth = saleMonth;
      const [y, m] = saleMonth.split('-').map(Number);
      sale.date = new Date(y, m - 1, 1, 0, 0, 0, 0);
    }
    if (stockistId) sale.stockistId = stockistId;
    if (mrId !== undefined) sale.mrId = mrId || undefined;
    sale.totalValue = value;
    if (remarks !== undefined) sale.remarks = remarks ? String(remarks).trim() : undefined;
    await sale.save();

    const populated = await SalesRecord.findById(sale._id)
      .populate('mrId', 'name email employeeId')
      .populate('stockistId', 'name city area')
      .lean();

    res.status(200).json({
      success: true,
      data: { sale: populated },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales by doctor
// @route   GET /api/sales/doctor/:doctorId
// @access  Private (MR only own assigned doctors; Owner/Manager all)
exports.getSalesByDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    if (req.user.role === 'MR') {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor || doctor.assignedMR?.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view sales for this doctor',
        });
      }
    }

    const query = { doctorId };
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

    const sales = await SalesRecord.find(query)
      .populate('mrId', 'name email employeeId')
      .populate('doctorId', 'name specialization city')
      .populate('stockistId', 'name city area')
      .populate('products.productId', 'name code')
      .sort({ date: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: sales.length,
      data: { sales: withProductNames(sales) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales by stockist
// @route   GET /api/sales/stockist/:stockistId
// @access  Private (MR own only; Owner/Manager all)
exports.getSalesByStockist = async (req, res, next) => {
  try {
    const { stockistId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { stockistId };
    if (req.user.role === 'MR') query.mrId = req.user.id;

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

    const sales = await SalesRecord.find(query)
      .populate('mrId', 'name email employeeId')
      .populate('doctorId', 'name specialization city')
      .populate('stockistId', 'name city area')
      .populate('products.productId', 'name code')
      .sort({ date: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: sales.length,
      data: { sales: withProductNames(sales) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales by MR
// @route   GET /api/sales/mr/:mrId
// @access  Private (MR only own; Owner/Manager any)
exports.getSalesByMr = async (req, res, next) => {
  try {
    const { mrId } = req.params;
    const { startDate, endDate } = req.query;

    if (req.user.role === 'MR' && mrId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view another MR\'s sales',
      });
    }

    const query = { mrId };
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

    const sales = await SalesRecord.find(query)
      .populate('mrId', 'name email employeeId')
      .populate('doctorId', 'name specialization city')
      .populate('stockistId', 'name city area')
      .populate('products.productId', 'name code')
      .sort({ date: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: sales.length,
      data: { sales: withProductNames(sales) },
    });
  } catch (error) {
    next(error);
  }
};
