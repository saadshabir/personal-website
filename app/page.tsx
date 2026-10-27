import NetworkPlayground from "@/components/NetworkPlayground";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata("home");

export default function Home() {
  return (
    <div className="home-page">
      <section className="network-playground" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">
            <span className="hero-muted">Building tools</span>{" "}
            <span className="hero-gradient">for reliable<br />systems.</span>
          </h1>
        </div>
        <NetworkPlayground />
      </section>
    </div>
  );
}
