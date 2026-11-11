// KodiKart Review & Notification Routes
const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(apiLimiter);

// --- REVIEWS ---

// Submit review (Customer — only after COMPLETED booking)
router.post('/reviews', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;
    if (!bookingId || !rating) return res.status(400).json({ success: false, message: 'Booking and rating required.' });
    if (rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be 1–5.' });

    const booking = await prisma.booking.findFirst({
      where: { id: parseInt(bookingId), customerId: req.user.id, status: 'COMPLETED' },
    });
    if (!booking) return res.status(404).json({ success: false, message: 'No completed booking found.' });

    const existing = await prisma.review.findUnique({ where: { bookingId: booking.id } });
    if (existing) return res.status(409).json({ success: false, message: 'Review already submitted.' });

    const review = await prisma.review.create({
      data: { bookingId: booking.id, customerId: req.user.id, farmId: booking.farmId, rating: parseInt(rating), comment: comment?.trim() },
    });

    // Update farm rating
    const reviews = await prisma.review.findMany({ where: { farmId: booking.farmId }, select: { rating: true } });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await prisma.farm.update({ where: { id: booking.farmId }, data: { rating: parseFloat(avg.toFixed(1)), totalReviews: reviews.length } });

    return res.status(201).json({ success: true, message: 'Review submitted.', review });
  } catch (error) { next(error); }
});

// Get reviews for a farm (Public)
router.get('/reviews/farm/:farmId', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { farmId: parseInt(req.params.farmId) },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json({ success: true, reviews });
  } catch (error) { next(error); }
});

// --- COMPLAINTS ---

// Submit complaint (Customer)
router.post('/complaints', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const { bookingId, farmId, subject, description } = req.body;
    if (!subject || !description) return res.status(400).json({ success: false, message: 'Subject and description required.' });

    const complaint = await prisma.complaint.create({
      data: {
        customerId: req.user.id,
        bookingId: bookingId ? parseInt(bookingId) : null,
        farmId: farmId ? parseInt(farmId) : null,
        subject: subject.trim(),
        description: description.trim(),
      },
    });
    return res.status(201).json({ success: true, message: 'Complaint submitted. We will respond within 2 business days.', complaint });
  } catch (error) { next(error); }
});

// --- NOTIFICATIONS ---

// Get my notifications
router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json({ success: true, notifications });
  } catch (error) { next(error); }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: parseInt(req.params.id), userId: req.user.id },
      data: { isRead: true },
    });
    return res.json({ success: true });
  } catch (error) { next(error); }
});

// Mark all as read
router.put('/notifications/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return res.json({ success: true });
  } catch (error) { next(error); }
});

module.exports = router;
