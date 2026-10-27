export default function ProjectMark({ name }: { name: string }) {
  return (
    <div className={`project-mark mark-${name.toLowerCase()}`} aria-hidden="true">
      <svg viewBox="0 0 96 96" fill="none">
        {name === "ZTAP" ? <>
          <path d="M48 17 72 27v20c0 16-10 25-24 32-14-7-24-16-24-32V27Z" /><path d="m37 47 8 8 16-18" />
          <circle cx="24" cy="27" r="3" /><circle cx="72" cy="27" r="3" />
        </> : name === "RouteProof" ? <>
          <path d="M19 51 43 23 73 38 58 72 19 51 73 38M43 23 58 72" /><path className="mark-accent" d="M19 51 43 23 73 38" />
          {[[19, 51], [43, 23], [73, 38], [58, 72]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="5" />)}
        </> : name === "NetScope" ? <>
          <path d="M19 22v51h60M23 53h10l7-23 11 36 9-22 7 9h12" /><circle className="mark-accent" cx="59" cy="44" r="15" /><path d="m70 55 11 11" />
        </> : name === "pci-segment" ? <>
          <rect x="14" y="23" width="26" height="50" rx="3" /><rect x="56" y="23" width="26" height="50" rx="3" />
          <path d="m25 37 7 22M32 48h12m8 0h17" /><path className="mark-accent" d="M48 16v64" strokeDasharray="3 5" />
          <circle cx="25" cy="37" r="4" /><circle cx="32" cy="59" r="4" /><circle cx="69" cy="48" r="4" />
        </> : name === "cloud-netmapper" ? <>
          <path d="M30 44h34a11 11 0 0 0 1-22 17 17 0 0 0-32-1 12 12 0 0 0-3 23Z" />
          <path className="mark-accent" d="M48 44v15M20 69V59h56v10M48 59v10" />
          <circle cx="20" cy="74" r="5" /><circle cx="48" cy="74" r="5" /><circle cx="76" cy="74" r="5" />
        </> : name === "net-guardian" ? <>
          <circle cx="48" cy="48" r="29" /><circle cx="48" cy="48" r="18" />
          <path d="M48 19v7m29 22h-7M48 77v-7M19 48h7" /><path className="mark-accent" d="M48 48 69 27" />
          <circle cx="36" cy="41" r="3" /><circle cx="58" cy="62" r="3" />
        </> : name === "CloudChat" ? <>
          <path className="mark-accent" d="M43 22h29a7 7 0 0 1 7 7v19a7 7 0 0 1-7 7h-5v10l-8-7M36 30v-1a7 7 0 0 1 7-7" />
          <path d="M23 36h31a7 7 0 0 1 7 7v19a7 7 0 0 1-7 7H35L23 79V69a7 7 0 0 1-7-7V43a7 7 0 0 1 7-7Z" />
          <circle cx="29" cy="52" r="2" /><circle cx="39" cy="52" r="2" /><circle cx="49" cy="52" r="2" />
        </> : name === "personal-ai-cli" ? <>
          <path className="mark-accent" d="M49 32V16h20l11 11v25h-8M69 16v11h11" /><path d="M55 27h7m-7 6h17" />
          <rect x="16" y="33" width="56" height="43" rx="3" /><path d="M16 43h56m-44 10 8 7-8 7m17 0h15" />
        </> : <>
          <rect x="20" y="24" width="56" height="47" rx="2" /><path d="m31 38 8 8-8 8M47 55h16" />
        </>}
      </svg>
    </div>
  );
}
