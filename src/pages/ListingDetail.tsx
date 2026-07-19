import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  MessageSquare,
  BadgeCheck,
  Truck,
  ShieldCheck,
  Tag,
  Clock,
  User,
  Navigation,
  ShoppingBag,
  ChevronRight,
  Flag,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'
import { useToast } from '../store/ToastContext'
import { useGeo } from '../store/GeoContext'
import { haversineKm, formatDistance } from '../lib/geo'
import { getOrCreateConversation } from '../lib/messages'
import { placeOrderForSeller } from '../lib/checkout'
import { fetchReviewsForListing, createReview, averageRating } from '../lib/reviews'
import { fetchPurchasedListingIds } from '../lib/orders'
import { reportListing } from '../lib/api'
import { priceLabel, formatFCFA, timeAgo } from '../lib/format'
import { activePromo, promoEndLabel } from '../lib/promo'
import { recordInterest } from '../lib/interests'
import { isPhp } from '../lib/backend'
import { phpListingView } from '../lib/php'
import { locationLabel } from '../data/locations'
import { categoryById } from '../data/categories'
import { formFor } from '../data/categoryForms'
import { ListingCard } from '../components/ListingCard'
import { PromoTag } from '../components/PromoTag'
import { Stars } from '../components/Stars'
import type { Review } from '../types'

