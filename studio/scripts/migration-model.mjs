import {pages} from '../project.js';

const allowedSlugs = new Set(pages.map(([slug]) => slug));
const key = (code) => code.replaceAll('.', '-');
const cleanString = (value) => typeof value === 'string' ? value : '';

export function convertDocument(document, status, assetIds, settings = false) {
  if (!['draft', 'published'].includes(status)) throw new Error('Unknown publication status');
  if (!settings && !allowedSlugs.has(document.slug)) throw new Error('Unknown website page');
  const id = settings ? 'site-settings' : `page-${document.slug}`;
  const allCodes = new Set();
  const checkCode = (code) => {
    if (typeof code !== 'string' || !/^[a-zA-Z0-9.]+$/.test(code) || allCodes.has(code))
      throw new Error(`Invalid or repeated content mapping: ${code}`);
    allCodes.add(code);
    return {_key: key(code), code};
  };
  return {
    _id: status === 'draft' ? `drafts.${id}` : id,
    _type: settings ? 'siteSettings' : 'page',
    name: cleanString(document.name),
    ...(!settings ? {
      slug: document.slug,
      seoTitle: cleanString(document.seoTitle),
      seoDescription: cleanString(document.seoDescription),
    } : {}),
    sections: (document.sections || []).map((section) => ({
      ...checkCode(section.code), _type: 'contentSection', name: cleanString(section.name),
      texts: (section.texts || []).map((field) => ({
        ...checkCode(field.code), _type: 'contentText', label: cleanString(field.label), text: cleanString(field.text),
      })),
      images: (section.images || []).map((field) => {
        const ref = field.image ? assetIds.get(field.image.id) : null;
        if (field.image && !ref) throw new Error(`Missing imported media ${field.image.id}`);
        return {
          ...checkCode(field.code), _type: 'contentImage', label: cleanString(field.label),
          alt: cleanString(field.alt), source: cleanString(field.source),
          ...(ref ? {image: {_type: 'image', asset: {_type: 'reference', _ref: ref}}} : {}),
        };
      }),
      links: (section.links || []).map((field) => ({
        ...checkCode(field.code), _type: 'contentLink', label: cleanString(field.label), href: cleanString(field.href),
      })),
    })),
  };
}

export function convertSnapshot(snapshot, assetIds) {
  const documents = [
    ...snapshot.pages.map(({document, status}) => convertDocument(document, status, assetIds)),
    ...snapshot.settings.map(({document, status}) => convertDocument(document, status, assetIds, true)),
  ];
  if (new Set(documents.map((doc) => doc._id)).size !== documents.length)
    throw new Error('Duplicate Sanity document IDs');
  return documents;
}
