import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://myth.example/", {
      headers: {
        accept: "text/html",
        host: "myth.example",
        "x-forwarded-host": "myth.example",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the finished Generative Myth app", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Generative Myth · Generativní Mýtus<\/title>/i);
  assert.match(html, /Generativní Mýtus/);
  assert.match(html, /b : brothers : bratři : base/);
  assert.match(
    html,
    /s : succeeded : splnil : survived : symbol : sign/,
  );
  assert.match(html, /g : generations : generace/);
  assert.match(html, /https:\/\/myth\.example\/og\.png/);
  assert.doesNotMatch(
    html,
    /codex-preview|react-loading-skeleton|Rekurzivní vyprávěcí stroj|Pravidla světa/i,
  );
});

test("keeps the app client-side and independent of remote runtimes", async () => {
  const [component, myth, css, packageJson] = await Promise.all([
    readFile(new URL("../app/GenerativeMyth.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/myth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(component, /^"use client";/);
  assert.match(component, /download SVG|stáhnout SVG/i);
  assert.match(component, /MAX_CITIES = 30_000/);
  assert.match(myth, /There stands a castle in the middle of the world/);
  assert.match(myth, /Uprostřed světa stojí hrad/);
  assert.doesNotMatch(css, /@import|https?:\/\//);
  assert.match(css, /::-moz-range-thumb/);
  assert.match(css, /border-radius:\s*0/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.deepEqual(
    await readdir(new URL("../app/_sites-preview", import.meta.url)),
    [],
  );
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL(".openai/hosting.json", projectRoot));
});

test("produces a self-contained double-clickable archival file", async () => {
  const archived = await readFile(
    new URL("../archive/GenerativeMyth.html", import.meta.url),
    "utf8",
  );
  assert.match(archived, /<style>/);
  assert.match(archived, /<script>/);
  assert.doesNotMatch(
    archived,
    /<script[^>]+src=|<link[^>]+stylesheet|https?:\/\/fonts\./i,
  );
  await access(new URL("../archive/SHA256SUMS.txt", import.meta.url));
});
