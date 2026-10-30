// Export website content ONLY. Never export admin users, auth tables or form submissions.
const fs = require('node:fs/promises');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'artifacts', 'sanity-migration', `export-${randomUUID()}`);
const {populate} = require('../cms/src/utils/website');

const media = (file) => file && ({
  id: file.id, name: file.name, alternativeText: file.alternativeText,
  mime: file.mime, url: file.url, width: file.width, height: file.height,
});
const content = (doc) => ({
  name: doc.name, slug: doc.slug, seoTitle: doc.seoTitle, seoDescription: doc.seoDescription,
  sections: (doc.sections || []).map((section) => ({
    name: section.name, code: section.code,
    texts: (section.texts || []).map(({label, code, text}) => ({label, code, text})),
    images: (section.images || []).map(({label, code, alt, source, image}) => ({label, code, alt, source, image: media(image)})),
    links: (section.links || []).map(({label, code, href}) => ({label, code, href})),
  })),
});
(async () => {
  process.chdir(path.join(root, 'cms'));
  process.env.STRAPI_TELEMETRY_DISABLED = 'true';
  const {createStrapi} = require('../cms/node_modules/@strapi/strapi');
  const app = createStrapi({appDir: path.join(root, 'cms'), distDir: path.join(root, 'cms')});
  try {
    await app.load();
    const snapshot = {exportedAt: new Date().toISOString(), pages: [], settings: [], assets: []};
    for (const status of ['published', 'draft']) {
      for (const doc of await app.documents('api::page.page').findMany({status, populate}))
        snapshot.pages.push({status, document: content(doc)});
      const doc = await app.documents('api::site-setting.site-setting').findFirst({status, populate});
      if (doc) snapshot.settings.push({status, document: content(doc)});
    }
    const files = await app.db.query('plugin::upload.file').findMany();
    await fs.mkdir(path.join(output, 'assets'), {recursive: true});
    for (const file of files) {
      if (!/^\/uploads\/[a-zA-Z0-9_.-]+$/.test(file.url)) throw new Error('Unexpected upload path');
      const filename = path.basename(file.url);
      await fs.copyFile(path.join(root, 'cms', 'public', 'uploads', filename), path.join(output, 'assets', filename));
      snapshot.assets.push({...media(file), filename});
    }
    await fs.writeFile(path.join(output, 'website.json'), JSON.stringify(snapshot, null, 2));
    console.log(JSON.stringify({snapshot: path.join(output, 'website.json'), pages: snapshot.pages.length, settings: snapshot.settings.length, assets: snapshot.assets.length}));
  } finally { await app.destroy(); }
})().catch((error) => {console.error(error.message); process.exitCode = 1;});
