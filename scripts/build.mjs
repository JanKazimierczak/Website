import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("dist");

const files = [
  "index.html",
  "projects.html",
  "about.html",
  "contact.html",
  "design.html",
  "praxis-I.html",
  "praxis-II.html",
  "CIV102Bridge.html",
  "rocket-project.html",
  "bridge-project.html",
  "control-project.html",
  "arch-project.html",
  "praxis-project.html",
  "site.css",
  "site.js",
  "jk-favicon.svg",
  "Picture.jpeg",
  "Praxis-1-basket.png",
  "Praxispositionstatementflowchart.png",
  "robots.txt"
];

const directories = [
  "assets",
  "bikepack-assets",
  "civ102-assets",
  "praxis2-assets"
];

const artifacts = [
  "reports/bikepack-buddy-report.pdf",
  "reports/civ102-design-report.pdf",
  "reports/praxis-ii-rfp-e.pdf",
  "One-pagers/praxis-ii-screw-sorting-one-pager.pdf"
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of files) {
  const destination = path.join(output, file);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(file, destination);
}

for (const directory of directories) {
  await cp(directory, path.join(output, directory), { recursive: true });
}

for (const artifact of artifacts) {
  const destination = path.join(output, artifact);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(artifact, destination);
}

const siteUrl = process.env.SITE_URL?.replace(/\/$/, "");
if (siteUrl) {
  const sitemapPages = [
    "",
    "projects.html",
    "about.html",
    "contact.html",
    "design.html",
    "praxis-I.html",
    "praxis-II.html",
    "CIV102Bridge.html"
  ];
  const urls = sitemapPages
    .map((page) => `  <url><loc>${siteUrl}/${page}</loc></url>`)
    .join("\n");
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  await writeFile(path.join(output, "sitemap.xml"), sitemap);

  const robotsPath = path.join(output, "robots.txt");
  const robots = await readFile(robotsPath, "utf8");
  await writeFile(robotsPath, `${robots.trimEnd()}\nSitemap: ${siteUrl}/sitemap.xml\n`);
}

console.log(`Production build created at ${output}`);
console.log(siteUrl ? `Sitemap generated for ${siteUrl}` : "Sitemap skipped: set SITE_URL to a verified production origin.");
