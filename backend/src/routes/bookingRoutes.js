// KodiKart Booking Routes
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');
const { apiLimiter, strictLimiter, handoverOtpLimiter } = require('../middleware/rateLimiter');

router.use(apiLimiter);

// Customer: create booking request
router.post('/', authenticate, authorize('CUSTOMER'), strictLimiter, bookingController.createBooking);

// Customer: view my bookings
router.get('/my', authenticate, authorize('CUSTOMER'), bookingController.getCustomerBookings);

// Get specific booking details
router.get('/:bookingId', authenticate, bookingController.getBookingById);

// Customer: accept or reject quotation
router.post('/:bookingId/respond', authenticate, authorize('CUSTOMER'), bookingController.respondToQuotation);

// Farm Owner: view bookings for a farm
router.get('/farm/:farmId', authenticate, authorize('FARM_OWNER', 'ADMIN'), bookingController.getFarmBookings);

// Farm Owner: generate quotation (assign hens)
router.post('/:bookingId/quotation', authenticate, authorize('FARM_OWNER'), bookingController.generateQuotation);

// Farm Owner: initiate handover (generates OTP → sends ONLY to customer email)
router.post('/:bookingId/initiate-handover', authenticate, authorize('FARM_OWNER'), bookingController.initiateHandover);

// Farm Owner: verify handover OTP (entered by farm owner after customer shares it)
router.post('/:bookingId/verify-handover', authenticate, authorize('FARM_OWNER'), handoverOtpLimiter, bookingController.verifyHandoverOTP);

module.exports = router;
