import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { resolve } from "node:path";

// Run after next build. Counts assets referenced by the prerendered page,
// excluding legacy-only scripts. Gzip sizes are estimates, not browser timings.
const route = process.argv[2] ?? "/";
const page = route.replace(/^\/+|\/+$/g, "") || "index";
if (!/^[a-z0-9/-]+$/i.test(page) || page.split("/").includes("..")) {
  throw new Error("Pass a prerendered route, for example /about or /writing/add-commutative.");
}

const html = await readFile(resolve(".next/server/app", `${page}.html`));
const references = new Set();
for (const [tag] of html.toString().matchAll(/<(?:script|link)\b[^>]*>/gi)) {
  if (/\bnomodule\b/i.test(tag)) continue;
  const url = tag.match(/\b(?:src|href)="([^"?#]+)"/)?.[1];
  if (url?.startsWith("/_next/static/") && /\.(?:js|css|woff2)$/.test(url)) {
    references.add(url);
  }
}

const assets = await Promise.all([...references].sort().map(async (url) => {
  const file = await readFile(resolve(".next", url.slice("/_next/".length)));
  return { url, bytes: file.length, gzipBytes: gzipSync(file).length };
}));

const summary = {};
for (const [type, extension] of [["javascript", ".js"], ["styles", ".css"], ["preloadedFonts", ".woff2"]]) {
  const files = assets.filter((asset) => asset.url.endsWith(extension));
  summary[type] = {
    files: files.length,
    bytes: files.reduce((total, asset) => total + asset.bytes, 0),
    gzipBytes: files.reduce((total, asset) => total + asset.gzipBytes, 0),
  };
}
console.log(JSON.stringify({
  route,
  html: { bytes: html.length, gzipBytes: gzipSync(html).length },
  summary,
  assets,
}, null, 2));
