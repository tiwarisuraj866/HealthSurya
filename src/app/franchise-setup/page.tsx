"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileUp, Loader2, CheckCircle } from "lucide-react";

export default function FranchiseSetupPage() {
  const { user, refreshRoles } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<any>(null);

  // Form states
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    address: "",
    city: "",
    pincode: "",
    phone: "",
    email: "",
    gstNumber: "",
  });

  // Verification document states
  const [idFile, setIdFile] = useState<File | null>(null);
  const [businessCertFile, setBusinessCertFile] = useState<File | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch existing franchise verification status
    (supabase
      .from("partner_verifications" as any)
      .select("*")
      .eq("partner_id", user.id)
      .eq("partner_type", "franchise")
      .maybeSingle() as any)
      .then(({ data }: any) => {
        if (data) {
          setVerification(data);
          setForm({
            businessName: data.full_name || "",
            ownerName: data.full_name || "",
            address: data.address || "",
            city: user.city || "",
            pincode: "",
            phone: user.phone || "",
            email: user.email || "",
            gstNumber: data.registration_number || "",
          });
        }
      });
  }, [user]);

  const handleFileUpload = async (file: File, folder: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errMsg = await res.text();
      throw new Error(errMsg || "Failed to upload file");
    }

    const data = await res.json();
    return data.url;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!verification && (!idFile || !businessCertFile || !form.ownerName)) {
      toast.error("Please provide owner details and upload identity and business registration certificates.");
      return;
    }

    setLoading(true);
    try {
      let idUrl = "";
      let businessCertUrl = "";

      if (idFile || businessCertFile) {
        setUploadingDocs(true);
        if (idFile) {
          idUrl = await handleFileUpload(idFile, "franchise_owner_id");
        }
        if (businessCertFile) {
          businessCertUrl = await handleFileUpload(businessCertFile, "franchise_business_registration");
        }
        setUploadingDocs(false);
      }

      // 1. Start or update partner verifications
      let verificationId = verification?.id;
      if (verification) {
        await supabase
          .from("partner_verifications" as any)
          .update({
            full_name: form.ownerName,
            address: form.address,
            registration_number: form.gstNumber,
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", verification.id);
      } else {
        const { data: newVer, error: verErr } = await supabase
          .from("partner_verifications" as any)
          .insert({
            partner_id: user.id,
            partner_type: "franchise",
            full_name: form.ownerName,
            address: form.address,
            registration_number: form.gstNumber,
            status: "pending",
          })
          .select()
          .single() as any;
        if (verErr) throw verErr;
        verificationId = newVer.id;
      }

      // 2. Save documents in verification_documents
      if (idUrl) {
        await supabase.from("verification_documents" as any).insert({
          verification_id: verificationId,
          document_type: "identity_proof",
          file_url: idUrl,
        });
      }
      if (businessCertUrl) {
        await supabase.from("verification_documents" as any).insert({
          verification_id: verificationId,
          document_type: "business_registration",
          file_url: businessCertUrl,
        });
      }

      // 3. Set profile status to pending and save city/phone/full_name
      await supabase
        .from("profiles" as any)
        .update({
          verification_status: "pending",
          full_name: form.ownerName,
          city: form.city || null,
          phone: form.phone || null,
        } as any)
        .eq("id", user.id);

      await refreshRoles();
      toast.success("Franchise profile saved and verification documents submitted!");
      router.push("/verification-pending");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit onboarding profile.");
    } finally {
      setLoading(false);
      setUploadingDocs(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Register Franchise Branch & Verification</h1>
      <p className="mt-1 text-muted-foreground">
        Submit your franchise region administrative details and certificates. HealthSurya will activate your dashboard once verified.
      </p>

      {verification?.status === "approved" && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-success/30 bg-success/5 p-4 text-success-foreground">
          <CheckCircle className="h-5 w-5 text-success" />
          <div>
            <p className="text-sm font-semibold">Verification Approved</p>
            <p className="text-xs text-muted-foreground">Your franchise is active and verified.</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-6 rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-bold border-b pb-2">1. Owner Licensing & Info (Required)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="owner-name">Owner / Director Name *</Label>
            <Input
              id="owner-name"
              required
              disabled={verification?.status === "approved"}
              value={form.ownerName}
              onChange={(e) => setForm(p => ({ ...p, ownerName: e.target.value }))}
              placeholder="Full name of franchise branch owner"
            />
          </div>

          <div className="space-y-2">
            <Label>Owner Identity Proof (PDF/Image) *</Label>
            {verification ? (
              <p className="text-xs text-muted-foreground">Document uploaded. Re-upload to overwrite.</p>
            ) : null}
            <Input
              type="file"
              accept="image/*,application/pdf"
              required={!verification}
              onChange={(e) => setIdFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="space-y-2">
            <Label>Business Registration Certificate (PDF/Image) *</Label>
            {verification ? (
              <p className="text-xs text-muted-foreground">Document uploaded. Re-upload to overwrite.</p>
            ) : null}
            <Input
              type="file"
              accept="image/*,application/pdf"
              required={!verification}
              onChange={(e) => setBusinessCertFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <h2 className="text-lg font-bold border-b pb-2">2. Franchise Listing Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="business-name">Franchise Business Name *</Label>
            <Input
              id="business-name"
              required
              value={form.businessName}
              onChange={(e) => setForm(p => ({ ...p, businessName: e.target.value }))}
              placeholder="e.g. HealthSurya Maharashtra Central"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gst-number">GST / Incorporation Number (Optional)</Label>
            <Input
              id="gst-number"
              value={form.gstNumber}
              onChange={(e) => setForm(p => ({ ...p, gstNumber: e.target.value }))}
              placeholder="GSTIN or Registration Number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Contact Phone *</Label>
            <Input
              id="phone"
              required
              value={form.phone}
              onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="10-digit mobile number"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Registered Address *</Label>
            <Textarea
              id="address"
              required
              value={form.address}
              onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
              placeholder="Complete branch street address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City / Region *</Label>
            <Input
              id="city"
              required
              value={form.city}
              onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))}
              placeholder="e.g. Thane, Jaunpur"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode *</Label>
            <Input
              id="pincode"
              required
              value={form.pincode}
              onChange={(e) => setForm(p => ({ ...p, pincode: e.target.value }))}
              placeholder="6-digit postal code"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full sm:w-auto btn-gradient font-semibold min-h-11"
          disabled={loading || verification?.status === "approved"}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploadingDocs ? "Uploading Certificates..." : "Submitting Setup..."}
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" />
              Submit For Verification
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
