import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AuthFrame, NotConnectedMessage } from "@/components/admin/AuthFrame";
import { signOut } from "@/lib/cms/actions/auth";
import { getAdminContext } from "@/lib/cms/admin";

/**
 * The real gate for the dashboard. It asks Supabase who is signed in on every request.
 * Each page and action checks again, and Row Level Security has the final say.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const context = await getAdminContext();

  if (context.status === "anonymous") redirect("/admin/login");

  if (context.status === "not-configured") {
    return (
      <AuthFrame>
        <NotConnectedMessage />
      </AuthFrame>
    );
  }

  if (context.status === "forbidden") {
    return (
      <AuthFrame>
        <div className="flex flex-col gap-4">
          <h1 className="font-heading text-2xl font-bold tracking-tight">This account cannot use the dashboard</h1>
          <p className="text-sm leading-relaxed text-ink/75">
            You are signed in as <strong>{context.user.email}</strong>, which is not an administrator of this website.
          </p>
          <form action={signOut}>
            <button type="submit" className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">
              Sign out
            </button>
          </form>
        </div>
      </AuthFrame>
    );
  }

  return <AdminShell email={context.user.email ?? ""}>{children}</AdminShell>;
}
