const express = require('express');
const router = express.Router();
const {
  getStockists,
  getStockist,
  createStockist,
  updateStockist,
  deactivateStockist,
} = require('../controllers/stockistController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Owner, Manager, MR can list and get one
router.get('/', authorize('Owner', 'Manager', 'MR'), getStockists);
router.get('/:id', authorize('Owner', 'Manager', 'MR'), getStockist);

// Only Owner, Manager can create and update
router.post('/', authorize('Owner', 'Manager'), createStockist);
router.put('/:id', authorize('Owner', 'Manager'), updateStockist);

// Soft delete
router.patch('/:id/deactivate', authorize('Owner', 'Manager'), deactivateStockist);

module.exports = router;
