import { useMemo, useState } from 'react'
import { ChevronRight, ChevronLeft, MapPin, Check, Globe, Search } from 'lucide-react'
import { Sheet } from './Sheet'
import {
  regions,
  districts,
  citiesByRegion,
  regionById,
  cityById,
} from '../data/locations'
import { REGION_AUTRES_PAYS, ZONES, pays, idPays, paysParId, drapeau } from '../data/pays'
import type { LocationFilter } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  value: LocationFilter
  onApply: (value: LocationFilter) => void
}

/**
 * Région → Ville → Commune, et, depuis le 07/09/2026, la porte de sortie
 * « Autres pays » : Pays → votre ville écrite en clair. Un compte à Dakar ou à
 * Paris se range là, et se filtre comme les autres.
 */
type Step = 'region' | 'city' | 'commune' | 'pays' | 'villeLibre'

function normaliser(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function LocationSheet({ open, onClose, value, onApply }: Props) {
  const [step, setStep] = useState<Step>('region')
  const [draft, setDraft] = useState<LocationFilter>(value)
  const [recherche, setRecherche] = useState('')
  const [villeLibre, setVilleLibre] = useState(value.regionId === REGION_AUTRES_PAYS ? value.commune ?? '' : '')

  const region = regionById(draft.regionId)
  const cityList = draft.regionId ? citiesByRegion(draft.regionId) : []
  const city = cityById(draft.cityId)
  const paysChoisi = paysParId(draft.cityId)

  const paysFiltres = useMemo(() => {
    const q = normaliser(recherche.trim())
    return q ? pays.filter((x) => normaliser(x.nom).includes(q) || x.code.toLowerCase() === q) : pays
  }, [recherche])

  function reset() {
    setStep('region')
    setDraft({})
    setVilleLibre('')
  }

  function apply(next: LocationFilter) {
    onApply(next)
    onClose()
  }

  function retour() {
    if (step === 'villeLibre') setStep('pays')
    else if (step === 'pays') setStep('region')
    else setStep(step === 'commune' ? 'city' : 'region')
  }

  const title =
    step === 'region' ? 'Choisir une région'
      : step === 'pays' ? 'Choisir un pays'
      : step === 'villeLibre' ? paysChoisi?.nom
      : step === 'city' ? region?.name : city?.name

  return (
    <Sheet open={open} onClose={onClose} title={`${step === 'pays' || step === 'villeLibre' ? '🌍' : '📍'} ${title ?? 'Localisation'}`}>
      {step !== 'region' && (
        <button
          onClick={retour}
          className="mb-3 flex min-h-11 items-center gap-1 text-sm font-semibold text-primary-600"
        >
          <ChevronLeft size={18} /> Retour
        </button>
      )}

      {step === 'region' && (
        <div className="space-y-4">
          <button
            onClick={() => apply({})}
            className="flex w-full items-center justify-between rounded-xl bg-primary-50 px-4 py-3 text-left font-semibold text-primary-700"
          >
            <span className="flex items-center gap-2">
              <MapPin size={18} /> Toute la Côte d’Ivoire
            </span>
            {!value.regionId && <Check size={18} />}
          </button>

          {districts.map((d) => (
            <div key={d}>
              <p className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                {d}
              </p>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                {regions
                  .filter((r) => r.district === d)
                  .map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setDraft({ regionId: r.id })
                        setRecherche('')
                        setStep(r.id === REGION_AUTRES_PAYS ? 'pays' : 'city')
                      }}
                      className="flex w-full items-center justify-between border-b border-gray-50 px-4 py-3 text-left last:border-0 hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2 text-[15px] text-gray-800">
                        {r.id === REGION_AUTRES_PAYS && <Globe size={16} className="text-primary-500" />}
                        {r.name}
                      </span>
                      <ChevronRight size={18} className="text-gray-300" />
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 'city' && (
        <div className="space-y-2">
          <button
            onClick={() => apply({ regionId: draft.regionId })}
            className="flex w-full items-center justify-between rounded-xl bg-primary-50 px-4 py-3 text-left font-semibold text-primary-700"
          >
            Toute la région {region?.name}
            <Check size={18} className="opacity-0" />
          </button>
          {cityList.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                const next = { regionId: draft.regionId, cityId: c.id }
                if (c.communes && c.communes.length) {
                  setDraft(next)
                  setStep('commune')
                } else {
                  apply(next)
                }
              }}
              className="flex w-full items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-left hover:bg-gray-50"
            >
              <span className="text-[15px] text-gray-800">{c.name}</span>
              {c.communes && c.communes.length ? (
                <ChevronRight size={18} className="text-gray-300" />
              ) : null}
            </button>
          ))}
          {cityList.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-500">
              Aucune ville référencée pour cette région.
            </p>
          )}
        </div>
      )}

      {step === 'commune' && city?.communes && (
        <div className="space-y-2">
          <button
            onClick={() => apply({ regionId: draft.regionId, cityId: draft.cityId })}
            className="flex w-full items-center justify-between rounded-xl bg-primary-50 px-4 py-3 text-left font-semibold text-primary-700"
          >
            Toute la ville de {city.name}
          </button>
          {city.communes.map((com) => (
            <button
              key={com}
              onClick={() =>
                apply({ regionId: draft.regionId, cityId: draft.cityId, commune: com })
              }
              className="flex w-full items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-left hover:bg-gray-50"
            >
              <span className="text-[15px] text-gray-800">{com}</span>
            </button>
          ))}
        </div>
      )}

      {/* Le pays : une recherche, puis les pays par zone — les voisins d'abord. */}
      {step === 'pays' && (
        <div className="space-y-4">
          <button
            onClick={() => apply({ regionId: REGION_AUTRES_PAYS })}
            className="flex w-full items-center justify-between rounded-xl bg-primary-50 px-4 py-3 text-left font-semibold text-primary-700"
          >
            <span className="flex items-center gap-2"><Globe size={18} /> Tous les pays hors Côte d’Ivoire</span>
          </button>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
            <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Chercher un pays"
              className="input pl-9" autoFocus />
          </div>
          {ZONES.map((z) => {
            const liste = paysFiltres.filter((x) => x.zone === z)
            if (!liste.length) return null
            return (
              <div key={z}>
                <p className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-gray-500">{z}</p>
                <div className="overflow-hidden rounded-xl border border-gray-100">
                  {liste.map((x) => (
                    <button
                      key={x.code}
                      onClick={() => {
                        setDraft({ regionId: REGION_AUTRES_PAYS, cityId: idPays(x.code) })
                        setStep('villeLibre')
                      }}
                      className="flex w-full items-center justify-between border-b border-gray-50 px-4 py-3 text-left last:border-0 hover:bg-gray-50"
                    >
                      <span className="flex items-center gap-2.5 text-[15px] text-gray-800">
                        <span aria-hidden>{drapeau(x.code)}</span> {x.nom}
                      </span>
                      <ChevronRight size={18} className="text-gray-300" />
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {paysFiltres.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-500">
              Aucun pays ne porte ce nom. Choisissez « Autre pays » tout en bas.
            </p>
          )}
        </div>
      )}

      {/* La ville, en clair : il n'y a pas de liste de villes pour le monde entier. */}
      {step === 'villeLibre' && paysChoisi && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            apply({ regionId: REGION_AUTRES_PAYS, cityId: draft.cityId, commune: villeLibre.trim() || undefined })
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-gray-700">
              Votre ville {drapeau(paysChoisi.code)} {paysChoisi.nom}
            </span>
            <input value={villeLibre} onChange={(e) => setVilleLibre(e.target.value)} maxLength={60}
              placeholder="Ex : Dakar" className="input" autoFocus autoComplete="address-level2" />
          </label>
          <button type="submit" className="btn-primary w-full">
            <Check size={18} /> {villeLibre.trim() ? `Valider ${villeLibre.trim()}` : `Tout le pays : ${paysChoisi.nom}`}
          </button>
        </form>
      )}

      {(draft.regionId || value.regionId) && step === 'region' && (
        <button onClick={reset} className="mt-4 min-h-11 w-full text-center text-sm text-gray-500">
          Réinitialiser
        </button>
      )}
    </Sheet>
  )
}
