import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/admin/AuthForms";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/cms/admin-data";

export const metadata: Metadata = { title: "Password" };

export default async function AccountPage() {
  const { user } = await requireAdmin();

  return (
    <>
      <PageHeader title="Password" description={`Signed in as ${user.email ?? "administrator"}.`} />
      <Card title="Change your password">
        <NewPasswordForm doneHref="/admin" doneLabel="Back to the overview" />
      </Card>
    </>
  );
}
