import { type ReactNode } from 'react'
import { Clock, Search, Timer } from 'lucide-react'
import { mediaUrl } from '../lib/native'
import { labelTypePro } from '../data/secteursPro'
import { formatFCFA, formatPrice } from '../lib/format'
import type { PublicProfile } from '../lib/profiles'

/**
 * LA VITRINE — la page qu'un acheteur voit en cliquant sur le nom d'une
 * boutique (planches validées par le Patron le 28/08).
 *
 * Le principe emprunté au tableau de bord — des chiffres en tête, des puces
 * qui filtrent, une recherche — mais retourné : ici les chiffres sont choisis
 * pour CELUI QUI REGARDE, pas pour celui qui vend. Un acheteur ne se demande
 * pas combien d'annonces la boutique a publiées ; il se demande si quelqu'un
 * va lui répondre.
 *
 * Trois des cinq blocs n'ont demandé aucune donnée nouvelle : la description
 * de l'entreprise, les sept jours d'horaires et l'état du registre partaient
 * déjà du serveur à chaque chargement — la page les jetait.
 */

type Pro = NonNullable<PublicProfile['pro']>
export type Horaire = { ouvert: boolean; de: string; a: string }

/* ── Horaires : ouvert maintenant ? ─────────────────────────────────────── */

/**
 * L'ORDRE DES JOURS — le piège de tout ce fichier.
 *
 * Le tableau enregistré par le professionnel commence au LUNDI (voir `JOURS`
 * dans ReglagesPro.tsx). `Date.getDay()` de JavaScript, lui, commence au
 * DIMANCHE. Lire l'un avec l'autre décale tout d'un jour : au premier essai,
 * la vitrine annonçait « Fermé » un vendredi à 17 h, alors que la boutique
 * était ouverte jusqu'à 18 h. Une boutique déclarée fermée alors qu'elle est
 * ouverte, c'est un acheteur qui va ailleurs.
 */
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

/** Dimanche=0 (JavaScript) → Lundi=0 (nos horaires). */
function indexJour(d: Date): number {
  return (d.getDay() + 6) % 7
}

/** « 08:00 » → 480. Renvoie null si l'heure est illisible. */
function enMinutes(h: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((h || '').trim())
  if (!m) return null
  const min = Number(m[1]) * 60 + Number(m[2])
  return Number.isFinite(min) ? min : null
}

export interface EtatOuverture {
  ouvert: boolean
  /** La phrase entière, prête à afficher. */
  phrase: string
}

/**
 * L'état de la boutique à l'instant où l'acheteur regarde.
 *
 * Abidjan est à UTC+0 : l'heure du navigateur est la bonne heure locale pour
 * la Côte d'Ivoire, et pour un visiteur d'ailleurs c'est SON heure qui
 * l'intéresse de toute façon — il veut savoir s'il peut écrire maintenant.
 */
export function etatOuverture(horaires?: Horaire[] | null, maintenant = new Date()): EtatOuverture | null {
  if (!horaires || horaires.length !== 7) return null
  const jour = indexJour(maintenant)
  const minute = maintenant.getHours() * 60 + maintenant.getMinutes()
  const aujourdhui = horaires[jour]

  if (aujourdhui?.ouvert) {
    const de = enMinutes(aujourdhui.de)
    const a = enMinutes(aujourdhui.a)
    if (de != null && a != null) {
      if (minute >= de && minute < a) return { ouvert: true, phrase: `Ouvert — ferme à ${aujourdhui.a}` }
      if (minute < de) return { ouvert: false, phrase: `Fermé — ouvre à ${aujourdhui.de}` }
    }
  }

  // Fermé : on cherche le prochain jour ouvert, jusqu'à une semaine plus loin.
  for (let i = 1; i <= 7; i++) {
    const j = horaires[(jour + i) % 7]
    if (!j?.ouvert || enMinutes(j.de) == null) continue
    const quand = i === 1 ? 'demain' : `${JOURS[(jour + i) % 7].toLowerCase()}`
    return { ouvert: false, phrase: `Fermé — rouvre ${quand} à ${j.de}` }
  }
  // Sept jours fermés : la boutique n'a pas d'horaires utiles, on se tait
  // plutôt que d'écrire « fermé pour toujours ».
  return null
}

