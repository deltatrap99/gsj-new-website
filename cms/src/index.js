"use strict";

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // The integration test uses an isolated database and upload directory only.
    if (process.env.GSJ_CMS_TEST_MODE === "isolated") {
      if (!process.env.DATABASE_FILENAME?.startsWith("../artifacts/cms-tests/"))
        throw new Error("Unsafe test database path");
      return;
    }
    await require("./utils/seed")(strapi);
  },
};
