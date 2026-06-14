"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWalletData } from "@/app/actions";
import { useAuth } from "@/lib/auth";
import { RequireAuthGate } from "@/components/auth/RequireAuthGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, Gift, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Tx = {
  id: string;
  amount: number;
  type: "topup" | "debit" | "refund" | "bonus";
  description: string | null;
  created_at: string;
};

const PRESETS = [100, 500, 1000, 2000];

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [amount, setAmount] = useState<string>("500");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const load = async () => {
    try {
      const data = await getWalletData();
      setBalance(data.balance);
      setTxs(data.transactions as Tx[]);
    } catch (err: any) {
      toast.error(err.message || "Failed to load wallet data");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  // Wallet top-up now opens Razorpay checkout instead of free credits
  const topup = async (val: number) => {
    if (!val || val <= 0) return toast.error("Enter a valid amount");
    if (val > 50000) return toast.error("Maximum deposit limit is ₹50,000");
    setLoading(true);
    try {
      // Step 1: Create Razorpay order
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: val * 100, // in paise
          receipt: `wallet-${Date.now()}`,
          notes: { type: "wallet_topup" },
        }),
      });

      if (!orderRes.ok) throw new Error("Could not initiate payment");
      const order = await orderRes.json();

      // Step 2: Open Razorpay checkout
      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) {
        toast.error("Payment gateway not loaded. Please refresh and try again.");
        return;
      }

      const rzp = new Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "HealthSurya",
        description: "Wallet Top-up",
        handler: async (response: any) => {
          // Step 3: Verify and credit wallet
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              entity_type: "wallet_topup",
            }),
          });

          if (verifyRes.ok) {
            toast.success(`₹${val} added to your HealthSurya wallet!`);
            load();
          } else {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        prefill: {
          name: user?.full_name || "",
          email: user?.email || "",
        },
        theme: { color: "#7c3aed" },
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  // FIX: auth guard — redirect to login if not signed in
  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <RequireAuthGate redirectTo="/wallet" actionLabel="access your wallet" />
      </div>
    );
  }

  if (authLoading || pageLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Load Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Wallet Balance Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-card/80 to-card/30 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex flex-wrap items-start justify-between gap-4 relative z-10">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-primary uppercase tracking-wider">
                <Wallet className="h-4 w-4" /> HealthSurya Wallet
              </div>
              <div className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                ₹{balance.toFixed(2)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                Digital health credits · use at checkout for instant bookings & medicines
              </p>
            </div>
            <div className="hidden h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground sm:flex shadow-lg shadow-primary/25">
              <Wallet className="h-9 w-9" />
            </div>
          </div>
        </div>

        {/* Top Up Panel */}
        <div className="mt-8 rounded-2xl border bg-card/50 glass p-6 shadow-sm">
          <h2 className="text-xl font-bold font-sans tracking-tight">Add Credits</h2>
          <p className="text-sm text-muted-foreground mt-1">Secure payment via Razorpay · UPI / Card / Net Banking accepted</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p}
                variant="outline"
                onClick={() => topup(p)}
                disabled={loading}
                className="glass border-primary/20 hover:border-primary/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="mr-1 h-4 w-4 text-primary" /> ₹{p}
              </Button>
            ))}
          </div>

          <div className="mt-5 flex gap-3 max-w-md">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₹</span>
              <Input
                type="number"
                min={1}
                max={50000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Custom amount"
                className="pl-7 glass bg-card/20 min-h-11"
              />
            </div>
            <Button
              onClick={() => topup(Number(amount))}
              disabled={loading}
              className="min-h-11 px-6 font-semibold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Pay & Add
            </Button>
          </div>
        </div>

        {/* Transactions History */}
        <div className="mt-8 rounded-2xl border bg-card/50 glass p-6 shadow-sm">
          <h2 className="text-xl font-bold font-sans tracking-tight mb-4">Transaction History</h2>
          {txs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No transactions yet. Your deposits and refunds will appear here.
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {txs.map((tx) => {
                const Icon =
                  tx.type === "topup" ? ArrowDownLeft
                  : tx.type === "debit" ? ArrowUpRight
                  : tx.type === "bonus" ? Gift
                  : RotateCcw;
                const positive = tx.type !== "debit";
                return (
                  <li key={tx.id} className="flex items-center justify-between py-4 hover:bg-card/10 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full shadow-sm ${positive ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold capitalize text-foreground">
                          {tx.description ?? tx.type.replace(/_/g, " ")}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {new Date(tx.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className={`font-bold text-base ${positive ? "text-green-500" : "text-red-500"}`}>
                      {positive ? "+" : "−"}₹{Number(tx.amount).toFixed(2)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
