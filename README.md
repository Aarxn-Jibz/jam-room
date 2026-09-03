# Jamroom

Jamroom is a React/Vite room-booking app backed by a Hono API and Cloudflare D1.

## Development

```bash
bun install
bun run dev
```

On a new local checkout, initialize the Worker database once before starting the app:

```bash
bun run db:setup:local
```

This creates the schema and idempotent development data. The local administrator is `aaron@admin.com` / `12345678`.

The frontend calls relative `/api/*` URLs. During local development the Cloudflare Vite plugin serves the Worker alongside the app; in production, the deployed Worker serves the built frontend and handles `/api/*` itself. This keeps every browser request same-origin, so no CORS configuration is needed.

## Build and deploy

```bash
bun run build
bun run deploy
```

`wrangler.jsonc` defines the Worker assets and D1 binding. The Worker runs first for `/api/*`; all other paths are served from the Vite build with SPA fallback.

## Worker secrets

Configure these with `wrangler secret put` before deploying integrations:

- `JWT_SECRET` (at least 32 characters)
- `GOOGLE_SERVICE_ACCOUNT` (the full service-account JSON for weekly Sheets export)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASSWORD` (booking notifications; use an SMTP service compatible with AUTH LOGIN)

The weekly Sheets export runs at 21:00 Asia/Kolkata each Sunday and can also be run by an administrator from Dashboard. Notifications are best-effort: a mail failure is recorded in audit logs and never reverses a booking action.

## Migration status

The original application source is retained in `legacy/` as a porting reference. New application code belongs in `src/` and `worker/`; it should use React, Bun, Hono, and the single Worker deployment described above.
