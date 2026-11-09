import JsonLd from "@/components/JsonLd";
import { SITE_CONFIG } from "@/lib/constants";
import { AUTHOR, getArticle, getCanonicalUrl, getShareImage, SEO_PAGES } from "@/lib/seo";

export default function ArticleStructuredData({ slug }: { slug: string }) {
  const article = getArticle(slug);
  const url = getCanonicalUrl(article.url);
  const posting = {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    ...(article.updatedAt && { dateModified: article.updatedAt }),
    image: getShareImage(slug, article.title).url,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: AUTHOR,
    inLanguage: SITE_CONFIG.language,
  };
  const breadcrumbs = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Writing",
        item: getCanonicalUrl(SEO_PAGES.writing.path),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: article.title,
        item: url,
      },
    ],
  };

  return <JsonLd data={{ "@graph": [posting, breadcrumbs] }} />;
}
