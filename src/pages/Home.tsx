import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
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
  Store,
  PlusCircle,
} from 'lucide-react'
import { categories } from '../data/categories'
import { PromoBanner } from '../components/PromoBanner'
import { CategoryIcon } from '../components/CategoryIcon'
import { Mark, Wordmark } from '../components/Logo'
import { ListingCard } from '../components/ListingCard'
import { ListingCardSkeleton } from '../components/ListingCardSkeleton'
import { SellNearYou } from '../components/SellNearYou'
import { LocationSheet } from '../components/LocationSheet'
import { Newsletter } from '../components/Newsletter'
import { IndependenceBanner } from '../components/IndependenceBanner'
import { NotificationBell } from '../components/NotificationBell'
import { useApp } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'
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
  const { search } = useLocation()
  const { listings, loading } = useApp()
  const { user } = useAuth()
  // Activation : on invite à publier tant que la personne n'a pas d'annonce
  // (visiteur non connecté, ou compte sans aucune annonce en ligne).
  const myListingsCount = user ? listings.filter((l) => l.sellerId === user.id).length : 0
  const showSellCta = !user || myListingsCount === 0

  // Lien profond /?voir=categories (pied de page) : défile jusqu'à la grille
  // des catégories.
  useEffect(() => {
    if (new URLSearchParams(search).get('voir') !== 'categories') return
    const t = setTimeout(() => {
      document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
    return () => clearTimeout(t)
  }, [search])
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
      <header className="safe-top flex min-h-[268px] flex-col justify-center bg-[radial-gradient(75%_120%_at_50%_-15%,rgba(255,255,255,0.22),transparent_62%),linear-gradient(to_bottom,#F77F00,#D95F00)] px-4 pb-5 pt-4 text-white md:mt-4 md:min-h-[290px] md:rounded-3xl md:px-8 md:pb-7 md:pt-7">
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

        {/* Titre « héro » — compact (l'accent visuel est mis sur la bannière pub) */}
        <div className="mt-2.5 md:mt-3.5">
          {/* Desktop : titre (sert de h1 sur grand écran) */}
          <h1 className="hidden font-display text-2xl font-extrabold leading-tight txt-legible md:block">
            Achetez et vendez <span className="text-white/90">chap-chap</span> en Côte d’Ivoire 🇨🇮
          </h1>
          <p className="mt-1 hidden text-sm text-white txt-legible md:block">
            Des milliers d’annonces près de chez vous : voitures, téléphones, immobilier, mode…
          </p>
          {/* Mobile : accroche courte et punchy (le h1 mobile reste le sr-only ci-dessus) */}
          <p className="font-display text-[17px] font-extrabold leading-tight txt-legible md:hidden">
            Achetez &amp; vendez <span className="text-white/90">chap-chap</span> 🇨🇮
          </p>
        </div>

        {/* Sélecteur de lieu */}
        <button
          onClick={() => setLocOpen(true)}
          className="-ml-1.5 mt-2 flex min-h-[44px] items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-sm font-medium text-white/95 md:mt-2.5"
        >
          <MapPin size={16} />
          <span className="max-w-[70vw] truncate">
            {locationLabel(loc.regionId, loc.cityId, loc.commune)}
          </span>
          <ChevronDown size={16} />
        </button>

        {/* Barre de recherche (plus grande sur desktop) */}
        <form onSubmit={submitSearch} className="relative mt-2.5 md:mt-3.5 md:max-w-2xl">
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-primary-400 md:rounded-2xl md:px-5 md:py-3">
            <Search size={20} className="text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder="Rechercher une voiture, un téléphone…"
              aria-label="Rechercher"
              className="w-full bg-transparent text-[16px] text-gray-800 outline-none placeholder:text-gray-400 md:text-lg"
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

      {/* Bannière publicitaire / mise en avant */}
      <PromoBanner />

      {/* Activation vendeur : « Publiez votre 1ʳᵉ annonce gratuitement » */}
      {showSellCta && (
        <section className="px-4 pt-4">
          <Link
            to="/publier"
            className="txt-legible flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-4 text-white shadow-card transition active:scale-[0.99] md:hover:brightness-[1.03]"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/20">
              <Store size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-black leading-tight">Vous avez un truc à vendre&nbsp;? 🇨🇮</p>
              <p className="mt-0.5 text-sm text-white/90">
                Publiez votre 1ʳᵉ annonce <b>gratuitement</b> — en ligne en 2 minutes.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm font-bold text-primary-700 shadow-sm">
              <PlusCircle size={16} /> Publier
            </span>
          </Link>
        </section>
      )}

      {/* Catégories */}
      <section id="categories" className="scroll-mt-20 px-4 py-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[17px] font-extrabold tracking-tight text-gray-900">Catégories</h2>
          <button
            onClick={() => navigate(`/explorer?${buildParams()}`)}
            className="-mr-2 inline-flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-primary-600 transition active:scale-95"
          >
            Tout voir <ChevronRight size={15} />
          </button>
        </div>
        {/* 8 catégories sur mobile (2 rangées) ; toutes (2 rangées de 7) sur grand écran. */}
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {categories.map((cat, i) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/explorer?${buildParams({ cat: cat.id })}`)}
              className={`flex flex-col items-center gap-1.5 transition active:scale-95 ${i >= 8 ? 'hidden sm:flex' : ''}`}
            >
              <span
                className={`grid h-14 w-14 place-items-center rounded-2xl shadow-sm md:h-16 md:w-16 ${cat.color}`}
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

      {/* Vendez près de chez vous — cartes vers les pages SEO /vendre (maillage
          interne + funnel publication). Rendu par un composant dédié. */}
      <SellNearYou />

      {/* Près de vous */}
      {position ? (
        nearby.length > 0 && (
          <section className="pb-5">
            <div className="mb-3 flex items-center justify-between px-4">
              <h2 className="font-display text-[17px] font-extrabold tracking-tight text-gray-900">📍 Près de vous</h2>
              <button
                onClick={() => navigate(`/explorer?${buildParams({ tri: 'distance' })}`)}
                className="-mr-2 inline-flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-primary-600 transition active:scale-95"
              >
                Voir plus <ChevronRight size={15} />
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
        className="txt-legible mx-4 mb-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-ivoire-green to-ivoire-green px-4 py-3 text-white shadow-card active:scale-[0.99]"
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
            <h2 className="flex items-center gap-2 font-display text-[17px] font-extrabold tracking-tight text-gray-900">
              🏷️ Bons plans
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
                Prix réduits
              </span>
            </h2>
            <button
              onClick={() => navigate(`/explorer?${buildParams({ promo: '1' })}`)}
              className="-mr-2 inline-flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-primary-600 transition active:scale-95"
            >
              Voir tout <ChevronRight size={15} />
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
            <h2 className="font-display text-[17px] font-extrabold tracking-tight text-gray-900">🔥 À la une</h2>
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

      {/* Annonces récentes — vitrine principale, séparée par une fine ligne */}
      <section className="border-t border-gray-100 px-4 pb-6 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[17px] font-extrabold tracking-tight text-gray-900">Annonces récentes</h2>
          <button
            onClick={() => navigate(`/explorer?${buildParams({ tri: 'recent' })}`)}
            className="-mr-2 inline-flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-primary-600 transition active:scale-95"
          >
            Voir plus <ChevronRight size={15} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {loading && recent.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)
            : recent.map((l, i) => (
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
