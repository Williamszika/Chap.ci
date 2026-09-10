import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cookie } from 'lucide-react'
import { isNative } from '../lib/native'
import { consentDecided, setConsent } from '../lib/consent'
import { initMarketing } from '../lib/marketing'

/**
 * Bandeau de consentement aux cookies.
 *
 * Apparaît une seule fois, tant que la personne n'a pas répondu. Deux choix
 * clairs et de POIDS ÉGAL — « Accepter » et « Refuser » côte à côte : un
 * bandeau qui met « Refuser » en tout petit n'est pas un vrai choix, et la loi
 * ivoirienne sur les données comme les règles des magasins d'applications
 * demandent un consentement libre.
 *
 * · Accepter → on autorise les pixels tiers (Meta, TikTok, Google) et on les
 *   charge tout de suite (`initMarketing`).
 * · Refuser → aucun pixel tiers ne se charge, ni maintenant ni plus tard.
 *
 * Dans l'app native, pas de pixels web : pas de bandeau.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isNative) return
    // On laisse la page s'afficher d'abord — le bandeau n'est pas la première
    // chose qu'on veut mettre devant un nouveau visiteur. Trois secondes : sur
    // une 3G, à 900 ms la page n'était pas encore là, et le bandeau arrivait
    // en plein chargement, par-dessus une photo qui n'avait pas fini.
    const t = setTimeout(() => setVisible(!consentDecided()), 3000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  const repondre = (accepte: boolean) => {
    setConsent(accepte)
    if (accepte) initMarketing()
    setVisible(false)
  }

  return (
    <div
      // ── z-[75] : AU-DESSUS DE CE QUI S'OUVRE TOUT SEUL (10/09/2026) ────────
      //
      // Ce bandeau portait `z-50`, avec le commentaire « SOUS les feuilles et
      // les fenêtres du site (z-60), jamais par-dessus ». La prémisse était
      // fausse : la pop-up newsletter est à z-70, et son voile plein écran
      // recouvrait le bandeau. « Accepter » et « Refuser » ne recevaient plus
      // un seul clic — un consentement qu'on ne peut pas donner n'en est pas un.
      //
      // L'ordre des calques du site, à respecter :
      //     z-40/50  la navigation, les feuilles, les menus
      //     z-[60]   les panneaux du site
      //     z-[70]   les fenêtres qui s'ouvrent SEULES (newsletter, admin)
      //  →  z-[75]   CE BANDEAU : il passe devant tout ce qui s'ouvre seul
      //     z-[80]   les messages fugaces (ils ne prennent pas le clic)
      //     z-[90]   la photo en plein écran, ouverte par un geste explicite —
      //              la seule chose qui a le droit de masquer ce bandeau, le
      //              temps qu'on regarde une photo, et il revient en la fermant.
      //
      // La vraie garantie n'est pas ce nombre : c'est que la newsletter ne
      // s'arme plus tant que ce bandeau attend une réponse (`NewsletterPrompt`).
      // Ceci en est la seconde ceinture, pour la prochaine fenêtre qu'on
      // ajoutera sans y penser.
      className="fixed inset-x-0 bottom-0 z-[75] animate-fadeup px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3"
      role="dialog"
      aria-label="Consentement aux cookies"
    >
      <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-white p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-100 text-lg" aria-hidden>
            <Cookie size={18} className="text-primary-600" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900">Cookies &amp; mesure d’audience</p>
            <p className="mt-1 text-[13px] leading-snug text-gray-600">
              Chap.ci compte ses visites de façon anonyme, pour savoir combien de personnes
              viennent. Avec votre accord, nous utilisons aussi des outils de mesure tiers
              (Meta, TikTok, Google) qui posent des cookies. Vous pouvez refuser — le site
              marche pareil.{' '}
              <Link to="/confidentialite" className="font-semibold text-primary-600 underline">
                En savoir plus
              </Link>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => repondre(true)}
                className="btn-primary flex-1 text-sm"
              >
                Accepter
              </button>
              <button
                onClick={() => repondre(false)}
                className="btn-outline flex-1 text-sm"
              >
                Refuser
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
