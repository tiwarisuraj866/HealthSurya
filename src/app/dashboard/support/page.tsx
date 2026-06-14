"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupportTickets, createSupportTicket } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  LifeBuoy,
  Plus,
  Loader2,
  Clock,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ChevronRight
} from "lucide-react";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "appointment", label: "Doctor Appointment" },
  { value: "lab_test", label: "Lab Booking" },
  { value: "verification", label: "KYC Verification" },
  { value: "payment", label: "Billing & Payment" },
  { value: "technical", label: "Technical Issue" }
];

function statusVariant(status: string) {
  if (status === "resolved") return "default";
  if (status === "closed") return "secondary";
  if (status === "pending") return "outline";
  return "destructive"; // open is urgent
}

export default function SupportTicketsPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "general" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getSupportTickets();
      if (res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) return;
    setSubmitting(true);
    try {
      const res = await createSupportTicket({
        title: form.title,
        description: form.description,
        category: form.category
      });
      if (res.success) {
        toast.success("Support ticket created!");
        setOpenModal(false);
        setForm({ title: "", description: "", category: "general" });
        load();
      } else {
        toast.error(res.error || "Failed to create ticket");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filter === "all") return true;
    if (filter === "resolved") return t.status === "resolved" || t.status === "closed";
    if (filter === "open") return t.status === "open" || t.status === "pending";
    return t.category === filter;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold font-sans sm:text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <LifeBuoy className="h-8 w-8 text-primary shrink-0" /> Support Ticket Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit platform issues, query booking errors, or request immediate verification overrides.
          </p>
        </div>

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button className="btn-gradient font-semibold gap-1.5 min-h-11">
              <Plus className="h-5 w-5" /> Open New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md glass-strong">
            <DialogHeader>
              <DialogTitle className="font-sans font-bold">Submit New Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="title">Issue Subject *</Label>
                <Input
                  id="title"
                  required
                  placeholder="e.g. Appointment scheduled for wrong timing"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="glass text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-11 border rounded-lg bg-card px-3 text-xs sm:text-sm glass"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Detailed Explanation *</Label>
                <Textarea
                  id="description"
                  required
                  placeholder="Describe your issue in detail. If applicable, mention Booking IDs, transaction amounts, or specific errors."
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="glass text-xs sm:text-sm"
                />
              </div>
              <Button type="submit" className="w-full btn-gradient min-h-11" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Ticket
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Filter and stats row */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter By:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg bg-card py-1 px-2.5 text-xs font-medium glass"
          >
            <option value="all">All Tickets</option>
            <option value="open">Active (Open/Pending)</option>
            <option value="resolved">Resolved / Closed</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-muted-foreground font-semibold">
          Total: <span className="text-foreground">{tickets.length}</span> · Resolved:{" "}
          <span className="text-foreground">{tickets.filter((t) => t.status === "resolved").length}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="glass-card text-center py-16 px-4 rounded-2xl border bg-card/45">
          <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="font-sans font-bold text-lg">No support tickets found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            You do not have any active or resolved support requests matching this filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {filteredTickets.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/support/${t.id}`}
              className="glass-card p-5 rounded-2xl border bg-card/25 hover:bg-card/45 flex items-center justify-between gap-4 transition-all hover:scale-[1.005] group"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(t.status) as any} className="capitalize font-semibold text-[10px] py-0.5">
                    {t.status}
                  </Badge>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.category.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    ID: #{t.id.slice(0, 8)}
                  </span>
                </div>
                <h3 className="font-bold text-foreground font-sans text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                  {t.title}
                </h3>
                <p className="text-xs text-muted-foreground/90 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  Last updated: {new Date(t.updated_at).toLocaleDateString()} at{" "}
                  {new Date(t.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
