// HealthSurya V2 — KYC Progress Engine
// Smart, frictionless verification: 80% completion = eligible for review,
// 100% = priority. No optional document is ever mandatory.

export type KycRole = "patient" | "doctor" | "lab" | "pharmacy";

export type KycStatus =
  | "draft"
  | "incomplete"
  | "pending_verification"
  | "under_review"
  | "approved"
  | "rejected";

export interface KycItem {
  key: string;
  label: string;
  /** Weight toward the completion percentage (all weights per role sum to 100). */
  weight: number;
  required: boolean;
  /** 'document' items are uploads; 'field' items are profile data. */
  kind: "document" | "field";
  suggestion: string;
  acceptsCamera?: boolean;
}

export const KYC_ELIGIBLE_THRESHOLD = 80;

export const KYC_CONFIG: Record<KycRole, KycItem[]> = {
  patient: [
    { key: "profile_photo", label: "Profile Photo", weight: 30, required: true, kind: "document", suggestion: "Add a clear profile photo to verify your identity.", acceptsCamera: true },
    { key: "email_verified", label: "Email Verification", weight: 30, required: true, kind: "field", suggestion: "Verify your email to secure your account." },
    { key: "aadhaar", label: "Aadhaar Card", weight: 15, required: false, kind: "document", suggestion: "Upload Aadhaar for faster checkout and insurance claims.", acceptsCamera: true },
    { key: "pan", label: "PAN Card", weight: 10, required: false, kind: "document", suggestion: "Add PAN to enable payment receipts in your name.", acceptsCamera: true },
    { key: "passport", label: "Passport", weight: 8, required: false, kind: "document", suggestion: "Optional ID — useful for international reports.", acceptsCamera: true },
    { key: "driving_license", label: "Driving License", weight: 7, required: false, kind: "document", suggestion: "Optional government ID alternative.", acceptsCamera: true },
  ],
  doctor: [
    { key: "profile_photo", label: "Profile Photo", weight: 20, required: true, kind: "document", suggestion: "Patients trust profiles with a professional photo.", acceptsCamera: true },
    { key: "medical_registration_number", label: "Medical Registration Number", weight: 30, required: true, kind: "field", suggestion: "Enter your MCI/State Council registration number — required for listing." },
    { key: "mbbs_certificate", label: "MBBS Certificate", weight: 15, required: false, kind: "document", suggestion: "Upload MBBS certificate to improve trust score.", acceptsCamera: true },
    { key: "md_ms_certificate", label: "MD/MS Certificate", weight: 10, required: false, kind: "document", suggestion: "Upload PG certificate to highlight your specialization.", acceptsCamera: true },
    { key: "specialization_certificate", label: "Specialization Certificate", weight: 10, required: false, kind: "document", suggestion: "Adds credibility for specialty consultations.", acceptsCamera: true },
    { key: "clinic_photos", label: "Clinic Photos", weight: 10, required: false, kind: "document", suggestion: "Upload clinic photo to reach a higher profile completion.", acceptsCamera: true },
    { key: "government_id", label: "Government ID", weight: 5, required: false, kind: "document", suggestion: "Aadhaar/PAN speeds up admin verification.", acceptsCamera: true },
  ],
  lab: [
    { key: "lab_name", label: "Lab Name", weight: 20, required: true, kind: "field", suggestion: "Enter your lab's registered name." },
    { key: "owner_name", label: "Owner Name", weight: 15, required: true, kind: "field", suggestion: "Enter the owner / authorized signatory name." },
    { key: "lab_address", label: "Lab Address", weight: 15, required: true, kind: "field", suggestion: "Add your lab address so patients can find you." },
    { key: "nabl_certificate", label: "NABL Certificate", weight: 20, required: false, kind: "document", suggestion: "NABL accreditation strongly boosts patient trust.", acceptsCamera: true },
    { key: "gst_certificate", label: "GST Certificate", weight: 10, required: false, kind: "document", suggestion: "Required later for invoicing — upload when ready.", acceptsCamera: true },
    { key: "lab_photos", label: "Lab Photos", weight: 12, required: false, kind: "document", suggestion: "Upload lab photos to reach 90%+ profile completion.", acceptsCamera: true },
    { key: "equipment_photos", label: "Equipment Photos", weight: 8, required: false, kind: "document", suggestion: "Showcase your analyzers and equipment.", acceptsCamera: true },
  ],
  pharmacy: [
    { key: "pharmacy_name", label: "Pharmacy Name", weight: 25, required: true, kind: "field", suggestion: "Enter your pharmacy's registered name." },
    { key: "pharmacist_name", label: "Pharmacist Name", weight: 20, required: true, kind: "field", suggestion: "Enter the registered pharmacist's name." },
    { key: "drug_license", label: "Drug License", weight: 25, required: false, kind: "document", suggestion: "Upload Drug License to unlock medicine fulfilment.", acceptsCamera: true },
    { key: "gst_certificate", label: "GST Certificate", weight: 10, required: false, kind: "document", suggestion: "Needed for GST invoices — upload anytime.", acceptsCamera: true },
    { key: "shop_photos", label: "Shop Photos", weight: 12, required: false, kind: "document", suggestion: "Upload shop photos to improve your trust score.", acceptsCamera: true },
    { key: "registration_certificate", label: "Registration Certificate", weight: 8, required: false, kind: "document", suggestion: "Optional — speeds up admin approval.", acceptsCamera: true },
  ],
};

