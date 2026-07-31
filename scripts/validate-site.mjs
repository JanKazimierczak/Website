import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const rootArg = args.find((arg) => !arg.startsWith("--")) || ".";
const root = path.resolve(rootArg);
const siteOrigin = "https://jan.kazimierczak.eu";

const indexablePages = [
  "index.html",
  "projects.html",
  "class-projects.html",
  "individual-projects.html",
  "orbital-booster-aerodynamics.html",
  "about.html",
  "contact.html",
  "design.html",
  "praxis-I.html",
  "praxis-II.html",
  "CIV102Bridge.html"
];

const requiredFiles = [
  ...indexablePages,
  "market-dashboard-project.html",
  "portfolio-system.html",
  "stocks.html",
  "discover.html",
  "404.html",
  "bridge-project.html",
  "praxis-project.html",
  "market-dashboard.html",
  "rocket-project.html",
  "control-project.html",
  "arch-project.html",
  "site.css",
  "site.js",
  "stocks.css",
  "stocks.js",
  "stocks-extra.js",
  "discover.js",
  "assets/social-preview.png",
  "assets/market-dashboard-preview.png",
  "assets/market-discovery-preview.png",
  "assets/orbital-booster/wind-tunnel-team.jpg",
  "assets/orbital-booster/grid-fin-matrix.jpg",
  "assets/orbital-booster/model-rocket-test.jpg",
  "assets/orbital-booster/load-cell-setup.jpg",
  "assets/orbital-booster/all-fin-results.png",
  "assets/orbital-booster/project-preview.png",
  "reports/orbital-booster-aerodynamics-final-report.pdf",
  "CNAME",
  "robots.txt",
  "sitemap.xml"
];

const unlistedPages = [
  "stocks.html",
  "discover.html"
];

const htmlFiles = (await readdir(root))
  .filter((file) => file.endsWith(".html"))
  .sort();

const errors = [];
const warnings = [];

const record = (condition, message, { warning = false } = {}) => {
  if (!condition) {
    (warning ? warnings : errors).push(message);
  }
};

const exists = async (file) => {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
};

for (const file of requiredFiles) {
  record(await exists(path.join(root, file)), `${file}: required production file is missing`);
}

