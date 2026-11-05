const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Ingredients
router.get('/ingredients', inventoryController.getIngredients);
router.post('/ingredients', authorize(['ADMIN', 'MANAGER', 'CHEF']), inventoryController.createIngredient);
router.put('/ingredients/:id', authorize(['ADMIN', 'MANAGER', 'CHEF']), inventoryController.updateIngredient);
router.delete('/ingredients/:id', authorize(['ADMIN', 'MANAGER']), inventoryController.deleteIngredient);

// Suppliers
router.get('/suppliers', inventoryController.getSuppliers);
router.post('/suppliers', authorize(['ADMIN', 'MANAGER']), inventoryController.createSupplier);
router.put('/suppliers/:id', authorize(['ADMIN', 'MANAGER']), inventoryController.updateSupplier);
router.delete('/suppliers/:id', authorize(['ADMIN']), inventoryController.deleteSupplier);

// Transactions
router.get('/transactions', inventoryController.getTransactions);
router.post('/transactions', authorize(['ADMIN', 'MANAGER', 'CHEF']), inventoryController.recordTransaction);

module.exports = router;
