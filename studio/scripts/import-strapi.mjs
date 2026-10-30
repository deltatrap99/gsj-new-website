// Run dry first: node scripts/import-strapi.mjs --snapshot <absolute website.json>
// Apply via: sanity exec scripts/import-strapi.mjs --with-user-token -- --snapshot <path> --apply
import {readFile, writeFile, realpath} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {getCliClient} from 'sanity/cli';
import {convertSnapshot} from './migration-model.mjs';
import {projectId, dataset, apiVersion} from '../project.js';

const args = process.argv.slice(2);
const snapshotArg = args[args.indexOf('--snapshot') + 1];
if (!args.includes('--snapshot') || !snapshotArg) throw new Error('Pass --snapshot <website.json>');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const snapshotPath = await realpath(snapshotArg);
const boundary = await realpath(path.join(root, 'artifacts/sanity-migration'));
if (!snapshotPath.startsWith(boundary + path.sep) || path.basename(snapshotPath) !== 'website.json')
  throw new Error('Use a website-only export inside artifacts/sanity-migration');
const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
const assetIds = new Map();
for (const asset of snapshot.assets) {
  if (!/^[a-zA-Z0-9_.-]+\.(webp|png|jpe?g|gif)$/i.test(asset.filename))
    throw new Error('Unexpected media filename');
  const filename = await realpath(path.join(path.dirname(snapshotPath), 'assets', asset.filename));
  if (!filename.startsWith(path.join(path.dirname(snapshotPath), 'assets') + path.sep))
    throw new Error('Asset outside migration directory');
  assetIds.set(asset.id, `image-dry-run-${asset.id}`);
}
const planned = convertSnapshot(snapshot, assetIds);
assert.equal(planned.filter((doc) => doc._type === 'page' && !doc._id.startsWith('drafts.')).length, 10);
assert.equal(planned.filter((doc) => doc._id === 'site-settings').length, 1);
console.log(`Validated: ${planned.length} draft/published documents, ${snapshot.assets.length} assets. No accounts or forms.`);
if (!args.includes('--apply')) {
  console.log('DRY RUN: no network reads/writes. Use --apply through Sanity CLI after login.');
} else {
  const client = getCliClient({apiVersion}).withConfig({useCdn: false, perspective: 'raw'});
  assert.equal(client.config().projectId, projectId);
  assert.equal(client.config().dataset, dataset);
  if (!client.config().token) throw new Error('Log in and run sanity exec --with-user-token');
  const targetDataset = (await client.datasets.list()).find((item) => item.name === dataset);
  assert.equal(targetDataset?.aclMode, 'public', 'Free-compatible public dataset required');
  for (const [index, asset] of snapshot.assets.entries()) {
    const uploaded = await client.assets.upload('image', createReadStream(
      path.join(path.dirname(snapshotPath), 'assets', asset.filename),
    ), {
      filename: asset.name || asset.filename,
      contentType: asset.mime,
      alt: asset.alternativeText || '',
    });
    assetIds.set(asset.id, uploaded._id);
    if ((index + 1) % 10 === 0 || index === snapshot.assets.length - 1)
      console.log(`Media uploaded/deduplicated: ${index + 1}/${snapshot.assets.length}`);
  }
  const documents = convertSnapshot(snapshot, assetIds);
  const existing = await client.getDocuments(documents.map((doc) => doc._id));
  const stripMetadata = (doc) => Object.fromEntries(Object.entries(doc).filter(([key]) =>
    !['_rev', '_createdAt', '_updatedAt'].includes(key),
  ));
  for (const [index, previous] of existing.entries()) {
    if (previous) assert.deepEqual(stripMetadata(previous), documents[index],
      `${previous._id}: content already exists and differs. STOP to preserve staff edits.`);
  }
  let transaction = client.transaction();
  for (const doc of documents) transaction = transaction.createIfNotExists(doc);
  await transaction.commit({visibility: 'sync'});
  const stored = await client.getDocuments(documents.map((doc) => doc._id));
  for (const [index, doc] of stored.entries()) assert.deepEqual(stripMetadata(doc), documents[index]);
  await writeFile(path.join(path.dirname(snapshotPath), 'sanity-import.ndjson'),
    documents.map((doc) => JSON.stringify(doc)).join('\n') + '\n');
  await writeFile(path.join(path.dirname(snapshotPath), 'sanity-result.json'), JSON.stringify({
    importedAt: new Date().toISOString(), projectId, dataset,
    documents: documents.map((doc) => doc._id), assets: [...assetIds.entries()],
  }, null, 2));
  console.log(`VERIFIED: ${documents.length} documents imported without overwriting existing edits; drafts remain drafts.`);
}
