import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search,
  MapPin,
  ChevronDown,
  Gift,
  ChevronRight,
  MessageSquare,
  Navigation,
  LocateFixed,
  X,
} from 'lucide-react'
import { categories } from '../data/categories'
import { CategoryIcon } from '../components/CategoryIcon'
import { Mark, Wordmark } from '../components/Logo'
import { ListingCard } from '../components/ListingCard'
import { LocationSheet } from '../components/LocationSheet'
import { Newsletter } from '../components/Newsletter'
import { IndependenceBanner } from '../components/IndependenceBanner'
import { NotificationBell } from '../components/NotificationBell'
import { useApp } from '../store/AppContext'
import { useGeo } from '../store/GeoContext'
import { useNotifications } from '../store/NotificationsContext'
import { haversineKm } from '../lib/geo'
import { activePromo } from '../lib/promo'
import { useLocalStorage } from '../lib/useLocalStorage'
import { locationLabel } from '../data/locations'
import type { LocationFilter } from '../types'

/** Minuscules + sans accents, pour une recherche tolérante (« telephone » ⇔ « Téléphone »). */
function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

export function Home() {
  const navigate = useNavigate()
  const { listings } = useApp()
  const [loc, setLoc] = useLocalStorage<LocationFilter>('chapci.loc.v1', {})
  const [locOpen, setLocOpen] = useState(false)
  const [q, setQ] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  // Suggestions en direct sous la barre de recherche : catégories, sous-catégories
  // et titres d'annonces qui correspondent à ce qu'on tape.
  const suggestions = useMemo(() => {
    const nq = norm(q)
    if (nq.length < 1) return []
    const out: { label: string; to: string; kind: 'cat' | 'sub' | 'ad' }[] = []
    const seen = new Set<string>()
    const add = (label: string, to: string, kind: 'cat' | 'sub' | 'ad') => {
      const key = norm(label)
      if (!key || seen.has(key)) return
      seen.add(key)
      out.push({ label, to, kind })
    }
    for (const c of categories) {
      if (norm(c.name).includes(nq)) add(c.name, `/explorer?cat=${c.id}`, 'cat')
    }
    for (const c of categories) {
      for (const s of c.subcategories) {
        if (out.length >= 8) break
        if (norm(s).includes(nq)) add(s, `/explorer?${new URLSearchParams({ cat: c.id, sub: s })}`, 'sub')
      }
    }
    for (const l of listings) {
      if (out.length >= 8) break
      if (norm(l.title).includes(nq)) add(l.title, `/explorer?q=${encodeURIComponent(l.title)}`, 'ad')
    }
    return out.slice(0, 8)
  }, [q, listings])

  const { position, status, requestLocation } = useGeo()
  const { unreadCount } = useNotifications()

  const featured = listings.filter((l) => l.featured).slice(0, 8)
  const promos = useMemo(() => listings.filter((l) => activePromo(l)).slice(0, 10), [listings])
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

  // On NE force PLUS le lieu enregistré dans la navigation : cliquer une catégorie
  // (ou « Tout voir », ou rechercher) montre TOUTES les annonces correspondantes,
  // pas seulement celles de la commune de l'utilisateur — sinon, sur une place de
  // marché encore jeune, les catégories paraissaient vides. Le filtre par lieu
  // reste disponible, explicite et effaçable, dans la page Explorer.
  function buildParams(extra: Record<string, string> = {}) {
    return new URLSearchParams(extra).toString()
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(`/explorer?${buildParams(q.trim() ? { q: q.trim() } : {})}`)
  }

  return (
    <div>
      {/* Titre principal accessible sur mobile (P19) : lu par les lecteurs
          d'écran, invisible ; sur grand écran c'est le titre héro qui sert de h1. */}
      <h1 className="sr-only md:hidden">
        Chap.ci — petites annonces et bonnes affaires en Côte d’Ivoire
      </h1>
      {/* Habillage festif « Fête de l'Indépendance » (auto : 1ᵉʳ→10 août, ou ?fete=a/b) */}
      <div className="px-4">
        <IndependenceBanner />
      </div>

      {/* En-tête orange (bannière/héro sur desktop) */}
      <header className="safe-top bg-gradient-to-b from-primary-500 to-primary-700 px-4 pb-5 pt-3 text-white md:mt-4 md:rounded-3xl md:px-10 md:pb-9 md:pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Mark size={38} variant="white" />
            <div className="leading-none">
              <Wordmark className="text-xl" ci="text-white/90" />
              <p className="mt-1 text-[11px] font-medium text-white/90 txt-legible">
                Petites annonces · Côte d’Ivoire
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/messages" className="relative rounded-full bg-white/15 p-2" aria-label="Messages">
              <MessageSquare size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-primary-500">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            {/* Cloche fonctionnelle : ouvre le menu des notifications (P5). */}
            <NotificationBell align="right" buttonClass="relative rounded-full bg-white/15 p-2 active:scale-95" />
          </div>
        </div>

        {/* Titre « héro » — visible uniquement sur grand écran */}
        <div className="hidden md:mt-6 md:block">
          <h1 className="font-display text-3xl font-extrabold leading-tight txt-legible">
            Achetez et vendez <span className="text-white/90">chap-chap</span> en Côte d’Ivoire 🇨🇮
          </h1>
          <p className="mt-1.5 text-white txt-legible">
            Des milliers d’annonces près de chez vous : voitures, téléphones, immobilier, mode, alimentation…
          </p>
        </div>

        {/* Sélecteur de lieu */}
        <button
          onClick={() => setLocOpen(true)}
          className="-ml-1.5 mt-3 flex min-h-[40px] items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-sm font-medium text-white/95 md:mt-4"
        >
          <MapPin size={16} />
          <span className="max-w-[70vw] truncate">
            {locationLabel(loc.regionId, loc.cityId, loc.commune)}
          </span>
          <ChevronDown size={16} />
        </button>

        {/* Barre de recherche (plus grande sur desktop) */}
        <form onSubmit={submitSearch} className="relative mt-3 md:mt-5 md:max-w-2xl">
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-primary-400 md:rounded-2xl md:px-5 md:py-4">
            <Search size={20} className="text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder="Rechercher une voiture, un téléphone…"
              aria-label="Rechercher"
              className="w-full bg-transparent text-[15px] text-gray-800 outline-none placeholder:text-gray-400 md:text-lg"
            />
            {q && (
              <button type="button" onClick={() => setQ('')} aria-label="Effacer" className="shrink-0 text-gray-400">
                <X size={18} />
              </button>
            )}
            <button type="submit" className="hidden rounded-xl bg-primary-500 px-5 py-2 text-sm font-semibold text-white md:block">
              Rechercher
            </button>
          </div>

          {/* Suggestions en direct (catégories, sous-catégories, titres d'annonces) */}
          {searchFocused && suggestions.length > 0 && (
            <ul className="absolute inset-x-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-xl bg-white py-1 text-gray-800 shadow-card">
              {suggestions.map((s) => (
                <li key={s.kind + s.label}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setQ('')
                      setSearchFocused(false)
                      navigate(s.to)
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left hover:bg-gray-50"
                  >
                    <Search size={16} className="shrink-0 text-gray-400" />
                    <span className="flex-1 truncate text-[15px]">{s.label}</span>
                    {s.kind === 'cat' && (
                      <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-600">
                        Catégorie
                      </span>
                    )}
                    {s.kind === 'sub' && (
                      <span className="shrink-0 text-[11px] text-gray-400">Sous-catégorie</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
      </header>

      {/* Catégories */}
      <section className="px-4 py-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Catégories</h2>
          <button
            onClick={() => navigate(`/explorer?${buildParams()}`)}
            className="-mr-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-primary-600"
          >
            Tout voir
          </button>
        </div>
        {/* 8 catégories sur mobile (2 rangées) ; toutes (2 rangées de 7) sur grand écran. */}
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {categories.map((cat, i) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/explorer?${buildParams({ cat: cat.id })}`)}
              className={`flex flex-col items-center gap-1.5 ${i >= 8 ? 'hidden sm:flex' : ''}`}
            >
              <span
                className={`grid h-14 w-14 place-items-center rounded-2xl md:h-16 md:w-16 ${cat.color}`}
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
                className="-mr-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-primary-600"
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

      {/* Bons plans (promotions) */}
      {promos.length > 0 && (
        <section className="pb-5">
          <div className="mb-3 flex items-center justify-between px-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
              🏷️ Bons plans
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
                Prix réduits
              </span>
            </h2>
            <button
              onClick={() => navigate(`/explorer?${buildParams({ promo: '1' })}`)}
              className="text-sm font-semibold text-primary-600"
            >
              Voir tout
            </button>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
            {promos.map((l) => (
              <div key={l.id} className="w-40 shrink-0">
                <ListingCard listing={l} />
              </div>
            ))}
          </div>
        </section>
      )}

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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {recent.map((l, i) => (
            <div
              key={l.id}
              className="animate-fadeup"
              style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
            >
              <ListingCard listing={l} />
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter « bons plans » */}
      <Newsletter className="mb-6" />

      <LocationSheet
        open={locOpen}
        onClose={() => setLocOpen(false)}
        value={loc}
        onApply={setLoc}
      />
    </div>
  )
}
