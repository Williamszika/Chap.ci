// Génère les icônes PNG de la PWA à partir du logo SVG.
// Usage : node scripts/generate-icons.mjs
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const iconsDir = join(root, 'public', 'icons')
mkdirSync(iconsDir, { recursive: true })

const logo = (rounded) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF9E1B"/>
      <stop offset="1" stop-color="#F26800"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="url(#g)"/>
  <path d="M256 108c-63 0-114 49-114 110 0 78 96 168 108 178a9 9 0 0 0 12 0c12-10 108-100 108-178 0-61-51-110-114-110z" fill="#ffffff" opacity="0.18"/>
  <path d="M330 196a92 92 0 1 0 0 120" fill="none" stroke="#ffffff" stroke-width="42" stroke-linecap="round"/>
  <circle cx="256" cy="256" r="14" fill="#009E60"/>
</svg>`

// Icône maskable : logo réduit centré sur fond plein (zone de sécurité)
const maskable = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF9E1B"/>
      <stop offset="1" stop-color="#F26800"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <g transform="translate(256 256) scale(0.62) translate(-256 -256)">
    <path d="M256 108c-63 0-114 49-114 110 0 78 96 168 108 178a9 9 0 0 0 12 0c12-10 108-100 108-178 0-61-51-110-114-110z" fill="#ffffff" opacity="0.20"/>
    <path d="M330 196a92 92 0 1 0 0 120" fill="none" stroke="#ffffff" stroke-width="42" stroke-linecap="round"/>
    <circle cx="256" cy="256" r="14" fill="#009E60"/>
  </g>
</svg>`

async function render(svg, size, out) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out)
  console.log('✓', out)
}

await render(logo(true), 192, join(iconsDir, 'icon-192.png'))
await render(logo(true), 512, join(iconsDir, 'icon-512.png'))
await render(maskable, 512, join(iconsDir, 'icon-maskable-512.png'))
await render(logo(true), 180, join(root, 'public', 'apple-touch-icon.png'))
console.log('Icônes générées.')
