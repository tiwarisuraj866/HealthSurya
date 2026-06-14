"use client";

// HealthSurya V2 — Admin Verification Dashboard
// Queue (priority-first), KYC review, document viewer, AI risk & recommendations,
// approve / reject with notes, and audit trail.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShieldCheck, ArrowLeft, CheckCircle2, XCircle, Eye, Loader2,
  AlertTriangle, Sparkles, FileText, Clock, History, Zap,
} from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  pending_verification: "bg-blue-100 text-blue-800",
  under_review: "bg-indigo-100 text-indigo-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminKycPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/kyc");
    if (res.status === 403) { router.push("/unauthorized"); return; }
    if (res.ok) setQueue((await res.json()).queue);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login?redirect=/admin/kyc"); return; }
    load();
  }, [authLoading, user, router, load]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-3">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (activeProfileId) {
    return <ReviewPanel profileId={activeProfileId} onBack={async () => { setActiveProfileId(null); await load(); }} />;
  }

  const pending = queue.filter((q) => ["pending_verification", "under_review"].includes(q.status));
  const done = queue.filter((q) => ["approved", "rejected"].includes(q.status));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <ShieldCheck className="h-6 w-6 text-primary" /> Verification Queue (V2)
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Priority submissions (100% KYC) appear first. Legacy partner verifications remain at /admin/verifications.
      </p>

      <h2 className="mt-8 text-sm font-semibold text-muted-foreground">AWAITING REVIEW ({pending.length})</h2>
      {pending.length === 0 ? (
        <Card className="mt-3"><CardContent className="py-10 text-center text-sm text-muted-foreground">Queue is clear. 🎉</CardContent></Card>
      ) : (
        <div className="mt-3 space-y-3">
          {pending.map((q) => <QueueRow key={q.id} item={q} onOpen={() => setActiveProfileId(q.profile_id)} />)}
        </div>
      )}

      {done.length > 0 && (
        <>
          <h2 className="mt-10 text-sm font-semibold text-muted-foreground">RECENTLY DECIDED</h2>
          <div className="mt-3 space-y-3">
            {done.slice(0, 10).map((q) => <QueueRow key={q.id} item={q} onOpen={() => setActiveProfileId(q.profile_id)} />)}
          </div>
        </>
      )}
    </div>
  );
}

function QueueRow({ item, onOpen }: { item: any; onOpen: () => void }) {
  const p = item.profiles;
  return (
    <button className="w-full text-left" onClick={onOpen}>
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="flex items-center justify-between gap-3 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {item.priority && <Zap className="h-4 w-4 text-amber-500" aria-label="Priority — 100% complete" />}
              <span className="truncate font-medium">{p?.full_name || p?.email || "Unnamed profile"}</span>
              <Badge variant="outline" className="capitalize text-[10px]">{item.role}</Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              KYC {Math.round(item.kyc_percentage)}% • Submitted {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString("en-IN") : "—"}
            </div>
          </div>
          <Badge variant="secondary" className={`shrink-0 capitalize ${STATUS_COLOR[item.status] ?? ""}`}>
            {item.status.replaceAll("_", " ")}
          </Badge>
        </CardContent>
      </Card>
    </button>
  );
}

