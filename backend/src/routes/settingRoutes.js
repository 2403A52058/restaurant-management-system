const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', settingController.getSettings); // Public/read-only for layout & currency
router.put('/', authenticate, authorize(['ADMIN', 'MANAGER']), settingController.updateSettings);

module.exports = router;
