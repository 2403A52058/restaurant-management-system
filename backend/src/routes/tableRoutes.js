const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', tableController.getTables);
router.post('/', authorize(['ADMIN', 'MANAGER']), tableController.createTable);
router.put('/:id', authorize(['ADMIN', 'MANAGER']), tableController.updateTable);
router.patch('/:id/status', authorize(['ADMIN', 'MANAGER', 'WAITER', 'CASHIER']), tableController.updateTableStatus);
router.delete('/:id', authorize(['ADMIN']), tableController.deleteTable);

module.exports = router;
