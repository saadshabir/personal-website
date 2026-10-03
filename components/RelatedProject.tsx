import Link from "next/link";
import { PROJECTS } from "@/lib/constants";

export default function RelatedProject({
  projectId,
  showSource = false,
}: {
  projectId?: string;
  showSource?: boolean;
}) {
  const project = PROJECTS.find((entry) => entry.id === projectId);
  if (!project) return null;

  return (
    <nav
      aria-label="Related project"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
    >
      <span>Project</span>
      <Link
        href={`/projects#${project.name.toLowerCase()}`}
        className="related-link"
      >
        {project.name} <span aria-hidden="true">→</span>
      </Link>
      {showSource ? (
        <>
          <span aria-hidden="true">·</span>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="related-link"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </>
      ) : null}
    </nav>
  );
}
