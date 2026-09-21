// Disabled for the APK/static-export build (`output: 'export'` in
// next.config.mjs has no server, so Route Handlers can't run there and a
// build with an active handler here would fail). This file is kept only so
// the folder exists with something inert in it; it exports no HTTP method,
// so Next.js does not treat it as a route. The in-app webview now opens
// government portals with the Capacitor Browser plugin (native Custom Tabs)
// on Android, which sidesteps the X-Frame-Options problem this endpoint used
// to check for — see lib/portal.ts and components/in-app-webview.tsx.
export {}
