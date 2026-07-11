import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search,
  MapPin,
  ChevronDown,
  Bell,
  Gift,
  ChevronRight,
  MessageSquare,
  Navigation,
  LocateFixed,
} from 'lucide-react'
import { categories } from '../data/categories'
import { CategoryIcon } from '../components/CategoryIcon'
import { ListingCard } from '../components/ListingCard'
import { LocationSheet } from '../components/LocationSheet'
import { useApp } from '../store/AppContext'
import { useGeo } from '../store/GeoContext'
import { haversineKm } from '../lib/geo'
import { useLocalStorage } from '../lib/useLocalStorage'
import { locationLabel } from '../data/locations'
import type { LocationFilter } from '../types'

export function Home() {
  const navigate = useNavigate()
  const { listings } = useApp()
  const [loc, setLoc] = useLocalStorage<LocationFilter>('chapci.loc.v1', {})
  const [locOpen, setLocOpen] = useState(false)
  const [q, setQ] = useState('')

  const { position, status, requestLocation } = useGeo()

  const featured = listings.filter((l) => l.featured).slice(0, 8)
  const recent = listings.slice(0, 12)

  const nearby = useMemo(() => {
    if (!position) return []
    return listings
      .filter((l) => l.lat != null && l.lng != null)
      .map((l) => ({ l, d: haversineKm(position, { lat: l.lat!, lng: l.lng! }) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 8)
      .map((x) => x.l)
  }, [listings, position])

  function buildParams(extra: Record<string, string> = {}) {
    const p = new URLSearchParams(extra)
    if (loc.regionId) p.set('region', loc.regionId)
    if (loc.cityId) p.set('ville', loc.cityId)
    if (loc.commune) p.set('commune', loc.commune)
    return p.toString()
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(`/explorer?${buildParams(q.trim() ? { q: q.trim() } : {})}`)
  }

  return (
    <div>
      {/* En-tête orange */}
      <header className="safe-top bg-gradient-to-b from-primary-500 to-primary-600 px-4 pb-5 pt-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 text-lg font-black">
              C
            </div>
            <div className="leading-none">
              <p className="text-xl font-black tracking-tight">Chap.ci</p>
              <p className="text-[11px] font-medium text-white/80">
                Petites annonces · Côte d’Ivoire
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/messages" className="rounded-full bg-white/15 p-2" aria-label="Messages">
              <MessageSquare size={20} />
            </Link>
            <button className="relative rounded-full bg-white/15 p-2" aria-label="Notifications">
              <Bell size={20} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-400" />
            </button>
          </div>
        </div>

        {/* Sélecteur de lieu */}
        <button
          onClick={() => setLocOpen(true)}
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-white/95"
        >
          <MapPin size={16} />
          <span className="max-w-[70vw] truncate">
            {locationLabel(loc.regionId, loc.cityId, loc.commune)}
          </span>
          <ChevronDown size={16} />
        </button>

        {/* Barre de recherche */}
        <form onSubmit={submitSearch} className="mt-3">
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm">
            <Search size={20} className="text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une voiture, un téléphone…"
              className="w-full bg-transparent text-[15px] text-gray-800 outline-none placeholder:text-gray-400"
            />
          </div>
        </form>
      </header>

      {/* Catégories */}
      <section className="px-4 py-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Catégories</h2>
          <button
            onClick={() => navigate(`/explorer?${buildParams()}`)}
            className="text-sm font-semibold text-primary-600"
          >
            Tout voir
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {categories.slice(0, 8).map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/explorer?${buildParams({ cat: cat.id })}`)}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className={`grid h-14 w-14 place-items-center rounded-2xl ${cat.color}`}
              >
                <CategoryIcon name={cat.icon} size={24} />
              </span>
              <span className="text-center text-[11px] font-medium leading-tight text-gray-700">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Près de vous */}
      {position ? (
        nearby.length > 0 && (
          <section className="pb-5">
            <div className="mb-3 flex items-center justify-between px-4">
              <h2 className="text-base font-bold text-gray-900">📍 Près de vous</h2>
              <button
                onClick={() => navigate(`/explorer?${buildParams({ tri: 'distance' })}`)}
                className="text-sm font-semibold text-primary-600"
              >
                Voir plus
              </button>
            </div>
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
              {nearby.map((l) => (
                <div key={l.id} className="w-40 shrink-0">
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>
          </section>
        )
      ) : (
        <div className="px-4 pb-5">
          <button
            onClick={requestLocation}
            disabled={status === 'loading'}
            className="flex w-full items-center gap-3 rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-left active:scale-[0.99]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-500 text-white">
              <LocateFixed size={20} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-primary-800">
                {status === 'loading' ? 'Localisation…' : 'Voir les annonces près de moi'}
              </p>
              <p className="text-xs text-primary-600">
                {status === 'denied'
                  ? 'Autorisez la localisation dans votre navigateur'
                  : 'Activez votre position pour trier par distance'}
              </p>
            </div>
            <Navigation size={20} className="text-primary-500" />
          </button>
        </div>
      )}

      {/* Bannière don */}
      <Link
        to="/don"
        className="mx-4 mb-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-ivoire-green to-emerald-500 px-4 py-3 text-white shadow-card active:scale-[0.99]"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20">
          <Gift size={22} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold">Soutenir Chap.ci 🇨🇮</p>
          <p className="text-xs text-white/85">Faites un don par Mobile Money</p>
        </div>
        <ChevronRight size={20} className="text-white/80" />
      </Link>

      {/* À la une */}
      {featured.length > 0 && (
        <section className="pb-5">
          <div className="mb-3 flex items-center justify-between px-4">
            <h2 className="text-base font-bold text-gray-900">🔥 À la une</h2>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
            {featured.map((l) => (
              <div key={l.id} className="w-40 shrink-0">
                <ListingCard listing={l} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Annonces récentes */}
      <section className="px-4 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Annonces récentes</h2>
          <button
            onClick={() => navigate(`/explorer?${buildParams({ tri: 'recent' })}`)}
            className="text-sm font-semibold text-primary-600"
          >
            Voir plus
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {recent.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>

      <LocationSheet
        open={locOpen}
        onClose={() => setLocOpen(false)}
        value={loc}
        onApply={setLoc}
      />
    </div>
  )
}
