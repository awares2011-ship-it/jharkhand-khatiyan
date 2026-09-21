import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SplashScreen } from '@/components/splash-screen'
import { ServiceWorkerRegister } from '@/components/service-worker-register'

const title = 'JharBhoomi Info | झारखंड भूमि रिकॉर्ड और किसान सेवाएं'
const description = 'झारखंड भूमि रिकॉर्ड, खाता, Register-II, भू-नक्शा, दाखिल-खारिज, लगान, मंडी भाव, समाचार और किसान सेवाओं के लिए स्वतंत्र हिंदी-first सूचना मंच।'

export const metadata: Metadata = {
  title,
  description,
  keywords: ['Jharkhand land record', 'JharBhoomi', 'Jharkhand Bhulekh', 'झारखंड भूमि रिकॉर्ड', 'झारखंड खाता', 'झारखंड भू नक्शा', 'दाखिल खारिज', 'मंडी भाव झारखंड', 'झारखंड समाचार'],
  alternates: { canonical: '/' },
  openGraph: { title, description, type: 'website', locale: 'hi_IN' },
  twitter: { card: 'summary_large_image', title, description },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'JharBhoomi',
  },
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#2f6b4f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hi">
      <body className="antialiased">
        <SplashScreen />
        <ServiceWorkerRegister />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
