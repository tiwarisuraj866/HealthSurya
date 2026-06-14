"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { getLatestVerification } from "@/app/actions";
import { useEffect, useState } from "react";
import {
  Clock,
  LogOut,
  ArrowLeft,
  ShieldAlert,
  FileWarning,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

export default function VerificationPendingPage() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState<any>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await getLatestVerification();
      setVerification(res?.verification ?? null);
    } catch (err) {
      console.error("Failed to load verification status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const kycStatus = user?.verification_status || "pending";

  // If in mock dev mode and verification is null, create a mock verification object based on the user profile status
  let displayVerification = verification;
  if (!displayVerification && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_Y2xlcmsubW9jay5kZXYk" && user) {
    if (user.verification_status !== "approved") {
      displayVerification = {
        status: user.verification_status,
        reviewer_remarks: user.verification_status === "rejected" 
          ? "Mock rejection: The uploaded license certificate is illegible. Please re-upload a clear image."
          : user.verification_status === "suspended"
          ? "Mock suspension: Medical registration credentials have been flagged by the administrative compliance desk due to non-compliance."
          : "",
      };
    }
  }

  const reviewerRemarks = displayVerification?.reviewer_remarks || "";

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-16">
      <div className="glass-card max-w-lg w-full p-8 text-center relative overflow-hidden bg-gradient-to-br from-card/90 to-card/50">
        
        {/* Not Started / KYC Required (verification is null or status is draft) */}
        {(!displayVerification || displayVerification.status === "draft") && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-6 animate-pulse">
              <FileWarning className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">KYC Verification Required</h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Hello {user?.full_name || "Partner"}, under the Pharmacy Council of India (PCI) rules, the National Medical Commission (NMC) regulations, and health compliance laws of the Indian Constitution, you must submit valid credentials to list public medical services or dispense prescriptions.
            </p>
            <div className="mt-5 text-left rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 text-xs text-amber-600/90 leading-relaxed">
              <strong>Mandatory documents for activation:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 font-medium">
                <li>Identity Proof (Aadhaar Card, PAN Card, or Passport)</li>
                <li>Professional eligibility license (Medical Registration Cert / Drug License)</li>
              </ul>
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <Button className="w-full btn-gradient min-h-11 font-semibold text-white" asChild>
                <Link href="/verify">Start KYC Onboarding →</Link>
              </Button>
            </div>
          </>
        )}

        {/* Pending Review / Under Review */}
        {displayVerification && (displayVerification.status === "pending" || displayVerification.status === "under_review" || displayVerification.status === "ai_in_progress") && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/10 text-warning mb-6">
              <Clock className="h-7 w-7 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">KYC Under Review</h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Hello {user?.full_name || "Partner"}, your professional profile is currently under review by our medical compliance officers as per Indian healthcare standards.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              This process typically takes 12 to 24 hours. Once verified, your clinic, lab, or pharmacy will become searchable for patients.
            </p>
            <div className="mt-6">
              <Button className="w-full btn-gradient min-h-11 font-semibold text-white" asChild>
                <Link href="/verify">View Verification Details</Link>
              </Button>
            </div>
          </>
        )}

        {/* Rejected Status */}
        {displayVerification && displayVerification.status === "rejected" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">KYC Verification Failed</h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Hello {user?.full_name || "Partner"}, we regret to inform you that your registration documents could not be verified by compliance team. 
            </p>
            {reviewerRemarks && (
              <div className="mt-4 text-left rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive">
                <strong className="block font-semibold mb-1">Reason for Rejection:</strong>
                {reviewerRemarks}
              </div>
            )}
            <div className="mt-8 flex flex-col gap-3">
              <Button className="w-full btn-gradient min-h-11 font-semibold text-white" asChild>
                <Link href="/verify">Re-upload Documents & Retry</Link>
              </Button>
            </div>
          </>
        )}

        {/* Suspended Status */}
        {displayVerification && displayVerification.status === "suspended" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Account Suspended</h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Hello {user?.full_name || "Partner"}, your provider account has been suspended by the administrator due to licensing or regulatory non-compliance.
            </p>
            {reviewerRemarks && (
              <div className="mt-4 text-left rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive">
                <strong className="block font-semibold mb-1">Remarks:</strong>
                {reviewerRemarks}
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Please contact our compliance support desk at <span className="font-semibold text-foreground">compliance@healthsurya.com</span> to resolve this issue.
            </p>
            <div className="mt-6">
              <Button className="w-full btn-gradient min-h-11 font-semibold text-white" asChild>
                <Link href="/verify">Update Verification Documents</Link>
              </Button>
            </div>
          </>
        )}

        {/* Approved Status */}
        {displayVerification && displayVerification.status === "approved" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-6">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">KYC Verification Complete</h1>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Hello {user?.full_name || "Partner"}, your partner credentials and licensing documents have been successfully verified!
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Button className="w-full btn-gradient min-h-11 font-semibold text-white" asChild>
                <Link href="/dashboard">Go to Partner Dashboard</Link>
              </Button>
            </div>
          </>
        )}

        <div className="mt-6 border-t pt-5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">Account: <span className="text-foreground capitalize">{user?.role?.replace(/_/g, " ")}</span></span>
          <span className="font-medium">Status: <span className="text-foreground capitalize font-bold">{kycStatus}</span></span>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button variant="outline" className="w-full min-h-10 text-xs text-muted-foreground" onClick={() => signOut()}>
            <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out of HealthSurya
          </Button>
          <Button variant="ghost" className="w-full text-xs text-muted-foreground" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
