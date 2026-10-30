/* Strapi content adapter. Static HTML remains a complete fallback, never a blank shell. */
(() => {
  const slug = document.body.dataset.cmsPage;
  if (!slug || !window.GSJ_CMS_URL) return;
  let base;
  try {
    base = new URL(window.GSJ_CMS_URL);
    if (!["http:", "https:"].includes(base.protocol)) return;
    if (location.protocol === "https:" && base.protocol !== "https:") return;
  } catch {
    return;
  }
  const preview = location.hash.startsWith("#cms-preview=")
    ? location.hash.slice(13)
    : "";
  const safeUrl = (value, image = false) => {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const parsed = new URL(value, image ? base : location.href);
      if (
        !(
          image ? ["http:", "https:"] : ["http:", "https:", "mailto:", "tel:"]
        ).includes(parsed.protocol)
      )
        return null;
      return image ? parsed.href : value;
    } catch {
      return null;
    }
  };
  function apply(document) {
    if (!document) return;
    for (const field of document.fields || []) {
      if (typeof field.code !== "string" || !/^[a-zA-Z0-9.]+$/.test(field.code))
        continue;
      if (field.kind === "text" && typeof field.text === "string") {
        for (const node of window.document.querySelectorAll(
          `[data-cms-text="${field.code}"]`,
        )) {
          if (node.hasAttribute("data-count")) {
            node.dataset.cmsCountText = field.text;
            if (node.dataset.counterRunning === "true") continue;
          }
          // Preserve line breaks, but never interpret CMS text as HTML/JavaScript.
          const lines = field.text.split("\n");
          node.replaceChildren(
            ...lines.flatMap((text, i) =>
              i
                ? [
                    window.document.createElement("br"),
                    window.document.createTextNode(text),
                  ]
                : [window.document.createTextNode(text)],
            ),
          );
        }
      }
      if (field.kind === "link") {
        const href = safeUrl(field.href);
        if (!href) continue;
        for (const node of window.document.querySelectorAll(
          `[data-cms-link="${field.code}"]`,
        )) {
          node.setAttribute("href", href);
          if (node.target === "_blank") node.rel = "noopener noreferrer";
        }
      }
      if (field.kind === "image") {
        // Static fallback paths belong to the website origin, not to Strapi.
        let src = field.image?.url
          ? safeUrl(field.image.url, true)
          : safeUrl(field.source);
        if (!src) continue;
        // Strapi replaces media in place, retaining its URL. Version same-origin
        // uploads so an already cached logo/photo cannot survive a replacement.
        // Leave external CDN/signed URLs unchanged.
        if (field.image?.updatedAt) {
          const version = Date.parse(field.image.updatedAt);
          const imageUrl = new URL(src, location.href);
          if (Number.isFinite(version) && imageUrl.origin === base.origin) {
            imageUrl.searchParams.set("v", String(version));
            src = imageUrl.href;
          }
        }
        for (const node of window.document.querySelectorAll(
          `[data-cms-image="${field.code}"]`,
        )) {
          const oldSrc = node.getAttribute("src");
          node.addEventListener(
            "error",
            () => {
              node.setAttribute("src", oldSrc);
            },
            { once: true },
          );
          node.src = src;
          node.alt = field.alt || field.image?.alternativeText || node.alt;
          if (field.image?.width && field.image?.height) {
            node.width = field.image.width;
            node.height = field.image.height;
          }
        }
      }
    }
  }
  const banner = (message) => {
    const node = document.createElement("div");
    node.setAttribute("role", "status");
    node.className = "cms-preview-banner";
    node.textContent = message;
    const exit = document.createElement("a");
    exit.href = location.pathname + location.search;
    exit.textContent = "Thoát xem trước";
    node.append(exit);
    document.body.append(node);
  };
  fetch(
    new URL(
      preview
        ? "/api/website/preview"
        : `/api/website/${encodeURIComponent(slug)}`,
      base,
    ),
    {
      headers: preview ? { Authorization: `Bearer ${preview}` } : {},
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
      credentials: "omit",
    },
  )
    .then(async (response) => {
      if (!response.ok) throw new Error(`CMS HTTP ${response.status}`);
      const { data } = await response.json();
      if (!data?.page || data.page.slug !== slug)
        throw new Error("CMS page mismatch");
      apply(data.settings);
      apply(data.page);
      if (data.page.seoTitle) document.title = data.page.seoTitle;
      if (data.page.seoDescription)
        document
          .querySelector("meta[name=description]")
          ?.setAttribute("content", data.page.seoDescription);
      document.body.dataset.cmsStatus = data.preview ? "preview" : "published";
      if (data.preview)
        banner("BẢN NHÁP — chỉ hiển thị qua liên kết xem trước có thời hạn.");
      document.dispatchEvent(new CustomEvent("gsj:content-updated"));
    })
    .catch(() => {
      document.body.dataset.cmsStatus = "fallback";
      if (preview)
        banner(
          "Không tải được bản nháp. Liên kết có thể hết hạn; mở lại Preview trong Strapi.",
        );
      // Do not leak tokens or interrupt visitors when the CMS is offline.
    });
})();
