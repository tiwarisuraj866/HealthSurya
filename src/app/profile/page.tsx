"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Eye,
  Settings,
  ArrowLeft,
  Loader2,
  Wallet,
} from "lucide-react";

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [partnerDetails, setPartnerDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    
    const fetchPartnerData = async () => {
      setLoadingDetails(true);
      try {
        if (user.role === "doctor") {
          const { data: doc } = await supabase
            .from("doctors" as any)
            .select("*")
            .eq("owner_id", user.id)
            .maybeSingle();
          setPartnerDetails(doc);
        } else if (user.role === "lab") {
          const { data: lab } = await supabase
            .from("labs" as any)
            .select("*")
            .eq("owner_id", user.id)
            .maybeSingle();
          setPartnerDetails(lab);
        } else if (user.role === "pharmacy") {
          const { data: pharm } = await supabase
            .from("pharmacies" as any)
            .select("*")
            .eq("owner_id", user.id)
            .maybeSingle();
          setPartnerDetails(pharm);
        }
      } catch (err) {
        console.error("Failed to load partner details", err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchPartnerData();
  }, [user]);

  if (authLoading || loadingDetails) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const kycStatus = user.verification_status || "pending";
  
  // Status Badge configs
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-semibold px-2.5 py-1">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Approved / Active
          </Badge>
        );
      case "pending":
      case "under_review":
      case "ai_in_progress":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none font-semibold px-2.5 py-1 animate-pulse">
            <Clock className="h-3.5 w-3.5 mr-1" /> Under Review
          </Badge>
        );
      case "rejected":
      case "suspended":
        return (
          <Badge className="bg-destructive/10 text-destructive border-none font-semibold px-2.5 py-1">
            <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Rejected / Suspended
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border-none font-semibold px-2.5 py-1">
            {status}
          </Badge>
        );
    }
  };

  // Modify Profile button route mapping
  const getModifyRoute = () => {
    if (user.role === "doctor") return "/doctor-setup";
    if (user.role === "lab") return "/lab-setup";
    if (user.role === "pharmacy") return "/pharmacy-setup";
    return "/verify"; // Generic KYC documents verification page
  };

  // Public View route mapping
  const getPublicRoute = () => {
    if (user.role === "doctor" && partnerDetails?.slug) {
      return `/doctors/${partnerDetails.slug}`;
    }
    if (user.role === "lab" && partnerDetails?.id) {
      return `/labs/${partnerDetails.id}`;
    }
    return null;
  };

  const modifyRoute = getModifyRoute();
  const publicRoute = getPublicRoute();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-2 mb-6">
        <Button asChild variant="ghost" size="icon" className="h-9 w-9">
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="text-sm font-medium text-muted-foreground">Back to Dashboard</span>
      </div>

      <div className="glass-card p-8 rounded-2xl shadow-lg border border-border bg-gradient-to-br from-card/80 to-card/40 space-y-6">
        {/* Profile header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border">
              {user.full_name?.charAt(0) || <User className="h-7 w-7" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-sans">{user.full_name || "User Profile"}</h1>
              <p className="text-xs text-muted-foreground capitalize mt-0.5 font-medium">
                Account Type: {user.role?.replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">KYC Status</span>
            {getStatusBadge(kycStatus)}
          </div>
        </div>

        {/* User profile fields */}
        <div className="grid gap-4 sm:grid-cols-2 py-2">
          <div className="flex items-center gap-3 rounded-xl border bg-card/20 p-4">
            <Mail className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email Address</p>
              <p className="text-sm font-semibold truncate text-foreground">{user.email || "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border bg-card/20 p-4">
            <Phone className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Mobile Number</p>
              <p className="text-sm font-semibold truncate text-foreground">{user.phone || "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border bg-card/20 p-4">
            <Wallet className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Wallet Balance</p>
              <p className="text-sm font-semibold text-foreground">₹{Number(user.wallet_balance || 0).toFixed(2)}</p>
            </div>
          </div>

          {partnerDetails?.clinic_name || partnerDetails?.name ? (
            <div className="flex items-center gap-3 rounded-xl border bg-card/20 p-4">
              <Settings className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Entity Name</p>
                <p className="text-sm font-semibold truncate text-foreground">
                  {partnerDetails.clinic_name || partnerDetails.name}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Informative text about KYC */}
        {kycStatus !== "approved" && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-xs text-warning leading-relaxed font-medium">
            Your profile details and credentials are under verification. Uploading clear documents speeds up the process. Once approved, you will get verified badge and list in patient search result pages.
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-border/40">
          <Button asChild size="sm" className="btn-gradient text-white flex-1 min-h-11 font-semibold">
            <Link href={modifyRoute}>
              <Settings className="mr-1.5 h-4 w-4" /> Modify Profile Details
            </Link>
          </Button>

          {publicRoute && (
            <Button asChild variant="outline" size="sm" className="glass flex-1 min-h-11 font-semibold">
              <a href={publicRoute} target="_blank" rel="noopener noreferrer">
                <Eye className="mr-1.5 h-4 w-4 text-primary" />
                {kycStatus === "approved" ? "View Public Profile" : "Preview Public Profile"}
              </a>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              signOut();
              router.push("/login");
            }}
            className="w-full text-xs text-muted-foreground font-semibold min-h-11"
          >
            Sign out of Account
          </Button>
        </div>
      </div>
    </div>
  );
}
