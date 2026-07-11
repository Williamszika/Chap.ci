import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Search, SlidersHorizontal, MapPin, X, ChevronDown, Navigation } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { useGeo } from '../store/GeoContext'
import { haversineKm } from '../lib/geo'
import { ListingCard } from '../components/ListingCard'
import { LocationSheet } from '../components/LocationSheet'
import { Sheet } from '../components/Sheet'
import { categories, categoryById } from '../data/categories'
import { locationLabel } from '../data/locations'
import type { LocationFilter } from '../types'

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

type Sort = 'recent' | 'prix-asc' | 'prix-desc' | 'distance'

export function Browse() {
  const navigate = useNavigate()
  const { listings } = useApp()
  const { position, status, requestLocation } = useGeo()
  const [params, setParams] = useSearchParams()
  const [locOpen, setLocOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const q = params.get('q') ?? ''
  const cat = params.get('cat') ?? ''
  const sub = params.get('sub') ?? ''
  const cond = params.get('cond') ?? ''
  const min = params.get('min') ?? ''
  const max = params.get('max') ?? ''
  const tri = (params.get('tri') as Sort) ?? 'recent'
  const loc: LocationFilter = {
    regionId: params.get('region') ?? undefined,
    cityId: params.get('ville') ?? undefined,
    commune: params.get('commune') ?? undefined,
  }

  const [qInput, setQInput] = useState(q)

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
      if (nq) {
        const hay = normalize(`${l.title} ${l.description} ${l.subcategory ?? ''}`)
        if (!hay.includes(nq)) return false
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
  }, [listings, q, cat, sub, cond, min, max, tri, position, loc.regionId, loc.cityId, loc.commune])

  const activeCat = categoryById(cat)
  const activeFilters =
    (cond ? 1 : 0) + (min ? 1 : 0) + (max ? 1 : 0) + (sub ? 1 : 0) + (tri !== 'recent' ? 1 : 0)

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* En-tête sticky */}
      <div className="safe-top sticky top-0 z-30 bg-white shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <button onClick={() => navigate(-1)} className="p-1 text-gray-700" aria-label="Retour">
            <ArrowLeft size={22} />
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              update({ q: qInput.trim() || undefined })
            }}
            className="flex flex-1 items-center gap-2 rounded-xl bg-gray-100 px-3 py-2"
          >
            <Search size={18} className="text-gray-400" />
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Rechercher…"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-gray-400"
            />
            {qInput && (
              <button
                type="button"
                onClick={() => {
                  setQInput('')
                  update({ q: undefined })
                }}
                aria-label="Effacer"
              >
                <X size={16} className="text-gray-400" />
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
          <button
            onClick={() => setLocOpen(true)}
            className={`chip ${loc.regionId ? 'border-primary-200 bg-primary-50 text-primary-700' : ''}`}
          >
            <MapPin size={15} />
            <span className="max-w-[40vw] truncate">
              {loc.regionId ? locationLabel(loc.regionId, loc.cityId, loc.commune) : 'Localisation'}
            </span>
            <ChevronDown size={14} />
          </button>
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
        </div>

        {/* Catégories rapides */}
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-t border-gray-50 px-3 py-2">
          <button
            onClick={() => update({ cat: undefined, sub: undefined })}
            className={`chip ${!cat ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
          >
            Tout
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => update({ cat: c.id, sub: undefined })}
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
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="text-5xl">🔍</div>
            <p className="font-semibold text-gray-700">Aucune annonce trouvée</p>
            <p className="max-w-xs text-sm text-gray-500">
              Essayez d’élargir votre recherche ou de changer de localisation.
            </p>
            <button
              onClick={() => {
                setQInput('')
                setParams(new URLSearchParams(), { replace: true })
              }}
              className="btn-outline mt-1 py-2"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {results.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>

      <LocationSheet open={locOpen} onClose={() => setLocOpen(false)} value={loc} onApply={applyLocation} />

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        cond={cond}
        min={min}
        max={max}
        tri={tri}
        onApply={(f) => update(f)}
      />
    </div>
  )
}

// — Feuille de filtres avancés —
function FilterSheet({
  open,
  onClose,
  cond,
  min,
  max,
  tri,
  onApply,
}: {
  open: boolean
  onClose: () => void
  cond: string
  min: string
  max: string
  tri: Sort
  onApply: (f: Record<string, string | undefined>) => void
}) {
  const [c, setC] = useState(cond)
  const [mn, setMn] = useState(min)
  const [mx, setMx] = useState(max)
  const [t, setT] = useState<Sort>(tri)

  return (
    <Sheet open={open} onClose={onClose} title="Filtrer les annonces">
      <div className="space-y-6">
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

        <div>
          <p className="mb-2 text-sm font-bold text-gray-800">Prix (FCFA)</p>
          <div className="flex items-center gap-2">
            <input
              inputMode="numeric"
              value={mn}
              onChange={(e) => setMn(e.target.value.replace(/\D/g, ''))}
              placeholder="Min"
              className="input"
            />
            <span className="text-gray-400">—</span>
            <input
              inputMode="numeric"
              value={mx}
              onChange={(e) => setMx(e.target.value.replace(/\D/g, ''))}
              placeholder="Max"
              className="input"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-gray-800">Trier par</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: 'recent', l: 'Récent' },
              { v: 'prix-asc', l: 'Prix ↑' },
              { v: 'prix-desc', l: 'Prix ↓' },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setT(o.v as Sort)}
                className={`chip justify-center ${t === o.v ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              setC('')
              setMn('')
              setMx('')
              setT('recent')
              onApply({ cond: undefined, min: undefined, max: undefined, tri: undefined })
              onClose()
            }}
            className="btn-outline flex-1"
          >
            Réinitialiser
          </button>
          <button
            onClick={() => {
              onApply({ cond: c || undefined, min: mn || undefined, max: mx || undefined, tri: t === 'recent' ? undefined : t })
              onClose()
            }}
            className="btn-primary flex-1"
          >
            Appliquer
          </button>
        </div>
      </div>
    </Sheet>
  )
}
