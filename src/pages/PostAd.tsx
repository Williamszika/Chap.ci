import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Plus, X, MapPin, Check, Lock, LocateFixed, Tag, Wand2, ShieldAlert, ShieldCheck, BookOpen, Loader2 } from 'lucide-react'
import { useApp, type NewListingInput } from '../store/AppContext'
import type { Listing } from '../types'
import { useGeo } from '../store/GeoContext'
import { useToast } from '../store/ToastContext'
import { useNotifications } from '../store/NotificationsContext'
import { categories, categoryById } from '../data/categories'
import { formFor, type AttrField } from '../data/categoryForms'
import { CategoryIcon } from '../components/CategoryIcon'
import { PromoTag } from '../components/PromoTag'
import { LocationSheet } from '../components/LocationSheet'
import { formatFCFA } from '../lib/format'
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

/** Raison de refus renvoyée par le Gardien de publication (modération). */
type ModReason = { code: string; label: string; advice: string }

export function PostAd() {
  const navigate = useNavigate()
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
  const editListing =
    ((location.state as { listing?: Listing } | null)?.listing) ?? (editId ? getListing(editId) : undefined)

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
    setCondition(l.condition === 'neuf' ? 'neuf' : 'occasion')
    setPrice(String(l.price ?? ''))
    setNegotiable(!!l.negotiable)
    setDelivery(!!l.delivery)
    setDescription(l.description === 'Aucune description fournie.' ? '' : (l.description ?? ''))
    setLoc({ regionId: l.regionId, cityId: l.cityId, commune: l.commune ?? undefined })
    if (l.lat != null && l.lng != null) setCoords({ lat: l.lat, lng: l.lng })
    if (l.sellerName || l.sellerPhone) setSeller({ name: l.sellerName ?? '', phone: l.sellerPhone ?? '' })
    // Promotion en cours : on rétablit le pourcentage.
    if (l.promoPrice && l.price > 0) {
      setPromoOn(true)
      setPromoPct(String(Math.round((1 - l.promoPrice / l.price) * 100)))
    }
  }, [editing, editListing, setSeller])

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

  const cat = categoryById(categoryId)
  const form = formFor(categoryId) // champs adaptés à la catégorie

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
    // Une seule photo ajoutée : on ouvre directement l'éditeur pour l'embellir.
    if (added.length === 1) setEditIndex(startIndex)
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
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

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setModeration(null)
    if (!title.trim()) return setError('Ajoutez un titre à votre annonce.')
    if (!categoryId) return setError('Choisissez une catégorie.')
    if (!price.trim()) return setError('Indiquez un prix (0 pour « gratuit »).')
    if (!loc.regionId) return setError('Indiquez la localisation.')
    if (!seller.name.trim()) return setError('Indiquez votre nom.')
    if (!seller.phone.trim()) return setError('Indiquez un numéro de téléphone.')

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
      attributes: Object.keys(attrs).length ? attrs : undefined,
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

  return (
    <div className="min-h-screen pb-28">
      {/* En-tête / hero — grand titre display + sous-titre, comme la maquette. */}
      <header className="mx-auto w-full max-w-3xl px-4 pt-5 lg:px-8">
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

      <form onSubmit={submit} className="mx-auto w-full max-w-3xl px-4 pb-8 pt-5 lg:px-8">
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
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-800">
            Photos <span className="font-normal text-gray-400">({images.length}/{MAX_PHOTOS})</span>
          </label>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {images.map((src, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-2xl border border-[#EFE6D7] bg-cream-100 shadow-card">
                <img src={src} alt="" className="h-full w-full object-cover" />
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
                className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-[#E6DAC6] bg-cream-100 text-gray-400 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-500"
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
          <p className="mt-1.5 text-xs text-gray-400">
            Touchez <b className="font-semibold text-gray-500">✨ Modifier</b> pour recadrer et embellir une photo.
            La première sera la couverture. Sans photo, une image sera générée.
          </p>
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
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-600">
              <ShieldCheck size={12} /> Photos analysées automatiquement (anti-nudité).
            </p>
          )}
        </div>

        {/* Titre */}
        <Field label="Titre de l’annonce">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : iPhone 13 Pro 256 Go comme neuf"
            className="input"
            maxLength={80}
          />
        </Field>

        {/* Catégorie — sélecteur visuel */}
        <Field label="Catégorie">
          <div className="grid grid-cols-2 gap-2">
            {categories.map((c) => {
              const active = categoryId === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCategory(c.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition active:scale-[0.98] ${
                    active ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-[#E6DAC6] text-gray-700'
                  }`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${c.color}`}>
                    <CategoryIcon name={c.icon} size={16} />
                  </span>
                  <span className="truncate">{c.name}</span>
                </button>
              )
            })}
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
                  onClick={() => setSubcategory(s)}
                  className={`chip ${subcategory === s ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
        )}

        {/* Champs spécifiques à la catégorie (marque, année, surface, taille…) */}
        {categoryId && form.fields.map((f) => (
          <AttrInput key={f.key} field={f} value={attrs[f.key] ?? ''} onChange={(v) => setAttr(f.key, v)} />
        ))}

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
                      : 'border-[#E6DAC6] bg-white text-gray-700 hover:bg-cream-100'
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
        <Field label={form.priceLabel ?? 'Prix (FCFA)'}>
          <div className="relative">
            <input
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
          <label className="flex items-center justify-between rounded-xl border border-[#E6DAC6] px-4 py-3">
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
                    <span className="text-xs text-gray-400 line-through">
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
        <Field label="Localisation">
          <div className="flex items-center justify-between rounded-xl border border-[#E6DAC6] bg-cream-100 px-4 py-3">
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
          <label className="flex items-center justify-between rounded-xl border border-[#E6DAC6] px-4 py-3">
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
        <Field label="Description">
          <textarea
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
            <input
              value={seller.name}
              onChange={(e) => setSeller({ ...seller, name: e.target.value })}
              placeholder="Votre nom"
              className="input"
            />
            <input
              inputMode="tel"
              value={seller.phone}
              onChange={(e) => setSeller({ ...seller, phone: e.target.value })}
              placeholder="Téléphone (ex : +225 07 00 00 00 00)"
              className="input"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 text-base lg:mx-auto lg:flex lg:w-auto lg:min-w-[20rem]">
          <Check size={20} /> {submitting ? 'Enregistrement…' : editing ? 'Enregistrer les modifications' : 'Publier mon annonce'}
        </button>
        </div>{/* ---- fin pleine largeur ---- */}
      </form>

      <LocationSheet open={locOpen} onClose={() => setLocOpen(false)} value={loc} onApply={setLoc} />

      {editIndex !== null && images[editIndex] && (
        <PhotoEditor
          src={images[editIndex]}
          onCancel={() => setEditIndex(null)}
          onApply={applyEdited}
        />
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">{label}</label>
      {children}
    </div>
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
  if (field.type === 'toggle') {
    return (
      <label className="flex items-center justify-between rounded-xl border border-[#E6DAC6] px-4 py-3">
        <span className="text-sm font-medium text-gray-800">{field.label}</span>
        <input
          type="checkbox"
          checked={value === 'Oui'}
          onChange={(e) => onChange(e.target.checked ? 'Oui' : '')}
          className="h-5 w-5 accent-primary-500"
        />
      </label>
    )
  }
  if (field.type === 'chips') {
    return (
      <Field label={field.label}>
        <div className="flex flex-wrap gap-2">
          {field.options?.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onChange(value === o ? '' : o)}
              className={`chip ${value === o ? 'border-primary-500 bg-primary-500 text-white' : ''}`}
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
    <Field label={field.label}>
      <div className="relative">
        <input
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
    </Field>
  )
}
