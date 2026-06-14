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
import { toast } from "sonner";
import { FileUp, Loader2, CheckCircle } from "lucide-react";

export default function PharmacySetupPage() {
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
    close_time: "22:00",
  });

  // Verification document states
  const [ownerName, setOwnerName] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [drugLicenseFile, setDrugLicenseFile] = useState<File | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch existing pharmacy info
    (supabase
      .from("pharmacies" as any)
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
          close_time: data.close_time ?? "22:00",
        });
      });

    // Fetch verification status
    (supabase
      .from("pharmacy_verifications" as any)
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

    if (!verification && (!idFile || !drugLicenseFile || !ownerName)) {
      toast.error("Please provide owner details and upload required drug license/identity certificates.");
      return;
    }

    setLoading(true);
    try {
      let idUrl = verification?.identity_proof_url || "";
      let licenseUrl = verification?.drug_license_url || "";

      if (idFile || drugLicenseFile) {
        setUploadingDocs(true);
        if (idFile) {
          idUrl = await handleFileUpload(idFile, "pharmacy_owner_id");
        }
        if (drugLicenseFile) {
          licenseUrl = await handleFileUpload(drugLicenseFile, "drug_license");
        }
        setUploadingDocs(false);
      }

      // 1. Save pharmacy info to 'pharmacies' table
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
      };

      const { data: prevPharmacy } = (await supabase.from("pharmacies" as any).select("id").eq("owner_id", user.id).maybeSingle()) as any;
      if (prevPharmacy) {
        await supabase.from("pharmacies" as any).update(payload).eq("id", prevPharmacy.id);
      } else {
        await supabase.from("pharmacies" as any).insert(payload);
      }

      // 2. Save/Update pharmacy verification record
      if (verification) {
        await supabase
          .from("pharmacy_verifications" as any)
          .update({
            pharmacy_name: form.name,
            owner_name: ownerName,
            identity_proof_url: idUrl,
            drug_license_url: licenseUrl,
            status: "pending",
          })
          .eq("id", verification.id);
      } else {
        await supabase.from("pharmacy_verifications" as any).insert({
          profile_id: user.id,
          pharmacy_name: form.name,
          owner_name: ownerName,
          identity_proof_url: idUrl,
          drug_license_url: licenseUrl,
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
      toast.success("Pharmacy profile saved and verification documents submitted!");
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
      <h1 className="text-3xl font-bold">Register Pharmacy & Verification</h1>
      <p className="mt-1 text-muted-foreground">
        Submit your pharmacy store details and drug license certificates. HealthSurya will allow you to receive medicine orders once verified.
      </p>

      {verification?.status === "approved" && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-success/30 bg-success/5 p-4 text-success-foreground">
          <CheckCircle className="h-5 w-5 text-success" />
          <div>
            <p className="text-sm font-semibold">Verification Approved</p>
            <p className="text-xs text-muted-foreground">Your pharmacy is active and ready to deliver medicines.</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-6 rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-bold border-b pb-2">1. Drug Licensing & Owner Info (Required)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="owner-name">Owner Name *</Label>
            <Input
              id="owner-name"
              required
              disabled={verification?.status === "approved"}
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Full name of drug license holder / owner"
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
            <Label>Drug License Certificate (PDF/Image) *</Label>
            {verification ? (
              <p className="text-xs text-muted-foreground">Document uploaded. Re-upload to overwrite.</p>
            ) : null}
            <Input
              type="file"
              accept="image/*,application/pdf"
              required={!verification}
              onChange={(e) => setDrugLicenseFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <h2 className="text-lg font-bold border-b pb-2">2. Pharmacy Listing Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Pharmacy Name *</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Surya Medicos"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Express delivery range, categories of medicines stocked..."
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
            <Label>Store Cover Image URL</Label>
            <Input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://…"
            />
          </div>
        </div>

        <Button type="submit" className="w-full btn-gradient min-h-11" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {uploadingDocs ? "Uploading licenses…" : "Saving pharmacy details…"}
            </>
          ) : (
            "Submit Pharmacy Profile & Verification"
          )}
        </Button>
      </form>
    </div>
  );
}
