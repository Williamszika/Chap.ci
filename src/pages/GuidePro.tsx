import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, BadgeCheck, Store, BarChart3, Bot, Clock, ShieldCheck, Lock, ArrowRight,
} from 'lucide-react'
import { TYPES_PRO } from '../data/secteursPro'

/**
 * LE GUIDE DU COMPTE PROFESSIONNEL — la page qu'ouvre la notification.
 *
 * Ce guide existe parce qu'une fonctionnalité livrée que personne ne découvre
 * n'existe pas. Trois fois de suite sur ce projet, du travail fini est resté
 * invisible : la réponse automatique, le choix de langue, la traduction
 * d'annonce. Le Patron lui-même ne les trouvait pas.
 *
 * Une notification qui dirait seulement « le compte professionnel est
 * disponible » ne réglerait rien : elle déplace la question de « ça existe ? »
 * à « ça sert à quoi et comment on fait ? ». D'où cette page, et l'ordre dans
 * lequel elle répond :
 *
 *   1. ce que ça apporte — sinon pourquoi lire la suite ;
 *   2. ce qu'on va vous demander — pour qu'on puisse préparer ses papiers ;
 *   3. les étapes, numérotées, avec le chemin exact ;
 *   4. ce qui se passe après, et ce qu'on ne pourra plus changer.
 *
 * Le point 4 n'est pas une formalité : le nom commercial est VERROUILLÉ après
 * approbation (livraison du 27/08), parce qu'il s'affiche sur toutes les cartes
 * d'annonces du site. Quelqu'un qui l'apprend après coup est quelqu'un qui écrit
 * au support. On le dit donc avant.
 */

/** Ce que le badge apporte — quatre promesses, toutes vérifiables sur le site. */
const APPORTS: { icone: typeof BadgeCheck; titre: string; texte: string }[] = [
  {
    icone: BadgeCheck,
    titre: 'Le badge PRO sur toutes vos annonces',
    texte:
      'Il apparaît sur chaque carte, dans les résultats de recherche et sur votre page vendeur. '
      + 'C’est le premier signal que voit un acheteur qui hésite entre deux annonces au même prix.',
  },
  {
    icone: Store,
    titre: 'Une vraie vitrine de boutique',
    texte:
      'Bannière, logo, description de l’activité, horaires d’ouverture des sept jours, et une '
      + 'pastille qui dit « ouvert » ou « fermé » en temps réel. Le nom de votre boutique '
      + 's’affiche aussi sur chacune de vos annonces, partout sur le site.',
  },
  {
    icone: BarChart3,
    titre: 'Un tableau de bord de votre activité',
    texte:
      'Vues, contacts reçus, ventes, annonces qui s’essoufflent, heures et communes où l’on vous '
      + 'écrit le plus, et un bilan chaque lundi matin. De quoi savoir ce qui marche, au lieu de le deviner.',
  },
  {
    icone: Bot,
    titre: 'Des réponses plus rapides',
    texte:
      'Vos phrases toutes prêtes en un appui, et une réponse automatique qui accueille l’acheteur '
      + 'quand vous n’êtes pas devant votre téléphone. Un acheteur qui attend est un acheteur qui part.',
  },
]

/** Une étape du parcours. Le chemin exact, jamais « allez dans les réglages ». */
const ETAPES: { titre: string; detail: React.ReactNode }[] = [
  {
    titre: 'Ouvrez l’Espace Pro',
    detail: (
      <>
        Menu <b>Compte</b> → <b>Espace Pro</b>. Sur le site, l’adresse directe est{' '}
        <b>chap.ci/#/pro</b>. Le bouton en bas de cette page vous y emmène aussi.
      </>
    ),
  },
  {
    titre: 'Choisissez votre type d’organisation',
    detail: (
      <>
        Dix choix, du commerce à l’association. C’est lui qui décide du numéro qu’on vous
        demandera ensuite — et du secteur d’activité proposé.
      </>
    ),
  },
  {
    titre: 'Donnez le nom de votre organisation',
    detail: (
      <>
        C’est le nom qui s’affichera sur vos annonces et sur votre page vendeur.{' '}
        <b>Choisissez-le bien</b> : une fois le dossier approuvé, vous ne pourrez plus le changer
        seul (voir plus bas).
      </>
    ),
  },
  {
    titre: 'Ajoutez votre numéro — recommandé, pas obligatoire',
    detail: (
      <>
        RCCM, récépissé ou agrément selon votre type. Un numéro vérifiable{' '}
        <b>accélère beaucoup l’approbation</b>, et votre page vendeur affichera « registre
        vérifié » — sans jamais montrer le numéro lui-même à qui que ce soit.
      </>
    ),
  },
  {
    titre: 'Laissez un téléphone, et envoyez',
    detail: (
      <>
        Il sert à l’équipe si le dossier demande une précision. Puis <b>« Envoyer ma demande »</b>.
        C’est tout : il n’y a rien à payer, à aucun moment.
      </>
    ),
  },
]

