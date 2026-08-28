import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BadgeCheck, Camera, Eye, Handshake, Heart, Hourglass, Loader2, LogIn,
  LogOut, MessageSquare, Package, Plus, Zap,
} from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { phpProStatut, phpProDemande, phpProTableau, phpProVitrine, type Horaire } from '../lib/php'
import { TYPES_PRO, labelTypePro } from '../data/secteursPro'
import { formatFCFA, formatPrice, timeAgo } from '../lib/format'
import { mediaUrl, thumbUrl } from '../lib/native'
import { downscaleImage, downscaleListingImage } from '../lib/image'
import { DEPUIS_COMPTE } from '../components/RetourCompte'

/**
 * L'espace professionnel du site — le pendant exact de l'écran « Devenir
 * professionnel » de l'application, mêmes types, mêmes secteurs, mêmes
 * routes serveur.
 *
 * Quatre états : pas de dossier → le formulaire ; en attente → le sablier ;
 * refusé → le motif + le formulaire pré-rempli ; approuvé → LE TABLEAU DE
 * BORD PROFESSIONNEL (chiffres du compte, badge, actions).
 */

interface Statut {
  status: '' | 'en_attente' | 'approuve' | 'refuse'
  type?: string
  nom?: string
  numero?: string
  secteur?: string
  motif?: string
}

export interface Tableau {
  pro: {
    nom: string; type: string; secteur: string; depuis: number | null
    numero?: string; tel?: string
    banniere?: string; logo?: string
    /** Ce que fait l'entreprise, et ses sept jours d'ouverture. */
    description?: string; horaires?: Horaire[] | null
    /** La réponse automatique : active ou non, sa phrase, et le nombre de
     *  phrases toutes prêtes — de quoi renseigner la tuile sans second appel. */
    reponseAuto?: boolean; reponseAutoTexte?: string; reponsesPretes?: number
  }
  /** Tout le compte, pour les tuiles et la fiche d'entreprise de la page Compte. */
  compte?: {
    nom: string; email: string; commune: string; villeId?: string; regionId?: string
    avatar: string; twofa: boolean
    annoncesMasquees: number; annoncesVendues: number; favorisEnregistres: number
    commandesEnCours: number; commandesFinalisees: number
    pubsActives: number; pubFin: number
  }
  stats: {
    annoncesActives: number
    annoncesTotal: number
    vues: number
    favoris: number
    conversations: number
    note: number | null
    avis: number
  }
  periode: number
  kpi: Record<'vues' | 'contacts' | 'favoris' | 'ventes', { n: number; prev: number }>
  tauxReponse: number | null
  aRepondre: { n: number; noms: string[] }
  serie: { jour: string; n: number }[]
  top: {
    id: string; titre: string; prix: number; image: string | null
    vues: number; favoris: number; contacts: number
    etat: 'une' | 'active' | 'vendue' | 'masquee'
  }[]
  activite: {
    type: 'contact' | 'favori' | 'avis' | 'vente' | 'record'
    quand: number; nom?: string; annonce?: string
    note?: number; commentaire?: string; prix?: number; n?: number
  }[]
}

export function EspacePro() {
  const { user, enabled } = useAuth()
  const navigate = useNavigate()
  const [statut, setStatut] = useState<Statut | null>(null)
  const [erreur, setErreur] = useState('')

  const charger = () => {
    setErreur('')
    phpProStatut<Statut>().then(setStatut).catch((e) => setErreur((e as Error).message))
  }
  useEffect(() => { if (user) charger() }, [user])

  if (!user) {
    return (
      <Coquille>
        <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
          <p className="text-4xl">💼</p>
          <p className="mt-3 font-display text-lg font-bold text-ink">Espace professionnel</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
            Connectez-vous pour demander votre badge PRO et suivre votre activité.
          </p>
          {enabled && (
            <button onClick={() => navigate('/connexion')} className="btn-primary mx-auto mt-4">
              <LogIn size={18} /> Se connecter
            </button>
          )}
        </div>
      </Coquille>
    )
  }
  if (erreur) {
    return (
      <Coquille>
        <div className="rounded-2xl bg-white p-8 text-center shadow-card">
          <p className="text-sm font-medium text-red-600">{erreur}</p>
          <button onClick={charger} className="btn-outline mx-auto mt-4">Réessayer</button>
        </div>
      </Coquille>
    )
  }
  if (!statut) {
    return <Coquille><div className="grid place-items-center py-20"><Loader2 className="animate-spin text-primary-500" size={24} /></div></Coquille>
  }

  if (statut.status === 'approuve') return <Coquille><TableauPro /></Coquille>
  if (statut.status === 'en_attente') {
    return (
      <Coquille>
        <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
          <Hourglass className="mx-auto text-primary-500" size={40} />
          <p className="mt-4 font-display text-lg font-bold text-ink">Demande en cours d’examen</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">
            Nous examinons votre dossier{statut.nom ? <> pour <b>{statut.nom}</b></> : null} et
            vous répondons sous 24 à 48 h, par e-mail et par notification.
          </p>
        </div>
      </Coquille>
    )
  }
  return <Coquille><Formulaire statut={statut} onDepose={charger} /></Coquille>
}

function Coquille({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-200 md:min-h-0 md:bg-transparent">
      <div className="mx-auto w-full max-w-2xl px-4 py-5 md:max-w-4xl md:px-6 md:py-6">
        {children}
      </div>
    </div>
  )
}

