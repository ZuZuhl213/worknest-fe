# WorkNest Frontend

React, TypeScript, Vite, Tailwind CSS frontend for WorkNest.

## Local Development

```bash
pnpm install
pnpm dev
```

Local API calls use the Vite dev proxy. Configure the backend target with:

```bash
VITE_API_PROXY_TARGET=http://localhost:8000
```

Leave `VITE_API_BASE_URL` empty for local same-origin `/api` requests through the dev proxy.

## Production Deploy

The production target is Cloudflare Pages.

- Build command: `pnpm run build`
- Output directory: `dist`
- Node: `22`
- Package manager: `pnpm`

The default production topology is same-origin API access:

1. The app calls `/api/*`.
2. Cloudflare Pages rewrites `/api/*` to the deployed backend.
3. Browser routes fall back to `/index.html`.

Before production release, update `public/_redirects` with the real backend origin:

```text
/api/* https://api.your-domain.com/api/:splat 200
```

Keep `VITE_API_BASE_URL` empty when using this rewrite. Only set `VITE_API_BASE_URL` when intentionally calling a separate API origin directly.

## Backend Requirements

For same-origin Cloudflare rewrites, refresh-token cookies and CSRF requests continue to flow through `/api`.

If the frontend calls a separate API origin directly instead, the backend must allow the frontend origin and use production cookie settings:

- `APP_CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com`
- `AUTH_COOKIE_SECURE=true`
- `AUTH_COOKIE_SAME_SITE=None`

When using a separate API origin, also widen `connect-src` in `public/_headers` and set `VITE_API_BASE_URL` in Cloudflare Pages.

## Verification

```bash
pnpm lint
pnpm build
pnpm audit --prod --audit-level high
pnpm preview
```

After preview starts, verify `/login`, `/register`, `/workspaces`, and a deep route such as `/workspaces/1/dashboard`.
