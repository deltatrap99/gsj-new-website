import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const code = await readFile("cms-client.js", "utf8");
const originalSrc = "images/research-experience.webp";

async function imageSource(image, source = originalSrc) {
  let finish;
  const done = new Promise((resolve) => { finish = resolve; });
  const node = {
    src: originalSrc,
    alt: "Research",
    getAttribute: () => originalSrc,
    addEventListener() {},
  };
  const document = {
    body: { dataset: { cmsPage: "home" } },
    querySelectorAll: (selector) => selector === '[data-cms-image="section2.i2"]' ? [node] : [],
    dispatchEvent: () => finish(),
  };
  runInNewContext(code, {
    window: { GSJ_CMS_URL: "http://localhost:1337", document },
    document,
    location: { href: "http://localhost:8008/index.html", protocol: "http:", hash: "" },
    URL,
    AbortSignal,
    CustomEvent: class {},
    fetch: async () => ({
      ok: true,
      json: async () => ({
        data: {
          page: {
            slug: "home",
            fields: [{ code: "section2.i2", kind: "image", source, image }],
          },
        },
      }),
    }),
  });
  await done;
  assert.equal(document.body.dataset.cmsStatus, "published");
  return node.src;
}

const oldVersion = "2026-10-30T18:00:00.000Z";
const newVersion = "2026-10-30T18:05:46.658Z";
const oldSrc = await imageSource({ url: "/uploads/research.webp", updatedAt: oldVersion });
const newSrc = await imageSource({ url: "/uploads/research.webp", updatedAt: newVersion });
assert.notEqual(newSrc, oldSrc, "replacing an image invalidates its cached URL");
assert.equal(new URL(newSrc).searchParams.get("v"), String(Date.parse(newVersion)));
assert.equal(new URL(newSrc).origin, "http://localhost:1337");
const existingQuery = await imageSource({ url: "/uploads/research.webp?download=1", updatedAt: newVersion });
assert.equal(new URL(existingQuery).searchParams.get("download"), "1");
const external = "https://cdn.example.test/research.webp?signature=test-only";
assert.equal(await imageSource({ url: external, updatedAt: newVersion }), external, "external signed URLs stay intact");
assert.equal(await imageSource({ url: "/uploads/research.webp" }), "http://localhost:1337/uploads/research.webp");
assert.equal(await imageSource({ url: "/uploads/research.webp", updatedAt: "invalid" }), "http://localhost:1337/uploads/research.webp");
assert.equal(await imageSource(null), originalSrc, "static fallback remains on the website origin");
assert.equal(await imageSource({ url: "javascript:alert(1)", updatedAt: newVersion }), originalSrc, "unsafe image URLs are rejected");
console.log("PASS: CMS media cache versions; replacement invalidation; existing queries; signed external URLs; static fallback; unsafe URL rejection. All network calls mocked.");
