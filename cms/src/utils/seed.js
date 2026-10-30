"use strict";
const fs = require("node:fs/promises");
const path = require("node:path");
const seed = require("../../seed/website.json");
const root = path.resolve(__dirname, "../../..");

async function importImage(strapi, item) {
  const mime = {
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
  }[path.extname(item.source || "").toLowerCase()];
  // Retain trusted existing SVG logos as static assets. New uploads use Strapi's safe defaults.
  if (!mime) return null;
  const filepath = path.resolve(root, item.source);
  if (!filepath.startsWith(path.join(root, "images") + path.sep))
    throw new Error("Seed image outside images directory");
  const caption = `GSJ source: ${item.source}`;
  const previous = await strapi.db
    .query("plugin::upload.file")
    .findOne({ where: { caption } });
  if (previous) return previous.id;
  const stat = await fs.stat(filepath);
  const [uploaded] = await strapi
    .plugin("upload")
    .service("upload")
    .upload({
      data: {
        fileInfo: {
          name: path.basename(filepath),
          alternativeText: item.alt,
          caption,
        },
      },
      files: {
        filepath,
        originalFilename: path.basename(filepath),
        mimetype: mime,
        size: stat.size,
      },
    });
  return uploaded.id;
}
async function convertSections(strapi, sections) {
  const result = [];
  for (const section of sections) {
    const entry = {
      name: section.name,
      code: section.code,
      texts: [],
      images: [],
      links: [],
    };
    for (const item of section.fields) {
      const { code, label } = item;
      if (item.kind === "text")
        entry.texts.push({ code, label, text: item.text });
      if (item.kind === "link")
        entry.links.push({ code, label, href: item.href });
      if (item.kind === "image")
        entry.images.push({
          code,
          label,
          source: item.source,
          alt: item.alt,
          image: await importImage(strapi, item),
        });
    }
    result.push(entry);
  }
  return result;
}

async function configureEditor(strapi) {
  const store = strapi.store({
    type: "core",
    name: "gsj-cms",
    key: "editor-layout-v1",
  });
  if (await store.get()) return;
  const cm = strapi.plugin("content-manager");
  const models = [
    [
      "components",
      "content.text",
      "label",
      { label: "Nhãn nội dung", text: "Nội dung hiển thị" },
      ["code"],
    ],
    [
      "components",
      "content.image",
      "label",
      { label: "Tên ảnh", image: "Chọn / thay ảnh", alt: "Mô tả ảnh (alt)" },
      ["code", "source"],
    ],
    [
      "components",
      "content.link",
      "label",
      { label: "Tên liên kết", href: "Địa chỉ liên kết" },
      ["code"],
    ],
    [
      "components",
      "content.section",
      "name",
      {
        name: "Tên phần",
        texts: "Nội dung chữ",
        images: "Hình ảnh",
        links: "Đường dẫn",
      },
      ["code"],
    ],
    [
      "content-types",
      "api::page.page",
      "name",
      {
        name: "Tên trang",
        seoTitle: "Tiêu đề SEO",
        seoDescription: "Mô tả SEO",
        sections: "Các phần trên trang",
      },
      ["slug"],
    ],
    [
      "content-types",
      "api::site-setting.site-setting",
      "name",
      { name: "Tên cấu hình", sections: "Các phần dùng chung" },
      [],
    ],
  ];
  for (const [serviceName, uid, mainField, labels, hidden] of models) {
    const service = cm.service(serviceName);
    const model =
      serviceName === "components"
        ? service.findComponent(uid)
        : service.findContentType(uid);
    const config = await service.findConfiguration(model);
    for (const [name, label] of Object.entries(labels)) {
      if (config.metadatas[name]) config.metadatas[name].edit.label = label;
    }
    for (const name of hidden)
      config.metadatas[name].edit = {
        ...config.metadatas[name].edit,
        visible: false,
        editable: false,
      };
    config.layouts.edit = config.layouts.edit
      .map((row) => row.filter((item) => !hidden.includes(item.name)))
      .filter((row) => row.length);
    config.settings.mainField = mainField;
    if (serviceName === "content-types")
      config.layouts.list = ["name", "updatedAt"];
    await service.updateConfiguration(model, config);
  }
  await store.set({ value: true });
}

module.exports = async function seedWebsite(strapi) {
  await configureEditor(strapi);
  const store = strapi.store({ type: "core", name: "gsj-cms", key: "seed-v1" });
  if (await store.get()) return;
  strapi.log.info(
    "GSJ: importing current website content and images (first start only)…",
  );
  for (const page of seed.pages) {
    const existing = await strapi
      .documents("api::page.page")
      .findFirst({ filters: { slug: page.slug } });
    if (existing) continue; // Never overwrite staff edits, including after an interrupted seed.
    const { sections, ...data } = page;
    await strapi
      .documents("api::page.page")
      .create({
        data: { ...data, sections: await convertSections(strapi, sections) },
        status: "published",
      });
    strapi.log.info(`GSJ: ready — ${page.name}`);
  }
  const settings = await strapi
    .documents("api::site-setting.site-setting")
    .findFirst();
  if (!settings)
    await strapi
      .documents("api::site-setting.site-setting")
      .create({
        data: {
          name: seed.settings.name,
          sections: await convertSections(strapi, seed.settings.sections),
        },
        status: "published",
      });
  await store.set({
    value: { version: seed.version, completedAt: new Date().toISOString() },
  });
  strapi.log.info(
    "GSJ: CMS content ready. Public access is read-only and published-only.",
  );
};
