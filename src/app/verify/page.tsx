"use client";

import { useEffect, useState } from "react";
import {
  getLatestVerification,
  startVerificationFlow,
  addVerificationDocument,
  submitVerificationFlow,
  analyzeVerificationDocument,
  getKycProgress,
  saveKycDraft,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CameraCapture } from "@/components/auth/CameraCapture";
import { toast } from "sonner";
import {
  ShieldCheck,
  Upload,
  Loader2,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Save,
  Check,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Award
} from "lucide-react";

const PARTNER_TYPES = [
  {
    value: "doctor",
    label: "Doctor",
    docs: [
      { type: "profile_photo", label: "Profile Photo" },
      { type: "medical_registration", label: "Medical Registration Certificate" },
      { type: "mbbs_certificate", label: "MBBS Certificate (Optional)" },
      { type: "md_ms_certificate", label: "MD/MS Certificate (Optional)" },
      { type: "specialization_certificate", label: "Specialization Certificate (Optional)" },
      { type: "clinic_photo", label: "Clinic Photo (Optional)" },
      { type: "aadhaar", label: "Government ID (Aadhaar/PAN) (Optional)" }
    ],
  },
  {
    value: "laboratory",
    label: "Laboratory",
    docs: [
      { type: "identity_proof", label: "Owner Identity Proof" },
      { type: "lab_registration", label: "Lab Registration Certificate" },
      { type: "nabl_certificate", label: "NABL Certificate (Optional)" },
      { type: "gst_certificate", label: "GST Certificate (Optional)" },
      { type: "lab_photo", label: "Lab Photos (Optional)" }
    ],
  },
  {
    value: "pharmacy",
    label: "Pharmacy",
    docs: [
      { type: "identity_proof", label: "Owner Identity Proof" },
      { type: "drug_license", label: "Drug License" },
      { type: "gst_certificate", label: "GST Certificate (Optional)" },
      { type: "shop_photo", label: "Shop Photos (Optional)" }
    ],
  },
] as const;

function statusVariant(s: string) {
  if (s === "approved") return "default";
  if (s === "rejected" || s === "suspended" || s === "expired") return "destructive";
  return "secondary";
}

