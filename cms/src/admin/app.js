import { createElement as h, useState } from "react";
import { useFetchClient, useNotification, useForm } from "@strapi/strapi/admin";
import { Button, Box, Typography } from "@strapi/design-system";

function GSJPreviewPanel({ model, documentId, document }) {
  const { get } = useFetchClient();
  const { toggleNotification } = useNotification();
  const modified = useForm("GSJPreviewPanel", (state) => state.modified);
  const [busy, setBusy] = useState(false);
  const id = documentId || document?.documentId;
  if (
    !id ||
    !["api::page.page", "api::site-setting.site-setting"].includes(model)
  )
    return null;
  async function openPreview() {
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    setBusy(true);
    try {
      const response = await get(`/content-manager/preview/url/${model}`, {
        params: { documentId: id, status: "draft" },
      });
      const url = response.data?.data?.url;
      if (!url || !tab) throw new Error("Preview unavailable");
      tab.location.replace(url);
    } catch {
      tab?.close();
      toggleNotification({
        type: "danger",
        message:
          "Không mở được Preview. Hãy lưu nháp và cho phép mở tab mới rồi thử lại.",
      });
    } finally {
      setBusy(false);
    }
  }
  return {
    title: "Xem trước website GSJ",
    content: h(
      Box,
      null,
      h(
        Button,
        {
          variant: "secondary",
          width: "100%",
          onClick: openPreview,
          disabled: modified || busy,
        },
        busy ? "Đang mở…" : "Xem bản nháp — tab mới",
      ),
      h(
        Box,
        { paddingTop: 3 },
        h(
          Typography,
          { variant: "pi", textColor: "neutral600" },
          modified
            ? "Bấm Save trước khi xem bản nháp."
            : "Link xem trước có thời hạn 10 phút. Publish để nội dung xuất hiện trên web.",
        ),
      ),
    ),
  };
}

export default {
  config: {
    locales: ["vi"],
    translations: {
      en: {
        "Auth.form.welcome.title": "GSJ Content Studio",
        "Auth.form.welcome.subtitle": "Sign in to manage the GSJ website",
        "app.components.LeftMenu.navbrand.title": "GSJ CMS",
        "app.components.LeftMenu.navbrand.workplace": "Content Studio",
      },
      vi: {
        "Auth.form.welcome.title": "GSJ Content Studio",
        "Auth.form.welcome.subtitle": "Đăng nhập để quản lý website GSJ",
      },
    },
    tutorials: false,
    notifications: { releases: false },
  },
  bootstrap(app) {
    app
      .getPlugin("content-manager")
      .apis.addEditViewSidePanel([GSJPreviewPanel]);
  },
};
