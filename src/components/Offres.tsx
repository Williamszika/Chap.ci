import type { ReactNode } from 'react'
import { Briefcase, MapPin, Banknote, Clock } from 'lucide-react'
import { mediaUrl } from '../lib/native'
import { timeAgo } from '../lib/format'
import type { Offre, ChampFormulaire, TypeChamp } from '../lib/php'

/**
 * Les offres d'emploi des structures (06/09/2026) — ce que la page vendeur, la
 * page d'une offre et la console du professionnel partagent : la carte d'une
 * offre, les questions d'un formulaire de candidature, les listes de choix.
 */

/** Les contrats proposés d'un geste ; le texte reste libre (40 caractères). */
export const CONTRATS = ['CDI', 'CDD', 'Stage', 'Alternance', 'Temps partiel', 'Journalier', 'Freelance', 'Bénévolat']

/** Les six types de question, dans l'ordre du menu du constructeur. */
export const TYPES_CHAMP: { id: TypeChamp; label: string }[] = [
  { id: 'texte', label: 'Réponse courte' },
  { id: 'long', label: 'Réponse longue' },
  { id: 'email', label: 'Adresse e-mail' },
  { id: 'tel', label: 'Numéro de téléphone' },
  { id: 'choix', label: 'Choix dans une liste' },
  { id: 'ouinon', label: 'Oui / Non' },
]

/** Fermée par la structure, ou arrivée au bout de ses soixante jours. */
export function offreFermee(o: Offre): boolean {
  return o.statut !== 'ouverte' || (o.expiresAt != null && o.expiresAt <= Date.now())
}

/** « 12 septembre » — la date d'expiration, sans l'heure. */
export function dateOffre(ms: number): string {
  return new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export function PuceOffre({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
      {children}
    </span>
  )
}

/**
 * Une offre dans une liste : le logo (ou la mallette), le poste, l'enseigne,
 * les puces contrat · lieu · salaire, la date. `mienne` ajoute le nombre de
 * candidatures ; `actions` pose une rangée de boutons sous la carte — hors du
 * bouton principal, un bouton ne se met pas dans un bouton.
 */
export function CarteOffre({ offre, onOpen, mienne, actions }: {
  offre: Offre; onOpen: () => void; mienne?: boolean; actions?: ReactNode
}) {
  const fermee = offreFermee(offre)
  return (
    <div className="card p-3.5">
      <button type="button" onClick={onOpen} className="flex w-full items-start gap-3 text-left">
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-50 text-primary-700">
          {offre.logo
            ? <img src={mediaUrl(offre.logo)} alt="" className="h-full w-full object-cover" loading="lazy" />
            : <Briefcase size={20} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[15px] font-extrabold leading-snug text-ink">{offre.titre}</span>
          <span className="mt-0.5 block truncate text-xs text-gray-500">{offre.entreprise}</span>
          {(offre.contrat || offre.lieu || offre.salaire) && (
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              {offre.contrat && <PuceOffre>{offre.contrat}</PuceOffre>}
              {offre.lieu && <PuceOffre><MapPin size={11} /> {offre.lieu}</PuceOffre>}
              {offre.salaire && <PuceOffre><Banknote size={11} /> {offre.salaire}</PuceOffre>}
            </span>
          )}
          <span className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500">
            <Clock size={11} /> {timeAgo(offre.createdAt)}
            {mienne && offre.candidatures != null && (
              <> · <b className="tnum text-ink">{offre.candidatures}</b> candidature{offre.candidatures > 1 ? 's' : ''}</>
            )}
            {fermee && (
              <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">Fermée</span>
            )}
          </span>
        </span>
      </button>
      {actions && <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">{actions}</div>}
    </div>
  )
}

/**
 * Les questions d'un formulaire de candidature, telles que le candidat les
 * remplit. Une réponse est toujours une chaîne : « oui » / « non » pour un
 * oui-non, l'option choisie pour un choix.
 */
export function ChampsCandidature({ champs, valeurs, onChange, disabled }: {
  champs: ChampFormulaire[]; valeurs: Record<string, string>
  onChange: (id: string, valeur: string) => void; disabled?: boolean
}) {
  return (
    <div className="space-y-3">
      {champs.map((c) => {
        const v = valeurs[c.id] ?? ''
        const etiquette = (
          <span className="mb-1 block text-sm font-semibold text-gray-800">
            {c.label}{c.requis && <span className="text-red-500"> *</span>}
          </span>
        )
        if (c.type === 'ouinon') {
          return (
            <div key={c.id}>
              {etiquette}
              <div className="flex gap-2" role="group" aria-label={c.label}>
                {(['oui', 'non'] as const).map((o) => (
                  <button key={o} type="button" disabled={disabled} aria-pressed={v === o}
                    onClick={() => onChange(c.id, v === o ? '' : o)}
                    className={`chip min-h-11 flex-1 justify-center ${v === o ? 'border-primary-500 bg-primary-500 text-white' : ''}`}>
                    {o === 'oui' ? 'Oui' : 'Non'}
                  </button>
                ))}
              </div>
            </div>
          )
        }
        return (
          <label key={c.id} className="block">
            {etiquette}
            {c.type === 'long' ? (
              <textarea className="input min-h-[110px]" value={v} disabled={disabled} maxLength={3000}
                onChange={(e) => onChange(c.id, e.target.value)} />
            ) : c.type === 'choix' ? (
              <select className="input" value={v} disabled={disabled} onChange={(e) => onChange(c.id, e.target.value)}>
                <option value="">Choisir…</option>
                {(c.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input className="input" value={v} disabled={disabled} maxLength={200}
                type={c.type === 'email' ? 'email' : c.type === 'tel' ? 'tel' : 'text'}
                inputMode={c.type === 'email' ? 'email' : c.type === 'tel' ? 'tel' : 'text'}
                autoComplete={c.type === 'email' ? 'email' : c.type === 'tel' ? 'tel' : c.id === 'nom' ? 'name' : 'off'}
                onChange={(e) => onChange(c.id, e.target.value)} />
            )}
          </label>
        )
      })}
    </div>
  )
}