export default function VerifyPage() {
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [verification, setVerification] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [partnerType, setPartnerType] = useState<string>("doctor");
  const [uploading, setUploading] = useState<string | null>(null);
  
  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [activeCamDocType, setActiveCamDocType] = useState<string | null>(null);

  // KYC Engine state
  const [kycProgress, setKycProgress] = useState<any>({
    percent: 0,
    missing: [],
    suggestions: [],
    readiness: "ineligible",
    trustScore: 50,
    trustRating: "neutral",
  });

  // Partner Info Draft State
  const [formData, setFormData] = useState({
    fullName: "",
    specialization: "",
    experienceYears: "",
    clinicName: "",
    clinicAddress: "",
    clinicCity: "",
    clinicPincode: "",
    registrationNumber: "",
    labName: "",
    ownerName: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    homeCollection: false,
    pharmacyName: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getLatestVerification();
      setVerification(res.verification);
      setDocuments(res.documents);
      if (res.verification) {
        setPartnerType(res.verification.partner_type === "laboratory" ? "laboratory" : res.verification.partner_type);
      }
      
      // Load KYC metrics
      const kyc = await getKycProgress();
      setKycProgress(kyc);
      
      // Prefill drafts from verification fields
      if (res.verification) {
        setFormData(prev => ({
          ...prev,
          fullName: res.verification.full_name || "",
          registrationNumber: res.verification.registration_number || "",
          address: res.verification.address || "",
        }));
      }
    } catch (err: any) {
      toast.error("Failed to load verification status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStartVerification = async () => {
    try {
      const res = await startVerificationFlow(partnerType);
      if (res.success) {
        setVerification(res.verification);
        setDocuments([]);
        toast.success("Verification started! You can now upload certificates.");
        await load();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start verification");
    }
  };

  const uploadDoc = async (docType: string, file: File) => {
    if (!verification) return;
    if (!file.type.match(/^image\/(png|jpe?g|webp)$/)) {
      return toast.error("Upload PNG, JPG or WEBP image");
    }
    if (file.size > 8 * 1024 * 1024) return toast.error("Max 8MB file size allowed");
    setUploading(docType);

    try {
      // 1. Upload file
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("folder", `verification-docs/${docType}`);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(errText || "Storage upload failed");
      }

      const uploadData = await uploadRes.json();
      const signedUrl = uploadData.url;

      // 2. Register document
      const docRes = await addVerificationDocument({
        verificationId: verification.id,
        documentType: docType,
        fileUrl: signedUrl,
      });

      if (!docRes.success) throw new Error("Failed to register document");

      toast.message("AI Verification Assistant is analyzing your document...");

      // 3. Process base64 for OCR
      const fileToBase64 = (f: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(f);
        });
      
      const base64 = await fileToBase64(file);
      const analysis = await analyzeVerificationDocument({
        verificationId: verification.id,
        documentId: docRes.document.id,
        documentType: docType,
        partnerType: verification.partner_type,
        imageBase64: base64,
        mimeType: file.type,
      });

      toast.success("Document analyzed successfully!");
      
      // Auto-fill fields if AI extracted them
      if (analysis?.extracted) {
        const ext = analysis.extracted;
        toast.info(`AI Auto-filled registration data!`, {
          description: `Extracted: ${ext.full_name || ""} ${ext.registration_number ? `(Reg: ${ext.registration_number})` : ""}`,
        });
        setFormData(prev => ({
          ...prev,
          fullName: ext.full_name || prev.fullName,
          registrationNumber: ext.registration_number || prev.registrationNumber,
          address: ext.address || prev.address,
        }));
      }

      await load();
    } catch (e: any) {
      toast.error(e?.message || "Upload and analysis failed");
    } finally {
      setUploading(null);
    }
  };

  // Handle webcam capture
  const handleCameraCapture = async (base64Image: string) => {
    if (!verification || !activeCamDocType) return;
    setUploading(activeCamDocType);
    try {
      // Convert base64 back to file to upload
      const byteCharacters = atob(base64Image);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const file = new File([byteArray], `${activeCamDocType}.jpg`, { type: "image/jpeg" });

      await uploadDoc(activeCamDocType, file);
    } catch (err: any) {
      toast.error("Failed to process captured image");
      setUploading(null);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await saveKycDraft({
        role: partnerType,
        data: formData,
      });
      toast.success("Draft saved successfully!");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!verification) return;
    if (kycProgress.percent < 80) {
      toast.error("Your KYC completeness must be at least 80% to submit for verification review.");
      return;
    }
    try {
      const res = await submitVerificationFlow(verification.id);
      if (res.success) {
        toast.success("Profile submitted for reviewer approval!");
        await load();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit verification");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const meta = PARTNER_TYPES.find((p) => p.value === (verification?.partner_type === "laboratory" ? "laboratory" : verification?.partner_type || partnerType));
  const canEdit = !verification || ["draft", "rejected"].includes(verification.status);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold font-sans sm:text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <ShieldCheck className="h-8 w-8 text-primary" /> Partner KYC Onboarding
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete your profile details, upload certificate proofs, and reach 80% KYC completion to unlock public visibility.
          </p>
        </div>
        {verification && (
          <Badge variant={statusVariant(verification.status) as any} className="text-sm capitalize font-semibold py-1 px-3">
            {verification.status.replace(/_/g, " ")}
          </Badge>
        )}
      </header>

      {/* KYC Progress widgets */}
      {verification && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* completeness widget */}
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between bg-gradient-to-br from-card/85 to-card/40 border">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">KYC Completeness</span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-foreground">{kycProgress.percent}%</span>
                <span className="text-xs text-muted-foreground">
                  {kycProgress.percent >= 80 ? "Eligible for review" : "Needs 80% to submit"}
                </span>
              </div>
            </div>
            {/* simple bar */}
            <div className="mt-4 w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  kycProgress.percent >= 80 ? "bg-primary" : "bg-amber-500"
                }`}
                style={{ width: `${kycProgress.percent}%` }}
              />
            </div>
          </div>

          {/* trust score widget */}
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between bg-gradient-to-br from-card/85 to-card/40 border">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Partner Trust Score</span>
                <Award className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-foreground">{kycProgress.trustScore}</span>
                <Badge className="capitalize font-semibold text-xs py-0.5" variant={kycProgress.trustScore >= 70 ? "default" : "secondary"}>
                  {kycProgress.trustRating}
                </Badge>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-4 leading-normal">
              High trust scores improve listing visibility in local searches.
            </p>
          </div>

          {/* AI assistant widget */}
          <div className="glass-card p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> AI Onboarding Assistant
              </span>
              <div className="mt-3 text-xs text-muted-foreground space-y-1.5">
                {kycProgress.suggestions.length > 0 ? (
                  kycProgress.suggestions.slice(0, 2).map((s: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">•</span>
                      <span>{s}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-primary font-semibold">✨ Profile 100% complete! Verification priority unlocked.</p>
                )}
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground/80 mt-2 font-mono">
              Onboarding Readiness: <span className="font-bold capitalize text-foreground">{kycProgress.readiness}</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Select Role */}
      {!verification && (
        <div className="glass-card space-y-4 rounded-2xl p-6 border bg-card/45">
          <Label className="text-sm font-semibold uppercase tracking-wider text-primary">Select Healthcare Partner Role</Label>
          <Select value={partnerType} onValueChange={setPartnerType}>
            <SelectTrigger className="min-h-11 glass bg-card/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARTNER_TYPES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleStartVerification} className="w-full min-h-11 font-semibold transition-transform hover:scale-[1.01]">
            Start Verification Onboarding
          </Button>
        </div>
      )}

      {verification && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left panel: Info form draft fields */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl p-6 border space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold font-sans flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-primary" /> Profile Specifications
                </h3>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="glass font-semibold text-xs gap-1.5 h-8"
                    onClick={handleSaveDraft}
                    disabled={savingDraft}
                  >
                    {savingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Draft
                  </Button>
                )}
              </div>

              {/* Doctor inputs */}
              {meta?.value === "doctor" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="doc-name">Full Professional Name</Label>
                    <Input
                      id="doc-name"
                      placeholder="Dr. Rajesh Gupta"
                      value={formData.fullName}
                      disabled={!canEdit}
                      onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                      className="glass"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="doc-reg">Medical Registration Number</Label>
                    <Input
                      id="doc-reg"
                      placeholder="MCI-12345"
                      value={formData.registrationNumber}
                      disabled={!canEdit}
                      onChange={(e) => setFormData(p => ({ ...p, registrationNumber: e.target.value }))}
                      className="glass font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="doc-spec">Primary Specialization</Label>
                    <Input
                      id="doc-spec"
                      placeholder="Cardiology"
                      value={formData.specialization}
                      disabled={!canEdit}
                      onChange={(e) => setFormData(p => ({ ...p, specialization: e.target.value }))}
                      className="glass"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="doc-exp">Years of Experience</Label>
                    <Input
                      id="doc-exp"
                      type="number"
                      placeholder="12"
                      value={formData.experienceYears}
                      disabled={!canEdit}
                      onChange={(e) => setFormData(p => ({ ...p, experienceYears: e.target.value }))}
                      className="glass"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="doc-clinic">Clinic Name</Label>
                    <Input
                      id="doc-clinic"
                      placeholder="Gupta Heart & Care Clinic"
                      value={formData.clinicName}
                      disabled={!canEdit}
                      onChange={(e) => setFormData(p => ({ ...p, clinicName: e.target.value }))}
                      className="glass"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="doc-address">Clinic Address</Label>
                    <Input
                      id="doc-address"
                      placeholder="123, Civil Lines"
                      value={formData.address}
                      disabled={!canEdit}
                      onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                      className="glass"
                    />
                  </div>
                </div>
              )}

              {/* Lab inputs */}
              {meta?.value === "laboratory" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="lab-name">Laboratory Name</Label>
                    <Input
                      id="lab-name"
                      placeholder="PathCare Diagnostics"
                      value={formData.fullName}
                      disabled={!canEdit}
                      onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                      className="glass"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lab-owner">Owner / Director Name</Label>
                    <Input
                      id="lab-owner"
                      placeholder="Suresh Kumar"
                      value={formData.ownerName}
                      disabled={!canEdit}
                      onChange={(e) => setFormData(p => ({ ...p, ownerName: e.target.value }))}
                      className="glass"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="lab-address">Lab Address</Label>
                    <Input
                      id="lab-address"
                      placeholder="Plot 45, Sector 4, Thane"
                      value={formData.address}
                      disabled={!canEdit}
                      onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                      className="glass"
                    />
                  </div>
                </div>
              )}

              {/* Pharmacy inputs */}
              {meta?.value === "pharmacy" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ph-name">Pharmacy Name</Label>
                    <Input
                      id="ph-name"
                      placeholder="MedLife Pharmacy"
                      value={formData.fullName}
                      disabled={!canEdit}
                      onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                      className="glass"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ph-owner">Licensed Pharmacist Name</Label>
                    <Input
                      id="ph-owner"
                      placeholder="Rahul Sharma"
                      value={formData.ownerName}
                      disabled={!canEdit}
                      onChange={(e) => setFormData(p => ({ ...p, ownerName: e.target.value }))}
                      className="glass"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Upload Documents grid */}
            <div className="space-y-4">
              <h3 className="text-base font-bold font-sans flex items-center gap-2 border-b pb-2">
                <Upload className="h-5 w-5 text-primary" /> Verification Documents & Certificates
              </h3>
              
              <div className="grid gap-3">
                {meta?.docs.map((d) => {
                  const uploaded = documents.find((x) => x.document_type === d.type);
                  return (
                    <div key={d.type} className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-xl p-4 border bg-card/30">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 font-semibold text-sm">
                          {uploaded ? (
                            <FileCheck2 className="h-5 w-5 text-primary animate-pulse" />
                          ) : (
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          )}
                          {d.label}
                        </div>
                        {uploaded && (
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground border-t pt-2 border-border/30">
                            <span>
                              AI Quality Score: <strong className="text-foreground">{Number(uploaded.ai_score ?? 100).toFixed(0)}</strong>
                            </span>
                            {uploaded.classified_as && (
                              <span>
                                Classified: <strong className="text-foreground capitalize">{uploaded.classified_as.toLowerCase()}</strong>
                              </span>
                            )}
                            {Array.isArray(uploaded.flags) && uploaded.flags.length > 0 && (
                              <span className="flex items-center gap-1 text-amber-500 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">
                                <AlertTriangle className="h-3 w-3" /> {uploaded.flags.length} Flag(s)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {canEdit && (
                        <div className="flex items-center gap-2">
                          {/* File input */}
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              disabled={uploading === d.type}
                              onChange={(e) => e.target.files?.[0] && uploadDoc(d.type, e.target.files[0])}
                            />
                            <span className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-accent transition-all shadow-sm">
                              {uploading === d.type ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Upload className="h-3.5 w-3.5 text-primary" />
                              )}
                              Upload
                            </span>
                          </label>

                          {/* Camera snapshot button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-xl gap-1.5 px-3"
                            disabled={uploading === d.type}
                            onClick={() => {
                              setActiveCamDocType(d.type);
                              setCameraOpen(true);
                            }}
                          >
                            <Camera className="h-3.5 w-3.5 text-primary" />
                            Capture
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right sidebar: AI summary / submit controls */}
          <div className="space-y-6">
            <div className="glass-card p-6 border space-y-4 rounded-2xl bg-gradient-to-b from-card to-card/50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 border-b pb-2">
                <HelpCircle className="h-4 w-4" /> Review Submission
              </h3>

              <div className="text-xs text-muted-foreground leading-relaxed space-y-3">
                <p>
                  Reach a minimum of <strong>80% profile completion</strong> to activate reviewer review. 
                </p>
                <div className="rounded-xl border bg-muted/40 p-3 flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span>KYC Progress:</span>
                    <strong className="text-foreground">{kycProgress.percent}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Readiness:</span>
                    <strong className="text-foreground capitalize">{kycProgress.readiness}</strong>
                  </div>
                </div>
              </div>

              {canEdit ? (
                <Button
                  onClick={handleSubmit}
                  disabled={kycProgress.percent < 80}
                  className="w-full min-h-11 font-semibold text-sm transition-transform hover:scale-[1.01]"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Submit For Review
                </Button>
              ) : (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary leading-normal flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Your profile is currently **{verification.status}**. Submissions cannot be edited unless requested by the reviewer.
                  </span>
                </div>
              )}
            </div>

            {verification.ai_summary && (
              <div className="glass-card p-5 border rounded-2xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">AI Report Extraction</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{verification.ai_summary}</p>
              </div>
            )}
            
            {verification.reviewer_remarks && (
              <div className="glass-card p-5 border border-destructive/20 bg-destructive/5 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-destructive">Reviewer Feedback</h4>
                <p className="text-xs text-destructive/80 leading-relaxed">{verification.reviewer_remarks}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={cameraOpen}
        onClose={() => {
          setCameraOpen(false);
          setActiveCamDocType(null);
        }}
        onCapture={handleCameraCapture}
      />
    </div>
  );
}
