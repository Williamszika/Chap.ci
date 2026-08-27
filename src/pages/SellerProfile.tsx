import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Package, Store, MessageSquare, Plus, Check, Timer } from 'lucide-react'
import { mediaUrl } from '../lib/native'
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

  const delaiCourt = (s: number): string => {
    if (s < 60) return 'moins d’une minute'
    if (s < 3600) return `${Math.round(s / 60)} min`
    if (s < 86400) { const h = Math.round(s / 3600); return `${h} h` }
    const j = Math.round(s / 86400)
    return `${j} jour${j > 1 ? 's' : ''}`
  }

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

  return (
    <div className="min-h-screen bg-cream-200 md:mx-auto md:max-w-4xl">
      {/* La bannière du professionnel — l'image qu'il a choisie dans son
          espace pro. Les vendeurs ordinaires gardent le dégradé de la marque. */}
      {profile?.pro?.banniere && (
        <div className="relative h-32 w-full overflow-hidden md:h-44">
          <img src={mediaUrl(profile.pro.banniere)} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFF6EA] to-transparent" />
        </div>
      )}

      {/* Couverture + en-tête vendeur */}
      <header className={`safe-top relative bg-gradient-to-b from-primary-100 via-cream-100 to-[#FFF6EA] px-4 pb-7 pt-3 ${
        profile?.pro?.banniere ? '' : 'overflow-hidden'}`}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className={`grid h-10 w-10 place-items-center rounded-full bg-white/80 text-ink shadow-card backdrop-blur transition active:scale-95 ${
            profile?.pro?.banniere ? 'absolute left-4 -top-14 z-10' : ''}`}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="mt-1 flex flex-col items-center text-center">
          {/* Avatar — le logo du professionnel s'il en a un. */}
          <div className={`grid h-24 w-24 place-items-center overflow-hidden bg-ivoire-green font-display text-4xl font-black text-white shadow-card ring-4 ring-white md:h-28 md:w-28 ${
            profile?.pro?.logo ? 'rounded-3xl' : 'rounded-full'} ${profile?.pro?.banniere ? '-mt-16 md:-mt-20' : ''}`}>
            {profile?.pro?.logo ? (
              <img src={mediaUrl(profile.pro.logo)} alt={displayName} className="h-full w-full object-cover" />
            ) : profile?.avatarUrl ? (
              <img src={mediaUrl(profile.avatarUrl)} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>

          {/* Nom + badge vérifié (bleu, uniquement si le vendeur est vérifié) */}
          <h1 className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-2 font-display text-2xl font-black text-ink">
            <span className="break-words">{displayName}</span>
            {profile?.badge && <VerifiedBadge kind={profile.badge} size={22} />}
          </h1>

          {/* Métadonnées */}
          {(location || count === 0) && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-sm text-gray-500">
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-primary-500" /> {location}
                </span>
              )}
              {count === 0 && <span>Nouveau vendeur</span>}
            </div>
          )}

          {/* Statistiques */}
          <div className="mt-5 flex items-start justify-center gap-8 md:gap-12">
            <div className="text-center">
              <p className="tnum font-display text-xl font-black text-ink">{sellerListings.length}</p>
              <p className="text-xs text-gray-500">annonces</p>
            </div>
            <div className="text-center">
              <p className="tnum font-display text-xl font-black text-ink">{count > 0 ? avg.toFixed(1) : '—'}</p>
              {count > 0 && (
                <div className="mt-0.5 flex justify-center">
                  <Stars value={avg} size={11} />
                </div>
              )}
              <p className="text-xs text-gray-500">note</p>
            </div>
            <div className="text-center">
              <p className="tnum font-display text-xl font-black text-ink">{count}</p>
              <p className="text-xs text-gray-500">avis</p>
            </div>
          </div>

          {reponse != null && (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ivoire-green/10 px-3 py-1 text-xs font-semibold text-ivoire-green-dark">
              <Timer size={13} /> Répond en {delaiCourt(reponse)} en général
            </p>
          )}

          {/* Actions */}
          <div className="mt-6 flex w-full max-w-xs items-center justify-center gap-3">
            <button
              onClick={contactSeller}
              disabled={busy}
              className="txt-legible inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-ivoire-green px-5 py-3 font-display font-bold text-white shadow-[0_6px_16px_-6px_rgba(0,158,96,0.5)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
            >
              <MessageSquare size={18} /> {busy ? '…' : 'Contacter'}
            </button>
            <button
              onClick={toggleFollow}
              aria-pressed={following}
              className={`btn-outline flex-1 ${following ? 'border-ivoire-green text-ivoire-green' : ''}`}
            >
              {following ? (
                <>
                  <Check size={18} /> Suivi
                </>
              ) : (
                <>
                  <Plus size={18} /> Suivre
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Onglets / filtres */}
      <nav className="no-scrollbar flex gap-2 overflow-x-auto border-t border-line bg-white/70 px-4 py-3 backdrop-blur">
        <button
          onClick={() => setTab('annonces')}
          className={`chip ${tab === 'annonces' ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
        >
          Annonces · {sellerListings.length}
        </button>
        <button
          onClick={() => setTab('avis')}
          className={`chip ${tab === 'avis' ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
        >
          Avis · {count}
        </button>
        <button
          onClick={() => setTab('apropos')}
          className={`chip ${tab === 'apropos' ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
        >
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
          <div className="grid grid-cols-2 gap-3 px-4 py-4 md:grid-cols-3 lg:grid-cols-4">
            {sellerListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
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
                    <MapPin size={11} /> {timeAgo(r.createdAt)}
                    {clickable && <span className="ml-auto font-semibold text-primary-500">Voir l’annonce ›</span>}
                  </p>
                </Comp>
              )
            })}
          </div>
        )
      ) : (
        // À propos
        <div className="px-4 py-4">
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
        </div>
      )}
    </div>
  )
}
