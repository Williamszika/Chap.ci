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
  /** Le vendeur est un compte professionnel APPROUVÉ. */
  sellerPro?: boolean
  /**
   * Le nom commercial de la boutique, montré sur la carte sous le titre.
   * `null` pour un particulier — il n'a pas d'enseigne, il a juste une ligne
   * de moins. Renseigné seulement si le dossier professionnel est approuvé.
   */
  sellerEnseigne?: string | null
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
  /**
   * La vidéo de quinze secondes (chantier 6 du 04/09/2026) : l'adresse du
   * fichier (« /uploads/videos/… »), ou null. Une seule par annonce, envoyée
   * APRÈS la publication en multipart — jamais dans ce JSON.
   */
  video?: string | null
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
  /**
   * Le dernier expéditeur HUMAIN — hors réponse automatique. C'est lui qui dit
   * si la conversation attend encore une réponse : une phrase envoyée par la
   * machine ne clôt rien.
   */
  dernierHumain?: string | null
  /** Le dernier message est-il la réponse automatique du vendeur ? */
  lastAuto?: boolean
  /** Archivée de MON côté (masquée de la liste principale). */
  archived?: boolean
  /** J'ai bloqué l'autre / l'autre m'a bloqué. */
  blockedByMe?: boolean
  blockedMe?: boolean
  /** Le montant de la dernière offre de l'autre encore ouverte — celle qui M'attend. */
  offreEnAttente?: number | null
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  body: string
  createdAt: number
  /** Supprimé pour tout le monde (le corps est vidé). */
  deleted?: boolean
  /** Réponse automatique du vendeur — affichée comme telle, jamais comptée. */
  auto?: boolean
  /**
   * « Faire une offre » : le message porte un montant et un état. Seul le
   * destinataire y répond ; une nouvelle offre du même auteur remplace la
   * précédente. Voir components/Offre.tsx.
   */
  offre?: Offre
}

export interface Offre {
  montant: number
  statut: 'proposee' | 'acceptee' | 'refusee' | 'remplacee'
  /** id de l'auteur de l'offre */
  par: string
  repondu?: string
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
  /** Quand la vente s'est conclue (null tant qu'elle ne l'est pas). */
  finalizedAt?: number | null
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
