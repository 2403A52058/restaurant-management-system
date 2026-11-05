const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

exports.getEmployees = async (req, res, next) => {
  try {
    const { status, roleId } = req.query;
    const where = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    if (roleId && roleId !== 'all') {
      where.roleId = parseInt(roleId);
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        role: true,
        user: {
          select: { id: true, username: true, email: true, isActive: true, lastLogin: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: employees });
  } catch (error) {
    next(error);
  }
};

exports.getRoles = async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { employees: true, users: true },
        },
      },
      orderBy: { id: 'asc' },
    });
    res.json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      roleId,
      salary,
      hireDate,
      createAccount = false,
      username,
      password,
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !roleId) {
      return res.status(400).json({ success: false, message: 'First name, last name, email, phone, and role are required' });
    }

    let userId = null;
    if (createAccount && username && password) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await prisma.user.create({
        data: {
          username: username.trim(),
          email: email.trim().toLowerCase(),
          passwordHash,
          roleId: parseInt(roleId),
          isActive: true,
        },
      });
      userId = user.id;
    }

    const employee = await prisma.employee.create({
      data: {
        userId,
        roleId: parseInt(roleId),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        salary: salary ? parseFloat(salary) : 40000.0,
        hireDate: hireDate ? new Date(hireDate) : new Date(),
        status: 'ACTIVE',
      },
      include: {
        role: true,
        user: {
          select: { id: true, username: true, email: true, isActive: true },
        },
      },
    });

    res.status(201).json({ success: true, message: 'Employee added successfully', data: employee });
  } catch (error) {
    next(error);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { firstName, lastName, email, phone, roleId, salary, hireDate, status } = req.body;

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
        ...(email && { email: email.trim().toLowerCase() }),
        ...(phone && { phone: phone.trim() }),
        ...(roleId && { roleId: parseInt(roleId) }),
        ...(salary !== undefined && { salary: parseFloat(salary) }),
        ...(hireDate && { hireDate: new Date(hireDate) }),
        ...(status && { status: status.toUpperCase() }),
      },
      include: {
        role: true,
        user: {
          select: { id: true, username: true, email: true, isActive: true },
        },
      },
    });

    res.json({ success: true, message: 'Employee updated successfully', data: employee });
  } catch (error) {
    next(error);
  }
};

exports.toggleAccountStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const newStatus = employee.status === 'ACTIVE' ? 'TERMINATED' : 'ACTIVE';

    await prisma.employee.update({
      where: { id },
      data: { status: newStatus },
    });

    if (employee.userId) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: { isActive: newStatus === 'ACTIVE' },
      });
    }

    res.json({ success: true, message: `Employee status changed to ${newStatus}` });
  } catch (error) {
    next(error);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const emp = await prisma.employee.findUnique({ where: { id } });

    if (emp && emp.userId) {
      await prisma.user.delete({ where: { id: emp.userId } }).catch(() => {});
    }

    await prisma.employee.delete({ where: { id } });
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
};
