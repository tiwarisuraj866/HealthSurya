"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTicketDetails, sendTicketMessage, resolveSupportTicket } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Clock,
  Send,
  User,
  ShieldAlert,
  Inbox
} from "lucide-react";
import { useAuth } from "@/lib/auth";

function statusVariant(status: string) {
  if (status === "resolved") return "default";
  if (status === "closed") return "secondary";
  if (status === "pending") return "outline";
  return "destructive";
}

export default function SupportTicketDetailClient({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);

  const load = async () => {
    try {
      const res = await getTicketDetails(ticketId);
      if (res.success) {
        setTicket(res.ticket);
        setMessages(res.messages || []);
      } else {
        toast.error("Ticket not found or access denied");
        router.push("/dashboard/support");
      }
    } catch (err) {
      toast.error("Failed to load ticket");
      router.push("/dashboard/support");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [ticketId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await sendTicketMessage(ticketId, reply.trim());
      if (res.success) {
        setReply("");
        toast.success("Message sent");
        load();
      } else {
        toast.error(res.error || "Failed to send message");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (resolving) return;
    setResolving(true);
    try {
      const res = await resolveSupportTicket(ticketId);
      if (res.success) {
        toast.success("Ticket marked as resolved");
        load();
      } else {
        toast.error(res.error || "Failed to resolve ticket");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve");
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-6">
      <Link
        href="/dashboard/support"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-2"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Support Center
      </Link>

      {/* Ticket Details Board */}
      <section className="glass-card p-6 rounded-2xl border bg-card/40 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(ticket.status) as any} className="capitalize py-0.5 font-semibold text-[10px]">
              {ticket.status}
            </Badge>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Category: {ticket.category.replace("_", " ")}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              Created: {new Date(ticket.created_at).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-xl font-bold font-sans sm:text-2xl text-foreground leading-tight">
            {ticket.title}
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>

        {ticket.status !== "resolved" && ticket.status !== "closed" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResolve}
            disabled={resolving}
            className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold gap-1.5 h-9 shrink-0"
          >
            {resolving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Mark Resolved
          </Button>
        )}
      </section>

      {/* Discussion message history */}
      <section className="glass-card rounded-2xl border bg-card/25 flex flex-col h-[28rem] overflow-hidden">
        <header className="px-5 py-3 border-b bg-card/40 flex items-center gap-2 shrink-0">
          <Inbox className="h-4 w-4 text-primary shrink-0" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Discussion Thread</h3>
        </header>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-card/10">
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-20">No messages logged in this discussion.</p>
          ) : (
            messages.map((m) => {
              const isMe = m.sender_id === user?.id;
              const senderRole = m.profiles?.role || "patient";
              const isAdminMsg = ["admin", "super_admin", "support"].includes(senderRole);

              return (
                <div key={m.id} className={`flex items-start gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <div className={`p-1 rounded-lg shrink-0 mt-0.5 ${isAdminMsg ? "bg-amber-500/10 border border-amber-500/20 text-amber-500" : "bg-primary/10 border border-primary/20 text-primary"}`}>
                      {isAdminMsg ? <ShieldAlert className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs max-w-[75%] leading-relaxed shadow-sm ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-card border text-card-foreground rounded-tl-none"
                    }`}
                  >
                    {!isMe && (
                      <span className="block text-[9px] font-bold text-muted-foreground/80 mb-1">
                        {m.profiles?.full_name || "Support Staff"}{" "}
                        {isAdminMsg && <span className="text-amber-500 font-semibold">[Staff]</span>}
                      </span>
                    )}
                    <p className="whitespace-pre-line">{m.message}</p>
                    <span className="block text-[8px] text-right mt-1 opacity-60">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input box */}
        {ticket.status !== "closed" ? (
          <form onSubmit={handleSend} className="p-4 border-t bg-card/85 backdrop-blur-md flex gap-2 shrink-0">
            <Input
              required
              placeholder="Type your message to support staff..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="min-h-11 glass text-xs"
              disabled={sending}
            />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0 btn-gradient" disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white" />}
            </Button>
          </form>
        ) : (
          <div className="p-4 border-t bg-muted/40 text-center text-xs text-muted-foreground shrink-0 leading-normal">
            🔓 This support ticket has been closed and locked. If you still experience issues, please open a new support ticket.
          </div>
        )}
      </section>
    </div>
  );
}
