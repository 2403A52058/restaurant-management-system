const prisma = require('../config/db');

exports.getOrders = async (req, res, next) => {
  try {
    const { status, orderType, tableId, date } = req.query;
    const where = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    if (orderType && orderType !== 'all') {
      where.orderType = orderType.toUpperCase();
    }
    if (tableId && tableId !== 'all') {
      where.tableId = parseInt(tableId);
    }
    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        customer: true,
        employee: true,
        orderItems: {
          include: { menuItem: true },
        },
        payments: true,
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        customer: true,
        employee: true,
        orderItems: {
          include: { menuItem: true },
        },
        payments: true,
        invoice: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const {
      tableId,
      customerId,
      customerName,
      customerPhone,
      orderType = 'DINE_IN',
      items = [], // [{ menuItemId, quantity, notes }]
      discountAmount = 0,
      notes,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
    }

    // Resolve customer if provided
    let resolvedCustomerId = customerId ? parseInt(customerId) : null;
    if (!resolvedCustomerId && customerName && customerPhone) {
      let cust = await prisma.customer.findFirst({
        where: { phone: customerPhone.trim() },
      });
      if (!cust) {
        cust = await prisma.customer.create({
          data: {
            name: customerName.trim(),
            phone: customerPhone.trim(),
          },
        });
      }
      resolvedCustomerId = cust.id;
    }

    // Fetch menu item prices
    const itemIds = items.map(i => parseInt(i.menuItemId));
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
    });

    const itemMap = new Map();
    menuItems.forEach(mi => itemMap.set(mi.id, mi));

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const mi = itemMap.get(parseInt(item.menuItemId));
      if (!mi) continue;
      const qty = parseInt(item.quantity) || 1;
      const price = Number(mi.price);
      const itemSubtotal = price * qty;
      subtotal += itemSubtotal;

      orderItemsData.push({
        menuItemId: mi.id,
        quantity: qty,
        unitPrice: price,
        subtotal: itemSubtotal,
        notes: item.notes || null,
        status: 'PENDING',
      });
    }

    // Fetch tax rate from settings
    const setting = await prisma.restaurantSetting.findFirst();
    const taxRate = setting ? Number(setting.defaultTaxRate) : 5.0;
    const taxAmount = (subtotal * taxRate) / 100;
    const discount = parseFloat(discountAmount) || 0;
    const totalAmount = Math.max(0, subtotal + taxAmount - discount);

    // Generate unique order number
    const timestamp = Date.now().toString().slice(-4);
    const randomHex = Math.floor(Math.random() * 900 + 100);
    const orderNumber = `ORD-${new Date().getFullYear()}-${timestamp}${randomHex}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        tableId: tableId ? parseInt(tableId) : null,
        customerId: resolvedCustomerId,
        employeeId: req.user?.employee?.id || null,
        orderType: orderType.toUpperCase(),
        status: 'PENDING',
        subtotal,
        taxAmount,
        discountAmount: discount,
        totalAmount,
        notes: notes || null,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        table: true,
        customer: true,
        orderItems: { include: { menuItem: true } },
      },
    });

    // If dine in and table was specified, set table status to OCCUPIED
    if (tableId && orderType.toUpperCase() === 'DINE_IN') {
      await prisma.restaurantTable.update({
        where: { id: parseInt(tableId) },
        data: { status: 'OCCUPIED' },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    const validStatuses = ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];
    if (!validStatuses.includes(status?.toUpperCase())) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
        // Also update all order items if order marked ready or served
        orderItems: {
          updateMany: {
            where: { orderId: id },
            data: { status: status.toUpperCase() },
          },
        },
      },
      include: {
        table: true,
        customer: true,
        orderItems: { include: { menuItem: true } },
      },
    });

    // If order was cancelled and had a table, free up the table if no other active orders exist
    if (status.toUpperCase() === 'CANCELLED' && updated.tableId) {
      const activeOrders = await prisma.order.count({
        where: {
          tableId: updated.tableId,
          status: { in: ['PENDING', 'PREPARING', 'READY'] },
          id: { not: id },
        },
      });
      if (activeOrders === 0) {
        await prisma.restaurantTable.update({
          where: { id: updated.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    res.json({ success: true, message: `Order status updated to ${status}`, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.addItemsToOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { items = [] } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const itemIds = items.map(i => parseInt(i.menuItemId));
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
    });
    const itemMap = new Map();
    menuItems.forEach(mi => itemMap.set(mi.id, mi));

    for (const item of items) {
      const mi = itemMap.get(parseInt(item.menuItemId));
      if (!mi) continue;
      const qty = parseInt(item.quantity) || 1;
      const price = Number(mi.price);

      await prisma.orderItem.create({
        data: {
          orderId: id,
          menuItemId: mi.id,
          quantity: qty,
          unitPrice: price,
          subtotal: price * qty,
          notes: item.notes || null,
          status: 'PENDING',
        },
      });
    }

    // Recalculate order subtotal and total
    const allItems = await prisma.orderItem.findMany({ where: { orderId: id } });
    const newSubtotal = allItems.reduce((acc, it) => acc + Number(it.subtotal), 0);
    const taxRate = 5.0;
    const newTax = (newSubtotal * taxRate) / 100;
    const newTotal = Math.max(0, newSubtotal + newTax - Number(order.discountAmount));

    const updated = await prisma.order.update({
      where: { id },
      data: {
        subtotal: newSubtotal,
        taxAmount: newTax,
        totalAmount: newTotal,
      },
      include: {
        orderItems: { include: { menuItem: true } },
      },
    });

    res.json({ success: true, message: 'Items added to order', data: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const order = await prisma.order.findUnique({ where: { id } });

    if (order && order.tableId) {
      await prisma.restaurantTable.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    await prisma.order.delete({ where: { id } });
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};
