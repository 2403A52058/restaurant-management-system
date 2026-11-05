const prisma = require('../config/db');

// Categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, imageUrl } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const category = await prisma.category.create({
      data: { name: name.trim(), description, imageUrl },
    });
    res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, imageUrl, isActive } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json({ success: true, message: 'Category updated', data: category });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Menu Items
exports.getMenuItems = async (req, res, next) => {
  try {
    const { search, categoryId, isAvailable, isVeg } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = parseInt(categoryId);
    }

    if (isAvailable !== undefined && isAvailable !== '') {
      where.isAvailable = isAvailable === 'true';
    }

    if (isVeg !== undefined && isVeg !== '') {
      where.isVeg = isVeg === 'true';
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

exports.getMenuItemById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

exports.createMenuItem = async (req, res, next) => {
  try {
    const { name, categoryId, description, price, costPrice, imageUrl, isAvailable, preparationTime, isVeg } = req.body;

    if (!name || !categoryId || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name, Category, and Price are required.' });
    }

    const item = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        categoryId: parseInt(categoryId),
        description: description || '',
        price: parseFloat(price),
        costPrice: costPrice ? parseFloat(costPrice) : null,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        preparationTime: preparationTime ? parseInt(preparationTime) : 15,
        isVeg: Boolean(isVeg),
      },
      include: { category: true },
    });

    res.status(201).json({ success: true, message: 'Menu item created successfully', data: item });
  } catch (error) {
    next(error);
  }
};

exports.updateMenuItem = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { name, categoryId, description, price, costPrice, imageUrl, isAvailable, preparationTime, isVeg } = req.body;

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(categoryId && { categoryId: parseInt(categoryId) }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(costPrice !== undefined && { costPrice: costPrice ? parseFloat(costPrice) : null }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        ...(preparationTime !== undefined && { preparationTime: parseInt(preparationTime) }),
        ...(isVeg !== undefined && { isVeg: Boolean(isVeg) }),
      },
      include: { category: true },
    });

    res.json({ success: true, message: 'Menu item updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

exports.toggleAvailability = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.menuItem.findUnique({ where: { id } });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable },
      include: { category: true },
    });

    res.json({ success: true, message: `Item marked as ${updated.isAvailable ? 'available' : 'unavailable'}`, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteMenuItem = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.menuItem.delete({ where: { id } });
    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    next(error);
  }
};
