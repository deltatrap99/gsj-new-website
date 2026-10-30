import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {convertSnapshot} from '../studio/scripts/migration-model.mjs';
import {pages} from '../studio/project.js';

const section = {
  name: 'Hero', code: 'section1',
  texts: [{code: 'section1.t1', label: 'Heading', text: 'Published <text>'}],
  images: [{code: 'section1.i1', label: 'Photo', alt: 'Photo alt', image: {id: 6}}],
  links: [{code: 'section1.l1', label: 'CTA', href: 'contact.html'}],
};
const source = {
  pages: pages.flatMap(([slug, name]) => ['published', 'draft'].map((status) => ({
    status, document: {name, slug, sections: [{...section, texts: [{...section.texts[0], text: status}]}],
      password: 'MUST-NOT-EXPORT', createdBy: {email: 'MUST-NOT-EXPORT'}},
  }))),
  settings: ['published', 'draft'].map((status) => ({status, document: {name: 'Global', sections: []}})),
};
const docs = convertSnapshot(source, new Map([[6, 'image-photo-1600x1200-webp']]));
assert.equal(docs.length, 22);
assert.equal(docs.find((doc) => doc._id === 'page-home').sections[0].texts[0].text, 'published');
assert.equal(docs.find((doc) => doc._id === 'drafts.page-home').sections[0].texts[0].text, 'draft');
assert.equal(docs[0].sections[0].images[0].image.asset._ref, 'image-photo-1600x1200-webp');
assert(!JSON.stringify(docs).includes('MUST-NOT-EXPORT'));
assert.throws(() => convertSnapshot(source, new Map()), /Missing imported media/);
const duplicate = structuredClone(source);
duplicate.pages[0].document.sections[0].texts.push({...section.texts[0]});
assert.throws(() => convertSnapshot(duplicate, new Map([[6, 'image-test']])), /repeated content mapping/);

const code = await readFile('cms-client.js', 'utf8');
async function run({failure = false, mismatch = false} = {}) {
  let request, options, done;
  const completed = new Promise((resolve) => {done = resolve;});
  const dataset = new Proxy({cmsPage: 'home'}, {set(target, property, value) {
    target[property] = value;
    if (property === 'cmsStatus' && value === 'fallback') done();
    return true;
  }});
  const text = {replaceChildren(...children) {this.children = children;}, hasAttribute: () => false};
  const image = {src: 'images/fallback.webp', alt: '', getAttribute: () => 'images/fallback.webp', addEventListener() {}};
  const link = {setAttribute(key, value) {this[key] = value;}};
  const nodes = {'[data-cms-text="section1.t1"]': [text], '[data-cms-image="section1.i1"]': [image], '[data-cms-link="section1.l1"]': [link]};
  const document = {
    body: {dataset}, querySelectorAll: (selector) => nodes[selector] || [],
    querySelector: () => null,
    createTextNode: (value) => ({textContent: value}),
    createElement: (tag) => ({tag}), dispatchEvent: () => done(),
  };
  runInNewContext(code, {
    window: {document, GSJ_CMS_PROVIDER: 'sanity', GSJ_SANITY: {
      projectId: 'i5m9t12o', dataset: 'production', apiVersion: '2026-10-01',
    }}, document, URL, AbortSignal, CustomEvent: class {},
    location: {href: 'http://localhost:8008/', protocol: 'http:', hash: '#cms-preview=old-strapi-token'},
    fetch: async (url, init) => {
      request = url; options = init;
      if (failure) throw new Error('Offline');
      return {ok: true, json: async () => ({result: {page: {
        slug: mismatch ? 'other' : 'home', seoTitle: 'GSJ title', sections: [{
          texts: section.texts, links: section.links,
          images: [{...section.images[0], image: {url: 'https://cdn.sanity.io/images/i5m9t12o/production/photo.webp', width: 1600, height: 1200}}],
        }],
      }}})};
    },
  });
  await completed;
  return {request, options, document, text, image, link};
}
const result = await run();
assert.equal(result.document.body.dataset.cmsStatus, 'published');
assert.equal(result.request.origin, 'https://i5m9t12o.apicdn.sanity.io');
assert.equal(result.request.searchParams.get('perspective'), 'published');
assert.equal(result.request.searchParams.get('$slug'), '"home"');
assert(result.request.searchParams.get('query').includes('path("drafts.**")'));
assert(result.request.searchParams.get('query').includes('path("versions.**")'));
assert.equal(result.options.credentials, 'omit');
assert.equal(Object.keys(result.options.headers).length, 0, 'No auth token sent to public API');
assert(!result.request.href.includes('old-strapi-token'));
assert.equal(result.text.children[0].textContent, 'Published <text>');
assert.equal(result.image.src, 'https://cdn.sanity.io/images/i5m9t12o/production/photo.webp');
assert.equal(result.image.width, 1600);
assert.equal(result.link.href, 'contact.html');
assert.equal((await run({failure: true})).document.body.dataset.cmsStatus, 'fallback');
assert.equal((await run({mismatch: true})).document.body.dataset.cmsStatus, 'fallback');
console.log('PASS: Sanity migration projection, 22 draft/published documents, asset references, stable keys; tokenless published-only adapter; safe text; offline/mismatched-page fallback. Network mocked.');
