import type { Schema, Struct } from '@strapi/strapi';

export interface ContentImage extends Struct.ComponentSchema {
  collectionName: 'components_content_images';
  info: {
    displayName: 'H\u00ECnh \u1EA3nh';
    icon: 'picture';
  };
  attributes: {
    alt: Schema.Attribute.String;
    code: Schema.Attribute.String & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    source: Schema.Attribute.String;
  };
}

export interface ContentLink extends Struct.ComponentSchema {
  collectionName: 'components_content_links';
  info: {
    displayName: '\u0110\u01B0\u1EDDng d\u1EABn';
    icon: 'link';
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Required;
    href: Schema.Attribute.String;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ContentSection extends Struct.ComponentSchema {
  collectionName: 'components_content_sections';
  info: {
    description: 'S\u1EEDa ch\u1EEF, thay \u1EA3nh v\u00E0 \u0111\u01B0\u1EDDng d\u1EABn. Gi\u1EEF nguy\u00EAn c\u00E1c ph\u1EA7n \u0111\u1EC3 b\u1EA3o to\u00E0n b\u1ED1 c\u1EE5c website.';
    displayName: 'Ph\u1EA7n n\u1ED9i dung';
    icon: 'layout';
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Required;
    images: Schema.Attribute.Component<'content.image', true>;
    links: Schema.Attribute.Component<'content.link', true>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    texts: Schema.Attribute.Component<'content.text', true>;
  };
}

export interface ContentText extends Struct.ComponentSchema {
  collectionName: 'components_content_texts';
  info: {
    displayName: 'N\u1ED9i dung ch\u1EEF';
    icon: 'write';
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    text: Schema.Attribute.Text;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'content.image': ContentImage;
      'content.link': ContentLink;
      'content.section': ContentSection;
      'content.text': ContentText;
    }
  }
}
