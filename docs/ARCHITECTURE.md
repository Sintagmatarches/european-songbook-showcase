# Architecture

## Objective

Preserve the visual identity and interaction model of the production European Songbook while removing the production backend and private data from the public portfolio repository.

## Runtime

```text
original UI build ───────────────┐
                                ├─> Cloudflare Pages portfolio site
sanitized 300-song snapshot ─────┤
five labeled fixtures ───────────┤
isolated no-database API ─────────┘
```

The frontend files in `public-site/ui/dist/` are the selected original production build. Integrity tests pin their SHA-256 digests so an accidental redesign cannot silently replace them again.

The catch-all Pages Function implements only the response contracts required by the interface. Public catalog reads come from the bundled snapshot. Mutations return explicit demo responses and have no persistence layer.

## Data flow

1. The browser loads the original interface.
2. Original frontend requests continue to use `/api/*`.
3. The portfolio Pages Function answers from sanitized local data.
4. Favorites and search history are stored only in an expiring demo cookie.
5. No request is forwarded to the production site or database.
