// KodiKart Admin Routes
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/farms', adminController.listAllFarms);
router.put('/farms/:farmId/action', adminController.verifyFarm);
router.get('/users', adminController.listUsers);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.get('/settings', adminController.getPlatformSettings);
router.put('/settings', strictLimiter, adminController.updatePlatformSetting);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/complaints', adminController.listComplaints);
router.put('/complaints/:complaintId', adminController.updateComplaint);
router.get('/financials', adminController.getFinancialSummary);
router.get('/bookings', adminController.listAllBookings);

module.exports = router;
