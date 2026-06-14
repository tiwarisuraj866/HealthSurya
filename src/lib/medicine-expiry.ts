function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Multiple verified pharmacies may stock the same medicine */
export function estimatePharmacySellerCount(medicineId: string): number {
  return 2 + (hashId(medicineId) % 4);
}

export function estimateApproxExpiry(medicineId: string): { from: string; to: string; label: string } {
  const h = hashId(medicineId);
  const monthsMin = 8 + (h % 6);
  const monthsMax = monthsMin + 4 + (h % 5);
  const from = new Date();
  from.setMonth(from.getMonth() + monthsMin);
  const to = new Date();
  to.setMonth(to.getMonth() + monthsMax);
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  const fromStr = fmt(from);
  const toStr = fmt(to);
  return { from: fromStr, to: toStr, label: `Approx. ${fromStr} – ${toStr}` };
}
