const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');

// Public or authenticated reading
router.get('/categories', menuController.getCategories);
router.get('/items', menuController.getMenuItems);
router.get('/items/:id', menuController.getMenuItemById);

// Write operations (Staff / Admin)
router.use(authenticate);
router.post('/categories', authorize(['ADMIN', 'MANAGER']), menuController.createCategory);
router.put('/categories/:id', authorize(['ADMIN', 'MANAGER']), menuController.updateCategory);
router.delete('/categories/:id', authorize(['ADMIN', 'MANAGER']), menuController.deleteCategory);

router.post('/items', authorize(['ADMIN', 'MANAGER', 'CHEF']), menuController.createMenuItem);
router.put('/items/:id', authorize(['ADMIN', 'MANAGER', 'CHEF']), menuController.updateMenuItem);
router.patch('/items/:id/toggle-availability', authorize(['ADMIN', 'MANAGER', 'CHEF', 'WAITER']), menuController.toggleAvailability);
router.delete('/items/:id', authorize(['ADMIN', 'MANAGER']), menuController.deleteMenuItem);

module.exports = router;
