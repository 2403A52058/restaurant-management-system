const prisma = require('../config/db');

// Ingredients
exports.getIngredients = async (req, res, next) => {
  try {
    const { category, lowStock } = req.query;
    const where = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    let ingredients = await prisma.ingredient.findMany({
      where,
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = ingredients.map(i => ({
      ...i,
      currentStock: Number(i.currentStock),
      minThreshold: Number(i.minThreshold),
      unitCost: Number(i.unitCost),
      isLowStock: Number(i.currentStock) <= Number(i.minThreshold),
    }));

    if (lowStock === 'true') {
      return res.json({ success: true, data: formatted.filter(i => i.isLowStock) });
    }

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

exports.createIngredient = async (req, res, next) => {
  try {
    const { name, category, currentStock = 0, unit, minThreshold = 5, unitCost = 0 } = req.body;

    if (!name || !category || !unit) {
      return res.status(400).json({ success: false, message: 'Name, category, and unit are required.' });
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        currentStock: parseFloat(currentStock),
        unit: unit.trim(),
        minThreshold: parseFloat(minThreshold),
        unitCost: parseFloat(unitCost),
      },
    });

    res.status(201).json({ success: true, message: 'Ingredient added successfully', data: ingredient });
  } catch (error) {
    next(error);
  }
};

exports.updateIngredient = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { name, category, currentStock, unit, minThreshold, unitCost } = req.body;

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(category && { category: category.trim() }),
        ...(currentStock !== undefined && { currentStock: parseFloat(currentStock) }),
        ...(unit && { unit: unit.trim() }),
        ...(minThreshold !== undefined && { minThreshold: parseFloat(minThreshold) }),
        ...(unitCost !== undefined && { unitCost: parseFloat(unitCost) }),
      },
    });

    res.json({ success: true, message: 'Ingredient updated successfully', data: ingredient });
  } catch (error) {
    next(error);
  }
};

exports.deleteIngredient = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.ingredient.delete({ where: { id } });
    res.json({ success: true, message: 'Ingredient deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Suppliers
exports.getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    next(error);
  }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, email, phone, address, suppliedItems } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Supplier name and phone are required.' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        contactPerson: contactPerson || null,
        email: email ? email.trim().toLowerCase() : null,
        phone: phone.trim(),
        address: address || null,
        suppliedItems: suppliedItems || null,
        isActive: true,
      },
    });

    res.status(201).json({ success: true, message: 'Supplier created successfully', data: supplier });
  } catch (error) {
    next(error);
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { name, contactPerson, email, phone, address, suppliedItems, isActive } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(email !== undefined && { email: email ? email.trim().toLowerCase() : null }),
        ...(phone && { phone: phone.trim() }),
        ...(address !== undefined && { address }),
        ...(suppliedItems !== undefined && { suppliedItems }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ success: true, message: 'Supplier updated successfully', data: supplier });
  } catch (error) {
    next(error);
  }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.supplier.delete({ where: { id } });
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Transactions
exports.getTransactions = async (req, res, next) => {
  try {
    const { ingredientId, type } = req.query;
    const where = {};

    if (ingredientId && ingredientId !== 'all') {
      where.ingredientId = parseInt(ingredientId);
    }
    if (type && type !== 'all') {
      where.type = type.toUpperCase();
    }

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      include: {
        ingredient: true,
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};

exports.recordTransaction = async (req, res, next) => {
  try {
    const { ingredientId, supplierId, type, quantity, unitCost, notes } = req.body;

    if (!ingredientId || !type || !quantity) {
      return res.status(400).json({ success: false, message: 'Ingredient, transaction type, and quantity are required.' });
    }

    const ingId = parseInt(ingredientId);
    const qty = parseFloat(quantity);
    const cost = unitCost ? parseFloat(unitCost) : null;
    const totalCost = cost ? cost * qty : null;

    const ingredient = await prisma.ingredient.findUnique({ where: { id: ingId } });
    if (!ingredient) {
      return res.status(404).json({ success: false, message: 'Ingredient not found' });
    }

    // Calculate new stock level based on transaction type
    let newStock = Number(ingredient.currentStock);
    if (type.toUpperCase() === 'PURCHASE') {
      newStock += qty;
    } else if (['USAGE', 'SPOILAGE'].includes(type.toUpperCase())) {
      newStock = Math.max(0, newStock - qty);
    } else if (type.toUpperCase() === 'ADJUSTMENT') {
      newStock = qty; // direct adjustment
    }

    const [transaction] = await prisma.$transaction([
      prisma.inventoryTransaction.create({
        data: {
          ingredientId: ingId,
          supplierId: supplierId ? parseInt(supplierId) : null,
          type: type.toUpperCase(),
          quantity: qty,
          unitCost: cost,
          totalCost,
          notes: notes || null,
        },
        include: {
          ingredient: true,
          supplier: true,
        },
      }),
      prisma.ingredient.update({
        where: { id: ingId },
        data: {
          currentStock: newStock,
          ...(cost && { unitCost: cost }),
        },
      }),
    ]);

    res.status(201).json({
      success: true,
      message: `Transaction recorded. Updated stock to ${newStock} ${ingredient.unit}`,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};
