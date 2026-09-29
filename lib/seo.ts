import type { Metadata } from "next";
import { SITE_CONFIG, WRITING } from "@/lib/constants";

type SeoPage = {
  path: string;
  title: string;
  description: string;
  label: string;
};

export const SEO_PAGES = {
  home: {
    path: "/",
    title: "Networks & Systems",
    description:
      "Network Technology student at Carleton University in Ottawa, building tools for network security, eBPF, packet analysis, and systems programming.",
    label: "NETWORKS & SYSTEMS",
  },
  work: {
    path: "/work",
    title: "Work Experience",
    description:
      "Muhammad Saad Shabir's network technician experience at AriesTECH, supporting Cisco infrastructure and automating network configuration with Python.",
    label: "WORK EXPERIENCE",
  },
  projects: {
    path: "/projects",
    title: "Network & Systems Projects",
    description:
      "Explore Muhammad Saad Shabir's projects in eBPF network enforcement, Rust packet analysis, C++ routing, and cloud infrastructure tooling.",
    label: "PROJECTS",
  },
  writing: {
    path: "/writing",
    title: "Technical Writing",
    description:
      "Technical notes by Muhammad Saad Shabir on network security, eBPF, systems programming, and formal proofs with Lean 4.",
    label: "WRITING",
  },
} as const satisfies Record<string, SeoPage>;

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export function getShareImage(slug: string, title: string) {
  return {
    url: new URL(`/og/${slug}`, SITE_CONFIG.url).toString(),
    ...SHARE_IMAGE_SIZE,
    type: "image/png",
    alt: `${title} — ${SITE_CONFIG.name}`,
  };
}

function createMetadata(page: SeoPage, slug: string, publishedAt?: string): Metadata {
  const title =
    page.path === "/"
      ? `${SITE_CONFIG.name} | ${page.title}`
      : `${page.title} | ${SITE_CONFIG.name}`;
  const url = new URL(page.path, SITE_CONFIG.url).toString();
  const image = getShareImage(slug, page.title);

  return {
    title: { absolute: title },
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: page.description,
      url,
      siteName: SITE_CONFIG.name,
      locale: "en_CA",
      images: [image],
      ...(publishedAt
        ? {
            type: "article",
            publishedTime: publishedAt,
            authors: [SITE_CONFIG.url],
          }
        : { type: "website" }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: page.description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}

export function getPageMetadata(key: keyof typeof SEO_PAGES): Metadata {
  return createMetadata(SEO_PAGES[key], key);
}

export function getArticle(slug: string) {
  const article = WRITING.find((entry) => entry.url === `/writing/${slug}`);
  if (!article) throw new Error(`Unknown article: ${slug}`);
  return article;
}

export function getArticleMetadata(slug: string): Metadata {
  const article = getArticle(slug);
  return createMetadata(
    {
      path: article.url,
      title: article.title,
      description: article.description,
      label: "WRITING",
    },
    slug,
    article.publishedAt,
  );
}

export function getSharePage(slug: string): SeoPage | undefined {
  if (Object.hasOwn(SEO_PAGES, slug)) {
    return SEO_PAGES[slug as keyof typeof SEO_PAGES];
  }
  const article = WRITING.find((entry) => entry.url === `/writing/${slug}`);
  if (!article) return undefined;
  return {
    path: article.url,
    title: article.title,
    description: article.description,
    label: `WRITING / ${article.publishedAt}`,
  };
}
