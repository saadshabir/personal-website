import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "next-themes";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { SITE_CONFIG } from "@/lib/constants";
import { getPageMetadata } from "@/lib/seo";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

// This subset contains the header name only; see fonts/README.md before changing it.
const urdu = localFont({
  src: "./fonts/noto-nastaliq-urdu-name.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-urdu",
  adjustFontFallback: "Times New Roman",
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_CONFIG.url}/#person`,
  name: SITE_CONFIG.name,
  alternateName: "Saad Shabir",
  jobTitle: SITE_CONFIG.jobTitle,
  description: SITE_CONFIG.description,
  url: SITE_CONFIG.url,
  sameAs: [SITE_CONFIG.github, SITE_CONFIG.linkedin],
  affiliation: {
    "@type": "CollegeOrUniversity",
    name: SITE_CONFIG.school,
    url: SITE_CONFIG.schoolUrl,
  },
  knowsAbout: [
    "Network Engineering",
    "Systems Programming",
    "Kubernetes NetworkPolicy",
    "eBPF",
    "Packet Analysis",
    "Routing Simulation",
  ],
};

export const metadata: Metadata = {
  ...getPageMetadata("home"),
  metadataBase: new URL(SITE_CONFIG.url),
  keywords: [
    SITE_CONFIG.name,
    "Saad Shabir",
    "network engineering",
    "systems programming",
    "Kubernetes network policy",
    "eBPF",
    "Rust packet analysis",
    "C++ routing simulation",
    "ZTAP",
    "NetScope",
    "RouteProof",
    SITE_CONFIG.school,
  ],
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${urdu.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <a className="skip-link" href="#main-content">Skip to content</a>
          <div className="site-shell">
            <SiteHeader />
            <main id="main-content" className="site-main" tabIndex={-1}>{children}</main>
            <SiteFooter />
          </div>
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
