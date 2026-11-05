const prisma = require('../config/db');

exports.getKitchenOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['PENDING', 'PREPARING', 'READY'] },
      },
      include: {
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
      },
      orderBy: { createdAt: 'asc' }, // oldest first to expedite
    });

    const formatted = orders.map(ord => {
      const elapsedMinutes = Math.floor((new Date() - new Date(ord.createdAt)) / (1000 * 60));
      return {
        ...ord,
        elapsedMinutes,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderItemStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body; // PENDING, PREPARING, READY, SERVED

    const updated = await prisma.orderItem.update({
      where: { id },
      data: { status: status.toUpperCase() },
      include: { menuItem: true },
    });

    // Check if all items in the order have reached this status
    const orderItems = await prisma.orderItem.findMany({ where: { orderId: updated.orderId } });
    const allReady = orderItems.every(i => i.status === 'READY');
    const anyPreparing = orderItems.some(i => i.status === 'PREPARING' || i.status === 'READY');

    if (allReady) {
      await prisma.order.update({
        where: { id: updated.orderId },
        data: { status: 'READY' },
      });
    } else if (anyPreparing) {
      await prisma.order.update({
        where: { id: updated.orderId },
        data: { status: 'PREPARING' },
      });
    }

    res.json({ success: true, message: 'Item status updated', data: updated });
  } catch (error) {
    next(error);
  }
};

exports.updateKitchenOrderStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body; // PENDING, PREPARING, READY, SERVED

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
        orderItems: {
          updateMany: {
            where: { orderId: id },
            data: { status: status.toUpperCase() },
          },
        },
      },
      include: {
        table: true,
        orderItems: { include: { menuItem: true } },
      },
    });

    res.json({ success: true, message: `Kitchen order status updated to ${status}`, data: order });
  } catch (error) {
    next(error);
  }
};
