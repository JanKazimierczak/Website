import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Every hand-edited source file, discovered rather than listed, so a new route
// cannot silently drop out of formatting.
const roots = [".", "scripts", "content"];
const extensions = new Set([".html", ".css", ".js", ".mjs", ".json", ".md", ".txt", ".xml", ".webmanifest"]);
const skipDirectories = new Set(["dist", "tmp", "output", "node_modules", ".git"]);

const files = [];
for (const root of roots) {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    continue;
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (skipDirectories.has(entry.name)) continue;
    if (!extensions.has(path.extname(entry.name))) continue;
    if (entry.name.endsWith(".py")) continue;
    files.push(root === "." ? entry.name : path.join(root, entry.name));
  }
}

let changed = 0;
for (const file of files.sort()) {
  const source = await readFile(file, "utf8");
  const formatted = `${source
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[\t ]+$/g, ""))
    .join("\n")
    .trimEnd()}\n`;

  if (formatted !== source) {
    await writeFile(file, formatted);
    changed += 1;
  }
}

console.log(`Formatted ${files.length} source files (${changed} rewritten).`);
