"use client";

// HealthSurya V2 — KYC & Verification Centre
// Smart, low-friction onboarding: 80% = eligible, 100% = priority review.
// Upload via file picker, drag & drop, or camera capture. AI auto-fills fields.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ShieldCheck, UploadCloud, Camera, CheckCircle2, AlertCircle, Sparkles,
  FileText, Loader2, Clock, BadgeCheck, XCircle, Lightbulb,
} from "lucide-react";
import { KYC_STATUS_LABEL, type KycStatus } from "@/lib/kyc";

interface KycItemCfg {
  key: string; label: string; weight: number; required: boolean;
  kind: "document" | "field"; suggestion: string; acceptsCamera?: boolean;
}
interface KycDoc {
  doc_key: string; status: string; file_url: string | null; file_name: string | null;
  ai_extracted: any; ai_quality_score: number | null; reviewer_note: string | null;
}
interface KycState {
  role: string; percentage: number; readiness: string; status: KycStatus;
  missing: { key: string; label: string; weight: number; suggestion: string; required: boolean }[];
  trust: { score: number; grade: string };
  documents: KycDoc[];
  config: KycItemCfg[];
}

const STATUS_STYLE: Record<string, { color: string; icon: React.ReactNode }> = {
  draft: { color: "bg-muted text-muted-foreground", icon: <FileText className="h-3.5 w-3.5" /> },
  incomplete: { color: "bg-amber-100 text-amber-800", icon: <Clock className="h-3.5 w-3.5" /> },
  pending_verification: { color: "bg-blue-100 text-blue-800", icon: <Clock className="h-3.5 w-3.5" /> },
  under_review: { color: "bg-indigo-100 text-indigo-800", icon: <Loader2 className="h-3.5 w-3.5" /> },
  approved: { color: "bg-emerald-100 text-emerald-800", icon: <BadgeCheck className="h-3.5 w-3.5" /> },
  rejected: { color: "bg-red-100 text-red-800", icon: <XCircle className="h-3.5 w-3.5" /> },
};

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1]);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(file);
  });
}

