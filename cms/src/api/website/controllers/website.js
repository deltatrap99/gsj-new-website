"use strict";
const { populate, project, verifyPreview } = require("../../../utils/website");
const seed = require("../../../../seed/website.json");
const slugs = new Set(seed.pages.map((page) => page.slug));

module.exports = {
  async find(ctx) {
    const { slug } = ctx.params;
    if (!slugs.has(slug)) return ctx.notFound();
    // Never accept status/populate/filter overrides from a public request.
    const [page, settings] = await Promise.all([
      strapi
        .documents("api::page.page")
        .findFirst({ filters: { slug }, status: "published", populate }),
      strapi
        .documents("api::site-setting.site-setting")
        .findFirst({ status: "published", populate }),
    ]);
    if (!page) return ctx.notFound();
    ctx.set("Cache-Control", "no-store");
    ctx.body = { data: { page: project(page), settings: project(settings) } };
  },
  async preview(ctx) {
    const token = ctx.get("Authorization").replace(/^Bearer\s+/i, "");
    const payload = verifyPreview(
      token,
      strapi.config.get("admin.auth.secret"),
    );
    ctx.set("Cache-Control", "no-store");
    if (!payload || !slugs.has(payload.slug))
      return ctx.unauthorized(
        "Preview link is invalid or expired. Reopen Preview in Strapi.",
      );
    const [page, settings] = await Promise.all([
      strapi
        .documents("api::page.page")
        .findFirst({
          filters: { slug: payload.slug },
          status:
            payload.uid === "api::page.page" ? payload.status : "published",
          populate,
        }),
      strapi
        .documents("api::site-setting.site-setting")
        .findFirst({
          status:
            payload.uid === "api::site-setting.site-setting"
              ? payload.status
              : "published",
          populate,
        }),
    ]);
    const selected = payload.uid === "api::page.page" ? page : settings;
    if (!selected || selected.documentId !== payload.documentId)
      return ctx.notFound();
    ctx.body = {
      data: { preview: true, page: project(page), settings: project(settings) },
    };
  },
};
