# WRS Frontend

React frontend for the [Website Responsibility Scanner](https://github.com/cfhack2026-wrs). Submits a URL to the Laravel backend, polls for results, and displays findings with fix suggestions.

## Requirements

- Node.js 20+
- The [laravel-app](../laravel-app) backend running locally via DDEV

## Setup

```bash
cp .env.example .env
npm install
```

The default `.env` points to the local DDEV backend via the Vite proxy — no changes needed if you're running the standard DDEV setup.

## Development

```bash
npm run dev
```

App runs at **http://localhost:3000**. API calls to `/api/*` are proxied to `http://wrs-laravel-app.ddev.site` automatically.

Make sure the backend is running first:

```bash
cd ../laravel-app
ddev start
ddev exec composer run dev
```

## Backend connection

API requests are proxied through Vite in development (`vite.config.ts`). The `VITE_API_URL` env var sets the base path (default: `/api`). To point at a different backend, update both `VITE_API_URL` in `.env` and the proxy target in `vite.config.ts`.

## UX Guidelines

All contributions to the frontend must follow these principles:

### Accessible
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<section>`, etc.) — never a `<div>` where a semantic element fits
- Every interactive element must be keyboard-navigable and have a visible focus style
- Add `aria-label` or `aria-labelledby` to elements whose purpose isn't clear from visible text alone
- Use `aria-live` regions for dynamic content (scan status updates, results appearing)
- Use `role="alert"` for errors so screen readers announce them immediately
- Maintain WCAG AA color contrast minimum (4.5:1 for text, 3:1 for UI components)
- Never rely on color alone to convey meaning — pair it with an icon or text

### Interactive
- Every action must have immediate visual feedback — loading states, hover effects, focus rings
- Buttons must have a `disabled` state that is visually distinct
- Transitions should feel snappy (150–300 ms) — not instant, not sluggish

### Appealing & Pretty
- Stick to the established dark theme (`gray-950` base, white/indigo accents)
- Use consistent spacing from Tailwind's scale — avoid arbitrary values
- Every state must look intentional: empty, loading, error, and success all need a designed appearance
- Prefer smooth transitions (`transition-*`) and subtle shadows over hard borders

## Build

```bash
npm run build
```

Output goes to `dist/`. Serve it from any static host, with `VITE_API_URL` set to the backend's full URL.
