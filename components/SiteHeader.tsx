import Link from "next/link";
import SiteNavigation from "@/components/SiteNavigation";
import { SITE_CONFIG } from "@/lib/constants";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-identity" aria-label={`${SITE_CONFIG.name} — home`}>
          <span className="site-name">
            <span>{SITE_CONFIG.name}</span>
            <bdi className="site-name-urdu" lang="ur" dir="rtl">محمد سعد شبیر</bdi>
          </span>
          <span className="site-subtitle">Systems &amp; infrastructure</span>
        </Link>
        <SiteNavigation />
      </div>
    </header>
  );
}
