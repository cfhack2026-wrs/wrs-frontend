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

## Build

```bash
npm run build
```

Output goes to `dist/`. Serve it from any static host, with `VITE_API_URL` set to the backend's full URL.
