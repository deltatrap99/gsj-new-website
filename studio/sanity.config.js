import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {projectId, dataset, pages} from './project.js';
import {schemaTypes} from './schemaTypes/index.js';

export default defineConfig({
  name: 'gsj',
  title: 'GSJ Content Studio',
  projectId,
  dataset,
  plugins: [structureTool({
    structure: (S) => S.list().title('Nội dung website').items([
      S.listItem().title('Trang website').child(
        S.list().title('Chọn trang cần sửa').items(pages.map(([slug, title]) =>
          S.listItem().id(slug).title(title).child(
            S.document().schemaType('page').documentId(`page-${slug}`).title(title),
          ),
        )),
      ),
      S.listItem().title('Logo, menu & chân trang').child(
        S.document().schemaType('siteSettings').documentId('site-settings').title('Cài đặt toàn website'),
      ),
    ]),
  })],
  // Fixed website slots: staff edit existing content rather than creating unmapped pages.
  schema: {types: schemaTypes, templates: []},
  document: {
    newDocumentOptions: () => [],
    actions: (actions) => actions.filter(({action}) => !['delete', 'duplicate'].includes(action)),
    comments: {enabled: false},
  },
  tasks: {enabled: false},
  releases: {enabled: false},
  scheduledDrafts: {enabled: false},
  scheduledPublishing: {enabled: false},
});