export default function KycCentrePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<KycState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/kyc");
      if (res.ok) setState(await res.json());
      else if (res.status === 401) router.push("/login?redirect=/kyc");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const submitForReview = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Could not submit");
      else {
        toast.success("Submitted for verification! We'll review within 24–48 hours.");
        await load();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-xl font-semibold">Sign in to manage verification</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your KYC Centre tracks documents, completion and verification status.</p>
        <Button className="mt-6" onClick={() => router.push("/login?redirect=/kyc")}>Sign in</Button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
        <p className="mt-4 text-sm text-muted-foreground">Couldn't load your KYC status. Please refresh.</p>
      </div>
    );
  }

  const statusInfo = STATUS_STYLE[state.status] ?? STATUS_STYLE.draft;
  const eligible = state.percentage >= 80;
  const canSubmit = eligible && !["pending_verification", "under_review", "approved"].includes(state.status);
  const docByKey = new Map(state.documents.map((d) => [d.doc_key, d]));
  const topSuggestions = state.missing.slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ShieldCheck className="h-6 w-6 text-primary" /> KYC & Verification Centre
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reach <b>80%</b> to become visible on HealthSurya. <b>100%</b> gets priority review.
          </p>
        </div>
        <Badge className={`gap-1.5 px-3 py-1.5 ${statusInfo.color}`} variant="secondary">
          {statusInfo.icon} {KYC_STATUS_LABEL[state.status] ?? state.status}
        </Badge>
      </div>

      {/* Progress overview */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="text-3xl font-bold text-primary">{state.percentage}%</div>
              <div className="text-xs text-muted-foreground">Profile completion</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                Verification readiness:{" "}
                <span className={eligible ? "text-emerald-600" : "text-amber-600"}>
                  {state.readiness === "priority" ? "Priority ⚡" : eligible ? "Eligible" : "Not yet eligible"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Trust score: <b className="capitalize">{state.trust.grade}</b> ({state.trust.score}/100)
              </div>
            </div>
          </div>
          <div className="relative mt-4">
            <Progress value={state.percentage} className="h-3" />
            <div className="absolute top-[-4px] h-5 w-0.5 bg-foreground/30" style={{ left: "80%" }} title="80% — eligible for review" />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>0%</span><span className="font-medium">80% — review eligible</span><span>100%</span>
          </div>

          {canSubmit && (
            <Button className="mt-5 w-full sm:w-auto" onClick={submitForReview} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
              Submit for verification
            </Button>
          )}
          {state.status === "rejected" && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Your last submission needs attention. Fix the flagged documents below and resubmit — your other details are saved.
            </p>
          )}
        </CardContent>
      </Card>

      {/* AI suggestions */}
      {topSuggestions.length > 0 && state.status !== "approved" && (
        <Card className="mt-4 border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 pt-5">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="text-sm">
              <div className="font-medium">AI assistant suggests</div>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                {topSuggestions.map((s) => (
                  <li key={s.key} className="flex items-start gap-1.5">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {s.suggestion} <span className="whitespace-nowrap">(+{s.weight}%)</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Item checklist */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {state.config.map((item) =>
          item.kind === "field" ? (
            <FieldCard key={item.key} item={item} doc={docByKey.get(item.key)} userEmail={user.email} onSaved={load} />
          ) : (
            <DocumentCard key={item.key} item={item} doc={docByKey.get(item.key)} role={state.role} onSaved={load} />
          )
        )}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Everything saves automatically as a draft — you can finish anytime. Optional documents are never required to get started.
      </p>
    </div>
  );
}

// ── Field item (e.g. medical registration number, lab name) ──
function FieldCard({ item, doc, userEmail, onSaved }: {
  item: KycItemCfg; doc?: KycDoc; userEmail: string | null; onSaved: () => void;
}) {
  const autoDone = item.key === "email_verified" && !!userEmail;
  const saved = autoDone || (doc && doc.status !== "rejected");
  const [value, setValue] = useState<string>(doc?.ai_extracted?.value ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!value.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_field", key: item.key, value }),
      });
      if (res.ok) { toast.success(`${item.label} saved`); onSaved(); }
      else toast.error((await res.json()).error || "Could not save");
    } finally { setSaving(false); }
  };

  return (
    <Card className={saved ? "border-emerald-200" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            {saved ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
            {item.label}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {item.required ? <Badge variant="outline" className="text-[10px]">Required</Badge> : `+${item.weight}%`}
          </span>
        </CardTitle>
        {!saved && <CardDescription className="text-xs">{item.suggestion}</CardDescription>}
      </CardHeader>
      <CardContent>
        {item.key === "email_verified" ? (
          <p className="text-sm text-muted-foreground">
            {autoDone ? <>Verified: <b>{userEmail}</b></> : "Verify your email from your account settings."}
          </p>
        ) : (
          <div className="flex gap-2">
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={item.label} className="h-9" />
            <Button size="sm" onClick={save} disabled={saving || !value.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Document item with drag & drop + camera + AI extraction ──
function DocumentCard({ item, doc, role, onSaved }: {
  item: KycItemCfg; doc?: KycDoc; role: string; onSaved: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "ai" | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const uploaded = doc?.file_url && doc.status !== "rejected";

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
    setBusy("upload");
    try {
      // 1. Upload to storage (reuses the hardened V1.5 upload API)
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "kyc");
      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!upRes.ok) { toast.error(await upRes.text()); return; }
      const { url } = await upRes.json();

      // 2. AI extraction for images (quality check + auto-fill); PDFs go to manual review
      let ai: any = null;
      if (file.type.startsWith("image/")) {
        setBusy("ai");
        try {
          const base64 = await fileToBase64(file);
          const aiRes = await fetch("/api/ai/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64, mimeType: file.type, docKey: item.key, role }),
          });
          if (aiRes.ok) {
            const { result } = await aiRes.json();
            if (result && !result.flags?.includes("ai_not_configured")) {
              ai = {
                extracted: {
                  full_name: result.full_name, dob: result.dob, gender: result.gender,
                  registration_number: result.registration_number, classified_as: result.classified_as,
                },
                quality_score: result.quality_score,
                authenticity_score: result.authenticity_score,
                flags: result.flags ?? [],
              };
              if (result.quality_score != null && result.quality_score < 50) {
                toast.warning("AI detected low image quality — consider re-uploading a clearer photo.");
              }
              if (result.full_name) toast.success(`AI read this as ${result.classified_as || item.label}${result.full_name ? ` for ${result.full_name}` : ""}.`);
            }
          }
        } catch { /* AI optional — never block uploads */ }
      }

      // 3. Save document record (with hash for duplicate detection)
      const hash = await sha256Hex(await file.arrayBuffer());
      const saveRes = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_document", key: item.key, file_url: url,
          file_name: file.name, mime_type: file.type, file_hash: hash, ai,
        }),
      });
      if (saveRes.ok) { toast.success(`${item.label} uploaded`); onSaved(); }
      else toast.error((await saveRes.json()).error || "Could not save document");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card
      className={`${uploaded ? "border-emerald-200" : ""} ${dragOver ? "ring-2 ring-primary" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            {uploaded ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <UploadCloud className="h-4 w-4 text-muted-foreground" />}
            {item.label}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {item.required ? <Badge variant="outline" className="text-[10px]">Required</Badge> : `+${item.weight}%`}
          </span>
        </CardTitle>
        <CardDescription className="text-xs">
          {uploaded ? (doc?.file_name ?? "Uploaded") : item.suggestion}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {doc?.status === "rejected" && doc.reviewer_note && (
          <p className="mb-2 rounded bg-red-50 p-2 text-xs text-red-700">Reviewer: {doc.reviewer_note}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={uploaded ? "outline" : "default"} disabled={!!busy} onClick={() => fileInput.current?.click()}>
            {busy === "upload" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-1.5 h-4 w-4" />}
            {uploaded ? "Replace" : "Upload"}
          </Button>
          {item.acceptsCamera && (
            <Button size="sm" variant="outline" disabled={!!busy} onClick={() => cameraInput.current?.click()}>
              <Camera className="mr-1.5 h-4 w-4" /> Camera
            </Button>
          )}
          {busy === "ai" && (
            <span className="flex items-center gap-1.5 text-xs text-primary">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" /> AI reading document…
            </span>
          )}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Drag & drop a file here • PDF, JPG or PNG • max 10MB</p>
        <input ref={fileInput} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }} />
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ""; }} />
      </CardContent>
    </Card>
  );
}
