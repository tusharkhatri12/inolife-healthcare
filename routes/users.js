const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  createMR,
  listMRs,
  deactivateMR,
  resetMRPassword,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All routes require authentication

// MR management (Owner / Manager)
router.route('/mr').post(authorize('Owner', 'Manager'), createMR).get(authorize('Owner', 'Manager'), listMRs);
router
  .route('/mr/:id/deactivate')
  .patch(authorize('Owner', 'Manager'), deactivateMR);
router
  .route('/mr/:id/reset-password')
  .post(authorize('Owner', 'Manager'), resetMRPassword);

// Generic user CRUD
router.route('/').get(authorize('Owner', 'Manager', 'MR'), getUsers);
router.route('/:id').get(authorize('Owner', 'Manager', 'MR'), getUser);
router.route('/:id').put(authorize('Owner', 'Manager', 'MR'), updateUser);
router.route('/:id').delete(authorize('Owner', 'Manager'), deleteUser);

module.exports = router;
