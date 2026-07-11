import { Navigation, Loader2 } from 'lucide-react'
import { useGeo } from '../store/GeoContext'
import { locationLabel } from '../data/locations'
import { Mark, Wordmark } from './Logo'

/**
 * Pop-up affiché à l'ouverture du site : demande d'autoriser la localisation.
 * - Autoriser → position GPS exacte (repli IP si refusé au niveau navigateur).
 * - Continuer sans → géolocalisation approximative par IP.
 * La position est mémorisée et réutilisée partout (inscription, paramètres…).
 */
export function LocationGate() {
  const { decided, status, place, allowGps, denyGps } = useGeo()
  if (decided) return null

  const busy = status === 'loading'

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 w-full max-w-app rounded-t-3xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex flex-col items-center">
          <Mark size={60} />
          <Wordmark className="mt-2 text-xl text-ink" />
        </div>
        <h2 className="text-center text-xl font-display font-extrabold text-gray-900">
          Activer votre position
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Chap.ci utilise votre position pour vous montrer les annonces proches de vous et
          faciliter la création de votre compte. Vous pouvez la modifier à tout moment.
        </p>

        {place && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-2 text-center text-sm font-medium text-emerald-700">
            📍 {locationLabel(place.regionId, place.cityId, place.commune)}
          </p>
        )}

        <div className="mt-5 space-y-2">
          <button onClick={allowGps} disabled={busy} className="btn-primary w-full py-3.5 text-base">
            {busy ? <Loader2 size={20} className="animate-spin" /> : <><Navigation size={18} /> Autoriser ma position</>}
          </button>
          <button onClick={denyGps} disabled={busy} className="btn-outline w-full py-3">
            Continuer sans (localisation approximative)
          </button>
        </div>
      </div>
    </div>
  )
}
