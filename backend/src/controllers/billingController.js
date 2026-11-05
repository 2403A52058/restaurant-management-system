const prisma = require('../config/db');

exports.getInvoices = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const where = {};

    if (status && status !== 'all') {
      where.paymentStatus = status.toUpperCase();
    }
    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        order: {
          include: {
            table: true,
            orderItems: { include: { menuItem: true } },
            payments: true,
          },
        },
        creator: {
          select: { id: true, username: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

exports.getInvoiceById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            table: true,
            customer: true,
            orderItems: { include: { menuItem: true } },
            payments: true,
          },
        },
        creator: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Include restaurant settings in invoice response for complete printable receipt
    const settings = await prisma.restaurantSetting.findFirst();

    res.json({
      success: true,
      data: {
        ...invoice,
        restaurantInfo: settings,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.generateInvoice = async (req, res, next) => {
  try {
    const { orderId, discountAmount = 0 } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        customer: true,
        orderItems: true,
        invoice: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.invoice) {
      return res.json({
        success: true,
        message: 'Invoice already exists for this order',
        data: order.invoice,
      });
    }

    // Get tax rate from settings
    const settings = await prisma.restaurantSetting.findFirst();
    const taxRate = settings ? Number(settings.defaultTaxRate) : 5.0;

    const subtotal = Number(order.subtotal);
    const taxAmount = (subtotal * taxRate) / 100;
    const discount = parseFloat(discountAmount) || 0;
    const totalAmount = Math.max(0, subtotal + taxAmount - discount);

    const timestamp = Date.now().toString().slice(-4);
    const randomHex = Math.floor(Math.random() * 900 + 100);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${timestamp}${randomHex}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        customerName: order.customer ? order.customer.name : 'Walk-in Guest',
        customerPhone: order.customer ? order.customer.phone : null,
        subtotal,
        taxRate,
        taxAmount,
        discountAmount: discount,
        totalAmount,
        paymentStatus: 'UNPAID',
        generatedBy: req.user?.id || null,
      },
      include: {
        order: {
          include: {
            table: true,
            orderItems: { include: { menuItem: true } },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

exports.recordPayment = async (req, res, next) => {
  try {
    const { orderId, invoiceId, paymentMethod, amount, transactionId } = req.body;

    if (!paymentMethod || !amount) {
      return res.status(400).json({ success: false, message: 'Payment method and amount are required' });
    }

    const validMethods = ['CASH', 'CARD', 'UPI'];
    if (!validMethods.includes(paymentMethod.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Payment method must be CASH, CARD, or UPI' });
    }

    let targetOrderId = orderId ? parseInt(orderId) : null;
    let targetInvoiceId = invoiceId ? parseInt(invoiceId) : null;

    if (!targetOrderId && targetInvoiceId) {
      const inv = await prisma.invoice.findUnique({ where: { id: targetInvoiceId } });
      if (inv) targetOrderId = inv.orderId;
    }

    if (!targetOrderId) {
      return res.status(400).json({ success: false, message: 'Order ID or Invoice ID is required' });
    }

    const order = await prisma.order.findUnique({
      where: { id: targetOrderId },
      include: { invoice: true, table: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: targetOrderId,
        paymentMethod: paymentMethod.toUpperCase(),
        amount: parseFloat(amount),
        status: 'COMPLETED',
        transactionId: transactionId || `TXN-${Date.now().toString().slice(-8)}`,
        paidAt: new Date(),
      },
    });

    // Mark invoice as PAID
    if (order.invoice) {
      await prisma.invoice.update({
        where: { id: order.invoice.id },
        data: { paymentStatus: 'PAID' },
      });
    }

    // Mark order as SERVED
    await prisma.order.update({
      where: { id: targetOrderId },
      data: { status: 'SERVED' },
    });

    // Free up restaurant table to AVAILABLE
    if (order.tableId) {
      await prisma.restaurantTable.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Payment recorded and order settled successfully. Table is now available.',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        order: {
          include: {
            table: true,
            customer: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};
