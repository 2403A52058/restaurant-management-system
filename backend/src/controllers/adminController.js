// KodiKart Admin Controller
const prisma = require('../config/db');

/**
 * Admin Dashboard Stats
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalFarms, totalHens, totalBookings,
      pendingVerifications, openComplaints,
      recentBookings, recentFarms,
    ] = await Promise.all([
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.farm.count({ where: { isActive: true } }),
      prisma.henInventory.count({ where: { status: 'AVAILABLE' } }),
      prisma.booking.count(),
      prisma.farm.count({ where: { isVerified: false, isActive: true } }),
      prisma.complaint.count({ where: { status: 'OPEN' } }),
      prisma.booking.findMany({
        take: 10, orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } }, farm: { select: { farmName: true } } },
      }),
      prisma.farm.findMany({
        take: 5, where: { isVerified: false }, orderBy: { createdAt: 'desc' },
        select: { id: true, farmName: true, district: true, createdAt: true },
      }),
    ]);

    return res.json({
      success: true,
      stats: { totalUsers, totalFarms, totalHens, totalBookings, pendingVerifications, openComplaints },
      recentBookings,
      pendingFarms: recentFarms,
    });
  } catch (error) { next(error); }
};

/**
 * List all farms (Admin)
 */
exports.listAllFarms = async (req, res, next) => {
  try {
    const { isVerified, isActive, page = 1, limit = 20, search } = req.query;
    const where = {};
    if (isVerified !== undefined) where.isVerified = isVerified === 'true';
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) where.farmName = { contains: search, mode: 'insensitive' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [farms, total] = await Promise.all([
      prisma.farm.findMany({
        where,
        include: { owner: { select: { id: true, name: true, phone: true, email: true } }, _count: { select: { henInventory: true, bookings: true } } },
        skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      }),
      prisma.farm.count({ where }),
    ]);

    return res.json({ success: true, farms, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) { next(error); }
};

/**
 * Verify / Unverify Farm
 */
exports.verifyFarm = async (req, res, next) => {
  try {
    const { farmId } = req.params;
    const { action, reason } = req.body; // action: 'VERIFY' | 'UNVERIFY' | 'SUSPEND' | 'UNSUSPEND'

    const farm = await prisma.farm.findUnique({ where: { id: parseInt(farmId) } });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found.' });

    let updateData = {};

    if (action === 'VERIFY') {
      updateData = { isVerified: true, verificationBadge: 'Verified Farm', isActive: true };
    } else if (action === 'UNVERIFY') {
      updateData = { isVerified: false, verificationBadge: 'Unverified Farm' };
    } else if (action === 'SUSPEND') {
      updateData = { isActive: false, suspendedAt: new Date(), suspensionReason: reason };
    } else if (action === 'UNSUSPEND') {
      updateData = { isActive: true, suspendedAt: null, suspensionReason: null };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }

    const updated = await prisma.farm.update({ where: { id: farm.id }, data: updateData });

    // Audit log
    await prisma.securityAuditLog.create({
      data: {
        userId: req.user.id,
        action: `FARM_${action}`,
        details: `Farm ${farm.farmName} (${farm.id}): ${action}${reason ? ' — ' + reason : ''}`,
      },
    }).catch(() => {});

    // Notify farm owner
    const owner = await prisma.user.findUnique({ where: { id: farm.ownerId } });
    if (owner) {
      await prisma.notification.create({
        data: {
          userId: owner.id,
          title: `Farm ${action === 'VERIFY' ? 'Verified' : action === 'SUSPEND' ? 'Suspended' : 'Updated'}`,
          message: action === 'VERIFY'
            ? `Congratulations! Your farm "${farm.farmName}" has been verified by KodiKart.`
            : action === 'SUSPEND'
              ? `Your farm "${farm.farmName}" has been suspended. Reason: ${reason || 'Policy violation.'}`
              : `Your farm status has been updated.`,
          type: 'ADMIN_NOTIFICATION',
        },
      });
    }

    return res.json({ success: true, message: `Farm ${action} successful.`, farm: updated });
  } catch (error) { next(error); }
};

/**
 * Manage Platform Settings (commission, delivery rates, etc.)
 */
exports.getPlatformSettings = async (req, res, next) => {
  try {
    const settings = await prisma.platformSetting.findMany({ orderBy: { key: 'asc' } });
    return res.json({ success: true, settings });
  } catch (error) { next(error); }
};

exports.updatePlatformSetting = async (req, res, next) => {
  try {
    const { key, value, description } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ success: false, message: 'Key and value are required.' });
    }

    const setting = await prisma.platformSetting.upsert({
      where: { key },
      update: { value: String(value), ...(description && { description }) },
      create: { key, value: String(value), description },
    });

    // Audit log for critical settings
    if (key === 'platform_commission_rate') {
      await prisma.securityAuditLog.create({
        data: {
          userId: req.user.id,
          action: 'COMMISSION_RATE_CHANGED',
          details: `Platform commission rate changed to ${value}`,
        },
      }).catch(() => {});
    }

    return res.json({ success: true, message: 'Setting updated.', setting });
  } catch (error) { next(error); }
};

