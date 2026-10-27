import Image from "next/image";
import Link from "next/link";
import EmailButton from "@/components/EmailButton";
import { SITE_CONFIG } from "@/lib/constants";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("about");

export default function AboutPage() {
  return (
    <div className="content-page">
      <header className="page-intro"><h1>About</h1></header>
      <div className="about-grid">
        <div className="about-copy">
          <p>I&apos;m {SITE_CONFIG.name}, a Network Technology student at <a className="text-link" href={SITE_CONFIG.schoolUrl} target="_blank" rel="noopener noreferrer">{SITE_CONFIG.school}</a> in {SITE_CONFIG.location}.</p>
          <p>I build tools for network security, traffic analysis, and system reliability. I focus on correctness, measuring performance, and understanding how systems behave when something fails.</p>
          <p>That takes a few forms: enforcing Kubernetes network policies with <Link className="text-link" href="/projects#ztap">ZTAP</Link>, simulating routing and failures with <Link className="text-link" href="/projects#routeproof">RouteProof</Link>, and analyzing packets and flows with <Link className="text-link" href="/projects#netscope">NetScope</Link>.</p>
          <p>I&apos;m interested in applying those skills to the infrastructure behind payments, trading, and financial markets.</p>
        </div>
        <aside className="about-profile" aria-label="Photo and contact links">
          <Image
            className="about-portrait"
            src="/images/muhammad-saad-shabir.jpg"
            alt="Muhammad Saad Shabir standing beside a mountain lake"
            width={768}
            height={1024}
            sizes="(max-width: 360px) calc(100vw - 40px), 320px"
            loading="eager"
          />
          <nav className="about-contact" aria-label="Contact and profiles">
            <EmailButton email={SITE_CONFIG.email} />
            <a href={SITE_CONFIG.github} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href={SITE_CONFIG.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href={SITE_CONFIG.resume} target="_blank" rel="noopener noreferrer">Resume</a>
          </nav>
        </aside>
      </div>
    </div>
  );
}
