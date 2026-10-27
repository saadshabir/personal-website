# Performance checks

## Cleanup and responsive graph — 2026-10-27

Compared commit `dd80636` with this working checkout, using production builds
with Next.js 16.4.2 and Node.js 22.17.0. All portfolio pages remain prerendered.
The inventories are retained as [before](performance/2026-10-27-before.json)
and [after](performance/2026-10-27-after.json). Figures are bytes.

| Homepage resource | Before | After |
| --- | ---: | ---: |
| HTML | 29,363 | 25,314 |
| Modern JavaScript | 483,474 | 483,400 |
| CSS | 29,020 | 19,199 |
| Preloaded fonts | 55,676 | 55,676 |
| Total above | 597,533 | 583,589 |
| Estimated gzip total | 214,981 | 212,682 |

CSS is 33.8% smaller (27.1% after gzip); HTML is 13.8% smaller. The complete
inventoried payload is 2.3% smaller, or 1.1% by estimated gzip size. JavaScript
is effectively unchanged. These are asset sizes, not LCP, INP, Lighthouse
scores, or network timings. The inventory excludes images, fonts loaded only
by CSS, navigation prefetches, and Vercel's runtime scripts.

Changes:

- Replaced Tailwind's remaining utilities and reset with plain CSS, preserving
  the existing design. Removed its config, PostCSS config, and 40 package
  entries from the lockfile (104 to 64, including the root entry).
- Replaced the duplicate desktop/mobile SVGs with one responsive graph. Its
  idle descendants drop from 112 to 56. CSS selects geometry at the existing
  breakpoint, so resizing needs no listener or React state update.
- Precomputed static node/link geometry, memoized route geometry, and replaced
  the packet animation component and effect with a CSS motion path. Route
  changes and repeated sends restart the animation through its React key.
- Removed the pass-through theme provider component, unused status data and
  CSS variables, unused resume-link styling, and overridden article utilities.
- No repository test suite, test files, or test framework dependencies were
  present to remove. Kept the asset inventory script because it measures the
  production output used above.

Validation:

- Production build and TypeScript with `--noUnusedLocals --noUnusedParameters`.
- Computed-style comparison across all eight pages before/after the CSS
  conversion at 799 × 817: all 697 sampled elements matched on 26 properties.
- Browser: API A delivery, in-flight failover to API B, cancellation when both
  services pause, rejection without a route, recovery, reset, packet movement,
  keyboard activation, node descriptions/Escape, theme persistence, and active
  navigation highlighting. No browser console errors were observed.
- Same-origin iframe viewport checks: homepage at 320, 480, 760, and 1440 px;
  all eight pages at 320 px. Document width matched viewport width throughout.
  The compact graph's request control also delivered successfully.
- 21 page/asset endpoints returned 200, including all eight OG images, sitemap,
  robots, manifest, icon, and resume. Both legacy article URLs returned 308 to
  the canonical article.
- `git diff --check`.

Reproduce with `npm run build`, `npm run type-check`, and `npm run perf:assets`.
The graph uses CSS SVG path geometry and motion paths; browser checks above
used the current in-app browser.

## Asset size check — 2026-10-26

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