export function GuidePro() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto w-full max-w-2xl px-4 pt-5 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-primary-600"
        >
          <ArrowLeft size={18} /> Retour
        </button>

        {/* L'en-tête dit l'essentiel avant tout défilement : c'est quoi, et
            combien ça coûte. « Gratuit » est la première question de tous. */}
        <header className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-5 text-white shadow-card md:p-6">
          <p className="text-[13px] font-bold uppercase tracking-wide text-white/80">Nouveauté</p>
          <h1 className="mt-1 font-display text-2xl font-black leading-tight md:text-3xl">
            Passez en compte professionnel 💼
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/90">
            Le badge <b>PRO</b> sur vos annonces, une vitrine de boutique, et un tableau de bord
            de votre activité. <b>C’est gratuit</b>, et la réponse arrive sous 24 à 48 h.
          </p>
        </header>

        {/* ── CE QUE ÇA APPORTE ─────────────────────────────────────────────── */}
        <h2 className="mt-7 font-display text-lg font-extrabold text-ink">Ce que ça vous apporte</h2>
        <div className="mt-3 space-y-3">
          {APPORTS.map((a) => (
            <div key={a.titre} className="flex gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
                <a.icone size={20} />
              </span>
              <div>
                <p className="text-[14px] font-bold text-ink">{a.titre}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-600">{a.texte}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── QUI PEUT DEMANDER ─────────────────────────────────────────────── */}
        <h2 className="mt-7 font-display text-lg font-extrabold text-ink">Qui peut le demander</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">
          Dix types d’organisation, et il n’y a pas de taille minimum&nbsp;: un artisan seul est
          aussi légitime qu’une agence.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TYPES_PRO.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-line2 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-gray-700"
            >
              <span aria-hidden>{t.emoji}</span> {t.label}
            </span>
          ))}
        </div>

        {/* ── LES ÉTAPES ────────────────────────────────────────────────────── */}
        <h2 className="mt-7 font-display text-lg font-extrabold text-ink">Comment faire, étape par étape</h2>
        <ol className="mt-3 space-y-3">
          {ETAPES.map((e, i) => (
            <li key={e.titre} className="flex gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
              <span className="tnum grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ivoire-green font-display text-[13px] font-black text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-[14px] font-bold text-ink">{e.titre}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-600">{e.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* ── APRÈS L'ENVOI ─────────────────────────────────────────────────── */}
        <h2 className="mt-7 font-display text-lg font-extrabold text-ink">Ce qui se passe ensuite</h2>
        <div className="mt-3 space-y-3">
          <div className="flex gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
            <Clock size={20} className="mt-0.5 shrink-0 text-primary-600" />
            <p className="text-[13px] leading-relaxed text-gray-700">
              <b className="text-ink">Réponse sous 24 à 48 h</b>, par e-mail et par notification.
              Si le dossier n’est pas retenu, le motif vous est donné et vous pouvez le corriger
              puis le redéposer — ce n’est jamais définitif.
            </p>
          </div>
          <div className="flex gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-ivoire-green" />
            <p className="text-[13px] leading-relaxed text-gray-700">
              <b className="text-ink">Votre numéro n’est jamais publié.</b> Il sert à l’équipe pour
              vérifier, et votre page affiche seulement « registre vérifié ». Le numéro lui-même ne
              quitte pas le serveur.
            </p>
          </div>
          {/* Dit AVANT, pas après. C'est la seule contrainte réelle du parcours,
              et l'apprendre trop tard est ce qui fait écrire au support. */}
          <div className="flex gap-3 rounded-2xl border border-primary-200 bg-[#FFF6EC] p-4">
            <Lock size={20} className="mt-0.5 shrink-0 text-primary-600" />
            <p className="text-[13px] leading-relaxed text-gray-700">
              <b className="text-ink">Le nom de boutique se verrouille après approbation.</b>{' '}
              Il s’affiche sur toutes vos annonces, avec la caution de notre validation&nbsp;: une
              boutique approuvée ne peut donc pas se renommer seule du jour au lendemain. Si votre
              enseigne change vraiment, écrivez-nous et nous le corrigeons. Raison de plus pour
              écrire le bon nom du premier coup.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/pro')}
          className="btn-primary mt-7 w-full py-3.5 text-base"
        >
          Déposer ma demande <ArrowRight size={18} />
        </button>
        <p className="mt-2 text-center text-[12.5px] text-gray-500">
          Gratuit, sans engagement, et vous gardez votre compte actuel.
        </p>
      </div>
    </div>
  )
}
