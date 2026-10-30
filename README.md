# GSJ — Global Scholars Journey

A responsive website with static fallback HTML and a real Strapi 5 CMS for text, links, SEO and images. Supabase remains the backend for enquiry forms.

## Run locally

From this directory, run:

```powershell
npm install
npm run dev
```

Open http://localhost:8008/. Keep the server running while previewing. The allowlisted server supports existing extensionless links and does not expose CMS secrets or databases. Do not use `serve .` at the repository root now that backend files are present.

For content management, run `npm --prefix cms install`, then `npm run cms` in another terminal and open http://localhost:1337/admin. Read [CMS-GUIDE.md](CMS-GUIDE.md) for editing, publishing, backups, roles and deployment requirements. This is a local installation, not an online staff portal yet.

## Content and authoring

`content/site-source.json` contains the read-only snapshot of the supplied Google Sheet's `2/ Ver Eng` and `TAB Study Abroad` tabs, retrieved on 30 October 2026. This is a snapshot, not a live synchronization.

`scripts/render-site.mjs` contains the shared header, footer, page templates and content mappings. After editing the source or templates, regenerate the pages with:

```powershell
node scripts/render-site.mjs --write
```

Optional: pass one or more HTML filenames to render only those pages. Without `--write`, the renderer prints a JSON object and does not change files. Rendering updates only the static fallback, not records already edited in Strapi. `npm run cms:prepare` rebuilds the initial import snapshot; the CMS seeds missing records only on its first start and never overwrites existing staff edits.

`content/universities.json` records university image sources. `content/images.json` maps original photos to optimized WebP copies with dimensions. Original repository photos are preserved.

## Checks

```powershell
node scripts/check-site.mjs
node scripts/check-forms.mjs
node scripts/check-cms.mjs
node scripts/check-cms-integration.cjs
```

The site check verifies internal links, assets, anchors, labels and content counts. The form check mocks all network requests and covers payload mapping, duplicate prevention, success/error states, preserving input and email fallback.

## Items awaiting source/configuration

- The supplied Study Abroad sheet has unnamed `xxx` cases for UCLA, Lehigh and Purdue. These draft cases are not displayed; real student/parent stories from the English sheet are used.
- Supabase project `vrdnbwdkapxoaglulujw` finished restoring on 31 October 2026. Its existing public endpoint and publishable key in `supabase.js` were verified against all three form tables with HTTP 200 responses using zero-row reads. Form payloads and success/error handling also pass the mocked checks. The existing tables are documented in `supabase_schema.sql`. No test submissions were sent to the live database; a real insert has not yet been verified.
- On a failed form submission, entered information stays in place and the visitor can choose to open an email enquiry addressed to `info@gsj.edu.vn`.
- University ranking labels follow the supplied sheet; their systems and editions are identified on the Study Abroad page.
