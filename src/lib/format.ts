// Formatage des prix et des dates en français (Côte d'Ivoire).

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value)
}

export function priceLabel(value: number, negotiable = false): string {
  if (value === 0) return 'Gratuit'
  return `${formatPrice(value)} FCFA${negotiable ? ' — à débattre' : ''}`
}

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const min = Math.floor(diff / 60000)
  if (min < 1) return "À l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `il y a ${d} j`
  const w = Math.floor(d / 7)
  if (w < 5) return `il y a ${w} sem.`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `il y a ${mo} mois`
  return `il y a ${Math.floor(d / 365)} an(s)`
}
