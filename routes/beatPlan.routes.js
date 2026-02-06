const express = require('express');
const router = express.Router();
const {
  createBeatPlan,
  getBeatPlans,
  updateBeatPlan,
  getBeatPlanComparison,
  updateDeviationReason,
} = require('../controllers/beatPlan.controller');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// MRs can create their own plans, Managers/Owners can create for any MR
router.route('/').get(getBeatPlans).post(createBeatPlan);

// Update beat plan
router.route('/:id').put(updateBeatPlan);

// Get planned vs actual comparison
router.route('/:id/comparison').get(getBeatPlanComparison);

// Update deviation reason (mandatory when deviation exists)
router.route('/:id/deviation-reason').put(updateDeviationReason);

module.exports = router;