/**
 * List all users (Admin)
 */
exports.listUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 20, search } = req.query;
    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, phone: true, email: true, role: true, status: true, createdAt: true, lastLoginAt: true },
        skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({ success: true, users, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) { next(error); }
};

/**
 * Suspend or reinstate user
 */
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be ACTIVE or SUSPENDED.' });
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'ADMIN') return res.status(403).json({ success: false, message: 'Cannot modify admin accounts.' });

    await prisma.user.update({ where: { id: user.id }, data: { status } });

    await prisma.securityAuditLog.create({
      data: {
        userId: req.user.id,
        action: `USER_${status}`,
        details: `User ${user.name} (${user.id}) set to ${status}${reason ? ': ' + reason : ''}`,
      },
    }).catch(() => {});

    return res.json({ success: true, message: `User ${status === 'ACTIVE' ? 'reinstated' : 'suspended'}.` });
  } catch (error) { next(error); }
};

/**
 * Get security audit logs
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { action, userId, page = 1, limit = 50 } = req.query;
    const where = {};
    if (action) where.action = { contains: action };
    if (userId) where.userId = parseInt(userId);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      prisma.securityAuditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, role: true } } },
        skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      }),
      prisma.securityAuditLog.count({ where }),
    ]);

    return res.json({ success: true, logs, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) { next(error); }
};

/**
 * List complaints
 */
exports.listComplaints = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        customer: { select: { name: true, phone: true } },
        farm: { select: { farmName: true } },
        booking: { select: { bookingNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, complaints });
  } catch (error) { next(error); }
};

/**
 * Update complaint status
 */
exports.updateComplaint = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { status, resolutionNotes } = req.body;

    const complaint = await prisma.complaint.update({
      where: { id: parseInt(complaintId) },
      data: { status, resolutionNotes },
    });

    return res.json({ success: true, message: 'Complaint updated.', complaint });
  } catch (error) { next(error); }
};

/**
 * Financial summary
 */
exports.getFinancialSummary = async (req, res, next) => {
  try {
    const [totalCommission, totalFarmEarnings, pendingWithdrawals, completedBookings] = await Promise.all([
      prisma.platformCommissionLedger.aggregate({ _sum: { amount: true } }),
      prisma.farmEarningsLedger.aggregate({ where: { entryType: 'CREDIT_EARNING' }, _sum: { amount: true } }),
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
    ]);

    return res.json({
      success: true,
      summary: {
        totalPlatformCommission: totalCommission._sum.amount || 0,
        totalFarmEarnings: totalFarmEarnings._sum.amount || 0,
        pendingWithdrawals,
        completedBookings,
      },
    });
  } catch (error) { next(error); }
};

/**
 * List all bookings (Admin)
 */
exports.listAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { bookingNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { farm: { farmName: { contains: search } } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true } },
          farm: { select: { id: true, farmName: true, phone: true } },
          breed: { select: { id: true, name: true, teluguName: true } },
          assignedHens: { include: { hen: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return res.json({
      success: true,
      bookings,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    next(error);
  }
};
