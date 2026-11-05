const prisma = require('../config/db');

exports.getStats = async (req, res, next) => {
  try {
    // 1. Total revenue (sum of all completed payments / paid invoices)
    const revenueAgg = await prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    });
    const totalRevenue = Number(revenueAgg._sum.amount || 0);

    // Today's revenue
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayRevenueAgg = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        paidAt: { gte: startOfToday },
      },
      _sum: { amount: true },
    });
    const todayRevenue = Number(todayRevenueAgg._sum.amount || 0);

    // 2. Total orders
    const totalOrders = await prisma.order.count();
    const todayOrders = await prisma.order.count({
      where: { createdAt: { gte: startOfToday } },
    });

    // 3. Total customers
    const totalCustomers = await prisma.customer.count();

    // 4. Tables stats
    const totalTables = await prisma.restaurantTable.count();
    const availableTables = await prisma.restaurantTable.count({
      where: { status: 'AVAILABLE' },
    });
    const occupiedTables = await prisma.restaurantTable.count({
      where: { status: 'OCCUPIED' },
    });
    const reservedTables = await prisma.restaurantTable.count({
      where: { status: 'RESERVED' },
    });

    // 5. Reservations
    const pendingReservations = await prisma.reservation.count({
      where: { status: 'PENDING' },
    });
    const todayReservations = await prisma.reservation.count({
      where: {
        reservationDate: { gte: startOfToday },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    });

    // 6. Low stock ingredients alert count
    const ingredients = await prisma.ingredient.findMany();
    const lowStockCount = ingredients.filter(i => Number(i.currentStock) <= Number(i.minThreshold)).length;

    // 7. Kitchen pending / active orders
    const activeKitchenOrders = await prisma.order.count({
      where: { status: { in: ['PENDING', 'PREPARING', 'READY'] } },
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        todayRevenue,
        totalOrders,
        todayOrders,
        totalCustomers,
        totalTables,
        availableTables,
        occupiedTables,
        reservedTables,
        pendingReservations,
        todayReservations,
        lowStockCount,
        activeKitchenOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSalesCharts = async (req, res, next) => {
  try {
    // 1. Daily sales for the past 7 days
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      const dayPayments = await prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          paidAt: { gte: dayStart, lte: dayEnd },
        },
        _sum: { amount: true },
      });

      const dayOrders = await prisma.order.count({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      dailyData.push({
        date: dayName,
        revenue: Number(dayPayments._sum.amount || 0),
        orders: dayOrders,
      });
    }

    // 2. Category distribution
    const categories = await prisma.category.findMany({
      include: {
        menuItems: {
          include: {
            orderItems: true,
          },
        },
      },
    });

    const categoryPerformance = categories.map(cat => {
      let salesCount = 0;
      let revenue = 0;
      cat.menuItems.forEach(item => {
        item.orderItems.forEach(oi => {
          salesCount += oi.quantity;
          revenue += Number(oi.subtotal);
        });
      });
      return {
        name: cat.name.split(' ')[0],
        fullName: cat.name,
        orders: salesCount,
        revenue: Math.round(revenue * 100) / 100,
      };
    }).filter(c => c.revenue > 0 || c.orders > 0);

    // 3. Monthly Sales breakdown (past 6 months)
    const monthlyData = [];
    const now = new Date();
    for (let m = 5; m >= 0; m--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1, 0, 0, 0);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });

      const mRevenue = await prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      });

      const mOrders = await prisma.order.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      });

      monthlyData.push({
        month: monthName,
        revenue: Number(mRevenue._sum.amount || 0),
        orders: mOrders,
      });
    }

    res.json({
      success: true,
      data: {
        daily: dailyData,
        monthly: monthlyData,
        categories: categoryPerformance,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecentOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        table: true,
        customer: true,
        orderItems: {
          include: { menuItem: true },
        },
        payments: true,
      },
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};
