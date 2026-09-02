# Jamroom

Jamroom is a React/Vite room-booking app backed by a Hono API and Cloudflare D1.

## Development

```bash
bun install
bun run dev
```

The frontend calls relative `/api/*` URLs. During local development the Cloudflare Vite plugin serves the Worker alongside the app; in production, the deployed Worker serves the built frontend and handles `/api/*` itself. This keeps every browser request same-origin, so no CORS configuration is needed.

## Build and deploy

```bash
bun run build
bun run deploy
```

`wrangler.jsonc` defines the Worker assets and D1 binding. The Worker runs first for `/api/*`; all other paths are served from the Vite build with SPA fallback.

## Migration status

The original application source is retained in `legacy/` as a porting reference. New application code belongs in `src/` and `worker/`; it should use React, Bun, Hono, and the single Worker deployment described above.
