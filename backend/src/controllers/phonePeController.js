// KodiKart PhonePe Payment Gateway Integration
// PhonePe Business PG API — Zero subscription cost, pay per transaction only
// Docs: https://developer.phonepe.com/v1/reference/pay-api
//
// SECURITY RULES:
// 1. Payment verification ALWAYS happens on backend via API/webhook
// 2. NEVER trust frontend payment success claims
// 3. Webhook signature verified with HMAC SHA256 before processing
// 4. Idempotency: each booking+type gets one payment record

const crypto = require('crypto');
const prisma = require('../config/db');
const { sendBookingNotification } = require('../utils/email');

// PhonePe API endpoints
const PHONEPE_ENDPOINTS = {
  production: 'https://api.phonepe.com/apis/hermes',
  sandbox: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
};

function getPhonePeBase() {
  const env = process.env.PHONEPE_ENV || 'sandbox';
  return PHONEPE_ENDPOINTS[env] || PHONEPE_ENDPOINTS.sandbox;
}

/**
 * Generate PhonePe checksum (X-VERIFY header)
 * Formula: SHA256(base64(payload) + '/pg/v1/pay' + saltKey) + '###' + saltIndex
 */
function generateChecksum(payload, endpoint) {
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const stringToHash = base64Payload + endpoint + saltKey;
  const hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
  return `${hash}###${saltIndex}`;
}

/**
 * Verify PhonePe webhook callback signature
 */
function verifyWebhookSignature(base64Response, checksum) {
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
  const stringToHash = base64Response + saltKey;
  const hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
  const computedChecksum = `${hash}###${saltIndex}`;
  return computedChecksum === checksum;
}

/**
 * Initiate Advance Payment via PhonePe PG
 * Customer pays 20% advance to confirm booking
 */
