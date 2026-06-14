export type CallAlertAudience = "pharmacy" | "lab" | "customer";

export interface CallAlert {
  id: string;
  audience: CallAlertAudience;
  partnerId?: string;
  patientPhone: string;
  patientName?: string;
  title: string;
  message: string;
  createdAt: string;
  dismissed: boolean;
}

const STORAGE_KEY = "healthsurya_call_alerts";
export const CALL_ALERTS_EVENT = "healthsurya:call-alerts-changed";

function readAll(): CallAlert[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as CallAlert[];
  } catch {
    return [];
  }
}

function writeAll(alerts: CallAlert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts.slice(0, 50)));
  window.dispatchEvent(new CustomEvent(CALL_ALERTS_EVENT));
}

export function pushCallAlert(input: Omit<CallAlert, "id" | "createdAt" | "dismissed">): CallAlert {
  const alert: CallAlert = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    dismissed: false,
  };
  writeAll([alert, ...readAll()]);
  return alert;
}

export function getCallAlerts(filter?: {
  audience?: CallAlertAudience | CallAlertAudience[];
  partnerId?: string;
  dismissed?: boolean;
}): CallAlert[] {
  let list = readAll();
  if (filter?.audience) {
    const audiences = Array.isArray(filter.audience) ? filter.audience : [filter.audience];
    list = list.filter((a) => audiences.includes(a.audience));
  }
  if (filter?.partnerId) list = list.filter((a) => a.partnerId === filter.partnerId);
  if (filter?.dismissed != null) list = list.filter((a) => a.dismissed === filter.dismissed);
  return list;
}

export function dismissCallAlert(id: string) {
  writeAll(readAll().map((a) => (a.id === id ? { ...a, dismissed: true } : a)));
}

export function notifyMedicineOrderPlaced(params: {
  orderId: string;
  pharmacyId: string;
  patientPhone: string;
  patientName?: string;
  itemSummary: string;
}) {
  pushCallAlert({
    audience: "pharmacy",
    partnerId: params.pharmacyId,
    patientPhone: params.patientPhone,
    patientName: params.patientName,
    title: "New medicine order — call patient",
    message: `${params.itemSummary}. Ring ${params.patientPhone} to confirm Rx and delivery.`,
  });
  return pushCallAlert({
    audience: "customer",
    patientPhone: params.patientPhone,
    patientName: params.patientName,
    title: "Pharmacy will call you",
    message: `Our verified pharmacy partner will ring you on ${params.patientPhone} shortly to confirm your medicine order.`,
  });
}

export function notifyLabBookingPlaced(params: {
  labId: string;
  labName: string;
  patientPhone: string;
  patientName?: string;
  testName: string;
}) {
  pushCallAlert({
    audience: "lab",
    partnerId: params.labId,
    patientPhone: params.patientPhone,
    patientName: params.patientName,
    title: "New blood test booking — call patient",
    message: `${params.testName} at ${params.labName}. Ring ${params.patientPhone} to confirm slot.`,
  });
  return pushCallAlert({
    audience: "customer",
    patientPhone: params.patientPhone,
    patientName: params.patientName,
    title: "Lab will call you",
    message: `${params.labName} will ring you on ${params.patientPhone} shortly to confirm your test booking.`,
  });
}
