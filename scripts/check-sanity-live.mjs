// Read-only end-to-end check against Sanity. No tokens, writes or form submissions.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {projectId, dataset, apiVersion} from '../studio/project.js';

const snapshotPath = process.argv[2];
if (!snapshotPath) throw new Error('Pass the exported website.json snapshot');
const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
const imported = JSON.parse(await readFile(path.join(path.dirname(snapshotPath), 'sanity-result.json'), 'utf8'));
assert.equal(imported.projectId, projectId);
assert.equal(imported.dataset, dataset);
const code = await readFile('cms-client.js', 'utf8');
const expectedFields = (doc) => (doc.sections || []).flatMap((section) => [
  ...(section.texts || []).map(({code, text}) => ({code, kind: 'text', text: text || ''})),
  ...(section.images || []).map(({code, alt, source, image}) => ({code, kind: 'image', alt: alt || '', source: source || '', imageId: image?.id})),
  ...(section.links || []).map(({code, href}) => ({code, kind: 'link', href: href || ''})),
]);
let mappings = 0;
const contentEdits = [];
const sameContent = (actual, expected, field) => {
  if (actual === expected) return;
  if (!process.argv.includes('--allow-content-edits')) assert.equal(actual, expected, field);
  contentEdits.push(field);
};
const assetIds = new Map(imported.assets);
for (const {document: expected} of snapshot.pages.filter(({status}) => status === 'published')) {
  let result, done;
  const completed = new Promise((resolve) => {done = resolve;});
  const status = new Proxy({cmsPage: expected.slug}, {set(target, key, value) {
    target[key] = value; if (key === 'cmsStatus') done(); return true;
  }});
  const document = {
    body: {dataset: status}, querySelectorAll: () => [], querySelector: () => null, dispatchEvent() {},
  };
  runInNewContext(code, {
    document, window: {document, GSJ_CMS_PROVIDER: 'sanity', GSJ_SANITY: {projectId, dataset, apiVersion}},
    URL, AbortSignal, CustomEvent: class {},
    location: {href: 'http://localhost:8008/', protocol: 'http:', hash: ''},
    fetch: async (url, options) => {
      const response = await fetch(url, {...options, headers: {Origin: 'http://localhost:8008'}});
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:8008');
      result = await response.json();
      return {ok: true, json: async () => result};
    },
  });
  await completed;
  assert.equal(status.cmsStatus, 'published', `${expected.slug}: live adapter works`);
  assert.equal(result.result.page.slug, expected.slug);
  sameContent(result.result.page.seoTitle, expected.seoTitle, `${expected.slug}.seoTitle`);
  sameContent(result.result.page.seoDescription, expected.seoDescription, `${expected.slug}.seoDescription`);
  for (const [actual, original] of [[result.result.page, expected], [result.result.settings, snapshot.settings.find(({status}) => status === 'published').document]]) {
    const fields = expectedFields(original);
    const actualSections = actual.sections;
    for (const field of fields) {
      const section = actualSections.find((item) => [...(item.texts || []), ...(item.images || []), ...(item.links || [])].some((item) => item.code === field.code));
      const actualField = section?.[{text: 'texts', image: 'images', link: 'links'}[field.kind]]?.find((item) => item.code === field.code);
      assert(actualField, `${expected.slug}: missing ${field.code}`);
      if (field.kind === 'text') sameContent(actualField.text, field.text, `${expected.slug}.${field.code}`);
      if (field.kind === 'link') sameContent(actualField.href, field.href, `${expected.slug}.${field.code}`);
      if (field.kind === 'image') {
        sameContent(actualField.alt, field.alt, `${expected.slug}.${field.code}.alt`);
        if (field.imageId) {
          const id = assetIds.get(field.imageId);
          const [, hash, dimensions, extension] = /^image-(.+)-(\d+x\d+)-([a-z]+)$/.exec(id);
          assert.equal(actualField.image.url, `https://cdn.sanity.io/images/${projectId}/${dataset}/${hash}-${dimensions}.${extension}`);
        } else assert.equal(actualField.source, field.source);
      }
      mappings++;
    }
  }
}
const queryUrl = (query, params = {}) => {
  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`);
  url.searchParams.set('query', query);
  url.searchParams.set('perspective', 'raw');
  for (const [key, value] of Object.entries(params)) url.searchParams.set('$' + key, JSON.stringify(value));
  return url;
};
const drafts = await (await fetch(queryUrl('*[_id in path("drafts.**")]'))).json();
assert.deepEqual(drafts.result, [], 'Anonymous callers cannot read drafts, even with raw perspective');
const assets = await (await fetch(queryUrl('*[_type == "sanity.imageAsset" && _id in $ids]{_id,url,sha1hash,size,metadata{dimensions{width,height}}}', {ids: [...assetIds.values()]}))).json();
for (const asset of snapshot.assets) {
  const remote = assets.result.find(({_id}) => _id === assetIds.get(asset.id));
  assert(remote, `Missing asset ${asset.id}`);
  const response = await fetch(remote.url);
  assert.equal(response.status, 200);
  assert(response.headers.get('content-type')?.startsWith('image/'));
  const original = await readFile(path.join(path.dirname(snapshotPath), 'assets', asset.filename));
  // The image delivery pipeline can re-encode bytes. The stored original's
  // cryptographic hash/size and dimensions must match the upload instead.
  assert.equal(remote.sha1hash, createHash('sha1').update(original).digest('hex'));
  assert.equal(remote.size, original.length);
  assert.equal(remote.metadata.dimensions.width, asset.width);
  assert.equal(remote.metadata.dimensions.height, asset.height);
  assert((await response.arrayBuffer()).byteLength > 0);
}
console.log(`PASS LIVE: 10 pages + global settings, ${mappings} content mappings, ${snapshot.assets.length} original asset hashes/sizes/dimensions and CDN delivery; frontend CORS; anonymous draft isolation. No writes or form submissions.`);
if (contentEdits.length) console.log(JSON.stringify({postImportContentEditsPreserved: contentEdits}));
