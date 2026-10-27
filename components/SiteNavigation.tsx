"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pages = [
  { href: "/projects", label: "Projects" },
  { href: "/work", label: "Work" },
  { href: "/writing", label: "Writing" },
  { href: "/about", label: "About" },
];

export default function SiteNavigation() {
  const pathname = usePathname();

  return (
    <nav className="site-navigation" aria-label="Main navigation">
      {pages.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname.startsWith(href) ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
