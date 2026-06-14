"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle, X, Send, Sun, ShieldCheck, Mail, CheckCircle2,
  ChevronDown, Loader2,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_REPLIES = [
  "How do I register?",
  "How do I track my order?",
  "Become a franchise partner",
  "Reset my password",
];

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

async function askSurya(history: Message[], name: string, email: string) {
  const res = await fetch("/api/ai/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: history.map((m) => ({ role: m.role, content: m.content })),
      name,
      email
    }),
  });
  if (!res.ok) throw new Error("request_failed");
  const data = await res.json();
  return data.reply || "Sorry, I couldn't generate a reply just now. Please try again.";
}

export default function HealthSuryaSupportChat() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"welcome" | "chat">("welcome");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, step]);

  function startChat() {
    if (!isValidEmail(email)) {
      setEmailErr("Enter a valid email so we can send your welcome message.");
      return;
    }
    setEmailErr("");
    const firstName = name.trim().split(" ")[0] || "there";
    setStep("chat");
    setMessages([
      {
        role: "assistant",
        content: `Welcome to HealthSurya, ${firstName}! A welcome email is on its way to ${email}. I'm Surya — ask me anything about using the platform, your account, orders, or partner onboarding. How can I help?`,
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    setError("");
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setLoading(true);
    try {
      const reply = await askSurya(next, name, email);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setError("Couldn't reach support right now. Please try again in a moment.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  const firstName = name.trim().split(" ")[0] || "there";

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Panel */}
      {open && (
        <div
          className="mb-3 flex w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-[#E0EAE8] bg-white shadow-2xl"
          style={{ height: "560px", maxHeight: "calc(100vh - 7rem)" }}
        >
          {/* Header */}
          <div
            className="relative flex items-center gap-3 px-4 py-3.5 text-white"
            style={{ background: "linear-gradient(135deg,#0E5C5B 0%,#14807E 100%)" }}
          >
            <div className="absolute right-3 top-2 opacity-20">
              <Sun size={56} strokeWidth={1.5} />
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <Sun size={20} className="text-[#F4B860]" />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold leading-tight">HealthSurya Support</div>
              <div className="flex items-center gap-1 text-[11px] text-white/80">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7DE3B0]" />
                Surya · usually replies instantly
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close support chat"
              className="ml-auto rounded-full p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* WELCOME STEP */}
          {step === "welcome" && (
            <div className="flex flex-1 flex-col overflow-y-auto px-5 py-5">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FBF1DE]">
                <Sun size={24} className="text-[#E0962A]" />
              </div>
              <h2 className="text-center text-[17px] font-semibold text-[#0F2E2D]">
                Welcome to HealthSurya
              </h2>
              <p className="mt-1 text-center text-[13px] leading-relaxed text-[#5A6B6A]">
                Tell us who you are and we'll send a welcome email, then I'll help
                with anything about using the platform.
              </p>

              <div className="mt-5 space-y-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-[#3C4D4C]">
                    Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-[#DCE6E4] bg-[#F7FAFA] px-3.5 py-2.5 text-[14px] text-[#0F2E2D] outline-none transition focus:border-[#14807E] focus:bg-white focus:ring-2 focus:ring-[#14807E]/15"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-[#3C4D4C]">
                    Email
                  </label>
                  <input
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailErr(""); }}
                    onKeyDown={(e) => e.key === "Enter" && startChat()}
                    placeholder="you@example.com"
                    type="email"
                    className="w-full rounded-xl border border-[#DCE6E4] bg-[#F7FAFA] px-3.5 py-2.5 text-[14px] text-[#0F2E2D] outline-none transition focus:border-[#14807E] focus:bg-white focus:ring-2 focus:ring-[#14807E]/15"
                  />
                  {emailErr && (
                    <p className="mt-1.5 text-[12px] text-[#C0492B]">{emailErr}</p>
                  )}
                </div>
                <button
                  onClick={startChat}
                  className="mt-1 w-full rounded-xl bg-[#0E5C5B] py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#0a4948] active:scale-[0.99]"
                >
                  Get started
                </button>
              </div>

              <div className="mt-auto flex items-start gap-2 rounded-xl bg-[#F2F7F6] px-3 py-2.5 text-[11.5px] leading-relaxed text-[#5A6B6A]">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#14807E]" />
                <span>
                  Never share passwords, OTPs, or card numbers here. Your details
                  are handled under the DPDP Act, 2023.
                </span>
              </div>
            </div>
          )}

          {/* CHAT STEP */}
          {step === "chat" && (
            <>
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#F7FAFA] px-4 py-4">
                {/* Welcome email confirmation */}
                <div className="rounded-xl border border-[#E6EFE6] bg-white px-3.5 py-3">
                  <div className="flex items-center gap-2 text-[12.5px] font-medium text-[#15803D]">
                    <CheckCircle2 size={15} /> Welcome email sent to {email}
                  </div>
                  <button
                    onClick={() => setShowEmailPreview((v) => !v)}
                    className="mt-1.5 flex items-center gap-1 text-[12px] text-[#14807E] hover:underline"
                  >
                    <Mail size={13} /> Preview email
                    <ChevronDown size={13} className={`transition ${showEmailPreview ? "rotate-180" : ""}`} />
                  </button>
                  {showEmailPreview && (
                    <div className="mt-2 rounded-lg border border-[#ECECEC] bg-[#FCFCFB] p-3 text-[12px] leading-relaxed text-[#3C4D4C]">
                      <div className="mb-1.5 border-b border-[#EEE] pb-1.5 text-[11px] text-[#8A9594]">
                        <div><span className="font-medium text-[#5A6B6A]">To:</span> {email}</div>
                        <div><span className="font-medium text-[#5A6B6A]">Subject:</span> Welcome to HealthSurya ☀️</div>
                      </div>
                      <p>Hi {firstName},</p>
                      <p className="mt-1.5">
                        Welcome to HealthSurya! Your account is ready. You can search
                        medicines, upload prescriptions, place orders, and track
                        deliveries from <span className="font-medium">My Orders</span>.
                      </p>
                      <p className="mt-1.5">
                        Need help getting started? Just reply in chat — Surya is here
                        Mon–Sat, 9am–7pm IST.
                      </p>
                      <p className="mt-1.5 text-[#8A9594]">— Team HealthSurya</p>
                    </div>
                  )}
                </div>

                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={
                        m.role === "user"
                          ? "max-w-[82%] rounded-2xl rounded-br-md bg-[#0E5C5B] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white"
                          : "max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-[#E6EFEE] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#1B302F]"
                      }
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-[#E6EFEE] bg-white px-3.5 py-2.5 text-[13px] text-[#8A9594]">
                      <Loader2 size={14} className="animate-spin" /> Surya is typing…
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-[#FBEAE6] px-3.5 py-2.5 text-[12.5px] text-[#C0492B]">
                    {error}
                  </div>
                )}

                {/* Quick replies (only before first user message) */}
                {messages.filter((m) => m.role === "user").length === 0 && !loading && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {QUICK_REPLIES.map((q) => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        className="rounded-full border border-[#CFE3E1] bg-white px-3 py-1.5 text-[12px] text-[#14807E] transition hover:bg-[#EAF4F3]"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div className="border-t border-[#EAF0EF] bg-white px-3 py-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="Ask about orders, account, onboarding…"
                    className="max-h-28 flex-1 resize-none rounded-xl border border-[#DCE6E4] bg-[#F7FAFA] px-3.5 py-2.5 text-[13.5px] text-[#0F2E2D] outline-none transition focus:border-[#14807E] focus:bg-white focus:ring-2 focus:ring-[#14807E]/15"
                  />
                  <button
                    onClick={() => send()}
                    disabled={loading || !input.trim()}
                    aria-label="Send message"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0E5C5B] text-white transition hover:bg-[#0a4948] disabled:opacity-40"
                  >
                    <Send size={17} />
                  </button>
                </div>
                <p className="mt-1.5 text-center text-[10.5px] text-[#9AA5A4]">
                  Surya helps with using HealthSurya. Don't share passwords or OTPs.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close support chat" : "Open support chat"}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg,#0E5C5B 0%,#14807E 100%)" }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && (
          <span className="absolute right-12 top-0 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F4B860] opacity-60" />
            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#F2A93B]">
              <Sun size={10} className="text-white" />
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
