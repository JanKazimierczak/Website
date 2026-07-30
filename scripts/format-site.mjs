import { readFile, writeFile } from "node:fs/promises";

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
  "package.json",
  "robots.txt",
  "content/placeholders.md",
  "scripts/build.mjs",
  "scripts/format-site.mjs",
  "scripts/validate-site.mjs"
];

for (const file of files) {
  const source = await readFile(file, "utf8");
  const formatted = `${source
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[\t ]+$/g, ""))
    .join("\n")
    .trimEnd()}\n`;

  if (formatted !== source) {
    await writeFile(file, formatted);
  }
}

console.log(`Formatted ${files.length} source files.`);
