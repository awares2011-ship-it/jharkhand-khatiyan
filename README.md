# JharBhoomi Info

An independent, Hindi-first Next.js app for Jharkhand land records and farmer
services: live mandi (market) rates, a news feed, an in-app link to official
government portals, PDF/PNG export, and a branded splash screen. Ships as a
static export (`output: 'export'` in `next.config.mjs`) so [Capacitor](https://capacitorjs.com/)
can package it into an Android APK/AAB for the Play Store.

**Not affiliated with the Government of Jharkhand.** It links to official
portals but doesn't copy or store legal records.

## What's implemented

- **Live mandi rates** (`lib/mandi.ts`) — fetched client-side from
  data.gov.in's Agmarknet dataset, cached in `localStorage`
  (`lib/cache-client.ts`) so a repeat visit isn't a cold start, with a
  bundled-sample fallback if the live call fails or is rate-limited.
- **News section** (`lib/news.ts`) — aggregates Hindi-language Google News
  RSS feeds for land records, farmer schemes, mandi prices and general
  Jharkhand news, same caching/fallback pattern. Both refresh automatically
  every 30 minutes while the app is open, or on demand via the "रीफ्रेश"
  button.
- **Smart multi-color notifications** (`components/notification-optin.tsx`,
  `lib/notifications.ts`) — a real `Notification` fires on a rotating 3-hour
  cadence, cycling through 4 color themes (saffron / green / blue / rose)
  with matching message pools (mandi alert, scheme alert, land-record
  reminder, news digest). **Local-only**: this only fires while the app is
  open (foreground) — there's no server here to deliver it in the
  background. See **Adding real background notifications** below if you need
  that.
- **Portal links** (`lib/portal.ts`) — tapping an official-portal link
  (JharBhoomi, Bhu-Naksha, JharSewa, a news article) opens the real site
  directly rather than trying to embed it in an iframe: most `.gov.in` sites
  send `X-Frame-Options` headers that block framing outright, so an embedded
  "webview" would just show a broken/blank frame. On Android this opens a
  Chrome Custom Tab via `@capacitor/browser` (stays inside the app, no
  browser chrome switch); everywhere else it's a normal new tab.
- **PDF / PNG export** (`components/export-buttons.tsx`, html2canvas +
  jsPDF) — download the mandi table, the news digest, and the land record
  summary card as PNG or PDF.
- **Splash screen** (`components/splash-screen.tsx`) — the app logo with a
  short branded animation on load. `public/logo.svg` is the source logo,
  rasterized to the full PWA icon set (192/512/maskable/apple-touch) by
  `scripts/generate-icons.mjs` — regenerate with `pnpm icons` if you replace it.
- **Installable PWA** — `public/manifest.webmanifest` + `public/sw.js` make
  the web build installable to a home screen even outside the Android app.

## Getting started (web / PWA)

```bash
pnpm install
pnpm dev
```

`.env.local` already exists with sensible defaults — every feature has a
built-in fallback, so nothing is required to run locally. Get your own free
`DATA_GOV_IN_API_KEY` (see `.env.local.example`) before relying on mandi
data in production; the shared public demo key is rate-limited across
everyone using it.

## Building the Android APK/AAB

```bash
pnpm build        # next build --> static site in out/
npx cap sync android
```

Then open `android/` in Android Studio, build a signed AAB with your
keystore, and upload it to Play Console as usual. `capacitor.config.ts` sets
the app id (`com.jharbhoomi.info`) and app name — change those there if
needed before your first release build.

## Release Builds (APK / AAB)

### Prerequisites

1. A release keystore file — create one if you don't have it:
   ```bash
   keytool -genkey -v -keystore android/jharbhoomi-release.keystore \
     -alias jharbhoomi -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure signing — edit `android/keystore.properties`:
   ```properties
   storeFile=jharbhoomi-release.keystore
   storePassword=<your-store-password>
   keyAlias=jharbhoomi
   keyPassword=<your-key-password>
   ```

   > **Security note:** `keystore.properties` and `*.keystore` are `.gitignore`d.
   > Never commit your real keystore or passwords to GitHub. When publishing a
   > GitHub Actions build, store them as repository secrets instead.

### Build from the command line

```bash
# 1. Build the static web export
pnpm build

# 2. Sync it into the Android project
npx cap sync android

# 3. Build a signed Release AAB (recommended for Play Store)
cd android
./gradlew bundleRelease

#   -- OR -- build a signed Release APK (sideload / share)
./gradlew assembleRelease
```

Output locations:

- **AAB:** `android/app/build/outputs/bundle/release/app-release.aab`
- **APK:** `android/app/build/outputs/apk/release/app-release.apk`

Both are signed with the keystore configured in `keystore.properties`.
You can verify the signature with:

```bash
apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk
```

### Play Store checklist before uploading

- [ ] Bump `versionCode` and `versionName` in `android/app/build.gradle`.
- [ ] Fill in the Play Console "Data safety" form — this app collects **no**
      personal data; see [PRIVACY.md](PRIVACY.md).
- [ ] Paste the hosted URL of [PRIVACY.md](PRIVACY.md) (e.g. a GitHub Pages
      link) into the Play Console "Privacy policy" field.
- [ ] Declare the AdMob ads permission if ads are enabled.
- [ ] Add the app listing description, feature graphic (1024×500), and
      512×512 icon from `public/`.

## Adding real background notifications

The current setup only notifies while the app is open. To get true
background delivery (the app closed, notification still arrives), pick one:

- **Web Push from a live server** — deploy a version of this app with its
  `output: 'export'` removed and API routes restored (an earlier version of
  this project had `/api/cron/notify` + the `web-push` package wired up for
  exactly this) to something like Vercel, and point Capacitor's `server.url`
  in `capacitor.config.ts` at that live URL instead of bundling `out/`
  locally. This also brings back true cron-refreshed data instead of
  refresh-on-open.
- **Native push (Capacitor + Firebase Cloud Messaging)** — keep the static
  bundle, add `@capacitor/push-notifications`, set up a Firebase project,
  and send from Firebase's console/API on a schedule. More setup (Firebase
  project, `google-services.json`) but doesn't require hosting a server
  yourself.

## Known limitations (please read before shipping)

- **Portal links**: always open the real site directly (Custom Tab on
  Android, new tab elsewhere) rather than embedding — see above. This is a
  deliberate choice, not a bug: virtually no Indian government portal allows
  iframe embedding.
- **Background notifications / cron-refreshed data**: local-only for now —
  see **Adding real background notifications** above.
- **News source**: Google News RSS is a convenient, key-free aggregator, not
  a single authoritative publisher — attribute/verify accordingly. Swap
  `FEEDS` in `lib/news.ts` for a licensed news API or specific outlets' RSS
  if you need one canonical source.
- **Mandi data**: falls back to data.gov.in's shared public demo key if you
  don't set `DATA_GOV_IN_API_KEY`; get your own free key for anything beyond
  casual local testing.
- This app intentionally does not scrape or mirror JharBhoomi/Bhu-Naksha
  data — it links to the official portals so records stay authoritative.
