/** GST on products only — medicines 12%, lab diagnostics 12%. No GST on delivery, collection, or consultation. */
export const GST_MEDICINE_RATE = 0.12;
export const GST_LAB_TEST_RATE = 0.12;

export interface MedicineBill {
  subtotal: number;
  medicineGst: number;
  deliveryFee: number;
  gstTotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
}

export interface LabBill {
  testPrice: number;
  testGst: number;
  collectionFee: number;
  gstTotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Product prices are ex-GST; service charges (delivery, etc.) have no GST */
export function calculateMedicineBill(subtotal: number, deliveryFee: number): MedicineBill {
  const medicineGst = round2(subtotal * GST_MEDICINE_RATE);
  const gstTotal = medicineGst;
  const cgst = round2(gstTotal / 2);
  const sgst = round2(gstTotal - cgst);
  const grandTotal = round2(subtotal + medicineGst + deliveryFee);

  return {
    subtotal,
    medicineGst,
    deliveryFee,
    gstTotal,
    cgst,
    sgst,
    grandTotal,
  };
}

export function calculateLabBill(testPrice: number, collectionFee: number): LabBill {
  const testGst = round2(testPrice * GST_LAB_TEST_RATE);
  const gstTotal = testGst;
  const cgst = round2(gstTotal / 2);
  const sgst = round2(gstTotal - cgst);
  const grandTotal = round2(testPrice + testGst + collectionFee);

  return {
    testPrice,
    testGst,
    collectionFee,
    gstTotal,
    cgst,
    sgst,
    grandTotal,
  };
}
