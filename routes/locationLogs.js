const express = require('express');
const router = express.Router();
const {
  getLocationLogs,
  getLocationLog,
  createLocationLog,
  getCurrentLocation,
  getAllCurrentLocations,
} = require('../controllers/locationLogController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All routes require authentication

router.route('/').get(authorize('Owner', 'Manager', 'MR'), getLocationLogs).post(authorize('Owner', 'Manager', 'MR'), createLocationLog);
router.route('/current-all').get(authorize('Owner'), getAllCurrentLocations);
router.route('/current/:mrId?').get(authorize('Owner', 'Manager', 'MR'), getCurrentLocation);
router.route('/:id').get(authorize('Owner', 'Manager', 'MR'), getLocationLog);

module.exports = router;
