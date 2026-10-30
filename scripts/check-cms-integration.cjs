// Exercise real Strapi draft/publish/media storage in a DISPOSABLE database.
// Never logs in as staff, writes to the user's CMS, or sends a Supabase form.
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs/promises");
const { randomUUID } = require("node:crypto");
const root = path.resolve(__dirname, "..");
const task = `run-${randomUUID()}`;
const testRoot = path.join(root, "artifacts", "cms-tests", task);

(async () => {
  await fs.mkdir(path.join(testRoot, "public", "uploads"), { recursive: true });
  process.chdir(path.join(root, "cms"));
  Object.assign(process.env, {
    DATABASE_CLIENT: "sqlite",
    DATABASE_FILENAME: `../artifacts/cms-tests/${task}/data.db`,
    CMS_UPLOAD_DIR: path.join(testRoot, "public"),
    PORT: "1347",
    HOST: "127.0.0.1",
    CMS_PUBLIC_URL: "http://localhost:1347",
    STRAPI_TELEMETRY_DISABLED: "true",
    GSJ_CMS_TEST_MODE: "isolated",
  });
  const { createStrapi } = require("../cms/node_modules/@strapi/strapi");
  const { signPreview } = require("../cms/src/utils/website");
  const app = createStrapi({
    appDir: path.join(root, "cms"),
    distDir: path.join(root, "cms"),
  });
  try {
    await app.start();
    const imagePath = path.join(
      root,
      "images",
      "optimized",
      "gsj_logo_new.webp",
    );
    const [image] = await app
      .plugin("upload")
      .service("upload")
      .upload({
        data: {
          fileInfo: {
            name: "GSJ integration test",
            alternativeText: "Published image",
          },
        },
        files: {
          filepath: imagePath,
          originalFilename: "test.webp",
          mimetype: "image/webp",
          size: (await fs.stat(imagePath)).size,
        },
      });
    const sections = (text, alt) => [
      {
        name: "Test section",
        code: "section1",
        texts: [{ label: "Heading", code: "section1.t1", text }],
        images: [
          { label: "Test image", code: "section1.i1", image: image.id, alt },
        ],
        links: [],
      },
    ];
    const entry = await app
      .documents("api::page.page")
      .create({
        data: {
          name: "ISOLATED TEST ONLY",
          slug: "home",
          seoTitle: "CMS test",
          sections: sections("Published baseline", "Published image"),
        },
        status: "published",
      });
    const get = async (url, options) => {
      const r = await fetch("http://localhost:1347" + url, options);
      return { status: r.status, body: await r.json() };
    };
    let result = await get("/api/website/home");
    assert.equal(result.status, 200);
    assert.equal(result.body.data.page.fields[0].text, "Published baseline");
    await app
      .documents("api::page.page")
      .update({
        documentId: entry.documentId,
        data: { sections: sections("Draft change", "Draft image") },
      });
    result = await get("/api/website/home?status=draft");
    assert.equal(
      result.body.data.page.fields[0].text,
      "Published baseline",
      "public endpoint must ignore attempts to read drafts",
    );
    assert.equal((await get("/api/website/preview")).status, 401);
    assert.equal((await get("/api/pages?status=draft")).status, 403);
    const token = signPreview(
      {
        uid: "api::page.page",
        documentId: entry.documentId,
        slug: "home",
        status: "draft",
      },
      app.config.get("admin.auth.secret"),
    );
    result = await get("/api/website/preview", {
      headers: { Authorization: "Bearer " + token },
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.data.page.fields[0].text, "Draft change");
    assert.equal(
      result.body.data.page.fields.find((f) => f.kind === "image").alt,
      "Draft image",
    );
    assert.equal(
      (
        await get("/api/website/preview", {
          headers: { Authorization: "Bearer " + token + "tampered" },
        })
      ).status,
      401,
    );
    await app
      .documents("api::page.page")
      .publish({ documentId: entry.documentId });
    result = await get("/api/website/home");
    assert.equal(result.body.data.page.fields[0].text, "Draft change");
    const media = result.body.data.page.fields.find(
      (f) => f.kind === "image",
    ).image;
    const mediaResponse = await fetch("http://localhost:1347" + media.url);
    assert.equal(mediaResponse.status, 200);
    assert.match(mediaResponse.headers.get("content-type"), /^image\//);
    for (const [url, method] of [
      ["/api/pages", "POST"],
      ["/api/upload", "POST"],
      ["/api/pages/" + entry.documentId, "PUT"],
    ]) {
      const response = await get(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      assert.equal(response.status, 403, "anonymous write/upload denied");
    }
    await app
      .documents("api::page.page")
      .unpublish({ documentId: entry.documentId });
    assert.equal((await get("/api/website/home")).status, 404);
    const report = {
      passed: true,
      checks: [
        "real draft save",
        "public draft isolation",
        "signed preview",
        "tampered preview rejected",
        "real publish",
        "media upload and delivery",
        "anonymous writes blocked",
        "unpublished content hidden",
      ],
      isolatedDatabase: true,
      liveCmsUntouched: true,
    };
    await fs.writeFile(
      path.join(testRoot, "result.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(
      "PASS: " +
        report.checks.join("; ") +
        ". User CMS and Supabase data untouched.",
    );
  } finally {
    await app.destroy();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
