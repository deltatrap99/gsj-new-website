import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = JSON.parse(
  await readFile(path.join(root, "content/site-source.json"), "utf8"),
);
await mkdir(path.join(root, "images/universities"), { recursive: true });

async function retrieve(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(25000),
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}

async function university(row, index) {
  const name = row[1].text;
  const link = row[3].link || row[3].text.trim();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, "");
  try {
    const redirect = await retrieve(link);
    const target = new URL(redirect.url);
    const html = await redirect.text();
    let imageUrl = target.searchParams.get("imgurl");
    if (!imageUrl)
      imageUrl = html
        .match(/var imageUrl='([^']+)'/)?.[1]
        ?.replace(/\\x([\da-f]{2})/gi, (_, h) =>
          String.fromCharCode(parseInt(h, 16)),
        );
    if (!imageUrl) throw new Error("No image target in shared link");
    let image;
    try {
      image = await retrieve(imageUrl);
    } catch {
      const thumbnail = html
        .match(
          /https:\/\/encrypted-tbn\d\.gstatic\.com\/images\?[^'"<> ]+/,
        )?.[0]
        ?.replace(/\\x([\da-f]{2})/gi, (_, h) =>
          String.fromCharCode(parseInt(h, 16)),
        );
      if (!thumbnail) throw new Error("Image host unavailable");
      image = await retrieve(thumbnail);
    }
    const type = image.headers.get("content-type") || "";
    if (!type.startsWith("image/")) throw new Error(`Not an image: ${type}`);
    const ext = type.includes("svg")
      ? "svg"
      : type.includes("png")
        ? "png"
        : type.includes("webp")
          ? "webp"
          : "jpg";
    const file = `images/universities/${slug}.${ext}`;
    await writeFile(
      path.join(root, file),
      new Uint8Array(await image.arrayBuffer()),
    );
    return {
      name,
      ranking: row[2]?.text || "",
      source: link,
      imageSource: imageUrl,
      file,
      order: index,
    };
  } catch (error) {
    return { name, source: link, error: error.message, order: index };
  }
}

const rows = source.studyAbroad
  .slice(10, 40)
  .filter((row) => row[3]?.text?.startsWith("https://share.google/"));
const results = [];
for (let offset = 0; offset < rows.length; offset += 6) {
  results.push(
    ...(await Promise.all(
      rows
        .slice(offset, offset + 6)
        .map((row, i) => university(row, offset + i)),
    )),
  );
}
process.stdout.write(JSON.stringify(results));
