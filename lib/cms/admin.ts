import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { revalidatePath, updateTag } from "next/cache";
import { cache } from "react";
import type { AdminRole, Database } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { CMS_CACHE_TAG } from "./constants";

export type AdminClient = SupabaseClient<Database>;

export type AdminContext =
  | { status: "not-configured" }
  | { status: "anonymous" }
  | { status: "forbidden"; user: User }
  | { status: "ok"; user: User; role: AdminRole; displayName: string | null; supabase: AdminClient };

/**
 * Who is making this request. Looks the user up with Supabase on every request rather
 * than trusting anything in the cookie. Row Level Security still has the final say.
 */
export const getAdminContext = cache(async (): Promise<AdminContext> => {
  if (!isSupabaseConfigured()) return { status: "not-configured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anonymous" };

  const { data: admin, error } = await supabase.from("admin_users").select("role, display_name").eq("user_id", user.id).maybeSingle();
  // The tables are not there yet, so nobody can be an administrator.
  if (error?.code === "PGRST205" || error?.code === "42P01") return { status: "not-configured" };
  if (!admin) return { status: "forbidden", user };

  return { status: "ok", user, role: admin.role, displayName: admin.display_name, supabase };
});

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const success = (): ActionResult => ({ ok: true, data: undefined });
export const successWith = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const failure = (error: string, fieldErrors?: Record<string, string>) =>
  ({ ok: false, error, fieldErrors }) as const;

/** An update that matches no row reports no error, so it is checked rather than shown as saved. */
export const GONE = failure("This item no longer exists. Please refresh the page.");

const NOT_ALLOWED = failure("You need to be signed in as an administrator to do this. Please sign in again.");

/** Runs an action only for an administrator, and turns surprises into a readable message. */
export async function asAdmin<T>(work: (supabase: AdminClient, user: User) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  const context = await getAdminContext();
  if (context.status !== "ok") return NOT_ALLOWED;

  try {
    return await work(context.supabase, context.user);
  } catch (error) {
    console.error("[cms]", error);
    return failure("Something went wrong and nothing was saved. Please try again.");
  }
}

type DatabaseError = { code?: string; message?: string; details?: string };

/** Database errors, in words an editor can act on. */
export function explainError(error: DatabaseError, context: { unique?: string; inUse?: string } = {}) {
  console.error("[cms]", error.code, error.message);
  switch (error.code) {
    case "23505":
      return failure(context.unique ?? "That value is already being used. Please choose a different one.");
    // A blocked delete. Which code it has depends on the Postgres version.
    case "23503":
    case "23001":
      return failure(context.inUse ?? "This is still being used somewhere else on the website, so it cannot be removed yet.");
    case "23514":
      if (error.message?.includes("projects_published_needs_cover")) {
        return failure("Add a cover image before publishing this project.");
      }
      return failure("One of the values is not valid. Please check the form and try again.");
    case "42501":
    case "PGRST301":
      return NOT_ALLOWED;
    case "P0002":
      return failure("This item no longer exists. Please refresh the page.");
    default:
      return failure("Could not save. Please check your connection and try again.");
  }
}

/** Makes saved changes visible on the public website immediately, without a new deployment. */
export function publishChanges() {
  updateTag(CMS_CACHE_TAG);
  revalidatePath("/en", "layout");
  revalidatePath("/ar", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
}
