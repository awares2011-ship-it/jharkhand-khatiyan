// Regenerates every icon asset — web public/ icons AND the Android
// mipmap launcher icons — from public/jharkhand-khatiyan-logo.png.
// Run with: npm run icons  (needs the `sharp` devDependency installed)
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const publicDir = path.join(projectRoot, 'public')
const source = path.join(publicDir, 'jharkhand-khatiyan-logo.png')

const webJobs = [
  { size: 512, out: 'icon-512.png' },
  { size: 192, out: 'icon-192.png' },
  { size: 180, out: 'apple-icon.png' },
  { size: 32, out: 'icon-light-32x32.png' },
  { size: 32, out: 'icon-dark-32x32.png' },
  { size: 512, out: 'icon-maskable-512.png' },
]

for (const job of webJobs) {
  await sharp(source).resize(job.size, job.size, { fit: 'cover' }).png().toFile(path.join(publicDir, job.out))
  console.log('web', job.out, `${job.size}x${job.size}`)
}

// Android launcher icons. ic_launcher + ic_launcher_round at each density.
// Foreground is 108dp content (per adaptive-icon convention) at each density.
const androidResDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res')
if (fs.existsSync(androidResDir)) {
  const densities = [
    { dir: 'mipmap-mdpi', size: 48, fg: 108 },
    { dir: 'mipmap-hdpi', size: 72, fg: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fg: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fg: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fg: 432 },
  ]
  for (const d of densities) {
    const outDir = path.join(androidResDir, d.dir)
    if (!fs.existsSync(outDir)) continue
    await sharp(source).resize(d.size, d.size, { fit: 'cover' }).png().toFile(path.join(outDir, 'ic_launcher.png'))
    await sharp(source)
      .resize(d.size, d.size, { fit: 'cover' })
      .composite([
        {
          input: Buffer.from(
            `<svg xmlns='http://www.w3.org/2000/svg' width='${d.size}' height='${d.size}'><rect width='${d.size}' height='${d.size}' rx='${d.size / 2}' ry='${d.size / 2}' fill='white'/></svg>`,
          ),
          blend: 'dest-in',
        },
      ])
      .png()
      .toFile(path.join(outDir, 'ic_launcher_round.png'))
    // adaptive foreground — center the artwork on a transparent 108dp canvas (0.72 safe zone)
    const safe = Math.round(d.fg * 0.72)
    const padded = await sharp(source).resize(safe, safe, { fit: 'cover' }).png().toBuffer()
    await sharp({ create: { width: d.fg, height: d.fg, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: padded, top: Math.round((d.fg - safe) / 2), left: Math.round((d.fg - safe) / 2) }])
      .png()
      .toFile(path.join(outDir, 'ic_launcher_foreground.png'))
    console.log('android', d.dir, `${d.size}x${d.size}`)
  }

  // Flat background colour drawable — switch the adaptive background to Jharkhand green.
  const bgXmlPath = path.join(androidResDir, 'values', 'ic_launcher_background.xml')
  if (fs.existsSync(bgXmlPath)) {
    fs.writeFileSync(
      bgXmlPath,
      `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1c5a3b</color>\n</resources>\n`,
    )
    console.log('android ic_launcher_background → #1c5a3b')
  }
}

// Vertical splash screen fallback — Jharkhand green with the centered logo.
await sharp({ create: { width: 1242, height: 2688, channels: 4, background: '#1c5a3b' } })
  .composite([
    {
      input: await sharp(source).resize(560, 560).png().toBuffer(),
      top: Math.round((2688 - 560) / 2) - 120,
      left: Math.round((1242 - 560) / 2),
    },
  ])
  .png()
  .toFile(path.join(publicDir, 'splash-fallback.png'))
console.log('splash-fallback.png')
