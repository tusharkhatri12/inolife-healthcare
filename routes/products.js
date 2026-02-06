const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All routes require authentication

router.route('/').get(authorize('Owner', 'Manager', 'MR'), getProducts).post(authorize('Owner', 'Manager'), createProduct);
router.route('/:id').get(authorize('Owner', 'Manager', 'MR'), getProduct);
router.route('/:id').put(authorize('Owner', 'Manager'), updateProduct);
router.route('/:id').delete(authorize('Owner', 'Manager'), deleteProduct);

module.exports = router;
