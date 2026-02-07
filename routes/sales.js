const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSalesByDoctor,
  getSalesByStockist,
  getSalesByMr,
  createAdminSale,
  updateAdminSale,
} = require('../controllers/salesController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Admin-only sales (Primary/Secondary, month-wise)
router.post('/admin', authorize('Owner', 'Manager'), createAdminSale);
router.put('/admin/:id', authorize('Owner', 'Manager'), updateAdminSale);

router.use(authorize('Owner', 'Manager', 'MR'));

// Specific routes first (before any :id)
router.get('/doctor/:doctorId', getSalesByDoctor);
router.get('/stockist/:stockistId', getSalesByStockist);
router.get('/mr/:mrId', getSalesByMr);

router.get('/', getSales);
router.post('/', createSale);

module.exports = router;
