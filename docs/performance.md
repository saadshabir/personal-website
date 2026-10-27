# Asset size check — 2026-10-26

Compared the working checkout immediately before and after the performance
changes, using production builds with Next.js 16.4.2 and Node.js 22.17.0.
Both builds prerender all portfolio pages. Figures are bytes.

| Homepage resource | Before | After |
| --- | ---: | ---: |
| HTML | 27,573 | 28,786 |
| Modern JavaScript | 484,356 | 483,474 |
| CSS | 30,375 | 29,020 |
| Preloaded fonts | 189,028 | 55,676 |
| Total above | 731,332 | 596,956 |
| Estimated gzip total | 347,991 | 214,904 |

Preloaded fonts are 70.5% smaller. The main improvement replaces the
159,740-byte Arabic font with a 26,388-byte local subset for the Urdu name.
The header identity and hero copy now render in Server Components, while
navigation highlighting and the network demo retain their interactivity.

Reproduce the asset inventory after `npm run build` with `npm run perf:assets`.
The script measures built HTML and its referenced CSS, modern scripts, and
preloaded fonts. The 38.2% gzip reduction is an asset-size estimate, not an
LCP, INP, Lighthouse score, or live-network timing. It excludes images, fonts
loaded only by CSS, navigation prefetches, and Vercel's runtime scripts.

Validation passed:

- Production build, TypeScript, and `git diff --check`.
- HarfBuzz comparison of the full font and subset: identical shaped glyphs,
  clusters, advances, and offsets for `محمد سعد شبیر`.
- Browser: requests through API A, failover to API B, cancellation when both
  services are paused, unavailable-route handling, recovery, and reset.
- Keyboard link/service activation, navigation highlighting, and theme toggle.
- 320 × 800 layout: compact graph visible, working request control, and no
  horizontal overflow (viewport and document width both 320 px).
- All eight portfolio pages, robots, sitemap, and sampled OG images returned 200.
