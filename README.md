# JharBhoomi Info

An independent, Hindi-first Next.js app for Jharkhand land records and farmer
services: live mandi (market) rates, an auto-refreshing news feed, an in-app
webview for official government portals, PDF/PNG export, a branded splash
screen, and a smart multi-color push notification system.

**Not affiliated with the Government of Jharkhand.** It links to and embeds
official portals but doesn't copy or store legal records.

## What's implemented

- **Live mandi rates** — `/api/mandi` pulls Jharkhand commodity prices from
  data.gov.in's Agmarknet dataset (`lib/mandi.ts`), cached for 30 minutes,
  with a file-cache + bundled-sample fallback if the live call fails.
- **News section** — `/api/news` aggregates Hindi-language Google News RSS
  feeds for land records, farmer schemes, mandi prices and general Jharkhand
  news (`lib/news.ts`), same caching/fallback pattern.
- **Cron-refreshed data** — `/api/cron/refresh` warms both caches; wire it to
  a scheduler (see **Cron & deployment** below) so users rarely hit a cold
  cache.
- **Smart multi-color notifications** — `/api/cron/notify` sends a Web Push
  notification every 3 hours, rotating through 4 color themes (saffron /
  green / blue / rose) and matching message pools (`lib/notifications.ts`),
  themed for retention (mandi alert, scheme alert, land-record reminder,
  news digest). A client-side fallback (`components/notification-optin.tsx`)
  also fires a local notification on the same 3-hour cadence while the app
  tab is open, so the feature works before you've deployed a cron scheduler.
- **In-app webview** — official links (JharBhoomi, Bhu-Naksha, JharSewa,
  news articles) open in an in-app modal (`components/in-app-webview.tsx`)
  instead of leaving the app, with an automatic "open in browser" fallback
  if a portal blocks embedding (see limitation below).
- **PDF / PNG export** — `components/export-buttons.tsx` (html2canvas +
  jsPDF) lets users download the mandi table, the news digest, and the land
  record summary card as PNG or PDF.
- **Splash screen** — `components/splash-screen.tsx` shows the app logo with
  a short branded animation on load; `public/logo.svg` is the source logo,
  rasterized to the full PWA icon set (192/512/maskable/apple-touch) by
  `scripts/generate-icons.mjs`.

## Getting started

```bash
pnpm install   # or: npm install
pnpm dev
```

`.env.local` was created for you with a real, working Web Push VAPID keypair
and a `CRON_SECRET`, so notifications work locally out of the box. See
`.env.local.example` for what each variable does — get your own free
data.gov.in key for reliable (non-rate-limited) mandi data before you rely on
this in production.

## Cron & deployment

Two endpoints are meant to be called on a schedule, not by users:

- `GET /api/cron/refresh` — warm the mandi/news cache (hourly is reasonable).
- `GET /api/cron/notify` — send the rotating push notification (every 3
  hours, i.e. 8x/day).

Both check `CRON_SECRET` (pass it as `?secret=...` or `Authorization: Bearer
...`) when that env var is set.

`vercel.json` already declares both schedules for **Vercel Cron**. Vercel's
Hobby plan limits cron frequency (historically to once/day per job on some
plan tiers) — check your current plan's limits, and if it's too restrictive,
point a free external scheduler (e.g. cron-job.org, or a GitHub Actions
workflow with `schedule:`) at the same URLs instead; the endpoints don't care
who calls them, only that the secret matches.

If you deploy anywhere other than Vercel (a VPS, Render, Railway, etc.) with
`next start`, the file-cache and subscription store persist normally on disk
— no extra setup needed. On Vercel's serverless functions the filesystem is
read-only outside `/tmp`, so both `lib/file-cache.ts` and
`lib/subscriptions.ts` transparently fall back to `/tmp`, which is *not*
shared reliably across function instances/cold starts. That's fine for a
demo; for production-scale retention notifications, swap the JSON-file store
in `lib/subscriptions.ts` for a real store (Vercel KV, Upstash Redis,
Postgres) — the read/write functions are isolated there specifically so
that swap is small.

## Known limitations (please read before shipping)

- **In-app webview**: some government portals (and some news sites) send
  `X-Frame-Options` / `Content-Security-Policy: frame-ancestors` headers that
  block embedding entirely. The webview can't reliably detect this ahead of
  time (cross-origin), so it shows a loading spinner, waits ~6 seconds, then
  offers "open in browser" if nothing rendered. This is a browser platform
  limitation, not something fixable from inside the app.
- **Background push while the app is closed** only works once this is
  deployed with `/api/cron/notify` on a real schedule (see above) *and* the
  visitor has granted notification permission and the site is served over
  HTTPS. Locally / before deployment, the client-side fallback timer covers
  the "every 3 hours" behavior only while a tab is open.
- **News source**: Google News RSS is a convenient, key-free aggregator, not
  a single authoritative publisher — attribute/verify accordingly. Swap
  `FEEDS` in `lib/news.ts` for a licensed news API or specific outlets' RSS
  if you need one canonical source.
- **Mandi data**: falls back to data.gov.in's shared public demo key if you
  don't set `DATA_GOV_IN_API_KEY`; that key is rate-limited across everyone
  using it. Get your own free key for anything beyond casual local testing.
- This app intentionally does not scrape or mirror JharBhoomi/Bhu-Naksha
  data — it links/embeds the official portals so records stay authoritative.

## Regenerating icons

If you replace `public/logo.svg`, regenerate the PNG icon set with:

```bash
pnpm icons
```
