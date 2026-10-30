import {defineType, defineField, defineArrayMember} from 'sanity';

const mappingCode = () => defineField({name: 'code', type: 'string', hidden: true, readOnly: true});
const label = () => defineField({name: 'label', title: 'Nhãn nhận diện', type: 'string', readOnly: true});
const slots = (name, title, type, group) => defineField({
  name, title, type: 'array', ...(group ? {group} : {}),
  of: [defineArrayMember({type})],
  options: {sortable: false, disableActions: ['add', 'remove', 'duplicate', 'copy']},
  description: 'Chọn mục có sẵn để sửa. Mã và bố cục được giữ cố định để không làm hỏng website.',
});
const text = defineType({
  name: 'contentText', title: 'Nội dung chữ', type: 'object',
  fields: [label(), mappingCode(), defineField({
    name: 'text', title: 'Nội dung hiển thị', type: 'text', rows: 4,
    description: 'Nhập chữ thường, có thể xuống dòng. Không cần nhập HTML.',
  })],
  preview: {select: {title: 'label', subtitle: 'text'}},
});
const image = defineType({
  name: 'contentImage', title: 'Hình ảnh', type: 'object',
  fields: [label(), mappingCode(), defineField({
    name: 'image', title: 'Chọn / thay ảnh', type: 'image',
    options: {accept: 'image/png,image/jpeg,image/webp,image/gif', hotspot: false},
    description: 'Tải PNG, JPG, WebP hoặc GIF. Khung ảnh trên website giữ nguyên.',
  }), defineField({name: 'alt', title: 'Mô tả ảnh (alt)', type: 'string'}),
  defineField({name: 'source', type: 'string', hidden: true, readOnly: true})],
  preview: {select: {title: 'label', subtitle: 'alt', media: 'image'}},
});
const link = defineType({
  name: 'contentLink', title: 'Đường dẫn', type: 'object',
  fields: [label(), mappingCode(), defineField({
    name: 'href', title: 'Đường dẫn khi bấm', type: 'string',
    description: 'Ví dụ: contact.html, #programs, https://…, mailto:… hoặc tel:…',
    validation: (Rule) => Rule.custom((value) => {
      if (!value) return true;
      try {
        return ['http:', 'https:', 'mailto:', 'tel:'].includes(new URL(value, 'https://gsj.edu.vn/').protocol)
          || 'Chỉ dùng đường dẫn web, email hoặc số điện thoại.';
      } catch { return 'Đường dẫn không hợp lệ.'; }
    }),
  })],
  preview: {select: {title: 'label', subtitle: 'href'}},
});
const section = defineType({
  name: 'contentSection', title: 'Phần trên trang', type: 'object',
  groups: [
    {name: 'text', title: 'Nội dung chữ', default: true},
    {name: 'images', title: 'Hình ảnh'},
    {name: 'links', title: 'Đường dẫn'},
  ],
  fields: [
    defineField({name: 'name', title: 'Tên phần', type: 'string', readOnly: true, hidden: true}),
    mappingCode(),
    slots('texts', 'Nội dung chữ', 'contentText', 'text'),
    slots('images', 'Hình ảnh', 'contentImage', 'images'),
    slots('links', 'Đường dẫn', 'contentLink', 'links'),
  ],
  preview: {select: {title: 'name'}},
});
const page = defineType({
  name: 'page', title: 'Trang website', type: 'document',
  groups: [{name: 'content', title: 'Nội dung trang', default: true}, {name: 'seo', title: 'SEO'}],
  fields: [
    defineField({name: 'name', title: 'Tên trang', type: 'string', readOnly: true, group: 'content'}),
    defineField({name: 'slug', type: 'string', hidden: true, readOnly: true}),
    slots('sections', 'Các phần trên trang', 'contentSection', 'content'),
    defineField({name: 'seoTitle', title: 'Tiêu đề trên trình duyệt / Google', type: 'string', group: 'seo'}),
    defineField({name: 'seoDescription', title: 'Mô tả trên Google', type: 'text', rows: 3, group: 'seo'}),
  ],
  preview: {select: {title: 'name', subtitle: 'slug'}},
});
const settings = defineType({
  name: 'siteSettings', title: 'Cài đặt toàn website', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Tên cấu hình', type: 'string', readOnly: true}),
    slots('sections', 'Đầu trang, sidebar & chân trang', 'contentSection'),
  ],
  preview: {select: {title: 'name'}},
});

export const schemaTypes = [text, image, link, section, page, settings];
