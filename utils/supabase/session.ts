import type { CookieOptions } from "@supabase/ssr";

export const REMEMBER_COOKIE = "creator-remember-me";
export const REMEMBER_SECONDS = 60 * 60 * 24 * 30;

// Apply on sign-in AND refresh, otherwise refresh makes session cookies persistent.
export function sessionCookieOptions(options: CookieOptions, remember: boolean): CookieOptions {
  const result = { ...options, path: "/", sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" };
  if (options.maxAge === 0) return result;
  if (remember) return { ...result, maxAge: REMEMBER_SECONDS };
  delete result.maxAge;
  delete result.expires;
  return result;
}
