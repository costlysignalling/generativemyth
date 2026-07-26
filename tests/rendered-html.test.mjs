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
  assert.match(html, /Pravidla světa/);
  assert.match(html, /https:\/\/myth\.example\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps the app client-side and removes disposable starter UI", async () => {
  const [component, myth, packageJson] = await Promise.all([
    readFile(new URL("../app/GenerativeMyth.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/myth.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(component, /^"use client";/);
  assert.match(component, /Download SVG|Stáhnout SVG/);
  assert.match(component, /MAX_CITIES = 30_000/);
  assert.match(myth, /There stands a castle in the middle of the world/);
  assert.match(myth, /Uprostřed světa stojí hrad/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.deepEqual(
    await readdir(new URL("../app/_sites-preview", import.meta.url)),
    [],
  );
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL(".openai/hosting.json", projectRoot));
});
