"use strict";
const { createHmac, timingSafeEqual } = require("node:crypto");

const populate = {
  sections: {
    populate: {
      texts: true,
      images: { populate: { image: true } },
      links: true,
    },
  },
};

function signPreview(payload, secret) {
  const data = Buffer.from(
    JSON.stringify({ ...payload, expires: Date.now() + 10 * 60 * 1000 }),
  ).toString("base64url");
  return (
    data +
    "." +
    createHmac("sha256", secret)
      .update("gsj-preview-v1:" + data)
      .digest("base64url")
  );
}
function verifyPreview(token, secret) {
  try {
    if (typeof token !== "string" || token.length > 2000) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expected = createHmac("sha256", secret)
      .update("gsj-preview-v1:" + data)
      .digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (!Number.isFinite(payload.expires) || payload.expires < Date.now())
      return null;
    if (
      !["api::page.page", "api::site-setting.site-setting"].includes(
        payload.uid,
      )
    )
      return null;
    if (
      typeof payload.documentId !== "string" ||
      typeof payload.slug !== "string"
    )
      return null;
    if (!["draft", "published"].includes(payload.status)) return null;
    return payload;
  } catch {
    return null;
  }
}
// Explicit output projection: never expose admin relations or internal auth fields.
function project(document) {
  if (!document) return null;
  return {
    slug: document.slug,
    seoTitle: document.seoTitle,
    seoDescription: document.seoDescription,
    fields: (document.sections || []).flatMap((section) => [
      ...(section.texts || []).map((item) => ({
        code: item.code,
        kind: "text",
        text: item.text ?? "",
      })),
      ...(section.images || []).map((item) => ({
        code: item.code,
        kind: "image",
        alt: item.alt ?? "",
        source: item.source,
        image: item.image
          ? {
              url: item.image.url,
              width: item.image.width,
              height: item.image.height,
              alternativeText: item.image.alternativeText,
              updatedAt: item.image.updatedAt,
            }
          : null,
      })),
      ...(section.links || []).map((item) => ({
        code: item.code,
        kind: "link",
        href: item.href ?? "",
      })),
    ]),
  };
}
module.exports = { populate, project, signPreview, verifyPreview };
