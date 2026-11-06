import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/cms/admin";
import { hasLocale } from "@/lib/i18n";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Lets a signed-in administrator see an unpublished project on the real page.
 * The admin session is the gate rather than a shared secret, and the page itself
 * reads with that session, so Row Level Security still decides what appears.
 */
export async function GET(request: Request) {
  const context = await getAdminContext();
  if (context.status !== "ok") redirect("/admin/login");

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? "";
  const lang = searchParams.get("lang") ?? "";
  if (!SLUG.test(slug) || !hasLocale(lang)) {
    return new Response("This project cannot be previewed.", { status: 400 });
  }

  (await draftMode()).enable();
  redirect(`/${lang}/work/${slug}`);
}
