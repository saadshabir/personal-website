import JsonLd from "@/components/JsonLd";
import NetworkPlayground from "@/components/NetworkPlayground";
import { SITE_CONFIG } from "@/lib/constants";
import { getCanonicalUrl, getPageMetadata, SEO_PAGES } from "@/lib/seo";
import "./home.css";

export const metadata = getPageMetadata("home");

export default function Home() {
  return (
    <div className="home-page">
      <JsonLd data={{
        "@type": "WebSite",
        name: SITE_CONFIG.name,
        alternateName: SITE_CONFIG.alternateName,
        url: getCanonicalUrl(SEO_PAGES.home.path),
        inLanguage: SITE_CONFIG.language,
      }} />
      <section className="network-playground" aria-labelledby="hero-title">
        <NetworkPlayground>
          <h1 id="hero-title">
            <span className="hero-muted">Building tools</span>{" "}
            <span className="hero-gradient">for reliable<br />systems.</span>
          </h1>
        </NetworkPlayground>
      </section>
    </div>
  );
}
