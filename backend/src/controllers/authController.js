// KodiKart Authentication Controller
// Email OTP-based authentication for Customers, Farm Owners, and Admins
// OTP is sent to user's registered EMAIL (Resend.com - free tier)

const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { generateOTP, hashOTP, verifyOTP, getOTPExpiry, isOTPExpired, isResendCooldownActive, getRemainingCooldown, MAX_OTP_ATTEMPTS } = require('../utils/otp');
const { sendLoginOTP } = require('../utils/email');

/**
 * Step 1: Request OTP
 * User enters their phone + email → OTP sent to email
 * If new user: account created with minimal info
 */
exports.requestOTP = async (req, res, next) => {
  try {
    const { phone, email, name, role = 'CUSTOMER' } = req.body;

    // Validate inputs
    if (!phone || !email) {
      return res.status(400).json({ success: false, message: 'Phone number and email are required.' });
    }

    // Validate phone format (Indian mobile numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phone.replace(/\s+/g, '').replace(/^(\+91|0)/, '');
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number.' });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }

    // Validate role
    const allowedRoles = ['CUSTOMER', 'FARM_OWNER'];
    if (!allowedRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be CUSTOMER or FARM_OWNER.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = cleanPhone;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { email: normalizedEmail },
        ],
      },
    });

    if (user) {
      // Check if phone + email match (prevent account takeover)
      if (user.phone !== normalizedPhone || user.email !== normalizedEmail) {
        // Log suspicious activity
        await prisma.securityAuditLog.create({
          data: {
            userId: user.id,
            action: 'OTP_PHONE_EMAIL_MISMATCH',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            details: `Phone/email mismatch attempt for existing user`,
          },
        }).catch(() => {});
        return res.status(400).json({ success: false, message: 'Phone number and email do not match our records. Please use the same details you registered with.' });
      }

      // Check account status
      if (user.status !== 'ACTIVE') {
        return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' });
      }

      // Check resend cooldown
      if (isResendCooldownActive(user.otpLastSentAt)) {
        const remaining = getRemainingCooldown(user.otpLastSentAt);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remaining} seconds before requesting another OTP.`,
          remainingSeconds: remaining,
        });
      }
    } else {
      // New user registration
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Full name is required for new registration.' });
      }

      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          email: normalizedEmail,
          name: name.trim(),
          role: role.toUpperCase(),
          status: 'ACTIVE',
        },
      });

      // Log new registration
      await prisma.securityAuditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          details: `New ${role} registered`,
        },
      }).catch(() => {});
    }

    // Generate and hash OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const otpExpiry = getOTPExpiry();

    // Store OTP hash in DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash,
        otpExpiry,
        otpAttempts: 0,
        otpLastSentAt: new Date(),
      },
    });

    // Send OTP via email
    const emailResult = await sendLoginOTP({
      to: user.email,
      name: user.name,
      otp,
      phone: user.phone,
    });

    if (!emailResult.success && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email. Please try again.' });
    }

    // Log OTP send
    await prisma.securityAuditLog.create({
      data: {
        userId: user.id,
        action: 'OTP_SENT',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: `OTP sent to ${user.email} (dev: ${emailResult.dev || false})`,
      },
    }).catch(() => {});

    return res.json({
      success: true,
      message: `OTP sent to ${user.email}. Valid for 10 minutes.`,
      isNewUser: !user.lastLoginAt,
      // In development only: include partial OTP hint (NEVER in production)
      ...(process.env.NODE_ENV === 'development' && emailResult.dev && {
        _devNote: 'OTP printed in backend console (development only)',
      }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Step 2: Verify OTP
 * User enters the 6-digit OTP from their email → receives JWT token
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    const { phone, email, otp } = req.body;

    if (!phone || !email || !otp) {
      return res.status(400).json({ success: false, message: 'Phone, email, and OTP are required.' });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'OTP must be a 6-digit number.' });
    }

    const cleanPhone = phone.replace(/\s+/g, '').replace(/^(\+91|0)/, '');
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        phone: cleanPhone,
        email: normalizedEmail,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Account suspended.' });
    }

    // Check attempt limit
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      await prisma.securityAuditLog.create({
        data: {
          userId: user.id,
          action: 'OTP_MAX_ATTEMPTS_EXCEEDED',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          details: `${user.otpAttempts} failed OTP attempts`,
        },
      }).catch(() => {});
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.',
      });
    }

    // Check expiry
    if (isOTPExpired(user.otpExpiry)) {
      return res.status(401).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, user.otpHash);

    if (!isValid) {
      // Increment attempt counter
      await prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: { increment: 1 } },
      });

      await prisma.securityAuditLog.create({
        data: {
          userId: user.id,
          action: 'OTP_FAILED',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          details: `Invalid OTP attempt ${user.otpAttempts + 1}/${MAX_OTP_ATTEMPTS}`,
        },
      }).catch(() => {});

      const remaining = MAX_OTP_ATTEMPTS - user.otpAttempts - 1;
      return res.status(401).json({
        success: false,
        message: remaining > 0
          ? `Incorrect OTP. ${remaining} attempts remaining.`
          : 'Incorrect OTP. Please request a new one.',
      });
    }

    // OTP valid — clear it (single-use enforcement)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpHash: null,
        otpExpiry: null,
        otpAttempts: 0,
        otpLastSentAt: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Log successful login
    await prisma.securityAuditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: `Login via email OTP`,
      },
    }).catch(() => {});

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        farms: {
          select: { id: true, farmName: true, slug: true, isVerified: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * Request account deletion
 */
exports.requestDeletion = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        customerId: userId,
        status: { in: ['REQUESTED', 'QUOTED', 'QUOTE_ACCEPTED', 'CONFIRMED', 'READY_FOR_HANDOVER'] },
      },
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account with active bookings. Please complete or cancel all bookings first.',
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'DELETED' },
    });

    await prisma.securityAuditLog.create({
      data: {
        userId,
        action: 'ACCOUNT_DELETED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: 'User requested account deletion',
      },
    }).catch(() => {});

    return res.json({ success: true, message: 'Account deletion requested. Your account has been deactivated.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout (client should discard token)
 */
exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};
