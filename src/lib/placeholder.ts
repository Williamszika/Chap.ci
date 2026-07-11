// Génère des images de substitution (placeholder) en SVG data-URI.
// 100% hors-ligne : aucune requête réseau, idéal pour une PWA / app native.

const palettes: [string, string][] = [
  ['#F77F00', '#FFB703'],
  ['#009E60', '#57cc99'],
  ['#3a86ff', '#4cc9f0'],
  ['#8338ec', '#b5179e'],
  ['#ef476f', '#ff8fa3'],
  ['#118ab2', '#06d6a0'],
  ['#fb5607', '#ffbe0b'],
  ['#7209b7', '#f72585'],
]

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

/**
 * Retourne une image SVG (data-URI) avec un dégradé et un emoji/label.
 */
export function placeholderImage(seed: string, emoji = '📦', label = ''): string {
  const [c1, c2] = palettes[hash(seed) % palettes.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/>
        <stop offset="1" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#g)"/>
    <text x="400" y="300" font-size="180" text-anchor="middle" dominant-baseline="central">${emoji}</text>
    ${
      label
        ? `<text x="400" y="470" font-size="34" fill="rgba(255,255,255,0.92)" font-family="Inter, Arial, sans-serif" font-weight="700" text-anchor="middle">${escapeXml(
            label,
          )}</text>`
        : ''
    }
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Emojis par catégorie, pour enrichir les placeholders */
export const categoryEmoji: Record<string, string> = {
  vehicules: '🚗',
  immobilier: '🏠',
  telephones: '📱',
  electronique: '💻',
  maison: '🛋️',
  mode: '👗',
  emploi: '💼',
  services: '🛠️',
  'materiel-pro': '🏗️',
  agriculture: '🌱',
  loisirs: '🏋️',
  bebe: '🍼',
}

/** Emojis affinés par sous-catégorie (motif recherché en minuscules) */
const subEmoji: Record<string, string> = {
  moto: '🏍️',
  scooter: '🏍️',
  camion: '🚚',
  bateau: '⛵',
  terrain: '🏞️',
  vente: '🏡',
  bureau: '🏢',
  commerce: '🏪',
  ordinateur: '💻',
  tv: '📺',
  écran: '📺',
  audio: '🎧',
  'jeux vidéo': '🎮',
  photo: '📷',
  électroménager: '🧊',
  meuble: '🛋️',
  décoration: '🖼️',
  cuisine: '🍳',
  chaussure: '👟',
  sac: '👜',
  pagne: '🧵',
  beauté: '💄',
  cacao: '🍫',
  élevage: '🐔',
  vivrier: '🥬',
  vélo: '🚲',
  musique: '🎸',
  livre: '📚',
  jouet: '🧸',
  poussette: '👶',
  couture: '🧵',
  restauration: '🍽️',
  agriculture: '🚜',
}

/** Choisit l'emoji le plus pertinent selon la catégorie et la sous-catégorie. */
export function emojiFor(categoryId: string, subcategory?: string): string {
  if (subcategory) {
    const s = subcategory.toLowerCase()
    for (const [key, emo] of Object.entries(subEmoji)) {
      if (s.includes(key)) return emo
    }
  }
  return categoryEmoji[categoryId] ?? '📦'
}
