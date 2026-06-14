"use client";

import { useEffect, useState } from "react";
import { getCrmPatients, sendCrmCampaign } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users,
  Search,
  BellRing,
  PhoneCall,
  Megaphone,
  Loader2,
  CalendarCheck,
  Send,
  UserCheck
} from "lucide-react";

export default function HealthcareCrmPage() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  
  // Follow-ups local state
  const [followups, setFollowups] = useState<any[]>([
    { id: "f1", name: "Rahul Verma", phone: "9876543210", date: "2026-06-15", notes: "Consult regarding CBC report values." },
    { id: "f2", name: "Anita Deshmukh", phone: "9123456789", date: "2026-06-13", notes: "Thyroid follow-up appointment reminder." }
  ]);
  const [followupOpen, setFollowupOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [followupForm, setFollowupForm] = useState({ date: "", notes: "" });

  // Campaign local state
  const [campaign, setCampaign] = useState({ name: "", target: "all", message: "" });
  const [campaignSending, setCampaignSending] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getCrmPatients();
      if (res.success) {
        setPatients(res.patients || []);
      }
    } catch (err) {
      toast.error("Failed to load CRM patients list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateFollowup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupForm.date || !selectedPatient) return;
    
    const newFollowup = {
      id: Math.random().toString(36).substring(7),
      name: selectedPatient.patient_name,
      phone: selectedPatient.patient_phone,
      date: followupForm.date,
      notes: followupForm.notes
    };
    
    setFollowups((prev) => [newFollowup, ...prev]);
    setFollowupOpen(false);
    setFollowupForm({ date: "", notes: "" });
    toast.success(`Follow-up scheduled with ${selectedPatient.patient_name}!`);
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign.name || !campaign.message) return;
    setCampaignSending(true);
    try {
      const res = await sendCrmCampaign({
        campaignName: campaign.name,
        targetGroup: campaign.target,
        message: campaign.message
      });
      if (res.success) {
        toast.success(`Campaign "${campaign.name}" broadcasted successfully!`);
        setCampaign({ name: "", target: "all", message: "" });
      } else {
        toast.error("Failed to execute campaign broadcast");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to broadcast");
    } finally {
      setCampaignSending(false);
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_phone.includes(search)
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold font-sans sm:text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <Users className="h-8 w-8 text-primary shrink-0" /> Healthcare CRM Hub
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your patient database, schedule follow-ups, and trigger bulk check-up reminder campaigns.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left side: Patients list & Follow ups */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient database */}
          <section className="glass-card p-6 border rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold font-sans flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" /> Patient Records
              </h2>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-xs glass"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-10">No patient bookings logged.</p>
            ) : (
              <div className="border rounded-xl overflow-hidden bg-card/10">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-muted/30 border-b text-muted-foreground font-semibold">
                      <th className="p-3">Patient Name</th>
                      <th className="p-3">Mobile Contact</th>
                      <th className="p-3">Last Action Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {filteredPatients.map((p, idx) => (
                      <tr key={idx} className="hover:bg-muted/10">
                        <td className="p-3 font-semibold text-foreground">{p.patient_name}</td>
                        <td className="p-3 font-mono">{p.patient_phone}</td>
                        <td className="p-3 text-muted-foreground">{p.preferred_date}</td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-lg text-[10px] font-semibold gap-1"
                            onClick={() => {
                              setSelectedPatient(p);
                              setFollowupOpen(true);
                            }}
                          >
                            <PhoneCall className="h-3 w-3 text-primary" /> Follow-up
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Follow-up Reminders */}
          <section className="glass-card p-6 border rounded-2xl space-y-4">
            <h2 className="text-base font-bold font-sans flex items-center gap-2 border-b pb-2">
              <CalendarCheck className="h-5 w-5 text-primary" /> Scheduled Follow-ups
            </h2>
            <div className="grid gap-3">
              {followups.map((f) => (
                <div key={f.id} className="rounded-xl border bg-card/45 p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-foreground">{f.name}</div>
                    <p className="text-xs text-muted-foreground">Notes: {f.notes}</p>
                    <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      Call Scheduled: {f.date}
                    </div>
                  </div>
                  <Badge variant="outline" className="h-6 gap-1 px-2.5">
                    <PhoneCall className="h-3 w-3" /> Scheduled
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right side: Retention Campaigns */}
        <div className="lg:col-span-1">
          <section className="glass-card p-6 border rounded-2xl bg-gradient-to-b from-primary/5 to-transparent space-y-4">
            <div>
              <h2 className="text-base font-bold font-sans flex items-center gap-2 border-b pb-2">
                <Megaphone className="h-5 w-5 text-primary" /> Retention Campaigns
              </h2>
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-normal">
                Trigger mass SMS/Email alerts to check-up targets. Keep your patients engaged and boost consultation volume.
              </p>
            </div>

            <form onSubmit={handleSendCampaign} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="camp-name">Campaign Title *</Label>
                <Input
                  id="camp-name"
                  required
                  placeholder="e.g. Free Blood Sugar Checkup"
                  value={campaign.name}
                  onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                  className="glass text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="camp-target">Target Patient Group *</Label>
                <select
                  id="camp-target"
                  value={campaign.target}
                  onChange={(e) => setCampaign({ ...campaign, target: e.target.value })}
                  className="w-full h-10 border rounded-lg bg-card px-3 text-xs glass"
                >
                  <option value="all">All Registered Patients</option>
                  <option value="past_due">Patients due for follow-up</option>
                  <option value="pre_diabetic">Prediabetic Risk Groups</option>
                  <option value="heart_care">Cardio Risk Groups</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="camp-msg">Broadcast Message *</Label>
                <Textarea
                  id="camp-msg"
                  required
                  placeholder="e.g. Dear Patient, it is time for your annual diagnostic health check. Use promo code SURYA10 for a 10% discount on labs."
                  rows={5}
                  value={campaign.message}
                  onChange={(e) => setCampaign({ ...campaign, message: e.target.value })}
                  className="glass text-xs"
                />
              </div>

              <Button type="submit" className="w-full btn-gradient min-h-10 text-xs font-semibold gap-1.5" disabled={campaignSending}>
                {campaignSending ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white" /> : <Send className="h-3.5 w-3.5 text-white" />}
                Broadcast Campaign
              </Button>
            </form>
          </section>
        </div>
      </div>

      {/* Schedule follow up modal */}
      <Dialog open={followupOpen} onOpenChange={setFollowupOpen}>
        <DialogContent className="sm:max-w-md glass-strong">
          <DialogHeader>
            <DialogTitle className="font-sans font-bold flex items-center gap-1.5">
              <PhoneCall className="h-5 w-5 text-primary" /> Schedule Follow-up Call
            </DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <form onSubmit={handleCreateFollowup} className="space-y-4 pt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Patient: {selectedPatient.patient_name}</Label>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fl-date">Preferred Date *</Label>
                <Input
                  id="fl-date"
                  type="date"
                  required
                  value={followupForm.date}
                  onChange={(e) => setFollowupForm({ ...followupForm, date: e.target.value })}
                  className="glass text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fl-notes">Follow-up Notes</Label>
                <Textarea
                  id="fl-notes"
                  placeholder="e.g. Discuss CBC marker results, schedule clinic visit."
                  value={followupForm.notes}
                  onChange={(e) => setFollowupForm({ ...followupForm, notes: e.target.value })}
                  rows={3}
                  className="glass text-xs"
                />
              </div>
              <Button type="submit" className="w-full btn-gradient min-h-10 text-xs font-semibold">
                Schedule Call
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
