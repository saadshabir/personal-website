import { WRITING } from "@/lib/constants";
import Link from "next/link";
import { getPageMetadata } from "@/lib/seo";
import { formatWritingDate } from "@/lib/format-writing-date";

export const metadata = getPageMetadata("writing");

export default function WritingPage() {
  return (
    <div className="content-page writing-page">
      <header className="page-intro">
        <h1>Writing</h1>
      </header>
      <div className="writing-list">
        {WRITING.map((item) => (
          <Link key={item.id} href={item.url} className="writing-row">
            <time dateTime={item.publishedAt}>{formatWritingDate(item.publishedAt)}</time>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
