import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Search, SlidersHorizontal, MapPin, X, ChevronDown, Navigation, Truck, Tag, Bell, Check, Store, PlusCircle } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'
import { useGeo } from '../store/GeoContext'
import { haversineKm } from '../lib/geo'
import { activePromo } from '../lib/promo'
import { recordInterest } from '../lib/interests'
import { createSavedSearch, savedSearchesEnabled } from '../lib/api'
import { ListingCard } from '../components/ListingCard'
import { LocationSheet } from '../components/LocationSheet'
import { Sheet } from '../components/Sheet'
import { categories, categoryById } from '../data/categories'
import { formFor } from '../data/categoryForms'
import { locationLabel } from '../data/locations'
import { correspond, preparer, type TextePrepare } from '../lib/recherche'
import type { Listing, LocationFilter } from '../types'

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Le texte d'une annonce tel que la recherche le lit : titre, description,
 * sous-catégorie, nom de la catégorie (« voiture » trouve la catégorie
 * Véhicules), et les VALEURS des attributs — une marque saisie dans le
 * formulaire mais absente du titre se cherche aussi.
 */
function texteRecherche(l: Listing): string {
  const catName = categoryById(l.categoryId)?.name ?? ''
  const attrs = Object.values(l.attributes ?? {}).filter((v) => typeof v === 'string' || typeof v === 'number').join(' ')
  return `${l.title} ${l.description} ${l.subcategory ?? ''} ${catName} ${attrs}`
}

type Sort = 'recent' | 'prix-asc' | 'prix-desc' | 'distance'

