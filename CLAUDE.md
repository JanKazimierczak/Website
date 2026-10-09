# Jan Kazimierczak — portfolio site

A static, dependency-free site. No framework, no bundler, no npm runtime
dependencies. GitHub Pages serves **the repository root of `main`** directly;
`dist/` is a verification build, not the deployed artifact (see *Deployment*).

## Commands

```sh
npm run dev          # python3 -m http.server 4173
npm test             # node --check on every script, then validate the source tree
npm run build        # write dist/ (SITE_URL=… regenerates sitemap + robots)
npm run test:production   # re-run the validator against dist/
npm run format       # normalise line endings and trailing whitespace
```

`npm test` must pass before publishing. It enforces doctype, `lang`, viewport,
a single `h1`, meta description, skip link, canonical/OG consistency, local link
targets, `rel="noopener"` on external links, required files, PNG signatures, and
a set of project-specific factual guardrails.

## Layout

| Path | What it holds |
| --- | --- |
| `*.html` | One file per route. Header, nav, and footer are duplicated per page by hand — there is no templating. |
| `site.css` / `site.js` | The whole main site. `stocks.*` / `discover.*` are a separate, self-contained stylesheet and scripts. |
| `assets/` | Site-level images, icons, CV. `assets/thumbs/` holds card-sized versions of case-study images. |
| `civ102-assets/`, `praxis2-assets/`, `bikepack-assets/` | Full-size case-study images, shown in the lightbox. |
| `reports/`, `One-pagers/` | Linked PDFs. |
| `scripts/` | `build.mjs`, `validate-site.mjs`, `format-site.mjs`, plus one-off Python report generators. |

## Design system

Everything visual goes through tokens defined at the top of `site.css`. Reach
for an existing token before inventing a value.

**Colour.** The portfolio uses one light palette: warm white, charcoal, and
neutral grays. Do not add automatic dark mode, a theme toggle, colorful
background gradients, or glowing accents. Use the shared tokens for components.

Key groups: `--bg*` / `--surface*` / `--media-bg*` (surfaces), `--line*` /
`--shadow*` / `--grid-line` (edges and depth), `--text*` (type),
`--accent*` / `--on-accent` / `--focus-ring` (accents),
`--invert-*` (dark bands that sit inside a light page).

`--ink` / `--ink-text` provide a charcoal plate and white label for buttons,
chips, and table headers. Use this pair together to preserve contrast.

**Type.** `--step--2` through `--step-6`, fluid via `clamp()`. New rules should
use a step. Some older headings still carry bespoke `clamp()` values; convert
them opportunistically, but only when the change is visually neutral.

**Space and radius.** `--space-3xs`…`--space-3xl`, `--radius-xs`…`--radius-pill`.

**Breakpoints.** The sheet still uses several ad-hoc widths. Prefer the
established ones: `560px`, `760px`, `920px` (nav collapses here), `980px`,
`1120px`.

## Images

Every raster image referenced from HTML has a `.webp` sibling and is wrapped:

```html
<picture>
  <source srcset="path/name.webp" type="image/webp">
  <img src="path/name.png" width="…" height="…" alt="…" loading="lazy" decoding="async">
</picture>
```

`picture { display: contents; }` keeps the `<img>` as the flex/grid item, so the
wrapper never affects layout.

Rules for new images:

- **Always set `width` and `height`** to the file's real pixel dimensions.
- Generate a `.webp` sibling; **skip it if it comes out larger** than the
  original (true for some flat-colour PNGs — ten such files have no `.webp`).
- Size caps: `assets/thumbs/` 900px, everything else 1600–1800px on the long
  edge. Nothing needs to be larger; the lightbox tops out well below that.
- Lightbox targets carry both `data-zoom-image` (the fallback) and
  `data-zoom-image-webp`. `site.js` prefers the WebP and falls back on error.
- Run PDFs through Ghostscript before committing:
  `gs -dPDFSETTINGS=/ebook -dColorImageResolution=150 …`

## Adding a project

`PROJECTS.md` has the full procedure. In short: duplicate a `.project-card`
article on the relevant collection page, copy the closest case-study page, then
register the new route in `scripts/build.mjs` (`files`, `sitemapPages`),
`scripts/validate-site.mjs` (`indexablePages`, and `requiredFiles` for any new
report), and `sitemap.xml`.

Case-study pages carry two JSON-LD blocks: an `Article` (or `SoftwareSourceCode`)
and a `BreadcrumbList`. Copy the pattern from an existing case study.

## Deployment

The public address is **https://jankazimierczak.github.io/Website/**. Keep
absolute site URLs under `/Website/`; do not add a `CNAME` file unless a custom
domain is intentionally configured. The web manifest uses relative paths,
and the 404 page uses `/Website/` paths so nested missing URLs recover correctly.

Pages is currently set to **deploy from the `main` branch root**, so committing
to `main` publishes. `.github/workflows/ci.yml` validates every push but does
not deploy.

`.github/workflows/deploy-pages.yml` can take over: switch
*Settings → Pages → Source* to **GitHub Actions**, then uncomment the `push`
trigger in that file. Until the setting is switched, that workflow will fail at
the deploy step by design.

## Known constraints

- The contact form posts to FormSubmit with the address in the action URL. There
  is no fallback if that service goes down.
- `stocks.js` / `discover.js` reach public market data through third-party CORS
  proxies (`allorigins.win`, `rss2json`, `r.jina.ai`). These rate-limit and
  change without notice; panels are written to fail individually rather than
  take the page down. `market-dashboard.html` documents this openly — keep that
  page honest if the behaviour changes.
- Header/footer markup is duplicated across every page. A change to the nav means
  editing every HTML file; `heads`-style Node scripts in a scratch directory are
  the usual way to do it safely.
