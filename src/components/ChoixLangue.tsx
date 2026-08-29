import { useLocation, useNavigate } from 'react-router-dom'
import { Languages } from 'lucide-react'
import { langueDepuis, type LangueSite } from '../lib/langue'

/**
 * LE CHOIX DE LANGUE des pages d'information.
 *
 * Cinq pages — Aide/FAQ, CGU, Confidentialité, À propos, Contact — sont
 * traduites en cinq langues, soit vingt-cinq documents. Jusqu'au 29/08 ils
 * n'étaient atteignables QUE par l'application, qui ajoute `?lang=` à
 * l'adresse quand son utilisateur a changé de langue. Un visiteur du site
 * n'avait aucun bouton : des traductions écrites, relues, livrées — et
 * invisibles.
 *
 * IL NE S'AFFICHE QUE SUR CES PAGES-LÀ, et c'est délibéré. Le reste du site —
 * annonces, navigation, boutons — est en français. Un sélecteur global
 * promettrait un site multilingue et n'en livrerait qu'un coin : l'utilisateur
 * choisirait « English », verrait la FAQ changer et rien d'autre, et
 * conclurait que le site est cassé. Mieux vaut une promesse petite et tenue.
 */

const LANGUES: { id: LangueSite; label: string; drapeau: string }[] = [
  { id: 'fr', label: 'Français', drapeau: '🇫🇷' },
  { id: 'en', label: 'English', drapeau: '🇬🇧' },
  { id: 'es', label: 'Español', drapeau: '🇪🇸' },
  { id: 'pt', label: 'Português', drapeau: '🇵🇹' },
  { id: 'ar', label: 'العربية', drapeau: '🇸🇦' },
  { id: 'zh', label: '中文', drapeau: '🇨🇳' },
]

/** « Cette page existe aussi en… » — la même dans les six langues. */
const INTITULE: Record<LangueSite, string> = {
  fr: 'Cette page existe aussi en',
  en: 'This page is also available in',
  es: 'Esta página también está disponible en',
  pt: 'Esta página também está disponível em',
  ar: 'هذه الصفحة متوفرة أيضًا بـ',
  zh: '本页面亦提供以下语言',
}

export function ChoixLangue() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const active = langueDepuis(search)

  const choisir = (l: LangueSite) => {
    // On garde les autres paramètres de l'adresse : la page Aide porte
    // `?rubrique=`, la page Contact `?sujet=`. Les écraser renverrait
    // l'utilisateur en haut d'une page qu'il avait ouverte à un endroit précis.
    const p = new URLSearchParams(search)
    p.set('lang', l)
    navigate({ pathname, search: `?${p.toString()}` }, { replace: true })
    // On remonte : la traduction remplace tout le texte, rester au milieu
    // laisserait sur un paragraphe qui n'est plus le même.
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-4">
      <div className="rounded-2xl border border-line bg-white px-3.5 py-3 shadow-card">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">
          <Languages size={13} className="text-primary-600" />
          {INTITULE[active]}
        </p>
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {LANGUES.map((l) => (
            <button key={l.id} onClick={() => choisir(l.id)}
              aria-current={l.id === active ? 'true' : undefined}
              lang={l.id}
              className={`chip-etat shrink-0 ${l.id === active
                ? 'bg-ink text-white' : 'bg-white text-gray-600 ring-1 ring-line'}`}>
              <span aria-hidden>{l.drapeau}</span> {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
