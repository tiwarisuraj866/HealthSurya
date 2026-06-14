"use client";

// HealthSurya V2 — Support Centre: create, track and chat on tickets.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LifeBuoy, Plus, Send, Loader2, ArrowLeft, MessageSquare, CheckCircle2, Bot } from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  appointment: "Appointment", lab_test: "Lab Test", payment: "Payment",
  verification: "Verification", technical: "Technical", general: "General",
};
const STATUS_COLOR: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  pending: "bg-amber-100 text-amber-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-muted text-muted-foreground",
};

interface Ticket {
  id: string; ticket_no: number; subject: string; category: string;
  status: string; source: string; created_at: string; updated_at: string;
}
interface TicketMessage {
  id: string; sender_role: string; body: string; created_at: string;
}

export default function SupportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "create" | "thread">("list");
  const [active, setActive] = useState<Ticket | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/tickets");
    if (res.ok) setTickets((await res.json()).tickets);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login?redirect=/support"); return; }
    load();
  }, [authLoading, user, router, load]);

  if (authLoading || (loading && view === "list")) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {view === "list" && (
        <>
          <div className="flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <LifeBuoy className="h-6 w-6 text-primary" /> Support Centre
            </h1>
            <Button onClick={() => setView("create")}>
              <Plus className="mr-1.5 h-4 w-4" /> New ticket
            </Button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            We typically respond within 24–48 hours. The AI assistant (bottom-right) can resolve many issues instantly.
          </p>

          {tickets.length === 0 ? (
            <Card className="mt-8">
              <CardContent className="flex flex-col items-center py-14 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-medium">No tickets yet</p>
                <p className="mt-1 text-sm text-muted-foreground">When you need help, create a ticket and chat with our team here.</p>
                <Button className="mt-5" onClick={() => setView("create")}>Create your first ticket</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 space-y-3">
              {tickets.map((t) => (
                <button key={t.id} className="w-full text-left"
                  onClick={() => { setActive(t); setView("thread"); }}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center justify-between gap-3 py-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">#{t.ticket_no}</span>
                          {t.source === "ai_escalation" && <Bot className="h-3.5 w-3.5 text-primary" aria-label="Escalated from AI" />}
                          <span className="truncate font-medium">{t.subject}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {CATEGORY_LABEL[t.category] ?? t.category} • Updated {new Date(t.updated_at).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                      <Badge variant="secondary" className={`shrink-0 capitalize ${STATUS_COLOR[t.status] ?? ""}`}>{t.status}</Badge>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {view === "create" && (
        <CreateTicket
          onBack={() => setView("list")}
          onCreated={async () => { await load(); setView("list"); }}
        />
      )}

      {view === "thread" && active && (
        <TicketThread
          ticket={active}
          onBack={async () => { await load(); setView("list"); }}
        />
      )}
    </div>
  );
}

function CreateTicket({ onBack, onCreated }: { onBack: () => void; onCreated: () => void }) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) { toast.error("Please add a subject and message"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, message }),
      });
      if (res.ok) { toast.success("Ticket created — we'll get back to you soon."); onCreated(); }
      else toast.error((await res.json()).error || "Could not create ticket");
    } finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <Button variant="ghost" size="sm" className="w-fit -ml-2" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <CardTitle>New support ticket</CardTitle>
        <CardDescription>Describe the issue and pick the closest category.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={140} />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Textarea placeholder="Tell us what happened…" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} />
        <Button onClick={submit} disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Create ticket
        </Button>
      </CardContent>
    </Card>
  );
}

function TicketThread({ ticket, onBack }: { ticket: Ticket; onBack: () => void }) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [status, setStatus] = useState(ticket.status);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tickets/${ticket.id}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
      setStatus(data.ticket.status);
    }
    setLoading(false);
  }, [ticket.id]);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply }),
      });
      if (res.ok) { setReply(""); await load(); }
      else toast.error("Could not send message");
    } finally { setBusy(false); }
  };

  const close = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      if (res.ok) { toast.success("Ticket closed"); onBack(); }
    } finally { setBusy(false); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" /> All tickets
          </Button>
          <Badge variant="secondary" className={`capitalize ${STATUS_COLOR[status] ?? ""}`}>{status}</Badge>
        </div>
        <CardTitle className="text-base">#{ticket.ticket_no} — {ticket.subject}</CardTitle>
        <CardDescription>{CATEGORY_LABEL[ticket.category] ?? ticket.category}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2"><Skeleton className="h-16 w-3/4" /><Skeleton className="ml-auto h-16 w-3/4" /></div>
        ) : (
          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
            {messages.map((m) => (
              <div key={m.id} className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                m.sender_role === "admin" ? "bg-primary/10" : m.sender_role === "ai" ? "bg-muted text-muted-foreground" : "ml-auto bg-secondary"
              }`}>
                <div className="mb-0.5 text-[11px] font-medium text-muted-foreground">
                  {m.sender_role === "admin" ? "HealthSurya Support" : m.sender_role === "ai" ? "AI Assistant" : "You"}
                  {" • "}{new Date(m.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </div>
                {m.body}
              </div>
            ))}
          </div>
        )}

        {status !== "closed" ? (
          <div className="mt-4 space-y-2">
            <Textarea rows={3} placeholder="Write a reply…" value={reply} onChange={(e) => setReply(e.target.value)} maxLength={4000} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={send} disabled={busy || !reply.trim()}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Send
              </Button>
              {status === "resolved" && (
                <Button variant="outline" onClick={close} disabled={busy}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Close ticket
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">This ticket is closed. Create a new ticket if you need more help.</p>
        )}
      </CardContent>
    </Card>
  );
}
