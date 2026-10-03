import Link from "next/link";

interface ProjectCardProps {
  anchor: string;
  title: string;
  tags: readonly string[];
  description: string;
  link: string;
  writing: readonly { title: string; url: string }[];
}

export default function ProjectCard({
  anchor,
  title,
  tags,
  description,
  link,
  writing,
}: ProjectCardProps) {
  return (
    <article id={anchor} className="relative w-full scroll-mt-8 rounded-lg py-4">
      <div className="relative flex flex-col gap-2">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="group w-fit flex items-center gap-1 font-bold text-foreground hover:text-muted-foreground transition-colors"
          >
            <h3 className="text-current">{title}</h3>
            <span aria-hidden="true" className="text-current ml-0.5">
              ↗
            </span>
          </a>
        ) : (
          <div className="group w-fit flex items-center gap-1 font-bold text-foreground">
            <h3>{title}</h3>
          </div>
        )}
        {tags.length > 0 ? (
          <p className="font-medium text-muted-foreground">
            {tags.join(" • ")}
          </p>
        ) : null}
        <p className="font-medium text-foreground">{description}</p>
        {writing.length > 0 ? (
          <nav
            aria-label={`Writing about ${title}`}
            className="mt-2 flex flex-col gap-2 border-t border-[var(--surface-border)] pt-3 text-sm"
          >
            <span className="text-muted-foreground">Writing</span>
            {writing.map((entry) => (
              <Link key={entry.url} href={entry.url} className="related-link w-fit">
                {entry.title} <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </article>
  );
}
