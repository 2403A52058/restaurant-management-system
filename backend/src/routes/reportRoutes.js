const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/sales', reportController.getSalesReport);
router.get('/popular-items', reportController.getPopularItems);
router.get('/export-csv', authorize(['ADMIN', 'MANAGER']), reportController.exportCSV);

module.exports = router;
