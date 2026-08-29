import { useState } from 'react'
import { Languages, Loader2, Undo2 } from 'lucide-react'
import { phpTraduire } from '../lib/php'
import { ApiError } from '../lib/php'

/**
 * TRADUIRE UNE ANNONCE — sur le site, enfin.
 *
 * Le moteur de traduction existe côté serveur depuis longtemps : cinq langues,
 * trois moteurs essayés dans l'ordre, un cache qui fait qu'une annonce n'est
 * traduite qu'une fois par langue, et un garde-fou de 60 traductions neuves
 * par heure. **L'application s'en servait ; le site ne l'appelait jamais.** Un
 * acheteur sur téléphone pouvait lire une annonce en anglais, le même acheteur
 * sur le site, non.
 *
 * Le repli compte autant que le reste : si aucun moteur ne répond, le serveur
 * rend 502/503 et on ouvre Google Traduction dans un onglet, exactement comme
 * l'application. Un bouton qui échoue en silence vaut moins que pas de bouton.
 */

type Langue = 'en' | 'es' | 'pt' | 'ar' | 'zh'

const LANGUES: { id: Langue; label: string; drapeau: string }[] = [
  { id: 'en', label: 'English', drapeau: '🇬🇧' },
  { id: 'es', label: 'Español', drapeau: '🇪🇸' },
  { id: 'pt', label: 'Português', drapeau: '🇵🇹' },
  { id: 'ar', label: 'العربية', drapeau: '🇸🇦' },
  { id: 'zh', label: '中文', drapeau: '🇨🇳' },
]

const CLE = 'chapci.langue.annonce'

export interface Traduction { titre: string; description: string; langue: Langue }

export function TraduireAnnonce({ listingId, titre, description, traduction, onTraduction }: {
  listingId: string
  titre: string
  description: string
  traduction: Traduction | null
  onTraduction: (t: Traduction | null) => void
}) {
  const [ouvert, setOuvert] = useState(false)
  const [occupe, setOccupe] = useState<Langue | null>(null)
  const [erreur, setErreur] = useState('')

  // La dernière langue choisie : au deuxième article, on ne redemande pas.
  let derniere: Langue | null = null
  try {
    const m = localStorage.getItem(CLE)
    if (m && LANGUES.some((l) => l.id === m)) derniere = m as Langue
  } catch { /* stockage indisponible : on demandera à chaque fois */ }

  /** Repli quand aucun moteur ne répond : Google Traduction, dans un onglet. */
  const versGoogle = (l: Langue) => {
    const texte = `${titre}\n\n${description}`.slice(0, 1800)
    window.open(
      `https://translate.google.com/?sl=fr&tl=${l}&text=${encodeURIComponent(texte)}&op=translate`,
      '_blank', 'noopener,noreferrer',
    )
  }

  const traduire = async (l: Langue) => {
    setOccupe(l); setErreur('')
    try {
      const r = await phpTraduire(listingId, l)
      onTraduction({ titre: r.titre, description: r.description, langue: l })
      setOuvert(false)
      try { localStorage.setItem(CLE, l) } catch { /* tant pis */ }
    } catch (e) {
      const s = e instanceof ApiError ? e.status : 0
      // Moteur absent, en panne, ou serveur pas encore à jour : on ne laisse
      // pas l'acheteur devant un bouton mort.
      if (s === 502 || s === 503 || s === 404) versGoogle(l)
      else setErreur((e as Error).message)
    } finally { setOccupe(null) }
  }

  if (traduction) {
    const nom = LANGUES.find((l) => l.id === traduction.langue)?.label ?? ''
    return (
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream-100 px-3 py-2">
        <p className="text-[12px] text-gray-600">
          <Languages size={13} className="mr-1 inline-block align-[-2px] text-primary-600" />
          Traduit automatiquement en {nom} — le texte d’origine reste la référence.
        </p>
        <button onClick={() => onTraduction(null)}
          className="inline-flex items-center gap-1 text-[12px] font-bold text-primary-700">
          <Undo2 size={13} /> Voir l’original
        </button>
      </div>
    )
  }

  return (
    <div className="mt-3">
      {!ouvert ? (
        <button onClick={() => (derniere ? traduire(derniere) : setOuvert(true))}
          disabled={occupe !== null}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-[12.5px] font-bold text-gray-700 transition hover:bg-cream-100 disabled:opacity-60">
          {occupe ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} className="text-primary-600" />}
          {derniere
            ? `Traduire en ${LANGUES.find((l) => l.id === derniere)?.label}`
            : 'Traduire cette annonce'}
        </button>
      ) : (
        <div className="rounded-xl border border-line bg-white p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
            Traduire en
          </p>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            {LANGUES.map((l) => (
              <button key={l.id} onClick={() => traduire(l.id)} disabled={occupe !== null}
                lang={l.id}
                className="chip-etat shrink-0 bg-white text-gray-600 ring-1 ring-line disabled:opacity-60">
                {occupe === l.id
                  ? <Loader2 size={12} className="animate-spin" />
                  : <span aria-hidden>{l.drapeau}</span>} {l.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {erreur && <p className="mt-1.5 text-[11.5px] font-semibold text-red-600">{erreur}</p>}
    </div>
  )
}
