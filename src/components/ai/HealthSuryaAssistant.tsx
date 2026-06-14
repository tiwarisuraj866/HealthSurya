"use client";

// HealthSurya V2 — Floating AI Assistant (role-aware support agent).
// Escalation flow: AI Agent → Support Ticket → Admin.

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Send, Loader2, LifeBuoy } from "lucide-react";

interface Msg { role: "user" | "assistant"; content: string }

const QUICK_PROMPTS = [
  "How do I complete my KYC?",
  "Book a doctor appointment",
  "Book a lab test",
  "Create a ticket",
];

export function HealthSuryaAssistant() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // Hide on auth pages to keep them clean
  if (["/login", "/register", "/sso-callback", "/verify"].some((p) => pathname?.startsWith(p))) return null;
  if (!user) return null;

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply || "Sorry, I couldn't process that. Please try again." }]);
      if (data.ticketNo) {
        setTimeout(() => router.prefetch?.("/support"), 100);
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "I'm having trouble connecting. You can raise a ticket at /support." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open HealthSurya AI Assistant"
          className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-primary p-3.5 text-primary-foreground shadow-lg transition-transform hover:scale-105 lg:bottom-6"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-2 z-50 flex h-[min(560px,75vh)] w-[min(380px,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl lg:bottom-6 lg:right-6">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <div className="text-sm font-semibold leading-tight">HealthSurya Assistant</div>
                <div className="text-[11px] opacity-80">Bookings • KYC • Payments • Support</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-full p-1 hover:bg-white/15">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 && (
              <div className="pt-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Hi{user?.full_name ? ` ${user.full_name.split(" ")[0]}` : ""}! How can I help today?
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.map((q) => (
                    <button key={q} onClick={() => send(q)}
                      className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {m.content.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                  part.startsWith("**") ? <b key={j}>{part.slice(2, -2)}</b> : part
                )}
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </div>
            )}
          </div>

          <div className="border-t p-2">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Ask anything…"
                className="h-9 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
              />
              <Button size="sm" className="h-9" onClick={() => send()} disabled={busy || !input.trim()} aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <button onClick={() => router.push("/support")}
              className="mt-1.5 flex w-full items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-primary">
              <LifeBuoy className="h-3 w-3" /> Open Support Centre
            </button>
          </div>
        </div>
      )}
    </>
  );
}
