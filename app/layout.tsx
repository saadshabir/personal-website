import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SITE_CONFIG } from "@/lib/constants";
import { getPageMetadata } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_CONFIG.url}/#person`,
  name: SITE_CONFIG.name,
  jobTitle: SITE_CONFIG.jobTitle,
  description: SITE_CONFIG.description,
  url: SITE_CONFIG.url,
  sameAs: [SITE_CONFIG.github, SITE_CONFIG.linkedin],
  knowsAbout: [
    "Network Architecture",
    "Protocol Analysis",
    "System Programming",
    "Cybersecurity",
    "Cloud Architecture",
  ],
};

export const metadata: Metadata = {
  ...getPageMetadata("home"),
  metadataBase: new URL(SITE_CONFIG.url),
  keywords: [
    "network engineering",
    "system programming",
    "cybersecurity",
    "cloud architecture",
    "software development",
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
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#fafafa" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen font-sans leading-relaxed antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <main className="flex w-full min-h-screen flex-col items-center px-8">
            <div className="flex w-full flex-col items-start gap-8 px-4 pt-32 pb-48 text-base md:w-3/4 lg:w-1/2">
              {children}
            </div>
          </main>
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
