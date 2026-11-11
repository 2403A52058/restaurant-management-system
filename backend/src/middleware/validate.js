// KodiKart — Input Validation Middleware
// Comprehensive validation using express-validator
// Prevents malformed/malicious data from reaching controllers

const { body, validationResult } = require('express-validator');

// ============================================================
// HELPER: Handle Validation Errors
// ============================================================

/**
 * Middleware to check validation results and return 400 on errors.
 * Always call this AFTER the validation chain middleware.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check the provided data.',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
        value: e.value,
      })),
    });
  }
  next();
};

// ============================================================
// SANITIZER: Trim & escape all string fields globally
// ============================================================

/**
 * sanitizeAll — trim whitespace and escape HTML entities on all
 * string fields in req.body. Apply early in every route that
 * accepts a body, before specific validators.
 */
const sanitizeAll = [
  body('*').if(body('*').isString()).trim().escape(),
];

// ============================================================
// VALIDATORS
// ============================================================

/**
 * validateRequestOTP
 * POST /api/auth/request-otp
 * Fields: phone, email, name (optional — only for new users), role (optional)
 */
const validateRequestOTP = [
  body('phone')
    .notEmpty().withMessage('Phone number is required.')
    .isString()
    .trim()
    // Strip country code prefix before validating
    .customSanitizer((v) => v.replace(/\s+/g, '').replace(/^(\+91|0)/, ''))
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian mobile number starting with 6–9.'),

  body('email')
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Name must be between 2 and 120 characters.')
    .matches(/^[a-zA-Z\u0C00-\u0C7F\s.'-]+$/)
    .withMessage('Name may only contain letters, Telugu characters, spaces, dots, hyphens and apostrophes.'),

  body('role')
    .optional()
    .isIn(['CUSTOMER', 'FARM_OWNER'])
    .withMessage('Role must be CUSTOMER or FARM_OWNER.'),
];

/**
 * validateVerifyOTP
 * POST /api/auth/verify-otp
 * Fields: phone, email, otp
 */
const validateVerifyOTP = [
  body('phone')
    .notEmpty().withMessage('Phone number is required.')
    .isString()
    .trim()
    .customSanitizer((v) => v.replace(/\s+/g, '').replace(/^(\+91|0)/, ''))
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian mobile number starting with 6–9.'),

  body('email')
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('otp')
    .notEmpty().withMessage('OTP is required.')
    .isString()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('OTP must be a 6-digit numeric code.'),
];

/**
 * validateCreateBooking
 * POST /api/bookings
 * Fields: farmId, breedId, quantity, desiredWeight, deliveryType, deliveryAddress (optional)
 */
const validateCreateBooking = [
  body('farmId')
    .notEmpty().withMessage('Farm ID is required.')
    .isInt({ min: 1 }).withMessage('Farm ID must be a positive integer.')
    .toInt(),

  body('breedId')
    .notEmpty().withMessage('Breed ID is required.')
    .isInt({ min: 1 }).withMessage('Breed ID must be a positive integer.')
    .toInt(),

  body('quantity')
    .notEmpty().withMessage('Quantity is required.')
    .isInt({ min: 1, max: 20 }).withMessage('Quantity must be between 1 and 20 hens.')
    .toInt(),

  body('desiredWeight')
    .notEmpty().withMessage('Desired total weight is required.')
    .isFloat({ min: 0.5, max: 50 }).withMessage('Desired weight must be between 0.5 kg and 50 kg.')
    .toFloat(),

  body('deliveryType')
    .notEmpty().withMessage('Delivery type is required.')
    .isIn(['PICKUP', 'DELIVERY']).withMessage('Delivery type must be PICKUP or DELIVERY.'),

  body('deliveryAddress')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Delivery address must be between 10 and 500 characters.'),

  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters.'),
];

/**
 * validateAddHen
 * POST /api/farms/:farmId/hens  (or /api/hens)
 * Fields: farmBreedId, actualWeight, henId (optional — auto-generated if absent), notes
 */
const validateAddHen = [
  body('farmBreedId')
    .notEmpty().withMessage('Farm breed ID is required.')
    .isInt({ min: 1 }).withMessage('Farm breed ID must be a positive integer.')
    .toInt(),

  body('actualWeight')
    .notEmpty().withMessage('Actual weight is required.')
    .isFloat({ min: 0.01, max: 2.5 })
    .withMessage('Actual weight must be between 0.01 kg and 2.5 kg (strict maximum for native female hens).')
    .toFloat()
    .custom((value) => {
      // Extra explicit guard: reject anything >= 2.5 kg with a precise message
      if (value > 2.5) {
        throw new Error('Weight exceeds the 2.5 kg maximum allowed for native female hens.');
      }
      return true;
    }),

  body('henId')
    .optional()
    .isString()
    .trim()
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Hen ID must contain only uppercase letters, numbers and hyphens.'),

  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters.'),
];

/**
 * validateUpdatePrice
 * PUT /api/farms/:farmId/breeds/:breedId/price
 * Fields: pricePerKg, reason (optional)
 */
const validateUpdatePrice = [
  body('pricePerKg')
    .notEmpty().withMessage('Price per kg is required.')
    .isFloat({ min: 0.01 }).withMessage('Price per kg must be a positive decimal value.')
    .toFloat()
    .custom((value) => {
      if (value > 100000) {
        throw new Error('Price per kg seems unreasonably high. Maximum allowed is ₹1,00,000.');
      }
      return true;
    }),

  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Reason must not exceed 300 characters.'),
];

module.exports = {
  sanitizeAll,
  handleValidationErrors,
  validateRequestOTP,
  validateVerifyOTP,
  validateCreateBooking,
  validateAddHen,
  validateUpdatePrice,
};
