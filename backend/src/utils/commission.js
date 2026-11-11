// KodiKart Commission Calculator
// IMPORTANT: Commission is charged to customer, NOT deducted from farm owner
// Farm owner earns 100% of their set price
// Platform earns commission separately on top

const { Decimal } = require('@prisma/client/runtime/library');

/**
 * Calculate booking financials
 * @param {number} totalWeightKg - Total confirmed weight of all assigned hens
 * @param {number} pricePerKg - Farm owner's price per kg (from farmBreed)
 * @param {number} commissionRate - Platform commission rate (e.g. 0.03 for 3%)
 * @param {number} deliveryFee - Calculated delivery fee (0 for PICKUP)
 * @returns {object} - All financial amounts
 */
function calculateBookingFinancials(totalWeightKg, pricePerKg, commissionRate, deliveryFee = 0) {
  // Use floating point but round to 2 decimal places
  const weight = parseFloat(totalWeightKg);
  const price = parseFloat(pricePerKg);
  const rate = parseFloat(commissionRate);
  const delivery = parseFloat(deliveryFee);

  // Farm owner earns 100% of their set price × weight
  const farmBaseAmount = Math.round(weight * price * 100) / 100;

  // Platform commission is charged ON TOP of farm price (not deducted from farm)
  const platformCommissionAmount = Math.round(farmBaseAmount * rate * 100) / 100;

  // Customer pays farm price + commission
  const customerHenAmount = Math.round((farmBaseAmount + platformCommissionAmount) * 100) / 100;

  // Final total includes delivery
  const finalTotalAmount = Math.round((customerHenAmount + delivery) * 100) / 100;

  // Advance = 20% of final total
  const advancePercentage = 0.20;
  const advanceAmount = Math.round(finalTotalAmount * advancePercentage * 100) / 100;

  // Remaining = 80%
  const remainingAmount = Math.round((finalTotalAmount - advanceAmount) * 100) / 100;

  return {
    farmBaseAmount,
    platformCommissionAmount,
    customerHenAmount,
    deliveryFee: delivery,
    finalTotalAmount,
    advancePercentage,
    advanceAmount,
    remainingAmount,
    commissionRate: rate,
  };
}

/**
 * Calculate delivery fee using Haversine straight-line distance
 * NOTE: This is straight-line distance, NOT road distance.
 * Road distance calculation requires a paid Maps API.
 * This is clearly disclosed to customers in the UI.
 *
 * @param {number} farmLat - Farm latitude
 * @param {number} farmLon - Farm longitude
 * @param {number} customerLat - Customer delivery latitude
 * @param {number} customerLon - Customer delivery longitude
 * @param {object} settings - Platform delivery settings
 */
function calculateDeliveryFee(farmLat, farmLon, customerLat, customerLon, settings = {}) {
  const {
    baseFee = 50,
    perKmRate = 10,
    freeDeliveryRadiusKm = 0,
    maxDeliveryDistanceKm = 50,
  } = settings;

  // Haversine formula
  const R = 6371; // Earth radius in km
  const dLat = toRad(customerLat - farmLat);
  const dLon = toRad(customerLon - farmLon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(farmLat)) * Math.cos(toRad(customerLat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c * 100) / 100;

  if (distanceKm > maxDeliveryDistanceKm) {
    return { distanceKm, fee: null, error: `Delivery not available beyond ${maxDeliveryDistanceKm} km` };
  }

  if (distanceKm <= freeDeliveryRadiusKm) {
    return { distanceKm, fee: 0, isFree: true };
  }

  const fee = Math.round((baseFee + distanceKm * perKmRate) * 100) / 100;
  return { distanceKm, fee, isEstimate: true };
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = { calculateBookingFinancials, calculateDeliveryFee };