export function Browse() {
  const navigate = useNavigate()
  const { listings } = useApp()
  const { user } = useAuth()
  const { position, status, requestLocation } = useGeo()
  const [params, setParams] = useSearchParams()
  const [locOpen, setLocOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  const q = params.get('q') ?? ''
  const cat = params.get('cat') ?? ''
  const sub = params.get('sub') ?? ''
  const cond = params.get('cond') ?? ''
  const min = params.get('min') ?? ''
  const max = params.get('max') ?? ''
  const livr = params.get('livr') ?? ''
  const promoOnly = params.get('promo') === '1'
  const tri = (params.get('tri') as Sort) ?? 'recent'
  const loc: LocationFilter = {
    regionId: params.get('region') ?? undefined,
    cityId: params.get('ville') ?? undefined,
    commune: params.get('commune') ?? undefined,
  }

  const [qInput, setQInput] = useState(q)

  // Filtres d'attributs (a_<clé>, a_<clé>_min, a_<clé>_max) selon la catégorie.
  const attrParams: Record<string, string> = {}
  params.forEach((v, k) => { if (k.startsWith('a_') && v) attrParams[k] = v })

  // Clé stable des filtres d'attributs (pour la mémoïsation).
  const attrKey = Object.keys(attrParams).sort().map((k) => `${k}=${attrParams[k]}`).join('&')

  // Explorer une catégorie = signal d'intérêt (pour les suggestions par email).
  useEffect(() => { if (cat) recordInterest(cat, 1) }, [cat])

  // Recentre automatiquement la catégorie / sous-catégorie active dans sa rangée
  const activeCatRef = useRef<HTMLButtonElement>(null)
  const activeSubRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    activeCatRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [cat])
  useEffect(() => {
    activeSubRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [sub])

  function update(next: Record<string, string | undefined>) {
    const p = new URLSearchParams(params)
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === '') p.delete(k)
      else p.set(k, v)
    })
    setParams(p, { replace: true })
  }

  function applyLocation(l: LocationFilter) {
    update({ region: l.regionId, ville: l.cityId, commune: l.commune })
  }

  // Change de catégorie et efface les filtres d'attributs de l'ancienne.
  function changeCat(id?: string) {
    const p = new URLSearchParams(params)
    Array.from(p.keys()).filter((k) => k.startsWith('a_')).forEach((k) => p.delete(k))
    if (id) p.set('cat', id)
    else p.delete('cat')
    p.delete('sub')
    setParams(p, { replace: true })
  }

  // Chaque annonce est préparée une fois (mots, groupes de synonymes) ; la
  // frappe ne refait que la comparaison.
  const prepares = useMemo(() => {
    const m = new Map<string, TextePrepare>()
    for (const l of listings) m.set(l.id, preparer(texteRecherche(l)))
    return m
  }, [listings])

  const results = useMemo(() => {
    const nq = normalize(q)
    let out = listings.filter((l) => {
      if (cat && l.categoryId !== cat) return false
      if (sub && l.subcategory !== sub) return false
      if (cond && l.condition !== cond) return false
      if (loc.regionId && l.regionId !== loc.regionId) return false
      if (loc.cityId && l.cityId !== loc.cityId) return false
      if (loc.commune && l.commune !== loc.commune) return false
      if (min && l.price < Number(min)) return false
      if (max && l.price > Number(max)) return false
      if (livr && !l.delivery) return false
      if (promoOnly && !activePromo(l)) return false
      // Filtres par critères de la catégorie (marque, année, surface…).
      if (cat) {
        for (const f of formFor(cat).fields) {
          if (f.type === 'number') {
            const mn = attrParams[`a_${f.key}_min`]
            const mx = attrParams[`a_${f.key}_max`]
            if (mn || mx) {
              const raw = l.attributes?.[f.key]
              const val = Number(raw)
              if (!raw || Number.isNaN(val)) return false
              if (mn && val < Number(mn)) return false
              if (mx && val > Number(mx)) return false
            }
          } else {
            const want = attrParams[`a_${f.key}`]
            if (want) {
              const have = l.attributes?.[f.key] ?? ''
              if (f.type === 'chips') { if (have !== want) return false }
              else if (!normalize(have).includes(normalize(want))) return false
            }
          }
        }
      }
      if (nq) {
        // La recherche qui comprend (lib/recherche.ts) : synonymes ivoiriens,
        // débuts de mots, fautes de frappe — mot par mot, pas la phrase entière.
        const p = prepares.get(l.id) ?? preparer(texteRecherche(l))
        if (!correspond(p, q)) return false
      }
      return true
    })
    if (tri === 'distance' && position) {
      const dist = (l: (typeof out)[number]) =>
        l.lat != null && l.lng != null
          ? haversineKm(position, { lat: l.lat, lng: l.lng })
          : Number.POSITIVE_INFINITY
      out = [...out].sort((a, b) => dist(a) - dist(b))
    } else {
      out = [...out].sort((a, b) => {
        if (tri === 'prix-asc') return a.price - b.price
        if (tri === 'prix-desc') return b.price - a.price
        return b.createdAt - a.createdAt
      })
    }
    return out
  }, [listings, q, cat, sub, cond, min, max, livr, promoOnly, tri, attrKey, position, loc.regionId, loc.cityId, loc.commune])

  const activeCat = categoryById(cat)
  const activeFilters =
    (cond ? 1 : 0) + (min ? 1 : 0) + (max ? 1 : 0) + (livr ? 1 : 0) + (promoOnly ? 1 : 0) + (sub ? 1 : 0) +
    (tri !== 'recent' ? 1 : 0) + Object.keys(attrParams).length

  return (
    <div className="min-h-screen bg-cream-200">
      {/* Titre de page pour les lecteurs d'écran : l'écran Explorer n'en avait
          aucun, alors qu'il est le 2ᵉ plus visité du site. Même patron que
          Home.tsx. Invisible à l'œil, indispensable à la navigation vocale. */}
      <h1 className="sr-only">Explorer les annonces</h1>
      {/* En-tête sticky */}
      <div className="safe-top sticky top-0 z-30 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button onClick={() => navigate(-1)} className="p-1 text-gray-700" aria-label="Retour">
            <ArrowLeft size={22} />
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              update({ q: qInput.trim() || undefined })
            }}
            className="flex flex-1 items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-400"
          >
            {/* La loupe envoie la recherche — voir Home.tsx pour le pourquoi.
                Ici le champ filtre déjà au fil de la frappe, mais la loupe
                reste ce sur quoi le pouce se pose : elle doit répondre. */}
            <button
              type="submit"
              aria-label="Rechercher"
              className="-m-2.5 grid h-11 w-11 shrink-0 place-items-center text-gray-500"
            >
              <Search size={18} />
            </button>
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Rechercher…"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-gray-500"
            />
            {qInput && (
              <button
                type="button"
                onClick={() => {
                  setQInput('')
                  update({ q: undefined })
                }}
                aria-label="Effacer"
                className="grid h-11 w-11 place-items-center"
              >
                <X size={16} className="text-gray-500" />
              </button>
            )}
          </form>
        </div>

        {/* Barre de filtres */}
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-3 pb-2.5">
          <button
            onClick={() => setFilterOpen(true)}
            className="chip border-primary-200 bg-primary-50 text-primary-700"
          >
            <SlidersHorizontal size={15} />
            Filtres
            {activeFilters > 0 && (
              <span className="ml-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary-500 text-[10px] text-white">
                {activeFilters}
              </span>
            )}
          </button>
          {loc.regionId ? (
            <span className="chip border-primary-200 bg-primary-50 !pr-1 text-primary-700">
              <button onClick={() => setLocOpen(true)} className="flex items-center gap-1">
                <MapPin size={15} />
                <span className="max-w-[40vw] truncate">
                  {locationLabel(loc.regionId, loc.cityId, loc.commune)}
                </span>
              </button>
              <button
                onClick={() => applyLocation({})}
                aria-label="Retirer le filtre de lieu"
                className="ml-1 grid h-5 w-5 place-items-center rounded-full hover:bg-primary-100"
              >
                <X size={13} />
              </button>
            </span>
          ) : (
            <button onClick={() => setLocOpen(true)} className="chip">
              <MapPin size={15} />
              <span>Localisation</span>
              <ChevronDown size={14} />
            </button>
          )}
          <button
            onClick={async () => {
              if (tri === 'distance') {
                update({ tri: undefined })
                return
              }
              if (!position) await requestLocation()
              update({ tri: 'distance' })
            }}
            className={`chip ${tri === 'distance' ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
          >
            <Navigation size={15} />
            {status === 'loading' ? 'Localisation…' : 'Près de moi'}
          </button>
          <button
            onClick={() =>
              update({ tri: tri === 'prix-asc' ? 'prix-desc' : tri === 'prix-desc' ? undefined : 'prix-asc' })
            }
            className={`chip ${tri === 'prix-asc' || tri === 'prix-desc' ? 'border-primary-200 bg-primary-50 text-primary-700' : ''}`}
          >
            Prix {tri === 'prix-asc' ? '↑' : tri === 'prix-desc' ? '↓' : ''}
          </button>
          <button
            onClick={() => update({ promo: promoOnly ? undefined : '1' })}
            className={`chip ${promoOnly ? 'border-red-500 bg-red-500 text-white' : 'border-red-200 text-red-600'}`}
          >
            🏷️ Bons plans
          </button>
          {savedSearchesEnabled && (
            <button
              onClick={() => setAlertOpen(true)}
              className="chip whitespace-nowrap border-primary-200 text-primary-700"
            >
              <Bell size={15} />
              Créer une alerte
            </button>
          )}
        </div>

        {/* Catégories rapides */}
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-t border-gray-50 px-3 py-2">
          <button
            onClick={() => changeCat(undefined)}
            className={`chip ${!cat ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
          >
            Tout
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              ref={cat === c.id ? activeCatRef : null}
              onClick={() => changeCat(c.id)}
              className={`chip ${cat === c.id ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sous-catégories */}
      {activeCat && (
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-3 py-2">
          <button
            onClick={() => update({ sub: undefined })}
            className={`chip text-xs ${!sub ? 'border-gray-800 bg-gray-800 text-white' : ''}`}
          >
            Toutes
          </button>
          {activeCat.subcategories.map((s) => (
            <button
              key={s}
              ref={sub === s ? activeSubRef : null}
              onClick={() => update({ sub: s })}
              className={`chip text-xs ${sub === s ? 'border-gray-800 bg-gray-800 text-white' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Résultats */}
      <div className="px-3 py-3">
        <p className="mb-3 px-1 text-sm text-gray-500">
          <span className="font-bold text-gray-800">{results.length}</span> annonce
          {results.length > 1 ? 's' : ''}
          {activeCat ? ` · ${activeCat.name}` : ''}
        </p>

        {results.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-100 text-primary-600">
              <Store size={26} />
            </div>
            <p className="font-semibold text-gray-700">
              {activeCat ? `Personne ne vend encore en « ${activeCat.name} »` : 'Aucune annonce trouvée ici'}
            </p>
            {/* Activation : le cul-de-sac devient une invitation à vendre. */}
            <div className="mt-1 w-full max-w-sm rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-4 text-left text-white shadow-card txt-legible">
              <p className="font-display text-base font-black leading-tight">
                Soyez le premier à vendre {activeCat ? `en « ${activeCat.name} »` : 'ici'} 🇨🇮
              </p>
              <p className="mt-0.5 text-sm text-white/90">
                Publiez votre annonce <b>gratuitement</b> — 3 photos, un titre, un prix.
              </p>
              <Link
                to="/publier"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-primary-700 shadow-sm active:scale-95"
              >
                <PlusCircle size={16} /> Publier une annonce
              </Link>
            </div>
            <button
              onClick={() => {
                setQInput('')
                setParams(new URLSearchParams(), { replace: true })
              }}
              className="mt-1 text-sm font-medium text-gray-500 underline"
            >
              Élargir la recherche / réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {/* `rang` : les quatre premières vignettes ne partent pas en
                différé — sur tablette et bureau, c'est l'une d'elles qui fixe
                le LCP. Voir ListingCard. */}
            {results.map((l, i) => (
              <ListingCard key={l.id} listing={l} rang={i} />
            ))}
          </div>
        )}
      </div>

      <LocationSheet open={locOpen} onClose={() => setLocOpen(false)} value={loc} onApply={applyLocation} />

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        catId={cat}
        attrParams={attrParams}
        cond={cond}
        min={min}
        max={max}
        livr={livr}
        promoOnly={promoOnly}
        tri={tri}
        hasPosition={!!position}
        onApply={(f) => update(f)}
      />

      <AlertSheet
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        loggedIn={!!user}
        defaultLabel={describeSearch(params, activeCat?.name)}
        params={alertParams(params)}
        count={results.length}
      />
    </div>
  )
}

