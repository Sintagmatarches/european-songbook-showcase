# European Songbook — Portfolio Edition

Safe portfolio deployment of the European Songbook using the **original production design**: the same shell, catalog cards, navigation rail, mobile navigation, map, logo, responsive behavior and administration interface.

## Live demo

[Open the portfolio site](https://european-songbook-portfolio.pages.dev/)

## What the demo contains

- the original compiled frontend design, copied without visual redesign;
- 300 sanitized rows from the anonymous public catalog;
- 5 clearly labeled Indonesia workflow fixtures, for exactly 305 demo entries;
- the original song catalog, search, song pages and administration navigation;
- a simulated Super Admin session with no real identity data;
- a Cloudflare Pages demo API that validates interface actions but never writes to production.

## Safety boundary

The repository contains no production database binding, session secret, invitation flow, user list or production write endpoint. `/api/*` is implemented by a small isolated demo function. Catalog and administration mutations are simulations and are never persisted. Favorites and the last five searches live only in an isolated, expiring browser cookie for two hours.

The original backend remains private and is not called by this deployment.

## Technical scope

- original Vue interface, published here as a reviewed production build;
- Cloudflare Pages Functions for the isolated demo API;
- sanitized JSON catalog with deterministic workflow fixtures;
- Node.js tests for API behavior, bundle integrity, credentials and public-data boundaries.

The private Vue source tree and production backend are intentionally outside this public repository. This edition is a safe, runnable product demonstration rather than a source mirror of the live service.

## Structure

- `public-site/` — original production UI build and its existing assets;
- `functions/` — isolated no-database API contract for the portfolio;
- `data/` — sanitized anonymous catalog snapshot;
- `tests/` — data, API-policy and original-design integrity checks;
- `docs/` — architecture and security decisions.

The compiled flag catalog is reduced to the historical affiliations represented by the 305 demo entries. Zero-song countries and their embedded flag references are not shipped.

## Development

```bash
npm install
npm run check
npx wrangler pages dev dist
```

The build copies the selected original UI into `dist/`. Portfolio country selectors expose only represented catalog entries, thematic entity labels follow the selected locale, and favorites/search history use an isolated two-hour demo session cookie. `npm run check` also enforces the sanitized flag allowlist and bundle integrity. Cache version: `20260716-original-ui-v13`.
