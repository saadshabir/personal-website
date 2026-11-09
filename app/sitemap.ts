import type { MetadataRoute } from "next";
import { WRITING } from "@/lib/constants";
import { getCanonicalUrl, SEO_PAGES } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...Object.values(SEO_PAGES).map(({ path }) => ({ url: getCanonicalUrl(path) })),
    ...WRITING.map(({ url, updatedAt }) => ({
      url: getCanonicalUrl(url),
      lastModified: updatedAt,
    })),
  ];
}
