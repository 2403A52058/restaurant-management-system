const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', authorize(['ADMIN', 'MANAGER', 'WAITER', 'CASHIER']), orderController.createOrder);
router.patch('/:id/status', authorize(['ADMIN', 'MANAGER', 'CHEF', 'WAITER', 'CASHIER']), orderController.updateOrderStatus);
router.post('/:id/items', authorize(['ADMIN', 'MANAGER', 'WAITER']), orderController.addItemsToOrder);
router.delete('/:id', authorize(['ADMIN', 'MANAGER']), orderController.deleteOrder);

module.exports = router;