for (const file of htmlFiles) {
  const absolute = path.join(root, file);
  const html = await readFile(absolute, "utf8");
  const isRedirect = /<meta\b[^>]*http-equiv=["']refresh["'][^>]*>/i.test(html);
  const label = path.relative(root, absolute);

  record(/^<!DOCTYPE html>/i.test(html), `${label}: missing HTML5 doctype`);
  record(/<html[^>]+lang="en"/i.test(html), `${label}: missing lang="en"`);
  record(/<meta[^>]+name="viewport"/i.test(html), `${label}: missing viewport metadata`);
  record(/<title>[^<]+<\/title>/i.test(html), `${label}: missing a non-empty title`);
  record(/<main(?:\s|>)/i.test(html), `${label}: missing main landmark`);
  record(!html.includes("[PLACEHOLDER:"), `${label}: production HTML exposes a factual placeholder`);
  record(!html.includes("BEEM.png"), `${label}: references the mislabeled HEIF asset BEEM.png`);
  record(!html.includes("WEB3FORMS_KEY"), `${label}: exposes the retired form API key`);

  if (!isRedirect) {
    record(/<meta[^>]+name="description"/i.test(html), `${label}: missing meta description`);
    record((html.match(/<h1(?:\s|>)/gi) || []).length === 1, `${label}: expected exactly one h1`);
    record(/<a\b[^>]*class=["'][^"']*\bskip-link\b[^"']*["'][^>]*href=["']#[^"']+["'][^>]*>/i.test(html), `${label}: missing skip link to main content`);
  }

  const canonicalMatches = [...html.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi)];
  if (indexablePages.includes(file)) {
    const expectedCanonical = file === "index.html" ? `${siteOrigin}/` : `${siteOrigin}/${file}`;
    const documentTitle = html.match(/<title>([^<]+)<\/title>/i)?.[1];
    const canonical = canonicalMatches[0]?.[1];
    const ogType = html.match(/<meta\b[^>]*property=["']og:type["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1];
    const ogTitle = html.match(/<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1];
    const ogDescription = html.match(/<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1];
    const ogUrl = html.match(/<meta\b[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1];
    const ogImage = html.match(/<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1];
    const ogImageAlt = html.match(/<meta\b[^>]*property=["']og:image:alt["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1];
    const twitterCard = html.match(/<meta\b[^>]*name=["']twitter:card["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1];

    record(canonicalMatches.length === 1, `${label}: expected exactly one canonical link`);
    record(canonical === expectedCanonical, `${label}: canonical must be ${expectedCanonical}`);
    record(["website", "article", "profile"].includes(ogType), `${label}: og:type must be website, article, or profile`);
    record(ogTitle === documentTitle, `${label}: og:title must match the document title`);
    record(Boolean(ogDescription), `${label}: missing og:description`);
    record(ogUrl === expectedCanonical, `${label}: og:url must match the canonical URL`);
    record(Boolean(ogImage), `${label}: missing og:image`);
    record(Boolean(ogImageAlt), `${label}: missing og:image:alt`);
    record(twitterCard === "summary_large_image", `${label}: twitter:card must be summary_large_image`);

    if (ogImage) {
      let parsedOgImage;
      try {
        parsedOgImage = new URL(ogImage);
      } catch {
        parsedOgImage = null;
      }
      record(parsedOgImage?.origin === siteOrigin, `${label}: og:image must be an absolute same-origin URL`);
      if (parsedOgImage?.origin === siteOrigin) {
        const imagePath = decodeURIComponent(parsedOgImage.pathname.replace(/^\/+/, ""));
        record(await exists(path.join(root, imagePath)), `${label}: og:image target does not exist (${ogImage})`);
      }
    }
  }

  if (isRedirect) {
    const refreshTarget = html.match(/<meta\b[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"';\s>]+)[^"']*["'][^>]*>/i)?.[1];
    const canonical = canonicalMatches[0]?.[1];
    const expectedCanonical = refreshTarget
      ? new URL(refreshTarget, `${siteOrigin}/${file}`).href
      : null;

    record(/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex[^"']*follow[^"']*["'][^>]*>/i.test(html), `${label}: redirect must use noindex,follow`);
    record(Boolean(refreshTarget), `${label}: redirect is missing a refresh destination`);
    record(canonicalMatches.length === 1, `${label}: redirect must have exactly one canonical link`);
    record(Boolean(expectedCanonical) && canonical === expectedCanonical, `${label}: redirect canonical must match its destination`);
  }

  if (file === "404.html") {
    record(/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex[^"']*["'][^>]*>/i.test(html), `${label}: 404 page must be noindex`);
  }

  if (unlistedPages.includes(file)) {
    record(/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex[^"']*follow[^"']*["'][^>]*>/i.test(html), `${label}: unlisted utility must use noindex,follow`);
  }

  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      record(false, `${label}: invalid JSON-LD (${error.message})`);
    }
  }

  if (file === "contact.html") {
    record(/<form\b[^>]*data-contact-form[^>]*>/is.test(html), `${label}: missing inline contact form`);
    record(/<input\b[^>]*name="name"[^>]*required[^>]*>/is.test(html), `${label}: contact name field must be required`);
    record(/<input\b[^>]*name="email"[^>]*type="email"[^>]*required[^>]*>/is.test(html), `${label}: contact email field must be a required email input`);
    record(/<textarea\b[^>]*name="message"[^>]*required[^>]*>/is.test(html), `${label}: contact message field must be required`);
    record(/data-form-status[^>]*role="status"[^>]*aria-live="polite"/is.test(html), `${label}: contact form needs an aria-live status region`);
    record(/<button\b[^>]*type="submit"[^>]*data-submit-button/is.test(html), `${label}: contact form needs a submit button`);
    record(/name="_honey"/i.test(html), `${label}: contact form is missing its spam honeypot`);
  }

  if (file === "class-projects.html" || file === "individual-projects.html") {
    const collectionProjectCount = [...html.matchAll(/\bclass=["']([^"']*)["']/gi)]
      .filter((match) => match[1].split(/\s+/).includes("project-card"))
      .length;
    record(collectionProjectCount >= 1, `${label}: project collection must expose at least one reusable project card`);
    record(html.includes("project-card-grid"), `${label}: project collection is missing the shared responsive card grid`);
  }

  if (file === "individual-projects.html") {
    record(html.includes("orbital-booster-aerodynamics.html"), `${label}: missing the orbital-booster case-study link`);
    record(html.includes("reports/orbital-booster-aerodynamics-final-report.pdf"), `${label}: missing the final-report link`);
    record(!/market-dashboard-project\.html|portfolio-system\.html/i.test(html), `${label}: archived projects remain visible on the personal project page`);
    record(!/currently contains one project|one experiment, documented/i.test(html), `${label}: personal project collection exposes stale single-project copy`);
  }

  if (file === "orbital-booster-aerodynamics.html") {
    record(html.includes("reports/orbital-booster-aerodynamics-final-report.pdf"), `${label}: missing the final-report link`);
    record(/three named co-authors/i.test(html), `${label}: missing team-authorship context`);
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  record(duplicateIds.length === 0, `${label}: duplicate id(s): ${[...new Set(duplicateIds)].join(", ")}`);

  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const attributes = match[1];
    if (/target="_blank"/i.test(attributes)) {
      record(/rel="[^"]*(?:noopener|noreferrer)/i.test(attributes), `${label}: target=_blank link lacks rel=noopener or noreferrer`);
    }
  }

  for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
    const attributes = match[1];
    record(/\salt="[^"]*"/i.test(attributes), `${label}: image missing alt attribute`);
  }

  const localReferences = [...html.matchAll(/(?:href|src|data-zoom-image)="([^"]+)"/gi)]
    .map((match) => match[1])
    .filter((reference) => {
      return reference &&
        !reference.startsWith("#") &&
        !reference.startsWith("http://") &&
        !reference.startsWith("https://") &&
        !reference.startsWith("mailto:") &&
        !reference.startsWith("data:");
    });

  for (const reference of localReferences) {
    const cleanReference = decodeURIComponent(reference.split("?")[0].split("#")[0]);
    if (!cleanReference) {
      continue;
    }
    const target = cleanReference.startsWith("/")
      ? path.join(root, cleanReference.replace(/^\/+/, ""))
      : path.resolve(path.dirname(absolute), cleanReference);
    record(await exists(target), `${label}: missing local target ${reference}`);
  }
}

for (const file of [
  "assets/social-preview.png",
  "assets/market-dashboard-preview.png",
  "assets/market-discovery-preview.png",
  "assets/orbital-booster/all-fin-results.png",
  "assets/orbital-booster/project-preview.png"
]) {
  const target = path.join(root, file);
  if (await exists(target)) {
    const signature = (await readFile(target)).subarray(0, 8).toString("hex");
    record(signature === "89504e470d0a1a0a", `${file}: .png asset does not contain PNG data`);
  }
}

const cnamePath = path.join(root, "CNAME");
if (await exists(cnamePath)) {
  record((await readFile(cnamePath, "utf8")).trim() === "jan.kazimierczak.eu", "CNAME: expected jan.kazimierczak.eu");
}

const robotsPath = path.join(root, "robots.txt");
if (await exists(robotsPath)) {
  const robots = await readFile(robotsPath, "utf8");
  const sitemapLines = robots.match(/^Sitemap:\s*.+$/gim) || [];
  record(sitemapLines.length === 1, "robots.txt: expected exactly one Sitemap directive");
  record(sitemapLines[0]?.trim() === `Sitemap: ${siteOrigin}/sitemap.xml`, "robots.txt: Sitemap directive must use the production URL");
}

const sitemapPath = path.join(root, "sitemap.xml");
if (await exists(sitemapPath)) {
  const sitemap = await readFile(sitemapPath, "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const expectedUrls = indexablePages.map((file) => file === "index.html" ? `${siteOrigin}/` : `${siteOrigin}/${file}`);
  const duplicates = sitemapUrls.filter((url, index) => sitemapUrls.indexOf(url) !== index);

  record(duplicates.length === 0, `sitemap.xml: duplicate URL(s): ${[...new Set(duplicates)].join(", ")}`);
  for (const url of expectedUrls) {
    record(sitemapUrls.includes(url), `sitemap.xml: missing indexable URL ${url}`);
  }
  for (const url of sitemapUrls) {
    record(expectedUrls.includes(url), `sitemap.xml: includes a redirect, 404, or unknown URL ${url}`);
  }
}

const cssPath = path.join(root, "site.css");
if (await exists(cssPath)) {
  const css = await readFile(cssPath, "utf8");
  const openBraces = (css.match(/{/g) || []).length;
  const closeBraces = (css.match(/}/g) || []).length;
  record(openBraces === closeBraces, `site.css: unbalanced braces (${openBraces} opening, ${closeBraces} closing)`);
  record(css.includes(":focus-visible"), "site.css: missing focus-visible treatment");
  record(css.includes("prefers-reduced-motion"), "site.css: missing reduced-motion treatment");
}

const factualChecks = [
  ["praxis-I.html", /lowest\s+self-weight|delivers[^.]*angular momentum|solves the problem of back pain/i, "contains a known BikePack overstatement"],
  ["praxis-II.html", /system works as intended|approach is robust|passed the validation requirements/i, "contains a known sorter overstatement"],
  ["CIV102Bridge.html", /left to dry for 24 hours/i, "asserts the disputed 24-hour cure time"]
];

for (const [file, pattern, message] of factualChecks) {
  const target = path.join(root, file);
  if (await exists(target)) {
    const html = await readFile(target, "utf8");
    record(!pattern.test(html), `${file}: ${message}`);
  }
}

if (warnings.length) {
  console.warn(warnings.join("\n"));
}

if (errors.length || (strict && warnings.length)) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${htmlFiles.length} HTML routes in ${root}`);
  console.log("Structure, metadata, sitemap, local targets, link safety, CSS safeguards, and factual guardrails passed.");
}
