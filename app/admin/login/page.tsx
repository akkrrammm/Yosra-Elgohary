import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthFrame, NotConnectedMessage } from "@/components/admin/AuthFrame";
import { LoginForm } from "@/components/admin/AuthForms";
import { getAdminContext } from "@/lib/cms/admin";

export const metadata: Metadata = { title: "Sign in" };

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const context = await getAdminContext();
  // The dashboard explains itself to an account that is signed in but not an administrator.
  if (context.status === "ok" || context.status === "forbidden") redirect("/admin");

  const { error } = await searchParams;

  return (
    <AuthFrame>
      {context.status === "not-configured" ? (
        <NotConnectedMessage />
      ) : (
        <>
          {error === "link" && (
            <p role="alert" className="mb-4 rounded-xl bg-pop/20 px-4 py-3 text-sm font-medium">
              That link has expired or was already used. Please request a new one.
            </p>
          )}
          <LoginForm />
        </>
      )}
    </AuthFrame>
  );
}
