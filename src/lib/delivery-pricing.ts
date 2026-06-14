/** Hub pincode for HealthSurya pharmacy / lab dispatch (Mumbai) */
export const DISPATCH_PINCODE = "400001";

function pincodeNumeric(pin: string): number {
  return parseInt(pin.replace(/\D/g, "").slice(0, 6), 10) || 0;
}

/** Estimate road distance (km) from pincode difference — replace with Maps API in production */
export function estimateDistanceKm(customerPincode: string, hubPincode = DISPATCH_PINCODE): number {
  const diff = Math.abs(pincodeNumeric(customerPincode) - pincodeNumeric(hubPincode));
  if (diff === 0) return 2;
  return Math.min(45, Math.max(2, Math.round(diff / 12 + 2)));
}

export interface DeliveryFeeBreakdown {
  distanceKm: number;
  baseFee: number;
  distanceFee: number;
  orderDiscount: number;
  finalFee: number;
  freeDelivery: boolean;
  label: string;
}

/**
 * Medicine delivery fee: distance + order amount.
 * - First 3 km included in base ₹29
 * - +₹6 per km beyond 3 km
 * - Order ₹499+: 30% off delivery | ₹999+: 50% off | ₹1499+: FREE
 */
export function calculateMedicineDeliveryFee(
  subtotal: number,
  customerPincode: string,
): DeliveryFeeBreakdown {
  const distanceKm = estimateDistanceKm(customerPincode);
  const baseFee = 29;
  const freeKm = 3;
  const perKm = 6;
  const distanceFee = Math.max(0, distanceKm - freeKm) * perKm;
  const raw = baseFee + distanceFee;

  let orderDiscountPct = 0;
  if (subtotal >= 1499) orderDiscountPct = 100;
  else if (subtotal >= 999) orderDiscountPct = 50;
  else if (subtotal >= 499) orderDiscountPct = 30;

  const orderDiscount = Math.round(raw * (orderDiscountPct / 100));
  const finalFee = Math.max(0, Math.round(raw - orderDiscount));
  const freeDelivery = finalFee === 0;

  let label = `₹${finalFee} (${distanceKm} km from hub)`;
  if (freeDelivery) label = subtotal >= 1499 ? "FREE — order above ₹1499" : "FREE delivery";

  return {
    distanceKm,
    baseFee,
    distanceFee,
    orderDiscount,
    finalFee,
    freeDelivery,
    label,
  };
}

export interface CollectionFeeBreakdown {
  distanceKm: number;
  collectionFee: number;
  testPrice: number;
  total: number;
  label: string;
}

/**
 * Home sample collection fee for blood tests.
 * - Base ₹49, first 5 km included, +₹8/km after
 * - Test ₹800+: 50% off collection | ₹1500+: FREE collection
 */
export function calculateSampleCollectionFee(
  testPrice: number,
  customerPincode: string,
  homeCollection: boolean,
  labPincode?: string,
): CollectionFeeBreakdown {
  if (!homeCollection) {
    return { distanceKm: 0, collectionFee: 0, testPrice, total: testPrice, label: "Visit lab — no collection fee" };
  }

  const hub = labPincode || DISPATCH_PINCODE;
  const distanceKm = estimateDistanceKm(customerPincode, hub);
  const baseFee = 49;
  const freeKm = 5;
  const perKm = 8;
  let fee = baseFee + Math.max(0, distanceKm - freeKm) * perKm;

  if (testPrice >= 1500) fee = 0;
  else if (testPrice >= 800) fee = Math.round(fee * 0.5);

  const collectionFee = Math.round(fee);
  const total = testPrice + collectionFee;

  return {
    distanceKm,
    collectionFee,
    testPrice,
    total,
    label: collectionFee === 0 ? "FREE home collection" : `₹${collectionFee} (${distanceKm} km)`,
  };
}