/* ---- Le tableau de bord professionnel ------------------------------------ */

const JOURS_COURTS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']

/** « jeu 21 » à partir d'un jour ISO « 2026-08-21 ». */
function jourCourt(jour: string): string {
  const d = new Date(`${jour}T12:00:00Z`)
  return `${JOURS_COURTS[d.getUTCDay()]} ${d.getUTCDate()}`
}

/** La flèche de tendance d'un chiffre clé, comparée à la période précédente. */
function Delta({ n, prev, absolu = false }: { n: number; prev: number; absolu?: boolean }) {
  if (prev <= 0 && n <= 0) return <span className="chip-delta bg-cream-100 text-gray-500">—</span>
  if (prev <= 0) return <span className="chip-delta bg-emerald-50 text-emerald-700">▲ +{n}</span>
  const diff = n - prev
  if (absolu) {
    if (diff === 0) return <span className="chip-delta bg-cream-100 text-gray-500">=</span>
    return diff > 0
      ? <span className="chip-delta bg-emerald-50 text-emerald-700">▲ {diff}</span>
      : <span className="chip-delta bg-red-50 text-red-600">▼ {Math.abs(diff)}</span>
  }
  const pct = Math.round((diff / prev) * 100)
  if (pct === 0) return <span className="chip-delta bg-cream-100 text-gray-500">=</span>
  return pct > 0
    ? <span className="chip-delta bg-emerald-50 text-emerald-700">▲ {pct} %</span>
    : <span className="chip-delta bg-red-50 text-red-600">▼ {Math.abs(pct)} %</span>
}

function Kpi({ icone, valeur, libelle, delta }: {
  icone: React.ReactNode; valeur: React.ReactNode; libelle: string; delta: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-3.5 shadow-card">
      <span className="text-primary-600">{icone}</span>
      <p className="tnum mt-1.5 font-display text-xl font-extrabold leading-tight text-ink">{valeur}</p>
      <p className="text-[11px] text-gray-500">{libelle}</p>
      <p className="mt-1">{delta}</p>
    </div>
  )
}

/** La courbe des vues, jour par jour, sur la période choisie. */
function GraphVues({ serie }: { serie: { jour: string; n: number }[] }) {
  const L = 660; const H = 200; const BAS = 168; const HAUT = 16; const G = 34
  const max = Math.max(5, ...serie.map((p) => p.n))
  // Une échelle « ronde » : le plafond est arrondi au cran supérieur lisible.
  const cran = max <= 10 ? 2 : max <= 25 ? 5 : max <= 50 ? 10 : max <= 100 ? 20 : max <= 250 ? 50 : 100
  const plafond = Math.ceil(max / cran) * cran
  const x = (i: number) => serie.length < 2 ? G : G + (i * (L - G - 12)) / (serie.length - 1)
  const y = (n: number) => BAS - (n / plafond) * (BAS - HAUT)
  const pts = serie.map((p, i) => `${x(i).toFixed(1)},${y(p.n).toFixed(1)}`).join(' ')
  const iMax = serie.reduce((m, p, i) => (p.n > serie[m].n ? i : m), 0)
  const dernier = serie[serie.length - 1]
  // Sur 30 jours, on n'étiquette qu'un jour sur cinq pour garder l'axe lisible.
  const pas = serie.length > 10 ? 5 : 1
  return (
    <svg viewBox={`0 0 ${L} ${H + 28}`} className="mt-2 w-full" role="img"
      aria-label="Courbe des vues de vos annonces, jour par jour">
      <defs>
        <linearGradient id="aire-vues" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F77F00" stopOpacity=".28" />
          <stop offset="1" stopColor="#F77F00" stopOpacity=".02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={G} x2={L - 12} y1={BAS - f * (BAS - HAUT)} y2={BAS - f * (BAS - HAUT)}
          stroke="#EFE6D7" strokeWidth="1" />
      ))}
      {[0, 0.5, 1].map((f) => (
        <text key={f} x={G - 6} y={BAS - f * (BAS - HAUT) + 3.5} fontSize="10"
          fill="#9A9287" textAnchor="end" className="tnum">{Math.round(f * plafond)}</text>
      ))}
      {serie.length > 1 && (
        <>
          <path fill="url(#aire-vues)" d={`M${pts.split(' ').join(' L')} L${x(serie.length - 1)},${BAS} L${x(0)},${BAS} Z`} />
          <polyline fill="none" stroke="#F77F00" strokeWidth="2.5" strokeLinejoin="round" points={pts} />
        </>
      )}
      {serie[iMax].n > 0 && (
        <>
          <circle cx={x(iMax)} cy={y(serie[iMax].n)} r="4.5" fill="#F77F00" stroke="#fff" strokeWidth="2" />
          <text x={x(iMax)} y={y(serie[iMax].n) - 9} fontSize="11" fontWeight="800"
            fill="#C05E00" textAnchor="middle" className="tnum">{serie[iMax].n}</text>
        </>
      )}
      {dernier && iMax !== serie.length - 1 && (
        <circle cx={x(serie.length - 1)} cy={y(dernier.n)} r="4" fill="#fff" stroke="#F77F00" strokeWidth="2.5" />
      )}
      {serie.map((p, i) => {
        const fin = i === serie.length - 1
        if (!fin && i % pas !== 0) return null
        return (
          <text key={p.jour} x={x(i)} y={H + 18} fontSize="10.5" textAnchor="middle"
            fill={fin ? '#1B1A17' : '#6B6459'} fontWeight={fin ? 800 : 400}>
            {fin ? 'auj.' : jourCourt(p.jour)}
          </text>
        )
      })}
    </svg>
  )
}