/** Query-string à sauvegarder pour l'alerte (on retire le tri, non pertinent). */
function alertParams(params: URLSearchParams): string {
  const p = new URLSearchParams(params)
  p.delete('tri')
  return p.toString()
}

/** Libellé lisible résumant les filtres actifs (nom par défaut de l'alerte). */
function describeSearch(params: URLSearchParams, catName?: string): string {
  const parts: string[] = []
  const q = params.get('q')
  if (q) parts.push(`« ${q} »`)
  if (catName) parts.push(catName)
  const sub = params.get('sub')
  if (sub) parts.push(sub)
  const commune = params.get('commune')
  const ville = params.get('ville')
  const region = params.get('region')
  if (commune || ville || region) parts.push(locationLabel(region ?? undefined, ville ?? undefined, commune ?? undefined))
  const min = params.get('min')
  const max = params.get('max')
  if (min && max) parts.push(`${groupThousands(min)}–${groupThousands(max)} F`)
  else if (min) parts.push(`dès ${groupThousands(min)} F`)
  else if (max) parts.push(`≤ ${groupThousands(max)} F`)
  if (params.get('promo') === '1') parts.push('en promo')
  if (params.get('livr')) parts.push('avec livraison')
  return parts.length ? parts.join(' · ') : 'Toutes les nouvelles annonces'
}

