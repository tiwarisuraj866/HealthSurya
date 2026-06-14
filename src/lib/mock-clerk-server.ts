import { NextResponse } from "next/server";

function getUserIdForRole(role: string | undefined): string | null {
  if (!role) return null;
  if (role === "doctor") return "c1000001-0001-4000-8000-000000000001";
  if (role === "lab") return "d1000001-0001-4000-8000-000000000001";
  if (role === "pharmacy") return "d1000002-0001-4000-8000-000000000002";
  if (role === "patient") return "b1000001-0001-4000-8000-000000000001";
  if (role === "admin") return "f1000001-0001-4000-8000-000000000001";
  return null;
}

export function clerkMiddleware(callback: any) {
  return async (req: any, event: any) => {
    const mockAuth = async () => {
      const mockRole = req.cookies.get("mock_role")?.value;
      const userId = getUserIdForRole(mockRole);
      return {
        userId,
        sessionClaims: userId ? {
          metadata: {
            role: mockRole,
            verification_status: "approved",
            is_active: true,
          },
        } : null,
      };
    };
    return callback(mockAuth, req, event);
  };
}

export function createRouteMatcher(routes: string[]) {
  return (req: any) => {
    const pathname = req.nextUrl.pathname;
    return routes.some((route) => {
      const regexStr = route.replace(/\(\.\*\)/g, ".*");
      return new RegExp(`^${regexStr}`).test(pathname);
    });
  };
}

export async function auth() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const mockRole = cookieStore.get("mock_role")?.value;
  const userId = getUserIdForRole(mockRole);

  return {
    userId,
    sessionClaims: userId ? {
      metadata: {
        role: mockRole,
        verification_status: "approved",
        is_active: true,
      },
    } : null,
  };
}

export const clerkClient = {
  users: {
    getUser: async () => ({
      id: "f1000001-0001-4000-8000-000000000001",
      emailAddresses: [{ emailAddress: "admin@healthsurya.com" }],
      firstName: "Suraj",
      lastName: "Tiwari",
    }),
    updateUserMetadata: async () => ({}),
  },
};

export type WebhookEvent = any;
