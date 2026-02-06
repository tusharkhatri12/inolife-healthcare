const express = require('express');
const router = express.Router();

const {
  createDoctorCoveragePlan,
  updateDoctorCoveragePlannedVisits,
  getDoctorCoverageSummary,
  getDoctorCoveragePlans,
} = require('../controllers/coverage.controller');
const { protect, authorize } = require('../middleware/auth');

// All coverage routes require authentication
router.use(protect);

// POST   /api/coverage/create
// OWNER, MANAGER only
router.post('/create', authorize('Owner', 'Manager'), createDoctorCoveragePlan);

// POST   /api/coverage/admin/create
// OWNER, MANAGER only (alias for /create)
router.post('/admin/create', authorize('Owner', 'Manager'), createDoctorCoveragePlan);

// PUT    /api/coverage/:id
// OWNER, MANAGER only
router.put('/:id', authorize('Owner', 'Manager'), updateDoctorCoveragePlannedVisits);

// GET    /api/coverage/plans
// OWNER, MANAGER only - Get individual plans for table view
router.get('/plans', authorize('Owner', 'Manager'), getDoctorCoveragePlans);

// GET    /api/coverage/admin/summary
// OWNER, MANAGER only - Alias for /plans (for CoverageList page)
router.get('/admin/summary', authorize('Owner', 'Manager'), getDoctorCoveragePlans);

// GET    /api/coverage/summary
// OWNER, MANAGER only
router.get('/summary', authorize('Owner', 'Manager'), getDoctorCoverageSummary);

// GET    /api/coverage/my-coverage
// MR only - Get own coverage (simpler endpoint for mobile app)
router.get('/my-coverage', (req, res, next) => {
  if (req.user.role !== 'MR') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is for MRs only',
    });
  }

  // Scope query to this MR; default to doctor-wise summary
  req.query.mrId = req.user.id;
  if (!req.query.groupBy) {
    req.query.groupBy = 'doctor';
  }

  return getDoctorCoverageSummary(req, res, next);
});

// GET    /api/coverage/mr/:mrId
// - OWNER, MANAGER, MR (MR can only view own coverage)
router.get('/mr/:mrId', (req, res, next) => {
  const { mrId } = req.params;

  if (req.user.role === 'MR' && req.user.id.toString() !== mrId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view coverage for this MR',
    });
  }

  // Scope query to this MR; default to doctor-wise summary for MR view
  req.query.mrId = mrId;
  if (!req.query.groupBy) {
    req.query.groupBy = 'doctor';
  }

  return getDoctorCoverageSummary(req, res, next);
});

// GET    /api/coverage/doctor/:doctorId
// OWNER, MANAGER only
router.get(
  '/doctor/:doctorId',
  authorize('Owner', 'Manager'),
  (req, res, next) => {
    const { doctorId } = req.params;

    // Scope query to this doctor; default to MR-wise summary
    req.query.doctorId = doctorId;
    if (!req.query.groupBy) {
      req.query.groupBy = 'mr';
    }

    return getDoctorCoverageSummary(req, res, next);
  }
);

module.exports = router;
