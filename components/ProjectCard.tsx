import Link from "next/link";
import ProjectMark from "@/components/ProjectMark";

interface ProjectCardProps {
  name: string;
  anchor: string;
  title: string;
  tags: readonly string[];
  description: string;
  link: string;
  writing: readonly { title: string; url: string }[];
}

export default function ProjectCard({ name, anchor, title, tags, description, link, writing }: ProjectCardProps) {
  return (
    <article id={anchor} className="project-row">
      <ProjectMark name={name} />
      <div className="project-content">
        <h3><a href={link} target="_blank" rel="noopener noreferrer">{title}</a></h3>
        <p className="project-tags">{tags.join(" · ")}</p>
        <p className="project-description">{description}</p>
        <nav className="project-links" aria-label={`Links for ${name}`}>
          <a href={link} target="_blank" rel="noopener noreferrer">Code</a>
          {writing.map((entry) => <Link key={entry.url} href={entry.url}>{entry.title}</Link>)}
        </nav>
      </div>
    </article>
  );
}