function ReviewPanel({ profileId, onBack }: { profileId: string; onBack: () => void }) {
  const [data, setData] = useState<any | null>(null);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ url: string; name: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/kyc?profileId=${profileId}`);
    if (res.ok) setData(await res.json());
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const act = async (action: "approve" | "reject" | "under_review") => {
    if (action === "reject" && !note.trim()) { toast.error("Add a rejection note so the user knows what to fix."); return; }
    setActing(action);
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, action, note: note.trim() || undefined }),
      });
      if (res.ok) {
        toast.success(action === "approve" ? "Profile approved & user notified" : action === "reject" ? "Rejected & user notified" : "Marked under review");
        if (action === "under_review") await load(); else onBack();
      } else toast.error((await res.json()).error || "Action failed");
    } finally { setActing(null); }
  };

  if (!data) {
    return <div className="mx-auto max-w-5xl px-4 py-10"><Skeleton className="h-80 w-full rounded-xl" /></div>;
  }

  const { profile, request, docs, completion, trust, logs, ai } = data;
  const riskColor = ai.riskScore >= 60 ? "text-red-600" : ai.riskScore >= 30 ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Queue
      </Button>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{profile?.full_name || profile?.email || "Profile"}</h1>
          <p className="text-sm text-muted-foreground capitalize">{profile?.role} • {profile?.email}</p>
        </div>
        <Badge variant="secondary" className={`capitalize ${STATUS_COLOR[request?.status] ?? "bg-muted"}`}>
          {(request?.status ?? "draft").replaceAll("_", " ")}
        </Badge>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">KYC completion</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{Math.round(completion?.percentage ?? request?.kyc_percentage ?? 0)}%</div>
            <Progress value={completion?.percentage ?? 0} className="mt-2 h-2" />
            {(request?.missing_documents ?? []).length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">Missing: {(request.missing_documents as string[]).join(", ")}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">AI risk score</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${riskColor}`}>{ai.riskScore}/100</div>
            <p className="mt-1 text-xs text-muted-foreground">Lower is safer. Derived from document authenticity & flags.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Trust score</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{trust?.grade ?? "new"}</div>
            <p className="mt-1 text-xs text-muted-foreground">{trust?.score ?? 0}/100</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <ul className="space-y-1 text-sm">
            {(ai.recommendations as string[]).map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </CardContent>
      </Card>

      {/* Documents */}
      <h2 className="mt-8 text-sm font-semibold text-muted-foreground">DOCUMENTS ({docs.length})</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {docs.map((d: any) => (
          <Card key={d.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4 text-muted-foreground" /> {d.doc_label || d.doc_key}
                </span>
                {(d.ai_flags ?? []).length > 0 && <AlertTriangle className="h-4 w-4 text-amber-500" aria-label={d.ai_flags.join(", ")} />}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {d.file_name || (d.ai_extracted?.value ? `Value: ${d.ai_extracted.value}` : "—")}
                {d.ai_quality_score != null && <> • Quality {Math.round(d.ai_quality_score)}/100</>}
                {d.ai_authenticity_score != null && <> • Authenticity {Math.round(d.ai_authenticity_score)}/100</>}
              </div>
              {(d.ai_flags ?? []).length > 0 && (
                <p className="mt-1 text-xs text-amber-700">Flags: {d.ai_flags.join(", ")}</p>
              )}
              {d.file_url && (
                <Button size="sm" variant="outline" className="mt-2"
                  onClick={() => setViewer({ url: d.file_url, name: d.doc_label || d.doc_key })}>
                  <Eye className="mr-1.5 h-4 w-4" /> View document
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Decision */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Decision</CardTitle>
          <CardDescription>Notes are shared with the user on rejection and stored in the audit log.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={3} placeholder="Verification notes (required for rejection)…" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => act("approve")} disabled={!!acting} className="bg-emerald-600 hover:bg-emerald-700">
              {acting === "approve" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Approve
            </Button>
            <Button variant="destructive" onClick={() => act("reject")} disabled={!!acting}>
              {acting === "reject" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />} Reject
            </Button>
            <Button variant="outline" onClick={() => act("under_review")} disabled={!!acting}>
              <Clock className="mr-2 h-4 w-4" /> Mark under review
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit log */}
      {logs.length > 0 && (
        <>
          <h2 className="mt-8 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <History className="h-4 w-4" /> AUDIT TRAIL
          </h2>
          <Card className="mt-3">
            <CardContent className="divide-y py-2 text-xs">
              {logs.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="font-mono">{l.action}</span>
                  <span className="text-muted-foreground">{new Date(l.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!viewer} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{viewer?.name}</DialogTitle></DialogHeader>
          {viewer && (viewer.url.toLowerCase().includes(".pdf")
            ? <iframe src={viewer.url} className="h-[70vh] w-full rounded-lg border" title={viewer.name} />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={viewer.url} alt={viewer.name} className="max-h-[70vh] w-full rounded-lg object-contain" />)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
