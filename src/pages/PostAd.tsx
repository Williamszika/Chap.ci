import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Camera, X, MapPin, Check, Lock, LocateFixed, Tag } from 'lucide-react'
import { useApp, type NewListingInput } from '../store/AppContext'
import { updateListingRemote } from '../lib/api'
import type { Listing } from '../types'
import { useGeo } from '../store/GeoContext'
import { categories, categoryById } from '../data/categories'
import { formFor, type AttrField } from '../data/categoryForms'
import { CategoryIcon } from '../components/CategoryIcon'
import { PromoTag } from '../components/PromoTag'
import { LocationSheet } from '../components/LocationSheet'
import { formatPrice } from '../lib/format'
import { locationLabel, resolveLocationByName } from '../data/locations'
import { placeholderImage, emojiFor } from '../lib/placeholder'
import { downscaleListingImage } from '../lib/image'
import { useLocalStorage } from '../lib/useLocalStorage'
import { getBestPosition, reverseGeocode } from '../lib/geo'
import { coordsFor, type Coords } from '../data/coords'
import type { LocationFilter } from '../types'

const MAX_PHOTOS = 5

export function PostAd() {
  const navigate = useNavigate()
  const { addListing, getListing } = useApp()
  const { place } = useGeo()
  const fileRef = useRef<HTMLInputElement>(null)

  // Mode édition : /modifier/:id — l'annonce est passée via l'état de navigation
  // (ou retrouvée dans la liste). On préremplit alors le formulaire.
  const { id: editId } = useParams()
  const location = useLocation()
  const editing = !!editId
  const editListing =
    ((location.state as { listing?: Listing } | null)?.listing) ?? (editId ? getListing(editId) : undefined)

  const [images, setImages] = useState<string[]>([])
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
    for (const file of files.slice(0, room)) {
      try {
        const dataUri = await downscaleListingImage(file)
        setImages((prev) => (prev.length < MAX_PHOTOS ? [...prev, dataUri] : prev))
      } catch {
        // Repli : si la compression échoue, on lit le fichier tel quel.
        const raw = await new Promise<string | null>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
          reader.onerror = () => resolve(null)
          reader.readAsDataURL(file)
        })
        if (raw) setImages((prev) => (prev.length < MAX_PHOTOS ? [...prev, raw] : prev))
      }
    }
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
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
      alert(
        'Impossible d’obtenir votre position. Autorisez la localisation dans votre navigateur, puis réessayez.',
      )
    } finally {
      setLocating(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
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
        ? await updateListingRemote(editId, input)
        : await addListing(input)
      navigate(`/annonce/${created.id}`)
    } catch {
      setError("Échec de la publication. Vérifiez votre connexion et réessayez.")
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white pb-28 lg:mx-auto lg:my-6 lg:min-h-0 lg:max-w-2xl lg:rounded-3xl lg:shadow-card">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-3 lg:rounded-t-3xl">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">{editing ? 'Modifier l’annonce' : 'Publier une annonce'}</h1>
      </header>

      <form onSubmit={submit} className="space-y-6 px-4 py-5">
        {/* Photos */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-800">
            Photos <span className="font-normal text-gray-400">({images.length}/{MAX_PHOTOS})</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                  aria-label="Supprimer la photo"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            {images.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400"
              >
                <Camera size={24} />
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
            La première photo sera la couverture. Sans photo, une image sera générée.
          </p>
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
                    active ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-700'
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
                  className={`chip flex-1 justify-center capitalize ${
                    condition === c ? 'border-primary-500 bg-primary-500 text-white' : ''
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>
        )}

        {/* Prix — libellé adapté (Salaire, Loyer, Tarif…) */}
        <Field label={form.priceLabel ?? 'Prix (FCFA)'}>
          <input
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
            placeholder={form.pricePlaceholder ?? 'Ex : 150000'}
            className="input"
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
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
          <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
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
                      {formatPrice(promoPreview.price)} FCFA
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      {formatPrice(priceNum)} FCFA
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
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
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
          <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
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

        {/* Coordonnées */}
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="mb-3 text-sm font-bold text-gray-800">Vos coordonnées</p>
          <div className="space-y-3">
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

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 text-base">
          <Check size={20} /> {submitting ? 'Enregistrement…' : editing ? 'Enregistrer les modifications' : 'Publier mon annonce'}
        </button>
      </form>

      <LocationSheet open={locOpen} onClose={() => setLocOpen(false)} value={loc} onApply={setLoc} />
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
      <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
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
