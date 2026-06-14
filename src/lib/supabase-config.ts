export type SupabaseConfigStatus = {
  configured: boolean;
  reason?: string;
  urlHost?: string;
  keyLooksPlaceholder?: boolean;
};

export function getSupabasePublicEnv() {
  const isBrowser = typeof window !== "undefined";
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    (!isBrowser ? process.env.SUPABASE_URL : undefined);
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (!isBrowser ? process.env.SUPABASE_PUBLISHABLE_KEY : undefined);
  return { url: url?.trim(), key: key?.trim(), isBrowser };
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const { url, key } = getSupabasePublicEnv();

  if (!url || !key) {
    return {
      configured: false,
      reason:
        "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in Healthsurya/.env — restart dev server after saving.",
    };
  }

  let urlHost = "";
  try {
    urlHost = new URL(url).hostname;
  } catch {
    return {
      configured: false,
      reason: "VITE_SUPABASE_URL is not a valid URL.",
      urlHost: url.slice(0, 40),
    };
  }

  const keyLooksPlaceholder =
    key === "your_supabase_anon_key" || key.startsWith("your_") || key.length < 40;

  if (!urlHost.endsWith(".supabase.co")) {
    return {
      configured: false,
      reason: `VITE_SUPABASE_URL must be a *.supabase.co URL (got host: ${urlHost}).`,
      urlHost,
      keyLooksPlaceholder,
    };
  }

  return {
    configured: true,
    urlHost,
    keyLooksPlaceholder,
  };
}

/** True when URL + key are present (allows client init; auth may still fail if key is invalid). */
export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus().configured;
}

export function getSupabaseAuthHint(): string | null {
  const status = getSupabaseConfigStatus();
  if (!status.configured) return status.reason ?? "Supabase is not configured.";
  if (status.keyLooksPlaceholder) {
    return "Supabase anon key missing. Run npm run env:configure (paste key from Dashboard → API), then restart npm run dev.";
  }
  return null;
}
