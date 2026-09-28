import { PROJECTS, PROJECT_CATEGORIES } from "@/lib/constants";
import ProjectCard from "@/components/ProjectCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

export default function ProjectsPage(): React.JSX.Element {
  return (
    <>
      <div className="mb-4 flex items-center justify-between w-full">
        <Link
          href="/"
          className="font-medium text-foreground transition-colors hover:text-muted-foreground"
        >
          Home
        </Link>
        <ThemeToggle />
      </div>

      <h1 className="text-2xl font-bold tracking-[-0.04em] text-foreground mb-2">
        Projects
      </h1>

      <div className="flex w-full flex-col gap-10">
        {PROJECT_CATEGORIES.map((category) => {
          const projects = PROJECTS.filter(
            (project) => project.category === category.id,
          );

          return (
            <section
              key={category.id}
              id={category.id === "active" ? "active-projects" : undefined}
              className="flex flex-col gap-2"
            >
              <div className="flex items-baseline justify-between border-b border-[var(--surface-border)] pb-2">
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
                  {category.title}
                </h2>
                <span className="font-mono text-xs text-muted-foreground">
                  {String(projects.length).padStart(2, "0")}
                </span>
              </div>

              <div className="flex w-full flex-col">
                {projects.map((item) => (
                  <ProjectCard
                    key={item.id}
                    title={item.displayTitle ?? item.name}
                    tags={item.tags}
                    description={item.description}
                    link={item.url}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
