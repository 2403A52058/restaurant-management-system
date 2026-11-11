// KodiKart Auth Routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { otpSendLimiter, otpVerifyLimiter } = require('../middleware/rateLimiter');

// Step 1: Request OTP (phone + email)
router.post('/request-otp', otpSendLimiter, authController.requestOTP);

// Step 2: Verify OTP → receive JWT
router.post('/verify-otp', otpVerifyLimiter, authController.verifyOTP);

// Get current user
router.get('/me', authenticate, authController.getMe);

// Logout (client discards token)
router.post('/logout', authenticate, authController.logout);

// Request account deletion
router.delete('/delete-account', authenticate, authController.requestDeletion);

module.exports = router;
