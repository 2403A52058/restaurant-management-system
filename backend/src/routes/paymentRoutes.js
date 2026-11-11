// KodiKart Payment Routes (PhonePe + Manual)
const express = require('express');
const router = express.Router();
const phonePeController = require('../controllers/phonePeController');
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');

// PhonePe payment initiation (Customer)
router.post('/initiate-advance/:bookingId', authenticate, authorize('CUSTOMER'), strictLimiter, phonePeController.initiateAdvancePayment);

// PhonePe webhook (called by PhonePe servers — no auth, but signature verified inside)
router.post('/phonepe-webhook', phonePeController.phonePeWebhook);

// Check payment status (Customer)
router.get('/status/:merchantTransactionId', authenticate, authorize('CUSTOMER'), phonePeController.checkPaymentStatus);

// Payment history (Customer or Farm Owner for their bookings)
router.get('/history/:bookingId', authenticate, paymentController.getPaymentHistory);
router.get('/booking/:bookingId', authenticate, paymentController.getPaymentHistory);

// Farm earnings (Farm Owner)
router.get('/earnings', authenticate, authorize('FARM_OWNER'), paymentController.getFarmEarnings);
router.get('/earnings/:farmId', authenticate, authorize('FARM_OWNER', 'ADMIN'), paymentController.getFarmEarnings);

// Request withdrawal (Farm Owner)
router.post('/withdraw', authenticate, authorize('FARM_OWNER'), strictLimiter, paymentController.requestWithdrawal);
router.post('/withdrawal', authenticate, authorize('FARM_OWNER'), strictLimiter, paymentController.requestWithdrawal);

// Payment simulation & recording (zero-cost sandbox & testing)
router.post('/record', authenticate, paymentController.recordPayment);
router.post('/manual-record', authenticate, paymentController.recordPayment);

module.exports = router;
