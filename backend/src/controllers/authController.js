const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

exports.login = async (req, res, next) => {
  try {
    const { login, password } = req.body; // login can be username or email

    if (!login || !password) {
      return res.status(400).json({ success: false, message: 'Username/email and password are required.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: login.trim().toLowerCase() },
          { username: login.trim() },
        ],
      },
      include: {
        role: true,
        employee: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role.name },
      process.env.JWT_SECRET || 'restaurant_jwt_super_secret_key_2026_academic_project',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        roleDescription: user.role.description,
        permissions: user.role.permissions ? JSON.parse(user.role.permissions) : [],
        employee: user.employee ? {
          id: user.employee.id,
          firstName: user.employee.firstName,
          lastName: user.employee.lastName,
          phone: user.employee.phone,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, roleName = 'WAITER', firstName, lastName, phone, salary } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password are required.' });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { username }],
      },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'A user with this username or email already exists.' });
    }

    let role = await prisma.role.findUnique({ where: { name: roleName.toUpperCase() } });
    if (!role) {
      role = await prisma.role.findFirst();
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        passwordHash,
        roleId: role.id,
        isActive: true,
      },
      include: { role: true },
    });

    if (firstName && lastName) {
      await prisma.employee.create({
        data: {
          userId: user.id,
          roleId: role.id,
          firstName,
          lastName,
          email: email.toLowerCase(),
          phone: phone || '+1 (555) 000-0000',
          salary: salary ? parseFloat(salary) : 40000,
          hireDate: new Date(),
          status: 'ACTIVE',
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: true,
        employee: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        roleDescription: user.role.description,
        permissions: user.role.permissions ? JSON.parse(user.role.permissions) : [],
        employee: user.employee,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
