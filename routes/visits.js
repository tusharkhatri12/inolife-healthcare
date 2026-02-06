const express = require('express');
const router = express.Router();
const {
  getVisits,
  getVisit,
  createVisit,
  updateVisit,
  deleteVisit,
} = require('../controllers/visitController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All routes require authentication

router.route('/').get(authorize('Owner', 'Manager', 'MR'), getVisits).post(authorize('Owner', 'Manager', 'MR'), createVisit);
router.route('/:id').get(authorize('Owner', 'Manager', 'MR'), getVisit);
router.route('/:id').put(authorize('Owner', 'Manager', 'MR'), updateVisit);
router.route('/:id').delete(authorize('Owner', 'Manager', 'MR'), deleteVisit);

module.exports = router;
