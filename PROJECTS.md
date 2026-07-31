# Adding a portfolio project

The Coursework and Personal pages use the same responsive card system. Cards do
not have sequence numbers, and the Projects hub uses evergreen category labels,
so adding or reordering a project does not require updating totals.

## 1. Add the collection card

- Coursework: duplicate one complete `.project-card` article in
  `class-projects.html`.
- Personal work: duplicate the `.project-card` article in
  `individual-projects.html`.
- Update the image, context chip, title, summary, evidence, case-study link, and
  optional report link inside the duplicated article.

The grid automatically changes from three columns to two and then one as the
viewport narrows. A single Personal card receives a wider featured layout; that
special layout switches off automatically when another card is added.

## 2. Add the detailed case study

Copy the detail page whose evidence structure is closest to the new work, then
replace its metadata, canonical URL, social image, content, and local links.
Keep project images under `assets/<project-slug>/` and reports under `reports/`.

## 3. Include the new route

Add the case-study HTML filename to:

- `files` and `sitemapPages` in `scripts/build.mjs`
- `indexablePages` in `scripts/validate-site.mjs`
- `sitemap.xml`

If the project introduces a required report or preview asset, add it to
`requiredFiles` in `scripts/validate-site.mjs` and to `artifacts` in
`scripts/build.mjs`.

## 4. Validate locally

Run:

```sh
npm test
SITE_URL=https://jan.kazimierczak.eu npm run build
npm run test:production
```

Then review `projects.html`, the relevant collection page, and the new case
study at desktop and mobile widths before publishing.
