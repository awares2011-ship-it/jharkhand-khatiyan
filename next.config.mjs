/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for the offline APK build (Capacitor bundles `out/`).
  // NOTE: API routes are disabled in this mode — see lib/mandi.ts, lib/news.ts
  // and components/notification-optin.tsx, which all run fully client-side.
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
