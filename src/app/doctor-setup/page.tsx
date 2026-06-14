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
import { Globe, Copy, FileUp, Loader2, CheckCircle } from "lucide-react";

const SPECIALIZATIONS = [
  "General Physician",
  "Pediatrician",
  "Gynecologist",
  "Dermatologist",
  "Orthopedic",
  "Cardiologist",
  "ENT",
  "Dentist",
  "Ayurveda",
  "Homeopathy",
];

export default function DoctorSetupPage() {
  const { user, refreshRoles } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);

  // Form states
  const [form, setForm] = useState({
    full_name: "",
    photo_url: "",
    qualification: "",
    specialization: "General Physician",
    experience_years: "",
    about: "",
    consultation_fee: "",
    clinic_name: "",
    clinic_address: "",
    clinic_city: "Jaunpur",
    clinic_pincode: "",
    clinic_phone: "",
    whatsapp: "",
    map_embed_url: "",
    open_time: "09:00",
    close_time: "18:00",
    timings_note: "",
    published: true,
    theme_color: "teal",
    seo_title: "",
    seo_description: "",
  });

  // Verification document states
  const [regNumber, setRegNumber] = useState("");
  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [regCertFile, setRegCertFile] = useState<File | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch existing doctor profile
    (supabase
      .from("doctors" as any)
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle() as any)
      .then(({ data }: any) => {
        if (!data) return;
        setExisting(data);
        setForm({
          full_name: data.full_name,
          photo_url: data.photo_url ?? "",
          qualification: data.qualification ?? "",
          specialization: data.specialization ?? "General Physician",
          experience_years: data.experience_years?.toString() ?? "",
          about: data.about ?? "",
          consultation_fee: data.consultation_fee?.toString() ?? "",
          clinic_name: data.clinic_name ?? "",
          clinic_address: data.clinic_address ?? "",
          clinic_city: data.clinic_city,
          clinic_pincode: data.clinic_pincode ?? "",
          clinic_phone: data.clinic_phone ?? "",
          whatsapp: data.whatsapp ?? "",
          map_embed_url: data.map_embed_url ?? "",
          open_time: data.open_time ?? "09:00",
          close_time: data.close_time ?? "18:00",
          timings_note: data.timings_note ?? "",
          published: data.published,
          theme_color: data.theme_color ?? "teal",
          seo_title: data.seo_title ?? "",
          seo_description: data.seo_description ?? "",
        });
      });

    // Fetch verification status
    (supabase
      .from("doctor_verifications" as any)
      .select("*")
      .eq("profile_id", user.id)
      .maybeSingle() as any)
      .then(({ data }: any) => {
        if (data) {
          setVerification(data);
          setRegNumber(data.registration_number);
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

    if (!verification && (!govIdFile || !regCertFile || !regNumber)) {
      toast.error("Please provide your medical registration details and upload documents.");
      return;
    }

    setLoading(true);
    try {
      let govIdUrl = verification?.government_id_url || "";
      let regCertUrl = verification?.registration_cert_url || "";

      if (govIdFile || regCertFile) {
        setUploadingDocs(true);
        if (govIdFile) {
          govIdUrl = await handleFileUpload(govIdFile, "gov_id");
        }
        if (regCertFile) {
          regCertUrl = await handleFileUpload(regCertFile, "reg_cert");
        }
        setUploadingDocs(false);
      }

      // 1. Save doctor info
      const payload = {
        owner_id: user.id,
        full_name: form.full_name,
        photo_url: form.photo_url || null,
        qualification: form.qualification || null,
        specialization: form.specialization || null,
        experience_years: form.experience_years ? parseInt(form.experience_years, 10) : null,
        about: form.about || null,
        consultation_fee: form.consultation_fee ? parseFloat(form.consultation_fee) : null,
        clinic_name: form.clinic_name || null,
        clinic_address: form.clinic_address || null,
        clinic_city: form.clinic_city,
        clinic_pincode: form.clinic_pincode || null,
        clinic_phone: form.clinic_phone || null,
        whatsapp: form.whatsapp || form.clinic_phone || null,
        map_embed_url: form.map_embed_url || null,
        open_time: form.open_time,
        close_time: form.close_time,
        timings_note: form.timings_note || null,
        published: form.published,
        theme_color: form.theme_color,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
      };

      const { data: prevDoc } = (await supabase.from("doctors" as any).select("id").eq("owner_id", user.id).maybeSingle()) as any;
      if (prevDoc) {
        await supabase.from("doctors" as any).update(payload).eq("id", prevDoc.id);
      } else {
        await supabase.from("doctors" as any).insert(payload);
      }

      // 2. Save/Update doctor verification record
      if (verification) {
        await supabase
          .from("doctor_verifications" as any)
          .update({
            registration_number: regNumber,
            government_id_url: govIdUrl,
            registration_cert_url: regCertUrl,
            status: "pending",
          })
          .eq("id", verification.id);
      } else {
        await supabase.from("doctor_verifications" as any).insert({
          profile_id: user.id,
          registration_number: regNumber,
          government_id_url: govIdUrl,
          registration_cert_url: regCertUrl,
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
      toast.success("Profile saved and verification documents submitted!");
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
      <h1 className="text-3xl font-bold">Doctor Profile Setup & Verification</h1>
      <p className="mt-1 text-muted-foreground">
        Submit your clinic profile details and medical registration credentials. HealthSurya uses this to create your public mini website once verified.
      </p>

      {verification?.status === "approved" && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-success/30 bg-success/5 p-4 text-success-foreground">
          <CheckCircle className="h-5 w-5 text-success" />
          <div>
            <p className="text-sm font-semibold">Verification Approved</p>
            <p className="text-xs text-muted-foreground">Your account is fully active and visible in public searches.</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-6 rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-bold border-b pb-2">1. Medical Credentials (Required for Verification)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="reg-number">Medical Council Registration Number *</Label>
            <Input
              id="reg-number"
              required
              disabled={verification?.status === "approved"}
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
              placeholder="e.g. MCI-12345"
            />
          </div>

          <div className="space-y-2">
            <Label>Government ID Proof (PDF/Image) *</Label>
            {verification ? (
              <p className="text-xs text-muted-foreground">Document uploaded. Re-upload to overwrite.</p>
            ) : null}
            <Input
              type="file"
              accept="image/*,application/pdf"
              required={!verification}
              onChange={(e) => setGovIdFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="space-y-2">
            <Label>Registration Certificate (PDF/Image) *</Label>
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
        </div>

        <h2 className="text-lg font-bold border-b pb-2">2. Clinic and Contact Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Full name (Dr.) *</Label>
            <Input
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Rajesh Gupta"
            />
          </div>
          <div className="space-y-2">
            <Label>Specialization *</Label>
            <Input
              list="specs"
              required
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            />
            <datalist id="specs">
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label>Qualification</Label>
            <Input
              value={form.qualification}
              onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              placeholder="MBBS, MD"
            />
          </div>
          <div className="space-y-2">
            <Label>Experience (years)</Label>
            <Input
              type="number"
              min={0}
              value={form.experience_years}
              onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Consultation fee (₹)</Label>
            <Input
              type="number"
              min={0}
              value={form.consultation_fee}
              onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>About</Label>
            <Textarea
              value={form.about}
              onChange={(e) => setForm({ ...form, about: e.target.value })}
              maxLength={2000}
              rows={4}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Photo URL</Label>
            <Input
              value={form.photo_url}
              onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Clinic Name</Label>
            <Input
              value={form.clinic_name}
              onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
              placeholder="Gupta Healthcare Clinic"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Clinic Address *</Label>
            <Input
              required
              value={form.clinic_address}
              onChange={(e) => setForm({ ...form, clinic_address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>City *</Label>
            <Input
              required
              value={form.clinic_city}
              onChange={(e) => setForm({ ...form, clinic_city: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Pincode</Label>
            <Input
              value={form.clinic_pincode}
              onChange={(e) => setForm({ ...form, clinic_pincode: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Clinic phone *</Label>
            <Input
              required
              value={form.clinic_phone}
              onChange={(e) => setForm({ ...form, clinic_phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp number</Label>
            <Input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="Same as phone if empty"
            />
          </div>
          <div className="space-y-2">
            <Label>Open Time</Label>
            <Input
              type="time"
              value={form.open_time}
              onChange={(e) => setForm({ ...form, open_time: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Close Time</Label>
            <Input
              type="time"
              value={form.close_time}
              onChange={(e) => setForm({ ...form, close_time: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between sm:col-span-2">
            <Label>Publish mini website</Label>
            <Switch
              checked={form.published}
              onCheckedChange={(v) => setForm({ ...form, published: v })}
            />
          </div>
        </div>

        <h2 className="text-lg font-bold border-b pb-2">3. Mini-Website Personalization & SEO</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="theme-color">Website Accent Theme *</Label>
            <select
              id="theme-color"
              value={form.theme_color}
              onChange={(e) => setForm({ ...form, theme_color: e.target.value })}
              className="w-full h-11 border rounded-lg bg-card px-3 text-sm glass"
            >
              <option value="teal">Teal (Default Surya)</option>
              <option value="blue">Royal Blue</option>
              <option value="emerald">Emerald Green</option>
              <option value="indigo">Deep Indigo</option>
              <option value="violet">Sunset Violet</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-title">Custom SEO Meta Title</Label>
            <Input
              id="seo-title"
              value={form.seo_title}
              onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
              placeholder="e.g. Best Cardiologist in Thane | Dr. Rajesh Gupta"
              className="glass"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="seo-desc">Custom SEO Meta Description</Label>
            <Textarea
              id="seo-desc"
              value={form.seo_description}
              onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
              placeholder="e.g. Book instant appointments with Dr. Rajesh Gupta. Specialized in heart surgery, arrhythmia treatments and pediatric cardiology in Jaunpur/Thane."
              rows={2}
              className="glass text-xs sm:text-sm"
            />
          </div>
        </div>

        <Button type="submit" className="w-full btn-gradient min-h-11" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {uploadingDocs ? "Uploading credentials…" : "Submitting onboarding details…"}
            </>
          ) : verification ? (
            "Update onboarding & profile"
          ) : (
            "Submit verification & profile details"
          )}
        </Button>
      </form>
    </div>
  );
}
