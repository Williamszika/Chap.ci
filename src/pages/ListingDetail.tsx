import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Phone,
  MessageCircle,
  MessageSquare,
  BadgeCheck,
  Truck,
  ShieldCheck,
  Tag,
  Clock,
  User,
  CreditCard,
  Navigation,
} from 'lucide-react'
import { PaySheet } from '../components/PaySheet'
import { useApp } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'
import { useGeo } from '../store/GeoContext'
import { haversineKm, formatDistance } from '../lib/geo'
import { getOrCreateConversation } from '../lib/messages'
import { priceLabel, timeAgo } from '../lib/format'
import { locationLabel } from '../data/locations'
import { categoryById } from '../data/categories'
import { ListingCard } from '../components/ListingCard'

export function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getListing, isFavorite, toggleFavorite, listings } = useApp()
  const { user, enabled } = useAuth()
  const { position } = useGeo()
  const listing = id ? getListing(id) : undefined
  const [imgIndex, setImgIndex] = useState(0)
  const [startingChat, setStartingChat] = useState(false)
  const [payOpen, setPayOpen] = useState(false)

  if (!listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-5xl">🤔</div>
        <p className="font-semibold text-gray-700">Annonce introuvable</p>
        <p className="text-sm text-gray-500">
          Cette annonce a peut-être été retirée ou n’existe plus.
        </p>
        <Link to="/" className="btn-primary">
          Retour à l’accueil
        </Link>
      </div>
    )
  }

  const fav = isFavorite(listing.id)
  const cat = categoryById(listing.categoryId)
  const phoneDigits = listing.sellerPhone.replace(/[^\d+]/g, '')
  const waNumber = phoneDigits.replace(/^\+/, '')
  const waText = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par votre annonce "${listing.title}" sur Chap.ci.`,
  )

  const similar = listings
    .filter((l) => l.categoryId === listing.categoryId && l.id !== listing.id)
    .slice(0, 6)

  async function share() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: listing!.title, url })
      } catch {
        /* annulé */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        alert('Lien copié !')
      } catch {
        /* ignore */
      }
    }
  }

  const canMessage = enabled && !!listing.sellerId && user?.id !== listing.sellerId

  async function contactSeller() {
    if (!user) {
      navigate('/connexion')
      return
    }
    if (!listing) return
    setStartingChat(true)
    try {
      const convId = await getOrCreateConversation(listing, user.id)
      navigate(`/messages/${convId}`)
    } catch {
      alert('Impossible d’ouvrir la conversation pour le moment.')
      setStartingChat(false)
    }
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Galerie d'images */}
      <div className="relative">
        <div
          className="no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto bg-gray-100"
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

        {/* Boutons overlay */}
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
              onClick={share}
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

        {/* Indicateurs */}
        {listing.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {listing.images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === imgIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="px-4 py-4">
        <p className="text-2xl font-black text-primary-600">
          {priceLabel(listing.price, listing.negotiable)}
        </p>
        <h1 className="mt-1 text-lg font-bold leading-snug text-gray-900">{listing.title}</h1>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {listing.condition === 'neuf' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <BadgeCheck size={13} /> Neuf
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
              <Tag size={13} /> Occasion
            </span>
          )}
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
          {position && listing.lat != null && listing.lng != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
              <Navigation size={13} />
              {formatDistance(haversineKm(position, { lat: listing.lat, lng: listing.lng }))} de vous
            </span>
          )}
        </div>

        {/* Description */}
        <div className="mt-5">
          <h2 className="mb-1.5 text-sm font-bold text-gray-900">Description</h2>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-gray-700">
            {listing.description}
          </p>
        </div>

        {/* Vendeur */}
        <div className="mt-5 card p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-100 text-primary-600">
              <User size={24} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{listing.sellerName}</p>
              <p className="text-xs text-gray-500">Vendeur sur Chap.ci</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
              <ShieldCheck size={13} /> Vérifié
            </span>
          </div>
        </div>

        {/* Payer par Mobile Money */}
        <button
          onClick={() => setPayOpen(true)}
          className="mt-4 flex w-full items-center justify-between rounded-2xl border border-ivoire-green/30 bg-emerald-50 px-4 py-3.5 text-left active:scale-[0.99]"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-ivoire-green text-white">
              <CreditCard size={20} />
            </span>
            <span>
              <span className="block text-sm font-bold text-gray-900">Payer par Mobile Money</span>
              <span className="block text-xs text-gray-500">Orange, MTN, Moov, Wave</span>
            </span>
          </span>
          <span className="text-sm font-bold text-ivoire-green">{priceLabel(listing.price)}</span>
        </button>

        {/* Conseils sécurité */}
        <div className="mt-4 rounded-2xl bg-amber-50 p-4">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-amber-800">
            <ShieldCheck size={16} /> Conseils de sécurité
          </p>
          <ul className="ml-1 list-disc space-y-0.5 pl-4 text-xs text-amber-700">
            <li>Rencontrez le vendeur dans un lieu public et fréquenté.</li>
            <li>Vérifiez le produit avant de payer.</li>
            <li>Ne payez jamais à l’avance sans avoir vu l’article.</li>
            <li>
              Chap.ci met en relation acheteurs et vendeurs : le paiement et la livraison se font
              directement entre vous, hors de l’application.
            </li>
          </ul>
        </div>

        {/* Annonces similaires */}
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

      {/* Barre de contact fixe */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app border-t border-gray-100 bg-white px-4 py-3 shadow-nav safe-bottom">
        {canMessage && (
          <button
            onClick={contactSeller}
            disabled={startingChat}
            className="btn-primary mb-2 w-full"
          >
            <MessageSquare size={18} /> {startingChat ? 'Ouverture…' : 'Envoyer un message'}
          </button>
        )}
        <div className="flex gap-2">
          <a href={`tel:${phoneDigits}`} className="btn-outline flex-1">
            <Phone size={18} /> Appeler
          </a>
          <a
            href={`https://wa.me/${waNumber}?text=${waText}`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary flex-1 bg-[#25D366] hover:bg-[#1eb958]"
          >
            <MessageCircle size={18} /> WhatsApp
          </a>
        </div>
      </div>

      <PaySheet open={payOpen} onClose={() => setPayOpen(false)} listing={listing} />
    </div>
  )
}