export function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getListing, isFavorite, toggleFavorite, listings } = useApp()
  const { user } = useAuth()
  const toast = useToast()
  const { position } = useGeo()
  const listing = id ? getListing(id) : undefined

  const [imgIndex, setImgIndex] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [purchased, setPurchased] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const listingId = listing?.id
  const sellerId = listing?.sellerId

  // Consulter une annonce = signal d'intérêt pour sa catégorie et sa sous-catégorie.
  useEffect(() => {
    if (listing?.categoryId) recordInterest(listing.categoryId, 1, listing.subcategory)
  }, [listing?.categoryId, listing?.subcategory])

  // Comptabilise une vue (une seule fois par session et par annonce).
  useEffect(() => {
    if (!isPhp || !listingId) return
    const key = `chapci.viewed.${listingId}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    phpListingView(listingId)
  }, [listingId])

  useEffect(() => {
    if (!listingId) return
    let active = true
    fetchReviewsForListing(listingId)
      .then((r) => active && setReviews(r))
      .catch(() => {})
    if (user) {
      fetchPurchasedListingIds(user.id)
        .then((s) => active && setPurchased(s.has(listingId)))
        .catch(() => {})
    }
    return () => {
      active = false
    }
  }, [listingId, user])

  if (!listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-5xl">🤔</div>
        <p className="font-semibold text-gray-700">Annonce introuvable</p>
        <p className="text-sm text-gray-500">Cette annonce a peut-être été retirée ou n’existe plus.</p>
        <Link to="/" className="btn-primary">
          Retour à l’accueil
        </Link>
      </div>
    )
  }

  const fav = isFavorite(listing.id)
  const cat = categoryById(listing.categoryId)
  const { avg, count } = averageRating(reviews)
  const isMine = user && sellerId && user.id === sellerId
  const isDemo = !sellerId // annonce de démonstration (sans compte vendeur)

  // Distance affichée seulement si pertinente (proche) — sinon masquée.
  const distanceKm =
    position && listing.lat != null && listing.lng != null
      ? haversineKm(position, { lat: listing.lat, lng: listing.lng })
      : null

  const promo = activePromo(listing)

  const similar = listings
    .filter((l) => l.categoryId === listing.categoryId && l.id !== listing.id)
    .slice(0, 6)

  // Lien « propre » (crawlable, avec aperçu WhatsApp/Facebook via le serveur).
  const shareUrl = `${window.location.origin}/annonce/${listing.id}`
  const shareText = `${listing.title} — sur Chap.ci`

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: listing!.title, text: shareText, url: shareUrl }); return }
      catch { /* annulé -> on ouvre le menu */ }
    }
    setShareOpen(true)
  }

  function requireAuth(): boolean {
    if (!user) {
      navigate('/connexion')
      return false
    }
    return true
  }

  function demoNotice() {
    toast.show(
      'Annonce de démonstration (exemple). Publiez la vôtre, ou attendez de vraies annonces pour discuter avec un vendeur.',
    )
  }

  async function buyNow() {
    if (isDemo) return demoNotice()
    if (!requireAuth() || !listing || !sellerId || !user) return
    setBusy(true)
    const salePrice = promo?.price ?? listing.price
    try {
      const convId = await placeOrderForSeller(user.id, {
        sellerId,
        sellerName: listing.sellerName,
        items: [
          {
            listingId: listing.id,
            title: listing.title,
            price: salePrice,
            image: listing.images[0],
            sellerId,
            sellerName: listing.sellerName,
          },
        ],
        total: salePrice,
      })
      navigate(`/messages/${convId}`)
    } catch {
      toast.error('Échec de l’envoi de la demande. Réessayez.')
      setBusy(false)
    }
  }

  async function askQuestion() {
    if (isDemo) return demoNotice()
    if (!requireAuth() || !listing || !user) return
    setBusy(true)
    try {
      const convId = await getOrCreateConversation(listing, user.id)
      navigate(`/messages/${convId}`)
    } catch {
      toast.error('Impossible d’ouvrir la conversation.')
      setBusy(false)
    }
  }

  async function submitReview() {
    if (!user || !listing || !sellerId) return
    setBusy(true)
    try {
      await createReview({ listingId: listing.id, sellerId, reviewerId: user.id, rating, comment: comment.trim() })
      const r = await fetchReviewsForListing(listing.id)
      setReviews(r)
      setShowReview(false)
      setComment('')
    } catch {
      toast.error('Vous devez avoir commandé cet article pour laisser un avis.')
    } finally {
      setBusy(false)
    }
  }

  const alreadyReviewed = user ? reviews.some((r) => r.reviewerId === user.id) : false

  return (
    <div className="min-h-screen bg-white pb-24 md:mx-auto md:my-6 md:min-h-0 md:max-w-2xl md:overflow-hidden md:rounded-3xl md:shadow-card">
      {/* Galerie */}
      <div className="relative">
        <div
          className="no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto bg-gray-100 md:aspect-[4/3]"
          onScroll={(e) => {
            const el = e.currentTarget
            setImgIndex(Math.round(el.scrollLeft / el.clientWidth))
          }}
        >
          {listing.images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${listing.title} — photo ${i + 1}`}
              className="h-full w-full shrink-0 snap-center object-cover"
            />
          ))}
        </div>

        <div className="safe-top absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <button
            onClick={() => navigate(-1)}
            className="grid h-10 w-10 place-items-center rounded-full bg-white shadow"
            aria-label="Retour"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShareOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white shadow"
              aria-label="Partager"
            >
              <Share2 size={19} />
            </button>
            <button
              onClick={() => toggleFavorite(listing.id)}
              className="grid h-10 w-10 place-items-center rounded-full bg-white shadow"
              aria-label="Favori"
            >
              <Heart size={19} className={fav ? 'fill-red-500 text-red-500' : 'text-gray-700'} />
            </button>
          </div>
        </div>

        {listing.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {listing.images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ease-smooth ${i === imgIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="px-4 py-4">
        {promo ? (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <PromoTag percent={promo.percent} height={26} />
              <span className="tnum text-2xl font-black text-red-600">{formatFCFA(promo.price)}</span>
              <span className="tnum text-base text-gray-400 line-through">{formatFCFA(promo.original)}</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-red-600">
              Promo jusqu’au {promoEndLabel(promo.until)}
              {listing.negotiable ? ' · à débattre' : ''}
            </p>
          </div>
        ) : (
          <p className="text-2xl font-black text-primary-600">{priceLabel(listing.price, listing.negotiable)}</p>
        )}
        <h1 className="mt-1 text-lg font-bold leading-snug text-gray-900">{listing.title}</h1>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {formFor(listing.categoryId).condition &&
            (listing.condition === 'neuf' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <BadgeCheck size={13} /> Neuf
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                <Tag size={13} /> Occasion
              </span>
            ))}
          {listing.delivery && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
              <Truck size={13} /> Livraison possible
            </span>
          )}
          {cat && (
            <Link
              to={`/explorer?cat=${cat.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700"
            >
              {cat.name}
              {listing.subcategory ? ` · ${listing.subcategory}` : ''}
            </Link>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1">
            <MapPin size={15} />
            {locationLabel(listing.regionId, listing.cityId, listing.commune)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={15} />
            {timeAgo(listing.createdAt)}
          </span>
          {distanceKm != null && distanceKm < 500 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
              <Navigation size={13} />
              {formatDistance(distanceKm)} de vous
            </span>
          )}
        </div>

        {/* Détails — attributs spécifiques à la catégorie (marque, année, surface…) */}
        {listing.attributes && Object.keys(listing.attributes).length > 0 && (
          <div className="mt-5">
            <h2 className="mb-2 text-sm font-bold text-gray-900">Détails</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {formFor(listing.categoryId).fields
                .filter((f) => listing.attributes?.[f.key])
                .map((f) => (
                  <div key={f.key} className="rounded-xl bg-gray-50 px-3 py-2">
                    <dt className="text-xs text-gray-400">{f.label}</dt>
                    <dd className="text-sm font-semibold text-gray-800">
                      {listing.attributes![f.key]}
                      {f.unit ? ` ${f.unit}` : ''}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
        )}

        {/* Description */}
        <div className="mt-5">
          <h2 className="mb-1.5 text-sm font-bold text-gray-900">Description</h2>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-gray-700">
            {listing.description}
          </p>
        </div>

        {/* Vendeur */}
        <Link
          to={sellerId ? `/vendeur/${sellerId}` : '#'}
          onClick={(e) => {
            if (!sellerId) e.preventDefault()
          }}
          className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card"
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-100 text-primary-600">
            <User size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-gray-900">{listing.sellerName}</p>
            {count > 0 ? (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Stars value={avg} size={13} /> {avg.toFixed(1)} · {count} avis
              </span>
            ) : (
              <p className="text-xs text-gray-400">Vendeur sur Chap.ci</p>
            )}
          </div>
          {sellerId && <ChevronRight size={20} className="text-gray-300" />}
        </Link>

        {/* Sécurité — remonté ici pour être vu AVANT de contacter / payer */}
        <div className="mt-5 rounded-2xl bg-amber-50 p-4">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-amber-800">
            <ShieldCheck size={16} /> Achetez en toute sécurité
          </p>
          <ul className="ml-1 list-disc space-y-0.5 pl-4 text-xs text-amber-700">
            <li>Échangez uniquement via la messagerie de Chap.ci.</li>
            <li>Rencontrez le vendeur dans un lieu public, ou privilégiez le paiement à la livraison.</li>
            <li>Vérifiez le produit avant de payer.</li>
          </ul>
        </div>

        {/* Avis */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Avis {count > 0 ? `(${count})` : ''}</h2>
            {user && purchased && !alreadyReviewed && !isMine && (
              <button onClick={() => setShowReview((s) => !s)} className="text-sm font-semibold text-primary-600">
                {showReview ? 'Annuler' : 'Laisser un avis'}
              </button>
            )}
          </div>

          {showReview && (
            <div className="mb-3 rounded-2xl border border-[#E6DAC6] p-3">
              <Stars value={rating} size={26} editable onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Décrivez votre expérience avec ce vendeur…"
                rows={3}
                className="input mt-2 resize-none text-sm"
              />
              <button onClick={submitReview} disabled={busy} className="btn-primary mt-2 w-full py-2.5 text-sm">
                Publier mon avis
              </button>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun avis pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 4).map((r) => (
                <div key={r.id} className="rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">{r.reviewerName}</span>
                    <Stars value={r.rating} size={13} />
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
                  <p className="mt-1 text-[11px] text-gray-400">{timeAgo(r.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Signalement */}
        {!isMine && <ReportButton listingId={listing.id} />}

        {/* Similaires */}
        {similar.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 text-base font-bold text-gray-900">Annonces similaires</h2>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
              {similar.map((l) => (
                <div key={l.id} className="w-40 shrink-0">
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barre d'action fixe */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app border-t border-[#EFE6D7] bg-white px-4 py-3 shadow-nav safe-bottom">
        {listing.sold ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-semibold text-gray-500">
            <BadgeCheck size={18} /> Article vendu
          </div>
        ) : isMine ? (
          <Link to="/compte" className="btn-outline w-full py-3">
            Gérer mon annonce
          </Link>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button onClick={buyNow} disabled={busy} className="btn-outline flex-1">
                <ShoppingBag size={18} /> {busy ? '…' : 'Acheter'}
              </button>
              <button onClick={askQuestion} disabled={busy} className="btn-primary flex-[1.7]">
                <MessageSquare size={18} /> Contacter le vendeur
              </button>
            </div>
            {isDemo && (
              <p className="mt-1.5 text-center text-[11px] text-gray-400">
                Exemple de démonstration — publiez votre annonce pour recevoir de vrais messages.
              </p>
            )}
          </>
        )}
      </div>

      {shareOpen && (
        <ShareSheet
          url={shareUrl}
          text={shareText}
          onNative={share}
          hasNative={typeof navigator !== 'undefined' && !!navigator.share}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  )
}

/** Feuille de partage : WhatsApp, Facebook, copier le lien, partage natif. */
function ShareSheet({
  url, text, onClose, onNative, hasNative,
}: { url: string; text: string; onClose: () => void; onNative: () => void; hasNative: boolean }) {
  const [copied, setCopied] = useState(false)
  const wa = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) }
    catch { /* ignore */ }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-app rounded-t-3xl bg-white p-5 pb-8 safe-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />
        <p className="mb-3 text-center font-bold text-gray-800">Partager cette annonce</p>
        <div className="grid grid-cols-3 gap-3">
          <a href={wa} target="_blank" rel="noopener noreferrer" onClick={onClose} className="flex flex-col items-center gap-1.5">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white text-2xl">🟢</span>
            <span className="text-xs font-medium text-gray-700">WhatsApp</span>
          </a>
          <a href={fb} target="_blank" rel="noopener noreferrer" onClick={onClose} className="flex flex-col items-center gap-1.5">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#1877F2] text-white text-xl font-black">f</span>
            <span className="text-xs font-medium text-gray-700">Facebook</span>
          </a>
          <button onClick={copy} className="flex flex-col items-center gap-1.5">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-gray-100 text-gray-700">
              {copied ? '✓' : '🔗'}
            </span>
            <span className="text-xs font-medium text-gray-700">{copied ? 'Copié !' : 'Copier'}</span>
          </button>
        </div>
        {hasNative && (
          <button onClick={() => { onClose(); onNative() }} className="btn-outline mt-4 w-full py-2.5 text-sm">
            Plus d’options…
          </button>
        )}
      </div>
    </div>
  )
}

const REPORT_REASONS = [
  'Arnaque / fraude',
  'Produit interdit',
  'Contenu offensant',
  'Fausse annonce',
  'Doublon',
  'Autre',
]

/** Bouton « Signaler cette annonce » + formulaire de motif (utilisateurs connectés). */
function ReportButton({ listingId }: { listingId: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!reason) return
    setBusy(true)
    try {
      await reportListing(listingId, reason, details)
      setDone(true)
      setOpen(false)
    } catch (e) {
      toast.error((e as Error).message || 'Signalement impossible.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <p className="mt-4 text-center text-xs text-emerald-600">
        ✓ Merci, votre signalement a été transmis à la modération.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => (user ? setOpen(true) : navigate('/connexion'))}
        className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500"
      >
        <Flag size={13} /> Signaler cette annonce
      </button>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/50 p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-800">
        <Flag size={15} className="text-red-500" /> Signaler cette annonce
      </p>
      <div className="flex flex-wrap gap-2">
        {REPORT_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className={`chip text-xs ${reason === r ? 'border-red-500 bg-red-500 text-white' : ''}`}
          >
            {r}
          </button>
        ))}
      </div>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Détails (facultatif) : expliquez le problème…"
        rows={3}
        maxLength={500}
        className="input mt-2 resize-none text-sm"
      />
      <div className="mt-2 flex gap-2">
        <button onClick={() => { setOpen(false); setReason(''); setDetails('') }} className="btn-outline flex-1 py-2 text-sm">
          Annuler
        </button>
        <button
          onClick={submit}
          disabled={!reason || busy}
          className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? 'Envoi…' : 'Envoyer le signalement'}
        </button>
      </div>
    </div>
  )
}
