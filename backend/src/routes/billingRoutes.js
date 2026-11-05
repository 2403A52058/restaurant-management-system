const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/invoices', billingController.getInvoices);
router.get('/invoices/:id', billingController.getInvoiceById);
router.post('/generate', authorize(['ADMIN', 'MANAGER', 'CASHIER']), billingController.generateInvoice);
router.post('/payments', authorize(['ADMIN', 'MANAGER', 'CASHIER']), billingController.recordPayment);
router.get('/payments', billingController.getPaymentHistory);

module.exports = router;
