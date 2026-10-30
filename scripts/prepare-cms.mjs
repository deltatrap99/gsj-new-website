// Mechanical tagging + seed generation. Does not overwrite content already edited in Strapi.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { pages, preparePage } from "./cms-model.mjs";

const documents = [];
let globalSections;
for (const [file, slug, name] of pages) {
  const result = preparePage(await readFile(file, "utf8"), slug);
  await writeFile(file, result.html);
  if (slug === "home") globalSections = result.globalSections;
  documents.push({
    name,
    slug,
    seoTitle: result.seoTitle,
    seoDescription: result.seoDescription,
    sections: result.sections,
  });
}
const alias = preparePage(
  await readFile("mentors.html", "utf8"),
  "become-mentor",
);
await writeFile("mentors.html", alias.html);
await mkdir("cms/seed", { recursive: true });
await writeFile(
  "cms/seed/website.json",
  JSON.stringify(
    {
      version: 1,
      pages: documents,
      settings: { name: "Header, sidebar & footer", sections: globalSections },
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Prepared ${documents.length} CMS pages + mentor alias and global settings. Existing CMS records are never reseeded automatically.`,
);
