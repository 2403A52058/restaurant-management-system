// KodiKart Hen Inventory Controller
// Manages individual hen records with strict validation
// RULES: Female only, max 2.5 kg, unique hen IDs, atomic status changes

const prisma = require('../config/db');

const MAX_HEN_WEIGHT_KG = 2.5;

/**
 * Add Breed to Farm (Farm Owner)
 */
exports.addFarmBreed = async (req, res, next) => {
  try {
    const { farmId } = req.params;
    const ownerId = req.user.id;

    // Verify farm ownership
    const farm = await prisma.farm.findFirst({ where: { id: parseInt(farmId), ownerId } });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found.' });

    const { breedId, customBreedName, pricePerKg, description, photos } = req.body;

    if (!breedId || !pricePerKg) {
      return res.status(400).json({ success: false, message: 'Breed and price per kg are required.' });
    }

    if (parseFloat(pricePerKg) <= 0) {
      return res.status(400).json({ success: false, message: 'Price per kg must be positive.' });
    }

    // Check breed exists
    const breed = await prisma.breed.findUnique({ where: { id: parseInt(breedId) } });
    if (!breed) return res.status(404).json({ success: false, message: 'Breed not found.' });

    const farmBreed = await prisma.farmBreed.upsert({
      where: { farmId_breedId: { farmId: parseInt(farmId), breedId: parseInt(breedId) } },
      update: {
        pricePerKg: parseFloat(pricePerKg).toFixed(2),
        customBreedName: customBreedName?.trim(),
        description: description?.trim(),
        photos: photos ? JSON.stringify(photos) : undefined,
        isActive: true,
      },
      create: {
        farmId: parseInt(farmId),
        breedId: parseInt(breedId),
        customBreedName: customBreedName?.trim(),
        pricePerKg: parseFloat(pricePerKg).toFixed(2),
        description: description?.trim(),
        photos: photos ? JSON.stringify(photos) : null,
      },
    });

    return res.status(201).json({ success: true, message: 'Breed added to farm.', farmBreed });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Breed Price (Farm Owner) — maintains price history
 */
exports.updateBreedPrice = async (req, res, next) => {
  try {
    const { farmBreedId } = req.params;
    const ownerId = req.user.id;
    const { pricePerKg, reason } = req.body;

    if (!pricePerKg || parseFloat(pricePerKg) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid price per kg required.' });
    }

    // Verify ownership
    const farmBreed = await prisma.farmBreed.findFirst({
      where: { id: parseInt(farmBreedId), farm: { ownerId } },
    });
    if (!farmBreed) return res.status(404).json({ success: false, message: 'Farm breed not found.' });

    const newPrice = parseFloat(pricePerKg).toFixed(2);

    // Update price and record history in a transaction
    const [updated] = await prisma.$transaction([
      prisma.farmBreed.update({
        where: { id: farmBreed.id },
        data: { pricePerKg: newPrice },
      }),
      prisma.breedPriceHistory.create({
        data: {
          farmBreedId: farmBreed.id,
          oldPrice: farmBreed.pricePerKg,
          newPrice,
          changedBy: ownerId,
          reason: reason?.trim() || 'Price update',
        },
      }),
    ]);

    return res.json({ success: true, message: 'Price updated. History recorded.', farmBreed: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Individual Hen to Inventory (Farm Owner)
 * ENFORCES: Female only, max 2.5 kg
 */
exports.addHen = async (req, res, next) => {
  try {
    const { farmId } = req.params;
    const ownerId = req.user.id;

    const farm = await prisma.farm.findFirst({ where: { id: parseInt(farmId), ownerId } });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found.' });

    const { farmBreedId, actualWeight, pricePerKg, photoUrl, photos, notes } = req.body;

    if (!farmBreedId || !actualWeight) {
      return res.status(400).json({ success: false, message: 'Farm breed and actual weight are required.' });
    }

    // Backend weight enforcement — max 2.5 kg
    const weight = parseFloat(actualWeight);
    if (isNaN(weight) || weight <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid weight.' });
    }
    if (weight > MAX_HEN_WEIGHT_KG) {
      return res.status(400).json({
        success: false,
        message: `Maximum allowed weight per hen is ${MAX_HEN_WEIGHT_KG} kg. This hen weighs ${weight} kg.`,
      });
    }

    // Verify farm breed belongs to this farm
    const farmBreed = await prisma.farmBreed.findFirst({
      where: { id: parseInt(farmBreedId), farmId: parseInt(farmId), isActive: true },
      include: { breed: true },
    });
    if (!farmBreed) return res.status(404).json({ success: false, message: 'Farm breed not found.' });

    // Generate unique hen ID: HEN-{FARMID}-{TIMESTAMP}
    const henId = `HEN-${farm.id.toString().padStart(3, '0')}-${Date.now()}`;

    const hen = await prisma.henInventory.create({
      data: {
        henId,
        farmId: parseInt(farmId),
        breedId: farmBreed.breedId,
        farmBreedId: parseInt(farmBreedId),
        gender: 'FEMALE', // Always female — enforced
        actualWeight: weight.toFixed(2),
        pricePerKg: pricePerKg ? parseFloat(pricePerKg).toFixed(2) : farmBreed.pricePerKg,
        photoUrl: photoUrl?.trim(),
        photos: photos ? JSON.stringify(photos) : null,
        notes: notes?.trim(),
        status: 'AVAILABLE',
      },
    });

    return res.status(201).json({ success: true, message: 'Hen added to inventory.', hen });
  } catch (error) {
    next(error);
  }
};

/**
 * List Farm's Hen Inventory (Farm Owner)
 */
exports.listHens = async (req, res, next) => {
  try {
    const { farmId } = req.params;
    const ownerId = req.user.id;
    const { status, breedId, page = 1, limit = 50 } = req.query;

    // Verify farm ownership (or admin)
    if (req.user.role !== 'ADMIN') {
      const farm = await prisma.farm.findFirst({ where: { id: parseInt(farmId), ownerId } });
      if (!farm) return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const where = { farmId: parseInt(farmId) };
    if (status) where.status = status;
    if (breedId) where.breedId = parseInt(breedId);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [hens, total] = await Promise.all([
      prisma.henInventory.findMany({
        where,
        include: {
          breed: { select: { id: true, name: true, teluguName: true } },
          farmBreed: { select: { id: true, pricePerKg: true, customBreedName: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.henInventory.count({ where }),
    ]);

    return res.json({ success: true, hens, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Hen (Farm Owner)
 */
exports.updateHen = async (req, res, next) => {
  try {
    const { henId } = req.params;
    const ownerId = req.user.id;

    const hen = await prisma.henInventory.findFirst({
      where: { id: parseInt(henId), farm: { ownerId } },
    });
    if (!hen) return res.status(404).json({ success: false, message: 'Hen not found.' });
    if (hen.status !== 'AVAILABLE') {
      return res.status(400).json({ success: false, message: 'Only available hens can be updated.' });
    }

    const { actualWeight, pricePerKg, photoUrl, photos, notes } = req.body;

    if (actualWeight !== undefined) {
      const weight = parseFloat(actualWeight);
      if (weight > MAX_HEN_WEIGHT_KG) {
        return res.status(400).json({ success: false, message: `Max weight is ${MAX_HEN_WEIGHT_KG} kg.` });
      }
    }

    const updated = await prisma.henInventory.update({
      where: { id: hen.id },
      data: {
        ...(actualWeight !== undefined && { actualWeight: parseFloat(actualWeight).toFixed(2) }),
        ...(pricePerKg !== undefined && { pricePerKg: parseFloat(pricePerKg).toFixed(2) }),
        ...(photoUrl !== undefined && { photoUrl: photoUrl?.trim() }),
        ...(photos !== undefined && { photos: JSON.stringify(photos) }),
        ...(notes !== undefined && { notes: notes?.trim() }),
      },
    });

    return res.json({ success: true, message: 'Hen updated.', hen: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Hen (Farm Owner) — only if AVAILABLE
 */
exports.deleteHen = async (req, res, next) => {
  try {
    const { henId } = req.params;
    const ownerId = req.user.id;

    const hen = await prisma.henInventory.findFirst({
      where: { id: parseInt(henId), farm: { ownerId } },
    });
    if (!hen) return res.status(404).json({ success: false, message: 'Hen not found.' });
    if (hen.status !== 'AVAILABLE') {
      return res.status(400).json({ success: false, message: 'Cannot delete a reserved or sold hen.' });
    }

    await prisma.henInventory.delete({ where: { id: hen.id } });
    return res.json({ success: true, message: 'Hen removed from inventory.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all Breeds (Public)
 */
exports.listBreeds = async (req, res, next) => {
  try {
    const breeds = await prisma.breed.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, breeds });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Breed Price History
 */
exports.getPriceHistory = async (req, res, next) => {
  try {
    const { farmBreedId } = req.params;
    const history = await prisma.breedPriceHistory.findMany({
      where: { farmBreedId: parseInt(farmBreedId) },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json({ success: true, history });
  } catch (error) {
    next(error);
  }
};
