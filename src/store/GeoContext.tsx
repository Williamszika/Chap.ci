import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { Coords } from '../data/coords'
import { getCurrentPosition } from '../lib/geo'

const LS_POS = 'chapci.geo.v1'

type Status = 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable'

interface GeoState {
  position: Coords | null
  status: Status
  requestLocation: () => Promise<void>
  clear: () => void
}

const GeoContext = createContext<GeoState | null>(null)

export function GeoProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<Coords | null>(() => {
    try {
      const raw = localStorage.getItem(LS_POS)
      return raw ? (JSON.parse(raw) as Coords) : null
    } catch {
      return null
    }
  })
  const [status, setStatus] = useState<Status>(position ? 'granted' : 'idle')

  useEffect(() => {
    if (position) localStorage.setItem(LS_POS, JSON.stringify(position))
  }, [position])

  const requestLocation = useCallback(async () => {
    setStatus('loading')
    try {
      const pos = await getCurrentPosition()
      setPosition(pos)
      setStatus('granted')
    } catch (e) {
      const err = e as GeolocationPositionError
      setStatus(err && err.code === 1 ? 'denied' : 'unavailable')
    }
  }, [])

  const clear = useCallback(() => {
    setPosition(null)
    setStatus('idle')
    localStorage.removeItem(LS_POS)
  }, [])

  return (
    <GeoContext.Provider value={{ position, status, requestLocation, clear }}>
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
