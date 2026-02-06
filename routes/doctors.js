const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All routes require authentication

router.route('/').get(authorize('Owner', 'Manager', 'MR'), getDoctors).post(authorize('Owner', 'Manager', 'MR'), createDoctor);
router.route('/:id').get(authorize('Owner', 'Manager', 'MR'), getDoctor);
router.route('/:id').put(authorize('Owner', 'Manager', 'MR'), updateDoctor);
router.route('/:id').delete(authorize('Owner', 'Manager'), deleteDoctor);

module.exports = router;
