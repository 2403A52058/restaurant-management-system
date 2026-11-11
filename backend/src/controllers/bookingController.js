// KodiKart Booking Controller
// Implements the complete 18-step booking and quotation workflow
// Uses DB transactions for atomic hen reservation (prevents double-booking)

const prisma = require('../config/db');
const { calculateBookingFinancials, calculateDeliveryFee } = require('../utils/commission');
const { generateOTP, hashOTP, verifyOTP, isOTPExpired, getOTPExpiry } = require('../utils/otp');
const { sendHandoverOTP, sendBookingNotification } = require('../utils/email');

/**
 * Step 1-5: Customer submits booking request
 */
exports.createBooking = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const {
      farmId, breedId,
      requestedQuantity, desiredWeightKg,
      deliveryType = 'PICKUP',
      deliveryAddress, deliveryLatitude, deliveryLongitude,
    } = req.body;

    // Validate required fields
    if (!farmId || !breedId || !requestedQuantity || !desiredWeightKg) {
      return res.status(400).json({ success: false, message: 'Farm, breed, quantity, and desired weight are required.' });
    }

    if (parseInt(requestedQuantity) < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
    }

    if (parseFloat(desiredWeightKg) > 2.5 * parseInt(requestedQuantity)) {
      return res.status(400).json({ success: false, message: 'Desired weight exceeds maximum (2.5 kg per hen).' });
    }

    if (deliveryType === 'DELIVERY' && !deliveryAddress) {
      return res.status(400).json({ success: false, message: 'Delivery address is required for home delivery.' });
    }

    // Verify farm is active
    const farm = await prisma.farm.findFirst({
      where: { id: parseInt(farmId), isActive: true },
    });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found or not active.' });

    // Verify breed is offered by this farm
    const farmBreed = await prisma.farmBreed.findFirst({
      where: { farmId: parseInt(farmId), breedId: parseInt(breedId), isActive: true },
    });
    if (!farmBreed) {
      return res.status(404).json({ success: false, message: 'This breed is not available at this farm.' });
    }

    // Check available hen count
    const availableCount = await prisma.henInventory.count({
      where: { farmId: parseInt(farmId), breedId: parseInt(breedId), status: 'AVAILABLE' },
    });
    if (availableCount < parseInt(requestedQuantity)) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableCount} hen(s) available. You requested ${requestedQuantity}.`,
      });
    }

    // Generate booking number
    const bookingNumber = `KK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Get platform commission from settings
    const commissionSetting = await prisma.platformSetting.findUnique({ where: { key: 'platform_commission_rate' } });
    const commissionRate = commissionSetting ? parseFloat(commissionSetting.value) : 0.03;

    // Create booking record (status: REQUESTED — farm owner must respond)
    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        customerId,
        farmId: parseInt(farmId),
        breedId: parseInt(breedId),
        requestedQuantity: parseInt(requestedQuantity),
        desiredWeightKg: parseFloat(desiredWeightKg).toFixed(2),
        deliveryType,
        deliveryAddress: deliveryAddress?.trim(),
        deliveryLatitude: deliveryLatitude ? parseFloat(deliveryLatitude) : null,
        deliveryLongitude: deliveryLongitude ? parseFloat(deliveryLongitude) : null,
        commissionRate,
        status: 'REQUESTED',
      },
    });

    // Notify farm owner
    const farmOwner = await prisma.user.findUnique({ where: { id: farm.ownerId } });
    if (farmOwner?.email) {
      await sendBookingNotification({
        to: farmOwner.email,
        name: farmOwner.name,
        subject: `New Booking Request ${bookingNumber} — KodiKart`,
        message: `You have a new booking request (${bookingNumber}) for ${requestedQuantity} ${deliveryType === 'DELIVERY' ? 'with delivery' : 'pickup'} hens. Please log in to review and assign hens.`,
      });
    }

    // In-app notification for farm owner
    await prisma.notification.create({
      data: {
        userId: farm.ownerId,
        title: 'New Booking Request',
        message: `New request ${bookingNumber} for ${requestedQuantity} hens`,
        type: 'BOOKING_REQUEST',
        link: `/farm-owner/bookings/${booking.id}`,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Booking request submitted. Farm owner will review and send a quotation.',
      booking: { id: booking.id, bookingNumber: booking.bookingNumber, status: booking.status },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Steps 7-10: Farm owner assigns hens and generates quotation
 */
exports.generateQuotation = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { bookingId } = req.params;
    const { henIds, notes } = req.body;

    if (!henIds || !Array.isArray(henIds) || henIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one hen.' });
    }

    // Fetch booking and verify farm ownership
    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        status: 'REQUESTED',
        farm: { ownerId },
      },
      include: { farm: true, customer: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or cannot be quoted.' });
    }

    // Use DB transaction for atomic hen assignment (prevents race conditions)
    const result = await prisma.$transaction(async (tx) => {
      // Lock and verify all selected hens are available and belong to this farm
      const hens = await tx.henInventory.findMany({
        where: {
          id: { in: henIds.map(Number) },
          farmId: booking.farmId,
          breedId: booking.breedId,
          status: 'AVAILABLE',
        },
      });

      if (hens.length !== henIds.length) {
        throw new Error(`${henIds.length - hens.length} selected hen(s) are no longer available.`);
      }

      if (hens.length !== booking.requestedQuantity) {
        throw new Error(`Please assign exactly ${booking.requestedQuantity} hen(s) as requested.`);
      }

      // Atomically reserve all hens
      await tx.henInventory.updateMany({
        where: { id: { in: henIds.map(Number) } },
        data: { status: 'RESERVED' },
      });

      // Calculate totals
      let totalWeight = 0;
      const henItems = hens.map(hen => {
        const henWeight = parseFloat(hen.actualWeight);
        const henPrice = parseFloat(hen.pricePerKg);
        const itemTotal = Math.round(henWeight * henPrice * 100) / 100;
        totalWeight += henWeight;
        return {
          bookingId: booking.id,
          henInventoryId: hen.id,
          confirmedWeightKg: henWeight.toFixed(2),
          pricePerKg: henPrice.toFixed(2),
          itemTotal: itemTotal.toFixed(2),
        };
      });

      // Get delivery settings for fee calculation
      const deliverySettings = await getDeliverySettings(tx);
      let deliveryFee = 0;
      let deliveryDistanceKm = 0;

      if (booking.deliveryType === 'DELIVERY' && booking.deliveryLatitude && booking.deliveryLongitude) {
        const result = calculateDeliveryFee(
          booking.farm.latitude, booking.farm.longitude,
          booking.deliveryLatitude, booking.deliveryLongitude,
          deliverySettings
        );
        if (result.error) throw new Error(result.error);
        deliveryFee = result.fee;
        deliveryDistanceKm = result.distanceKm;
      }

      // Calculate final amounts
      const financials = calculateBookingFinancials(
        totalWeight,
        hens[0].pricePerKg, // All hens have same breed price
        booking.commissionRate,
        deliveryFee
      );

      // Create hen item records
      await tx.bookingHenItem.createMany({ data: henItems });

      // Update booking with quotation
      const quotationExpiresAt = new Date();
      quotationExpiresAt.setHours(quotationExpiresAt.getHours() + 24); // 24hr to accept

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          totalHenWeightKg: totalWeight.toFixed(2),
          farmBaseAmount: financials.farmBaseAmount.toFixed(2),
          commissionRate: booking.commissionRate,
          platformCommissionAmount: financials.platformCommissionAmount.toFixed(2),
          customerHenAmount: financials.customerHenAmount.toFixed(2),
          deliveryDistanceKm: deliveryDistanceKm.toFixed(2),
          deliveryFee: financials.deliveryFee.toFixed(2),
          finalTotalAmount: financials.finalTotalAmount.toFixed(2),
          advanceAmount: financials.advanceAmount.toFixed(2),
          remainingAmount: financials.remainingAmount.toFixed(2),
          quotationNotes: notes?.trim(),
          quotationCreatedAt: new Date(),
          quotationExpiresAt,
          status: 'QUOTED',
        },
      });

      return { booking: updated, financials, hens };
    });

    // Notify customer
    if (booking.customer?.email) {
      await sendBookingNotification({
        to: booking.customer.email,
        name: booking.customer.name,
        subject: `Quotation Ready: ${booking.bookingNumber} — KodiKart`,
        message: `Your quotation for booking ${booking.bookingNumber} is ready. Total: ₹${result.financials.finalTotalAmount}. Advance required: ₹${result.financials.advanceAmount}. Please log in to accept or reject within 24 hours.`,
      });
    }

    await prisma.notification.create({
      data: {
        userId: booking.customerId,
        title: 'Quotation Ready',
        message: `Your quotation for ${booking.bookingNumber} is ready. Total: ₹${result.financials.finalTotalAmount}`,
        type: 'QUOTATION',
        link: `/customer/bookings/${booking.id}`,
      },
    });

    return res.json({
      success: true,
      message: 'Quotation generated and sent to customer.',
      booking: result.booking,
      financials: result.financials,
    });
  } catch (error) {
    if (error.message.includes('no longer available') || error.message.includes('assign exactly')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * Steps 11-13: Customer accepts or rejects quotation
 */
exports.respondToQuotation = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { bookingId } = req.params;
    const { action } = req.body; // 'ACCEPT' or 'REJECT'

    if (!['ACCEPT', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be ACCEPT or REJECT.' });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: parseInt(bookingId), customerId, status: 'QUOTED' },
      include: { assignedHens: { include: { hen: true } } },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Quotation not found or already responded to.' });
    }

    // Check expiry
    if (booking.quotationExpiresAt && new Date() > booking.quotationExpiresAt) {
      await releaseReservedHens(booking);
      await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
      return res.status(410).json({ success: false, message: 'Quotation has expired. Please create a new booking.' });
    }

    if (action === 'REJECT') {
      // Release hens back to inventory
      await releaseReservedHens(booking);
      await prisma.booking.update({ where: { id: booking.id }, data: { status: 'QUOTE_REJECTED' } });

      // Notify farm owner
      const farm = await prisma.farm.findUnique({ where: { id: booking.farmId }, include: { owner: true } });
      await prisma.notification.create({
        data: {
          userId: farm.ownerId,
          title: 'Quotation Rejected',
          message: `Customer rejected quotation for ${booking.bookingNumber}. Hens released.`,
          type: 'QUOTATION_REJECTED',
        },
      });

      return res.json({ success: true, message: 'Quotation rejected. Hens have been released.' });
    }

    // ACCEPT — mark quotation accepted; payment must follow
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'QUOTE_ACCEPTED' },
    });

    return res.json({
      success: true,
      message: booking.isNoAdvanceAllowed
        ? 'Booking confirmed. No advance required (trusted customer). Pay at pickup/delivery.'
        : `Quotation accepted. Please pay the advance of ₹${booking.advanceAmount} to confirm your booking.`,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: 'QUOTE_ACCEPTED',
        advanceAmount: booking.advanceAmount,
        isNoAdvanceAllowed: booking.isNoAdvanceAllowed,
        finalTotalAmount: booking.finalTotalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Customer Bookings
 */
exports.getCustomerBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = { customerId: req.user.id };
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          farm: { select: { id: true, farmName: true, slug: true, isVerified: true } },
          breed: { select: { id: true, name: true } },
          assignedHens: { include: { hen: { select: { henId: true, actualWeight: true, photoUrl: true } } } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return res.json({ success: true, bookings, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Farm Owner Bookings
 */
exports.getFarmBookings = async (req, res, next) => {
  try {
    const { farmId } = req.params;
    const ownerId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const farm = await prisma.farm.findFirst({ where: { id: parseInt(farmId), ownerId } });
    if (!farm) return res.status(403).json({ success: false, message: 'Access denied.' });

    const where = { farmId: parseInt(farmId) };
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true } },
          breed: { select: { id: true, name: true } },
          assignedHens: { include: { hen: { select: { henId: true, actualWeight: true } } } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return res.json({ success: true, bookings, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate & Send Handover OTP (Farm Owner triggers when ready to hand over)
 * SECURITY: OTP sent ONLY to customer's email — never displayed to farm owner
 */
exports.initiateHandover = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { bookingId } = req.params;

    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        status: 'CONFIRMED',
        farm: { ownerId },
      },
      include: {
        customer: true,
        farm: true,
        assignedHens: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or not in CONFIRMED status.' });
    }

    // Generate handover OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 30); // 30 minutes

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        handoverOtpHash: otpHash,
        handoverOtpExpiresAt: otpExpiry,
        handoverOtpAttempts: 0,
        status: 'READY_FOR_HANDOVER',
      },
    });

    // Send OTP ONLY to customer — never to farm owner
    const emailResult = await sendHandoverOTP({
      to: booking.customer.email,
      customerName: booking.customer.name,
      otp,
      bookingNumber: booking.bookingNumber,
      farmName: booking.farm.farmName,
      henCount: booking.assignedHens.length,
    });

    // Log security event
    await prisma.securityAuditLog.create({
      data: {
        userId: ownerId,
        action: 'HANDOVER_OTP_GENERATED',
        details: `Handover OTP generated for booking ${booking.bookingNumber} — sent to customer`,
      },
    }).catch(() => {});

    return res.json({
      success: true,
      message: `Handover OTP sent to customer's email (${booking.customer.email.substring(0, 3)}***). Ask customer to share the OTP to complete handover.`,
      // SECURITY: OTP is NOT included in this response
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Handover OTP (Farm Owner enters OTP shared by customer)
 * Marks order as COMPLETED
 */
exports.verifyHandoverOTP = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { bookingId } = req.params;
    const { otp } = req.body;

    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Enter the 6-digit OTP from the customer.' });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: parseInt(bookingId),
        status: 'READY_FOR_HANDOVER',
        farm: { ownerId },
      },
      include: { customer: true, farm: true, assignedHens: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Attempt limit check
    if (booking.handoverOtpAttempts >= 5) {
      await prisma.securityAuditLog.create({
        data: {
          userId: ownerId,
          action: 'HANDOVER_OTP_MAX_ATTEMPTS',
          details: `Booking ${booking.bookingNumber}: max handover OTP attempts exceeded`,
        },
      }).catch(() => {});
      return res.status(429).json({ success: false, message: 'Too many failed OTP attempts. Contact support.' });
    }

    // Expiry check
    if (isOTPExpired(booking.handoverOtpExpiresAt)) {
      return res.status(401).json({ success: false, message: 'Handover OTP has expired. Regenerate it.' });
    }

    // Verify OTP
    const isValid = await verifyOTP(otp, booking.handoverOtpHash);

    if (!isValid) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { handoverOtpAttempts: { increment: 1 } },
      });
      return res.status(401).json({
        success: false,
        message: `Invalid OTP. ${5 - booking.handoverOtpAttempts - 1} attempts remaining.`,
      });
    }

    // OTP valid — complete the booking
    await prisma.$transaction(async (tx) => {
      // Mark booking completed
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'COMPLETED',
          handoverOtpHash: null, // Clear OTP (single-use)
          handoverCompletedAt: new Date(),
          handoverVerifiedBy: ownerId,
        },
      });

      // Mark hens as SOLD
      const henIds = booking.assignedHens.map(item => item.henInventoryId);
      await tx.henInventory.updateMany({
        where: { id: { in: henIds } },
        data: { status: 'SOLD' },
      });

      // Credit farm earnings (farm amount — before commission, 100% of their price)
      const farmBalance = await tx.farmEarningsLedger.findFirst({
        where: { farmId: booking.farmId },
        orderBy: { createdAt: 'desc' },
        select: { balanceAfter: true },
      });
      const prevBalance = farmBalance ? parseFloat(farmBalance.balanceAfter) : 0;
      const newBalance = prevBalance + parseFloat(booking.farmBaseAmount);

      await tx.farmEarningsLedger.create({
        data: {
          farmId: booking.farmId,
          bookingId: booking.id,
          entryType: 'CREDIT_EARNING',
          amount: booking.farmBaseAmount,
          balanceAfter: newBalance.toFixed(2),
          notes: `Booking ${booking.bookingNumber} completed`,
        },
      });

      // Record platform commission separately
      await tx.platformCommissionLedger.create({
        data: {
          bookingId: booking.id,
          commissionRate: booking.commissionRate,
          amount: booking.platformCommissionAmount,
        },
      });
    });

    // Audit log
    await prisma.securityAuditLog.create({
      data: {
        userId: ownerId,
        action: 'HANDOVER_COMPLETED',
        details: `Booking ${booking.bookingNumber} handover verified and completed`,
      },
    }).catch(() => {});

    // Notify customer
    if (booking.customer?.email) {
      await sendBookingNotification({
        to: booking.customer.email,
        name: booking.customer.name,
        subject: `Order Completed: ${booking.bookingNumber} — KodiKart`,
        message: `Your order ${booking.bookingNumber} has been completed. Your hens have been handed over. Thank you for shopping on KodiKart!`,
      });
    }

    return res.json({
      success: true,
      message: 'Handover verified. Order marked as COMPLETED. Earnings credited.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Booking By ID
 * Accessible by: Customer (who placed it), Farm Owner (whose farm it is), Admin
 */
exports.getBookingById = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        farm: { select: { id: true, farmName: true, slug: true, phone: true, whatsapp: true, address: true, isVerified: true, ownerId: true } },
        breed: { select: { id: true, name: true, teluguName: true } },
        assignedHens: {
          include: {
            hen: { select: { id: true, henId: true, actualWeight: true, pricePerKg: true, photoUrl: true } },
          },
        },
        payments: true,
        review: true,
        complaint: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (role !== 'ADMIN' && booking.customerId !== userId && booking.farm.ownerId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// Helper: Release reserved hens when booking rejected/expired
async function releaseReservedHens(booking) {
  const henIds = booking.assignedHens.map(item => item.henInventoryId);
  if (henIds.length > 0) {
    await prisma.henInventory.updateMany({
      where: { id: { in: henIds } },
      data: { status: 'AVAILABLE' },
    });
  }
  if (booking.assignedHens.length > 0) {
    await prisma.bookingHenItem.deleteMany({ where: { bookingId: booking.id } });
  }
}

// Helper: Get delivery settings from platform settings
async function getDeliverySettings(tx) {
  const settings = await tx.platformSetting.findMany({
    where: {
      key: { in: ['delivery_base_fee', 'delivery_per_km_rate', 'delivery_free_radius_km', 'delivery_max_distance_km'] },
    },
  });
  const map = {};
  settings.forEach(s => { map[s.key] = parseFloat(s.value); });
  return {
    baseFee: map['delivery_base_fee'] || 50,
    perKmRate: map['delivery_per_km_rate'] || 10,
    freeDeliveryRadiusKm: map['delivery_free_radius_km'] || 0,
    maxDeliveryDistanceKm: map['delivery_max_distance_km'] || 50,
  };
}
