// Regenerates public/*.png icon assets from public/logo.svg.
// Run with: npm run icons  (needs the `sharp` devDependency installed)
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const publicDir = path.join(projectRoot, 'public')

const roundedSvg = fs.readFileSync(path.join(publicDir, 'logo.svg'), 'utf8')
const squareSvg = roundedSvg.replace('rx="116"', 'rx="0"')

const jobs = [
  { svg: roundedSvg, size: 512, out: 'icon-512.png' },
  { svg: roundedSvg, size: 192, out: 'icon-192.png' },
  { svg: roundedSvg, size: 180, out: 'apple-icon.png' },
  { svg: roundedSvg, size: 32, out: 'icon-light-32x32.png' },
  { svg: roundedSvg, size: 32, out: 'icon-dark-32x32.png' },
  { svg: squareSvg, size: 512, out: 'icon-maskable-512.png' },
]

for (const job of jobs) {
  await sharp(Buffer.from(job.svg)).resize(job.size, job.size).png().toFile(path.join(publicDir, job.out))
  console.log('wrote', job.out, `${job.size}x${job.size}`)
}

await sharp({ create: { width: 1242, height: 2688, channels: 4, background: '#204d38' } })
  .composite([
    {
      input: await sharp(Buffer.from(roundedSvg)).resize(420, 420).png().toBuffer(),
      top: Math.round((2688 - 420) / 2) - 80,
      left: Math.round((1242 - 420) / 2),
    },
  ])
  .png()
  .toFile(path.join(publicDir, 'splash-fallback.png'))
console.log('wrote splash-fallback.png')
