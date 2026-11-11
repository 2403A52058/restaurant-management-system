// KodiKart OTP Utility
// Generates, hashes, and verifies secure OTPs for login and handover
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

/**
 * Generate a cryptographically random OTP
 */
function generateOTP() {
  // Use crypto.randomInt for cryptographic security
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
}

/**
 * Hash OTP using bcrypt (never store plaintext)
 */
async function hashOTP(otp) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
}

/**
 * Verify OTP against stored hash
 */
async function verifyOTP(otp, hash) {
  if (!otp || !hash) return false;
  return bcrypt.compare(otp, hash);
}

/**
 * Calculate OTP expiry timestamp
 */
function getOTPExpiry() {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + OTP_EXPIRY_MINUTES);
  return expiry;
}

/**
 * Check if OTP is expired
 */
function isOTPExpired(expiryDate) {
  return !expiryDate || new Date() > new Date(expiryDate);
}

/**
 * Check if resend cooldown is active
 */
function isResendCooldownActive(lastSentAt) {
  if (!lastSentAt) return false;
  const cooldownEnds = new Date(lastSentAt);
  cooldownEnds.setSeconds(cooldownEnds.getSeconds() + OTP_RESEND_COOLDOWN_SECONDS);
  return new Date() < cooldownEnds;
}

/**
 * Get remaining cooldown in seconds
 */
function getRemainingCooldown(lastSentAt) {
  if (!lastSentAt) return 0;
  const cooldownEnds = new Date(lastSentAt);
  cooldownEnds.setSeconds(cooldownEnds.getSeconds() + OTP_RESEND_COOLDOWN_SECONDS);
  const remaining = Math.ceil((cooldownEnds - new Date()) / 1000);
  return Math.max(0, remaining);
}

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiry,
  isOTPExpired,
  isResendCooldownActive,
  getRemainingCooldown,
  MAX_OTP_ATTEMPTS,
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
};
