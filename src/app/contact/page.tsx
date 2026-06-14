"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Message sent successfully! We'll get back to you soon.");
      (e.target as HTMLFormElement).reset();
    }, 800);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 items-center">
      {/* Informational column */}
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-extrabold font-sans tracking-tight sm:text-5xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Get in Touch
          </h1>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
            Have questions about our pathology lab network, doctor panel, or medicine deliveries? Want to integrate your business? Send us a message and our support team will respond promptly.
          </p>
        </div>

        <div className="space-y-4 text-sm font-medium border-t pt-6">
          <div className="flex items-center gap-3 hover:text-primary transition-colors">
            <Mail className="h-5 w-5 text-primary shrink-0" />
            <a href="mailto:hello@healthsurya.com">hello@healthsurya.com</a>
          </div>
          <div className="flex items-center gap-3 hover:text-primary transition-colors">
            <Phone className="h-5 w-5 text-primary shrink-0" />
            <a href="tel:+910000000000">+91 00000 00000</a>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary shrink-0" />
            <span>Jaunpur, Uttar Pradesh, India</span>
          </div>
        </div>
      </div>

      {/* Form column */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card/40 glass p-6 shadow-xl">
        <h2 className="text-xl font-bold font-sans text-foreground">Send Message</h2>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-primary">Your Name</Label>
          <Input required maxLength={100} className="glass min-h-11" placeholder="e.g. Rajesh Kumar" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-primary">Email Address</Label>
          <Input required type="email" maxLength={255} className="glass min-h-11" placeholder="e.g. rajesh@gmail.com" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-primary">Your Message</Label>
          <Textarea required rows={4} maxLength={1000} className="glass" placeholder="Write your inquiry here..." />
        </div>
        <Button type="submit" disabled={loading} className="w-full min-h-11 font-semibold text-sm">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {loading ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </div>
  );
}
