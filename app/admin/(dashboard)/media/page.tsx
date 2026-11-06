import type { Metadata } from "next";
import { MediaLibrary } from "@/components/admin/media/MediaLibrary";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/cms/admin-data";

export const metadata: Metadata = { title: "Media library" };

export default async function MediaAdminPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="Media library" description="Every image and video on the website. A file in use cannot be deleted by accident, and replacing one updates it everywhere it appears." />
      <MediaLibrary />
    </>
  );
}
