const express = require('express');
const router = express.Router();
const {
  getMRPerformance,
  getDoctorAnalytics,
  getProductPushSales,
  getMRLeaderboard,
  getTodaysFieldActivity,
  getTodaysVisitSummary,
  getMonthlySalesReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and Owner/Manager role
router.use(protect);
router.use(authorize('Owner', 'Manager'));

// Daily MR Performance Report
router.get('/mr-performance', getMRPerformance);

// Doctor Analytics Report
router.get('/doctor-analytics', getDoctorAnalytics);

// Product Push vs Sales Report
router.get('/product-push-sales', getProductPushSales);

// MR Leaderboard
router.get('/mr-leaderboard', getMRLeaderboard);

// Today's Field Activity (active/inactive, beat, planned vs visited, met/not met, deviation)
router.get('/todays-field-activity', getTodaysFieldActivity);

// Today's Visit Summary (total planned, met, not met, reasons)
router.get('/todays-visit-summary', getTodaysVisitSummary);

// Monthly Primary/Secondary sales (combined MR + Admin)
router.get('/sales-monthly', getMonthlySalesReport);

module.exports = router;
