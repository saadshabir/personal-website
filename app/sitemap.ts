import type { MetadataRoute } from "next";
import { SITE_CONFIG, WRITING } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/work", "/projects", "/writing"];

  return [
    ...staticRoutes,
    ...WRITING.map((entry) => entry.url),
  ].map((path) => ({
    url: new URL(path, SITE_CONFIG.url).toString(),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));
}
