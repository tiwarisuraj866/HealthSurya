const STORAGE_KEY = "healthsurya_user_city";
export const DEFAULT_CITY = "Jaunpur";

export function getUserCity(): string {
  if (typeof window === "undefined") return DEFAULT_CITY;
  return localStorage.getItem(STORAGE_KEY)?.trim() || DEFAULT_CITY;
}

export function setUserCity(city: string): void {
  if (typeof window === "undefined" || !city.trim()) return;
  localStorage.setItem(STORAGE_KEY, city.trim());
}

/** Lower score = closer match (0 = exact city, 1 = partial, 2 = other) */
export function locationMatchScore(itemCity: string, userCity: string): number {
  const a = itemCity.trim().toLowerCase();
  const b = userCity.trim().toLowerCase();
  if (!b) return 1;
  if (a === b) return 0;
  if (a.includes(b) || b.includes(a)) return 1;
  return 2;
}

export function premiumTierRank(tier: string | null | undefined): number {
  switch (tier) {
    case "gold":
    case "featured":
      return 3;
    case "silver":
      return 2;
    default:
      return 0;
  }
}
