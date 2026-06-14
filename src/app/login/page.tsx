"use client";

import { useSignIn } from "@clerk/nextjs";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { RolePicker } from "@/components/auth/RolePicker";
import { LoginCaptcha, validateLoginCaptcha } from "@/components/auth/LoginCaptcha";
import { FieldError } from "@/components/auth/FieldError";
import { getAuthRole, parseAuthRole, type AuthRoleId } from "@/lib/auth-roles";
import { validateEmail, validatePhone, validateIdentifier } from "@/lib/user-validation";
import { toE164India } from "@/lib/otp";
import { LogIn, Mail, Phone, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

type LoginTab = "password" | "email-otp";

function LoginPageContent() {
  const signInHook = useSignIn() as any;
  console.log(" LoginPageContent executed, hook keys =", Object.keys(signInHook || {}), "isLoaded =", signInHook?.isLoaded);
  const { isLoaded, signIn, setActive } = signInHook || {};
  const { loading: isAuthLoading, user: dbProfile, signOut } = useAuth();
  const isAuthLoaded = !isAuthLoading;
  const router = useRouter();

  if (typeof window !== "undefined") {
    (window as any).__signInLoaded = isLoaded;
  }
  const searchParams = useSearchParams();

  // True only after a sign-in attempt made on THIS page — role enforcement
  // applies to fresh logins, not to already-signed-in users visiting /login.
  const attemptedLogin = useRef(false);
  const roleRejected = useRef(false);

  const redirectParam = searchParams.get("redirect") || "/";
  const roleParam = searchParams.get("role") || "patient";

  const [intentRole, setIntentRole] = useState<AuthRoleId>(() => parseAuthRole(roleParam));
  const roleConfig = getAuthRole(intentRole);

  const [tab, setTab] = useState<LoginTab>("email-otp");
  const [loading, setLoading] = useState(false);

  // Password Login state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [identifierError, setIdentifierError] = useState<string | null>(null);

  // Email OTP Login state
  const [otpEmail, setOtpEmail] = useState("");
  const [otpEmailError, setOtpEmailError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // Captcha state
  const [captchaInput, setCaptchaInput] = useState("");
  const captchaExpected = useRef("");

  // Terms agreement state
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Clear fields and reset state on component mount / revisit
  useEffect(() => {
    setIdentifier("");
    setPassword("");
    setOtpEmail("");
    setVerificationCode("");
    setCaptchaInput("");
    setOtpSent(false);
    setAgreeTerms(false);
  }, []);

  // ── Role-based login enforcement ──
  // If the signed-in account's registered role doesn't match the role the
  // user selected (e.g. picked "Doctor" but used a Lab account), block the
  // session instead of silently logging them into the wrong portal.
  const ADMIN_ROLES = ["admin", "super_admin", "support", "finance", "marketing", "operations"];
  const roleMatches = (actual: string, intent: AuthRoleId) => {
    if (ADMIN_ROLES.includes(actual)) return true; // staff/admin may enter via any door
    if (actual === intent) return true;
    if (actual === "lab_staff" && intent === "lab") return true;
    if (actual === "pharmacy_staff" && intent === "pharmacy") return true;
    return false;
  };

  // Handle redirect after successful authentication
  useEffect(() => {
    if (!isAuthLoaded || !dbProfile || roleRejected.current) return;

    if (attemptedLogin.current && !roleMatches(dbProfile.role, intentRole)) {
      roleRejected.current = true;
      const actualLabel = getAuthRole(parseAuthRole(dbProfile.role)).label;
      toast.error(
        `Role mismatch: this account is registered as "${dbProfile.role}". ` +
        `Please select "${actualLabel}" on the login screen and sign in again.`,
        { duration: 6000 }
      );
      (async () => {
        await signOut();
        attemptedLogin.current = false;
        roleRejected.current = false;
      })();
      return;
    }

    // Direct user to correct page upon successful login
    toast.success("Welcome back!");
    router.push(redirectParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoaded, dbProfile, router, intentRole, redirectParam, signOut]);

  // ── Password Sign In (Clerk) ──
  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      toast.error("Please check the 'I agree to the Terms & Conditions' checkbox to proceed.");
      return;
    }
    const err = validateIdentifier(identifier);
    if (err) {
      setIdentifierError(err);
      return;
    }
    if (!validateLoginCaptcha(captchaInput, captchaExpected.current)) {
      toast.error("Incorrect security code. Refresh the code and try again.");
      return;
    }

    if (!signIn) {
      toast.error("Password sign-in is currently unavailable because the authentication service failed to load. Please use Email OTP.");
      return;
    }

    setLoading(true);
    try {
      // Set mock session cookies for local dev compatibility
      if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_Y2xlcmsubW9jay5kZXYk") {
        let derivedRole = "patient";
        const idLower = identifier.toLowerCase();
        if (idLower.includes("doctor") || idLower.includes("dr.") || idLower.includes("dr_") || idLower.startsWith("dr@")) derivedRole = "doctor";
        else if (idLower.includes("lab")) derivedRole = "lab";
        else if (idLower.includes("pharmacy")) derivedRole = "pharmacy";
        else if (idLower.includes("admin")) derivedRole = "admin";
        else derivedRole = intentRole;

        document.cookie = `sb_session=${derivedRole}; path=/`;
        document.cookie = `mock_role=${derivedRole}; path=/`;
      }

      const result = await signIn.create({
        identifier: identifier,
        password,
      });

      if (result.status === "complete") {
        attemptedLogin.current = true;
        await setActive({ session: result.createdSessionId });
        toast.success("Welcome back!");
      } else {
        console.warn("Clerk sign-in status incomplete:", result.status);
        toast.error("Sign-in incomplete. Please contact support.");
      }
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // ── Send Email OTP / Magic Link (Clerk) ──
  const onSendEmailOtp = async (e: React.FormEvent, isMagicLink = false) => {
    if (e) e.preventDefault();
    if (!agreeTerms) {
      toast.error("Please check the 'I agree to the Terms & Conditions' checkbox to proceed.");
      return;
    }
    const err = validateEmail(otpEmail);
    if (err) {
      setOtpEmailError(err);
      return;
    }
    if (!validateLoginCaptcha(captchaInput, captchaExpected.current)) {
      toast.error("Incorrect security code. Refresh the code and try again.");
      return;
    }

    if (!signIn) {
      toast.error("Email OTP sign-in is currently unavailable because the authentication service failed to load. If you are a tester, please use the Tester Panel.");
      return;
    }

    setLoading(true);
    try {
      // Start the Clerk sign-in process
      const signInAttempt = await signIn.create({
        identifier: otpEmail,
      });

      // Find the email code factor
      const emailCodeFactor = signInAttempt.supportedFirstFactors?.find(
        (factor: any) => factor.strategy === "email_code"
      );

      if (!emailCodeFactor) {
        throw new Error("Email OTP sign-in is not available. Make sure email verification is enabled in Clerk.");
      }

      // Prepare the email code factor
      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: emailCodeFactor.emailAddressId,
      });

      setOtpSent(true);
      toast.success(`OTP sent to ${otpEmail}! (Please check your Spam/Junk folder if it does not arrive in 1-2 minutes.)`, { duration: 10000 });
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || err.message || "Failed to send OTP code.");
    } finally {
      setLoading(false);
    }
  };

  // ── Verify Email OTP (Clerk) ──
  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    if (!signIn) {
      toast.error("Authentication service failed to load.");
      return;
    }

    setLoading(true);
    try {
      // Verify OTP via Clerk
      const completeSignIn = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code: verificationCode,
      });

      if (completeSignIn.status === "complete") {
        attemptedLogin.current = true;
        await setActive({ session: completeSignIn.createdSessionId });
        toast.success("Signed in successfully!");
        
        // Set mock session cookies for local dev compatibility
        if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_Y2xlcmsubW9jay5kZXYk") {
          let derivedRole = "patient";
          const emailLower = otpEmail.toLowerCase();
          if (emailLower.includes("doctor") || emailLower.includes("dr.") || emailLower.includes("dr_") || emailLower.startsWith("dr@")) derivedRole = "doctor";
          else if (emailLower.includes("lab")) derivedRole = "lab";
          else if (emailLower.includes("pharmacy")) derivedRole = "pharmacy";
          else if (emailLower.includes("admin")) derivedRole = "admin";
          else derivedRole = intentRole;

          document.cookie = `sb_session=${derivedRole}; path=/`;
          document.cookie = `mock_role=${derivedRole}; path=/`;
        }
        
        router.push(redirectParam);
        router.refresh();
      } else {
        console.warn("Clerk sign-in status incomplete:", completeSignIn.status);
        toast.error("Sign-in incomplete. Please contact support.");
      }
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || err.message || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  function TabBtn({ id, icon: Icon, label }: { id: LoginTab; icon: any; label: string }) {
    const active = tab === id;
    return (
      <button
        type="button"
        onClick={() => {
          setTab(id);
          setOtpSent(false);
        }}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
      </button>
    );
  }

  return (
    <AuthPageShell
      title="Sign in"
      subtitle={`Access your ${roleConfig.label.toLowerCase()} account`}
      role={roleConfig}
      footer={
        <>
          New here?{" "}
          <a
            href={`/register?redirect=${encodeURIComponent(redirectParam)}&role=${intentRole}`}
            className="font-medium text-primary hover:underline"
          >
            {roleConfig.registerCta}
          </a>
        </>
      }
    >
      <div className="mb-4">
        <Label className="text-xs text-muted-foreground">I am signing in as</Label>
        <div className="mt-2">
          <RolePicker value={intentRole} onChange={setIntentRole} compact />
        </div>
      </div>

      <GoogleSignInButton redirectPath={redirectParam} role={intentRole} />

      <div className="my-4 flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or sign in with
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Tab switcher */}
      <div className="mb-4 flex gap-1 rounded-xl bg-muted p-1">
        <TabBtn id="email-otp" icon={Mail} label="Email OTP" />
        <TabBtn id="password" icon={KeyRound} label="Password" />
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Mobile OTP Login - Coming Soon"
          className="relative flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-muted-foreground/60"
        >
          <Phone className="h-3.5 w-3.5" />
          Mobile OTP
          <span className="absolute -top-2 right-1 rounded-full bg-amber-500/15 px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-amber-600">
            Soon
          </span>
        </button>
      </div>
      <p className="-mt-2 mb-4 text-center text-[10px] text-muted-foreground">
        Mobile OTP Login - Coming Soon · WhatsApp OTP - Coming Soon
      </p>

      {/* ── Email OTP Tab ── */}
      {tab === "email-otp" && !otpSent && (
        <form onSubmit={onSendEmailOtp} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="otp-email">Email Address</Label>
            <Input
              id="otp-email"
              className="min-h-10"
              type="email"
              required
              placeholder="name@example.com"
              value={otpEmail}
              onChange={(e) => {
                setOtpEmail(e.target.value);
                setOtpEmailError(null);
              }}
              onBlur={() => setOtpEmailError(validateEmail(otpEmail))}
            />
            <FieldError error={otpEmailError} />
          </div>

          <LoginCaptcha
            value={captchaInput}
            onChange={setCaptchaInput}
            onChallengeChange={(code) => {
              captchaExpected.current = code;
            }}
          />

                  {/* Terms checkbox */}
          <div className="flex items-center space-x-2 my-2 py-1">
            <Checkbox
              id="agree-terms-otp"
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(!!checked)}
            />
            <Label
              htmlFor="agree-terms-otp"
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              I agree to the <Link href="/legal/terms" className="text-primary hover:underline font-medium">Terms & Conditions</Link>
            </Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="btn-gradient flex-1 min-h-10 font-semibold text-xs" disabled={loading || !agreeTerms}>
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Mail className="h-3.5 w-3.5 mr-1.5" />
              )}
              Send OTP
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 min-h-10 border-primary text-primary hover:bg-primary/5 font-semibold text-xs rounded-xl"
              disabled={loading || !agreeTerms}
              onClick={(e) => onSendEmailOtp(e, true)}
            >
              Send Magic Link
            </Button>
          </div>
        </form>
      )}

      {/* OTP Verification form */}
      {tab === "email-otp" && otpSent && (
        <form onSubmit={onVerifyOtp} className="space-y-4">
          <div className="space-y-1.5 text-center">
            <Label htmlFor="otp-code">Enter 6-digit Verification Code sent to {otpEmail}</Label>
            <Input
              id="otp-code"
              className="text-center font-mono tracking-widest text-lg min-h-10"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <Button type="submit" className="btn-gradient w-full min-h-10" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Verifying…
              </>
            ) : (
              "Verify Code & Sign In"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs text-muted-foreground"
            onClick={() => setOtpSent(false)}
          >
            Change email address
          </Button>
        </form>
      )}

      {/* ── Password Tab ── */}
      {tab === "password" && (
        <form onSubmit={onPasswordSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="login-identifier">Email or User ID</Label>
            <Input
              id="login-identifier"
              className="min-h-10"
              type="text"
              required
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setIdentifierError(null);
              }}
              onBlur={() => setIdentifierError(validateIdentifier(identifier))}
            />
            <FieldError error={identifierError} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              className="min-h-10"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <LoginCaptcha
            value={captchaInput}
            onChange={setCaptchaInput}
            onChallengeChange={(code) => {
              captchaExpected.current = code;
            }}
          />

          {/* Terms checkbox */}
          <div className="flex items-center space-x-2 my-2 py-1">
            <Checkbox
              id="agree-terms-password"
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(!!checked)}
            />
            <Label
              htmlFor="agree-terms-password"
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              I agree to the <Link href="/legal/terms" className="text-primary hover:underline font-medium">Terms & Conditions</Link>
            </Label>
          </div>

          <Button type="submit" className="btn-gradient w-full min-h-10" disabled={loading || !agreeTerms}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Signing in…
              </>
            ) : (
              `Sign in as ${roleConfig.label}`
            )}
          </Button>
        </form>
      )}
      {/* Future Ready OTP Options */}
      <div className="mt-6 space-y-2 border-t pt-4 border-border/30">
        <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground opacity-60">
          <span className="flex items-center gap-2 font-medium">
            <Phone className="h-3.5 w-3.5 text-primary/70" />
            Mobile OTP Login
          </span>
          <span className="text-[10px] font-semibold bg-background/50 border border-muted-foreground/30 px-1.5 py-0.5 rounded text-muted-foreground">
            Coming Soon
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground opacity-60">
          <span className="flex items-center gap-2 font-medium">
            <svg className="h-3.5 w-3.5 text-primary/70 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.022-.014-.507-.25-1.156-.474-.15-.05-.282-.07-.383-.07-.23 0-.422.094-.652.338-.28.3-.578.67-.843.956-.232.25-.463.28-.77.12-.315-.157-1.332-.49-2.54-1.57-1.22-1.08-1.74-2.18-2.025-2.67-.282-.49-.03-.755.215-1.025.22-.24.463-.52.693-.78.232-.26.31-.443.463-.74.152-.3.076-.563-.038-.8-.113-.232-.843-2.03-1.156-2.784-.306-.737-.613-.637-.843-.647-.222-.01-.476-.012-.73-.012a1.39 1.39 0 00-.997.464c-.347.38-1.328 1.3-1.328 3.166 0 1.867 1.358 3.67 1.547 3.927.19.255 2.67 4.08 6.477 5.723 1.9.82 2.658.91 3.59.8a3.15 3.15 0 002.097-1.478c.636-1.282.636-2.38.607-2.613-.028-.23-.198-.36-.47-.5zM12 2C6.478 2 2 6.478 2 12c0 2.202.634 4.25 1.728 5.975L2 22l4.135-1.636C7.796 21.413 9.814 22 12 22c5.522 0 10-4.478 10-10S17.522 2 12 2zm0 18c-1.875 0-3.61-.532-5.08-1.462l-.364-.23-2.433.962.977-2.39-.255-.38C3.882 15.115 3.333 13.618 3.333 12c0-4.78 3.887-8.667 8.667-8.667 4.78 0 8.667 3.887 8.667 8.667S16.78 20 12 20z" />
            </svg>
            WhatsApp OTP Login
          </span>
          <span className="text-[10px] font-semibold bg-background/50 border border-muted-foreground/30 px-1.5 py-0.5 rounded text-muted-foreground">
            Coming Soon
          </span>
        </div>
      </div>
    </AuthPageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
