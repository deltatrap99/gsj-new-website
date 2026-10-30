// Deliberately allowlist public files: NEVER serve CMS secrets, databases or .git.
import http from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = new Set([
  "index",
  "about",
  "services",
  "study-abroad",
  "research",
  "become-mentor",
  "mentors",
  "student-stories",
  "questions",
  "contact",
  "terms",
]);
const assets = new Set([
  "style.css",
  "main.js",
  "supabase.js",
  "cms-config.js",
  "cms-client.js",
]);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};
const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }
  try {
    let name = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    ).replace(/^\//, "");
    if (name === "admin" || name === "admin/") {
      res.writeHead(302, { Location: "http://localhost:1337/admin" });
      return res.end();
    }
    if (!name) name = "index.html";
    if (pages.has(name)) name += ".html";
    const allowed =
      assets.has(name) ||
      (name.endsWith(".html") && pages.has(name.slice(0, -5))) ||
      (/^images\//.test(name) &&
        Boolean(types[path.extname(name).toLowerCase()]));
    if (!allowed) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const target = await realpath(path.resolve(root, name));
    const boundary = name.startsWith("images/")
      ? path.join(root, "images") + path.sep
      : root + path.sep;
    if (!target.startsWith(boundary) || !(await stat(target)).isFile()) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const bytes = await readFile(target);
    res.writeHead(200, {
      "Content-Type":
        types[path.extname(target).toLowerCase()] || "application/octet-stream",
      "Content-Length": bytes.length,
    });
    res.end(req.method === "HEAD" ? undefined : bytes);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.listen(Number(process.env.PORT || 8008), "127.0.0.1", () =>
  console.log(
    "GSJ website: http://localhost:" +
      (process.env.PORT || 8008) +
      "\nStrapi CMS: http://localhost:1337/admin\nOnly public website assets are served. CMS secrets and database files are blocked.",
  ),
);
