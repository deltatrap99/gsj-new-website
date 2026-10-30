import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { load } from "cheerio";
import { pages, preparePage } from "./cms-model.mjs";
const require = createRequire(import.meta.url);
const {
  signPreview,
  verifyPreview,
  project,
} = require("../cms/src/utils/website.js");
const seed = JSON.parse(await readFile("cms/seed/website.json", "utf8"));
assert.equal(seed.pages.length, 10);
const expectedHeadings = {
  home: {
    "section3.t2": "More than academic excellence,",
    "section5.t2": "Real journeys, In their own words.",
  },
  programs: { "section1.t2": "Many possibilities," },
  "study-abroad": { "section1.t2": "Beyond University Admissions," },
  research: {
    "section1.t2": "Your curiosity,",
    "section6.t2": "Real journeys, In their own words.",
  },
  "become-mentor": { "section1.t2": "Share your expertise," },
  "student-stories": { "section1.t2": "Real experiences," },
};
let fields = 0;
for (const [file, slug] of [...pages, ["mentors.html", "become-mentor"]]) {
  const html = await readFile(file, "utf8"),
    $ = load(html);
  assert.equal($("body").attr("data-cms-page"), slug);
  assert.equal($('script[src^="cms-client.js"]').length, 1);
  const doc = seed.pages.find((page) => page.slug === slug);
  const expected = [...doc.sections, ...seed.settings.sections].flatMap(
    (section) => section.fields,
  );
  const codes = expected.map((f) => f.code);
  assert.equal(new Set(codes).size, codes.length, `${file}: unique keys`);
  for (const [code, text] of Object.entries(expectedHeadings[slug] || {})) {
    const node = $(`[data-cms-text="${code}"]`);
    assert.equal(node.closest("h1,h2").length, 1, `${file}: heading ${code}`);
    assert.equal(
      node.text().replace(/\s+/g, " ").trim(),
      text,
      `${file}: comma between heading clauses`,
    );
    assert.equal(
      expected.find((item) => item.code === code)?.text,
      text,
      `${file}: CMS seed uses the same punctuation`,
    );
  }
  for (const item of expected) {
    const attribute = { text: "text", image: "image", link: "link" }[item.kind];
    assert.equal(
      $(`[data-cms-${attribute}="${item.code}"]`).length,
      1,
      `${file}: mapped ${item.code}`,
    );
    fields++;
  }
  assert.equal(
    $(".material-symbols-outlined[data-cms-text]").length,
    0,
    "icons are never editable text",
  );
  const repeated = preparePage(html, slug);
  assert.deepEqual(
    repeated.sections.map((s) => s.fields.map((f) => f.code)),
    doc.sections.map((s) => s.fields.map((f) => f.code)),
    `${file}: tagging is repeatable`,
  );
}
const secret = "unit-test-only-not-a-real-secret";
const payload = {
  uid: "api::page.page",
  documentId: "test-document",
  slug: "home",
  status: "draft",
};
const token = signPreview(payload, secret);
assert.equal(verifyPreview(token, secret).documentId, "test-document");
assert.equal(verifyPreview(token, secret + "wrong"), null);
assert.equal(verifyPreview(token + "changed", secret), null);
assert.equal(verifyPreview("invalid", secret), null);
const output = project({
  password: "never expose",
  createdBy: { email: "private" },
  sections: [
    {
      texts: [
        { code: "a", text: "<script>alert(1)</script>", private: "omit" },
      ],
      images: [{
        code: "b",
        image: {
          url: "/uploads/test.webp",
          updatedAt: "2026-10-30T18:05:46.658Z",
          private: "omit",
        },
      }],
    },
  ],
});
assert(!JSON.stringify(output).includes("never expose"));
assert(!JSON.stringify(output).includes("private"));
assert.equal(output.fields.find((field) => field.kind === "image").image.updatedAt, "2026-10-30T18:05:46.658Z");
assert.equal(
  output.fields[0].text,
  "<script>alert(1)</script>",
  "CMS text is data, not HTML",
);
console.log(
  `PASS: ${fields} page/global field mappings across 11 routes; stable keys; icons protected; preview signatures; explicit public data projection.`,
);
