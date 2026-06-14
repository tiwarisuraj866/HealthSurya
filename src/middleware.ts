import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { applySecurityHeaders } from "@/lib/security-headers";

// Match paths that require auth check
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/doctor-manage(.*)",
  "/doctor-setup(.*)",
  "/lab",
  "/lab/(.*)",
  "/lab-manage(.*)",
  "/lab-setup(.*)",
  "/pharmacy",
  "/pharmacy/(.*)",
  "/pharmacy-setup(.*)",
  "/franchise(.*)",
  "/admin(.*)",
  "/support(.*)",
  "/finance(.*)",
  "/marketing(.*)",
  "/operations(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  let response: NextResponse = NextResponse.next();

  const secret = process.env.INTERNAL_API_SECRET;
  // The tester bypass lets a request assume any role via cookies. It is a full
  // authentication bypass and MUST stay disabled in production. It only works
  // when ENABLE_TESTER_BYPASS is explicitly set to "true" (e.g. in staging).
  const testerModeEnabled = process.env.ENABLE_TESTER_BYPASS === "true";

  // Handle setting tester key cookie via query param
  const testerKeyQuery = req.nextUrl.searchParams.get("tester_key");
  if (testerModeEnabled && testerKeyQuery && secret && testerKeyQuery === secret) {
    const cleanUrl = new URL(req.nextUrl.pathname, req.url);
    req.nextUrl.searchParams.forEach((val, key) => {
      if (key !== "tester_key") {
        cleanUrl.searchParams.set(key, val);
      }
    });
    response = NextResponse.redirect(cleanUrl);
    response.cookies.set("tester_key", testerKeyQuery, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
      secure: true,
    });
    return response;
  }

  if (isProtectedRoute(req)) {
    let role = "patient";
    let verificationStatus = "approved";
    let isActive = true;
    let isAuthenticated = false;

    // Check if tester bypass is enabled
    const testerKeyCookie = req.cookies.get("tester_key")?.value;
    const isTesterBypassValid = !!(testerModeEnabled && secret && testerKeyCookie === secret);

    // Check Supabase Auth first (only allowed with valid tester key)
    const sbSessionCookie = isTesterBypassValid
      ? (req.cookies.get("sb_session")?.value || req.cookies.get("mock_role")?.value)
      : undefined;

    if (sbSessionCookie) {
      isAuthenticated = true;
      role = sbSessionCookie;
      
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const userId = role === "admin" ? "f1000001-0001-4000-8000-000000000001" :
                       role === "doctor" ? "c1000001-0001-4000-8000-000000000001" :
                       role === "lab" ? "d1000001-0001-4000-8000-000000000001" :
                       role === "pharmacy" ? "d1000002-0001-4000-8000-000000000002" :
                       "b1000001-0001-4000-8000-000000000001";
        
        const { data } = await supabaseAdmin
          .from("profiles" as any)
          .select("role, verification_status, is_active")
          .or(`id.eq.${userId},clerk_user_id.eq.${userId}`)
          .maybeSingle();

        const profile = data as any;
        if (profile) {
          role = profile.role;
          verificationStatus = profile.verification_status;
          isActive = profile.is_active;
        }
      } catch (err) {
        console.error("Middleware DB lookup error:", err);
      }
    }

    if (!isAuthenticated) {
      // Fallback to Clerk Auth
      const { userId, sessionClaims } = await auth();

      if (!userId) {
        const signInUrl = new URL("/login", req.url);
        signInUrl.searchParams.set("redirect", req.nextUrl.pathname);
        response = NextResponse.redirect(signInUrl);
        return applySecurityHeaders(response);
      }

      const metadata = (sessionClaims?.metadata || {}) as {
        role?: string;
        verification_status?: string;
        is_active?: boolean;
      };

      role = metadata.role || "patient";
      verificationStatus = metadata.verification_status || "approved";
      isActive = metadata.is_active ?? true;
    }

    // Override verificationStatus in middleware if mock cookie is present and Clerk mock is active or tester bypass is valid
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_Y2xlcmsubW9jay5kZXYk" || isTesterBypassValid) {
      const mockVerCookie = req.cookies.get("mock_verification_status")?.value;
      if (mockVerCookie) {
        verificationStatus = mockVerCookie;
      }
    }

    const path = req.nextUrl.pathname;

    // Reject suspended accounts
    if (!isActive) {
      response = NextResponse.redirect(new URL("/suspended", req.url));
      return applySecurityHeaders(response);
    }

    // Role verification logic
    if (path.startsWith("/admin") && !["admin", "super_admin"].includes(role)) {
      response = NextResponse.redirect(new URL("/unauthorized", req.url));
      return applySecurityHeaders(response);
    }

    // Redirect unapproved partners attempting to access any partner routes
    if (["doctor", "lab", "pharmacy", "franchise"].includes(role) && verificationStatus !== "approved") {
      const isPartnerRoute =
        path.startsWith("/doctor-manage") ||
        path.startsWith("/doctor-setup") ||
        path === "/lab" ||
        path.startsWith("/lab/") ||
        path.startsWith("/lab-manage") ||
        path.startsWith("/lab-setup") ||
        path === "/pharmacy" ||
        path.startsWith("/pharmacy/") ||
        path.startsWith("/pharmacy-setup") ||
        path.startsWith("/franchise");

      if (isPartnerRoute) {
        response = NextResponse.redirect(new URL("/verification-pending", req.url));
        return applySecurityHeaders(response);
      }
    }

    if (path.startsWith("/doctor-manage") || path.startsWith("/doctor-setup")) {
      if (role !== "doctor") {
        response = NextResponse.redirect(new URL("/unauthorized", req.url));
        return applySecurityHeaders(response);
      }
    }

    if (path === "/lab" || path.startsWith("/lab/") || path.startsWith("/lab-manage") || path.startsWith("/lab-setup")) {
      if (role !== "lab") {
        response = NextResponse.redirect(new URL("/unauthorized", req.url));
        return applySecurityHeaders(response);
      }
    }

    if (path === "/pharmacy" || path.startsWith("/pharmacy/") || path.startsWith("/pharmacy-setup")) {
      if (role !== "pharmacy") {
        response = NextResponse.redirect(new URL("/unauthorized", req.url));
        return applySecurityHeaders(response);
      }
    }

    if (path.startsWith("/franchise")) {
      if (role !== "franchise") {
        response = NextResponse.redirect(new URL("/unauthorized", req.url));
        return applySecurityHeaders(response);
      }
    }

    if (path.startsWith("/support") && !["support", "admin", "super_admin"].includes(role)) {
      response = NextResponse.redirect(new URL("/unauthorized", req.url));
      return applySecurityHeaders(response);
    }

    if (path.startsWith("/finance") && !["finance", "admin", "super_admin"].includes(role)) {
      response = NextResponse.redirect(new URL("/unauthorized", req.url));
      return applySecurityHeaders(response);
    }

    if (path.startsWith("/marketing") && !["marketing", "admin", "super_admin"].includes(role)) {
      response = NextResponse.redirect(new URL("/unauthorized", req.url));
      return applySecurityHeaders(response);
    }

    if (path.startsWith("/operations") && !["operations", "admin", "super_admin"].includes(role)) {
      response = NextResponse.redirect(new URL("/unauthorized", req.url));
      return applySecurityHeaders(response);
    }
  }

  return applySecurityHeaders(response);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Clerk proxy matcher path
    "/__clerk/:path*",
  ],
};
