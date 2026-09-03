import { useEffect, useRef, useState } from 'react'
import { mediaUrl } from '../lib/native'
import { rendreAffiche, partagerAffiche } from '../lib/affiche'
import { PrixMarcheAcheteur } from '../components/PrixMarche'
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
  ShieldAlert,
  Clock,
  Eye,
  Star,
  Navigation,
  ShoppingBag,
  Flag,
  Maximize2,
  ChevronRight,
  Timer,
} from 'lucide-react'
import { fetchSellerResponseTime } from '../lib/api'
import { BrandBadge } from '../components/BrandLogo'
import { PhotoViewer } from '../components/PhotoViewer'
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
import { formatFCFA, timeAgo } from '../lib/format'
import { activePromo, promoEndLabel } from '../lib/promo'
import { recordInterest } from '../lib/interests'
import { isPhp } from '../lib/backend'
import { phpListingView } from '../lib/php'
import { locationLabel } from '../data/locations'
import { categoryById } from '../data/categories'
import { formFor } from '../data/categoryForms'
import { useFormSous } from '../data/sous'
import { DOC_PAR_ID, cleNumero, estVenteFonciere, lireDocs } from '../data/foncier'
import { lireCouleurs, lireVariantes, type Couleur } from '../data/couleurs'
import { FoncierDossier } from '../components/FoncierDossier'

/**
 * Quelques champs sont libellés pour celui qui REMPLIT le formulaire (« Vous
 * êtes », « Vos documents sont établis au nom de »). Sur la fiche, c'est un
 * acheteur qui lit : le tutoiement du formulaire n'y veut plus rien dire.
 */
const LIBELLE_ACHETEUR: Record<string, string> = {
  titulaire: 'Documents au nom de',
  vendeur: 'Vendeur',
  notaire: 'Vente devant notaire',
  plan: 'Plan de situation',
  idufci: 'Identifiant IDUFCI',
  frais: 'Frais à la charge de l’acheteur',
}
import { ListingCard } from '../components/ListingCard'
import { PromoTag } from '../components/PromoTag'
import { Stars } from '../components/Stars'
import type { Review } from '../types'
import { TraduireAnnonce, type Traduction } from '../components/TraduireAnnonce'