export interface KycComputation {
  percentage: number;
  readiness: "not_eligible" | "eligible" | "priority";
  status: KycStatus;
  missing: { key: string; label: string; weight: number; suggestion: string; required: boolean }[];
  requiredMissing: string[];
}

/** completedKeys: set of doc_key / field keys already satisfied. */
export function computeKyc(
  role: KycRole,
  completedKeys: Set<string>,
  currentStatus?: KycStatus
): KycComputation {
  const items = KYC_CONFIG[role] ?? KYC_CONFIG.patient;
  let pct = 0;
  const missing: KycComputation["missing"] = [];
  const requiredMissing: string[] = [];

  for (const item of items) {
    if (completedKeys.has(item.key)) {
      pct += item.weight;
    } else {
      missing.push({ key: item.key, label: item.label, weight: item.weight, suggestion: item.suggestion, required: item.required });
      if (item.required) requiredMissing.push(item.label);
    }
  }

  pct = Math.min(100, Math.round(pct));

  const readiness: KycComputation["readiness"] =
    pct >= 100 ? "priority" : pct >= KYC_ELIGIBLE_THRESHOLD ? "eligible" : "not_eligible";

  // Status: keep terminal statuses sticky; otherwise derive.
  let status: KycStatus;
  if (currentStatus === "approved" || currentStatus === "rejected" || currentStatus === "under_review" || currentStatus === "pending_verification") {
    status = currentStatus;
  } else if (pct === 0) {
    status = "draft";
  } else {
    status = "incomplete";
  }

  return { percentage: pct, readiness, status, missing, requiredMissing };
}

export function trustGrade(score: number): "new" | "fair" | "good" | "excellent" {
  if (score >= 85) return "excellent";
  if (score >= 65) return "good";
  if (score >= 40) return "fair";
  return "new";
}

/** Trust score = completion + AI document quality + verification status bonus. */
export function computeTrustScore(opts: {
  kycPercentage: number;
  avgAuthenticity?: number | null; // 0-100
  status: KycStatus;
}): { score: number; grade: ReturnType<typeof trustGrade>; factors: Record<string, number> } {
  const completion = opts.kycPercentage * 0.5;
  const authenticity = (opts.avgAuthenticity ?? 50) * 0.3;
  const statusBonus = opts.status === "approved" ? 20 : opts.status === "under_review" ? 10 : 0;
  const score = Math.min(100, Math.round(completion + authenticity + statusBonus));
  return {
    score,
    grade: trustGrade(score),
    factors: { completion: Math.round(completion), authenticity: Math.round(authenticity), statusBonus },
  };
}

export const KYC_STATUS_LABEL: Record<KycStatus, string> = {
  draft: "Draft",
  incomplete: "Incomplete",
  pending_verification: "Pending Verification",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
};
