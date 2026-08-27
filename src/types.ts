// Types partagés de l'application Chap.ci

export interface Region {
  id: string
  name: string
  district: string
  chefLieu: string
}

export interface City {
  id: string
  name: string
  regionId: string
  /** Communes (surtout pour Abidjan et les grandes villes) */
  communes?: string[]
}

export interface Category {
  id: string
  name: string
  icon: string // nom d'icône lucide-react
  color: string // classe tailwind de fond
  subcategories: string[]
}

export interface Listing {
  id: string
  title: string
  description: string
  price: number
  /** true = prix négociable / à débattre */
  negotiable: boolean
  currency: 'FCFA'
  categoryId: string
  subcategory?: string
  condition: 'neuf' | 'occasion'
  images: string[] // data-URI ou URL
  regionId: string
  cityId: string
  commune?: string
  /** Coordonnées GPS de l'annonce (position vendeur ou commune) */
  lat?: number
  lng?: number
  sellerName: string
  /** Renvoyé UNIQUEMENT au propriétaire de l'annonce ; `null` partout ailleurs. */
  sellerPhone: string | null
  /** id du compte vendeur (si l'annonce a été publiée par un utilisateur connecté) */
  sellerId?: string
  /** Vendeur au badge bleu (compte vérifié) — affiché sur la carte. */
  sellerVerified?: boolean
  createdAt: number // timestamp ms
  delivery: boolean
  /** annonce mise en avant */
  featured?: boolean
  /** Prix promotionnel (réduit). Actif seulement tant que promoUntil n'est pas dépassé. */
  promoPrice?: number
  /** Fin de la promotion (timestamp ms). Passé ce délai, le prix normal revient. */
  promoUntil?: number
  /** Attributs spécifiques à la catégorie (marque, année, surface, taille…). */
  attributes?: Record<string, string>
  /** Annonce masquée (par le vendeur ou la modération) : invisible du public. */
  hidden?: boolean
  /** Pourquoi l'annonce est masquée — montré au vendeur, jamais au public. */
  hiddenReason?: string | null
  /** Annonce vendue : retirée du public, badge « Vendu ». */
  sold?: boolean
  /** Nombre de vues (statistiques vendeur). */
  views?: number
  /** Combien de personnes l'ont enregistrée (rendu par `listings/mine`). */
  favoris?: number
  /** Combien ont écrit au sujet de cette annonce (rendu par `listings/mine`). */
  contacts?: number
}

export interface LocationFilter {
  regionId?: string
  cityId?: string
  commune?: string
}

// — Messagerie —
export interface Conversation {
  id: string
  listingId: string | null
  buyerId: string
  sellerId: string
  createdAt: number
  // Enrichissements côté client
  listingTitle?: string
  listingImage?: string
  otherName?: string
  lastMessage?: string
  lastAt?: number
  /** id de l'expéditeur du dernier message (pour détecter les non-lus) */
  lastSenderId?: string
  /** Archivée de MON côté (masquée de la liste principale). */
  archived?: boolean
  /** J'ai bloqué l'autre / l'autre m'a bloqué. */
  blockedByMe?: boolean
  blockedMe?: boolean
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  body: string
  createdAt: number
  /** Supprimé pour tout le monde (le corps est vidé). */
  deleted?: boolean
}

// — Panier & commandes —
export interface CartItem {
  listingId: string
  title: string
  price: number
  image?: string
  sellerId: string
  sellerName: string
}

export interface OrderItem {
  listingId: string | null
  title: string
  price: number
  image?: string
}

export type OrderStatus = 'en_cours' | 'finalise' | 'annule'

export interface Order {
  id: string
  buyerId: string
  sellerId: string
  conversationId: string | null
  status: OrderStatus
  createdAt: number
  items: OrderItem[]
  // enrichissements
  otherName?: string
}

// — Avis —
export interface Review {
  id: string
  listingId: string | null
  sellerId: string
  reviewerId: string
  rating: number
  comment?: string
  createdAt: number
  reviewerName?: string
  /** Personne notée (vendeur ou acheteur). Avis à double sens. */
  targetId?: string
  kind?: 'seller' | 'buyer'
}
