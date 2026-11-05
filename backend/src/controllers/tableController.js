const prisma = require('../config/db');

exports.getTables = async (req, res, next) => {
  try {
    const { status, location } = req.query;
    const where = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    if (location && location !== 'all') {
      where.location = location;
    }

    const tables = await prisma.restaurantTable.findMany({
      where,
      include: {
        orders: {
          where: {
            status: { in: ['PENDING', 'PREPARING', 'READY'] },
          },
          include: {
            orderItems: { include: { menuItem: true } },
            customer: true,
          },
        },
        reservations: {
          where: {
            status: { in: ['CONFIRMED', 'PENDING'] },
          },
          include: { customer: true },
        },
      },
      orderBy: { tableNumber: 'asc' },
    });

    res.json({ success: true, data: tables });
  } catch (error) {
    next(error);
  }
};

exports.createTable = async (req, res, next) => {
  try {
    const { tableNumber, seatingCapacity, location, status = 'AVAILABLE' } = req.body;

    if (!tableNumber || !seatingCapacity) {
      return res.status(400).json({ success: false, message: 'Table number and seating capacity are required.' });
    }

    const table = await prisma.restaurantTable.create({
      data: {
        tableNumber: tableNumber.trim().toUpperCase(),
        seatingCapacity: parseInt(seatingCapacity),
        location: location || 'Main Dining Hall',
        status: status.toUpperCase(),
      },
    });

    res.status(201).json({ success: true, message: 'Table created successfully', data: table });
  } catch (error) {
    next(error);
  }
};

exports.updateTable = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { tableNumber, seatingCapacity, location, status } = req.body;

    const table = await prisma.restaurantTable.update({
      where: { id },
      data: {
        ...(tableNumber && { tableNumber: tableNumber.trim().toUpperCase() }),
        ...(seatingCapacity !== undefined && { seatingCapacity: parseInt(seatingCapacity) }),
        ...(location !== undefined && { location }),
        ...(status && { status: status.toUpperCase() }),
      },
    });

    res.json({ success: true, message: 'Table updated successfully', data: table });
  } catch (error) {
    next(error);
  }
};

exports.updateTableStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!['AVAILABLE', 'RESERVED', 'OCCUPIED'].includes(status?.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid table status. Must be AVAILABLE, RESERVED, or OCCUPIED.' });
    }

    const table = await prisma.restaurantTable.update({
      where: { id },
      data: { status: status.toUpperCase() },
    });

    res.json({ success: true, message: `Table status changed to ${status}`, data: table });
  } catch (error) {
    next(error);
  }
};

exports.deleteTable = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.restaurantTable.delete({ where: { id } });
    res.json({ success: true, message: 'Table deleted successfully' });
  } catch (error) {
    next(error);
  }
};
