import { ImageResponse } from "next/og";
import { SEO_PAGES, SHARE_IMAGE_SIZE, getSharePage } from "@/lib/seo";
import { SITE_CONFIG, WRITING } from "@/lib/constants";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    ...Object.keys(SEO_PAGES),
    ...WRITING.map((article) => article.url.split("/").at(-1)),
  ].map((slug) => ({ slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const page = getSharePage(slug);
  if (!page) return new Response("Not found", { status: 404 });

  const isHome = slug === "home";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "56px 64px",
          background: "#fafafa",
          color: "#27272a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 12,
              background: "#27272a",
              color: "#fafafa",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            MSS
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                background: "#22c55e",
              }}
            />
            <span style={{ fontSize: 22, color: "#68686d" }}>
              {SITE_CONFIG.location}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            gap: 18,
          }}
        >
          <div
            style={{ fontSize: 18, letterSpacing: 3, color: "#68686d" }}
          >
            {page.label}
          </div>
          <div
            style={{
              fontSize: isHome ? 68 : 60,
              lineHeight: 1.12,
              letterSpacing: -2.5,
              fontWeight: 700,
              maxWidth: 1050,
            }}
          >
            {isHome ? SITE_CONFIG.name : page.title}
          </div>
          <div
            style={{
              fontSize: 27,
              lineHeight: 1.4,
              color: "#68686d",
              maxWidth: 1000,
            }}
          >
            {isHome
              ? "Network architecture, protocol analysis, and systems programming."
              : page.description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: "1px solid #e4e4e7",
            fontSize: 20,
            color: "#68686d",
          }}
        >
          <span>{isHome ? "Projects / Work / Writing" : SITE_CONFIG.name}</span>
          <span>{new URL(SITE_CONFIG.url).hostname}</span>
        </div>
      </div>
    ),
    {
      ...SHARE_IMAGE_SIZE,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    },
  );
}