exports.initiateAdvancePayment = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { bookingId } = req.params;

    if (!process.env.PHONEPE_MERCHANT_ID || !process.env.PHONEPE_SALT_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Payment gateway not configured. Contact support.',
      });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: parseInt(bookingId), customerId, status: 'QUOTE_ACCEPTED' },
      include: { customer: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or not in correct status.' });
    }

    if (booking.advancePaid) {
      return res.status(400).json({ success: false, message: 'Advance already paid.' });
    }

    if (booking.isNoAdvanceAllowed) {
      return res.status(400).json({ success: false, message: 'No advance required for this booking.' });
    }

    // Idempotency: check for existing pending payment
    const existingPayment = await prisma.paymentLedger.findFirst({
      where: { bookingId: booking.id, paymentType: 'ADVANCE', paymentStatus: 'PENDING' },
    });

    // Generate unique merchant transaction ID
    const merchantTransactionId = existingPayment
      ? existingPayment.transactionReference
      : `KK-ADV-${booking.bookingNumber}-${Date.now()}`;

    const amountInPaise = Math.round(parseFloat(booking.advanceAmount) * 100); // PhonePe uses paise

    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: `USER-${customerId}`,
      amount: amountInPaise,
      redirectUrl: `${process.env.FRONTEND_URL}/customer/bookings/${bookingId}?payment=advance`,
      redirectMode: 'REDIRECT',
      callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/phonepe-webhook`,
      mobileNumber: booking.customer.phone,
      paymentInstrument: {
        type: 'PAY_PAGE', // Opens PhonePe checkout page (supports UPI, Card, Net Banking)
      },
    };

    const endpoint = '/pg/v1/pay';
    const checksum = generateChecksum(payload, endpoint);
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

    // Create pending payment record
    if (!existingPayment) {
      await prisma.paymentLedger.create({
        data: {
          bookingId: booking.id,
          paymentType: 'ADVANCE',
          amount: booking.advanceAmount,
          paymentMethod: 'PHONEPE',
          transactionReference: merchantTransactionId,
          paymentStatus: 'PENDING',
        },
      });
    }

    // Call PhonePe API
    const https = require('https');
    const response = await callPhonePeAPI(
      `${getPhonePeBase()}${endpoint}`,
      {
        request: base64Payload,
      },
      { 'X-VERIFY': checksum }
    );

    if (!response.success) {
      return res.status(502).json({ success: false, message: 'Payment gateway error. Please try again.' });
    }

    // Return payment URL to frontend
    const payUrl = response.data?.instrumentResponse?.redirectInfo?.url;
    if (!payUrl) {
      return res.status(502).json({ success: false, message: 'Could not generate payment link.' });
    }

    return res.json({
      success: true,
      paymentUrl: payUrl,
      merchantTransactionId,
      amount: booking.advanceAmount,
      message: 'Redirect customer to payment URL.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PhonePe Webhook Handler
 * PhonePe calls this URL after payment completion/failure
 * SECURITY: Verify signature BEFORE processing anything
 */
exports.phonePeWebhook = async (req, res, next) => {
  try {
    const { response } = req.body;
    const xVerify = req.headers['x-verify'];

    if (!response || !xVerify) {
      return res.status(400).json({ success: false, message: 'Invalid webhook payload.' });
    }

    // STEP 1: Verify webhook signature (critical security check)
    const isValid = verifyWebhookSignature(response, xVerify);
    if (!isValid) {
      // Log potential webhook spoofing attempt
      await prisma.securityAuditLog.create({
        data: {
          action: 'WEBHOOK_SIGNATURE_INVALID',
          ipAddress: req.ip,
          details: 'PhonePe webhook with invalid signature received',
        },
      }).catch(() => {});
      return res.status(401).json({ success: false, message: 'Invalid webhook signature.' });
    }

    // STEP 2: Decode and parse response
    const decoded = JSON.parse(Buffer.from(response, 'base64').toString('utf-8'));
    const { code, data } = decoded;

    if (!data?.merchantTransactionId) {
      return res.status(400).json({ success: false });
    }

    const merchantTransactionId = data.merchantTransactionId;
    const phonePeTransactionId = data.transactionId;

    // STEP 3: Find payment record by merchantTransactionId
    const payment = await prisma.paymentLedger.findFirst({
      where: { transactionReference: merchantTransactionId },
      include: { booking: { include: { customer: true, farm: { include: { owner: true } } } } },
    });

    if (!payment) {
      console.error('PhonePe webhook: No matching payment found for', merchantTransactionId);
      return res.status(200).json({ success: true }); // Always return 200 to PhonePe
    }

    // Idempotency: skip if already processed
    if (payment.paymentStatus === 'SUCCESS' || payment.paymentStatus === 'REFUNDED') {
      return res.status(200).json({ success: true });
    }

    const booking = payment.booking;

    if (code === 'PAYMENT_SUCCESS') {
      // STEP 4: Update payment as successful
      await prisma.$transaction(async (tx) => {
        await tx.paymentLedger.update({
          where: { id: payment.id },
          data: {
            paymentStatus: 'SUCCESS',
            gatewayResponse: JSON.stringify(data),
            verifiedAt: new Date(),
            transactionReference: `${merchantTransactionId}|${phonePeTransactionId}`,
          },
        });

        if (payment.paymentType === 'ADVANCE') {
          await tx.booking.update({
            where: { id: booking.id },
            data: { advancePaid: true, status: 'CONFIRMED' },
          });
        } else if (payment.paymentType === 'REMAINING') {
          await tx.booking.update({
            where: { id: booking.id },
            data: { remainingPaid: true },
          });
        }
      });

      // Notify farm owner
      if (payment.paymentType === 'ADVANCE' && booking.farm?.owner?.email) {
        await sendBookingNotification({
          to: booking.farm.owner.email,
          name: booking.farm.owner.name,
          subject: `Payment Received — ${booking.bookingNumber}`,
          message: `Customer has paid the advance of ₹${booking.advanceAmount} for booking ${booking.bookingNumber}. Booking is now CONFIRMED.`,
        });

        await prisma.notification.create({
          data: {
            userId: booking.farm.ownerId,
            title: 'Advance Payment Confirmed',
            message: `₹${booking.advanceAmount} advance received for ${booking.bookingNumber}`,
            type: 'PAYMENT',
          },
        }).catch(() => {});
      }

      // Log successful payment
      await prisma.securityAuditLog.create({
        data: {
          userId: booking.customerId,
          action: 'PAYMENT_SUCCESS',
          details: `PhonePe payment success: ${merchantTransactionId} | Booking: ${booking.bookingNumber}`,
        },
      }).catch(() => {});
    } else {
      // Payment failed
      await prisma.paymentLedger.update({
        where: { id: payment.id },
        data: {
          paymentStatus: 'FAILED',
          gatewayResponse: JSON.stringify(data),
        },
      });

      await prisma.securityAuditLog.create({
        data: {
          userId: booking.customerId,
          action: 'PAYMENT_FAILED',
          details: `PhonePe payment failed: ${code} | ${merchantTransactionId}`,
        },
      }).catch(() => {});
    }

    // Always return 200 to PhonePe (they retry on non-200)
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('PhonePe webhook error:', error);
    return res.status(200).json({ success: true }); // Always 200 to prevent retries
  }
};

/**
 * Check payment status manually (for frontend polling after redirect)
 */
exports.checkPaymentStatus = async (req, res, next) => {
  try {
    const { merchantTransactionId } = req.params;
    const userId = req.user.id;

    const payment = await prisma.paymentLedger.findFirst({
      where: {
        transactionReference: { contains: merchantTransactionId },
        booking: { customerId: userId },
      },
      include: { booking: { select: { bookingNumber: true, status: true, advancePaid: true } } },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    // If still PENDING, verify directly with PhonePe
    if (payment.paymentStatus === 'PENDING' && process.env.PHONEPE_MERCHANT_ID) {
      const endpoint = `/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;
      const saltKey = process.env.PHONEPE_SALT_KEY;
      const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
      const stringToHash = endpoint + saltKey;
      const hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
      const checksum = `${hash}###${saltIndex}`;

      const statusResponse = await callPhonePeAPI(
        `${getPhonePeBase()}${endpoint}`,
        null,
        { 'X-VERIFY': checksum, 'X-MERCHANT-ID': process.env.PHONEPE_MERCHANT_ID },
        'GET'
      );

      if (statusResponse?.data?.code === 'PAYMENT_SUCCESS') {
        // Update if webhook was missed
        await prisma.paymentLedger.update({
          where: { id: payment.id },
          data: { paymentStatus: 'SUCCESS', verifiedAt: new Date() },
        });
        payment.paymentStatus = 'SUCCESS';
      }
    }

    return res.json({
      success: true,
      payment: {
        status: payment.paymentStatus,
        type: payment.paymentType,
        amount: payment.amount,
        bookingStatus: payment.booking?.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Make HTTP call to PhonePe API
 */
function callPhonePeAPI(url, body, extraHeaders = {}, method = 'POST') {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const { URL } = require('url');
    const parsed = new URL(url);

    const bodyStr = body ? JSON.stringify(body) : '';

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...extraHeaders,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ success: false, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}
