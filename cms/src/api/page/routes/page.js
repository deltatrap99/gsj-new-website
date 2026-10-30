"use strict";
// Core endpoints stay private. The frontend uses the read-only website route.
module.exports =
  require("@strapi/strapi").factories.createCoreRouter("api::page.page");
