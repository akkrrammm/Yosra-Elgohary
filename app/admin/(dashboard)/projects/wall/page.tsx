import type { Metadata } from "next";
import { WallManager } from "@/components/admin/projects/WallManager";
import { PageHeader } from "@/components/admin/ui";
import { loadWall, requireAdmin } from "@/lib/cms/admin-data";

export const metadata: Metadata = { title: "Wall of pages" };

export default async function WallAdminPage() {
  const { supabase } = await requireAdmin();
  const { candidates, entries } = await loadWall(supabase);

  return (
    <>
      <PageHeader title="Wall of pages" description="The two moving rows of pages under the projects on the homepage. Each page links to its project. Pages from draft projects stay hidden." />
      <WallManager candidates={candidates} initial={entries} />
    </>
  );
}
