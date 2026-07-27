# Generative Myth

A browser-native rebuild of the original R Shiny project. It preserves the
recursive city geometry, successful-brother rules, generation controls, visual
settings, and Czech/English myth text without requiring R or a server-side
rendering process.

## What changed

- Live high-DPI canvas rendering instead of server-generated plot images.
- Downloadable vector SVG and PNG output.
- Responsive bilingual interface for desktop and mobile.
- Guardrails for patterns that would otherwise contain millions of cities.
- A standalone static build for ordinary web hosting.
- A Cloudflare-compatible production build for Sites and custom domains.

## Run locally

Install the dependencies with pnpm, then run:

```text
pnpm dev
```

## Build for any static web host

Run:

```text
pnpm build:static
```

Upload the contents of `static-dist` to the document root of GitHub Pages,
Netlify, Cloudflare Pages, an S3-compatible host, or a conventional web server.
No R runtime, database, or backend is needed.

## Build the offline archival edition

Run:

```text
pnpm build:archive
```

This creates `archive/GenerativeMyth.html`, a single double-clickable file with
all application code and styling embedded. It makes no network requests and
also writes a SHA-256 checksum for integrity verification.

## Production build

Run:

```text
pnpm build
```

This produces the Cloudflare-compatible bundle used by Sites.
