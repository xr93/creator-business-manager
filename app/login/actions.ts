"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { REMEMBER_COOKIE, REMEMBER_SECONDS } from "@/utils/supabase/session";

export async function signIn(formData: FormData): Promise<{ error: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";
  if (!email || !password) return { error: "Enter your email and password to continue." };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore, remember);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Unable to sign in. Check your email and password and make sure your email is confirmed." };

  cookieStore.set(REMEMBER_COOKIE, String(remember), {
    path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    ...(remember ? { maxAge: REMEMBER_SECONDS } : {}),
  });
  redirect("/");
}

export async function signOut() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw new Error("Unable to sign out. Please try again.");
  cookieStore.delete(REMEMBER_COOKIE);
  redirect("/login");
}
