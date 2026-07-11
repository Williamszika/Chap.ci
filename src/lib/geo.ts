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

export interface GeoAddress {
  address?: string
  city?: string
  suburb?: string
}

export interface IpLocation {
  lat: number
  lng: number
  city?: string
  region?: string
  country?: string
}

/**
 * Géolocalisation approximative par adresse IP — SANS demander de permission.
 * Renvoie une position au niveau ville. Best-effort (null si échec).
 */
export async function ipGeolocate(): Promise<IpLocation | null> {
  // Fournisseur principal : ipwho.is (gratuit, CORS, sans clé)
  try {
    const res = await fetch('https://ipwho.is/')
    if (res.ok) {
      const d = await res.json()
      if (d && d.success !== false && typeof d.latitude === 'number') {
        return { lat: d.latitude, lng: d.longitude, city: d.city, region: d.region, country: d.country_code }
      }
    }
  } catch {
    /* on tente le suivant */
  }
  // Repli : ipapi.co
  try {
    const res = await fetch('https://ipapi.co/json/')
    if (res.ok) {
      const d = await res.json()
      if (d && typeof d.latitude === 'number') {
        return { lat: d.latitude, lng: d.longitude, city: d.city, region: d.region, country: d.country_code }
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

/**
 * Géocodage inversé (coordonnées → adresse) via OpenStreetMap Nominatim.
 * Best-effort : renvoie null en cas d'échec / hors-ligne.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoAddress | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr&zoom=16`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const data = await res.json()
    const a = data.address ?? {}
    return {
      address: data.display_name,
      city: a.city || a.town || a.village || a.municipality,
      suburb: a.suburb || a.neighbourhood || a.quarter || a.city_district,
    }
  } catch {
    return null
  }
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