export function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getListing, isFavorite, toggleFavorite, listings } = useApp()
  const { user } = useAuth()
  const toast = useToast()
  const { position } = useGeo()
  const listing = id ? getListing(id) : undefined
  // La traduction affichée, ou null pour le texte d'origine du vendeur.
  const [traduction, setTraduction] = useState<Traduction | null>(null)

  const [imgIndex, setImgIndex] = useState(0)
  // Photo ouverte en plein écran (null = visionneuse fermée).
  const [viewer, setViewer] = useState<number | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [afficheEnCours, setAfficheEnCours] = useState(false)
  const [busy, setBusy] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [purchased, setPurchased] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const galleryRef = useRef<HTMLDivElement>(null)

  const listingId = listing?.id
  const sellerId = listing?.sellerId

  // TEMPS DE RÉPONSE HABITUEL DU VENDEUR.
  // Ce que redoute un acheteur, ce n'est pas le prix : c'est d'écrire dans le
  // vide. Un vendeur qui répond en une heure et un vendeur qui ne répond jamais
  // présentaient jusqu'ici exactement la même fiche. On le charge à part de
  // l'annonce : s'il manque, la fiche s'affiche quand même.
  const [reponse, setReponse] = useState<number | null>(null)

  /* ── CE QUE LA BARRE DU BAS RAPPELLE ────────────────────────────────────────
   * La barre « Contacter le vendeur / Acheter » est fixée en bas depuis
   * toujours, et c'est bien. Mais après mille sept cents pixels de défilement —
   * description, vendeur, avis, PUIS des annonces similaires — elle ne dit plus
   * de quoi on parle. On vient de faire défiler sous les yeux de l'acheteur
   * cinq AUTRES articles, et le bouton vert contacte le vendeur du premier.
   *
   * On rappelle donc l'article, mais seulement une fois le prix sorti de
   * l'écran : tant qu'il est visible, une deuxième copie serait du bruit. Et on
   * rappelle LE PRIX autant que le titre — c'est le chiffre qui décide, et sur
   * une place de marché il change d'une annonce à l'autre bien plus que le nom.
   */
  const reperePrix = useRef<HTMLDivElement | null>(null)
  const [identiteVisible, setIdentiteVisible] = useState(false)
  useEffect(() => {
    const cible = reperePrix.current
    // Navigateur sans IntersectionObserver : la barre garde ses deux boutons,
    // exactement comme avant. Rien ne casse, on perd seulement le rappel.
    if (!cible || typeof IntersectionObserver === 'undefined') return
    // On veut « le prix est sorti PAR LE HAUT », pas « le prix n'est pas à
    // l'écran ». Les deux ne sont pas la même chose : sur un écran court, le
    // repère peut être encore SOUS le pli à l'ouverture, et le rappel
    // s'afficherait alors qu'on n'a pas commencé à lire. D'où le test sur
    // `top < 0`, qui distingue « au-dessus » de « en dessous ».
    // (Une première version réduisait la zone d'observation par `rootMargin`
    // à une ligne en haut de l'écran — le rappel s'affichait dès l'arrivée.)
    const obs = new IntersectionObserver(
      ([e]) => setIdentiteVisible(!e.isIntersecting && e.boundingClientRect.top < 0),
    )
    obs.observe(cible)
    return () => obs.disconnect()
  }, [listing?.id])

  useEffect(() => {
    setReponse(null)
    if (!sellerId) return
    let vivant = true
    fetchSellerResponseTime(sellerId).then((r) => { if (vivant) setReponse(r.medianSeconds) })
    return () => { vivant = false }
  }, [sellerId])

  /** « 12 min », « 2 h », « 3 j » — court, parce que c'est une étiquette. */
  const delaiCourt = (s: number): string => {
    if (s < 60) return 'moins d’une minute'
    if (s < 3600) return `${Math.round(s / 60)} min`
    if (s < 86400) { const h = Math.round(s / 3600); return `${h} h` }
    const j = Math.round(s / 86400)
    return `${j} jour${j > 1 ? 's' : ''}`
  }

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

  /**
   * La fiche se lit avec le MÊME schéma que celui qui a servi à la remplir :
   * l'acheteur voit tout ce que le vendeur a saisi, avec le libellé exact
   * qu'on lui avait montré, et rien d'autre.
   *
   * ⚠️ CE CROCHET DOIT RESTER AU-DESSUS DU `return` D'ANNONCE INTROUVABLE.
   * React exige que le nombre de crochets ne change pas d'un rendu à l'autre.
   * Placé plus bas, il n'était PAS appelé au premier rendu (l'annonce n'est
   * pas encore chargée quand on ouvre un lien partagé à froid), puis l'était
   * au rendu suivant — React s'arrête alors sur l'erreur #310 et la page
   * reste BLANCHE. C'est exactement ce qui arrivait à quelqu'un qui ouvrait
   * un lien d'annonce reçu sur WhatsApp.
   */
  const attributs = listing?.attributes ?? {}
  const sousForm = useFormSous(listing?.categoryId ?? '', listing?.subcategory ?? '', attributs)

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

  const form = sousForm ?? formFor(listing.categoryId)
  const sellerInitial = (listing.sellerName || '?').trim().charAt(0).toUpperCase() || '?'
  // Dossier foncier : affiché pour une VENTE immobilière, sous les attributs.
  // Le détail (documents, contrôles, guide dépliant) vit dans FoncierDossier.
  const dossierFoncier = estVenteFonciere(listing) && !!attributs.docs

  // Variantes par couleur : photo, prix et détails propres à chaque couleur.
  const variantes = lireVariantes(attributs, listing.images?.length ?? 0)
  /**
   * Les champs déclinés couleur par couleur — les tailles, les pointures.
   * C'est la particularité de la mode : une robe existe en rouge du 38 au 44
   * et en noir seulement en 40. L'acheteur qui regarde une couleur doit voir
   * les tailles de CETTE couleur, pas l'union de tout ce que le vendeur a.
   */
  const champsVar = (form.fields ?? []).filter((f) => f.varOK)
  const varDe = (nom: string) =>
    champsVar
      .map((f) => ({ label: f.labelVar ?? f.label, valeur: attributs[`var_${nom}_${f.key}`] ?? '' }))
      .filter((x) => x.valeur.trim() !== '')
  const variantesActives =
    variantes.some((v) => v.photo !== null || v.prix !== null || v.note !== '') ||
    variantes.some((v) => varDe(v.couleur.nom).length > 0)

  // Grille d'attributs (mockup) : État · attributs de la catégorie · Livraison.
  // Les documents et leurs numéros sont sortis de la grille : ils ont leur
  // propre bandeau, avec le verdict qui va avec.
  const attrItems: { label: string; value: string; couleurs?: Couleur[] }[] = []
  if (form.condition)
    attrItems.push({ label: 'État', value: listing.condition === 'neuf' ? 'Neuf' : 'Occasion' })
  // Même contexte que le formulaire : la sous-catégorie sous `_sub`, pour que
  // les champs conditionnels (Téléphones, Immobilier) s'affichent — ou non —
  // exactement comme ils ont été saisis.
  const ctxAttrs: Record<string, string> = { ...attributs, _sub: listing.subcategory ?? '' }
  for (const f of form.fields) {
    if (f.type === 'docs') continue
    if (f.when && !f.when(ctxAttrs)) continue
    const v = attributs[f.key]
    if (!v) continue
    if (f.type === 'colors') {
      // Les couleurs se montrent : une pastille peinte à côté de chaque nom.
      // Quand le vendeur a détaillé ses variantes (photo, prix, détails par
      // couleur), elles quittent la grille pour leur propre carte, plus riche.
      if (!variantesActives) attrItems.push({ label: f.label, value: v, couleurs: lireCouleurs(v) })
      continue
    }
    attrItems.push({
      label: LIBELLE_ACHETEUR[f.key] ?? f.label,
      value: f.type === 'toggle' ? 'Oui' : `${v}${f.unit ? ` ${f.unit}` : ''}`,
    })
  }
  /**
   * Ce que le vendeur a saisi AVANT que le formulaire ne change.
   *
   * Les quatre-vingt-deux schémas n'emploient pas les mêmes clés que le
   * formulaire générique d'avant : une annonce de mode publiée en juillet
   * porte `genre`, `taille`, `marque` ; le schéma « Chaussures » attend
   * `pointures`, `hauteurTalon`, `authenticite`. Aucun champ ne réclame donc
   * les anciennes valeurs, et les huit annonces en ligne perdaient d'un coup
   * TOUT ce que leurs vendeurs avaient rempli — sans que rien ne le signale.
   *
   * On les récupère : le libellé vient de l'ancien formulaire, qui existe
   * toujours, et à défaut de la clé elle-même. Ce que quelqu'un a pris la
   * peine d'écrire ne disparaît pas parce que nous avons changé d'avis.
   */
  const clesAffichees = new Set(form.fields.map((f) => f.key))
  const ancien = formFor(listing.categoryId)
  const LIBELLES_ANCIENS = new Map(ancien.fields.map((f) => [f.key, f.label]))
  for (const [k, v] of Object.entries(attributs)) {
    if (!v || clesAffichees.has(k)) continue
    // Ce qui n'est pas un attribut d'annonce : les variantes de couleur (leur
    // carte à part), le dossier foncier (son bandeau à lui), les engagements.
    if (k.startsWith('var_') || k.startsWith('num_') || k === 'docs' || k === 'engagement' || k === 'couleurs') continue
    const label = LIBELLE_ACHETEUR[k] ?? LIBELLES_ANCIENS.get(k)
    attrItems.push({
      label: label ?? k.charAt(0).toUpperCase() + k.slice(1),
      value: v === 'Oui' ? 'Oui' : v,
    })
  }

  for (const id of lireDocs(attributs.docs)) {
    const num = attributs[cleNumero(id)]
    if (num) attrItems.push({ label: `N° ${DOC_PAR_ID[id].court}`, value: num })
  }
  // « Livraison » n'a pas de sens sur un terrain ou une offre d'emploi : on ne
  // l'affiche que là où la catégorie la propose.
  if (form.delivery) attrItems.push({ label: 'Livraison', value: listing.delivery ? 'Possible' : 'Sur place' })

  // Un maillon du fil d'Ariane. La cible tactile fait 32 px de haut — un fil
  // d'Ariane en petit texte gris est increvable à la souris et intouchable au
  // pouce, et c'est au pouce que ce site se lit.
  const filAriane =
    'inline-flex min-h-[32px] items-center rounded-full bg-primary-50 px-2.5 text-xs font-semibold text-primary-700 transition active:scale-[0.97]'

  /* Le bouton « Contacter le vendeur » — EN ORANGE depuis le 30/08.
   *
   * Il était vert, pour se détacher d'un site orange. Le site étant passé au
   * vert, le garder vert le rendait identique à tous les autres boutons : le
   * geste le plus important d'une fiche d'annonce aurait eu exactement
   * l'apparence de « Enregistrer » ou de « Filtrer ».
   *
   * LA RÈGLE, corrigée le 30/08 après une remarque juste du Patron : « je vois
   * que les couleurs sont Vert Blanc Vert ». Le drapeau ivoirien est ORANGE,
   * blanc, vert — réduire l'orange à ce seul bouton faisait perdre au site un
   * tiers de son identité.
   *
   *   · le VERT porte la marque et l'interface : en-tête, navigation, liens,
   *     prix, le signe ;
   *   · l'ORANGE porte TOUTES les actions : publier, contacter, valider ;
   *   · le blanc crème reste le sol.
   *
   * Ce bouton est donc de la même famille que `btn-primary`, et non une
   * exception : les deux se ressemblent parce qu'ils font la même chose.
   *
   * #D95F00 et non #F77F00 : sous du texte blanc, l'orange vif ne donne que
   * 2,9:1. L'orange foncé monte à 4,6:1 — au-dessus du seuil, ce qui compte
   * sur le bouton qu'on cherche en plein soleil.
   */
  const greenBtn =
    'txt-legible inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-action-600 to-action-700 px-4 py-3 font-display font-bold text-white shadow-[0_6px_16px_-6px_rgba(154,65,0,0.5)] transition active:scale-[0.98] hover:brightness-105 disabled:opacity-50'

  // Lien « propre » (crawlable, avec aperçu WhatsApp/Facebook via le serveur).
  const shareUrl = `${window.location.origin}/annonce/${listing.id}`
  const shareText = `${listing.title} — sur Chap.ci`

  function selectImage(i: number) {
    setImgIndex(i)
    const el = galleryRef.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  /** Toucher une couleur → sa photo : on fait défiler la galerie ET on y remonte. */
  function voirPhotoVariante(i: number) {
    selectImage(i)
    galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: listing!.title, text: shareText, url: shareUrl }); return }
      catch { /* annulé -> on ouvre le menu */ }
    }
    setShareOpen(true)
  }

  /**
   * L'affiche pour le statut WhatsApp : 1080 × 1920, fabriquée dans le
   * téléphone, envoyée au partage du système (WhatsApp y est en tête) ou
   * téléchargée si le navigateur ne sait pas partager un fichier.
   * Voir `lib/affiche.ts` pour le pourquoi.
   */
  async function affiche() {
    if (!listing) return
    setAfficheEnCours(true)
    try {
      const p = activePromo(listing)
      const blob = await rendreAffiche({
        id: listing.id,
        titre: listing.title,
        prix: listing.price === 0 ? 'Gratuit' : formatFCFA(p ? p.price : listing.price),
        prixBarre: p ? formatFCFA(p.original) : undefined,
        photo: listing.images[0] ? mediaUrl(listing.images[0]) : undefined,
        lieu: locationLabel(listing.regionId, listing.cityId, listing.commune),
        etat: listing.condition === 'neuf' ? 'Neuf' : 'Occasion',
      })
      const fait = await partagerAffiche(blob, `chapci-${listing.id}.png`, `${shareText}\n${shareUrl}`)
      if (fait === 'telecharge') toast.success('Affiche enregistrée dans vos images : collez-la en statut WhatsApp.')
    } catch {
      toast.error('L’affiche n’a pas pu être fabriquée. Réessayez, ou partagez le lien.')
    } finally {
      setAfficheEnCours(false)
    }
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
    <div className="min-h-screen bg-cream-200 pb-28 md:min-h-0 md:bg-transparent md:pb-10">
      <div className="md:grid md:grid-cols-2 md:items-start md:gap-8 md:pt-2">
        {/* Galerie — colonne gauche (collante sur ordinateur) */}
        <div className="md:sticky md:top-20 md:self-start">
          <div className="relative aspect-square overflow-hidden bg-cream-100 md:aspect-[4/3] md:rounded-3xl md:border md:border-line">
            <div
              ref={galleryRef}
              className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
              onScroll={(e) => {
                const el = e.currentTarget
                setImgIndex(Math.round(el.scrollLeft / el.clientWidth))
              }}
            >
              {listing.images.map((src, i) => (
                <img
                  key={i}
                  // mediaUrl est INDISPENSABLE ici. Dans l'application native, la
                  // page est servie depuis https://localhost : « /uploads/photo.jpg »
                  // y devient « https://localhost/uploads/photo.jpg », qui n'existe
                  // pas. Les miniatures, elles, passaient bien par mediaUrl — d'où
                  // le symptôme trompeur : les petites photos s'affichaient, la
                  // grande restait vide.
                  src={mediaUrl(src)}
                  alt={`${listing.title} — photo ${i + 1}`}
                  onClick={() => setViewer(i)}
                  className="h-full w-full shrink-0 cursor-zoom-in snap-center object-cover"
                />
              ))}
            </div>

            {/* La vignette est RECADRÉE (object-cover) : sur une photo verticale,
                le haut et le bas sont coupés. Rien ne le disait — on l'annonce,
                et on donne le geste qui montre la photo entière. */}
            {!listing.sold && (
              <button
                onClick={() => setViewer(imgIndex)}
                className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-2 text-[12px] font-semibold text-white backdrop-blur transition active:scale-95"
              >
                <Maximize2 size={14} /> Voir en grand
              </button>
            )}

            {/* Repère de position, comme sur l'écran publicitaire */}
            {listing.images.length > 1 && !listing.sold && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                {listing.images.map((_, i) => (
                  <span
                    key={i}
                    className={`block h-1.5 rounded-full transition-all ${
                      i === imgIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Badges marketing (haut-gauche) */}
            {listing.sold ? (
              <div className="absolute inset-0 z-20 grid place-items-center bg-black/50">
                <span className="rounded-full bg-white px-4 py-1.5 text-sm font-black uppercase tracking-wide text-gray-800 shadow">
                  Vendu
                </span>
              </div>
            ) : (
              <div className="pointer-events-none absolute left-3 top-16 z-10 flex flex-col items-start gap-1.5 md:top-3">
                {listing.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                    <Star size={12} className="fill-white" /> À la une
                  </span>
                )}
                {promo && <PromoTag percent={promo.percent} height={24} />}
                {form.condition && listing.condition === 'neuf' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ivoire-green-dark shadow">
                    <BadgeCheck size={12} /> Neuf
                  </span>
                )}
                {listing.delivery && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700 shadow">
                    <Truck size={12} /> Livraison
                  </span>
                )}
              </div>
            )}

            {/* Retour (mobile) */}
            <button
              onClick={() => navigate(-1)}
              className="absolute left-3 top-3 z-30 grid h-11 w-11 place-items-center rounded-full bg-white/95 shadow transition active:scale-90 md:hidden"
              aria-label="Retour"
            >
              <ArrowLeft size={20} />
            </button>

            {/* Partager (mobile) + favori */}
            <div className="absolute right-3 top-3 z-30 flex gap-2">
              <button
                onClick={() => setShareOpen(true)}
                className="grid h-11 w-11 place-items-center rounded-full bg-white/95 shadow transition active:scale-90 md:hidden"
                aria-label="Partager"
              >
                <Share2 size={19} />
              </button>
              <button
                onClick={() => toggleFavorite(listing.id)}
                className="grid h-11 w-11 place-items-center rounded-full bg-white/95 shadow transition active:scale-90"
                aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart size={19} className={fav ? 'fill-red-500 text-red-500' : 'text-gray-700'} />
              </button>
            </div>
          </div>

          {/* Miniatures */}
          {listing.images.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4 md:px-0">
              {listing.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => selectImage(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 bg-cream-100 transition ${
                    i === imgIndex ? 'border-primary-500' : 'border-line'
                  }`}
                  aria-label={`Voir la photo ${i + 1}`}
                >
                  <img src={mediaUrl(src)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Infos — colonne droite */}
        <div className="px-4 pt-4 md:px-0 md:pt-0">
          {/* Le repère du prix : tant qu'il est à l'écran, la barre du bas se
              contente de ses deux boutons. Dès qu'il sort, elle rappelle de
              quoi on parle. Voir `identiteVisible`. */}
          <div ref={reperePrix} />
          {/* Prix */}
          {promo ? (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <PromoTag percent={promo.percent} height={26} />
                <span className="tnum font-display text-3xl font-black text-red-600">{formatFCFA(promo.price)}</span>
                <span className="tnum text-base text-gray-500 line-through">{formatFCFA(promo.original)}</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-red-600">
                Promo jusqu’au {promoEndLabel(promo.until)}
                {listing.negotiable ? ' · à débattre' : ''}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="tnum font-display text-3xl font-black text-primary-700">
                {listing.price === 0 ? 'Gratuit' : formatFCFA(listing.price)}
              </span>
              {listing.negotiable && listing.price !== 0 && (
                <span className="text-sm font-medium text-gray-500">négociable</span>
              )}
            </div>
          )}
          {/* « Ça vaut combien ? » — un mot à l'acheteur : dans la moyenne, ou
              bien en dessous (méfiance). Voir lib/prixMarche.ts. */}
          <PrixMarcheAcheteur
            categoryId={listing.categoryId}
            subcategory={listing.subcategory}
            condition={listing.condition}
            marque={attributs?.marque}
            prix={promo ? promo.price : listing.price}
          />

          {/* Titre */}
          <h1 className="mt-2 font-display text-xl font-bold leading-snug text-gray-900 md:text-2xl"
            dir={traduction?.langue === 'ar' ? 'rtl' : undefined}>
            {traduction ? traduction.titre : listing.title}
          </h1>

          {/* Méta : localisation · publié · vues · distance */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1">
              <MapPin size={15} />
              {locationLabel(listing.regionId, listing.cityId, listing.commune)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={15} />
              {timeAgo(listing.createdAt)}
            </span>
            {listing.views != null && (
              <span className="inline-flex items-center gap-1">
                <Eye size={15} />
                <span className="tnum">{listing.views}</span> vues
              </span>
            )}
            {distanceKm != null && distanceKm < 500 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
                <Navigation size={13} />
                {formatDistance(distanceKm)} de vous
              </span>
            )}
          </div>

          {/* ── LE FIL D'ARIANE ────────────────────────────────────────────────
              Il y avait bien une étiquette de catégorie ici, mais elle menait
              TOUT à la catégorie : « Mode & Beauté · Chaussures » était un seul
              lien, et il ouvrait Mode & Beauté en entier. Quelqu'un qui vient
              de trouver une paire de chaussures et veut en voir d'autres se
              retrouvait devant des robes et des parfums.

              Chaque niveau est donc son propre lien. On garde l'aspect de
              pastilles (le fil gris pâle des sites de e-commerce se voit mal au
              soleil d'Abidjan, et se touche encore moins bien : ces liens font
              maintenant 32 px de haut). */}
          {cat && (
            <nav aria-label="Fil d’Ariane" className="mt-3">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link to="/explorer" className={filAriane}>Annonces</Link>
                </li>
                <li aria-hidden="true" className="text-gray-300">›</li>
                <li>
                  <Link to={`/explorer?cat=${cat.id}`} className={filAriane}>{cat.name}</Link>
                </li>
                {listing.subcategory && (
                  <>
                    <li aria-hidden="true" className="text-gray-300">›</li>
                    <li>
                      <Link
                        to={`/explorer?cat=${cat.id}&sub=${encodeURIComponent(listing.subcategory)}`}
                        className={filAriane}
                      >
                        {listing.subcategory}
                      </Link>
                    </li>
                  </>
                )}
              </ol>
            </nav>
          )}

          {/* Le bandeau : la seule chose à lire avant de se déplacer.
              Une question par sous-catégorie, celle dont la réponse change la
              décision — la carte grise pour une voiture, l'IMEI pour un
              téléphone, les frais demandés pour une offre d'emploi. Il ne juge
              pas le vendeur : « vendu pour pièces » ou « copie assumée »
              passent en vert. Ce qui est signalé, c'est le silence. */}
          {sousForm?.bandeaux.map((b, i) => (
            <div
              key={i}
              className={`mt-3 flex gap-2.5 rounded-2xl border p-4 shadow-card ${
                b.bon ? 'border-ivoire-green/25 bg-ivoire-green/8' : 'border-red-200 bg-red-50'
              }`}
            >
              {b.bon ? (
                <ShieldCheck size={19} className="mt-px shrink-0 text-ivoire-green-dark" />
              ) : (
                <ShieldAlert size={19} className="mt-px shrink-0 text-red-600" />
              )}
              <p
                className={`min-w-0 text-[13.5px] font-medium leading-relaxed ${
                  b.bon ? 'text-ivoire-green-dark' : 'text-red-700'
                }`}
              >
                {b.texte}
              </p>
            </div>
          ))}

          {/* Attributs — cartes façon mockup */}
          {attrItems.length > 0 && (
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {attrItems.map((a) => (
                <div key={a.label} className="rounded-2xl border border-line bg-white px-4 py-3 shadow-card">
                  <dt className="text-xs text-gray-500">{a.label}</dt>
                  {a.couleurs?.length ? (
                    <dd className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1.5">
                      {a.couleurs.map((c) => (
                        <span key={c.nom} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                          <span
                            aria-hidden="true"
                            className={`h-3.5 w-3.5 shrink-0 rounded-full ${c.clair ? 'ring-1 ring-inset ring-black/20' : ''}`}
                            style={{ background: c.css }}
                          />
                          {c.nom}
                        </span>
                      ))}
                    </dd>
                  ) : (
                    <dd className="mt-0.5 font-semibold text-gray-900">{a.value}</dd>
                  )}
                </div>
              ))}
            </dl>
          )}

          {/* Couleurs détaillées — chaque couleur avec sa photo, son prix, ses
              détails. Toucher une ligne fait défiler la galerie vers la photo
              de cette couleur. */}
          {variantesActives && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              <p className="px-4 pb-1 pt-3 text-xs text-gray-500">Couleurs disponibles</p>
              <div className="divide-y divide-line">
                {variantes.map((v) => {
                  const cliquable = v.photo !== null
                  return (
                    <button
                      key={v.couleur.nom}
                      type="button"
                      disabled={!cliquable}
                      onClick={cliquable ? () => voirPhotoVariante(v.photo!) : undefined}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left ${
                        cliquable ? 'transition hover:bg-cream-100 active:bg-cream-100' : 'cursor-default'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-4 w-4 shrink-0 rounded-full ${v.couleur.clair ? 'ring-1 ring-inset ring-black/20' : ''}`}
                        style={{ background: v.couleur.css }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-gray-900">{v.couleur.nom}</span>
                        {v.note && <span className="block text-xs text-gray-500">{v.note}</span>}
                        {varDe(v.couleur.nom).map((x) => (
                          <span key={x.label} className="mt-1 block text-xs text-gray-600">
                            <span className="text-gray-500">{x.label} · </span>
                            <b className="font-semibold text-primary-700">{x.valeur}</b>
                          </span>
                        ))}
                      </span>
                      {v.prix !== null && (
                        <span className="tnum shrink-0 font-display text-sm font-bold text-primary-600">
                          {formatFCFA(v.prix)}
                        </span>
                      )}
                      {cliquable && <ChevronRight size={15} className="shrink-0 text-gray-400" />}
                    </button>
                  )
                })}
              </div>
              {variantes.some((v) => v.photo !== null) && (
                <p className="px-4 pb-3 pt-1.5 text-[11px] text-gray-500">Touchez une couleur pour voir sa photo.</p>
              )}
            </div>
          )}

          {/* Dossier foncier — verdict, contrôles à faire, guide dépliant */}
          {dossierFoncier && (
            <div className="mt-5">
              <FoncierDossier attributes={attributs} />
            </div>
          )}

          {/* Description */}
          <div className="mt-5">
            <h2 className="mb-1.5 font-display text-sm font-bold text-gray-900">Description</h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-gray-700"
              dir={traduction?.langue === 'ar' ? 'rtl' : undefined}>
              {traduction ? traduction.description : listing.description}
            </p>
            {/* TRADUIRE — le moteur existait côté serveur, l'application s'en
                servait, le site ne l'appelait jamais. */}
            <TraduireAnnonce listingId={listing.id} titre={listing.title}
              description={listing.description}
              traduction={traduction} onTraduction={setTraduction} />
          </div>

          {/* Vendeur */}
          <Link
            to={sellerId ? `/vendeur/${sellerId}` : '#'}
            onClick={(e) => {
              if (!sellerId) e.preventDefault()
            }}
            className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ivoire-green font-display text-lg font-bold text-white">
              {sellerInitial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-gray-900">{listing.sellerName}</p>
              {count > 0 ? (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Stars value={avg} size={13} /> {avg.toFixed(1)} · {count} avis
                </span>
              ) : (
                <p className="text-xs text-gray-500">Vendeur sur Chap.ci</p>
              )}
              {reponse != null && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-ivoire-green/10 px-2 py-0.5 text-[11px] font-semibold text-ivoire-green-dark">
                  <Timer size={12} /> Répond en {delaiCourt(reponse)} en général
                </span>
              )}
            </div>
            {sellerId && (
              <span className="shrink-0 rounded-xl border border-line2 bg-white px-4 py-2 font-display text-sm font-bold text-ink">
                Voir
              </span>
            )}
          </Link>

          {/* Actions — en ligne sur ordinateur (barre fixe sur mobile) */}
          <div className="mt-5 hidden md:block">
            {listing.sold ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-display font-semibold text-gray-500">
                <BadgeCheck size={18} /> Article vendu
              </div>
            ) : isMine ? (
              <Link to="/compte" className="btn-outline w-full">
                Gérer mon annonce
              </Link>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <button onClick={askQuestion} disabled={busy} className={`${greenBtn} flex-1`}>
                    <MessageSquare size={18} /> {busy ? '…' : 'Contacter'}
                  </button>
                  <button onClick={buyNow} disabled={busy} className="btn-outline flex-1">
                    <ShoppingBag size={18} /> Acheter
                  </button>
                  <button onClick={() => setShareOpen(true)} className="btn-outline shrink-0 px-3" aria-label="Partager">
                    <Share2 size={18} />
                  </button>
                </div>
                {isDemo && (
                  <p className="mt-1.5 text-[11px] text-gray-500">
                    Exemple de démonstration — publiez votre annonce pour recevoir de vrais messages.
                  </p>
                )}
              </>
            )}
          </div>

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
              <h2 className="font-display text-sm font-bold text-gray-900">Avis {count > 0 ? `(${count})` : ''}</h2>
              {user && purchased && !alreadyReviewed && !isMine && (
                <button onClick={() => setShowReview((s) => !s)} className="text-sm font-semibold text-primary-600">
                  {showReview ? 'Annuler' : 'Laisser un avis'}
                </button>
              )}
            </div>

            {showReview && (
              <div className="mb-3 rounded-2xl border border-line2 p-3">
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
              <p className="text-sm text-gray-500">Aucun avis pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 4).map((r) => (
                  <div key={r.id} className="rounded-2xl border border-line bg-white p-3 shadow-card">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{r.reviewerName}</span>
                      <Stars value={r.rating} size={13} />
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
                    <p className="mt-1 text-[11px] text-gray-500">{timeAgo(r.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signalement */}
          {!isMine && <ReportButton listingId={listing.id} />}
        </div>
      </div>

      {/* Similaires — pleine largeur sous les deux colonnes */}
      {similar.length > 0 && (
        <div className="mt-8 px-4 md:px-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-gray-900">Annonces similaires</h2>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0">
            {similar.map((l) => (
              <div key={l.id} className="w-40 shrink-0 md:w-auto">
                <ListingCard listing={l} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barre d'action fixe — mobile uniquement */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app border-t border-line bg-white px-4 py-3 shadow-nav safe-bottom md:hidden">
        {/* De QUOI parle ce bouton — voir `identiteVisible` plus haut.
            N'apparaît qu'une fois le prix sorti de l'écran, et disparaît si
            l'annonce est vendue (le bandeau gris dit alors tout ce qu'il y a
            à dire). */}
        {identiteVisible && !listing.sold && (
          <div className="mb-2 flex items-center gap-2.5 border-b border-line pb-2">
            {listing.images?.[0] && (
              <img
                src={mediaUrl(listing.images[0])}
                alt=""
                className="h-9 w-9 shrink-0 rounded-lg border border-line object-cover"
              />
            )}
            <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-gray-700">
              {listing.title}
            </p>
            <span className="tnum shrink-0 font-display text-sm font-black text-primary-700">
              {promo
                ? formatFCFA(promo.price)
                : listing.price === 0
                  ? 'Gratuit'
                  : formatFCFA(listing.price)}
            </span>
          </div>
        )}
        {listing.sold ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-display font-semibold text-gray-500">
            <BadgeCheck size={18} /> Article vendu
          </div>
        ) : isMine ? (
          <Link to="/compte" className="btn-outline w-full py-3">
            Gérer mon annonce
          </Link>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button onClick={askQuestion} disabled={busy} className={`${greenBtn} flex-[1.7]`}>
                <MessageSquare size={18} /> {busy ? '…' : 'Contacter le vendeur'}
              </button>
              <button onClick={buyNow} disabled={busy} className="btn-outline flex-1">
                <ShoppingBag size={18} /> Acheter
              </button>
            </div>
            {isDemo && (
              <p className="mt-1.5 text-center text-[11px] text-gray-500">
                Exemple de démonstration — publiez votre annonce pour recevoir de vrais messages.
              </p>
            )}
          </>
        )}
      </div>

      {/* Photo en grand : on ouvre à la photo touchée, on balaie pour changer. */}
      {viewer !== null && (
        <PhotoViewer
          images={listing.images}
          index={viewer}
          alt={listing.title}
          onClose={(n) => { selectImage(n); setViewer(null) }}
        />
      )}

      {shareOpen && (
        <ShareSheet
          url={shareUrl}
          text={shareText}
          onNative={share}
          hasNative={typeof navigator !== 'undefined' && !!navigator.share}
          onAffiche={affiche}
          afficheEnCours={afficheEnCours}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  )
}

/** Feuille de partage : WhatsApp, Facebook, copier le lien, l'affiche pour le statut, partage natif. */
function ShareSheet({
  url, text, onClose, onNative, hasNative, onAffiche, afficheEnCours,
}: {
  url: string; text: string; onClose: () => void; onNative: () => void; hasNative: boolean
  onAffiche: () => void; afficheEnCours: boolean
}) {
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
            <BrandBadge id="whatsapp" />
            <span className="text-xs font-medium text-gray-700">WhatsApp</span>
          </a>
          <a href={fb} target="_blank" rel="noopener noreferrer" onClick={onClose} className="flex flex-col items-center gap-1.5">
            <BrandBadge id="facebook" />
            <span className="text-xs font-medium text-gray-700">Facebook</span>
          </a>
          <button onClick={copy} className="flex flex-col items-center gap-1.5">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-gray-100 text-gray-700">
              {copied ? '✓' : '🔗'}
            </span>
            <span className="text-xs font-medium text-gray-700">{copied ? 'Copié !' : 'Copier'}</span>
          </button>
        </div>
        {/* L'affiche pour le statut : c'est LÀ que ça se vend à Abidjan. Une
            image 1080 × 1920 fabriquée dans le téléphone — voir lib/affiche.ts. */}
        <button
          onClick={onAffiche}
          disabled={afficheEnCours}
          aria-busy={afficheEnCours}
          className="btn-primary mt-4 flex w-full items-center justify-center gap-2 py-3 text-sm disabled:opacity-60"
        >
          <span aria-hidden="true">📣</span>
          {afficheEnCours ? 'Fabrication de l’affiche…' : 'Affiche pour mon statut WhatsApp'}
        </button>
        {hasNative && (
          <button onClick={() => { onClose(); onNative() }} className="btn-outline mt-2 w-full py-2.5 text-sm">
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
      <p className="mt-4 text-center text-xs text-ivoire-green-dark">
        ✓ Merci, votre signalement a été transmis à la modération.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => (user ? setOpen(true) : navigate('/connexion'))}
        className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-gray-500 md:hover:text-red-500"
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
