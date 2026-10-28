import Link from "next/link";
import { PROJECTS } from "@/lib/constants";

export default function RelatedProject({
  projectId,
}: {
  projectId: string;
}) {
  const project = PROJECTS.find((entry) => entry.id === projectId);
  if (!project) return null;

  return (
    <nav
      aria-label="Related project"
      className="related-project"
    >
      <span>Project</span>
      <Link
        href={`/projects#${project.name.toLowerCase()}`}
        className="related-link"
      >
        {project.name}
      </Link>
      <span aria-hidden="true">·</span>
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className="related-link"
      >
        GitHub
      </a>
    </nav>
  );
}
