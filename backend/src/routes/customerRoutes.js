const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', authorize(['ADMIN', 'MANAGER', 'WAITER', 'CASHIER']), customerController.createCustomer);
router.put('/:id', authorize(['ADMIN', 'MANAGER', 'WAITER', 'CASHIER']), customerController.updateCustomer);
router.delete('/:id', authorize(['ADMIN', 'MANAGER']), customerController.deleteCustomer);

module.exports = router;
