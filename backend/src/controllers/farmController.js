// KodiKart Farm Controller
// CRUD for farm profiles, breeds, and hen inventory management

const prisma = require('../config/db');

/**
 * Create Farm Profile (Farm Owner)
 */
exports.createFarm = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const {
      farmName, description, phone, whatsapp,
      address, villageOrTown, district, state,
      latitude, longitude,
    } = req.body;

    if (!farmName || !phone || !address || !villageOrTown || !district) {
      return res.status(400).json({ success: false, message: 'Farm name, phone, address, village/town, and district are required.' });
    }

    // Auto-generate slug
    const slug = farmName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 150) + '-' + Date.now();

    const farm = await prisma.farm.create({
      data: {
        ownerId,
        farmName: farmName.trim(),
        slug,
        description: description?.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp?.trim(),
        address: address.trim(),
        villageOrTown: villageOrTown.trim(),
        district: district.trim(),
        state: state?.trim() || 'Telangana',
        latitude: latitude ? parseFloat(latitude) : 17.3850,
        longitude: longitude ? parseFloat(longitude) : 78.4867,
        isVerified: false,
        verificationBadge: 'Unverified Farm',
      },
    });

    // Create notification for admin
    await createAdminNotification('NEW_FARM_REGISTERED', `New farm registered: ${farmName} by owner #${ownerId}`);

    return res.status(201).json({ success: true, message: 'Farm profile created. It is marked as "Unverified Farm" until admin reviews it.', farm });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Farm Profile
 */
exports.updateFarm = async (req, res, next) => {
  try {
    const { farmId } = req.params;
    const ownerId = req.user.id;

    const farm = await prisma.farm.findFirst({
      where: { id: parseInt(farmId), ownerId },
    });

    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found or you do not own this farm.' });
    }

    const {
      farmName, description, phone, whatsapp,
      address, villageOrTown, district, state,
      latitude, longitude,
    } = req.body;

    const updated = await prisma.farm.update({
      where: { id: farm.id },
      data: {
        ...(farmName && { farmName: farmName.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(whatsapp !== undefined && { whatsapp: whatsapp?.trim() }),
        ...(address && { address: address.trim() }),
        ...(villageOrTown && { villageOrTown: villageOrTown.trim() }),
        ...(district && { district: district.trim() }),
        ...(state && { state: state.trim() }),
        ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
        ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
      },
    });

    return res.json({ success: true, message: 'Farm profile updated.', farm: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Get My Farms (Farm Owner)
 */
exports.getMyFarms = async (req, res, next) => {
  try {
    const farms = await prisma.farm.findMany({
      where: { ownerId: req.user.id },
      include: {
        farmBreeds: {
          include: { breed: true },
          where: { isActive: true },
        },
        _count: { select: { henInventory: true, bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, farms });
  } catch (error) {
    next(error);
  }
};

/**
 * Browse All Farms (Public)
 */
exports.listFarms = async (req, res, next) => {
  try {
    const {
      district, isVerified, search,
      page = 1, limit = 20,
    } = req.query;

    const where = { isActive: true };
    if (district) where.district = district;
    if (isVerified !== undefined) where.isVerified = isVerified === 'true';
    if (search) {
      where.OR = [
        { farmName: { contains: search, mode: 'insensitive' } },
        { villageOrTown: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [farms, total] = await Promise.all([
      prisma.farm.findMany({
        where,
        select: {
          id: true,
          farmName: true,
          slug: true,
          description: true,
          address: true,
          villageOrTown: true,
          district: true,
          state: true,
          latitude: true,
          longitude: true,
          coverImage: true,
          isVerified: true,
          verificationBadge: true,
          rating: true,
          totalReviews: true,
          farmBreeds: {
            where: { isActive: true },
            select: {
              id: true,
              pricePerKg: true,
              breed: { select: { id: true, name: true, teluguName: true } },
            },
          },
          _count: {
            select: {
              henInventory: { where: { status: 'AVAILABLE' } },
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: [{ isVerified: 'desc' }, { rating: 'desc' }],
      }),
      prisma.farm.count({ where }),
    ]);

    return res.json({ success: true, farms, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Farm Details (Public)
 */
exports.getFarmBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const farm = await prisma.farm.findUnique({
      where: { slug },
      include: {
        owner: { select: { name: true, phone: true } },
        farmBreeds: {
          where: { isActive: true },
          include: {
            breed: true,
            hens: {
              where: { status: 'AVAILABLE' },
              select: { id: true, henId: true, actualWeight: true, pricePerKg: true, photoUrl: true, photos: true },
            },
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { customer: { select: { name: true } } },
        },
        _count: {
          select: {
            henInventory: { where: { status: 'AVAILABLE' } },
          },
        },
      },
    });

    if (!farm || !farm.isActive) {
      return res.status(404).json({ success: false, message: 'Farm not found.' });
    }

    return res.json({ success: true, farm });
  } catch (error) {
    next(error);
  }
};

/**
 * Get automated delivery estimate between farm and customer coordinates
 */
exports.getDeliveryEstimate = async (req, res, next) => {
  try {
    const { farmId } = req.params;
    const { latitude, longitude } = req.query;

    const farm = await prisma.farm.findUnique({ where: { id: parseInt(farmId) } });
    if (!farm) return res.status(404).json({ success: false, message: 'Farm not found.' });

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Customer latitude and longitude required.' });
    }

    const settings = await prisma.platformSetting.findMany({
      where: { key: { in: ['delivery_base_fee', 'delivery_per_km_rate', 'delivery_free_radius_km', 'delivery_max_distance_km'] } },
    });
    const map = {};
    settings.forEach(s => { map[s.key] = parseFloat(s.value); });
    const baseFee = map['delivery_base_fee'] || 50;
    const perKmRate = map['delivery_per_km_rate'] || 10;
    const freeRadius = map['delivery_free_radius_km'] || 0;
    const maxDistance = map['delivery_max_distance_km'] || 50;

    const lat1 = farm.latitude;
    const lon1 = farm.longitude;
    const lat2 = parseFloat(latitude);
    const lon2 = parseFloat(longitude);

    // Haversine formula with road distance winding factor (1.25x)
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDistance = R * c;
    const roadDistanceKm = parseFloat((straightDistance * 1.25).toFixed(1));

    if (roadDistanceKm > maxDistance) {
      return res.json({
        success: true,
        deliverable: false,
        roadDistanceKm,
        maxDistanceKm: maxDistance,
        message: `Delivery distance (${roadDistanceKm} km) exceeds maximum delivery radius of ${maxDistance} km. Only farm pickup available.`,
      });
    }

    let deliveryFee = baseFee;
    if (roadDistanceKm > freeRadius) {
      deliveryFee += (roadDistanceKm - freeRadius) * perKmRate;
    }
    deliveryFee = Math.round(deliveryFee);

    return res.json({
      success: true,
      deliverable: true,
      roadDistanceKm,
      deliveryFee,
      estimatedHours: Math.max(1, Math.ceil(roadDistanceKm / 25)),
    });
  } catch (error) {
    next(error);
  }
};

// Helper: notify admin
async function createAdminNotification(type, message) {
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
      await prisma.notification.create({
        data: { userId: admin.id, title: type, message, type: 'ADMIN_ALERT' },
      });
    }
  } catch {}
}
