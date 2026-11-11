// KodiKart Payment Controller
// IMPORTANT: All payment verification happens on the backend
// NEVER trust frontend payment success claims

const prisma = require('../config/db');
const { sendBookingNotification } = require('../utils/email');

/**
 * Manual payment recording (for testing without gateway)
 * In production: replace with Razorpay webhook verification
 */
exports.recordPayment = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { bookingId, paymentType, paymentMethod = 'UPI', transactionReference } = req.body;

    const booking = await prisma.booking.findFirst({
      where: { id: parseInt(bookingId), customerId },
      include: { farm: { include: { owner: true } } },
    });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    // Validate payment type and state
    if (paymentType === 'ADVANCE') {
      if (booking.status !== 'QUOTE_ACCEPTED') {
        return res.status(400).json({ success: false, message: 'Advance can only be paid after accepting quotation.' });
      }
      if (booking.advancePaid) {
        return res.status(400).json({ success: false, message: 'Advance already paid.' });
      }
      if (booking.isNoAdvanceAllowed) {
        return res.status(400).json({ success: false, message: 'No advance required for this booking.' });
      }

      await prisma.$transaction([
        prisma.paymentLedger.create({
          data: {
            bookingId: booking.id,
            paymentType: 'ADVANCE',
            amount: booking.advanceAmount,
            paymentMethod,
            transactionReference: transactionReference?.trim(),
            paymentStatus: 'SUCCESS',
            verifiedAt: new Date(),
          },
        }),
        prisma.booking.update({
          where: { id: booking.id },
          data: { advancePaid: true, status: 'CONFIRMED' },
        }),
      ]);

      // Notify farm owner
      if (booking.farm.owner?.email) {
        await sendBookingNotification({
          to: booking.farm.owner.email,
          name: booking.farm.owner.name,
          subject: `Advance Received: ${booking.bookingNumber} — KodiKart`,
          message: `Customer has paid the advance of ₹${booking.advanceAmount} for booking ${booking.bookingNumber}. Booking is now CONFIRMED. Prepare the hens.`,
        });
      }

      await prisma.notification.create({
        data: {
          userId: booking.farm.ownerId,
          title: 'Advance Payment Received',
          message: `Advance ₹${booking.advanceAmount} received for ${booking.bookingNumber}. Booking confirmed.`,
          type: 'PAYMENT',
        },
      });

      return res.json({ success: true, message: 'Advance payment recorded. Booking confirmed.', status: 'CONFIRMED' });
    }

    if (paymentType === 'REMAINING') {
      if (!booking.advancePaid && !booking.isNoAdvanceAllowed) {
        return res.status(400).json({ success: false, message: 'Advance must be paid first.' });
      }
      if (booking.remainingPaid) {
        return res.status(400).json({ success: false, message: 'Remaining amount already paid.' });
      }

      await prisma.$transaction([
        prisma.paymentLedger.create({
          data: {
            bookingId: booking.id,
            paymentType: 'REMAINING',
            amount: booking.remainingAmount,
            paymentMethod,
            transactionReference: transactionReference?.trim(),
            paymentStatus: 'SUCCESS',
            verifiedAt: new Date(),
          },
        }),
        prisma.booking.update({
          where: { id: booking.id },
          data: { remainingPaid: true },
        }),
      ]);

      return res.json({ success: true, message: 'Remaining payment recorded.', status: booking.status });
    }

    return res.status(400).json({ success: false, message: 'Invalid payment type.' });
  } catch (error) { next(error); }
};

/**
 * Get payment history for a booking
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        OR: [
          { customerId: userId },
          { farm: { ownerId: userId } },
        ],
      },
    });

    if (!booking && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const payments = await prisma.paymentLedger.findMany({
      where: { bookingId: parseInt(bookingId) },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, payments });
  } catch (error) { next(error); }
};

/**
 * Farm earnings summary
 */
exports.getFarmEarnings = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    let targetFarmId = req.params.farmId ? parseInt(req.params.farmId) : null;

    if (!targetFarmId) {
      const userFarm = await prisma.farm.findFirst({ where: { ownerId } });
      if (!userFarm) {
        return res.json({
          success: true,
          summary: { currentBalance: 0, totalEarned: 0, totalWithdrawn: 0 },
          ledger: [],
          withdrawals: [],
        });
      }
      targetFarmId = userFarm.id;
    } else if (req.user.role !== 'ADMIN') {
      const farm = await prisma.farm.findFirst({ where: { id: targetFarmId, ownerId } });
      if (!farm) return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const [ledger, withdrawals] = await Promise.all([
      prisma.farmEarningsLedger.findMany({
        where: { farmId: targetFarmId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.withdrawalRequest.findMany({
        where: { farmId: targetFarmId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const latestEntry = ledger[0];
    const currentBalance = latestEntry ? parseFloat(latestEntry.balanceAfter) : 0;
    const totalEarned = ledger
      .filter(e => e.entryType === 'CREDIT_EARNING')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalWithdrawn = ledger
      .filter(e => e.entryType === 'DEBIT_WITHDRAWAL')
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return res.json({
      success: true,
      summary: { currentBalance, totalEarned, totalWithdrawn },
      ledger,
      withdrawals,
    });
  } catch (error) { next(error); }
};

/**
 * Request withdrawal (Farm Owner)
 */
exports.requestWithdrawal = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    let { farmId, amount, accountHolder, bankName, accountNumber, ifscCode, upiId } = req.body;

    let farm;
    if (farmId) {
      farm = await prisma.farm.findFirst({ where: { id: parseInt(farmId), ownerId } });
    } else {
      farm = await prisma.farm.findFirst({ where: { ownerId } });
    }
    if (!farm) return res.status(403).json({ success: false, message: 'Farm not found.' });

    // Check balance
    const latestEntry = await prisma.farmEarningsLedger.findFirst({
      where: { farmId: farm.id },
      orderBy: { createdAt: 'desc' },
    });
    const currentBalance = latestEntry ? parseFloat(latestEntry.balanceAfter) : 0;

    if (parseFloat(amount) > currentBalance) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Available: ₹${currentBalance.toFixed(2)}` });
    }

    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        farmId: parseInt(farmId),
        amount: parseFloat(amount).toFixed(2),
        accountHolder: accountHolder.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
        upiId: upiId?.trim(),
        status: 'PENDING',
      },
    });

    // Notify admin
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'Withdrawal Request',
          message: `Farm "${farm.farmName}" requested withdrawal of ₹${amount}`,
          type: 'WITHDRAWAL_REQUEST',
        },
      });
    }

    return res.status(201).json({ success: true, message: 'Withdrawal request submitted. Admin will process it.', withdrawal });
  } catch (error) { next(error); }
};
