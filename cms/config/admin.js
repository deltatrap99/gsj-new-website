module.exports = ({ env }) => ({
  autoOpen: false,
  auth: {
    secret: env("ADMIN_JWT_SECRET"),
  },
  apiToken: {
    salt: env("API_TOKEN_SALT"),
  },
  transfer: {
    token: {
      salt: env("TRANSFER_TOKEN_SALT"),
    },
  },
  secrets: {
    encryptionKey: env("ENCRYPTION_KEY"),
  },
  flags: {
    nps: env.bool("FLAG_NPS", true),
    promoteEE: env.bool("FLAG_PROMOTE_EE", true),
    docLinks: env.bool("FLAG_DOC_LINKS", true),
  },
  preview: {
    enabled: true,
    config: {
      allowedOrigins: env("CLIENT_URL", "http://localhost:8008"),
      async handler(uid, { documentId, status }) {
        if (!["api::page.page", "api::site-setting.site-setting"].includes(uid))
          return null;
        const { signPreview } = require("../src/utils/website");
        const document = await strapi
          .documents(uid)
          .findOne({ documentId, status: status || "draft" });
        if (!document) return null;
        const slug = uid === "api::page.page" ? document.slug : "home";
        const paths = { home: "index", programs: "services" };
        const url = `${env("CLIENT_URL", "http://localhost:8008")}/${paths[slug] || slug}.html`;
        if (status === "published") return url;
        const token = signPreview(
          { uid, documentId, slug, status: status || "draft" },
          env("ADMIN_JWT_SECRET"),
        );
        // Fragment prevents preview credentials appearing in HTTP access/referrer logs.
        return `${url}#cms-preview=${token}`;
      },
    },
  },
});
