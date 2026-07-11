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

async function fetchJson(url: string, timeoutMs = 7000): Promise<any | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: ctrl.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
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
  const d = await fetchJson('https://ipwho.is/')
  if (d && d.success !== false && typeof d.latitude === 'number') {
    return { lat: d.latitude, lng: d.longitude, city: d.city, region: d.region, country: d.country_code }
  }
  // Repli : ipapi.co
  const d2 = await fetchJson('https://ipapi.co/json/')
  if (d2 && typeof d2.latitude === 'number') {
    return { lat: d2.latitude, lng: d2.longitude, city: d2.city, region: d2.region, country: d2.country_code }
  }
  return null
}

/**
 * Géocodage inversé (coordonnées → adresse) via OpenStreetMap Nominatim.
 * Best-effort : renvoie null en cas d'échec / hors-ligne.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoAddress | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr&zoom=16`
  const data = await fetchJson(url)
  if (!data) return null
  const a = data.address ?? {}
  return {
    address: data.display_name,
    city: a.city || a.town || a.village || a.municipality,
    suburb: a.suburb || a.neighbourhood || a.quarter || a.city_district,
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
