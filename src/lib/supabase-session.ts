// HealthSurya V2 — Supabase auth session cookie helpers.
// Edge-compatible (Web Crypto only) so middleware can verify the cookie.
// The cookie payload is created ONLY after the Supabase access token has been
// verified server-side in /api/auth/supabase-session (service role).

export const SB_SESSION_COOKIE = "hs_sbs";
export const SB_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SbSessionPayload {
  /** profiles.id (uuid) */
  pid: string;
  /** supabase auth user id (uuid) */
  sid: string;
  role: string;
  /** verification_status */
  vs: string;
  /** is_active */
  act: boolean;
  /** unix seconds expiry */
  exp: number;
}

function secret(): string {
  return (
    process.env.AUTH_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    "healthsurya-dev-secret"
  );
}

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
}

async function hmac(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(sig);
}

/** Create a signed cookie value: base64url(json).signature */
export async function signSbSession(payload: SbSessionPayload): Promise<string> {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmac(body);
  return `${body}.${sig}`;
}

/** Verify and decode the cookie value. Returns null if invalid/expired. */
export async function verifySbSession(value: string | undefined | null): Promise<SbSessionPayload | null> {
  try {
    if (!value) return null;
    const [body, sig] = value.split(".");
    if (!body || !sig) return null;
    const expected = await hmac(body);
    if (sig !== expected) return null;
    const payload = JSON.parse(b64urlDecode(body)) as SbSessionPayload;
    if (!payload?.pid || !payload?.sid) return null;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
