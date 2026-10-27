interface ExperienceCardProps {
  position: string;
  company: string;
  dates: string;
  description: readonly string[];
  link: string;
}

export default function ExperienceCard({ position, company, dates, description, link }: ExperienceCardProps) {
  return (
    <article className="experience-row">
      <p className="experience-date">{dates}</p>
      <div>
        <h3>{position}</h3>
        <p className="experience-company">
          {link && link !== "#" ? <a className="text-link" href={link} target="_blank" rel="noopener noreferrer">{company}</a> : company}
        </p>
        {description.map((text) => <p className="experience-description" key={text}>{text}</p>)}
      </div>
    </article>
  );
}
