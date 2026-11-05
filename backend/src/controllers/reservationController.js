const prisma = require('../config/db');

exports.getReservations = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const where = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate(), 23, 59, 59);
      where.reservationDate = { gte: startOfDay, lte: endOfDay };
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        customer: true,
        table: true,
      },
      orderBy: { reservationDate: 'desc' },
    });

    res.json({ success: true, data: reservations });
  } catch (error) {
    next(error);
  }
};

exports.createReservation = async (req, res, next) => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      tableId,
      reservationDate,
      timeSlot,
      guestCount,
      specialRequests,
    } = req.body;

    if (!tableId || !reservationDate || !timeSlot || !guestCount) {
      return res.status(400).json({
        success: false,
        message: 'Table, reservation date, time slot, and guest count are required.',
      });
    }

    // Resolve or create Customer
    let resolvedCustomerId = customerId ? parseInt(customerId) : null;
    if (!resolvedCustomerId) {
      if (!customerName || !customerPhone) {
        return res.status(400).json({
          success: false,
          message: 'Customer name and phone number are required if selecting a new customer.',
        });
      }

      let cust = await prisma.customer.findFirst({
        where: { phone: customerPhone.trim() },
      });

      if (!cust) {
        cust = await prisma.customer.create({
          data: {
            name: customerName.trim(),
            email: customerEmail ? customerEmail.trim().toLowerCase() : null,
            phone: customerPhone.trim(),
          },
        });
      }
      resolvedCustomerId = cust.id;
    }

    const tId = parseInt(tableId);
    const parsedDate = new Date(reservationDate);
    const startOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 23, 59, 59);

    // Prevent conflicting reservations for the same table, on the same day, in the same time slot!
    const conflict = await prisma.reservation.findFirst({
      where: {
        tableId: tId,
        reservationDate: { gte: startOfDay, lte: endOfDay },
        timeSlot: timeSlot.trim(),
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      include: { table: true },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Conflict: Table ${conflict.table.tableNumber} is already booked for ${timeSlot} on this date. Please choose a different table or time.`,
      });
    }

    const reservation = await prisma.reservation.create({
      data: {
        customerId: resolvedCustomerId,
        tableId: tId,
        reservationDate: parsedDate,
        timeSlot: timeSlot.trim(),
        guestCount: parseInt(guestCount),
        specialRequests: specialRequests || '',
        status: 'CONFIRMED',
      },
      include: {
        customer: true,
        table: true,
      },
    });

    // Optionally mark table as RESERVED
    await prisma.restaurantTable.update({
      where: { id: tId },
      data: { status: 'RESERVED' },
    });

    res.status(201).json({
      success: true,
      message: 'Reservation booked successfully without conflicts.',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateReservation = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { tableId, reservationDate, timeSlot, guestCount, status, specialRequests } = req.body;

    const existing = await prisma.reservation.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    // Check conflict if table or time slot is being changed
    if ((tableId && tableId !== existing.tableId) || (timeSlot && timeSlot !== existing.timeSlot)) {
      const tId = tableId ? parseInt(tableId) : existing.tableId;
      const tSlot = timeSlot ? timeSlot.trim() : existing.timeSlot;
      const pDate = reservationDate ? new Date(reservationDate) : existing.reservationDate;
      const startOfDay = new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate(), 23, 59, 59);

      const conflict = await prisma.reservation.findFirst({
        where: {
          id: { not: id },
          tableId: tId,
          reservationDate: { gte: startOfDay, lte: endOfDay },
          timeSlot: tSlot,
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: 'Conflict detected: Selected table is already reserved in that slot.',
        });
      }
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        ...(tableId && { tableId: parseInt(tableId) }),
        ...(reservationDate && { reservationDate: new Date(reservationDate) }),
        ...(timeSlot && { timeSlot: timeSlot.trim() }),
        ...(guestCount !== undefined && { guestCount: parseInt(guestCount) }),
        ...(status && { status: status.toUpperCase() }),
        ...(specialRequests !== undefined && { specialRequests }),
      },
      include: {
        customer: true,
        table: true,
      },
    });

    res.json({ success: true, message: 'Reservation updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

exports.updateReservationStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status?.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: status.toUpperCase() },
      include: { table: true },
    });

    // If cancelled or completed, check if table should return to AVAILABLE
    if (['CANCELLED', 'COMPLETED'].includes(status.toUpperCase())) {
      const activeResCount = await prisma.reservation.count({
        where: {
          tableId: reservation.tableId,
          status: { in: ['CONFIRMED', 'PENDING'] },
          id: { not: id },
        },
      });
      if (activeResCount === 0) {
        await prisma.restaurantTable.update({
          where: { id: reservation.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    res.json({ success: true, message: `Reservation marked as ${status}`, data: reservation });
  } catch (error) {
    next(error);
  }
};

exports.deleteReservation = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const reservation = await prisma.reservation.delete({ where: { id } });

    // Recheck table status
    const remaining = await prisma.reservation.count({
      where: { tableId: reservation.tableId, status: { in: ['CONFIRMED', 'PENDING'] } },
    });
    if (remaining === 0) {
      await prisma.restaurantTable.update({
        where: { id: reservation.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    res.json({ success: true, message: 'Reservation removed successfully' });
  } catch (error) {
    next(error);
  }
};
