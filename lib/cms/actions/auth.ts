"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = { error?: string; message?: string };

const MIN_PASSWORD_LENGTH = 10;

export async function signIn(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // An outage is not a wrong password, and telling them apart reveals nothing about any account.
    if (!error.status || error.status >= 500) {
      console.error("[cms] sign in:", error.message);
      return { error: "Sign-in is not available right now. Please try again in a moment." };
    }
    // The same message either way, so this form cannot reveal which emails have accounts.
    return { error: "That email and password do not match. Please try again." };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/** Always answers the same way, so this form cannot reveal which emails have accounts. */
export async function requestPasswordReset(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${protocol}://${host}/admin/auth/callback?next=/admin/reset-password`,
  });
  if (error) console.error("[cms] password reset:", error.message);

  return { message: "If that email has an account, a link to choose a new password is on its way." };
}

export async function updatePassword(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) return { error: `Use at least ${MIN_PASSWORD_LENGTH} characters.` };
  if (password !== confirm) return { error: "The two passwords do not match." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "This link has expired. Please request a new one." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[cms] update password:", error.message);
    return { error: error.code === "same_password" ? "Choose a password different from your current one." : "Could not change the password. Please try again." };
  }

  return { message: "Your password has been changed." };
}
