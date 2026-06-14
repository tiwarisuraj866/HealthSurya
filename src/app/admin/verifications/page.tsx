"use client";

import { useEffect, useState } from "react";
import { adminGetVerifications, adminDecideVerification } from "@/app/actions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldAlert, FileText, Check, AlertCircle, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function AdminVerificationsPage() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminGetVerifications();
      setRows(data);
    } catch (err: any) {
      toast.error("Failed to load verification queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      load();
    }
  }, [isAdmin]);

  const handleDecision = async (id: string, decision: "approved" | "manual_review" | "rejected" | "suspended") => {
    setBusy(id);
    try {
      const res = await adminDecideVerification({
        verificationId: id,
        decision,
        remarks: remarks[id] || undefined,
      });
      if (res.success) {
        toast.success(`Verification marked as ${decision.replace("_", " ")}`);
        load();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit decision");
    } finally {
      setBusy(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center mt-10 glass-card">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold font-sans">Admin Access Required</h1>
        <p className="mt-2 text-muted-foreground">You do not have the required permissions to view this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-extrabold font-sans bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <ShieldCheck className="h-8 w-8 text-primary" /> Verification Queue
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-medium">
            Review partner credentials, medical licenses, and AI document verification scores.
          </p>
        </div>
        <Button onClick={load} variant="outline" className="glass" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh Queue
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border bg-card/25 p-12 text-center text-muted-foreground glass">
          No pending verification submissions at this time.
        </div>
      ) : (
        <div className="space-y-6">
          {rows.map((r) => {
            const score = Number(r.verification_score ?? 0);
            const recommend =
              score >= 90 ? "Auto-Approve Recommended" : score >= 70 ? "Manual Review Required" : "Auto-Reject Recommended";

            return (
              <div key={r.id} className="glass-card space-y-4 rounded-2xl p-6 shadow-sm border bg-gradient-to-br from-card/80 to-card/30">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize font-semibold">
                        {r.partner_type.replace(/_/g, " ")}
                      </Badge>
                      <Badge
                        variant={
                          r.status === "approved"
                            ? "default"
                            : r.status === "rejected" || r.status === "suspended"
                            ? "destructive"
                            : "secondary"
                        }
                        className="capitalize font-semibold"
                      >
                        {r.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="text-xl font-bold text-foreground mt-2">{r.full_name || "(no name extracted)"}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {r.registration_number && (
                        <span>
                          Reg Number: <strong className="text-foreground font-mono">{r.registration_number}</strong> ·{" "}
                        </span>
                      )}
                      {r.authority_name && <span>Authority: {r.authority_name} · </span>}
                      {r.expiry_date && <span>Expires: {r.expiry_date}</span>}
                    </div>
                    {r.kyc_completion && (
                      <div className="mt-2 text-xs flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-muted-foreground">KYC Completeness:</span>
                        <Badge variant={r.kyc_completion.completion_percentage >= 80 ? "default" : "secondary"} className="font-bold text-[10px]">
                          {r.kyc_completion.completion_percentage}%
                        </Badge>
                        {Array.isArray(r.kyc_completion.missing_fields) && r.kyc_completion.missing_fields.length > 0 && (
                          <span className="text-destructive font-medium text-[10.5px]">
                            Missing: {r.kyc_completion.missing_fields.join(", ")}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground/80 font-mono mt-1">
                      Partner Profile ID: {r.partner_id}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {score.toFixed(0)}
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground mt-1">{recommend}</div>
                  </div>
                </div>

                {r.ai_summary && (
                  <div className="rounded-xl bg-card/40 border p-3.5 text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-primary font-semibold block mb-1">AI Classification Summary:</strong>
                    {r.ai_summary}
                  </div>
                )}

                {r.documents?.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-primary">Uploaded Documents</Label>
                    <div className="grid gap-2">
                      {r.documents.map((d: any) => (
                        <a
                          key={d.id}
                          href={d.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-xl border bg-card/30 px-4 py-2.5 text-xs hover:bg-accent/50 transition-colors shadow-sm"
                        >
                          <span className="flex items-center gap-2 font-semibold">
                            <FileText className="h-4 w-4 text-primary" />
                            {d.document_type}
                            {d.classified_as && (
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-normal uppercase">
                                Classified: {d.classified_as}
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-3">
                            {Array.isArray(d.flags) && d.flags.length > 0 && (
                              <span className="flex items-center gap-1 text-amber-500 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">
                                <ShieldAlert className="h-3.5 w-3.5" />
                                {d.flags.length} Flag{d.flags.length > 1 ? "s" : ""}
                              </span>
                            )}
                            <span className="font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                              AI Score: {Number(d.ai_score).toFixed(0)}
                            </span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {["submitted", "ai_in_progress", "manual_review", "pending"].includes(r.status) && (
                  <div className="space-y-3 pt-3 border-t">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-primary">Review Decision & Remarks</Label>
                    <Textarea
                      placeholder="Enter reviewer feedback (visible to partner onboarding screen)..."
                      value={remarks[r.id] ?? ""}
                      onChange={(e) => setRemarks((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      rows={2}
                      className="glass"
                    />
                    <div className="flex flex-wrap gap-2.5">
                      <Button
                        size="sm"
                        onClick={() => handleDecision(r.id, "approved")}
                        disabled={busy === r.id}
                        className="bg-primary hover:bg-primary/95 text-white font-semibold"
                      >
                        {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Check className="h-4 w-4 mr-1.5" />}
                        Approve Partner
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecision(r.id, "manual_review")}
                        disabled={busy === r.id}
                        className="glass font-semibold"
                      >
                        Request Manual Review
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDecision(r.id, "rejected")}
                        disabled={busy === r.id}
                        className="font-semibold"
                      >
                        Reject Submission
                      </Button>
                    </div>
                  </div>
                )}
                {r.status === "approved" && (
                  <div className="pt-3 border-t">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDecision(r.id, "suspended")}
                      disabled={busy === r.id}
                      className="font-semibold"
                    >
                      Suspend Approved Account
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
