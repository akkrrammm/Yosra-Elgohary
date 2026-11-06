import type { Metadata } from "next";
import Link from "next/link";
import { AuthFrame, NotConnectedMessage } from "@/components/admin/AuthFrame";
import { NewPasswordForm } from "@/components/admin/AuthForms";
import { getAdminContext } from "@/lib/cms/admin";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  const context = await getAdminContext();

  return (
    <AuthFrame>
      {context.status === "not-configured" ? (
        <NotConnectedMessage />
      ) : context.status === "anonymous" ? (
        <div className="flex flex-col gap-4">
          <h1 className="font-heading text-2xl font-bold tracking-tight">This link has expired</h1>
          <p className="text-sm leading-relaxed text-ink/75">Password links only work once and for a limited time. Please request a new one.</p>
          <Link href="/admin/login" className="text-sm font-semibold text-brand underline underline-offset-2">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="mb-4 font-heading text-2xl font-bold tracking-tight">Choose a new password</h1>
          <NewPasswordForm doneHref="/admin" doneLabel="Go to the dashboard" />
        </>
      )}
    </AuthFrame>
  );
}
