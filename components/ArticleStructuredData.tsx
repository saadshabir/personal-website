import { SITE_CONFIG } from "@/lib/constants";
import { getArticle, getShareImage } from "@/lib/seo";

export default function ArticleStructuredData({ slug }: { slug: string }) {
  const article = getArticle(slug);
  const url = new URL(article.url, SITE_CONFIG.url).toString();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    image: getShareImage(slug, article.title).url,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: {
      "@type": "Person",
      "@id": `${SITE_CONFIG.url}/#person`,
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    inLanguage: "en-CA",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
      }}
    />
  );
}
