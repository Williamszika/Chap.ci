// Génère les icônes PNG de la PWA depuis le kit de marque.
//
// Le signe « chap-chap » n'est PAS dessiné ici : la source de vérité est
// `marque/1-logo-nouveau/` (livraison du bureau de design, 26/08/2026). Ce
// script se contente de décliner les tailles que le manifeste attend — si le
// logo change un jour, remplacez les fichiers du kit et relancez :
//
//   node scripts/generate-icons.mjs
import sharp from 'sharp'
import { copyFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const kit = join(root, 'marque', '1-logo-nouveau', 'fichiers', 'application')
const iconsDir = join(root, 'public', 'icons')
mkdirSync(iconsDir, { recursive: true })

// L'icône « pleine » (champ orange, signe encre — 6,62:1, conforme AA) et la
// maskable (mêmes couleurs, signe inscrit dans la zone de sécurité).
const icone = join(kit, 'app-icon-512.png')
const maskable = join(kit, 'maskable-512.png')

async function decliner(source, size, out) {
  await sharp(source).resize(size, size).png().toFile(out)
  console.log('✓', out)
}

await decliner(icone, 192, join(iconsDir, 'icon-192.png'))
await decliner(icone, 512, join(iconsDir, 'icon-512.png'))
await decliner(maskable, 192, join(iconsDir, 'icon-maskable-192.png'))
await decliner(maskable, 512, join(iconsDir, 'icon-maskable-512.png'))

// L'apple-touch-icon du kit est dessinée à sa taille (180 px) : on la copie
// telle quelle plutôt que d'en fabriquer une par réduction.
copyFileSync(join(kit, 'apple-touch-icon.png'), join(root, 'public', 'apple-touch-icon.png'))
console.log('✓', join(root, 'public', 'apple-touch-icon.png'), '(copie du kit)')
console.log('Icônes générées depuis le kit de marque.')
