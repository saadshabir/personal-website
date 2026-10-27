import { SITE_CONFIG } from "@/lib/constants";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <p>{SITE_CONFIG.name}</p>
        <p>{SITE_CONFIG.location}</p>
      </div>
      <ThemeToggle />
    </footer>
  );
}
