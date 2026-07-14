import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Store, MapPin, Package } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { fetchProfile, type PublicProfile } from '../lib/profiles'
import { fetchReviewsForSeller, averageRating } from '../lib/reviews'
import { ListingCard } from '../components/ListingCard'
import { Stars } from '../components/Stars'
import { timeAgo } from '../lib/format'
import type { Review } from '../types'

export function SellerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { listings } = useApp()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [tab, setTab] = useState<'annonces' | 'avis'>('annonces')
  const [loading, setLoading] = useState(true)

  const sellerListings = listings.filter((l) => l.sellerId === id)
  const displayName = profile?.fullName || sellerListings[0]?.sellerName || 'Vendeur'
  const { avg, count } = averageRating(reviews)

  useEffect(() => {
    if (!id) return
    let active = true
    Promise.all([fetchProfile(id), fetchReviewsForSeller(id)])
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

  return (
    <div className="min-h-screen bg-[#f4f5f7] md:mx-auto md:max-w-4xl">
      {/* En-tête */}
      <header className="safe-top bg-gradient-to-b from-primary-500 to-primary-600 px-4 pb-6 pt-3 text-white">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="mb-3 p-1">
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 text-2xl font-black">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-black">{displayName}</p>
            {count > 0 ? (
              <span className="flex items-center gap-1.5 text-sm text-white/90">
                <Stars value={avg} size={15} /> {avg.toFixed(1)} · {count} avis
              </span>
            ) : (
              <p className="text-sm text-white/80">Nouveau vendeur</p>
            )}
          </div>
        </div>
        {profile?.bio && <p className="mt-3 text-sm text-white/90">{profile.bio}</p>}
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setTab('annonces')}
            className={`rounded-xl px-4 py-2 text-center transition active:scale-95 ${tab === 'annonces' ? 'bg-white/30' : 'bg-white/15 hover:bg-white/25'}`}
          >
            <p className="text-lg font-black">{sellerListings.length}</p>
            <p className="text-[11px] text-white/85">Annonces</p>
          </button>
          <button
            onClick={() => setTab('avis')}
            className={`rounded-xl px-4 py-2 text-center transition active:scale-95 ${tab === 'avis' ? 'bg-white/30' : 'bg-white/15 hover:bg-white/25'}`}
          >
            <p className="text-lg font-black">{count}</p>
            <p className="text-[11px] text-white/85">Avis</p>
          </button>
        </div>
      </header>

      {/* Onglets */}
      <div className="sticky top-0 z-20 flex border-b border-gray-100 bg-white">
        {(['annonces', 'avis'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold capitalize ${
              tab === t ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'
            }`}
          >
            {t === 'annonces' ? `Annonces (${sellerListings.length})` : `Avis (${count})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-gray-400">Chargement…</p>
      ) : tab === 'annonces' ? (
        sellerListings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-400">
            <Package size={36} />
            <p className="text-sm">Aucune annonce active.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4 py-4 md:grid-cols-3 lg:grid-cols-4">
            {sellerListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-400">
          <Store size={36} />
          <p className="text-sm">Aucun avis pour le moment.</p>
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
                  <span className="text-sm font-semibold text-gray-800">{r.reviewerName}</span>
                  <Stars value={r.rating} size={14} />
                </div>
                {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
                <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                  <MapPin size={11} /> {timeAgo(r.createdAt)}
                  {clickable && <span className="ml-auto font-semibold text-primary-500">Voir l’annonce ›</span>}
                </p>
              </Comp>
            )
          })}
        </div>
      )}
    </div>
  )
}
