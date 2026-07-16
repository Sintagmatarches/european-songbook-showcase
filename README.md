# European Songbook Demo

Public, non-production demo of a web application for browsing a multilingual catalog of European historical songs.

## Live demo

[Open the demo](https://european-songbook-portfolio.pages.dev/)

## Included

- 305 sanitized demo records;
- catalog search and metadata filters;
- song pages and map navigation;
- simulated administration workflows;
- an isolated Cloudflare Pages API with no production write access.

## Data and access

This repository does not contain the production database, credentials, user records, invitation flow, or production write endpoints. Administration actions are simulations and are not persisted. Favorites and recent searches are stored only in a temporary demo session.

The production backend and the private application source are not included and are not called by this deployment.

## Repository structure

- `public-site/` — compiled frontend and static assets;
- `functions/` — isolated demo API;
- `data/` — sanitized catalog snapshot;
- `tests/` — API, data-boundary, and bundle-integrity checks;
- `docs/` — architecture and security notes.

## Local development

Requires Node.js 22 or later.

```bash
npm install
npm run check
npx wrangler pages dev dist
```
