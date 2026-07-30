import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const rootArg = args.find((arg) => !arg.startsWith("--")) || ".";
const root = path.resolve(rootArg);

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

for (const file of htmlFiles) {
  const absolute = path.join(root, file);
  const html = await readFile(absolute, "utf8");
  const isRedirect = html.includes("http-equiv=\"refresh\"");
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
    const target = path.resolve(path.dirname(absolute), cleanReference);
    record(await exists(target), `${label}: missing local target ${reference}`);
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
  console.log("Local targets, document structure, link safety, CSS safeguards, and factual guardrails passed.");
}
