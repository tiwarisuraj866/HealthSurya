"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileUp, Loader2, CheckCircle } from "lucide-react";

export default function LabSetupPage() {
  const { user, refreshRoles } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);

  // Form states
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    pincode: "",
    phone: "",
    email: "",
    image_url: "",
    open_time: "08:00",
    close_time: "20:00",
    home_collection: true,
  });

  // Verification document states
  const [ownerName, setOwnerName] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [regCertFile, setRegCertFile] = useState<File | null>(null);
  const [nablCertFile, setNablCertFile] = useState<File | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch existing lab info
    (supabase
      .from("labs" as any)
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle() as any)
      .then(({ data }: any) => {
        if (!data) return;
        setExisting(data);
        setForm({
          name: data.name,
          description: data.description ?? "",
          address: data.address,
          city: data.city,
          pincode: data.pincode,
          phone: data.phone,
          email: data.email ?? "",
          image_url: data.image_url ?? "",
          open_time: data.open_time ?? "08:00",
          close_time: data.close_time ?? "20:00",
          home_collection: data.home_collection,
        });
      });

    // Fetch verification status
    (supabase
      .from("lab_verifications" as any)
      .select("*")
      .eq("profile_id", user.id)
      .maybeSingle() as any)
      .then(({ data }: any) => {
        if (data) {
          setVerification(data);
          setOwnerName(data.owner_name);
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

    if (!verification && (!idFile || !regCertFile || !ownerName)) {
      toast.error("Please provide owner details and upload required registration/identity certificates.");
      return;
    }

    setLoading(true);
    try {
      let idUrl = verification?.identity_proof_url || "";
      let regCertUrl = verification?.registration_cert_url || "";
      let nablCertUrl = verification?.nabl_cert_url || "";

      if (idFile || regCertFile || nablCertFile) {
        setUploadingDocs(true);
        if (idFile) {
          idUrl = await handleFileUpload(idFile, "lab_owner_id");
        }
        if (regCertFile) {
          regCertUrl = await handleFileUpload(regCertFile, "lab_reg_cert");
        }
        if (nablCertFile) {
          nablCertUrl = await handleFileUpload(nablCertFile, "lab_nabl_cert");
        }
        setUploadingDocs(false);
      }

      // 1. Save lab info to 'labs' table
      const payload = {
        owner_id: user.id,
        name: form.name,
        description: form.description || null,
        address: form.address,
        city: form.city,
        pincode: form.pincode,
        phone: form.phone,
        email: form.email || null,
        image_url: form.image_url || null,
        open_time: form.open_time,
        close_time: form.close_time,
        home_collection: form.home_collection,
      };

      const { data: prevLab } = (await supabase.from("labs" as any).select("id").eq("owner_id", user.id).maybeSingle()) as any;
      if (prevLab) {
        await supabase.from("labs" as any).update(payload).eq("id", prevLab.id);
      } else {
        await supabase.from("labs" as any).insert(payload);
      }

      // 2. Save/Update lab verification record
      if (verification) {
        await supabase
          .from("lab_verifications" as any)
          .update({
            lab_name: form.name,
            owner_name: ownerName,
            identity_proof_url: idUrl,
            registration_cert_url: regCertUrl,
            nabl_cert_url: nablCertUrl || null,
            status: "pending",
          })
          .eq("id", verification.id);
      } else {
        await supabase.from("lab_verifications" as any).insert({
          profile_id: user.id,
          lab_name: form.name,
          owner_name: ownerName,
          identity_proof_url: idUrl,
          registration_cert_url: regCertUrl,
          nabl_cert_url: nablCertUrl || null,
          status: "pending",
        });
      }

      // 3. Set profile status to pending
      await supabase
        .from("profiles" as any)
        .update({
          verification_status: "pending",
        } as any)
        .eq("id", user.id);

      await refreshRoles();
      toast.success("Lab profile saved and verification documents submitted!");
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
      <h1 className="text-3xl font-bold">Register Pathology Lab & Verification</h1>
      <p className="mt-1 text-muted-foreground">
        Submit your lab facility profile and registration licenses. HealthSurya will display your diagnostic packages online once verified.
      </p>

      {verification?.status === "approved" && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-success/30 bg-success/5 p-4 text-success-foreground">
          <CheckCircle className="h-5 w-5 text-success" />
          <div>
            <p className="text-sm font-semibold">Verification Approved</p>
            <p className="text-xs text-muted-foreground">Your diagnostic lab is active and visible to patients.</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-6 rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-bold border-b pb-2">1. Verification Certificates (Required)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="owner-name">Owner / Director Name *</Label>
            <Input
              id="owner-name"
              required
              disabled={verification?.status === "approved"}
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Full name of director or owner"
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
            <Label>Lab Registration Certificate (PDF/Image) *</Label>
            {verification ? (
              <p className="text-xs text-muted-foreground">Document uploaded. Re-upload to overwrite.</p>
            ) : null}
            <Input
              type="file"
              accept="image/*,application/pdf"
              required={!verification}
              onChange={(e) => setRegCertFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>NABL Quality Accreditation Certificate (Optional)</Label>
            {verification?.nabl_cert_url ? (
              <p className="text-xs text-muted-foreground">NABL Certificate uploaded. Re-upload to overwrite.</p>
            ) : null}
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setNablCertFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <h2 className="text-lg font-bold border-b pb-2">2. Lab Listing details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Lab Name *</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. PathCare Diagnostics"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Diagnostic services, machinery details, specialties..."
              maxLength={500}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Address *</Label>
            <Input
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>City *</Label>
            <Input
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Pincode *</Label>
            <Input
              required
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone *</Label>
            <Input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Open time</Label>
            <Input
              type="time"
              value={form.open_time}
              onChange={(e) => setForm({ ...form, open_time: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Close time</Label>
            <Input
              type="time"
              value={form.close_time}
              onChange={(e) => setForm({ ...form, close_time: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Cover Image URL</Label>
            <Input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div className="flex items-center justify-between sm:col-span-2">
            <Label>Offer home sample collection</Label>
            <Switch
              checked={form.home_collection}
              onCheckedChange={(v) => setForm({ ...form, home_collection: v })}
            />
          </div>
        </div>

        <Button type="submit" className="w-full btn-gradient min-h-11" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {uploadingDocs ? "Uploading credentials…" : "Saving lab details…"}
            </>
          ) : (
            "Submit Lab Profile & Verification"
          )}
        </Button>
      </form>
    </div>
  );
}