/** La pastille verte ou grise, en tête de vitrine. */
export function PastilleOuverture({ etat }: { etat: EtatOuverture }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold ${
      etat.ouvert ? 'bg-ivoire-green/12 text-ivoire-green-dark' : 'bg-cream-100 text-gray-600'}`}>
      <span aria-hidden>{etat.ouvert ? '🟢' : '🕘'}</span> {etat.phrase}
    </span>
  )
}

/** Le tableau des sept jours, avec aujourd'hui mis en avant. */
export function CarteHoraires({ horaires }: { horaires: Horaire[] }) {
  const jour = indexJour(new Date())
  return (
    <div className="card p-4">
      <p className="flex items-center gap-1.5 font-display text-[15px] font-extrabold text-ink">
        <Clock size={15} className="text-primary-600" /> Horaires d’ouverture
      </p>
      <dl className="tnum mt-2.5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 text-[13px]">
        {horaires.map((h, i) => {
          const cejour = i === jour
          return (
            <div key={i} className="contents">
              <dt className={cejour ? 'font-bold text-ink' : 'text-gray-600'}>
                {cejour ? 'Aujourd’hui' : JOURS[i]}
              </dt>
              <dd className={h.ouvert
                ? cejour ? 'font-bold text-ivoire-green-dark' : 'text-gray-700'
                : 'text-gray-400'}>
                {h.ouvert && h.de && h.a ? `${h.de} – ${h.a}` : 'Fermé'}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

/* ── L'en-tête de boutique ──────────────────────────────────────────────── */

/**
 * ① L'en-tête. Le logo à gauche, le nom à côté, et sous le nom ce qu'on vend.
 *
 * L'ancienne version centrait une photo ronde et un nom : la mise en page d'un
 * profil personnel. Une boutique ne se présente pas comme une personne — et le
 * professionnel qui soigne l'en-tête de son tableau de bord doit retrouver la
 * même boutique côté acheteur.
 */
export function EnTeteVitrine({ pro, nom, lieu, badge, retour }: {
  pro: Pro
  nom: string
  lieu?: string | null
  badge?: ReactNode
  retour: ReactNode
}) {
  const depuis = pro.depuis ? new Date(pro.depuis).toLocaleDateString('fr-FR', {
    month: 'long', year: 'numeric',
  }) : null
  return (
    <header className="relative">
      <div className="relative h-28 w-full overflow-hidden md:h-40">
        {pro.banniere ? (
          <img src={mediaUrl(pro.banniere)} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary-500 to-primary-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-black/5" />
        <div className="absolute left-3 top-3 safe-top">{retour}</div>
        {/* La pastille se pose SUR la bannière, en face de la flèche : à côté
            du logo elle flottait sur le fond crème sans rien tenir. C'est
            aussi la place qu'elle occupe dans le tableau de bord — le
            professionnel retrouve sa boutique. */}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-wider text-white backdrop-blur-sm">
          ✓ Professionnel
        </span>
      </div>

      <div className="relative -mt-9 px-4 pb-4">
        <div className="grid h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-2xl border-[3px] border-white bg-cream-100 shadow-card md:h-20 md:w-20">
          {pro.logo ? (
            <img src={mediaUrl(pro.logo)} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center bg-gradient-to-br from-primary-500 to-primary-700 font-display text-3xl font-black text-white">
              {nom.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <h1 className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-[22px] font-black leading-tight text-ink md:text-2xl">
          <span className="break-words">{nom}</span>
          {badge}
        </h1>
        <p className="mt-0.5 text-[13px] text-gray-600">
          {labelTypePro(pro.type || '')}
          {pro.secteur ? <> · {pro.secteur}</> : null}
        </p>
        {(lieu || depuis) && (
          <p className="mt-0.5 text-[12px] text-gray-500">
            {lieu ? <>📍 {lieu}</> : null}
            {lieu && depuis ? ' · ' : ''}
            {depuis ? <>Professionnel depuis {depuis}</> : null}
          </p>
        )}
      </div>
    </header>
  )
}

/* ── Les quatre chiffres ────────────────────────────────────────────────── */

function Chiffre({ valeur, libelle, fort = false }: {
  valeur: ReactNode; libelle: string; fort?: boolean
}) {
  return (
    <div className={`rounded-2xl border px-2 py-2.5 text-center ${
      fort ? 'border-ivoire-green/25 bg-ivoire-green/8' : 'border-line bg-white'}`}>
      <p className={`tnum font-display text-[15px] font-extrabold leading-none md:text-base ${
        fort ? 'text-ivoire-green-dark' : 'text-ink'}`}>{valeur}</p>
      <p className="mt-1 text-[10px] leading-tight text-gray-500">{libelle}</p>
    </div>
  )
}

/**
 * « 2 h », « 25 min » — le délai de réponse dans une CASE de chiffre, où la
 * place manque. Pour une phrase, prenez `delaiPhrase` : « répond en < 1 min en
 * général » se lit mal.
 */
export function delaiCourt(s: number): string {
  if (s < 60) return '< 1 min'
  if (s < 3600) return `${Math.round(s / 60)} min`
  if (s < 86400) return `${Math.round(s / 3600)} h`
  const j = Math.round(s / 86400)
  return `${j} j`
}

/** Le même délai, écrit pour être lu dans une phrase. */
export function delaiPhrase(s: number): string {
  if (s < 60) return 'moins d’une minute'
  if (s < 3600) return `${Math.round(s / 60)} min`
  if (s < 86400) { const h = Math.round(s / 3600); return `${h} h` }
  const j = Math.round(s / 86400)
  return `${j} jour${j > 1 ? 's' : ''}`
}

/** « 6 mois », « 2 ans » — l'ancienneté du badge professionnel. */
function anciennete(depuis: number): string {
  const mois = Math.max(0, Math.round((Date.now() - depuis) / (30.44 * 86400000)))
  if (mois < 1) return 'ce mois-ci'
  if (mois < 12) return `${mois} mois`
  const ans = Math.floor(mois / 12)
  return `${ans} an${ans > 1 ? 's' : ''}`
}

/**
 * ② Les quatre chiffres qui décident l'acheteur.
 *
 * Le délai de réponse passe EN PREMIER et en vert : c'est lui qui déclenche le
 * message. Il était déjà calculé, déjà affiché — mais perdu en petit sous les
 * boutons, là où personne ne le lisait.
 */
export function ChiffresVitrine({ reponse, note, avis, ventes, depuis }: {
  reponse: number | null
  note: number
  avis: number
  ventes: number
  depuis?: number | null
}) {
  return (
    <div className="grid grid-cols-4 gap-2 px-4">
      <Chiffre fort={reponse != null}
        valeur={reponse != null ? delaiCourt(reponse) : '—'}
        libelle={reponse != null ? 'répond en général' : 'pas encore de contact'} />
      <Chiffre valeur={avis > 0 ? `★ ${note.toFixed(1)}` : '—'}
        libelle={avis > 0 ? `${avis} avis` : 'aucun avis'} />
      <Chiffre valeur={formatPrice(ventes)}
        libelle={ventes > 1 ? 'ventes conclues' : 'vente conclue'} />
      <Chiffre valeur={depuis ? anciennete(depuis) : '—'} libelle="professionnel" />
    </div>
  )
}

/* ── Chercher et filtrer dans la boutique ───────────────────────────────── */

export interface PuceBoutique { id: string; label: string; n: number }

/* ── L'aperçu de la boutique ────────────────────────────────────────────── */

/** Le prix qui compte : celui de la promotion tant qu'elle court. */
export function prixEffectif(a: { price?: number; promoPrice?: number; promoUntil?: number }): number {
  const promo = a.promoPrice ?? 0
  if (promo > 0 && (a.promoUntil ?? 0) > Date.now()) return promo
  return a.price ?? 0
}

/** Une annonce en promotion, ici et maintenant. */
export function enPromotion(a: { promoPrice?: number; promoUntil?: number }): boolean {
  return (a.promoPrice ?? 0) > 0 && (a.promoUntil ?? 0) > Date.now()
}

const TRENTE_JOURS = 30 * 86400000

export interface AnnonceApercu {
  id: string
  price?: number
  promoPrice?: number
  promoUntil?: number
  createdAt?: number
  delivery?: boolean
}

/**
 * ⑥ L'APERÇU DE LA BOUTIQUE — le dernier des gestes du tableau de bord qui
 * manquait à la vitrine, et le seul qui manquait vraiment.
 *
 * Dans votre administration, l'onglet « Aperçu » répond à « par où je
 * commence ? ». Ici la question de l'acheteur est la même, posée autrement :
 * « qu'est-ce que cette boutique vend, et à quel prix ? ». On y répond AVANT
 * la grille, pas après l'avoir parcourue.
 *
 * Les quatre chiffres sont ceux d'un acheteur, pas d'un vendeur : le prix
 * d'entrée décide s'il reste, la livraison décide s'il peut acheter. Le nombre
 * de vues, lui, n'a rien à faire ici.
 */
export function ApercuBoutique({ annonces, promos, onVoirPromos }: {
  annonces: AnnonceApercu[]
  promos: number
  onVoirPromos: () => void
}) {
  const n = annonces.length
  if (n === 0) return null
  const prix = annonces.map(prixEffectif).filter((p) => p > 0)
  const mini = prix.length ? Math.min(...prix) : 0
  const recentes = annonces.filter((a) => (a.createdAt ?? 0) > Date.now() - TRENTE_JOURS).length
  const livrees = annonces.filter((a) => a.delivery).length

  return (
    <div className="space-y-2.5 px-4">
      <div className="grid grid-cols-4 gap-2">
        <Chiffre valeur={formatPrice(n)} libelle={n > 1 ? 'annonces en ligne' : 'annonce en ligne'} />
        <Chiffre fort={mini > 0} valeur={mini > 0 ? formatFCFA(mini) : '—'} libelle="à partir de" />
        <Chiffre valeur={formatPrice(recentes)}
          libelle={recentes > 1 ? 'nouveautés ce mois-ci' : 'nouveauté ce mois-ci'} />
        <Chiffre valeur={livrees > 0 ? formatPrice(livrees) : '—'}
          libelle={livrees > 1 ? 'avec livraison' : 'avec livraison'} />
      </div>

      {/* La ligne qui dit par où commencer — l'équivalent, pour l'acheteur, de
          la ligne rouge « ce qui attend une décision » de votre tableau de
          bord. Elle n'apparaît que s'il y a vraiment quelque chose à voir. */}
      {promos > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-accent-ocre/40 bg-cream-100 px-3.5 py-2.5">
          <p className="text-[13px] font-bold text-ink">
            🏷️ {promos} annonce{promos > 1 ? 's' : ''} en promotion en ce moment
          </p>
          <button onClick={onVoirPromos}
            className="rounded-lg bg-primary-500 px-3 py-1.5 text-[12px] font-extrabold text-white">
            Les voir
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * ④ La recherche et les puces — les mêmes briques que le tableau de bord,
 * retournées vers l'acheteur.
 *
 * Une boutique de quarante annonces est sinon une grille qu'on parcourt du
 * haut et dont on se lasse au tiers. Celui qui cherche des chaises ne doit pas
 * défiler devant les arches de ballons.
 */
export function FiltresBoutique({ q, onQ, puce, onPuce, puces }: {
  q: string
  onQ: (v: string) => void
  puce: string
  onPuce: (id: string) => void
  puces: PuceBoutique[]
}) {
  return (
    <div className="space-y-2.5 px-4">
      <span className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5">
        <Search size={15} className="shrink-0 text-gray-400" />
        <input value={q} onChange={(e) => onQ(e.target.value)}
          aria-label="Chercher dans cette boutique"
          placeholder="Chercher dans cette boutique…"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-gray-400" />
        {q !== '' && (
          <button onClick={() => onQ('')} aria-label="Effacer"
            className="shrink-0 text-gray-400">✕</button>
        )}
      </span>
      {puces.length > 1 && (
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {puces.map((p) => (
            <button key={p.id} onClick={() => onPuce(p.id)}
              className={`chip-etat ${puce === p.id
                ? 'bg-ink text-white' : 'bg-white text-gray-600 ring-1 ring-line'}`}>
              {p.label} · {p.n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Le mot cherché, insensible aux accents et à la casse. */
export function contientVitrine(champ: string | null | undefined, q: string): boolean {
  if (!q) return true
  const propre = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return propre(String(champ ?? '')).includes(propre(q))
}

/* ── À propos ───────────────────────────────────────────────────────────── */

/**
 * ⑤ La description de l'entreprise — et non la biographie personnelle du
 * compte, que l'onglet affichait jusqu'ici. Un professionnel qui avait soigné
 * sa description voyait donc un « À propos » vide.
 *
 * Le registre : « ✓ Registre vérifié », sans le numéro. Le Patron a tranché le
 * 28/08 — et le serveur n'envoie plus l'immatriculation du tout, car ce qui
 * part dans la réponse est public, que la page le dessine ou non.
 */
export function AProposVitrine({ pro, bio, lieu, reponse }: {
  pro: Pro
  bio?: string | null
  lieu?: string | null
  reponse: number | null
}) {
  const texte = (pro.description || '').trim() || (bio || '').trim()
  return (
    <div className="card p-4">
      <p className="font-display text-[15px] font-extrabold text-ink">{pro.nom || 'À propos'}</p>
      {texte ? (
        <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{texte}</p>
      ) : (
        <p className="mt-1.5 text-sm text-gray-500">
          Cette boutique n’a pas encore écrit sa présentation.
        </p>
      )}

      {pro.registreVerifie && (
        <div className="mt-3 border-t border-line pt-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ivoire-green/10 px-3 py-1.5 text-[11.5px] font-bold text-ivoire-green-dark">
            ✓ Registre vérifié par l’équipe Chap.ci
          </span>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-gray-500">
            Le numéro officiel de cette entreprise a été contrôlé au registre avant
            l’approbation du compte.
          </p>
        </div>
      )}

      <div className="mt-3 space-y-1 text-[13px] text-gray-600">
        {lieu && <p>📍 {lieu}</p>}
        {reponse != null && (
          <p className="flex items-center gap-1.5">
            <Timer size={13} className="text-ivoire-green" />
            Répond en {delaiPhrase(reponse)} en général
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Le regroupement des annonces en puces ──────────────────────────────── */

/**
 * Les puces de la boutique, construites sur ce que le vendeur vend RÉELLEMENT :
 * une catégorie n'apparaît que s'il y a des annonces dedans. Une liste de
 * catégories fixes afficherait des filtres qui ne trouvent rien.
 */
export function pucesDeBoutique<T extends AnnonceApercu & { categoryId?: string }>(
  annonces: T[],
  nomCategorie: (id: string) => string,
): PuceBoutique[] {
  const parCat = new Map<string, number>()
  for (const a of annonces) {
    const c = a.categoryId || ''
    if (c) parCat.set(c, (parCat.get(c) ?? 0) + 1)
  }
  const puces: PuceBoutique[] = [{ id: 'tout', label: 'Tout', n: annonces.length }]
  for (const [id, n] of [...parCat.entries()].sort((a, b) => b[1] - a[1])) {
    puces.push({ id: `cat:${id}`, label: nomCategorie(id), n })
  }
  // « Moins de 20 000 F » : le filtre de l'acheteur qui a un budget, pas une
  // catégorie en tête. Il n'apparaît que s'il trie vraiment quelque chose.
  const petits = annonces.filter((a) => prixEffectif(a) > 0 && prixEffectif(a) < 20000).length
  if (petits > 0 && petits < annonces.length) {
    puces.push({ id: 'petit', label: 'Moins de 20 000 F', n: petits })
  }
  // La promotion en dernier, mais c'est elle que vise le bouton « Les voir »
  // de l'aperçu : les deux doivent parler du même tas.
  const promos = annonces.filter(enPromotion).length
  if (promos > 0 && promos < annonces.length) {
    puces.push({ id: 'promo', label: '🏷️ En promotion', n: promos })
  }
  return puces
}

/** Applique la puce choisie à la liste. */
export function filtrerParPuce<T extends AnnonceApercu & { categoryId?: string }>(
  annonces: T[], puce: string,
): T[] {
  if (puce === 'tout') return annonces
  if (puce === 'petit') return annonces.filter((a) => prixEffectif(a) > 0 && prixEffectif(a) < 20000)
  if (puce === 'promo') return annonces.filter(enPromotion)
  if (puce.startsWith('cat:')) {
    const id = puce.slice(4)
    return annonces.filter((a) => a.categoryId === id)
  }
  return annonces
}