/** Feuille « Créer une alerte » : nomme et enregistre une recherche sauvegardée. */
function AlertSheet({
  open,
  onClose,
  loggedIn,
  defaultLabel,
  params,
  count,
}: {
  open: boolean
  onClose: () => void
  loggedIn: boolean
  defaultLabel: string
  params: string
  count: number
}) {
  const [label, setLabel] = useState(defaultLabel)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // Réinitialise à chaque ouverture (le libellé par défaut suit les filtres).
  useEffect(() => {
    if (open) { setLabel(defaultLabel); setDone(false); setError('') }
  }, [open, defaultLabel])

  async function save() {
    const name = label.trim()
    if (!name) { setError('Donnez un nom à votre alerte.'); return }
    setSaving(true)
    setError('')
    try {
      await createSavedSearch(name, params)
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de la création.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Créer une alerte">
      {!loggedIn ? (
        <div className="px-1 py-2 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary-50">
            <Bell size={26} className="text-primary-600" />
          </div>
          <p className="font-semibold text-gray-800">Connectez-vous pour créer une alerte</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500">
            Nous vous préviendrons par email dès qu’une nouvelle annonce correspond à votre recherche.
          </p>
          <Link to="/connexion" onClick={onClose} className="btn-primary mt-4 inline-flex">
            Se connecter
          </Link>
        </div>
      ) : done ? (
        <div className="px-1 py-4 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-ivoire-green/10">
            <Check size={28} className="text-ivoire-green-dark" />
          </div>
          <p className="font-semibold text-gray-800">Alerte créée ✅</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500">
            Vous recevrez un email dès qu’une nouvelle annonce correspond à « {label} ».
          </p>
          <button onClick={onClose} className="btn-primary mt-4">Terminé</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Recevez un email dès qu’une <b>nouvelle annonce</b> correspond à cette recherche.
            {count > 0 && <> {count} annonce{count > 1 ? 's' : ''} correspond{count > 1 ? 'ent' : ''} déjà.</>}
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Nom de l’alerte</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={120}
              className="w-full rounded-xl border border-line2 px-3 py-2.5 text-[15px] outline-none focus:border-primary-400"
              placeholder="Ex. Voitures à Cocody"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={save} disabled={saving} className="btn-primary w-full">
            {saving ? 'Création…' : '🔔 Activer l’alerte'}
          </button>
        </div>
      )}
    </Sheet>
  )
}

// Espace les milliers pour l'affichage : 1500000 -> "1 500 000"
function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// Fourchettes de prix rapides (en FCFA), adaptées au marché ivoirien.
const PRICE_PRESETS: { l: string; min: string; max: string }[] = [
  { l: '≤ 25 000', min: '', max: '25000' },
  { l: '25 000 – 100 000', min: '25000', max: '100000' },
  { l: '100 000 – 500 000', min: '100000', max: '500000' },
  { l: '500 000 – 2 M', min: '500000', max: '2000000' },
  { l: '≥ 2 M', min: '2000000', max: '' },
]

// — Feuille de filtres avancés —
function FilterSheet({
  open,
  onClose,
  catId,
  attrParams,
  cond,
  min,
  max,
  livr,
  promoOnly,
  tri,
  hasPosition,
  onApply,
}: {
  open: boolean
  onClose: () => void
  catId: string
  attrParams: Record<string, string>
  cond: string
  min: string
  max: string
  livr: string
  promoOnly: boolean
  tri: Sort
  hasPosition: boolean
  onApply: (f: Record<string, string | undefined>) => void
}) {
  const [c, setC] = useState(cond)
  const [mn, setMn] = useState(min)
  const [mx, setMx] = useState(max)
  const [dl, setDl] = useState(!!livr)
  const [pr, setPr] = useState(promoOnly)
  const [t, setT] = useState<Sort>(tri)
  const [av, setAv] = useState<Record<string, string>>(attrParams)

  const attrFields = formFor(catId).fields
  const attrKey = Object.entries(attrParams).sort().map(([k, v]) => `${k}=${v}`).join('&')

  // Resynchronise à l'ouverture (si les filtres ont changé ailleurs).
  useEffect(() => {
    if (open) {
      setC(cond)
      setMn(min)
      setMx(max)
      setDl(!!livr)
      setPr(promoOnly)
      setT(tri)
      setAv(attrParams)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cond, min, max, livr, promoOnly, tri, attrKey])

  const sortOptions: { v: Sort; l: string }[] = [
    { v: 'recent', l: 'Plus récent' },
    { v: 'prix-asc', l: 'Moins cher' },
    { v: 'prix-desc', l: 'Plus cher' },
    ...(hasPosition ? [{ v: 'distance' as Sort, l: 'Près de moi' }] : []),
  ]

  // Construit les paramètres d'attributs (a_clé / a_clé_min / a_clé_max).
  function attrUpdate(values: Record<string, string>): Record<string, string | undefined> {
    const out: Record<string, string | undefined> = {}
    for (const f of attrFields) {
      if (f.type === 'number') {
        out[`a_${f.key}_min`] = values[`a_${f.key}_min`] || undefined
        out[`a_${f.key}_max`] = values[`a_${f.key}_max`] || undefined
      } else {
        out[`a_${f.key}`] = values[`a_${f.key}`] || undefined
      }
    }
    return out
  }

  function reset() {
    setC(''); setMn(''); setMx(''); setDl(false); setPr(false); setT('recent'); setAv({})
    onApply({ cond: undefined, min: undefined, max: undefined, livr: undefined, promo: undefined, tri: undefined, ...attrUpdate({}) })
    onClose()
  }

  function apply() {
    onApply({
      cond: c || undefined,
      min: mn || undefined,
      max: mx || undefined,
      livr: dl ? '1' : undefined,
      promo: pr ? '1' : undefined,
      tri: t === 'recent' ? undefined : t,
      ...attrUpdate(av),
    })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Filtrer les annonces">
      <div className="space-y-6">
        {/* État */}
        <div>
          <p className="mb-2 text-sm font-bold text-gray-800">État</p>
          <div className="flex gap-2">
            {[
              { v: '', l: 'Tous' },
              { v: 'neuf', l: 'Neuf' },
              { v: 'occasion', l: 'Occasion' },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setC(o.v)}
                className={`chip flex-1 justify-center ${c === o.v ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        {/* Critères spécifiques à la catégorie (marque, année, surface…) */}
        {attrFields.map((f) => (
          <div key={f.key}>
            <p className="mb-2 text-sm font-bold text-gray-800">{f.label}</p>
            {f.type === 'chips' ? (
              <div className="flex flex-wrap gap-2">
                {f.options?.map((o) => {
                  const active = av[`a_${f.key}`] === o
                  return (
                    <button
                      key={o}
                      onClick={() => setAv((p) => ({ ...p, [`a_${f.key}`]: active ? '' : o }))}
                      className={`chip text-xs ${active ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
                    >
                      {o}
                    </button>
                  )
                })}
              </div>
            ) : f.type === 'number' ? (
              <div className="flex items-center gap-2">
                <input
                  inputMode="numeric"
                  value={av[`a_${f.key}_min`] ?? ''}
                  onChange={(e) => setAv((p) => ({ ...p, [`a_${f.key}_min`]: e.target.value.replace(/\D/g, '') }))}
                  placeholder={`Min${f.unit ? ` (${f.unit})` : ''}`}
                  className="input text-right"
                />
                <span className="text-gray-400">—</span>
                <input
                  inputMode="numeric"
                  value={av[`a_${f.key}_max`] ?? ''}
                  onChange={(e) => setAv((p) => ({ ...p, [`a_${f.key}_max`]: e.target.value.replace(/\D/g, '') }))}
                  placeholder={`Max${f.unit ? ` (${f.unit})` : ''}`}
                  className="input text-right"
                />
              </div>
            ) : (
              <input
                value={av[`a_${f.key}`] ?? ''}
                onChange={(e) => setAv((p) => ({ ...p, [`a_${f.key}`]: e.target.value }))}
                placeholder={f.placeholder || `Filtrer par ${f.label.toLowerCase()}`}
                className="input"
              />
            )}
          </div>
        ))}

        {/* Prix */}
        <div>
          <p className="mb-2 text-sm font-bold text-gray-800">Prix (FCFA)</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {PRICE_PRESETS.map((p) => {
              const active = mn === p.min && mx === p.max
              return (
                <button
                  key={p.l}
                  onClick={() => {
                    setMn(active ? '' : p.min)
                    setMx(active ? '' : p.max)
                  }}
                  className={`chip text-xs ${active ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
                >
                  {p.l}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                inputMode="numeric"
                value={groupThousands(mn)}
                onChange={(e) => setMn(e.target.value.replace(/\D/g, ''))}
                placeholder="Min"
                className="input pr-12 text-right"
              />
              <span className="pointer-events-none absolute right-3 top-3.5 text-xs text-gray-500">FCFA</span>
            </div>
            <span className="text-gray-400">—</span>
            <div className="relative flex-1">
              <input
                inputMode="numeric"
                value={groupThousands(mx)}
                onChange={(e) => setMx(e.target.value.replace(/\D/g, ''))}
                placeholder="Max"
                className="input pr-12 text-right"
              />
              <span className="pointer-events-none absolute right-3 top-3.5 text-xs text-gray-500">FCFA</span>
            </div>
          </div>
        </div>

        {/* Bons plans (promotions) */}
        <button
          onClick={() => setPr((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-line2 px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <Tag size={18} className="text-red-500" /> Bons plans (en promotion)
          </span>
          <span
            className={`relative h-6 w-11 rounded-full transition-colors ${pr ? 'bg-red-500' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-smooth ${pr ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </span>
        </button>

        {/* Livraison */}
        <button
          onClick={() => setDl((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-line2 px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <Truck size={18} className="text-primary-500" /> Livraison possible uniquement
          </span>
          <span
            className={`relative h-6 w-11 rounded-full transition-colors ${dl ? 'bg-primary-500' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-smooth ${dl ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </span>
        </button>

        {/* Tri */}
        <div>
          <p className="mb-2 text-sm font-bold text-gray-800">Trier par</p>
          <div className="grid grid-cols-2 gap-2">
            {sortOptions.map((o) => (
              <button
                key={o.v}
                onClick={() => setT(o.v)}
                className={`chip justify-center ${t === o.v ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
              >
                {o.v === 'distance' && <Navigation size={14} className="mr-1" />}
                {o.l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={reset} className="btn-outline flex-1">
            Réinitialiser
          </button>
          <button onClick={apply} className="btn-primary flex-1">
            Appliquer
          </button>
        </div>
      </div>
    </Sheet>
  )
}
