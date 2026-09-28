interface ProjectCardProps {
  title: string;
  tags: readonly string[];
  description: string;
  link: string;
}

export default function ProjectCard({
  title,
  tags,
  description,
  link,
}: ProjectCardProps) {
  return (
    <div className="relative w-full rounded-lg py-4">
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
      </div>
    </div>
  );
}
