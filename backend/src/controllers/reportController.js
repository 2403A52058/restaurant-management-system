const prisma = require('../config/db');

exports.getSalesReport = async (req, res, next) => {
  try {
    const { period = 'daily' } = req.query; // daily, weekly, monthly

    // 1. Overall Aggregates
    const totalRevenueAgg = await prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    });

    const totalOrders = await prisma.order.count();
    const completedOrders = await prisma.order.count({ where: { status: 'SERVED' } });
    const cancelledOrders = await prisma.order.count({ where: { status: 'CANCELLED' } });

    const totalRev = Number(totalRevenueAgg._sum.amount || 0);
    const avgOrderValue = completedOrders > 0 ? (totalRev / completedOrders).toFixed(2) : 0;

    // 2. Timeline sales
    let timeline = [];
    if (period === 'daily') {
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

        const rev = await prisma.payment.aggregate({
          where: { status: 'COMPLETED', paidAt: { gte: dayStart, lte: dayEnd } },
          _sum: { amount: true },
        });

        const ordersCount = await prisma.order.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd } },
        });

        timeline.push({
          label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: Number(rev._sum.amount || 0),
          orders: ordersCount,
        });
      }
    } else if (period === 'monthly') {
      const now = new Date();
      for (let m = 11; m >= 0; m--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 0, 0, 0);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

        const rev = await prisma.payment.aggregate({
          where: { status: 'COMPLETED', paidAt: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true },
        });

        const ordersCount = await prisma.order.count({
          where: { createdAt: { gte: monthStart, lte: monthEnd } },
        });

        timeline.push({
          label: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: Number(rev._sum.amount || 0),
          orders: ordersCount,
        });
      }
    }

    // 3. Payment Method Breakdown
    const paymentMethods = ['CASH', 'CARD', 'UPI'];
    const paymentBreakdown = await Promise.all(
      paymentMethods.map(async (method) => {
        const agg = await prisma.payment.aggregate({
          where: { status: 'COMPLETED', paymentMethod: method },
          _sum: { amount: true },
          _count: true,
        });
        return {
          method,
          amount: Number(agg._sum.amount || 0),
          count: agg._count,
        };
      })
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: totalRev,
          totalOrders,
          completedOrders,
          cancelledOrders,
          avgOrderValue: parseFloat(avgOrderValue),
        },
        timeline,
        paymentBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getPopularItems = async (req, res, next) => {
  try {
    const orderItems = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: orderItems.map(oi => oi.menuItemId) } },
      include: { category: true },
    });

    const itemMap = new Map();
    menuItems.forEach(mi => itemMap.set(mi.id, mi));

    const result = orderItems.map(oi => {
      const item = itemMap.get(oi.menuItemId);
      return {
        id: oi.menuItemId,
        name: item?.name || 'Unknown Item',
        category: item?.category?.name || 'General',
        price: Number(item?.price || 0),
        totalSold: oi._sum.quantity || 0,
        totalRevenue: Number(oi._sum.subtotal || 0),
        imageUrl: item?.imageUrl || '',
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.exportCSV = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        table: true,
        payments: true,
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Generate CSV Header
    let csv = 'Order ID,Order Number,Date,Type,Status,Table,Customer Name,Subtotal,Tax,Discount,Total,Payment Method,Payment Status\n';

    orders.forEach(ord => {
      const paymentMethod = ord.payments.length > 0 ? ord.payments[0].paymentMethod : 'N/A';
      const paymentStatus = ord.invoice ? ord.invoice.paymentStatus : (ord.payments.length > 0 ? 'PAID' : 'UNPAID');
      const row = [
        ord.id,
        ord.orderNumber,
        new Date(ord.createdAt).toISOString().split('T')[0],
        ord.orderType,
        ord.status,
        ord.table ? ord.table.tableNumber : 'N/A',
        ord.customer ? `"${ord.customer.name}"` : '"Walk-in"',
        Number(ord.subtotal).toFixed(2),
        Number(ord.taxAmount).toFixed(2),
        Number(ord.discountAmount).toFixed(2),
        Number(ord.totalAmount).toFixed(2),
        paymentMethod,
        paymentStatus,
      ];
      csv += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="restaurant-sales-report.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};
