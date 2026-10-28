import Link from "next/link";
import RelatedProject from "@/components/RelatedProject";
import { formatWritingDate } from "@/lib/format-writing-date";
import { getArticle } from "@/lib/seo";

export default function ArticleHeader({ slug, title }: { slug: string; title?: string }) {
  const article = getArticle(slug);

  return (
    <header className="article-header">
      <nav className="article-breadcrumb" aria-label="Breadcrumb">
        <Link href="/writing">All writing</Link>
      </nav>
      <h1>{title ?? article.title}</h1>
      <time dateTime={article.publishedAt}>{formatWritingDate(article.publishedAt, "long")}</time>
      {article.projectId && (
        <div className="article-actions">
          <RelatedProject projectId={article.projectId} />
        </div>
      )}
    </header>
  );
}
