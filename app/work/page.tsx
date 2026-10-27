import { EXPERIENCE } from "@/lib/constants";
import ExperienceCard from "@/components/ExperienceCard";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("work");

export default function WorkPage() {
  return (
    <div className="content-page">
      <header className="page-intro">
        <h1>Work</h1>
      </header>
      <section className="experience-section" aria-labelledby="experience-title">
        <h2 id="experience-title" className="section-label">Experience</h2>
        {EXPERIENCE.map((item) => (
          <ExperienceCard key={`${item.company}-${item.position}`} {...item} />
        ))}
      </section>
    </div>
  );
}
