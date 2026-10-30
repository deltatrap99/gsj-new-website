// Isolated test documents only. Does not edit any page/settings used by the website.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {getCliClient} from 'sanity/cli';
import {createClient} from '@sanity/client';
import {projectId, dataset, apiVersion} from '../project.js';

const client = getCliClient({apiVersion}).withConfig({useCdn: false, perspective: 'raw'});
assert.equal(client.config().projectId, projectId);
assert.equal(client.config().dataset, dataset);
const anonymous = createClient({projectId, dataset, apiVersion, useCdn: false, perspective: 'raw'});
const id = `gsj-cms-verification-${randomUUID()}`;
const draftId = `drafts.${id}`;
const read = () => anonymous.fetch('*[_id == $id][0]{value}', {id});
try {
  await client.create({_id: draftId, _type: 'cmsVerification', value: 'Published baseline'});
  assert.equal(await read(), null);
  assert.equal(await anonymous.fetch('*[_id == $draftId][0]', {draftId}), null);
  await client.action({actionType: 'sanity.action.document.publish', publishedId: id, draftId});
  assert.equal((await read()).value, 'Published baseline');
  await client.create({_id: draftId, _type: 'cmsVerification', value: 'Draft edit'});
  assert.equal((await read()).value, 'Published baseline');
  await client.action({actionType: 'sanity.action.document.publish', publishedId: id, draftId});
  assert.equal((await read()).value, 'Draft edit');
  await assert.rejects(anonymous.patch(id).set({value: 'Unauthorized'}).commit());
  assert.equal((await read()).value, 'Draft edit');
  await client.action({actionType: 'sanity.action.document.unpublish', publishedId: id, draftId});
  assert.equal(await read(), null);
  assert.equal((await client.getDocument(draftId)).value, 'Draft edit');
  console.log('PASS LIVE: draft isolation, native publish/update/unpublish, anonymous writes denied. Only isolated test documents used.');
} finally {
  // Exact UUID-scoped targets created above; never delete website content or assets.
  await client.transaction().delete(id).delete(draftId).commit({visibility: 'sync'});
  assert.deepEqual(await client.getDocuments([id, draftId]), [null, null]);
  console.log('Isolated test documents removed; website pages/settings untouched.');
}
