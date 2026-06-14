"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { getAiChatHistory, sendAiChatMessage, createSupportTicket } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Sparkles,
  Bot,
  User,
  AlertCircle,
  FolderSync,
  HeartHandshake
} from "lucide-react";
import { toast } from "sonner";

export function AiAssistant() {
  const { user, roles } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Support ticket escalation state
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({ title: "", description: "", category: "general" });
  const [escalating, setEscalating] = useState(false);

  const isPartner = roles.includes("doctor") || roles.includes("lab") || roles.includes("pharmacy");
  const chatContext = isPartner ? "partner" : "patient";

  useEffect(() => {
    if (open && user) {
      loadHistory();
    }
  }, [open, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadHistory = async () => {
    setFetchingHistory(true);
    try {
      const res = await getAiChatHistory(chatContext);
      if (res.success) {
        setMessages(res.messages || []);
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !user) return;

    const userMsg = input.trim();
    setInput("");
    
    // Add user message locally for immediate UI update
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userMsg, timestamp: new Date().toISOString() }
    ]);
    
    setLoading(true);

    try {
      const res = await sendAiChatMessage(userMsg, chatContext);
      if (res.success) {
        setMessages(res.messages || []);
      } else {
        toast.error("Failed to get response");
      }
    } catch (err) {
      toast.error("Error sending message");
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.title || !ticketForm.description || escalating) return;
    setEscalating(true);
    try {
      const res = await createSupportTicket({
        title: ticketForm.title,
        description: ticketForm.description,
        category: ticketForm.category
      });
      if (res.success) {
        toast.success("Support Ticket created successfully!");
        setEscalateOpen(false);
        setTicketForm({ title: "", description: "", category: "general" });
        // Add a message in the chat confirming escalation
        setMessages((prev) => [
          ...prev,
          {
            sender: "assistant",
            text: `✨ I've successfully escalated your issue to support staff. A support ticket has been created with ID #${res.ticket?.id?.slice(0, 8)}. You can track its progress in the 'Support Tickets' dashboard page.`,
            timestamp: new Date().toISOString()
          }
        ]);
      } else {
        toast.error(res.error || "Failed to create ticket");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to escalate");
    } finally {
      setEscalating(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-[45]">
        <Button
          onClick={() => setOpen(!open)}
          className="h-14 w-14 rounded-full shadow-2xl btn-gradient flex items-center justify-center p-0 transition-transform hover:scale-105 active:scale-95"
          aria-label="Toggle AI Assistant"
        >
          {open ? <X className="h-6 w-6 text-white" /> : <MessageSquare className="h-6 w-6 text-white" />}
        </Button>
      </div>

      {/* Glassmorphic Chat Widget container */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[45] w-[min(calc(100vw-2rem),24rem)] h-[32rem] max-h-[calc(100dvh-8rem)] glass-strong rounded-2xl border flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <header className="px-4 py-3 bg-gradient-to-r from-primary/90 to-accent text-white flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                <Bot className="h-5 w-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none flex items-center gap-1.5">
                  HealthSurya AI <Sparkles className="h-3 w-3 text-emerald-200 animate-pulse" />
                </h3>
                <span className="text-[10px] text-white/75 font-semibold capitalize tracking-wide">
                  {chatContext} Support Assistant
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 h-8 w-8 rounded-lg"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-card/10">
            {fetchingHistory ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                Retrieving conversation logs...
              </div>
            ) : (
              <>
                {messages.map((m, idx) => {
                  const isBot = m.sender === "assistant";
                  return (
                    <div key={idx} className={`flex items-start gap-2.5 ${isBot ? "justify-start" : "justify-end"}`}>
                      {isBot && (
                        <div className="bg-primary/10 border border-primary/20 p-1 rounded-lg shrink-0 mt-0.5">
                          <Bot className="h-3.5 w-3.5 text-primary" />
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-xs max-w-[80%] leading-relaxed shadow-sm ${
                          isBot
                            ? "bg-card border text-card-foreground rounded-tl-none"
                            : "bg-primary text-primary-foreground rounded-tr-none"
                        }`}
                      >
                        <p className="whitespace-pre-line">{m.text}</p>
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex items-start gap-2.5 justify-start">
                    <div className="bg-primary/10 border border-primary/20 p-1 rounded-lg shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="rounded-2xl px-3.5 py-2.5 text-xs bg-card border text-card-foreground rounded-tl-none flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Footer Controls */}
          <footer className="p-3 border-t bg-card/85 backdrop-blur-md flex flex-col gap-2 shrink-0">
            {/* Quick Actions / Escalation trigger */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] h-7 rounded-full px-2.5 shrink-0 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold gap-1"
                onClick={() => setEscalateOpen(true)}
              >
                <AlertCircle className="h-3 w-3" /> Escalate to Ticket
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] h-7 rounded-full px-2.5 shrink-0 font-medium"
                onClick={() => {
                  setInput("Suggest tips to complete my KYC profile details.");
                }}
              >
                KYC Help
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] h-7 rounded-full px-2.5 shrink-0 font-medium"
                onClick={() => {
                  setInput("How does the Trust Score system work?");
                }}
              >
                Trust Score Info
              </Button>
            </div>

            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                required
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask HealthSurya AI..."
                className="min-h-10 glass text-xs"
                disabled={loading}
              />
              <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={loading}>
                <Send className="h-4 w-4 text-white" />
              </Button>
            </form>
          </footer>
        </div>
      )}

      {/* Support Ticket Escalation dialog */}
      <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
        <DialogContent className="sm:max-w-md glass-strong">
          <DialogHeader>
            <DialogTitle className="font-sans font-bold flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-primary" /> Escalate Support Ticket
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEscalate} className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground leading-normal">
              If the AI bot could not resolve your query, please open a direct ticket for our customer support review.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="esc-title">Issue Title *</Label>
              <Input
                id="esc-title"
                required
                placeholder="e.g. KYC verification delay, Booking refund failed"
                value={ticketForm.title}
                onChange={(e) => setTicketForm((p) => ({ ...p, title: e.target.value }))}
                className="glass"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="esc-cat">Category *</Label>
                <select
                  id="esc-cat"
                  required
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full h-10 border rounded-lg bg-card px-3 py-2 text-xs glass"
                >
                  <option value="general">General Help</option>
                  <option value="verification">KYC / Verification</option>
                  <option value="appointment">Doctor Appointment</option>
                  <option value="lab_test">Lab Bookings</option>
                  <option value="payment">Billing / Payments</option>
                  <option value="technical">Technical Glitch</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="esc-desc">Detailed Description *</Label>
              <Textarea
                id="esc-desc"
                required
                placeholder="Please describe what issue you are experiencing so support staff can quickly investigate."
                value={ticketForm.description}
                onChange={(e) => setTicketForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
                className="glass text-xs"
              />
            </div>
            <div className="flex gap-2.5 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEscalateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 btn-gradient animate-pulse" disabled={escalating}>
                {escalating ? "Submitting Escalation..." : "Escalate Ticket"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
