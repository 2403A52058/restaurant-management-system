const prisma = require('../config/db');

exports.getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { orders: true, reservations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            orderItems: { include: { menuItem: true } },
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        reservations: {
          include: { table: true },
          orderBy: { reservationDate: 'desc' },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, address, loyaltyPoints = 0 } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone number are required' });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email ? email.trim().toLowerCase() : null,
        phone: phone.trim(),
        address: address || null,
        loyaltyPoints: parseInt(loyaltyPoints) || 0,
      },
    });

    res.status(201).json({ success: true, message: 'Customer created successfully', data: customer });
  } catch (error) {
    next(error);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, phone, address, loyaltyPoints } = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email !== undefined && { email: email ? email.trim().toLowerCase() : null }),
        ...(phone && { phone: phone.trim() }),
        ...(address !== undefined && { address }),
        ...(loyaltyPoints !== undefined && { loyaltyPoints: parseInt(loyaltyPoints) }),
      },
    });

    res.json({ success: true, message: 'Customer updated successfully', data: customer });
  } catch (error) {
    next(error);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.customer.delete({ where: { id } });
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};
