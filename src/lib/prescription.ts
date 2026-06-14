const RX_STORAGE_KEY = "healthsurya_prescription_upload";

export interface PrescriptionUpload {
  fileName: string;
  fileType: string;
  dataUrl: string;
  uploadedAt: string;
}

export function loadPrescriptionUpload(): PrescriptionUpload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RX_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PrescriptionUpload) : null;
  } catch {
    return null;
  }
}

export function savePrescriptionUpload(upload: PrescriptionUpload) {
  sessionStorage.setItem(RX_STORAGE_KEY, JSON.stringify(upload));
}

export function clearPrescriptionUpload() {
  sessionStorage.removeItem(RX_STORAGE_KEY);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const MAX_BYTES = 4 * 1024 * 1024;

export async function processPrescriptionFile(file: File): Promise<PrescriptionUpload> {
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    throw new Error("Upload JPG, PNG, WEBP or PDF only");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File must be under 4 MB");
  }
  const dataUrl = await readFileAsDataUrl(file);
  return {
    fileName: file.name,
    fileType: file.type,
    dataUrl,
    uploadedAt: new Date().toISOString(),
  };
}
