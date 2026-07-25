import { useState } from 'react'
import { ChevronRight, ChevronLeft, MapPin, Check } from 'lucide-react'
import { Sheet } from './Sheet'
import {
  regions,
  districts,
  citiesByRegion,
  regionById,
  cityById,
} from '../data/locations'
import type { LocationFilter } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  value: LocationFilter
  onApply: (value: LocationFilter) => void
}

type Step = 'region' | 'city' | 'commune'

export function LocationSheet({ open, onClose, value, onApply }: Props) {
  const [step, setStep] = useState<Step>('region')
  const [draft, setDraft] = useState<LocationFilter>(value)

  const region = regionById(draft.regionId)
  const cityList = draft.regionId ? citiesByRegion(draft.regionId) : []
  const city = cityById(draft.cityId)

  function reset() {
    setStep('region')
    setDraft({})
  }

  function apply(next: LocationFilter) {
    onApply(next)
    onClose()
  }

  const title =
    step === 'region' ? 'Choisir une région' : step === 'city' ? region?.name : city?.name

  return (
    <Sheet open={open} onClose={onClose} title={`📍 ${title ?? 'Localisation'}`}>
      {step !== 'region' && (
        <button
          onClick={() => setStep(step === 'commune' ? 'city' : 'region')}
          className="mb-3 flex items-center gap-1 text-sm font-semibold text-primary-600"
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
              <p className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-gray-400">
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
                        setStep('city')
                      }}
                      className="flex w-full items-center justify-between border-b border-gray-50 px-4 py-3 text-left last:border-0 hover:bg-gray-50"
                    >
                      <span className="text-[15px] text-gray-800">{r.name}</span>
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

      {(draft.regionId || value.regionId) && step === 'region' && (
        <button onClick={reset} className="mt-4 w-full text-center text-sm text-gray-400">
          Réinitialiser
        </button>
      )}
    </Sheet>
  )
}
