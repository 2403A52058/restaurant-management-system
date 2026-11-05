const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'restaurant_jwt_super_secret_key_2026_academic_project');

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: true,
        employee: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User account is inactive or not found.' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role.name,
      roleId: user.roleId,
      employee: user.employee,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
};

// Role-based authorization
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role) && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of these roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
