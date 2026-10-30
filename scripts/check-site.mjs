import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { resolve } from "node:path";

const pages = (await readdir(".")).filter((name) => name.endsWith(".html"));
const contents = Object.fromEntries(
  await Promise.all(
    pages.map(async (name) => [name, await readFile(name, "utf8")]),
  ),
);
const ids = Object.fromEntries(
  pages.map((name) => [
    name,
    new Set([...contents[name].matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])),
  ]),
);
let links = 0;
let images = 0;
for (const [page, html] of Object.entries(contents)) {
  assert.equal(
    (html.match(/<h1[ >]/g) || []).length,
    1,
    `${page}: exactly one h1`,
  );
  assert.equal(
    (html.match(/<main[ >]/g) || []).length,
    1,
    `${page}: main landmark`,
  );
  assert(
    !/\bxxx\b|=> đổi|Coming soon|cskh@gsj|Global Science Journey/.test(html),
    `${page}: stale or draft copy`,
  );
  assert.equal(
    (html.match(/id="site-menu"/g) || []).length,
    1,
    `${page}: one sidebar`,
  );
  const allIds = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(allIds).size, allIds.length, `${page}: unique ids`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = match[1].replaceAll("&amp;", "&");
    if (/^(https?:|mailto:|tel:|data:)/.test(target)) continue;
    const [pathname, hash] = target.split("#");
    const file = pathname.split("?")[0] || page;
    await access(resolve(decodeURIComponent(file)));
    if (hash)
      assert(
        ids[file]?.has(decodeURIComponent(hash)),
        `${page}: missing anchor ${target}`,
      );
    links++;
  }
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    assert(/\balt="[^"]+"/.test(match[0]), `${page}: image has meaningful alt`);
    images++;
  }
  for (const match of html.matchAll(
    /<(?:input|select|textarea)\b[^>]*\bid="([^"]+)"/g,
  )) {
    assert(
      html.includes(`for="${match[1]}"`),
      `${page}: input label ${match[1]}`,
    );
  }
}
assert.equal(
  (contents["study-abroad.html"].match(/class="journey-stage"/g) || []).length,
  6,
);
assert.equal(
  (contents["study-abroad.html"].match(/class="university-logo"/g) || [])
    .length,
  30,
);
assert.equal(
  (contents["services.html"].match(/class="program-detail"/g) || []).length,
  9,
);
assert.equal(
  (
    contents["student-stories.html"].match(/class="story-card full-story"/g) ||
    []
  ).length,
  11,
);
assert.equal(
  (contents["questions.html"].match(/class="faq-number"/g) || []).length,
  10,
);
for (const html of Object.values(contents))
  assert.equal((html.match(/class="footer-offices"/g) || []).length, 1);
console.log(
  `PASS: ${pages.length} pages; ${links} local links/assets; ${images} images; 6 journey stages; 30 destinations; 9 programs; 11 stories; 10 FAQs.`,
);
