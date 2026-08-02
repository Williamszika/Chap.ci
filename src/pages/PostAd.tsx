import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Plus, X, MapPin, Check, Lock, UserPlus, LocateFixed, Tag, Wand2, ShieldAlert, ShieldCheck, BookOpen, Loader2, ChevronDown } from 'lucide-react'
import { mediaUrl } from '../lib/native'
import { useApp, type NewListingInput } from '../store/AppContext'
import { useAuth } from '../store/AuthContext'
import { isPhp } from '../lib/backend'
import * as php from '../lib/php'
import { fetchVerifyStatus, sendEmailCode, confirmEmailCode, type VerifyStatus } from '../lib/verify'
import { MailCheck } from 'lucide-react'
import type { Listing } from '../types'
import { useGeo } from '../store/GeoContext'
import { useToast } from '../store/ToastContext'
import { useNotifications } from '../store/NotificationsContext'
import { categories, categoryById } from '../data/categories'
import { formFor, type AttrField } from '../data/categoryForms'
import { useFormSous } from '../data/sous'
import { FoncierDocs } from '../components/FoncierDocs'
import { DOC_PAR_ID, cleNumero, lireDocs } from '../data/foncier'
import { lireCouleurs } from '../data/couleurs'
import { CouleursVariantes } from '../components/CouleursVariantes'
import { PromoTag } from '../components/PromoTag'
import { LocationSheet } from '../components/LocationSheet'
import { formatFCFA } from '../lib/format'
import { trackPublish } from '../lib/marketing'
import { guessFromTitle } from '../lib/autofill'
import { analyzePhoto } from '../lib/vision'
import { locationLabel, resolveLocationByName } from '../data/locations'
import { placeholderImage, emojiFor } from '../lib/placeholder'
import { downscaleListingImage } from '../lib/image'
import { classifyImage } from '../lib/nsfw'
import { PhotoEditor } from '../components/PhotoEditor'
import { useLocalStorage } from '../lib/useLocalStorage'
import { getBestPosition, reverseGeocode } from '../lib/geo'
import { coordsFor, type Coords } from '../data/coords'
import type { LocationFilter } from '../types'

const MAX_PHOTOS = 5

/**
 * Photos exigées pour publier.
 *
 * Une annonce sans photo ne se vend pas : l'acheteur qui doit traverser Abidjan
 * veut voir avant de se déplacer. Une seule photo, c'est souvent celle du
 * fabricant ; deux, la même sous deux angles. À trois, le vendeur montre
 * l'objet qu'il a réellement chez lui — c'est là que se joue la différence
 * entre une vraie annonce et une annonce recopiée.
 *
 * Le même nombre est écrit dans server/index.php (LISTING_MIN_PHOTOS), et il
 * le faut : l'écran doit le dire AVANT, la route doit le faire respecter
 * APRÈS. Si vous changez l'un, changez l'autre.
 */
const MIN_PHOTOS = 3

/** Emoji par catégorie — pour le menu déroulant « Catégorie » (façon artifact). */
const CAT_EMOJI: Record<string, string> = {
  electronique: '📱', vehicules: '🚗', immobilier: '🏠', mode: '👗',
  maison: '🛋️', emploi: '💼', services: '🔧',
  'materiel-pro': '🏗️', alimentation: '🍎',
  animaux: '🐾', loisirs: '🎮', bebe: '👶', sante: '💚',
}

/** Raison de refus renvoyée par le Gardien de publication (modération). */
type ModReason = { code: string; label: string; advice: string }

/** Les trois engagements exigés avant de publier une vente immobilière. */
const ENGAGEMENTS = [
  'Je déclare que ces informations sont exactes et que je suis en droit de vendre ce bien.',
  'Je comprends que Chap.ci ne vérifie aucun document et ne garantit aucune vente. Ce que j’écris ici m’engage, moi seul.',
  'Je m’engage à présenter les originaux à l’acheteur et à passer par un notaire pour la vente.',
] as const

