import { load } from "cheerio";

export const pages = [
  ["index.html", "home", "Trang chủ"],
  ["about.html", "about", "About us"],
  ["services.html", "programs", "Our Programs"],
  ["study-abroad.html", "study-abroad", "Study Abroad"],
  ["research.html", "research", "Research"],
  ["become-mentor.html", "become-mentor", "Become a Mentor"],
  ["student-stories.html", "student-stories", "Student Stories"],
  ["questions.html", "questions", "FAQ & Questions"],
  ["contact.html", "contact", "Contact"],
  ["terms.html", "terms", "Terms of Service"],
];

const clean = (text) => text.replace(/\s+/g, " ").trim();
const editable = new Set(
  "h1 h2 h3 h4 h5 h6 p li a span small strong em label button option summary blockquote figcaption th td".split(
    " ",
  ),
);
const nonCopy =
  ".material-symbols-outlined,.menu-number,.faq-number,.caption-dot,.eyebrow-line,.form-feedback,[aria-hidden=true]";

/** Add durable content keys without changing the structure or accepting HTML from CMS. */
export function preparePage(html, slug) {
  const $ = load(html, { decodeEntities: false });
  $("[data-cms-wrap]").each((_, element) =>
    $(element).replaceWith($(element).contents()),
  );
  $("[data-cms-text],[data-cms-image],[data-cms-link]").removeAttr(
    "data-cms-text data-cms-image data-cms-link",
  );
  $("script[data-gsj-cms]").remove();
  $("body").attr("data-cms-page", slug);
  $("head").append(
    '<script data-gsj-cms src="cms-config.js?v=20261031-sanity" defer></script><script data-gsj-cms src="cms-client.js?v=20261031-sanity" defer></script>',
  );

  function section(root, code, name) {
    const fields = [];
    let texts = 0,
      images = 0,
      links = 0;
    const addText = (element, text) => {
      const key = `${code}.t${++texts}`;
      $(element).attr("data-cms-text", key);
      fields.push({
        code: key,
        kind: "text",
        label: clean(text).slice(0, 110),
        text,
      });
    };
    // Snapshot original elements: generated text wrappers must not be processed twice.
    const elements = $(root).find("*").addBack().toArray();
    for (const element of elements) {
      const node = $(element);
      if (
        node.is(nonCopy) ||
        node.parents(nonCopy).length ||
        !editable.has(element.name)
      )
        continue;
      const children = node.children().toArray();
      if (children.every((child) => child.name === "br")) {
        const text = node
          .contents()
          .toArray()
          .map((child) => (child.type === "text" ? clean(child.data) : "\n"))
          .join("");
        if (clean(text)) addText(element, text);
      } else {
        for (const child of node.contents().toArray()) {
          if (child.type !== "text" || !clean(child.data)) continue;
          const wrapper = $('<span data-cms-wrap="true"></span>').text(
            clean(child.data),
          );
          $(child).replaceWith(wrapper);
          // Keep spaces between inline nodes while avoiding source-formatting whitespace.
          wrapper.before(" ").after(" ");
          addText(wrapper[0], clean(child.data));
        }
      }
    }
    $(root)
      .find("img")
      .each((_, element) => {
        const node = $(element);
        const key = `${code}.i${++images}`;
        node.attr("data-cms-image", key);
        fields.push({
          code: key,
          kind: "image",
          label: node.attr("alt") || `Ảnh ${images}`,
          alt: node.attr("alt") || "",
          source: node.attr("src"),
        });
      });
    $(root)
      .find("a[href]")
      .each((_, element) => {
        const node = $(element),
          href = node.attr("href");
        if (href.startsWith("#")) return; // Section navigation is structural, not content.
        const key = `${code}.l${++links}`;
        node.attr("data-cms-link", key);
        fields.push({
          code: key,
          kind: "link",
          label: `Link: ${clean(node.text()).slice(0, 90) || node.attr("aria-label") || href}`,
          href,
        });
      });
    return { code, name: name.slice(0, 150), fields };
  }

  const globalSections = [
    section($("header.site-header"), "header", "Đầu trang — logo & menu"),
    section($("dialog#site-menu"), "drawer", "Menu sidebar"),
    section(
      $("footer.site-footer"),
      "footer",
      "Chân trang — liên hệ & địa chỉ",
    ),
  ];
  const sections = $("main > section")
    .toArray()
    .map((element, index) => {
      const name =
        clean($(element).find("h1,h2").first().text()) ||
        clean($(element).find(".eyebrow").first().text()) ||
        `Phần ${index + 1}`;
      return section(element, `section${index + 1}`, name);
    });
  return {
    html: $.html(),
    sections,
    globalSections,
    seoTitle: $("title").text().trim(),
    seoDescription: $("meta[name=description]").attr("content") || "",
  };
}
