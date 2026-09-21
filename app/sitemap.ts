import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', 'jharkhand-land-record', 'jharkhand-bhulekh', 'jharbhoomi', 'jharkhand-khata', 'jharkhand-register-2', 'jharkhand-bhu-naksha', 'jharkhand-mutation', 'jharkhand-lagan', 'jharkhand-land-map', 'jharkhand-land-measurement', 'jharkhand-government-schemes', 'jharkhand-farmer-schemes', 'jharkhand-mandi-bhav', 'jharkhand-weather']
  return routes.map((route) => ({ url: `https://jharbhoomi-info.vercel.app/${route}`, lastModified: new Date('2026-09-21'), changeFrequency: route === '' ? 'daily' : 'weekly', priority: route === '' ? 1 : 0.7 }))
}
