const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', employeeController.getEmployees);
router.get('/roles', employeeController.getRoles);
router.post('/', authorize(['ADMIN', 'MANAGER']), employeeController.createEmployee);
router.put('/:id', authorize(['ADMIN', 'MANAGER']), employeeController.updateEmployee);
router.patch('/:id/toggle-status', authorize(['ADMIN', 'MANAGER']), employeeController.toggleAccountStatus);
router.delete('/:id', authorize(['ADMIN']), employeeController.deleteEmployee);

module.exports = router;
