const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/stats', dashboardController.getStats);
router.get('/sales-charts', dashboardController.getSalesCharts);
router.get('/recent-orders', dashboardController.getRecentOrders);

module.exports = router;
