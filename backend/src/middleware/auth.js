// KodiKart Authentication Middleware
// Validates JWT tokens and enforces role-based access control
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

/**
 * Authenticate JWT token from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
    }

    // Fetch fresh user from DB to check status
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: user.status === 'SUSPENDED'
          ? 'Your account has been suspended. Contact support.'
          : 'Your account has been deleted.',
      });
    }

    req.user = {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

/**
 * Role-based authorization
 * @param {...string} roles - Allowed roles: 'CUSTOMER', 'FARM_OWNER', 'ADMIN'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }

    next();
  };
};

/**
 * Optional authentication — does not reject unauthenticated requests
 * Sets req.user if valid token exists, otherwise req.user = null
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, phone: true, email: true, name: true, role: true, status: true },
    });

    req.user = (user && user.status === 'ACTIVE') ? user : null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = { authenticate, authorize, optionalAuth };
