const express = require('express');
const router = express.Router();
const {
  getSchemes,
  getScheme,
  createScheme,
  updateScheme,
  deactivateScheme,
} = require('../controllers/schemeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// All roles can list (with ?stockistId=) and get one
router.get('/', authorize('Owner', 'Manager', 'MR'), getSchemes);
router.get('/:id', authorize('Owner', 'Manager', 'MR'), getScheme);

// MR can add; Owner/Manager can add, edit, deactivate
router.post('/', authorize('Owner', 'Manager', 'MR'), createScheme);
router.put('/:id', authorize('Owner', 'Manager'), updateScheme);
router.patch('/:id/deactivate', authorize('Owner', 'Manager'), deactivateScheme);

module.exports = router;
