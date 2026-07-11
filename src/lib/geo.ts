import type { Coords } from '../data/coords'

/** Distance en kilomètres entre deux points GPS (formule de Haversine). */
export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371 // rayon terrestre (km)
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

function toRad(d: number): number {
  return (d * Math.PI) / 180
}

/** Formate une distance pour l'affichage (m / km). */
export function formatDistance(km: number): string {
  if (km < 1) return `à ${Math.max(50, Math.round(km * 1000 / 50) * 50)} m`
  if (km < 10) return `à ${km.toFixed(1).replace('.', ',')} km`
  if (km < 500) return `à ${Math.round(km)} km`
  return 'loin'
}

/** Récupère la position GPS actuelle de l'utilisateur (avec permission). */
export function getCurrentPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('La géolocalisation n’est pas disponible sur cet appareil.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  })
}
