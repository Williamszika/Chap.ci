import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cookie, X, Check, Lock } from 'lucide-react'
import { isNative } from '../lib/native'
import { consentAccepted, consentDecided, onOuvrirReglages, reporte, reporter, setConsent } from '../lib/consent'
import { initMarketing } from '../lib/marketing'

/**
 * Bandeau de consentement aux cookies — barre pleine largeur, trois choix.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 *  CE QUE LE CONSENTEMENT GOUVERNE, ET CE QU'IL NE GOUVERNE PAS
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * Il gouverne UNE seule chose : les **pixels tiers** — Meta (Facebook /
 * Instagram), TikTok et Google Analytics. Ce sont eux qui posent de vrais
 * cookies et parlent à des serveurs étrangers. `marketing.ts` refuse de les
 * charger tant que `consentAccepted()` est faux ; c'est le seul endroit qui
 * décide, et il ne peut pas être contourné depuis l'interface.
 *
 * Il ne gouverne PAS deux choses, et le panneau de réglages le dit en clair
 * plutôt que de faire semblant :
 *
 *   · les cookies **indispensables** (session, sécurité, langue choisie) — sans
 *     eux on ne peut pas rester connecté ; ils ne partent chez personne ;
 *   · la **mesure d'audience de Chap.ci** — un identifiant aléatoire dans le
 *     navigateur, sans nom ni e-mail, qui ne sort jamais de nos serveurs. Elle
 *     est déclarée dans la politique de confidentialité au titre de l'intérêt
 *     légitime, et c'est ce qui permet de savoir combien de personnes viennent.
 *
 * **Un interrupteur qui ne fait rien est pire que pas d'interrupteur.** On ne
 * met donc PAS de faux boutons sur ces deux lignes : elles sont marquées
 * « toujours active », avec la raison à côté.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 *  LES QUATRE SORTIES, ET CE QUE CHACUNE VEUT DIRE
 * ═════════════════════════════════════════════════════════════════════════════
 *
 *   « Tout accepter »   → les pixels tiers se chargent TOUT DE SUITE
 *                         (`initMarketing()`), pas au prochain chargement.
 *   « Tout refuser »    → rien ne se charge, ni maintenant ni plus tard. Le
 *                         choix est mémorisé : plus de bandeau.
 *   « Régler mes choix »→ le panneau, où l'on voit les trois familles et où
 *                         l'on décide de la seule qui se décide.
 *   la croix ✕          → « plus tard ». Ce n'est PAS un accord : aucun pixel.
 *                         Le bandeau revient à la prochaine visite, mais ne
 *                         harcèle pas pendant celle-ci (`sessionStorage`).
 *
 * Les deux boutons de choix ont un **POIDS ÉGAL** — même taille, même hauteur,
 * côte à côte. Un bandeau qui met « Refuser » en tout petit gris n'est pas un
 * vrai choix, et la loi ivoirienne sur les données comme les règles des
 * magasins d'applications demandent un consentement libre. Seule la couleur
 * distingue l'action recommandée, comme partout ailleurs sur le site.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 *  L'HISTOIRE, PARCE QU'ELLE EXPLIQUE DEUX RÉGLAGES QUI ONT L'AIR ARBITRAIRES
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * **Les 3 secondes d'attente.** Le bandeau n'est pas la première chose qu'on
 * veut mettre devant un nouveau visiteur. À 900 ms, sur une 3G d'Abidjan, la
 * page n'était pas encore là et le bandeau arrivait par-dessus une photo qui
 * n'avait pas fini de charger.
 *
 * **Le z-[75].** Ce bandeau portait `z-50`, sous la pop-up newsletter (z-70).
 * Le 10/09/2026, le Patron a envoyé une capture des deux ouvertes en même
 * temps : le voile de la pop-up recouvrait le bandeau, et « Accepter » comme
 * « Refuser » ne recevaient plus un seul clic. **Un consentement qu'on ne peut
 * pas donner n'est pas un consentement.** Deux corrections : la pop-up ne
 * s'arme plus tant que ce bandeau attend une réponse (`NewsletterPrompt`), et
 * ce bandeau passe devant tout ce qui s'ouvre seul. L'ordre complet des calques
 * est écrit plus bas, sur le `className`.
 *
 * Dans l'app native, pas de pixels web : pas de bandeau.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [reglages, setReglages] = useState(false)
  // L'état du seul interrupteur qui existe. Pré-coché sur le choix précédent
  // quand on rouvre les réglages — sinon on ne « règle » rien, on recommence.
  const [tiers, setTiers] = useState(() => consentAccepted())
  const titreId = useId()
  const panneauRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isNative) return
    const t = setTimeout(() => setVisible(!consentDecided() && !reporte()), 3000)
    return () => clearTimeout(t)
  }, [])

  // Rouvrir depuis la politique de confidentialité, à tout moment, même après
  // avoir répondu. C'est ce qui rend le refus réversible.
  useEffect(() => onOuvrirReglages(() => {
    setTiers(consentAccepted())
    setReglages(true)
    setVisible(true)
  }), [])

  // Fermer le panneau SANS enregistrer.
  //
  // Deux situations, et elles ne se ferment pas pareil :
  //   · on n'a jamais répondu (panneau ouvert depuis la barre) → la barre reste,
  //     la question n'est pas réglée ;
  //   · on avait déjà répondu (panneau rouvert depuis la page Confidentialité)
  //     → on ne rouvre PAS une barre à quelqu'un qui a déjà choisi. Sans ce
  //     `consentDecided()`, refermer le panneau ressuscitait le bandeau pour
  //     toujours.
  const fermerPanneau = () => {
    setReglages(false)
    if (consentDecided()) setVisible(false)
  }

  // Échap ferme le panneau (pas le bandeau : on ne veut pas qu'une touche
  // vaille une réponse). Le focus part sur le panneau à l'ouverture.
  useEffect(() => {
    if (!reglages) return
    panneauRef.current?.querySelector<HTMLElement>('button')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') fermerPanneau() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reglages])

  if (isNative || !visible) return null

  const repondre = (accepte: boolean) => {
    setConsent(accepte)
    if (accepte) initMarketing()
    setReglages(false)
    setVisible(false)
  }

  const plusTard = () => { reporter(); setVisible(false) }

  return (
    <>
      {/* ── LA BARRE ─────────────────────────────────────────────────────────
          Pleine largeur, collée en bas, au-dessus de tout ce qui s'ouvre seul.

          L'ORDRE DES CALQUES DU SITE, à respecter :
            z-40/50  la navigation, les feuilles, les menus
            z-[60]   les panneaux du site
            z-[70]   les fenêtres qui s'ouvrent SEULES (newsletter, admin)
         →  z-[75]   CETTE BARRE : devant tout ce qui s'ouvre seul
         →  z-[76]   son panneau de réglages, qui doit passer devant elle
            z-[80]   les messages fugaces (ils ne prennent pas le clic)
            z-[90]   la photo en plein écran, ouverte par un geste explicite —
                     la seule chose qui a le droit de masquer ce bandeau, le
                     temps qu'on regarde une photo, et il revient en la fermant.

          La vraie garantie n'est pas ce nombre : c'est que la newsletter ne
          s'arme plus tant que ce bandeau attend une réponse. Ceci en est la
          seconde ceinture, pour la prochaine fenêtre qu'on ajoutera sans y
          penser — et `npm run banc:front` rougit si un bouton de fenêtre est
          recouvert par un autre calque. */}
      <div
        className="fixed inset-x-0 bottom-0 z-[75] animate-fadeup border-t border-line bg-white shadow-[0_-8px_28px_-12px_rgba(120,70,10,0.28)]"
        role="dialog"
        aria-label="Consentement aux cookies"
        aria-describedby={titreId}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:flex-row md:items-center md:gap-6 md:py-3.5">
          <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-cream-100 md:grid" aria-hidden>
            <Cookie size={20} className="text-primary-600" />
          </span>

          {/* ── LE TEXTE, COURT SUR TÉLÉPHONE ─────────────────────────────────
              Première version : un seul paragraphe, complet, pour tout le
              monde. Sur un écran de 390 px il faisait HUIT lignes et mangeait
              40 % de la hauteur — mesuré en capture, pas deviné. Un bandeau qui
              recouvre la moitié du site n'est plus une information, c'est un
              mur, et on le referme sans lire.

              Deux niveaux, donc. Ce qui décide du clic est TOUJOURS visible :
              qui pose des cookies, et que refuser ne coûte rien. Le reste —
              notre propre comptage, anonyme et sans cookie tiers — n'appelle
              aucune décision : il apparaît sur grand écran, et il est écrit en
              entier dans le panneau et dans la politique de confidentialité.
              Rien n'est caché : c'est l'ordre de lecture qui change. */}
          <p id={titreId} className="min-w-0 flex-1 pr-10 text-[13px] leading-snug text-gray-600 md:pr-0">
            <b className="text-ink">Cookies et mesure d’audience.</b>{' '}
            {/* Le « aussi » se rapporte à la phrase précédente — qui n'existe
                QUE sur grand écran. Sur téléphone il ne renvoyait à rien : on
                lisait « nous utilisons aussi » sans avoir lu de premier terme.
                Vu en capture, pas à la relecture du code : c'est le genre de
                faute qu'une condition d'affichage fabrique et qu'aucune lecture
                linéaire du JSX ne montre. */}
            <span className="hidden md:inline">
              Chap.ci compte ses visites de façon anonyme, sans cookie tiers. Avec
              votre accord, nous utilisons aussi{' '}
            </span>
            <span className="md:hidden">Avec votre accord, nous utilisons{' '}</span>
            des outils de mesure tiers (Meta, TikTok, Google) qui posent des
            cookies. Vous pouvez refuser — le site marche pareil.{' '}
            <Link to="/confidentialite" className="font-semibold text-primary-600 underline">
              En savoir plus
            </Link>
          </p>

          {/* Les trois sorties. « Régler » se lit en premier, les deux réponses
              à POIDS ÉGAL ensuite — même hauteur, même largeur, côte à côte. */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => { setTiers(consentAccepted()); setReglages(true) }}
              className="min-h-[44px] shrink-0 px-1 text-[13px] font-semibold text-primary-700 underline underline-offset-2 sm:px-3 sm:text-sm"
            >
              Régler
              <span className="hidden sm:inline"> mes choix</span>
            </button>
            <button onClick={() => repondre(false)} className="btn-outline min-h-[44px] flex-1 px-3 py-2 text-[13px] sm:flex-none sm:px-4 sm:text-sm">
              Tout refuser
            </button>
            <button onClick={() => repondre(true)} className="btn-primary min-h-[44px] flex-1 px-3 py-2 text-[13px] sm:flex-none sm:px-4 sm:text-sm">
              Tout accepter
            </button>
          </div>
        </div>

        {/* « Plus tard ». Volontairement discrète : elle ne répond à rien, et on
            ne veut pas qu'elle passe pour la sortie facile d'un choix. Mais elle
            existe, parce qu'un bandeau qu'on ne peut pas écarter est un mur. */}
        <button
          onClick={plusTard}
          aria-label="Plus tard — fermer sans choisir"
          title="Plus tard"
          className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full text-gray-400 hover:bg-cream-100 hover:text-gray-700"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── LE PANNEAU DE RÉGLAGES ──────────────────────────────────────────── */}
      {reglages && (
        <div className="fixed inset-0 z-[76] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div
            ref={panneauRef}
            role="dialog"
            aria-modal="true"
            aria-label="Réglages des cookies"
            className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6"
          >
            <div className="mb-1 flex items-start justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-ink">Vos choix de cookies</h2>
              <button
                onClick={fermerPanneau}
                aria-label="Fermer les réglages"
                className="-mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-gray-400 hover:bg-cream-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 text-[13px] leading-snug text-gray-600">
              Trois familles, et une seule se règle. Les deux autres sont indiquées telles
              qu’elles sont — nous ne mettons pas d’interrupteur qui ne ferait rien.
            </p>

            <Famille
              titre="Indispensables"
              detail="Votre session (rester connecté), la sécurité, et la langue que vous avez choisie. Sans eux, le site ne peut pas fonctionner. Rien ne part chez un tiers."
              verrou="Toujours actifs"
            />
            <Famille
              titre="Mesure d’audience de Chap.ci"
              detail="Un identifiant aléatoire dans votre navigateur — sans nom, sans e-mail, sans cookie tiers — qui sert à compter les visites. Il ne sort jamais de nos serveurs. C’est ce qui nous dit si le site est utile, et c’est déclaré dans la politique de confidentialité."
              verrou="Toujours active"
            />
            <Famille
              titre="Outils de mesure tiers"
              detail="Meta (Facebook, Instagram), TikTok et Google Analytics. Ceux-là posent de vrais cookies et envoient des données à des sociétés étrangères, qui les traitent selon leurs propres règles. Ils servent à mesurer nos publicités. Si vous les refusez, le site marche exactement pareil."
              actif={tiers}
              onChange={setTiers}
            />

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button onClick={() => repondre(false)} className="btn-outline min-h-[44px] flex-1 py-2.5 text-sm">
                Tout refuser
              </button>
              <button onClick={() => repondre(tiers)} className="btn-primary min-h-[44px] flex-1 py-2.5 text-sm">
                Enregistrer mes choix
              </button>
            </div>
            <p className="mt-3 text-center text-[11.5px] text-gray-500">
              Vous pourrez revenir ici à tout moment : politique de confidentialité, § 11.
            </p>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Une famille de cookies dans le panneau.
 *
 * Deux formes, jamais mélangées : soit un vrai interrupteur (`actif` +
 * `onChange`), soit une mention verrouillée (`verrou`) qui dit pourquoi. On
 * n'affiche jamais un interrupteur désactivé et grisé : ça ressemble à un choix
 * qu'on vous refuse, alors que c'est une chose qui ne se choisit pas.
 */
function Famille({ titre, detail, verrou, actif, onChange }: {
  titre: string
  detail: string
  verrou?: string
  actif?: boolean
  onChange?: (v: boolean) => void
}) {
  const id = useId()
  return (
    <div className="border-t border-line py-3.5 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={onChange ? id : undefined} className="text-sm font-bold text-ink">
          {titre}
        </label>
        {verrou ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cream-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
            <Lock size={11} aria-hidden /> {verrou}
          </span>
        ) : (
          // Une case à cocher native : elle se touche par son libellé, elle est
          // annoncée correctement par les lecteurs d'écran, et elle ne dépend
          // d'aucune bibliothèque. Le banc mesure la boîte du <label>, pas celle
          // de la case (07/09/2026).
          <label className="flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 pl-3">
            <input
              id={id}
              type="checkbox"
              checked={!!actif}
              onChange={(e) => onChange?.(e.target.checked)}
              className="h-5 w-5 accent-action-600"
            />
            <span className="text-[13px] font-semibold text-gray-700">
              {actif ? <span className="inline-flex items-center gap-1 text-ivoire-green-dark"><Check size={13} /> Autorisés</span> : 'Refusés'}
            </span>
          </label>
        )}
      </div>
      <p className="mt-1 pr-2 text-[12.5px] leading-snug text-gray-600">{detail}</p>
    </div>
  )
}
