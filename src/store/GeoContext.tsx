import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { Coords } from '../data/coords'
import { getCurrentPosition, ipGeolocate, reverseGeocode } from '../lib/geo'
import { resolveLocationByName } from '../data/locations'

const LS_POS = 'chapci.geo.v1'
const LS_PLACE = 'chapci.place.v1'
const LS_DECIDED = 'chapci.geo.decided.v1'

type Status = 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable'

/** Lieu résolu de l'utilisateur (utilisé partout : inscription, paramètres…). */
export interface Place {
  regionId?: string
  cityId?: string
  commune?: string
  address?: string
  lat?: number
  lng?: number
  source: 'gps' | 'ip'
}

interface GeoState {
  position: Coords | null
  place: Place | null
  status: Status
  /** L'utilisateur a-t-il déjà répondu à la demande d'ouverture ? */
  decided: boolean
  /** Autoriser le GPS (déclenche la permission). Repli IP si refusé. */
  allowGps: () => Promise<void>
  /** Continuer sans GPS : géolocalisation par IP (sans permission). */
  denyGps: () => Promise<void>
  /** Alias pour compatibilité (bouton « Près de moi »). */
  requestLocation: () => Promise<void>
  clear: () => void
}

const GeoContext = createContext<GeoState | null>(null)

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function GeoProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<Coords | null>(() => load<Coords | null>(LS_POS, null))
  const [place, setPlace] = useState<Place | null>(() => load<Place | null>(LS_PLACE, null))
  const [decided, setDecided] = useState<boolean>(() => load<boolean>(LS_DECIDED, false))
  const [status, setStatus] = useState<Status>(position ? 'granted' : 'idle')

  useEffect(() => {
    if (position) localStorage.setItem(LS_POS, JSON.stringify(position))
  }, [position])
  useEffect(() => {
    if (place) localStorage.setItem(LS_PLACE, JSON.stringify(place))
  }, [place])
  useEffect(() => {
    localStorage.setItem(LS_DECIDED, JSON.stringify(decided))
  }, [decided])

  const resolvePlace = useCallback(
    async (lat: number, lng: number, source: 'gps' | 'ip', ipCity?: string, ipRegion?: string) => {
      setPosition({ lat, lng })
      const geo = await reverseGeocode(lat, lng)
      const cityName = geo?.city || ipCity
      const suburb = geo?.suburb
      const resolved = resolveLocationByName(suburb, cityName, ipRegion) ?? {}
      setPlace({
        regionId: resolved.regionId,
        cityId: resolved.cityId,
        commune: resolved.commune,
        address: suburb || geo?.address,
        lat,
        lng,
        source,
      })
    },
    [],
  )

  const captureIp = useCallback(async () => {
    setStatus('loading')
    const ip = await ipGeolocate()
    if (ip && ip.lat != null && ip.lng != null) {
      await resolvePlace(ip.lat, ip.lng, 'ip', ip.city, ip.region)
      setStatus('granted')
    } else {
      setStatus('unavailable')
    }
  }, [resolvePlace])

  // Le choix ferme le pop-up TOUT DE SUITE ; la position se résout en arrière-plan.
  const denyGps = useCallback(async () => {
    setDecided(true)
    await captureIp()
  }, [captureIp])

  const allowGps = useCallback(async () => {
    setDecided(true)
    setStatus('loading')
    try {
      const pos = await getCurrentPosition()
      await resolvePlace(pos.lat, pos.lng, 'gps')
      setStatus('granted')
    } catch {
      await captureIp() // refusé/indisponible -> repli IP
    }
  }, [resolvePlace, captureIp])

  const clear = useCallback(() => {
    setPosition(null)
    setPlace(null)
    setDecided(false)
    setStatus('idle')
    localStorage.removeItem(LS_POS)
    localStorage.removeItem(LS_PLACE)
    localStorage.removeItem(LS_DECIDED)
  }, [])

  return (
    <GeoContext.Provider
      value={{ position, place, status, decided, allowGps, denyGps, requestLocation: allowGps, clear }}
    >
      {children}
    </GeoContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGeo(): GeoState {
  const ctx = useContext(GeoContext)
  if (!ctx) throw new Error('useGeo doit être utilisé dans <GeoProvider>')
  return ctx
}
