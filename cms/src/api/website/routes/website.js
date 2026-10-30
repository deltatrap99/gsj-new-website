"use strict";
module.exports = {
  routes: [
    {
      method: "GET",
      path: "/website/preview",
      handler: "website.preview",
      config: { auth: false },
    },
    {
      method: "GET",
      path: "/website/:slug",
      handler: "website.find",
      config: { auth: false },
    },
  ],
};
