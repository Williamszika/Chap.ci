import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, X, MapPin, Check } from 'lucide-react'
import { useApp, type NewListingInput } from '../store/AppContext'
import { useGeo } from '../store/GeoContext'
import { categories, categoryById } from '../data/categories'
import { CategoryIcon } from '../components/CategoryIcon'
import { LocationSheet } from '../components/LocationSheet'
import { locationLabel } from '../data/locations'
import { placeholderImage, emojiFor } from '../lib/placeholder'
import { useLocalStorage } from '../lib/useLocalStorage'
import { coordsFor, type Coords } from '../data/coords'
import type { LocationFilter } from '../types'

const MAX_PHOTOS = 5

export function PostAd() {
  const navigate = useNavigate()
  const { addListing } = useApp()
  const { place } = useGeo()
  const fileRef = useRef<HTMLInputElement>(null)

  const [images, setImages] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [condition, setCondition] = useState<'neuf' | 'occasion'>('occasion')
  const [price, setPrice] = useState('')
  const [negotiable, setNegotiable] = useState(false)
  const [delivery, setDelivery] = useState(false)
  const [description, setDescription] = useState('')
  const [loc, setLoc] = useState<LocationFilter>({})
  const [locOpen, setLocOpen] = useState(false)
  const [coords, setCoords] = useState<Coords | null>(null)
  const [seller, setSeller] = useLocalStorage('chapci.seller.v1', { name: '', phone: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
  const gpsDetected = coords != null && place?.source === 'gps'

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const room = MAX_PHOTOS - images.length
    files.slice(0, room).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => (prev.length < MAX_PHOTOS ? [...prev, reader.result as string] : prev))
        }
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
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
      condition,
      images: finalImages,
      regionId: loc.regionId!,
      cityId: loc.cityId ?? '',
      commune: loc.commune,
      lat: finalCoords?.lat,
      lng: finalCoords?.lng,
      sellerName: seller.name.trim(),
      sellerPhone: seller.phone.trim(),
      delivery,
      featured: false,
    }

    setSubmitting(true)
    try {
      const created = await addListing(input)
      navigate(`/annonce/${created.id}`)
    } catch {
      setError("Échec de la publication. Vérifiez votre connexion et réessayez.")
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">Publier une annonce</h1>
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
                  onClick={() => {
                    setCategoryId(c.id)
                    setSubcategory('')
                  }}
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

        {/* État */}
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

        {/* Prix */}
        <Field label="Prix (FCFA)">
          <input
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
            placeholder="Ex : 150000"
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

        {/* Localisation (pré-remplie depuis votre position) */}
        <Field label="Localisation">
          <button
            type="button"
            onClick={() => setLocOpen(true)}
            className="input flex items-center justify-between text-left"
          >
            <span className={loc.regionId ? 'text-gray-800' : 'text-gray-400'}>
              {loc.regionId ? locationLabel(loc.regionId, loc.cityId, loc.commune) : 'Choisir la région / ville / commune'}
            </span>
            <MapPin size={18} className="text-gray-400" />
          </button>
          {gpsDetected && (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-600">
              <Check size={13} /> Position détectée automatiquement
            </p>
          )}
        </Field>

        {/* Livraison */}
        <label className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
          <span className="text-sm font-medium text-gray-800">Livraison possible</span>
          <input
            type="checkbox"
            checked={delivery}
            onChange={(e) => setDelivery(e.target.checked)}
            className="h-5 w-5 accent-primary-500"
          />
        </label>

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
          <Check size={20} /> {submitting ? 'Publication…' : 'Publier mon annonce'}
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
