# Security model

## Not included

- Production database bindings, migrations and credentials
- Real authentication, passwords, invitations and sessions
- User identities, emails and moderation records
- Production write routes
- Deployment secrets and environment files

## Demo identity

The API returns a fixed fictional `Portfolio Demo` Super Admin identity. It has no email, password, token or relationship to a production account. It exists only to render the original administration interface.

## Mutations

Create, edit, delete, import and moderation calls are handled inside the isolated portfolio function. Responses are marked with `X-Portfolio-Demo: local-sandbox`; nothing is forwarded or written to a database. Favorites and the last five search queries are the only mutable demo state. They are stored in an HttpOnly, SameSite cookie scoped to the current browser and expire after two hours.

## Catalog

Only fields already available from the anonymous catalog are bundled. Automated tests reject timestamps, email fields and internal catalog metadata.

## Flags

The frontend build contains flag references only for historical affiliations with at least one demo song. The build policy removes zero-song flag mappings and the runtime resolver rejects countries outside that allowlist.

## Repository checks

The tracked repository contains no environment files, private keys, passwords, API tokens or real email addresses. The automated test suite scans tracked text files for common high-confidence credential formats.
