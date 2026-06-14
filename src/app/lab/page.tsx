"use client";

import { useAuth } from "@/lib/auth";
import { StaffManagement } from "@/components/StaffManagement";
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Beaker, Users, Calendar, ClipboardList, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { updateLabBookingStatus, getDoctorsList, addLabTest, deleteLabTest } from "@/app/actions";

export default function LabDashboardPage() {
  const { user, roles, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [lab, setLab] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [testsCatalog, setTestsCatalog] = useState<any[]>([]);

  // new lab_test form state
  const [testId, setTestId] = useState("");
  const [customTestName, setCustomTestName] = useState("");
  const [price, setPrice] = useState("");
  const [home, setHome] = useState(false);
  const [tat, setTat] = useState("");
  const [submittingTest, setSubmittingTest] = useState(false);

  // Referral state
  const [activeReferralBooking, setActiveReferralBooking] = useState<any>(null);
  const [isPrescriptionVerified, setIsPrescriptionVerified] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [customDoctorName, setCustomDoctorName] = useState<string>("");
  const [commissionVal, setCommissionVal] = useState<string>("");

  const loadData = async () => {
    if (!user) return;
    try {
      // Fetch lab
      const { data: labData, error: labError } = await supabase
        .from("labs")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (labError) throw labError;
      setLab(labData);

      if (labData) {
        // Fetch lab bookings
        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select("*, tests(name), profiles:patient_id(full_name, phone)")
          .eq("lab_id", labData.id)
          .order("scheduled_at", { ascending: false });

        if (bookingError) throw bookingError;
        setBookings(bookingData || []);

        // Fetch lab tests configured for this lab
        const { data: labTestsData, error: labTestsError } = await supabase
          .from("lab_tests")
          .select("*, tests(name, category)")
          .eq("lab_id", labData.id);
        if (labTestsError) throw labTestsError;
        setLabTests(labTestsData || []);

        // Fetch tests catalog
        const { data: testsCatalogData, error: testsCatalogError } = await supabase
          .from("tests")
          .select("*")
          .order("name");
        if (testsCatalogError) throw testsCatalogError;
        setTestsCatalog(testsCatalogData || []);
      }

      const docsList = await getDoctorsList();
      setDoctors(docsList || []);
    } catch (err: any) {
      console.error("Error loading lab dashboard data:", err);
      toast.error("Failed to load lab data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !roles.includes("lab")) {
      router.replace("/unauthorized");
    }
  }, [authLoading, roles, router]);

  useEffect(() => {
    loadData();
  }, [user]);

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testId) return toast.error("Please select a test or enter a custom one");
    if (testId === "custom" && !customTestName.trim()) {
      return toast.error("Please specify a custom test name");
    }
    if (!price) return toast.error("Please specify a price");
    setSubmittingTest(true);
    try {
      const res = await addLabTest({
        testId: testId !== "custom" ? testId : undefined,
        customTestName: testId === "custom" ? customTestName : undefined,
        price: Number(price),
        homeCollection: home,
        turnaroundHours: tat ? Number(tat) : 24,
      });
      if (res.success) {
        toast.success("Pathology test added to your list");
        setTestId("");
        setCustomTestName("");
        setPrice("");
        setHome(false);
        setTat("");
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add test");
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleRemoveTest = async (id: string) => {
    try {
      const res = await deleteLabTest(id);
      if (res.success) {
        toast.success("Pathology test removed");
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to remove test");
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    try {
      const res = await updateLabBookingStatus(id, status);
      if (res.success) {
        toast.success("Appointment status updated");
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleUpdateBookingStatusWithReferral = async (
    id: string,
    status: string,
    reportUrl?: string,
    referredDoctorId?: string | null,
    referredDoctorName?: string | null,
    prescriptionVerified?: boolean,
    commissionAmount?: number
  ) => {
    try {
      const res = await updateLabBookingStatus(
        id,
        status,
        reportUrl,
        referredDoctorId,
        referredDoctorName,
        prescriptionVerified,
        commissionAmount
      );
      if (res.success) {
        toast.success("Appointment details updated");
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update details");
    }
  };

  const handleStatusSelect = (booking: any, newStatus: string) => {
    if (newStatus === "sample_collected") {
      setActiveReferralBooking(booking);
      setIsPrescriptionVerified(booking.prescription_verified || false);
      setSelectedDoctorId(booking.referred_doctor_id || "");
      setCustomDoctorName(booking.referred_doctor_name || "");
      setCommissionVal(booking.commission_amount ? String(booking.commission_amount) : (Number(booking.price) * 0.15).toFixed(0));
    } else {
      handleUpdateBookingStatus(booking.id, newStatus);
    }
  };

  const availableTests = testsCatalog.filter((t) => !labTests.find((lt) => lt.test_id === t.id));

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <Beaker className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">No Lab Registered</h1>
        <p className="mt-2 text-muted-foreground">You need to register your pathology lab details first.</p>
        <a href="/lab-setup" className="mt-6 inline-flex btn-gradient px-4 py-2 rounded-xl text-sm font-semibold">
          Register Lab
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{lab.name} Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your path lab diagnostic bookings, packages, and staff access.
        </p>
      </div>

      <Tabs defaultValue="bookings" className="mt-8 space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="bookings" className="rounded-lg"><Calendar className="h-4 w-4 mr-1.5" /> Bookings</TabsTrigger>
          <TabsTrigger value="tests" className="rounded-lg"><Beaker className="h-4 w-4 mr-1.5" /> Tests & Pricing</TabsTrigger>
          <TabsTrigger value="staff" className="rounded-lg"><Users className="h-4 w-4 mr-1.5" /> Staff Access</TabsTrigger>
        </TabsList>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card className="rounded-2xl shadow-sm border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Patient Bookings</CardTitle>
              <CardDescription>View, track, and upload diagnostic report PDFs for patient bookings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-xl overflow-hidden bg-card/50">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Patient & Test</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status & Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No bookings received yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      bookings.map((b) => (
                        <React.Fragment key={b.id}>
                          <TableRow className="hover:bg-muted/10">
                            <TableCell>
                              <div className="font-semibold">{b.tests?.name || "Diagnostic Test"}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Patient: <span className="font-medium text-foreground">{b.profiles?.full_name || "Patient"}</span> · {b.profiles?.phone || "—"}
                              </div>
                              {(b.referred_doctor_name || b.prescription_verified) && (
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  {b.prescription_verified && (
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none py-0.5 text-[9px]">
                                      ✓ Prescription Verified
                                    </Badge>
                                  )}
                                  {b.referred_doctor_name && (
                                    <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none py-0.5 text-[9px]">
                                      Referred by: {b.referred_doctor_name} (Comm: ₹{b.commission_amount || 0})
                                    </Badge>
                                  )}
                                </div>
                              )}
                              {b.report_url && (
                                <div className="mt-1">
                                  <a
                                    href={b.report_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-primary font-bold hover:underline"
                                  >
                                    View Report →
                                  </a>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {new Date(b.scheduled_at).toLocaleDateString()} at {new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {b.home_collection ? "Home Sample" : "Lab Visit"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">₹{Number(b.price).toFixed(0)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-2">
                                <Select value={b.status} onValueChange={(v) => handleStatusSelect(b, v)}>
                                  <SelectTrigger className="w-[150px] min-h-8 glass bg-card capitalize text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="text-xs">
                                    {[
                                      "pending",
                                      "confirmed",
                                      "sample_collected",
                                      "processing",
                                      "fnf",
                                      "completed",
                                      "cancelled",
                                    ].map((s) => (
                                      <SelectItem key={s} value={s} className="capitalize text-xs">
                                        {s.replace(/_/g, " ")}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                          </TableRow>
                          {b.status !== "completed" && b.status !== "cancelled" && (
                            <TableRow className="bg-muted/5 hover:bg-muted/5 border-b-2">
                              <TableCell colSpan={5} className="py-2.5 px-4 text-xs">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                  <span className="text-muted-foreground font-semibold">Upload Diagnostic Report PDF/Image:</span>
                                  <Input
                                    type="file"
                                    accept="application/pdf,image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const toastId = toast.loading("Uploading report file to secure storage...");
                                      try {
                                        const formData = new FormData();
                                        formData.append("file", file);
                                        formData.append("folder", "reports");

                                        const res = await fetch("/api/upload", {
                                          method: "POST",
                                          body: formData,
                                        });
                                        if (!res.ok) throw new Error("File upload failed");
                                        const data = await res.json();
                                        
                                        // Save report url and mark booking as completed
                                        await handleUpdateBookingStatusWithReferral(
                                          b.id,
                                          "completed",
                                          data.url
                                        );
                                        toast.success("Report uploaded and booking completed!", { id: toastId });
                                      } catch (err: any) {
                                        toast.error("Failed to upload report: " + err.message, { id: toastId });
                                      }
                                    }}
                                    className="w-[200px] h-8 text-[11px] bg-card/35 cursor-pointer py-1"
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tests & Pricing Tab */}
        <TabsContent value="tests">
          <Card className="rounded-2xl shadow-sm border border-border bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold font-sans">
                <Beaker className="h-5 w-5 text-primary" /> Pathology Tests Catalog
              </CardTitle>
              <CardDescription>
                Configure the pathology tests you perform, set pricing, turnaround time (TAT), and home pickup options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form
                onSubmit={handleAddTest}
                className="flex flex-wrap gap-4 rounded-2xl border bg-card/40 glass p-5 items-end shadow-sm"
              >
                <div className="space-y-1.5 min-w-[200px] flex-1">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-primary">Pathology Test *</Label>
                  <select
                    value={testId}
                    onChange={(e) => {
                      setTestId(e.target.value);
                      if (e.target.value !== "custom") {
                        setCustomTestName("");
                      }
                    }}
                    className="w-full min-h-11 rounded-md border border-input bg-card px-3 py-2 text-sm glass focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                  >
                    <option value="" className="text-foreground bg-card">-- Pick a test from catalog --</option>
                    {availableTests.map((t) => (
                      <option key={t.id} value={t.id} className="text-foreground bg-card">
                        {t.name} ({t.category})
                      </option>
                    ))}
                    <option value="custom" className="text-foreground bg-card">-- Custom Test (Type below) --</option>
                  </select>
                </div>

                {testId === "custom" && (
                  <div className="space-y-1.5 min-w-[200px] flex-1">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-primary">Custom Test Name *</Label>
                    <Input
                      required
                      value={customTestName}
                      onChange={(e) => setCustomTestName(e.target.value)}
                      placeholder="e.g. Covid-19 RT-PCR"
                      className="glass min-h-11"
                    />
                  </div>
                )}

                <div className="space-y-1.5 min-w-[120px] flex-[0.5]">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-primary">Price (₹) *</Label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 499"
                    className="glass min-h-11"
                  />
                </div>
                <div className="space-y-1.5 min-w-[120px] flex-[0.5]">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-primary">TAT (Hours)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={tat}
                    onChange={(e) => setTat(e.target.value)}
                    placeholder="e.g. 24"
                    className="glass min-h-11"
                  />
                </div>
                <div className="flex flex-col gap-2 justify-center pb-2.5 min-w-[100px]">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-primary cursor-pointer">
                    Home Pickup
                  </Label>
                  <Switch checked={home} onCheckedChange={setHome} />
                </div>
                <Button type="submit" className="min-h-11 px-6 min-w-[120px]" disabled={submittingTest}>
                  {submittingTest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="mr-1 h-4 w-4" />}
                  Add Test
                </Button>
              </form>

              {/* Pathology Lab Tests List */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold font-sans">Active Test Offerings</h3>
                {labTests.length === 0 ? (
                  <div className="rounded-xl border bg-card/25 p-8 text-center text-sm text-muted-foreground">
                    No pathology tests configured yet. Use the form above to list tests you perform.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {labTests.map((lt) => (
                      <div
                        key={lt.id}
                        className="flex items-center justify-between gap-4 rounded-xl border bg-card/40 p-4 hover:bg-card/70 transition-all shadow-sm"
                      >
                        <div>
                          <div className="font-bold text-foreground">{lt.tests?.name}</div>
                          <div className="text-xs text-muted-foreground mt-1 space-x-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {lt.tests?.category}
                            </Badge>
                            <span>Price: <strong>₹{lt.price}</strong></span>
                            {lt.home_collection && <span className="text-primary font-medium text-[10px]">· Home Pickup</span>}
                            {lt.turnaround_hours && <span className="text-[10px]">· {lt.turnaround_hours}h TAT</span>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTest(lt.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff">
          <StaffManagement
            parentProfileId={user!.id}
            staffRole="lab_staff"
            title="Laboratory Staff Access Management"
          />
        </TabsContent>
      </Tabs>

      {/* Referral details modal */}
      {activeReferralBooking && (
        <Dialog open={!!activeReferralBooking} onOpenChange={(open) => { if (!open) setActiveReferralBooking(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Verify Prescription & Referral</DialogTitle>
              <DialogDescription>
                Record patient prescription verification and referring doctor commissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-sm border-b pb-3 space-y-1">
                <p><strong>Patient:</strong> {activeReferralBooking.profiles?.full_name || "Patient"}</p>
                <p><strong>Pathology Test:</strong> {activeReferralBooking.tests?.name || "Blood Test"}</p>
                <p><strong>Price:</strong> ₹{activeReferralBooking.price}</p>
              </div>

              {/* Prescription verification */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="prescription-verified-tab"
                  checked={isPrescriptionVerified}
                  onChange={(e) => setIsPrescriptionVerified(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="prescription-verified-tab" className="text-sm font-semibold select-none cursor-pointer">
                  Doctor&apos;s Prescription Verified
                </label>
              </div>

              {/* Doctor Referral Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-primary">Referring Doctor</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    if (e.target.value !== "custom") {
                      setCustomDoctorName("");
                    }
                  }}
                  className="w-full min-h-10 rounded-md border bg-card px-3 py-1.5 text-sm"
                >
                  <option value="">-- Direct Patient (No Referral) --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.clinic_name || "Clinic"})
                    </option>
                  ))}
                  <option value="custom">-- Other Doctor (Type Name) --</option>
                </select>
              </div>

              {/* Custom Doctor Name */}
              {selectedDoctorId === "custom" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-primary">Doctor Name (Custom)</label>
                  <Input
                    required
                    value={customDoctorName}
                    onChange={(e) => setCustomDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Satish Pal"
                  />
                </div>
              )}

              {/* Commission Amount */}
              {(selectedDoctorId || customDoctorName) && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-primary">Doctor Commission (₹)</label>
                  <Input
                    type="number"
                    value={commissionVal}
                    onChange={(e) => setCommissionVal(e.target.value)}
                    placeholder="e.g. 75"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Auto-calculated 15% is ₹{(Number(activeReferralBooking.price) * 0.15).toFixed(0)}. You can adjust this.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveReferralBooking(null)}>Cancel</Button>
              <Button
                onClick={async () => {
                  const docId = selectedDoctorId && selectedDoctorId !== "custom" ? selectedDoctorId : null;
                  const docName = selectedDoctorId === "custom" ? customDoctorName : (doctors.find(d => d.id === selectedDoctorId)?.full_name || null);
                  const commission = (docId || docName) ? Number(commissionVal || 0) : 0;
                  
                  await handleUpdateBookingStatusWithReferral(
                    activeReferralBooking.id,
                    "sample_collected",
                    undefined,
                    docId,
                    docName,
                    isPrescriptionVerified,
                    commission
                  );
                  setActiveReferralBooking(null);
                }}
              >
                Save & Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
