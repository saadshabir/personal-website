import { PROJECTS, PROJECT_CATEGORIES, WRITING } from "@/lib/constants";
import ProjectCard from "@/components/ProjectCard";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("projects");
const featuredOrder = ["ZTAP", "RouteProof", "NetScope"];

export default function ProjectsPage() {
  return (
    <div className="content-page">
      <header className="page-intro">
        <h1>Projects</h1>
      </header>
      {PROJECT_CATEGORIES.map((category) => {
        const projects = PROJECTS.filter((project) => project.category === category.id);
        if (category.id === "active") projects.sort((a, b) => featuredOrder.indexOf(a.name) - featuredOrder.indexOf(b.name));
        return (
          <section key={category.id} id={category.id === "active" ? "active-projects" : undefined} className="project-section">
            <h2 className="section-label">{category.title}</h2>
            <div>
              {projects.map((item) => (
                <ProjectCard key={item.id} name={item.name} anchor={item.name.toLowerCase()} title={item.displayTitle ?? item.name}
                  tags={item.tags} description={item.description} link={item.url}
                  writing={WRITING.filter((entry) => entry.projectId === item.id)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
