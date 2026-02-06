const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseMargERPCSV } = require('../utils/csvParser');
const { importProductsFromExcel, importDoctorsFromExcel } = require('../utils/excelParser');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const prefix = req.path.includes('products') ? 'products' : req.path.includes('doctors') ? 'doctors' : 'marg';
    cb(null, `${prefix}-${Date.now()}${ext}`);
  },
});

const csvUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname) === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const excelUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    const isExcel = ['.xlsx', '.xls'].includes(ext) ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel';
    if (isExcel) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// @desc    Import sales data from MARG ERP CSV
// @route   POST /api/import/marg-erp
// @access  Private (Owner, Manager)
router.post(
  '/marg-erp',
  protect,
  authorize('Owner', 'Manager'),
  csvUpload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a CSV file',
        });
      }

      const results = await parseMargERPCSV(req.file.path, {
        dryRun: req.body.dryRun === 'true',
      });

      fs.unlinkSync(req.file.path);

      res.status(200).json({
        success: true,
        message: 'Import completed',
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Import products from Excel
// @route   POST /api/import/products
// @access  Private (Owner, Manager)
router.post(
  '/products',
  protect,
  authorize('Owner', 'Manager'),
  excelUpload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload an Excel file (.xlsx or .xls)',
        });
      }

      const updateExisting = req.body.updateExisting === 'true';
      const clearExisting = req.body.clearExisting === 'true';
      const results = await importProductsFromExcel(req.file.path, { updateExisting, clearExisting });

      fs.unlinkSync(req.file.path);

      res.status(200).json({
        success: true,
        message: 'Product import completed',
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Import doctors from Excel
// @route   POST /api/import/doctors
// @access  Private (Owner, Manager)
router.post(
  '/doctors',
  protect,
  authorize('Owner', 'Manager'),
  excelUpload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload an Excel file (.xlsx or .xls)',
        });
      }

      const updateExisting = req.body.updateExisting === 'true';
      const assignedMR = req.body.assignedMR || null;
      const results = await importDoctorsFromExcel(req.file.path, {
        updateExisting,
        assignedMR: assignedMR || undefined,
      });

      fs.unlinkSync(req.file.path);

      res.status(200).json({
        success: true,
        message: 'Doctor import completed',
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
