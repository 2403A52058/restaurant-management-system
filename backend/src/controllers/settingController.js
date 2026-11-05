const prisma = require('../config/db');

exports.getSettings = async (req, res, next) => {
  try {
    let settings = await prisma.restaurantSetting.findFirst();
    if (!settings) {
      settings = await prisma.restaurantSetting.create({
        data: { id: 1 },
      });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const {
      restaurantName,
      tagline,
      address,
      phone,
      email,
      currencySymbol,
      currencyCode,
      defaultTaxRate,
      openingHours,
      invoiceFooter,
    } = req.body;

    let settings = await prisma.restaurantSetting.findFirst();
    const id = settings ? settings.id : 1;

    const updated = await prisma.restaurantSetting.upsert({
      where: { id },
      update: {
        ...(restaurantName && { restaurantName: restaurantName.trim() }),
        ...(tagline !== undefined && { tagline }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(currencySymbol !== undefined && { currencySymbol }),
        ...(currencyCode !== undefined && { currencyCode }),
        ...(defaultTaxRate !== undefined && { defaultTaxRate: parseFloat(defaultTaxRate) }),
        ...(openingHours !== undefined && { openingHours }),
        ...(invoiceFooter !== undefined && { invoiceFooter }),
      },
      create: {
        id: 1,
        restaurantName: restaurantName || 'Le Petit Gourmet Bistro',
        tagline: tagline || 'Exquisite Dining & Modern Bistro',
        address: address || '',
        phone: phone || '',
        email: email || '',
        currencySymbol: currencySymbol || '$',
        currencyCode: currencyCode || 'USD',
        defaultTaxRate: defaultTaxRate ? parseFloat(defaultTaxRate) : 5.0,
        openingHours: openingHours || '11:00 AM - 11:00 PM',
        invoiceFooter: invoiceFooter || 'Thank you for dining with us!',
      },
    });

    res.json({ success: true, message: 'Settings updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};
