const express = require('express');
const router = express.Router();
const kitchenController = require('../controllers/kitchenController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/orders', kitchenController.getKitchenOrders);
router.patch('/orders/:id/status', authorize(['ADMIN', 'MANAGER', 'CHEF']), kitchenController.updateKitchenOrderStatus);
router.patch('/items/:id/status', authorize(['ADMIN', 'MANAGER', 'CHEF']), kitchenController.updateOrderItemStatus);

module.exports = router;