export function PostAd() {
  const navigate = useNavigate()
  const { user, loading: authLoading, refreshUser } = useAuth()
  // État de vérification : chargé une fois, pour savoir si l'on doit ouvrir la
  // saisie du code avant même d'afficher le formulaire.
  const [verifStatus, setVerifStatus] = useState<VerifyStatus | null>(null)
  useEffect(() => {
    if (!user || !isPhp) { setVerifStatus({ emailVerified: true, badge: '', mois: 0, moisRestants: 0 }); return }
    let vivant = true
    fetchVerifyStatus()
      .then((v) => { if (vivant) setVerifStatus(v) })
      .catch(() => { if (vivant) setVerifStatus({ emailVerified: true, badge: '', mois: 0, moisRestants: 0 }) })
    return () => { vivant = false }
  }, [user])
  const { addListing, updateListing, getListing } = useApp()
  const { place } = useGeo()
  const toast = useToast()
  const { refresh: refreshNotifs } = useNotifications()
  const fileRef = useRef<HTMLInputElement>(null)
  // P26 : garde de montage — évite de mettre à jour l'écran après l'avoir quitté
  // (pendant l'analyse asynchrone des photos).
  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  // Mode édition : /modifier/:id — l'annonce est passée via l'état de navigation
  // (ou retrouvée dans la liste). On préremplit alors le formulaire.
  const { id: editId } = useParams()
  const location = useLocation()
  const editing = !!editId
  // Annonce à modifier : reçue par la navigation, ou retrouvée dans la liste
  // déjà chargée. Ni l'un ni l'autre quand on ARRIVE par un lien direct — celui
  // d'un e-mail, par exemple : la liste publique ne contient pas les annonces
  // masquées, et le formulaire s'ouvrirait vide. On va alors la chercher.
  const [fetchedListing, setFetchedListing] = useState<Listing | null>(null)
  const editListing =
    ((location.state as { listing?: Listing } | null)?.listing)
    ?? (editId ? getListing(editId) : undefined)
    ?? fetchedListing
    ?? undefined
  const [loadingListing, setLoadingListing] = useState(false)
  useEffect(() => {
    if (!editing || !editId || editListing || !isPhp || !user) return
    let vivant = true
    setLoadingListing(true)
    php.phpMyListings()
      .then((mes) => { if (vivant) setFetchedListing(mes.find((l) => l.id === editId) ?? null) })
      .catch(() => { /* l'écran affichera « annonce introuvable » */ })
      .finally(() => { if (vivant) setLoadingListing(false) })
    return () => { vivant = false }
  }, [editing, editId, editListing, user])

  const [images, setImages] = useState<string[]>([])
  const [editIndex, setEditIndex] = useState<number | null>(null) // photo en cours d'édition
  const [checkingPhotos, setCheckingPhotos] = useState(false) // analyse NSFW en cours
  const [photoError, setPhotoError] = useState('') // photos refusées (nudité)
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [attrs, setAttrs] = useState<Record<string, string>>({})
  const [condition, setCondition] = useState<'neuf' | 'occasion'>('occasion')
  const [price, setPrice] = useState('')
  const [negotiable, setNegotiable] = useState(false)
  const [promoOn, setPromoOn] = useState(false)
  const [promoPct, setPromoPct] = useState('')
  const [promoDays, setPromoDays] = useState('7')
  const [delivery, setDelivery] = useState(false)
  const [description, setDescription] = useState('')
  const [loc, setLoc] = useState<LocationFilter>({})
  const [locOpen, setLocOpen] = useState(false)
  const [coords, setCoords] = useState<Coords | null>(null)
  const [locating, setLocating] = useState(false)
  const [seller, setSeller] = useLocalStorage('chapci.seller.v1', { name: '', phone: '' })
  const [error, setError] = useState('')
  // Vente immobilière : les trois engagements du vendeur, bloquants.
  const [engagements, setEngagements] = useState<[boolean, boolean, boolean]>([false, false, false])
  const [moderation, setModeration] = useState<ModReason[] | null>(null) // refus du Gardien
  const [submitting, setSubmitting] = useState(false)
  const prefilled = useRef(false)

  // Mode édition : préremplit une fois le formulaire avec l'annonce existante.
  useEffect(() => {
    if (!editing || !editListing || prefilled.current) return
    prefilled.current = true
    const l = editListing
    setImages(l.images ?? [])
    setTitle(l.title ?? '')
    setCategoryId(l.categoryId ?? '')
    setSubcategory(l.subcategory ?? '')
    setAttrs(l.attributes ?? {})
    // Les engagements déjà pris restent cochés : on ne fait pas recommencer un
    // vendeur qui corrige une virgule. Une annonce d'avant la réforme, elle,
    // n'a pas d'engagement — les cases sont vides, et bloquent.
    if (l.attributes?.engagement === 'oui') setEngagements([true, true, true])
    setCondition(l.condition === 'neuf' ? 'neuf' : 'occasion')
    setPrice(String(l.price ?? ''))
    setNegotiable(!!l.negotiable)
    setDelivery(!!l.delivery)
    setDescription(l.description === 'Aucune description fournie.' ? '' : (l.description ?? ''))
    setLoc({ regionId: l.regionId, cityId: l.cityId, commune: l.commune ?? undefined })
    if (l.lat != null && l.lng != null) setCoords({ lat: l.lat, lng: l.lng })
    // Le téléphone n'est plus renvoyé par la liste PUBLIQUE (il ne sort que pour
    // le propriétaire). On ne remplace donc le numéro mémorisé sur cet appareil
    // que si l'annonce en porte réellement un — sinon le champ se viderait tout
    // seul à chaque modification.
    if (l.sellerName || l.sellerPhone) {
      setSeller((prev) => ({
        name: l.sellerName ?? prev.name,
        phone: l.sellerPhone || prev.phone,
      }))
    }
    // Promotion en cours : on rétablit le pourcentage.
    if (l.promoPrice && l.price > 0) {
      setPromoOn(true)
      setPromoPct(String(Math.round((1 - l.promoPrice / l.price) * 100)))
    }
  }, [editing, editListing, setSeller])

  // Pré-remplit le NOM du vendeur depuis le compte connecté. Un premier vendeur
  // a déjà donné son nom à l'inscription : le retaper est une friction inutile
  // (levier de conversion visiteur → vendeur). Ne touche pas si déjà saisi.
  useEffect(() => {
    if (editing) return
    const fullName = user?.user_metadata?.full_name?.trim()
    if (!fullName) return
    setSeller((prev) => (prev.name.trim() ? prev : { ...prev, name: fullName }))
  }, [user, editing, setSeller])

  // Pré-remplit la localisation avec la position captée à l'ouverture / la connexion.
  useEffect(() => {
    if (!place) return
    setLoc((prev) =>
      prev.regionId ? prev : { regionId: place.regionId, cityId: place.cityId, commune: place.commune },
    )
    if (place.lat != null && place.lng != null) {
      setCoords((prev) => prev ?? { lat: place.lat!, lng: place.lng! })
    }
  }, [place])

  // IA « titre → catégorie » : tant qu'aucune catégorie n'est choisie, on la
  // devine (avec une sous-catégorie) depuis le titre. Dès qu'une catégorie est
  // fixée (auto ou manuel), on ne touche plus.
  useEffect(() => {
    if (editing || categoryId) return
    const g = guessFromTitle(title)
    if (g.categoryId) {
      setCategoryId(g.categoryId)
      if (g.subcategory) setSubcategory(g.subcategory)
    }
  }, [title, categoryId, editing])

  const cat = categoryById(categoryId)

  /**
   * Le formulaire de la SOUS-catégorie, quand elle en a un — c'est-à-dire
   * partout sauf en immobilier, qui a son dossier foncier, plus riche.
   *
   * On ne pose plus les mêmes questions à qui vend un canapé et à qui vend une
   * bouteille de gaz. Le schéma décide de tout : les champs, ce qui est
   * obligatoire, s'il y a des couleurs et lesquelles, si « occasion / neuf »
   * a un sens, comment s'appelle le prix, et la question dont la réponse
   * s'affichera en tête de la fiche.
   */
  const sousForm = useFormSous(categoryId, subcategory, attrs)
  const form = sousForm ?? formFor(categoryId)

  /**
   * Le nombre de photos exigé POUR CETTE annonce-là.
   *
   * Trois pour une nouvelle. Mais une annonce publiée avant la règle est déjà
   * en ligne avec une ou deux photos, et son vendeur a le droit d'en corriger
   * le prix ou une faute : lui refuser la modification tant qu'il n'a pas
   * retrouvé deux photos de plus, c'est le punir d'une règle qui n'existait
   * pas — et la plupart du temps, il abandonne la correction. On lui demande
   * donc seulement de ne pas descendre plus bas. Le serveur applique
   * exactement le même calcul.
   */
  const planchePhotos = editing
    ? Math.min(MIN_PHOTOS, Math.max(1, editListing?.images?.length ?? MIN_PHOTOS))
    : MIN_PHOTOS

  // Champs réellement à l'écran : ceux dont la condition est remplie. Un champ
  // masqué n'est jamais exigé, et sa valeur ne part pas au serveur.
  // `_sub` donne la sous-catégorie aux conditions (Téléphones en dépend) sans
  // jamais entrer dans les attributs enregistrés.
  const ctxAttrs: Record<string, string> = { ...attrs, _sub: subcategory }
  const champsVisibles = form.fields.filter((f) => !f.when || f.when(ctxAttrs))
  const venteFonciere = categoryId === 'immobilier' && attrs.transaction === 'Vente'

  /**
   * En immobilier, la sous-catégorie dit déjà s'il s'agit d'une vente ou d'une
   * location. La reposer en « Type d'offre » revient à demander deux fois la
   * même chose — et tant qu'on n'y répondait pas une seconde fois, le dossier
   * foncier restait invisible : le vendeur ne découvrait la moitié du
   * formulaire qu'au moment de publier.
   *
   * On déduit donc la réponse de la sous-catégorie. « Bureaux & Commerces » et
   * « Toutes » ne tranchent pas : on ne devine rien, les puces restent à remplir.
   */
  function deduireTransaction(sub: string) {
    if (categoryId !== 'immobilier') return
    const vente = ['Vente', 'Terrains'].includes(sub)
    const location = ['Location', 'Colocation', 'Location vacances'].includes(sub)
    if (vente) setAttr('transaction', 'Vente')
    else if (location) setAttr('transaction', 'Location')
  }

  // Sélectionne une catégorie et réinitialise ce qui en dépend.
  function pickCategory(id: string) {
    setCategoryId(id)
    setSubcategory('')
    setAttrs({})
  }
  const setAttr = (key: string, value: string) =>
    setAttrs((prev) => {
      const next = { ...prev }
      if (value) next[key] = value
      else delete next[key]
      return next
    })

  // Aperçu de la promotion (prix réduit calculé depuis le pourcentage).
  const priceNum = Number(price) || 0
  const promoPctNum = Number(promoPct) || 0
  const promoPreview =
    promoOn && promoPctNum > 0 && promoPctNum < 100 && priceNum > 0
      ? { percent: promoPctNum, price: Math.floor(priceNum * (1 - promoPctNum / 100)) }
      : null

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const room = MAX_PHOTOS - images.length
    e.target.value = ''
    // Compression AVANT stockage : une photo brute de téléphone (plusieurs Mo)
    // ferait dépasser la limite d'upload du serveur et l'annonce partirait en
    // « mode local » au lieu d'être enregistrée. On redimensionne à 1280 px max.
    setPhotoError('')
    setCheckingPhotos(true)
    const added: string[] = []
    let blocked = 0
    for (const file of files.slice(0, room)) {
      let uri: string | null = null
      try {
        uri = await downscaleListingImage(file)
      } catch {
        // Repli : si la compression échoue, on lit le fichier tel quel.
        uri = await new Promise<string | null>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
          reader.onerror = () => resolve(null)
          reader.readAsDataURL(file)
        })
      }
      if (!uri) continue
      // Analyse anti-nudité (locale, gratuite). Ne bloque pas en cas d'échec.
      const verdict = await classifyImage(uri)
      if (!mountedRef.current) return // écran fermé pendant l'analyse (P26)
      if (verdict.blocked) { blocked++; continue }
      added.push(uri)
    }
    if (!mountedRef.current) return
    setCheckingPhotos(false)
    if (blocked > 0) {
      setPhotoError(
        `${blocked} photo${blocked > 1 ? 's' : ''} refusée${blocked > 1 ? 's' : ''} : contenu à caractère sexuel / nudité détecté. Ces photos sont interdites sur Chap.ci.`,
      )
    }
    if (!added.length) return
    const startIndex = images.length
    setImages((prev) => [...prev, ...added].slice(0, MAX_PHOTOS))
    // IA locale (MobileNet) : devine l'objet de la 1ʳᵉ photo → propose une
    // catégorie et un début de description. Ne remplace JAMAIS ce que
    // l'utilisateur a déjà saisi. Fail-open : sans effet si le modèle ne charge pas.
    analyzePhoto(added[0])
      .then((r) => {
        if (!mountedRef.current) return
        if (r.categoryId) setCategoryId((c) => c || r.categoryId!)
        if (r.description) setDescription((d) => (d.trim() ? d : r.description!))
      })
      .catch(() => {})
    // Une seule photo ajoutée : on ouvre directement l'éditeur pour l'embellir.
    if (added.length === 1) setEditIndex(startIndex)
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
    // Les variantes couleur pointent vers les photos PAR INDEX : supprimer une
    // photo décale tout ce qui suit. Sans ce remap, la couleur « Noir » se
    // retrouverait liée à la photo du modèle bleu.
    setAttrs((prev) => {
      const next = { ...prev }
      for (const [k, v] of Object.entries(prev)) {
        if (!k.startsWith('var_') || !k.endsWith('_photo') || !/^\d+$/.test(v)) continue
        const n = Number(v)
        if (n === i) delete next[k]
        else if (n > i) next[k] = String(n - 1)
      }
      return next
    })
  }

  // Remplace la photo éditée par sa version recadrée / améliorée.
  function applyEdited(dataUri: string) {
    setImages((prev) => prev.map((src, idx) => (idx === editIndex ? dataUri : src)))
    setEditIndex(null)
  }

  // Géolocalise l'utilisateur (GPS) et verrouille la localisation de l'annonce.
  async function detect() {
    setLocating(true)
    try {
      const fix = await getBestPosition()
      setCoords({ lat: fix.lat, lng: fix.lng })
      const geo = await reverseGeocode(fix.lat, fix.lng)
      const resolved = resolveLocationByName(geo?.suburb, geo?.city, geo?.region) ?? {}
      if (resolved.regionId) {
        setLoc({ regionId: resolved.regionId, cityId: resolved.cityId, commune: resolved.commune })
      }
    } catch {
      toast.error(
        'Impossible d’obtenir votre position. Autorisez la localisation dans votre navigateur, puis réessayez.',
      )
    } finally {
      setLocating(false)
    }
  }

  /**
   * Signale une erreur de saisie ET conduit au champ concerné : défilement doux,
   * puis curseur dans le champ quand il est saisissable (la localisation est un
   * sélecteur, on se contente alors de la faire apparaître à l'écran).
   */
  function fail(msg: string, fieldId: string) {
    setError(msg)
    const el = document.getElementById(fieldId)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
      el.focus({ preventScroll: true })
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setModeration(null)
    // Le message d'erreur s'affiche tout en bas d'un formulaire long : seul, il
    // dit CE QUI manque, jamais OÙ. On emmène donc l'utilisateur au champ fautif
    // et on y place le curseur — sur un téléphone, c'est la différence entre
    // corriger en deux secondes et abandonner la publication.
    if (images.length < planchePhotos) {
      const manque = planchePhotos - images.length
      return fail(
        planchePhotos >= MIN_PHOTOS
          ? `Ajoutez ${manque === 1 ? 'encore une photo' : `encore ${manque} photos`} : il en faut ${MIN_PHOTOS} au minimum. Montrez l’objet sous plusieurs angles — et ses défauts s’il en a, c’est ce qui inspire confiance.`
          : `Gardez au moins ${planchePhotos} photo${planchePhotos > 1 ? 's' : ''} sur cette annonce.`,
        'pa-photos',
      )
    }
    if (!title.trim()) return fail('Ajoutez un titre à votre annonce.', 'pa-title')
    if (!categoryId) return fail('Choisissez une catégorie.', 'pa-category')
    if (!price.trim()) return fail('Indiquez un prix (0 pour « gratuit »).', 'pa-price')
    if (!loc.regionId) return fail('Indiquez la localisation.', 'pa-location')
    if (!seller.name.trim()) return fail('Indiquez votre nom.', 'pa-seller-name')
    if (!seller.phone.trim()) return fail('Indiquez un numéro de téléphone.', 'pa-seller-phone')

    // Champs de catégorie exigés (ceux qui sont à l'écran). Pour une vente
    // immobilière, cela couvre le dossier foncier au complet.
    for (const f of champsVisibles) {
      if (!f.required) continue
      if (f.type === 'docs') {
        if (!lireDocs(attrs.docs).length) {
          return fail('Cochez le ou les documents de propriété que vous détenez.', `pa-attr-${f.key}`)
        }
        const sansNumero = lireDocs(attrs.docs).filter((id) => DOC_PAR_ID[id].numLabel && !attrs[cleNumero(id)]?.trim())
        if (sansNumero.length) {
          return fail(`Indiquez le numéro : ${DOC_PAR_ID[sansNumero[0]].numLabel.toLowerCase()}.`, `fonc-${sansNumero[0]}`)
        }
        continue
      }
      if (!(attrs[f.key] ?? '').trim()) {
        // Le libellé garde sa casse : « iCloud » passé en minuscules ferait
        // douter de la fiabilité du message lui-même.
        return fail(`Renseignez « ${f.label} ».`, `pa-attr-${f.key}`)
      }
    }
    if (venteFonciere && !engagements.every(Boolean)) {
      return fail('Cochez les trois engagements avant de publier.', 'pa-engagement')
    }

    // Certaines réponses interdisent la publication : un produit qui éclaircit
    // la peau, une bouteille de gaz qui fuit, un recrutement qui réclame des
    // frais au candidat. Le refus est déjà affiché en rouge dans le formulaire,
    // avec ce qu'il faut faire à la place ; on ne fait ici que tenir parole.
    if (sousForm && sousForm.blocages.length) {
      return fail(sousForm.blocages[0], 'pa-blocage')
    }

    // Les champs devenus invisibles (l'offre est passée de Vente à Location, le
    // bien de Maison à Terrain nu…) ne doivent pas partir avec l'annonce : ils
    // s'afficheraient sur la fiche sans que personne ne les ait voulus.
    const clesVisibles = new Set(champsVisibles.map((f) => f.key))
    const couleursCochees = new Set(lireCouleurs(attrs.couleurs).map((c) => c.nom))
    const attrsFinaux: Record<string, string> = {}
    for (const [k, v] of Object.entries(attrs)) {
      if (!v) continue
      if (k === 'engagement') { if (venteFonciere) attrsFinaux[k] = v; continue }
      if (k.startsWith('num_')) { if (venteFonciere && lireDocs(attrs.docs).includes(k.slice(4))) attrsFinaux[k] = v; continue }
      // Variante d'une couleur (photo/prix/détails) : elle ne part qu'avec sa
      // couleur cochée, et seulement si le champ couleurs est à l'écran.
      if (k.startsWith('var_')) {
        // `var_<Couleur>_<champ>` — le champ est `photo`, `prix`, `note`, ou la
        // clé d'un champ déclinable par couleur (les tailles). Le nom de la
        // couleur pouvant lui-même contenir un souligné (« 1B_naturel » n'existe
        // pas, mais rien ne l'interdit), on cherche la couleur cochée qui
        // correspond plutôt que de découper à l'aveugle.
        const nom = [...couleursCochees].find((c) => k.startsWith(`var_${c}_`))
        if (nom && clesVisibles.has('couleurs')) attrsFinaux[k] = v
        continue
      }
      if (clesVisibles.has(k)) attrsFinaux[k] = v
    }

    const emoji = emojiFor(categoryId, subcategory)
    const finalImages =
      images.length > 0 ? images : [placeholderImage(title, emoji, subcategory)]

    // Position précise (GPS) sinon coordonnées approximatives de la commune/ville
    const finalCoords = coords ?? coordsFor(loc.cityId, loc.commune)

    const input: NewListingInput = {
      title: title.trim(),
      description: description.trim() || 'Aucune description fournie.',
      price: Number(price),
      negotiable,
      categoryId,
      subcategory: subcategory || undefined,
      // « État » n'est envoyé que pour les catégories concernées (neutre sinon).
      condition: form.condition ? condition : 'neuf',
      images: finalImages,
      regionId: loc.regionId!,
      cityId: loc.cityId ?? '',
      commune: loc.commune,
      lat: finalCoords?.lat,
      lng: finalCoords?.lng,
      sellerName: seller.name.trim(),
      sellerPhone: seller.phone.trim(),
      delivery: form.delivery ? delivery : false,
      featured: false,
      promoPrice: promoPreview ? promoPreview.price : undefined,
      promoUntil: promoPreview ? Date.now() + Number(promoDays) * 86_400_000 : undefined,
      attributes: Object.keys(attrsFinaux).length ? attrsFinaux : undefined,
    }

    setSubmitting(true)
    try {
      const created = editing && editId
        ? await updateListing(editId, input)
        : await addListing(input)
      // Notification de statut : l'annonce a passé la modération (texte + photos
      // analysées à l'ajout) et est en ligne. Toast immédiat + la cloche est
      // rafraîchie (le serveur y a déposé une notification « Annonce publiée »).
      toast.success(editing ? 'Annonce mise à jour ✅' : 'Votre annonce est en ligne ✅')
      if (!editing) trackPublish() // conversion pixels (Meta/TikTok/Google)
      refreshNotifs()
      navigate(`/annonce/${created.id}`)
    } catch (e) {
      const err = e as Error & { moderation?: ModReason[] }
      if (err.moderation && err.moderation.length) {
        setModeration(err.moderation)
        toast.error('Publication refusée : contenu non autorisé.')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setError(err.message || 'Échec de la publication. Vérifiez votre connexion et réessayez.')
        toast.error('Échec de la publication. Réessayez.')
      }
      setSubmitting(false)
    }
  }

  // Tant que la session se confirme (cookie → /auth/me), on n'affiche ni le gabarit
  // de connexion ni le formulaire : évite un « flash » du mur de connexion pour un
  // utilisateur déjà connecté qui recharge la page.
  if (!user && authLoading) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary-500" />
      </div>
    )
  }

  // Publier / modifier une annonce EXIGE un compte connecté : on n'affiche pas le
  // formulaire aux visiteurs, on les invite à créer un compte ou se connecter
  // (retour automatique ici après authentification).
  // ── Adresse e-mail non confirmée : on ne publie pas encore ────────────────
  //
  // Le mur arrive ICI, sur l'écran de publication, et nulle part ailleurs.
  // Ni à l'inscription, ni pour acheter, ni pour écrire à un vendeur : on ne
  // dresse un obstacle que devant l'action qui engage vraiment. Une annonce est
  // vue de tous, et une adresse jetable est ce qui permet de recommencer
  // indéfiniment après un bannissement.
  //
  // Et il ne dit PAS « accès refusé » : il propose le code, le reçoit et le
  // valide sur place. Renvoyer quelqu'un vers ses réglages au moment précis où
  // il allait publier, c'est le perdre.
  if (user && verifStatus && !verifStatus.emailVerified) {
    return <EmailGate email={user.email} onDone={refreshUser} onCancel={() => navigate(-1)} />
  }

  // Modification ouverte par un lien direct : on attend l'annonce avant de
  // dessiner le formulaire. Un formulaire vide qui se remplit une seconde plus
  // tard fait écraser une annonce par quelqu'un qui a commencé à taper.
  if (editing && loadingListing && !editListing) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[72vh] flex-col items-center justify-center gap-5 px-6 text-center">
        {/* Icône d'INVITATION, pas de restriction. Un cadenas disait « interdit »
            sur l'écran même où l'on veut donner envie de publier — c'est la page
            la plus décisive de la conversion visiteur → vendeur.
            Arbitrage du bureau Design, 27/07. */}
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-100 text-primary-600">
          <UserPlus size={30} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-black text-ink">Connectez-vous pour publier</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
            Créez un compte gratuit ou connectez-vous pour mettre votre annonce en ligne — ça prend moins d’une minute.
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2.5">
          <button
            onClick={() => navigate('/inscription', { state: { from: location.pathname } })}
            className="btn-primary w-full py-3"
          >
            Créer un compte gratuit
          </button>
          <button
            onClick={() => navigate('/connexion', { state: { from: location.pathname } })}
            className="btn-outline w-full py-3"
          >
            J’ai déjà un compte — Se connecter
          </button>
        </div>
        <button onClick={() => navigate(-1)} className="text-sm font-medium text-gray-500">
          Retour
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-28">
      {/* En-tête / hero — grand titre display + sous-titre, comme la maquette. */}
      <header className="mx-auto w-full max-w-2xl px-4 pt-5 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-primary-600"
        >
          <ArrowLeft size={18} /> Retour
        </button>
        <h1 className="font-display text-[26px] font-extrabold leading-tight text-ink md:text-3xl">
          {editing ? 'Modifier l’annonce' : 'Publier une annonce'}
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">
          {editing
            ? 'Mettez à jour les informations de votre annonce.'
            : 'Gratuit · en ligne en 2 minutes'}
        </p>
      </header>

      <form onSubmit={submit} className="mx-auto w-full max-w-2xl px-4 pb-8 pt-5 lg:px-8">
        {/* Refus du Gardien de publication (modération automatique) */}
        {moderation && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="flex items-center gap-2 font-bold text-red-700">
              <ShieldAlert size={18} /> Publication refusée
            </p>
            <p className="mt-1 text-sm text-red-600">
              Votre annonce n’a pas été publiée car elle enfreint nos règles :
            </p>
            <ul className="mt-2.5 space-y-2">
              {moderation.map((r) => (
                <li key={r.code} className="rounded-xl border border-red-100 bg-white/70 p-2.5">
                  <p className="text-sm font-semibold text-red-700">• {r.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-red-600/90">{r.advice}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-gray-600">
              Corrigez votre annonce (titre et description), puis republiez. Pour en savoir plus, consultez nos{' '}
              <a href="#/conditions" className="inline-flex items-center gap-1 font-semibold text-primary-600 underline">
                <BookOpen size={12} /> Conditions d’utilisation
              </a>. Si vous pensez qu’il s’agit d’une erreur, contactez le support.
            </p>
          </div>
        )}

        {/* Formulaire en une seule colonne, comme la maquette (mobile et ordinateur). */}
        <div className="space-y-6">
        {/* ---- Photos, titre, catégorie, état ---- */}
        <div className="space-y-6">
        {/* Photos */}
        <div id="pa-photos">
          <label className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-gray-800">
            Photos
            <span className="font-normal text-gray-400">({images.length}/{MAX_PHOTOS})</span>
            {/* Le compte à rebours plutôt que la règle : « encore 2 photos »
                se lit et s'exécute ; « minimum 3 » se lit et se discute. */}
            {images.length < planchePhotos ? (
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11.5px] font-semibold text-primary-700">
                {planchePhotos - images.length === 1
                  ? 'encore 1 photo'
                  : `encore ${planchePhotos - images.length} photos`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-ivoire-green/10 px-2 py-0.5 text-[11.5px] font-semibold text-ivoire-green-dark">
                <Check size={12} strokeWidth={3} /> c’est bon
              </span>
            )}
          </label>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {images.map((src, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-2xl border border-line bg-cream-100 shadow-card">
                {/* En modification, les photos existantes arrivent en « /uploads/… » :
                    sans mediaUrl, l'application native affiche des cases vides. */}
                <img src={mediaUrl(src)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/75"
                  aria-label="Supprimer la photo"
                >
                  <X size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setEditIndex(i)}
                  className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/55 py-1 text-[11px] font-semibold text-white"
                  aria-label="Modifier la photo"
                >
                  <Wand2 size={12} /> Modifier
                </button>
              </div>
            ))}
            {images.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-line2 bg-cream-100 text-gray-400 transition md:hover:border-primary-300 md:hover:bg-primary-50 md:hover:text-primary-500"
                aria-label="Ajouter des photos"
              >
                <Plus size={26} />
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFiles}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            <b className="font-semibold text-gray-700">{MIN_PHOTOS} photos au minimum</b>, prises par vous.
            L’acheteur qui doit traverser Abidjan veut voir avant de se déplacer : montrez l’objet sous
            plusieurs angles, et ses défauts s’il en a — c’est ce qui inspire confiance, et ce qui évite
            la discussion sur place. La première photo sera la couverture. Touchez{' '}
            <b className="font-semibold text-gray-700">✨ Modifier</b> pour recadrer et embellir.
          </p>
          {/* Là où il n'y a pas de couleur à cocher, on ne laisse pas un vide :
              on dit ce qu'il faut montrer à la place. Un matelas est blanc —
              ce qui compte, c'est l'étiquette et les coins. Sur du bâtiment,
              une photo d'avant/après vaut tous les arguments. */}
          {sousForm && !sousForm.couleurs && sousForm.sansCouleur && (
            <p className="mt-2 rounded-xl border border-line2 bg-cream-100/60 px-3 py-2 text-xs leading-relaxed text-gray-600">
              {sousForm.sansCouleur}
            </p>
          )}
          {checkingPhotos && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Loader2 size={13} className="animate-spin" /> Analyse des photos en cours…
            </p>
          )}
          {photoError && (
            <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              <ShieldAlert size={14} className="mt-0.5 shrink-0" /> {photoError}
            </p>
          )}
          {!photoError && !checkingPhotos && images.length > 0 && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-ivoire-green-dark">
              <ShieldCheck size={12} /> Photos analysées automatiquement (anti-nudité).
            </p>
          )}
        </div>

        {/* Titre */}
        <Field label="Titre de l’annonce" htmlFor="pa-title">
          <input
            id="pa-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={form.titlePlaceholder ?? 'Ex : iPhone 13 Pro 256 Go comme neuf'}
            className="input"
            maxLength={80}
          />
        </Field>

        {/* Catégorie — menu déroulant (façon artifact) */}
        <Field label="Catégorie" htmlFor="pa-category">
          <div className="relative">
            <select
              id="pa-category"
              value={categoryId}
              onChange={(e) => pickCategory(e.target.value)}
              className="input appearance-none pr-10"
            >
              <option value="">Choisir une catégorie…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {CAT_EMOJI[c.id] ? `${CAT_EMOJI[c.id]}  ` : ''}{c.name}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </Field>

        {/* Sous-catégorie — puces selon la catégorie choisie */}
        {cat && (
          <Field label="Sous-catégorie">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSubcategory('')}
                className={`chip ${!subcategory ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
              >
                Toutes
              </button>
              {cat.subcategories.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSubcategory(s); deduireTransaction(s) }}
                  className={`chip ${subcategory === s ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
        )}

        {/* Champs spécifiques à la catégorie (marque, année, surface, taille…).
            Certains ne s'affichent que sous condition : le dossier foncier ne
            concerne que les ventes, les chambres que le bâti. */}
        {categoryId && champsVisibles.map((f) => (
          <div key={f.key} id={`pa-attr-${f.key}`}>
            {f.type === 'docs' ? (
              <Field label={f.label}>
                {f.help && <p className="-mt-1 mb-2 text-xs text-gray-500">{f.help}</p>}
                <FoncierDocs attrs={attrs} setAttr={setAttr} />
              </Field>
            ) : f.type === 'colors' ? (
              // Couleurs + variantes : chaque couleur cochée peut recevoir sa
              // photo (désignée parmi celles de l'annonce), son prix, ses détails.
              // La palette est celle du métier — pour un meuble on ne choisit
              // pas « rouge ou bleu », on choisit l'essence du bois.
              <Field label={f.label}>
                <CouleursVariantes
                  attrs={attrs}
                  setAttr={setAttr}
                  images={images}
                  help={f.help}
                  palette={sousForm?.palette}
                  champsVariante={champsVisibles.filter((c) => c.varOK)}
                  aideChamps={sousForm?.aideCoulChamp}
                />
              </Field>
            ) : (
              <AttrInput field={f} value={attrs[f.key] ?? ''} onChange={(v) => setAttr(f.key, v)} />
            )}
          </div>
        ))}

        {/* Ce que l'acheteur lira en tête de la fiche.
            Une question par sous-catégorie : la carte grise pour une voiture,
            l'IMEI pour un téléphone, les frais demandés pour une offre
            d'emploi. Le vendeur la voit ici telle qu'elle sortira — et
            comprend, avant de publier, ce que sa réponse dit de lui. */}
        {sousForm?.bandeaux.map((b, i) => (
          <div
            key={i}
            className={`flex gap-2.5 rounded-2xl border p-3.5 ${
              b.bon ? 'border-ivoire-green/30 bg-ivoire-green/8' : 'border-red-200 bg-red-50'
            }`}
          >
            {b.bon ? (
              <ShieldCheck size={17} className="mt-px shrink-0 text-ivoire-green-dark" />
            ) : (
              <ShieldAlert size={17} className="mt-px shrink-0 text-red-600" />
            )}
            <div className="min-w-0">
              {i === 0 && (
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Ce que verra l’acheteur
                </p>
              )}
              <p
                className={`mt-0.5 text-[13px] leading-relaxed ${
                  b.bon ? 'text-ivoire-green-dark' : 'text-red-700'
                }`}
              >
                {b.texte}
              </p>
            </div>
          </div>
        ))}

        {/* Engagement du vendeur — vente immobilière uniquement. Les trois cases
            sont bloquantes : sans elles, l'annonce ne part pas. */}
        {venteFonciere && (
          <div id="pa-engagement" className="space-y-3 rounded-2xl border border-line2 bg-cream-100/50 p-4">
            <p className="font-display text-sm font-extrabold text-gray-900">Votre engagement</p>
            <p className="-mt-1.5 text-xs text-gray-500">
              Les trois cases sont obligatoires. Elles ne coûtent rien à un vendeur honnête.
            </p>
            {ENGAGEMENTS.map((t, i) => (
              <label key={i} className="flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-relaxed text-gray-700">
                <input
                  type="checkbox"
                  checked={engagements[i]}
                  onChange={(e) => {
                    const suivant = [...engagements] as [boolean, boolean, boolean]
                    suivant[i] = e.target.checked
                    setEngagements(suivant)
                    setAttr('engagement', suivant.every(Boolean) ? 'oui' : '')
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-primary-500"
                />
                <span>{t}</span>
              </label>
            ))}
            <div className="flex gap-2.5 rounded-xl border border-accent-ocre/30 bg-accent-ocre/8 p-3 text-[12.5px] leading-relaxed text-accent-ocre-dark">
              <ShieldAlert size={16} className="mt-0.5 shrink-0" />
              <p>
                Vendre deux fois le même terrain, ou vendre un bien qui ne vous appartient pas, est une escroquerie.
                Chap.ci supprime l’annonce, ferme le compte et transmet le dossier sur réquisition.
              </p>
            </div>
          </div>
        )}

        {/* État — masqué là où ça n'a pas de sens (emploi, service, immobilier…) */}
        {form.condition && (
          <Field label="État">
            <div className="flex gap-2">
              {(['occasion', 'neuf'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCondition(c)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold capitalize transition active:scale-[0.98] ${
                    condition === c
                      ? 'border-primary-500 bg-primary-500 text-white shadow-[0_6px_16px_-8px_rgba(247,127,0,0.6)]'
                      : 'border-line2 bg-white text-gray-700 hover:bg-cream-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>
        )}

        </div>{/* ---- fin premier groupe ---- */}

        {/* ---- Prix, promo, localisation, livraison, description ---- */}
        <div className="space-y-6">
        {/* Prix — libellé adapté (Salaire, Loyer, Tarif…) */}
        <Field label={form.priceLabel ?? 'Prix'} htmlFor="pa-price">
          <div className="relative">
            <input
              id="pa-price"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
              placeholder={form.pricePlaceholder ?? 'Ex : 150000'}
              className="input pr-16 text-xl font-extrabold tabular-nums"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
              FCFA
            </span>
          </div>
          <label className="mt-2.5 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={negotiable}
              onChange={(e) => setNegotiable(e.target.checked)}
              className="h-4 w-4 accent-primary-500"
            />
            Prix négociable / à débattre
          </label>
        </Field>

        {/* Promotion (facultatif) */}
        <div>
          <label className="flex items-center justify-between rounded-xl border border-line2 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <Tag size={18} className="text-red-500" /> Mettre en promotion
            </span>
            <input
              type="checkbox"
              checked={promoOn}
              onChange={(e) => setPromoOn(e.target.checked)}
              className="h-5 w-5 accent-red-500"
            />
          </label>

          {promoOn && (
            <div className="mt-2 space-y-3 rounded-xl border border-red-100 bg-red-50/60 p-3">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-gray-600">Réduction</p>
                <div className="flex flex-wrap gap-2">
                  {[10, 20, 30, 50].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPromoPct(String(p))}
                      className={`chip text-xs ${promoPct === String(p) ? 'border-red-500 bg-red-500 text-white' : ''}`}
                    >
                      -{p}%
                    </button>
                  ))}
                  <div className="relative">
                    <input
                      inputMode="numeric"
                      value={promoPct}
                      onChange={(e) => setPromoPct(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      placeholder="%"
                      className="input h-9 w-16 py-0 text-center text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold text-gray-600">Durée de la promo</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { d: '1', l: '1 jour' },
                    { d: '3', l: '3 jours' },
                    { d: '7', l: '1 semaine' },
                    { d: '14', l: '2 semaines' },
                    { d: '30', l: '1 mois' },
                  ].map((o) => (
                    <button
                      key={o.d}
                      type="button"
                      onClick={() => setPromoDays(o.d)}
                      className={`chip text-xs ${promoDays === o.d ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              {promoPreview ? (
                <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm">
                  <PromoTag percent={promoPreview.percent} />
                  <span className="flex items-baseline gap-2">
                    <span className="text-base font-black text-red-600">
                      {formatFCFA(promoPreview.price)}
                    </span>
                    <span className="text-xs text-gray-500 line-through">
                      {formatFCFA(priceNum)}
                    </span>
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Indiquez d’abord un prix, puis choisissez une réduction pour voir le nouveau prix.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Localisation — géolocalisée (GPS) et verrouillée */}
        {/* Pas de htmlFor : la localisation se choisit dans un sélecteur, pas dans
            un champ de saisie. L'id sert au défilement en cas d'erreur. */}
        <Field label="Localisation">
          <div id="pa-location" className="flex items-center justify-between rounded-xl border border-line2 bg-cream-100 px-4 py-3">
            <span className="flex min-w-0 items-center gap-2">
              <MapPin size={18} className="shrink-0 text-primary-500" />
              <span className={`truncate text-sm ${loc.regionId ? 'font-medium text-gray-800' : 'text-gray-400'}`}>
                {loc.regionId
                  ? locationLabel(loc.regionId, loc.cityId, loc.commune)
                  : locating
                    ? 'Détection de votre position…'
                    : 'Position non détectée'}
              </span>
            </span>
            <Lock size={15} className="shrink-0 text-gray-400" />
          </div>
          <button
            type="button"
            onClick={detect}
            disabled={locating}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-700 transition active:scale-[0.99] disabled:opacity-60"
          >
            <LocateFixed size={16} />
            {locating ? 'Localisation…' : loc.regionId ? 'Actualiser ma position (GPS)' : 'Activer ma position (GPS)'}
          </button>
          {!loc.regionId && !locating && (
            <button
              type="button"
              onClick={() => setLocOpen(true)}
              className="mt-2 w-full text-center text-xs text-gray-400 underline"
            >
              La détection a échoué ? Choisir manuellement
            </button>
          )}
        </Field>

        {/* Livraison — masquée pour l'immobilier, l'emploi, les services… */}
        {form.delivery && (
          <label className="flex items-center justify-between rounded-xl border border-line2 px-4 py-3">
            <span className="text-sm font-medium text-gray-800">Livraison possible</span>
            <input
              type="checkbox"
              checked={delivery}
              onChange={(e) => setDelivery(e.target.checked)}
              className="h-5 w-5 accent-primary-500"
            />
          </label>
        )}

        {/* Description */}
        <Field label="Description" htmlFor="pa-description">
          <textarea
            id="pa-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez votre article : état, caractéristiques, raison de la vente…"
            rows={5}
            className="input resize-none"
            maxLength={1200}
          />
        </Field>

        </div>{/* ---- fin second groupe ---- */}
        </div>{/* ---- fin colonne unique ---- */}

        {/* ---- Pleine largeur : coordonnées, erreur, bouton ---- */}
        <div className="mt-6 space-y-6">
        {/* Coordonnées */}
        <div className="card p-4">
          <p className="mb-3 text-sm font-bold text-gray-800">Vos coordonnées</p>
          <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
            <div>
              <label htmlFor="pa-seller-name" className="mb-1.5 block text-xs font-semibold text-gray-600">
                Votre nom
              </label>
              <input
                id="pa-seller-name"
                value={seller.name}
                onChange={(e) => setSeller({ ...seller, name: e.target.value })}
                placeholder="Votre nom"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="pa-seller-phone" className="mb-1.5 block text-xs font-semibold text-gray-600">
                Votre téléphone
              </label>
              <input
                id="pa-seller-phone"
                inputMode="tel"
                value={seller.phone}
                onChange={(e) => setSeller({ ...seller, phone: e.target.value })}
                placeholder="Téléphone (ex : +225 07 00 00 00 00)"
                className="input"
              />
            </div>
          </div>
          {/* Réassurance demandée par le bureau Support. Cette phrase n'est vraie
              que depuis le correctif du 26/07 : le numéro sortait auparavant dans
              l'API publique. Ne la réécrire qu'en connaissance de cause. */}
          <p className="mt-2.5 flex items-start gap-1.5 text-xs leading-relaxed text-gray-600">
            <Lock size={13} className="mt-0.5 shrink-0 text-ivoire-green-dark" />
            <span>
              Ce numéro <b>reste privé</b> : il n’apparaît pas sur votre annonce. Les
              acheteurs vous contactent par la messagerie Chap.ci.
            </span>
          </p>
        </div>

        {/* Ce qui interdit de publier — dit avant le bouton, pas après.
            Laisser quelqu'un remplir vingt champs, choisir une mise en avant,
            puis lui refuser l'annonce, c'est le perdre. Et le refus donne
            toujours la marche à suivre : un refus sans issue se contourne. */}
        {sousForm && sousForm.blocages.length > 0 && (
          <div id="pa-blocage" className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4">
            {sousForm.blocages.map((motif, i) => (
              <p key={i} className="flex items-start gap-2.5 text-[13px] font-medium leading-relaxed text-red-700">
                <ShieldAlert size={17} className="mt-px shrink-0" />
                <span>{motif}</span>
              </p>
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || (sousForm ? sousForm.blocages.length > 0 : false)}
          className="btn-primary w-full py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-50 lg:mx-auto lg:flex lg:w-auto lg:min-w-[20rem]"
        >
          <Check size={20} />
          {submitting
            ? 'Enregistrement…'
            : sousForm && sousForm.blocages.length > 0
              ? 'Publication impossible'
              : editing
                ? 'Enregistrer les modifications'
                : 'Publier mon annonce'}
        </button>
        </div>{/* ---- fin pleine largeur ---- */}
      </form>

      <LocationSheet open={locOpen} onClose={() => setLocOpen(false)} value={loc} onApply={setLoc} />

      {editIndex !== null && images[editIndex] && (
        <PhotoEditor
          src={mediaUrl(images[editIndex])}
          onCancel={() => setEditIndex(null)}
          onApply={applyEdited}
        />
      )}
    </div>
  )
}

// `htmlFor` relie le libellé à son champ : le libellé devient cliquable, et un
// lecteur d'écran annonce « Titre de l'annonce » au lieu de « champ de saisie ».
// Il est omis quand le contenu n'est pas un champ de formulaire (la localisation,
// par exemple, est un bouton qui ouvre un sélecteur) : pointer vers un élément
// non saisissable serait pire que ne rien pointer du tout.
function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-bold text-gray-800">{label}</label>
      {children}
    </div>
  )
}

/**
 * L'aide sous un champ — et son ton.
 *
 * La plupart du temps c'est un conseil, en gris : où regarder, quoi vérifier,
 * ce qui fait vendre. Mais la même ligne doit parfois avertir — « sans
 * assurance, un dégât d'eau chez le client est à votre charge », « ce produit
 * ne peut pas être publié ». Elle passe alors en rouge, et se voit. Les
 * schémas le signalent par un `!` en tête, que l'adaptateur retire.
 */
function Aide({ texte, rouge, className = '' }: { texte: string; rouge?: boolean; className?: string }) {
  return (
    <p className={`text-xs leading-relaxed ${rouge ? 'font-medium text-red-700' : 'text-gray-500'} ${className}`}>
      {texte}
    </p>
  )
}

/** Champ d'attribut spécifique à une catégorie (texte / nombre / choix / oui-non). */
function AttrInput({
  field,
  value,
  onChange,
}: {
  field: AttrField
  value: string
  onChange: (v: string) => void
}) {
  // Identifiant unique et stable, généré par React : ces champs dépendent de la
  // catégorie choisie, on ne peut pas les nommer en dur.
  const attrId = useId()
  if (field.type === 'toggle') {
    return (
      <label className="flex items-center justify-between gap-3 rounded-xl border border-line2 px-4 py-3">
        <span className="text-sm font-medium text-gray-800">
          {field.label}
          {field.help && <small className={`mt-0.5 block text-xs font-normal leading-snug ${field.helpRouge ? 'font-medium text-red-700' : 'text-gray-500'}`}>{field.help}</small>}
        </span>
        <input
          type="checkbox"
          checked={value === 'Oui'}
          onChange={(e) => onChange(e.target.checked ? 'Oui' : '')}
          className="h-5 w-5 shrink-0 accent-primary-500"
        />
      </label>
    )
  }
  if (field.type === 'chips' || field.type === 'multi') {
    // Une série de boutons n'est pas un champ de saisie : pas de htmlFor ici.
    const multiple = field.type === 'multi'
    const choisis = multiple ? value.split(',').map((s) => s.trim()).filter(Boolean) : []
    const actif = (o: string) => (multiple ? choisis.includes(o) : value === o)
    const basculer = (o: string) => {
      if (!multiple) return onChange(value === o ? '' : o)
      onChange((choisis.includes(o) ? choisis.filter((x) => x !== o) : [...choisis, o]).join(', '))
    }
    return (
      <Field label={multiple ? `${field.label} · plusieurs choix possibles` : field.label}>
        {field.help && <Aide texte={field.help} rouge={field.helpRouge} className="-mt-1 mb-2" />}
        <div className="flex flex-wrap gap-2">
          {field.options?.map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={actif(o)}
              onClick={() => basculer(o)}
              className={`chip ${actif(o) ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
            >
              {o}
            </button>
          ))}
        </div>
      </Field>
    )
  }
  // text / number
  return (
    <Field label={field.label} htmlFor={attrId}>
      <div className="relative">
        <input
          id={attrId}
          value={value}
          inputMode={field.type === 'number' ? 'numeric' : 'text'}
          onChange={(e) =>
            onChange(field.type === 'number' ? e.target.value.replace(/\D/g, '') : e.target.value)
          }
          placeholder={field.placeholder}
          className="input"
          maxLength={80}
        />
        {field.unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            {field.unit}
          </span>
        )}
      </div>
      {field.help && <Aide texte={field.help} rouge={field.helpRouge} className="mt-1.5" />}
    </Field>
  )
}


/**
 * Mur de confirmation de l'adresse — sur l'écran de publication uniquement.
 *
 * Il ne renvoie personne ailleurs : le code se demande, se saisit et se valide
 * ici. Quelqu'un qui s'apprêtait à publier et qu'on expédie dans ses réglages
 * ne revient pas.
 */
function EmailGate({ email, onDone, onCancel }: { email: string; onDone: () => Promise<void>; onCancel: () => void }) {
  const toast = useToast()
  const [envoye, setEnvoye] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  async function envoyer() {
    setBusy(true)
    try { await sendEmailCode(); setEnvoye(true); toast.success('Code envoyé.') }
    catch (e) { toast.error((e as Error).message) }
    finally { setBusy(false) }
  }
  async function confirmer() {
    setBusy(true)
    try {
      await confirmEmailCode(code)
      toast.success('Adresse confirmée. À vous de publier 🎉')
      await onDone()
    } catch (e) { toast.error((e as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <div className="flex min-h-[72vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-100 text-primary-600">
        <MailCheck size={30} />
      </div>
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Confirmez votre adresse</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
          Une dernière étape avant de publier. Nous envoyons un code à 6 chiffres à{' '}
          <b className="text-gray-700">{email}</b> — il protège votre compte et rassure vos acheteurs.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2.5">
        {!envoye ? (
          <button onClick={envoyer} disabled={busy} className="btn-primary w-full py-3">
            {busy ? 'Envoi…' : 'Recevoir mon code'}
          </button>
        ) : (
          <>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6 chiffres"
              className="input tnum text-center text-2xl font-bold tracking-[0.4em]"
            />
            <button onClick={confirmer} disabled={busy || code.length !== 6} className="btn-primary w-full py-3 disabled:opacity-50">
              {busy ? 'Vérification…' : 'Confirmer et publier'}
            </button>
            <button onClick={envoyer} disabled={busy} className="text-xs font-semibold text-gray-500 underline">
              Je n’ai rien reçu — renvoyer un code
            </button>
          </>
        )}
      </div>
      <p className="max-w-xs text-[12px] leading-relaxed text-gray-400">
        Le code est valable 15 minutes. Pensez à regarder vos indésirables.
      </p>
      <button onClick={onCancel} className="text-sm font-medium text-gray-500">Retour</button>
    </div>
  )
}
