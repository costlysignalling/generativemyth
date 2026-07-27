import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const staticRoot = resolve(projectRoot, "static-dist");
const archiveRoot = resolve(projectRoot, "archive");
const htmlPath = resolve(staticRoot, "index.html");

const sourceHtml = await readFile(htmlPath, "utf8");
const scriptSource = sourceHtml.match(
  /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/,
);
const styleSource = sourceHtml.match(
  /<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/,
);

if (!scriptSource || !styleSource) {
  throw new Error("The static build does not contain the expected assets.");
}

const assetPath = (reference) =>
  resolve(staticRoot, reference.replace(/^\.\//, ""));
const javascript = await readFile(assetPath(scriptSource[1]), "utf8");
const css = await readFile(assetPath(styleSource[1]), "utf8");

if (
  /@import|url\(\s*["']?https?:\/\//i.test(css) ||
  /<(?:script|link|img)[^>]+(?:src|href)=["']https?:\/\//i.test(sourceHtml)
) {
  throw new Error("The archive build unexpectedly contains a network request.");
}

const safeJavascript = javascript.replace(/<\/script/gi, "<\\/script");
new Function(safeJavascript);
const singleFile = sourceHtml
  .replace(
    /<meta\s+property="og:image"[^>]*>\s*/i,
    "",
  )
  .replace(styleSource[0], () => `<style>\n${css}\n</style>`)
  .replace(scriptSource[0], "")
  .replace(/\s+crossorigin(?=[\s>])/g, "")
  .replace(
    /<\/body>/i,
    () => `<script>\n${safeJavascript}\n</script>\n  </body>`,
  );

const rootPosition = singleFile.indexOf('id="root"');
const scriptPosition = singleFile.lastIndexOf("<script>");
if (rootPosition === -1 || scriptPosition < rootPosition) {
  throw new Error("The archive script must run after the application root exists.");
}

await mkdir(archiveRoot, { recursive: true });
const outputPath = resolve(archiveRoot, "GenerativeMyth.html");
await writeFile(outputPath, singleFile, "utf8");

const checksum = createHash("sha256").update(singleFile).digest("hex");
await writeFile(
  resolve(archiveRoot, "SHA256SUMS.txt"),
  `${checksum}  GenerativeMyth.html\n`,
  "utf8",
);

console.log(outputPath);
