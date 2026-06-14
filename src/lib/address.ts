/** Structured Indian delivery / sample-collection address */
export interface DeliveryAddress {
  houseNo: string;
  street: string;
  village: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  phone: string;
  landmark: string;
}

export const EMPTY_ADDRESS: DeliveryAddress = {
  houseNo: "",
  street: "",
  village: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  phone: "",
  landmark: "",
};

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry",
] as const;

export function formatAddress(a: DeliveryAddress): string {
  const parts = [
    a.houseNo && `H.No. ${a.houseNo}`,
    a.street,
    a.village,
    a.city,
    a.district,
    a.state,
    a.pincode && `PIN ${a.pincode}`,
  ].filter(Boolean);
  return parts.join(", ");
}

export function validateAddress(a: DeliveryAddress): string | null {
  if (!a.houseNo.trim()) return "House / flat number is required";
  if (!a.street.trim()) return "Street / locality is required";
  if (!a.city.trim()) return "City is required";
  if (!a.district.trim()) return "District is required";
  if (!a.state.trim()) return "State is required";
  if (!/^\d{6}$/.test(a.pincode.trim())) return "Enter a valid 6-digit pincode";
  if (!/^[6-9]\d{9}$/.test(a.phone.replace(/\s/g, ""))) return "Enter a valid 10-digit mobile number";
  return null;
}