const ETATS: Record<string, { texte: string; classe: string }> = {
  une: { texte: 'À la une', classe: 'bg-cream-100 text-primary-700' },
  active: { texte: 'Active', classe: 'bg-emerald-50 text-emerald-700' },
  vendue: { texte: 'Vendue', classe: 'bg-gray-100 text-gray-500' },
  masquee: { texte: 'Masquée', classe: 'bg-gray-100 text-gray-500' },
}

/** Le tableau de bord professionnel — aussi affiché en tête de la page
 *  Compte pour les comptes approuvés (`dansCompte` masque le lien « Toutes
 *  mes annonces », redondant à cet endroit). */
export function TableauPro({ dansCompte = false, onOnglet, onDeconnexion }: {
  dansCompte?: boolean
  /** Ouvre un onglet interne de la page Compte (annonces, achats, ventes, pubs, params). */
  onOnglet?: (onglet: 'annonces' | 'achats' | 'ventes' | 'pubs' | 'params'
    | 'stats' | 'fiche' | 'profil' | 'notifs' | 'securite' | 'adresse' | 'reponses') => void
  onDeconnexion?: () => void
} = {}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [periode, setPeriode] = useState<7 | 30>(7)
  const [t, setT] = useState<Tableau | null>(null)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState<'banniere' | 'logo' | null>(null)
  const [erreurImage, setErreurImage] = useState('')
  const champFichier = useRef<HTMLInputElement>(null)
  const cible = useRef<'banniere' | 'logo' | null>(null)
  useEffect(() => {
    phpProTableau<Tableau>(periode).then(setT).catch((e) => setErreur((e as Error).message))
  }, [periode])

  if (erreur) return <p className="rounded-2xl bg-white p-6 text-center text-sm text-red-600 shadow-card">{erreur}</p>
  if (!t) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-primary-500" size={24} /></div>

  const s = t.stats
  const k = t.kpi
  const c = t.compte
  // La vitrine : on choisit un fichier, on le réduit (la bannière est large,
  // le logo carré), on l'envoie, et le tableau se met à jour sans recharger.
  const choisirImage = (quoi: 'banniere' | 'logo') => {
    setErreurImage('')
    cible.current = quoi
    champFichier.current?.click()
  }
  const envoyerImage = async (fichier: File) => {
    const quoi = cible.current
    if (!quoi) return
    setEnvoi(quoi)
    setErreurImage('')
    try {
      const donnees = quoi === 'banniere'
        ? await downscaleListingImage(fichier, 1600, 0.82)
        : await downscaleImage(fichier, 512, 0.85)
      const r = await phpProVitrine({ [quoi]: donnees })
      setT((ancien) => ancien && { ...ancien, pro: { ...ancien.pro, banniere: r.banniere, logo: r.logo } })
    } catch (e) {
      setErreurImage((e as Error).message || 'L’image n’a pas pu être envoyée.')
    } finally {
      setEnvoi(null)
    }
  }
  const retirerImage = async (quoi: 'banniere' | 'logo') => {
    setEnvoi(quoi)
    setErreurImage('')
    try {
      const r = await phpProVitrine({ [quoi]: '' })
      setT((ancien) => ancien && { ...ancien, pro: { ...ancien.pro, banniere: r.banniere, logo: r.logo } })
    } catch (e) {
      setErreurImage((e as Error).message)
    } finally {
      setEnvoi(null)
    }
  }
  const maxVuesTop = Math.max(1, ...t.top.map((a) => a.vues))
  // « se termine dans 6 j » : le compte à rebours d'une campagne en cours.
  const joursPub = c?.pubFin ? Math.ceil((c.pubFin - Date.now()) / 86400000) : 0
  const finPub = joursPub > 1 ? `dans ${joursPub} j` : joursPub === 1 ? 'demain' : joursPub === 0 ? "aujourd’hui" : ''
  // L'état des réponses automatiques, en une ligne : la phrase entière ferait
  // trois lignes dans la tuile, on n'en montre que le début.
  const nPretes = t.pro.reponsesPretes ?? 0
  const phraseAuto = (t.pro.reponseAutoTexte ?? '').trim()
  const apercuAuto = phraseAuto.length > 44 ? `${phraseAuto.slice(0, 44).trimEnd()}…` : phraseAuto
  const sousReponses = t.pro.reponseAuto
    ? (apercuAuto ? `Active : « ${apercuAuto} »` : 'Active')
    : nPretes > 0
      ? `Inactive · ${nPretes} phrase${nPretes > 1 ? 's' : ''} prête${nPretes > 1 ? 's' : ''}`
      : 'Répondre même la nuit, en une phrase'
  return (
    <div className="space-y-4">
      {/* L'en-tête de marque : la VITRINE (bannière + logo), le badge, le nom
          commercial, la note, la période et les actions. La bannière et le logo
          se changent d'ici même (demande du Patron, 27/08). */}
      {/* La bannière occupe TOUT le bandeau, derrière les écritures — le
          Patron ne voulait plus du bloc plein qui masquait son image (27/08).
          Seul un voile sombre en dégradé, du bas vers le haut, garde les
          textes lisibles sans effacer la photo. Sans bannière, on retrouve
          le dégradé de la marque. */}
      <div className="relative overflow-hidden rounded-2xl text-white shadow-card">
        {t.pro.banniere ? (
          <>
            <img src={mediaUrl(t.pro.banniere)} alt=""
              className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/32 to-black/12" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700" />
        )}

        <button onClick={() => choisirImage('banniere')} disabled={envoi !== null}
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-xl bg-black/45 px-3 py-1.5 text-[12px] font-bold text-white backdrop-blur-sm transition hover:bg-black/60 disabled:opacity-60">
          {envoi === 'banniere'
            ? <Loader2 size={14} className="animate-spin" />
            : <Camera size={14} />}
          {t.pro.banniere ? 'Changer la bannière' : 'Ajouter une bannière'}
        </button>

        <div className={`relative p-5 md:p-6 ${t.pro.banniere ? 'pt-16 md:pt-20' : ''}`}
          style={t.pro.banniere ? { textShadow: '0 1px 4px rgba(0,0,0,.55)' } : undefined}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 gap-4">
            {/* Le logo, posé sur l'image. */}
            <div className="relative shrink-0 self-start">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border-[3px] border-white bg-cream-100 shadow-lg md:h-24 md:w-24">
                {t.pro.logo ? (
                  <img src={mediaUrl(t.pro.logo)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary-500 to-primary-700 font-display text-3xl font-black text-white">
                    {(t.pro.nom || 'P').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button onClick={() => choisirImage('logo')} disabled={envoi !== null}
                aria-label={t.pro.logo ? 'Changer le logo' : 'Ajouter un logo'}
                className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-primary-600 text-white shadow transition hover:bg-primary-700 disabled:opacity-60">
                {envoi === 'logo' ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
              </button>
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider">
                <BadgeCheck size={14} /> Compte professionnel
              </span>
              <p className="mt-2 font-display text-2xl font-extrabold leading-tight md:text-3xl">{t.pro.nom}</p>
              <p className="mt-1 text-sm text-white/85">
                {labelTypePro(t.pro.type)}
                {t.pro.secteur ? <> · {t.pro.secteur}</> : null}
              </p>
              <p className="mt-0.5 text-xs text-white/70">
                {s.note != null ? <>★ {s.note} ({s.avis} avis) · </> : null}
                {t.pro.depuis != null ? <>Professionnel depuis {timeAgo(t.pro.depuis).replace('il y a ', '')}</> : null}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            <div className="flex self-stretch rounded-full bg-white/20 p-1 sm:self-end">
              {([7, 30] as const).map((p) => (
                <button key={p} onClick={() => setPeriode(p)}
                  className={`flex-1 rounded-full px-4 py-1.5 text-[13px] font-bold transition sm:flex-none ${
                    periode === p ? 'bg-white text-primary-700' : 'text-white/90'}`}>
                  {p} jours
                </button>
              ))}
            </div>
            <div className="flex gap-2 self-stretch sm:self-end">
              <button onClick={() => navigate('/publier')}
                className="flex-1 rounded-xl bg-white px-4 py-2 text-center text-[13px] font-extrabold text-primary-700 shadow sm:flex-none">
                <Plus size={15} className="mr-1 inline-block align-[-2px]" />Publier
              </button>
              {user && (
                <Link to={`/vendeur/${user.id}`}
                  className="flex-1 rounded-xl border-[1.5px] border-white/70 px-4 py-2 text-center text-[13px] font-bold text-white sm:flex-none">
                  Ma page vendeur
                </Link>
              )}
            </div>
          </div>
        </div>
        {erreurImage && (
          <p className="mt-3 rounded-xl bg-black/25 px-3 py-2 text-[12.5px] font-medium">{erreurImage}</p>
        )}
        {(t.pro.banniere || t.pro.logo) && (
          <p className="mt-2 text-[11px] text-white/60">
            Votre bannière et votre logo apparaissent aussi sur votre page vendeur.
            {t.pro.banniere && <> <button onClick={() => retirerImage('banniere')} className="underline">Retirer la bannière</button></>}
            {t.pro.logo && <> · <button onClick={() => retirerImage('logo')} className="underline">Retirer le logo</button></>}
          </p>
        )}
        </div>
      </div>
      {/* Le sélecteur de fichier, invisible : les deux boutons l'ouvrent. */}
      <input ref={champFichier} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) envoyerImage(f) }} />

      {/* Les six chiffres clés de la période, chacun avec sa tendance. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi icone={<Eye size={17} />} valeur={formatPrice(k.vues.n)}
          libelle="Vues d’annonces" delta={<Delta n={k.vues.n} prev={k.vues.prev} />} />
        <Kpi icone={<MessageSquare size={17} />} valeur={k.contacts.n}
          libelle="Contacts reçus" delta={<Delta n={k.contacts.n} prev={k.contacts.prev} />} />
        <Kpi icone={<Heart size={17} />} valeur={k.favoris.n}
          libelle="Favoris reçus" delta={<Delta n={k.favoris.n} prev={k.favoris.prev} />} />
        <Kpi icone={<Zap size={17} />} valeur={t.tauxReponse != null ? `${t.tauxReponse} %` : '—'}
          libelle="Taux de réponse"
          delta={t.tauxReponse == null
            ? <span className="chip-delta bg-cream-100 text-gray-500">Pas encore de contact</span>
            : t.tauxReponse >= 80
              ? <span className="chip-delta bg-cream-100 text-primary-700">Répond vite</span>
              : <span className="chip-delta bg-cream-100 text-gray-500">À améliorer</span>} />
        <Kpi icone={<Handshake size={17} />} valeur={k.ventes.n}
          libelle="Ventes conclues" delta={<Delta n={k.ventes.n} prev={k.ventes.prev} absolu />} />
        <Kpi icone={<Package size={17} />} valeur={s.annoncesActives}
          libelle="Annonces en ligne"
          delta={<span className="chip-delta bg-cream-100 text-gray-500">{s.annoncesTotal} au total</span>} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* La courbe des vues. */}
        <div className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-card md:p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-[15px] font-extrabold text-ink">Vues de vos annonces</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {periode} derniers jours, comparés aux {periode} précédents
              </p>
            </div>
            <div className="text-right">
              <p className="tnum font-display text-2xl font-extrabold text-ink">
                {formatPrice(k.vues.n)}
              </p>
              <Delta n={k.vues.n} prev={k.vues.prev} />
            </div>
          </div>
          <div className="grid flex-1 content-center"><GraphVues serie={t.serie} /></div>
        </div>

        <div className="flex flex-col gap-4">
          {/* La carte « à faire » : les messages qui attendent. */}
          {t.aRepondre.n > 0 && (
            <div className="rounded-2xl border border-[#F3D9B8] bg-cream-100 p-4 md:p-5">
              <p className="font-display text-[15px] font-extrabold text-ink">
                ⏳ {t.aRepondre.n} message{t.aRepondre.n > 1 ? 's' : ''} sans réponse
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                {t.aRepondre.noms.length > 0 ? <>{t.aRepondre.noms.join(', ')} attend{t.aRepondre.n > 1 ? 'ent' : ''} depuis plus de 24 h. </> : null}
                Répondre vite fait monter votre taux de réponse — et vos ventes.
              </p>
              <button onClick={() => navigate('/messages', DEPUIS_COMPTE)} className="btn-primary mt-3 py-2.5 text-[13px]">
                Répondre maintenant
              </button>
            </div>
          )}

          {/* Le fil d'activité. */}
          <div className="flex-1 rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
            <p className="font-display text-[15px] font-extrabold text-ink">Activité récente</p>
            {t.activite.length === 0 ? (
              <p className="mt-3 text-xs text-gray-500">
                Vos contacts, favoris, avis et ventes apparaîtront ici.
              </p>
            ) : (
              <div className="mt-2">
                {t.activite.map((e, i) => <Evenement key={i} e={e} premier={i === 0} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Le classement des annonces — sur la page Compte, la tuile « Mes
          annonces » y mène déjà : on ne l'affiche qu'en dehors. */}
      {!dansCompte && (
      <div className="rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="font-display text-[15px] font-extrabold text-ink">Vos annonces qui marchent</p>
            <p className="mt-0.5 text-xs text-gray-500">Classées par vues sur les {periode} derniers jours</p>
          </div>
          <Link to="/compte" className="whitespace-nowrap text-xs font-bold text-primary-700">
            Toutes mes annonces →
          </Link>
        </div>
        {t.top.length === 0 ? (
          <div className="mt-4 rounded-xl bg-cream-100 p-5 text-center">
            <p className="text-sm text-gray-600">Publiez votre première annonce pour voir vos chiffres ici.</p>
            <button onClick={() => navigate('/publier')} className="btn-primary mx-auto mt-3 py-2.5 text-[13px]">
              <Plus size={16} /> Publier une annonce
            </button>
          </div>
        ) : (
          <div className="mt-2 divide-y divide-line">
            {t.top.map((a) => (
              <button key={a.id} onClick={() => navigate(`/annonce/${a.id}`)}
                className="flex w-full items-center gap-3 py-2.5 text-left">
                {a.image ? (
                  <img src={mediaUrl(thumbUrl(a.image))} alt="" loading="lazy"
                    className="h-10 w-[52px] flex-shrink-0 rounded-lg border border-line object-cover" />
                ) : (
                  <span className="grid h-10 w-[52px] flex-shrink-0 place-items-center rounded-lg bg-cream-100 text-lg">📦</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-ink">{a.titre}</span>
                  <span className="text-xs font-extrabold text-primary-700">{formatFCFA(a.prix)}</span>
                  <span className="mt-1 block h-[5px] w-24 overflow-hidden rounded-full bg-cream-100">
                    <span className="block h-full rounded-full bg-primary-500"
                      style={{ width: `${Math.round((a.vues / maxVuesTop) * 100)}%` }} />
                  </span>
                </span>
                <span className="tnum whitespace-nowrap text-right text-xs text-gray-500">
                  <b className="text-[13px] text-ink">{a.vues}</b> vues<br />
                  {a.favoris} ❤ · {a.contacts} 💬
                </span>
                <span className={`chip-delta ${ETATS[a.etat].classe}`}>{ETATS[a.etat].texte}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      )}

      {/* ===== TOUT LE COMPTE, INTÉGRÉ (page Compte d'un professionnel) =====
          Le Patron l'a demandé le 27/08 : un professionnel ne doit plus avoir
          son tableau d'un côté et ses réglages en liste de l'autre. Chaque
          tuile porte son chiffre — « 3 sans réponse » se voit sans ouvrir
          Messages. */}
      {dansCompte && c && (
        <>
          <p className="mt-2 px-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-400">
            Gérer ma boutique
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Tuile emoji="📦" fond="#FFF3E4" titre="Mes annonces"
              sous={[
                `${s.annoncesActives} en ligne`,
                c.annoncesMasquees > 0 ? `${c.annoncesMasquees} masquée${c.annoncesMasquees > 1 ? 's' : ''}` : '',
                `${c.annoncesVendues} vendue${c.annoncesVendues > 1 ? 's' : ''}`,
              ].filter(Boolean).join(' · ')}
              onClick={() => onOnglet?.('annonces')} />
            <Tuile emoji="💬" fond="#EDEFF2" titre="Messages"
              sous={t.aRepondre.n > 0
                ? `${t.aRepondre.n} sans réponse depuis 24 h`
                : `${s.conversations} conversation${s.conversations > 1 ? 's' : ''}`}
              badge={t.aRepondre.n > 0
                ? <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-red-600 px-1.5 text-[11px] font-extrabold text-white">{t.aRepondre.n}</span>
                : undefined}
              onClick={() => navigate('/messages', DEPUIS_COMPTE)} />
            {/* La réponse automatique se règle ici. Elle a longtemps vécu au
                BAS de la liste des messages, invisible tant qu'aucun acheteur
                n'avait écrit : on préparait sa phrase d'accueil après avoir
                raté le premier client. La tuile dit son état sans l'ouvrir. */}
            <Tuile emoji="🤖" fond="#EDEFF2" titre="Réponses automatiques"
              sous={sousReponses}
              badge={t.pro.reponseAuto
                ? <span className="grid h-5 place-items-center rounded-full bg-emerald-50 px-2 text-[10.5px] font-extrabold text-emerald-700">ON</span>
                : undefined}
              onClick={() => onOnglet?.('reponses')} />
            <Tuile emoji="🛍️" fond="#FFF6E0" titre="Mes commandes"
              sous={`${c.commandesEnCours} en cours · ${c.commandesFinalisees} finalisée${c.commandesFinalisees > 1 ? 's' : ''}`}
              onClick={() => onOnglet?.('achats')} />
            <Tuile emoji="❤️" fond="#FBEAE7" titre="Mes favoris"
              sous={`${c.favorisEnregistres} annonce${c.favorisEnregistres > 1 ? 's' : ''} surveillée${c.favorisEnregistres > 1 ? 's' : ''}`}
              onClick={() => navigate('/favoris', DEPUIS_COMPTE)} />
            <Tuile emoji="📊" fond="#E4F5EC" titre="Statistiques de vente"
              sous="Le chemin de l’acheteur, vos heures, vos communes"
              onClick={() => onOnglet?.('stats')} />
            <Tuile emoji="📣" fond="#FFF3E4" titre="Mes publicités"
              sous={c.pubsActives > 0
                ? `${c.pubsActives} campagne${c.pubsActives > 1 ? 's' : ''} active${c.pubsActives > 1 ? 's' : ''}${finPub ? ` · se termine ${finPub}` : ''}`
                : 'Audience, coût, prolongation'}
              badge={c.pubsActives > 0
                ? <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-primary-500 px-1.5 text-[11px] font-extrabold text-white">{c.pubsActives}</span>
                : undefined}
              onClick={() => onOnglet?.('pubs')} />
          </div>

          <p className="mt-2 px-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-400">
            Mon entreprise
          </p>
          <div className="rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="font-display text-[15px] font-extrabold text-ink">Fiche professionnelle</p>
                <p className="mt-0.5 text-xs text-gray-500">Ce que les acheteurs voient sur votre page vendeur</p>
              </div>
              <button onClick={() => onOnglet?.('fiche')}
                className="whitespace-nowrap text-xs font-bold text-primary-700">
                Modifier ma fiche →
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 xl:grid-cols-4">
              <Champ etiquette="Nom commercial" valeur={t.pro.nom} />
              <Champ etiquette="Type" valeur={labelTypePro(t.pro.type)} />
              <Champ etiquette="Secteur" valeur={t.pro.secteur || '—'} />
              <Champ etiquette={t.pro.type === 'boutique' || t.pro.type === 'commerce' ? 'Numéro RCCM' : 'Numéro'}
                valeur={t.pro.numero || 'non renseigné'} />
              <Champ etiquette="Téléphone pro" valeur={t.pro.tel || 'non renseigné'} />
              <Champ etiquette="Commune" valeur={c.commune || 'non renseignée'} />
              <Champ etiquette="Badge PRO" ton="vert"
                valeur={t.pro.depuis ? `✓ Actif depuis ${dateCourte(t.pro.depuis)}` : '✓ Actif'} />
              <Champ etiquette="Page publique" ton="orange"
                valeur={user ? 'Voir ma page vendeur →' : '—'}
                lien={user ? `/vendeur/${user.id}` : undefined} />
            </div>
          </div>

          <p className="mt-2 px-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-400">
            Mon compte &amp; sécurité
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Tuile emoji="👤" fond="#EDEFF2" titre="Profil & photo"
              sous={[c.nom, c.email].filter(Boolean).join(' · ')}
              onClick={() => onOnglet?.('profil')} />
            <Tuile emoji="🔔" fond="#FFF3E4" titre="Notifications"
              sous="Messages, favoris, rappels du professionnel"
              onClick={() => onOnglet?.('notifs')} />
            <Tuile emoji="🔒" fond="#E4F5EC" titre="Sécurité"
              sous="Mot de passe · double authentification"
              badge={c.twofa
                ? <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-[11px] font-extrabold text-emerald-700">✓</span>
                : undefined}
              onClick={() => onOnglet?.('securite')} />
            <Tuile emoji="📍" fond="#E8EEFB" titre="Adresse & localisation"
              sous={c.commune ? `${c.commune} · position enregistrée` : 'Ajoutez votre commune'}
              onClick={() => onOnglet?.('adresse')} />
            <Tuile emoji="❓" fond="#FFF3E4" titre="Aide & support"
              sous="Questions fréquentes, conseils vendeur"
              onClick={() => navigate('/aide', DEPUIS_COMPTE)} />
            <Tuile emoji="🛡️" fond="#E4F5EC" titre="Contacter l’équipe"
              sous="Une question, un doute, une annonce masquée"
              onClick={() => navigate('/assistance', DEPUIS_COMPTE)} />
          </div>

          {onDeconnexion && (
            <div className="flex justify-center pt-1">
              <button onClick={onDeconnexion}
                className="inline-flex items-center gap-2 rounded-xl border border-[#F3C9C4] bg-red-50 px-4 py-2.5 text-[13px] font-extrabold text-red-600 transition active:scale-[0.98]">
                <LogOut size={16} /> Se déconnecter
              </button>
            </div>
          )}
        </>
      )}

      <p className="px-1 text-center text-xs leading-relaxed text-gray-400">
        {dansCompte
          ? <>Chiffres réels de votre compte, mis à jour en continu · Tout votre compte est ici — plus rien à chercher ailleurs</>
          : <>Chiffres réels de votre compte, mis à jour en continu · Les tendances comparent la période choisie à la précédente</>}
      </p>
    </div>
  )
}

/** « 6 août » — la date courte d'un badge ou d'une échéance. */
function dateCourte(ms: number): string {
  return new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

/** Une tuile d'accès : emoji sur pastille teintée, titre, sous-titre chiffré,
 *  et à droite soit un compteur, soit le chevron. */
function Tuile({ emoji, fond, titre, sous, badge, onClick }: {
  emoji: string; fond: string; titre: string; sous: string
  badge?: React.ReactNode; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className="flex items-start gap-3 rounded-2xl border border-line bg-white p-3.5 text-left shadow-card transition hover:shadow-md active:scale-[0.98]">
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl text-[17px]"
        style={{ background: fond }} aria-hidden>{emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-extrabold text-ink">{titre}</span>
        <span className="mt-0.5 block text-[11.5px] leading-snug text-gray-500">{sous}</span>
      </span>
      <span className="grid shrink-0 self-center place-items-center">
        {badge ?? <span className="text-gray-300" aria-hidden>›</span>}
      </span>
    </button>
  )
}

/** Un champ de la fiche professionnelle : étiquette en capitales, valeur en gras. */
function Champ({ etiquette, valeur, ton, lien }: {
  etiquette: string; valeur: string; ton?: 'vert' | 'orange'; lien?: string
}) {
  const classe = `mt-0.5 block truncate text-[13.5px] font-bold ${
    ton === 'vert' ? 'text-ivoire-green-dark' : ton === 'orange' ? 'text-primary-700' : 'text-ink'}`
  return (
    <div className="min-w-0">
      <span className="block text-[10.5px] font-bold uppercase tracking-wider text-gray-400">{etiquette}</span>
      {lien
        ? <Link to={lien} className={classe}>{valeur}</Link>
        : <span className={classe}>{valeur}</span>}
    </div>
  )
}

/** Une ligne du fil d'activité. */
function Evenement({ e, premier }: { e: Tableau['activite'][number]; premier: boolean }) {
  const rendu = (() => {
    switch (e.type) {
      case 'contact': return {
        icone: '💬', fond: 'bg-cream-100',
        titre: e.nom ? `Nouveau contact — ${e.nom}` : 'Nouveau contact',
        texte: e.annonce ? `sur « ${e.annonce} »` : '',
      }
      case 'favori': return {
        icone: '❤️', fond: 'bg-red-50',
        titre: 'Nouveau favori', texte: e.annonce ? `sur « ${e.annonce} »` : '',
      }
      case 'avis': return {
        icone: '⭐', fond: 'bg-emerald-50',
        titre: `Nouvel avis — ${e.note ?? '?'} étoile${(e.note ?? 0) > 1 ? 's' : ''}`,
        texte: e.commentaire ? `« ${e.commentaire} »` : '',
      }
      case 'vente': return {
        icone: '🤝', fond: 'bg-emerald-50',
        titre: 'Vente conclue',
        texte: e.annonce ? `« ${e.annonce} »${e.prix ? ` — ${formatFCFA(e.prix)}` : ''}` : '',
      }
      default: return {
        icone: '👁️', fond: 'bg-cream-100',
        titre: 'Record de vues', texte: `${e.n ?? 0} vues en une journée, votre meilleur score`,
      }
    }
  })()
  return (
    <div className={`flex items-start gap-2.5 py-2 ${premier ? '' : 'border-t border-line'}`}>
      <span className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-[13px] ${rendu.fond}`}>
        {rendu.icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-ink">{rendu.titre}</span>
        {rendu.texte && <span className="block truncate text-[11px] text-gray-500">{rendu.texte}</span>}
      </span>
      <span className="whitespace-nowrap pt-0.5 text-[10.5px] text-gray-400">{timeAgo(e.quand)}</span>
    </div>
  )
}

/* ---- Le formulaire « Devenir professionnel » ----------------------------- */

function Formulaire({ statut, onDepose }: { statut: Statut; onDepose: () => void }) {
  const typeInitial =
    statut.type === 'commerce' ? 'boutique'
      : TYPES_PRO.some((t) => t.id === statut.type) ? (statut.type as string) : 'boutique'
  const [type, setType] = useState(typeInitial)
  const [nom, setNom] = useState(statut.nom ?? '')
  const [numero, setNumero] = useState(statut.numero ?? '')
  const defTypeSecteurs = TYPES_PRO.find((t) => t.id === typeInitial)!.secteurs
  const [secteur, setSecteur] = useState(
    statut.secteur && defTypeSecteurs.includes(statut.secteur) ? statut.secteur : defTypeSecteurs[0],
  )
  const [tel, setTel] = useState('')
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState('')

  const typeCourant = TYPES_PRO.find((t) => t.id === type)!

  const choisirType = (id: string) => {
    setType(id)
    const t = TYPES_PRO.find((x) => x.id === id)!
    if (!t.secteurs.includes(secteur)) setSecteur(t.secteurs[0])
  }

  const envoyer = async (e: FormEvent) => {
    e.preventDefault()
    setErreur('')
    if (nom.trim().length < 2) { setErreur('Indiquez le nom de votre organisation.'); return }
    setBusy(true)
    try {
      await phpProDemande({ type, nom: nom.trim(), numero: numero.trim(), secteur, tel: tel.trim() })
      onDepose()
    } catch (err) {
      setErreur((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* L'argument : ce que le badge apporte. */}
      <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-5 text-white shadow-card md:p-6">
        <p className="font-display text-xl font-extrabold md:text-2xl">Passez en compte professionnel 💼</p>
        <p className="mt-1 max-w-xl text-sm text-white/90">
          Le badge <b>PRO</b> sur toutes vos annonces et votre page vendeur, la confiance des
          acheteurs, et un tableau de bord dédié à votre activité. Gratuit.
        </p>
      </div>

      {statut.status === 'refuse' && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-bold">Votre précédente demande n’a pas été retenue.</p>
          {statut.motif && <p className="mt-1">Motif : {statut.motif}</p>}
          <p className="mt-1">Corrigez votre dossier ci-dessous et redéposez-le.</p>
        </div>
      )}

      <form onSubmit={envoyer} className="space-y-4 rounded-2xl border border-line bg-white p-4 shadow-card md:p-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-700">Votre type d’organisation</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TYPES_PRO.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => choisirType(t.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  type === t.id
                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                    : 'border-line2 bg-white hover:bg-cream-100'
                }`}
              >
                <span className="text-xl" aria-hidden>{t.emoji}</span>
                <span className="mt-1 block text-[13px] font-semibold leading-snug text-ink">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="pro-nom" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Nom de l’organisation
          </label>
          <input
            id="pro-nom" value={nom} onChange={(e) => setNom(e.target.value)}
            maxLength={80} placeholder="Ex : Boutique Aya & Fils" className="input"
          />
        </div>

        <div>
          <label htmlFor="pro-numero" className="mb-1.5 block text-sm font-semibold text-gray-700">
            {typeCourant.numero} <span className="font-normal text-gray-400">(recommandé)</span>
          </label>
          <input
            id="pro-numero" value={numero} onChange={(e) => setNumero(e.target.value)}
            maxLength={60} placeholder={typeCourant.numero === 'Numéro RCCM' ? 'Ex : CI-ABJ-2026-B-12345' : ''}
            className="input"
          />
          {typeCourant.numero === 'Numéro RCCM' && (
            <p className="mt-1 text-xs text-gray-500">
              Un numéro vérifiable (rccm.ohada.org) accélère beaucoup l’approbation.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="pro-secteur" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Secteur principal
          </label>
          <select
            id="pro-secteur" value={secteur} onChange={(e) => setSecteur(e.target.value)}
            className="input appearance-none"
          >
            {typeCourant.secteurs.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="pro-tel" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Téléphone professionnel <span className="font-normal text-gray-400">(facultatif)</span>
          </label>
          <input
            id="pro-tel" value={tel} onChange={(e) => setTel(e.target.value)}
            maxLength={20} placeholder="07 00 00 00 00" className="input"
          />
        </div>

        {erreur && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{erreur}</p>}

        <button type="submit" disabled={busy} className="btn-primary w-full justify-center py-3.5">
          {busy ? <Loader2 size={20} className="animate-spin" /> : <>Déposer ma demande</>}
        </button>
        <p className="text-center text-xs text-gray-500">
          Réponse sous 24 à 48 h, par e-mail et par notification.
        </p>
      </form>
    </div>
  )
}
