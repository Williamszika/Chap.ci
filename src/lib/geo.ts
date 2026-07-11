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
  region?: string
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
 *
 * Fournisseur principal : BigDataCloud (gratuit, sans clé, CORS) — appelé sans
 * coordonnées, il déduit la position depuis l'IP et renvoie ville / région.
 */
export async function ipGeolocate(): Promise<IpLocation | null> {
  // Principal : BigDataCloud (reverse-geocode-client sans lat/lng → repli IP)
  const bdc = await fetchJson(
    'https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=fr',
  )
  if (bdc && typeof bdc.latitude === 'number' && (bdc.latitude !== 0 || bdc.longitude !== 0)) {
    return {
      lat: bdc.latitude,
      lng: bdc.longitude,
      city: bdc.city || bdc.locality,
      region: bdc.principalSubdivision,
      country: bdc.countryCode,
    }
  }
  // Repli 1 : ipwho.is (gratuit, CORS, sans clé)
  const d = await fetchJson('https://ipwho.is/')
  if (d && d.success !== false && typeof d.latitude === 'number') {
    return { lat: d.latitude, lng: d.longitude, city: d.city, region: d.region, country: d.country_code }
  }
  // Repli 2 : ipapi.co
  const d2 = await fetchJson('https://ipapi.co/json/')
  if (d2 && typeof d2.latitude === 'number') {
    return { lat: d2.latitude, lng: d2.longitude, city: d2.city, region: d2.region, country: d2.country_code }
  }
  return null
}

/**
 * Géocodage inversé (coordonnées → adresse).
 *
 * Principal : BigDataCloud — basé sur les frontières administratives, il donne
 * la ville, la commune et le quartier de façon nette (idéal pour Abidjan).
 * Repli : OpenStreetMap Nominatim.
 * Best-effort : renvoie null en cas d'échec / hors-ligne.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoAddress | null> {
  const bdc = await reverseGeocodeBigDataCloud(lat, lng)
  if (bdc) return bdc
  return reverseGeocodeNominatim(lat, lng)
}

async function reverseGeocodeBigDataCloud(lat: number, lng: number): Promise<GeoAddress | null> {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=fr`
  const data = await fetchJson(url)
  if (!data || typeof data.city !== 'string') return null

  // localityInfo.administrative est trié par niveau (order croissant = plus fin).
  // On isole le niveau le plus précis (quartier) sous la commune / ville.
  const admin: any[] = Array.isArray(data.localityInfo?.administrative)
    ? data.localityInfo.administrative
    : []
  const deepest = admin.length ? admin[admin.length - 1]?.name : undefined

  const city = data.city || data.locality || undefined
  // quartier = niveau le plus fin s'il diffère de la ville/commune
  const suburb =
    (data.locality && data.locality !== city ? data.locality : undefined) ||
    (deepest && deepest !== city ? deepest : undefined)

  const parts = [suburb, city, data.principalSubdivision].filter(Boolean)
  return {
    address: parts.join(', ') || undefined,
    city,
    suburb,
    region: data.principalSubdivision || undefined,
  }
}

async function reverseGeocodeNominatim(lat: number, lng: number): Promise<GeoAddress | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr&zoom=16`
  const data = await fetchJson(url)
  if (!data) return null
  const a = data.address ?? {}
  return {
    address: data.display_name,
    city: a.city || a.town || a.village || a.municipality,
    suburb: a.suburb || a.neighbourhood || a.quarter || a.city_district,
    region: a.state || a.region,
  }
}

/** Position GPS avec précision (rayon estimé en mètres). */
export interface Fix extends Coords {
  accuracy?: number
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

/**
 * Position GPS la plus précise possible.
 *
 * Le GPS « chauffe » : les premières lectures sont grossières (réseau/cellule),
 * puis la précision s'affine à mesure que les satellites sont acquis. On écoute
 * donc plusieurs lectures via watchPosition (enableHighAccuracy) et on garde la
 * meilleure. On s'arrête dès qu'on atteint une précision fine (≤ targetAccuracy)
 * ou au bout de maxWaitMs, en renvoyant la meilleure lecture obtenue.
 */
export function getBestPosition(
  targetAccuracy = 35,
  maxWaitMs = 12000,
): Promise<Fix> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('La géolocalisation n’est pas disponible sur cet appareil.'))
      return
    }

    let best: Fix | null = null
    let done = false
    let watchId: number | null = null

    const finish = () => {
      if (done) return
      done = true
      if (watchId != null) navigator.geolocation.clearWatch(watchId)
      clearTimeout(timer)
      if (best) resolve(best)
      else reject(new Error('Position indisponible.'))
    }

    const timer = setTimeout(finish, maxWaitMs)

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy
        const fix: Fix = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: acc,
        }
        // On garde la lecture la plus précise (accuracy la plus faible).
        if (!best || (acc != null && (best.accuracy == null || acc < best.accuracy))) {
          best = fix
        }
        // Assez précis → on arrête tôt.
        if (acc != null && acc <= targetAccuracy) finish()
      },
      (err) => {
        // On n'échoue que si aucune lecture n'a encore été obtenue.
        if (!best) {
          done = true
          if (watchId != null) navigator.geolocation.clearWatch(watchId)
          clearTimeout(timer)
          reject(err)
        }
      },
      { enableHighAccuracy: true, timeout: maxWaitMs, maximumAge: 0 },
    )
  })
}
