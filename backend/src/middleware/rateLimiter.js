// KodiKart Rate Limiter Middleware
// Protects OTP endpoints and APIs from brute-force attacks
const rateLimit = require('express-rate-limit');

/**
 * OTP send rate limiter — strict to prevent SMS/email abuse
 */
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 OTP send requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait 15 minutes before trying again.',
  },
});

/**
 * OTP verify rate limiter — prevents brute-force on 6-digit OTP
 */
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Max 10 verify attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many failed attempts. Please wait before trying again.',
  },
});

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

/**
 * Strict limiter for sensitive actions (payment, admin operations)
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests for this action. Please try again later.',
  },
});

/**
 * Handover OTP verify limiter — strict single-use enforcement
 */
const handoverOtpLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many handover OTP attempts.',
  },
});

module.exports = {
  otpSendLimiter,
  otpVerifyLimiter,
  apiLimiter,
  strictLimiter,
  handoverOtpLimiter,
};
