import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BadgeCheck, BarChart3, Eye, Heart, Hourglass, Loader2, LogIn,
  MessageSquare, Package, Plus, Star, Store,
} from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { phpProStatut, phpProDemande, phpProTableau } from '../lib/php'
import { TYPES_PRO, labelTypePro } from '../data/secteursPro'
import { timeAgo } from '../lib/format'

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

interface Tableau {
  pro: { nom: string; type: string; secteur: string; depuis: number | null }
  stats: {
    annoncesActives: number
    annoncesTotal: number
    vues: number
    favoris: number
    conversations: number
    note: number | null
    avis: number
  }
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

/** Le tableau de bord professionnel — aussi affiché en tête de la page
 *  Compte pour les comptes approuvés (`dansCompte` masque l'action « Mes
 *  annonces », redondante à cet endroit). */
export function TableauPro({ dansCompte = false }: { dansCompte?: boolean } = {}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [t, setT] = useState<Tableau | null>(null)
  const [erreur, setErreur] = useState('')
  useEffect(() => {
    phpProTableau<Tableau>().then(setT).catch((e) => setErreur((e as Error).message))
  }, [])

  if (erreur) return <p className="rounded-2xl bg-white p-6 text-center text-sm text-red-600 shadow-card">{erreur}</p>
  if (!t) return <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-primary-500" size={24} /></div>

  const s = t.stats
  return (
    <div className="space-y-4">
      {/* L'en-tête de marque : le badge, le nom commercial, l'ancienneté. */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-5 text-white shadow-card md:p-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider">
          <BadgeCheck size={14} /> Compte professionnel
        </span>
        <p className="mt-3 font-display text-2xl font-extrabold leading-tight md:text-3xl">{t.pro.nom}</p>
        <p className="mt-1 text-sm text-white/85">
          {labelTypePro(t.pro.type)}
          {t.pro.secteur ? <> · {t.pro.secteur}</> : null}
        </p>
        {t.pro.depuis != null && (
          <p className="mt-0.5 text-xs text-white/70">Professionnel depuis {timeAgo(t.pro.depuis)}</p>
        )}
      </div>

      {/* Les chiffres du compte — la vue d'un coup d'œil. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Chiffre icone={<Package size={18} />} valeur={s.annoncesActives} libelle="Annonces en ligne" />
        <Chiffre icone={<Eye size={18} />} valeur={s.vues} libelle="Vues au total" />
        <Chiffre icone={<Heart size={18} />} valeur={s.favoris} libelle="Favoris reçus" />
        <Chiffre icone={<MessageSquare size={18} />} valeur={s.conversations} libelle="Conversations" />
        <Chiffre
          icone={<Star size={18} />}
          valeur={s.note != null ? `${s.note} ★` : '—'}
          libelle={s.avis > 0 ? `${s.avis} avis` : 'Pas encore d’avis'}
        />
        <Chiffre icone={<BarChart3 size={18} />} valeur={s.annoncesTotal} libelle="Annonces au total" />
      </div>

      {/* Les gestes du quotidien. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button onClick={() => navigate('/publier')} className="btn-primary justify-center py-3">
          <Plus size={18} /> Publier une annonce
        </button>
        {user && (
          <Link to={`/vendeur/${user.id}`} className="btn-outline justify-center py-3 text-center">
            <Store size={18} /> Ma page vendeur
          </Link>
        )}
        {!dansCompte && (
          <Link to="/compte" className="btn-outline justify-center py-3 text-center">
            <Package size={18} /> Mes annonces
          </Link>
        )}
      </div>

      <p className="px-1 text-xs leading-relaxed text-gray-500">
        Le badge <b>PRO</b> apparaît sur vos annonces et votre page vendeur. Les chiffres
        ci-dessus couvrent l’ensemble de votre compte, depuis le début.
      </p>
    </div>
  )
}

function Chiffre({ icone, valeur, libelle }: { icone: React.ReactNode; valeur: number | string; libelle: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-600">{icone}</span>
      <p className="tnum mt-2 font-display text-xl font-extrabold text-ink">{valeur}</p>
      <p className="text-xs text-gray-500">{libelle}</p>
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
