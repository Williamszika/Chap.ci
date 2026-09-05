import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Package, Store, MessageSquare, Plus, Check, Timer } from 'lucide-react'
import { categories } from '../data/categories'
import {
  EnTeteVitrine, ChiffresVitrine, PastilleOuverture, CarteHoraires, AProposVitrine,
  FiltresBoutique, ApercuBoutique, etatOuverture, pucesDeBoutique, filtrerParPuce,
  contientVitrine, enPromotion,
  delaiPhrase,
} from '../components/Vitrine'
import { mediaUrl } from '../lib/native'
import { PillesReseaux, ListeReseaux } from '../components/Reseaux'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { useApp } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'
import { useToast } from '../store/ToastContext'
import { fetchProfile, type PublicProfile } from '../lib/profiles'
import { fetchReviewsForSeller, fetchReviewsForTarget, averageRating } from '../lib/reviews'
import { getOrCreateConversation } from '../lib/messages'
import { isPhp } from '../lib/backend'
import { ListingCard } from '../components/ListingCard'
import { Stars } from '../components/Stars'
import { fetchSellerResponseTime } from '../lib/api'
import { timeAgo } from '../lib/format'
import type { Review } from '../types'

export function SellerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { listings } = useApp()
  const { user } = useAuth()
  const toast = useToast()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [tab, setTab] = useState<'annonces' | 'avis' | 'apropos'>('annonces')
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [busy, setBusy] = useState(false)

  const sellerListings = listings.filter((l) => l.sellerId === id)
  const displayName = profile?.pro?.nom
    || profile?.fullName || sellerListings[0]?.sellerName || 'Vendeur'
  const { avg, count } = averageRating(reviews)
  const location = sellerListings[0]?.commune ?? null

  useEffect(() => {
    if (!id) return
    let active = true
    // Réputation unifiée : avis reçus comme vendeur ET comme acheteur (PHP).
    Promise.all([fetchProfile(id), isPhp ? fetchReviewsForTarget(id) : fetchReviewsForSeller(id)])
      .then(([p, r]) => {
        if (!active) return
        setProfile(p)
        setReviews(r)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  // Temps de réponse habituel — le même chiffre que sur la fiche annonce, ici
  // juste au-dessus du bouton « Contacter », là où la question se pose.
  const [reponse, setReponse] = useState<number | null>(null)
  useEffect(() => {
    setReponse(null)
    if (!id) return
    let vivant = true
    fetchSellerResponseTime(id).then((r) => { if (vivant) setReponse(r.medianSeconds) })
    return () => { vivant = false }
  }, [id])

  // Contacter le vendeur : ouvre (ou crée) la conversation via l'une de ses annonces.
  async function contactSeller() {
    if (!user) {
      navigate('/connexion')
      return
    }
    const listing = sellerListings[0]
    if (!listing) {
      toast.error('Ce vendeur n’a pas encore d’annonce à contacter.')
      return
    }
    setBusy(true)
    try {
      const convId = await getOrCreateConversation(listing, user.id)
      navigate(`/messages/${convId}`)
    } catch {
      toast.error('Impossible d’ouvrir la conversation.')
      setBusy(false)
    }
  }

  function toggleFollow() {
    if (!user) {
      navigate('/connexion')
      return
    }
    const next = !following
    setFollowing(next)
    toast.success(next ? `Vous suivez ${displayName}.` : `Vous ne suivez plus ${displayName}.`)
  }

  // ─── LA VITRINE (planches validées le 28/08) ─────────────────────────────
  // Un compte professionnel approuvé a droit à la vitrine complète ; un
  // vendeur ordinaire garde la page simple, qui lui va très bien.
  const pro = profile?.pro ?? null
  const etat = etatOuverture(pro?.horaires)
  const horaires = pro?.horaires && pro.horaires.length === 7 ? pro.horaires : null

  // ④ Chercher et filtrer DANS la boutique.
  const [q, setQ] = useState('')
  const [puce, setPuce] = useState('tout')
  const nomCategorie = (cid: string) =>
    categories.find((c) => c.id === cid)?.name ?? cid
  const puces = useMemo(
    () => pucesDeBoutique(sellerListings, nomCategorie),
    [sellerListings],
  )
  const nPromos = useMemo(() => sellerListings.filter(enPromotion).length, [sellerListings])
  const annoncesVues = useMemo(() => {
    const parPuce = filtrerParPuce(sellerListings, puce)
    if (!q.trim()) return parPuce
    return parPuce.filter((l) => contientVitrine(l.title, q)
      || contientVitrine(l.description, q)
      || contientVitrine(nomCategorie(l.categoryId), q))
  }, [sellerListings, puce, q])

  const fleche = (
    <button onClick={() => navigate(-1)} aria-label="Retour"
      className="grid h-11 w-11 place-items-center rounded-full bg-white/85 text-ink shadow-card backdrop-blur transition active:scale-95">
      <ArrowLeft size={20} />
    </button>
  )

  return (
    <div className="min-h-screen bg-cream-200 md:mx-auto md:max-w-4xl">
      {pro ? (
        <>
          {/* ① L'en-tête de boutique */}
          <EnTeteVitrine pro={pro} nom={displayName} lieu={location} retour={fleche}
            badge={profile?.badge ? <VerifiedBadge kind={profile.badge} size={20} /> : undefined} />

          {/* ③ Ouvert ou fermé, à la minute — la question qu'on se pose AVANT
              d'écrire. Les horaires partaient déjà du serveur ; la page les
              jetait. */}
          {etat && <div className="px-4 pb-3"><PastilleOuverture etat={etat} /></div>}

          {/* ② Les quatre chiffres, choisis pour l'acheteur */}
          <ChiffresVitrine reponse={reponse} note={avg} avis={count}
            ventes={pro.ventes ?? 0} depuis={pro.depuis} />

          <div className="flex gap-3 px-4 py-4">
            <button onClick={contactSeller} disabled={busy}
              className="txt-legible inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-ivoire-green px-5 py-3 font-display font-bold text-white shadow-[0_6px_16px_-6px_rgba(0,158,96,0.5)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60">
              <MessageSquare size={18} /> {busy ? '…' : 'Contacter'}
            </button>
            <button onClick={toggleFollow} aria-pressed={following}
              className={`btn-outline flex-1 ${following ? 'border-ivoire-green text-ivoire-green' : ''}`}>
              {following ? <><Check size={18} /> Suivi</> : <><Plus size={18} /> Suivre</>}
            </button>
          </div>

          {/* Les réseaux sociaux de l'enseigne (05/09/2026) : là où elle poste
              déjà, en boutons aux couleurs des marques. Rien si elle n'en a
              renseigné aucun. */}
          <PillesReseaux reseaux={pro.reseaux} nom={displayName} />
        </>
      ) : (
        <SimpleEnTete
          nom={displayName} avatar={profile?.avatarUrl} badge={profile?.badge}
          lieu={location} annonces={sellerListings.length} note={avg} avis={count}
          reponse={reponse} nouveau={count === 0} retour={fleche}
          busy={busy} following={following}
          onContacter={contactSeller} onSuivre={toggleFollow} />
      )}

      {/* Onglets */}
      <nav className="no-scrollbar flex gap-2 overflow-x-auto border-t border-line bg-white/70 px-4 py-3 backdrop-blur">
        <button onClick={() => setTab('annonces')}
          className={`chip ${tab === 'annonces' ? 'border-primary-500 bg-primary-500 text-white' : ''}`}>
          Annonces · {sellerListings.length}
        </button>
        <button onClick={() => setTab('avis')}
          className={`chip ${tab === 'avis' ? 'border-primary-500 bg-primary-500 text-white' : ''}`}>
          Avis · {count}
        </button>
        <button onClick={() => setTab('apropos')}
          className={`chip ${tab === 'apropos' ? 'border-primary-500 bg-primary-500 text-white' : ''}`}>
          À propos
        </button>
      </nav>

      {loading ? (
        <p className="py-16 text-center text-sm text-gray-500">Chargement…</p>
      ) : tab === 'annonces' ? (
        sellerListings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-400">
            <Package size={36} />
            <p className="text-sm text-gray-500">Aucune annonce active.</p>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {/* ⑥ L'APERÇU : ce que la boutique vend et à quel prix, AVANT la
                grille. Puis ④ la recherche et les puces. Les deux n'arrivent
                qu'à partir de six annonces : en dessous, la grille se lit d'un
                coup d'œil et tout cet appareillage encombre. */}
            {pro && sellerListings.length >= 6 && (
              <>
                <ApercuBoutique annonces={sellerListings} promos={nPromos}
                  onVoirPromos={() => { setPuce('promo'); setQ('') }} />
                <FiltresBoutique q={q} onQ={setQ} puce={puce} onPuce={setPuce} puces={puces} />
              </>
            )}
            {annoncesVues.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-gray-500">
                Rien ne correspond dans cette boutique.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 lg:grid-cols-4">
                {annoncesVues.map((l) => <ListingCard key={l.id} listing={l} dansBoutique />)}
              </div>
            )}
          </div>
        )
      ) : tab === 'avis' ? (
        reviews.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-400">
            <Store size={36} />
            <p className="text-sm text-gray-500">Aucun avis pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3 px-4 py-4">
            {reviews.map((r) => {
              const clickable = !!r.listingId
              const Comp = clickable ? 'button' : 'div'
              return (
                <Comp
                  key={r.id}
                  {...(clickable ? { onClick: () => navigate(`/annonce/${r.listingId}`), type: 'button' as const } : {})}
                  className={`card w-full p-3 text-left ${clickable ? 'transition hover:shadow-md active:scale-[0.99]' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                      {r.reviewerName}
                      {r.kind === 'buyer' && (
                        <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-600">acheteur</span>
                      )}
                    </span>
                    <Stars value={r.rating} size={14} />
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                    {timeAgo(r.createdAt)}
                    {clickable && <span className="ml-auto font-semibold text-primary-500">Voir l’annonce ›</span>}
                  </p>
                </Comp>
              )
            })}
          </div>
        )
      ) : (
        // ⑤ À propos : la description de l'ENTREPRISE, et le registre vérifié.
        <div className="space-y-3 px-4 py-4">
          {pro ? (
            <>
              <AProposVitrine pro={pro} bio={profile?.bio} lieu={location} reponse={reponse} />
              {/* L'adresse en clair : l'acheteur voit où il va avant d'y aller. */}
              <ListeReseaux reseaux={pro.reseaux} />
            </>
          ) : (
            <div className="card p-4">
              <h2 className="mb-2 font-display text-base font-bold text-ink">À propos</h2>
              {profile?.bio ? (
                <p className="text-sm leading-relaxed text-gray-600">{profile.bio}</p>
              ) : (
                <p className="text-sm text-gray-500">Ce vendeur n’a pas encore ajouté de description.</p>
              )}
              {location && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin size={14} className="text-primary-500" /> {location}
                </p>
              )}
            </div>
          )}
          {horaires && <CarteHoraires horaires={horaires} />}
        </div>
      )}
    </div>
  )
}

/**
 * L'en-tête d'un vendeur ORDINAIRE — inchangé, et c'est voulu : la vitrine est
 * ce que le professionnel a mérité en faisant vérifier son dossier. Un
 * particulier qui vend son frigo n'a ni logo, ni horaires, ni registre.
 */
function SimpleEnTete({ nom, avatar, badge, lieu, annonces, note, avis, reponse, nouveau,
                        retour, busy, following, onContacter, onSuivre }: {
  nom: string; avatar?: string; badge?: 'admin' | 'anciennete' | ''
  lieu: string | null; annonces: number; note: number; avis: number
  reponse: number | null; nouveau: boolean; retour: React.ReactNode
  busy: boolean; following: boolean
  onContacter: () => void; onSuivre: () => void
}) {
  return (
    <header className="safe-top relative overflow-hidden bg-gradient-to-b from-primary-100 via-cream-100 to-[#FFF6EA] px-4 pb-7 pt-3">
      {retour}
      <div className="mt-1 flex flex-col items-center text-center">
        <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-ivoire-green font-display text-4xl font-black text-white shadow-card ring-4 ring-white md:h-28 md:w-28">
          {avatar ? <img src={mediaUrl(avatar)} alt={nom} className="h-full w-full object-cover" />
            : nom.charAt(0).toUpperCase()}
        </div>
        <h1 className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-2 font-display text-2xl font-black text-ink">
          <span className="break-words">{nom}</span>
          {badge && <VerifiedBadge kind={badge} size={22} />}
        </h1>
        {(lieu || nouveau) && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-sm text-gray-500">
            {lieu && <span className="flex items-center gap-1"><MapPin size={14} className="text-primary-500" /> {lieu}</span>}
            {nouveau && <span>Nouveau vendeur</span>}
          </div>
        )}
        <div className="mt-5 flex items-start justify-center gap-8 md:gap-12">
          <div className="text-center">
            <p className="tnum font-display text-xl font-black text-ink">{annonces}</p>
            <p className="text-xs text-gray-500">annonces</p>
          </div>
          <div className="text-center">
            <p className="tnum font-display text-xl font-black text-ink">{avis > 0 ? note.toFixed(1) : '—'}</p>
            {avis > 0 && <div className="mt-0.5 flex justify-center"><Stars value={note} size={11} /></div>}
            <p className="text-xs text-gray-500">note</p>
          </div>
          <div className="text-center">
            <p className="tnum font-display text-xl font-black text-ink">{avis}</p>
            <p className="text-xs text-gray-500">avis</p>
          </div>
        </div>
        {reponse != null && (
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ivoire-green/10 px-3 py-1 text-xs font-semibold text-ivoire-green-dark">
            <Timer size={13} /> Répond en {delaiPhrase(reponse)} en général
          </p>
        )}
        <div className="mt-6 flex w-full max-w-xs items-center justify-center gap-3">
          <button onClick={onContacter} disabled={busy}
            className="txt-legible inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-ivoire-green px-5 py-3 font-display font-bold text-white shadow-[0_6px_16px_-6px_rgba(0,158,96,0.5)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60">
            <MessageSquare size={18} /> {busy ? '…' : 'Contacter'}
          </button>
          <button onClick={onSuivre} aria-pressed={following}
            className={`btn-outline flex-1 ${following ? 'border-ivoire-green text-ivoire-green' : ''}`}>
            {following ? <><Check size={18} /> Suivi</> : <><Plus size={18} /> Suivre</>}
          </button>
        </div>
      </div>
    </header>
  )
}
