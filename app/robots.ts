import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/cms/metadata";
import { getPublishedSnapshot } from "@/lib/cms/snapshot";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { settings } = await getPublishedSnapshot();

  return {
    rules:
      settings && !settings.allow_indexing
        ? { userAgent: "*", disallow: "/" }
        : { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
