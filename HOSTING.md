# Hosting and preservation

Generative Myth is a static website. Its public version needs only ordinary
HTML, CSS, JavaScript, and image hosting. It does not need R, Shiny, a database,
a CMS, or a continuously running application server.

## Recommended public setup

1. Keep the source in a public GitHub repository.
2. In the repository settings, select **Pages → Source → GitHub Actions**.
3. The included workflow publishes `static-dist` whenever `main` changes.
4. Register `generativemyth.org`, then add it as the custom domain in the
   repository's Pages settings.
5. Configure the domain's DNS exactly as shown by GitHub and enable HTTPS.

The domain can be registered and its DNS managed at Forpsi while GitHub Pages
serves the website. Do not add a `CNAME` file before the domain has actually
been registered and configured.

## Forpsi mirror

Run `pnpm build:static`, then upload the *contents* of `static-dist` to the
website root (`/www`) or to a selected subdomain directory. This makes a useful
second copy independent of GitHub Pages.

## Offline archival edition

Run `pnpm build:archive`. Preserve these files together:

- `archive/GenerativeMyth.html`
- `archive/SHA256SUMS.txt`
- `archive/README.txt`

`GenerativeMyth.html` is self-contained and opens by double-clicking. Keep
copies on several physical media and in more than one institution. Occasionally
verify the checksum and migrate the files to current storage media.

## Long-term administration

- Register the domain for the longest available term and enable automatic
  renewal.
- Keep billing and recovery details current.
- Give renewal and repository access to at least two trusted custodians.
- Record the project, domain, repository, and recovery instructions in an
  institutional archive or succession document.
- Preserve tagged source releases as well as the self-contained HTML edition.

No commercial host or domain registration can guarantee an 80-year lifetime.
The durable strategy is redundancy: portable files, documented custody, and
several independent copies.
