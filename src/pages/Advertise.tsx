import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera, X, Minus, Plus, Loader2, Megaphone, ArrowRight, CheckCircle2, Copy, Check,
} from 'lucide-react'
import { fetchAdTariff, submitAd, AD_FALLBACK_TARIFF, AD_FORMULES, AD_GAP_DEFAULT, type AdTariff, type AdStyle } from '../lib/ads'
import { donationOperators } from '../data/donation'
import { downscaleListingImage } from '../lib/image'
import { classifyImage } from '../lib/nsfw'
import { formatFCFA } from '../lib/format'
import { AdImageFill } from '../components/AdImageFill'
import { AnimatedAdText } from '../components/AnimatedAdText'
import { AdTextControls } from '../components/AdTextControls'
import { PayLogo } from '../components/PayLogo'

const MAX_IMAGES = 3

type Formule = 'day' | 'week' | 'month'

/** Étape numérotée (pastille orange « 1 · 2 · 3 » de la maquette). */
function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2.5 font-display text-[15px] font-extrabold text-ink">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-500 font-display text-sm font-extrabold text-white">
        {n}
      </span>
      {children}
    </p>
  )
}

export function Advertise() {
  const [tariff, setTariff] = useState<AdTariff>(AD_FALLBACK_TARIFF)
  const [images, setImages] = useState<string[]>([])
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [formule, setFormule] = useState<Formule>('week')
  const [qty, setQty] = useState(1)
  const [payMethod, setPayMethod] = useState(donationOperators[0].id)
  const [payNumber, setPayNumber] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  // Réglages du texte animé (mêmes options que le compositeur admin).
  const [style, setStyle] = useState<AdStyle>('classique')
  const [anims, setAnims] = useState<string[]>(['fondu'])
  const [gap, setGap] = useState(AD_GAP_DEFAULT)
  const [loop, setLoop] = useState(true)
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [website, setWebsite] = useState('') // pot de miel anti-robot
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ id: string; price: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    fetchAdTariff().then((t) => { if (mounted.current) setTariff(t) }).catch(() => {})
    return () => { mounted.current = false }
  }, [])

  const unit = tariff.prices[formule]
  const total = unit * qty
  const formuleDef = AD_FORMULES.find((f) => f.key === formule)!
  const op = donationOperators.find((o) => o.id === payMethod) ?? donationOperators[0]
  // Économies vs tarif journalier (comme la maquette : −29 % semaine, −50 % mois).
  const savings = (f: Formule) => {
    const days = f === 'week' ? 7 : f === 'month' ? 30 : 1
    const full = tariff.prices.day * days
    return f === 'day' ? null : Math.round((1 - tariff.prices[f] / full) * 100)
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    const room = MAX_IMAGES - images.length
    if (room <= 0) return
    setPhotoError('')
    setPhotoBusy(true)
    const added: string[] = []
    let blocked = 0
    for (const file of files.slice(0, room)) {
      let uri: string | null = null
      try {
        uri = await downscaleListingImage(file, 1600, 0.82)
      } catch { uri = null }
      if (!uri) continue
      const verdict = await classifyImage(uri)
      if (!mounted.current) return
      if (verdict.blocked) { blocked++; continue }
      added.push(uri)
    }
    if (!mounted.current) return
    if (blocked > 0) setPhotoError(`${blocked} image${blocked > 1 ? 's' : ''} refusée${blocked > 1 ? 's' : ''} (contenu inapproprié).`)
    setImages((prev) => [...prev, ...added].slice(0, MAX_IMAGES))
    setPhotoBusy(false)
  }

  async function submit() {
    setError('')
    if (images.length === 0) return setError('Ajoutez au moins un visuel pour votre bannière.')
    // Le titre est FACULTATIF : on peut publier une bannière « image seule ».
    if (link.trim() !== '' && !/^https?:\/\//i.test(link.trim()))
      return setError('Le lien doit commencer par https:// (ou laissez-le vide).')
    if (payNumber.replace(/\D/g, '').length < 8)
      return setError('Indiquez le numéro Mobile Money qui a effectué le paiement.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError('Indiquez un e-mail valide pour recevoir le statut de votre publicité.')
    setBusy(true)
    try {
      const r = await submitAd({
        title: title.trim(),
        description: description.trim(),
        link: link.trim(),
        images,
        formule,
        qty,
        payMethod,
        payNumber: payNumber.trim(),
        email: email.trim(),
        phone: phone.trim(),
        style,
        anims: anims.length ? anims : ['fondu'],
        gap,
        loop,
        textColor,
        website,
      })
      setDone({ id: r.id, price: r.price })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const preview = useMemo(() => ({
    img: images[0] ?? null,
    title: title.trim() || 'Votre titre ici',
    desc: description.trim() || 'Votre description apparaîtra ici…',
    textEmpty: !title.trim() && !description.trim(),
  }), [images, title, description])

  // ---- Écran de confirmation (après envoi) ---------------------------------
  if (done) {
    const plain = op.number.replace(/\s/g, '')
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6 md:px-6">
        <div className="rounded-2xl border border-ivoire-green/30 bg-ivoire-green/5 p-6 text-center md:p-8">
          <CheckCircle2 className="mx-auto text-ivoire-green" size={46} />
          <h1 className="mt-3 font-display text-xl font-extrabold text-ink">Demande enregistrée !</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-600">
            Pour activer votre publicité, envoyez <b className="tnum">{formatFCFA(done.price)}</b> par{' '}
            <b>{op.name}</b> au numéro Chap.ci ci-dessous. Elle s’affichera sur l’écran publicitaire
            de l’accueil <b>après validation</b> (sous 24 h ouvrées).
          </p>
          <div className="mx-auto mt-4 flex max-w-sm items-center gap-3 rounded-xl border border-[#E6DAC6] bg-white px-4 py-3.5">
            <span className="flex-1 text-left font-mono text-[15px] font-semibold tracking-tight text-gray-800">{op.number}</span>
            <button
              onClick={async () => {
                try { await navigator.clipboard.writeText(plain) } catch { /* presse-papier bloqué */ }
                setCopied(true)
                setTimeout(() => setCopied(false), 1800)
              }}
              className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 active:scale-95"
            >
              {copied ? <><Check size={14} className="text-ivoire-green" /> Copié</> : <><Copy size={14} /> Copier</>}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">{op.howTo}</p>
          <p className="mt-4 text-xs text-gray-400">Référence de votre demande : <b className="font-mono">{done.id.slice(0, 8).toUpperCase()}</b></p>
          <Link to="/" className="btn-primary mt-5 inline-flex">Retour à l’accueil</Link>
        </div>
      </div>
    )
  }

  // ---- Formulaire ----------------------------------------------------------
  return (
    <div className="min-h-screen pb-16">
      {/* Héro « info-hero » */}
      <section className="bg-[linear-gradient(160deg,#FFF6EC,#FFFDF9)] px-5 py-9 text-center md:-mx-6 md:py-12">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink md:text-[34px]">
          Faire de la publicité sur Chap.ci
        </h1>
        <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-relaxed text-[#57534E] md:mt-3">
          Créez votre bannière, choisissez la durée, payez par Mobile Money. Après validation, elle
          s’affiche sur l’écran publicitaire de la page d’accueil. <b>Aucun compte requis.</b>
        </p>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-7 md:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-6">
        {/* Colonne formulaire */}
        <div className="space-y-4">
          {/* 1 · Visuel & message */}
          <section className="rounded-2xl border border-[#EFE6D7] bg-white p-4 shadow-card md:p-5">
            <StepTitle n={1}>Visuel &amp; message</StepTitle>

            <p className="mb-1.5 mt-4 text-sm font-semibold text-gray-700">Photos de la bannière</p>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
            <div className="flex flex-wrap gap-2.5">
              {images.map((img, i) => (
                <div key={i} className="relative h-20 w-32 overflow-hidden rounded-xl border border-[#EFE6D7]">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    aria-label="Retirer cette image"
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={photoBusy}
                  className="flex h-20 w-32 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#E6DAC6] text-gray-400 transition hover:border-primary-300 hover:text-primary-500 disabled:opacity-60"
                >
                  {photoBusy ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                  <span className="text-[11px] font-semibold">Ajouter</span>
                </button>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">1 à 3 images · format paysage (16:5) recommandé</p>
            {photoError && <p className="mt-1 text-xs font-medium text-red-500">{photoError}</p>}

            <label htmlFor="ad-title" className="mb-1.5 mt-4 block text-sm font-semibold text-gray-700">
              Titre de la pub <span className="font-normal text-gray-400">(facultatif)</span>
            </label>
            <input
              id="ad-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Ex : Auto Ivoire — voitures garanties"
              className="input"
            />
            <p className="mt-1 text-[11px] text-gray-400">Laissez vide pour afficher <b>uniquement votre image</b>, sans texte par-dessus.</p>

            <label htmlFor="ad-desc" className="mb-1.5 mt-4 block text-sm font-semibold text-gray-700">Description</label>
            <textarea
              id="ad-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={600}
              placeholder="Décrivez votre offre. Ce texte est lu sur la page de la pub."
              className="input min-h-[90px] resize-y leading-relaxed"
            />
            <p className="mt-1 text-[11px] text-gray-400">Visible sur la page de détail (si pas de lien).</p>

            <label htmlFor="ad-link" className="mb-1.5 mt-4 block text-sm font-semibold text-gray-700">Lien (optionnel)</label>
            <input
              id="ad-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              maxLength={300}
              placeholder="https://votre-site.ci ou WhatsApp"
              inputMode="url"
              className="input"
            />
            <p className="mt-1.5 rounded-lg bg-[#FFF6EC] px-3 py-2 text-[11.5px] leading-relaxed text-gray-500">
              💡 Avec un lien, le clic ouvre votre site. Sans lien, le clic ouvre votre page sur Chap.ci.
            </p>

            {/* Style & animation du texte — mêmes options que le compositeur Chap.ci. */}
            <div className="mt-4 border-t border-[#EFE6D7] pt-3">
              <p className="text-sm font-semibold text-gray-700">Style &amp; animation du titre</p>
              <p className="mb-1 text-[11.5px] text-gray-400">S’applique au titre affiché sur l’écran (si vous en mettez un).</p>
              <AdTextControls
                style={style} setStyle={setStyle}
                anims={anims} setAnims={setAnims}
                gap={gap} setGap={setGap}
                loop={loop} setLoop={setLoop}
                textColor={textColor} setTextColor={setTextColor}
              />
            </div>
          </section>

          {/* 2 · Durée d'affichage */}
          <section className="rounded-2xl border border-[#EFE6D7] bg-white p-4 shadow-card md:p-5">
            <StepTitle n={2}>Durée d’affichage</StepTitle>

            {tariff.member ? (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[12.5px] font-semibold text-emerald-700">
                ✓ Tarif membre actif appliqué : −50 % (merci de faire vivre Chap.ci !)
              </p>
            ) : (
              <p className="mt-3 rounded-lg bg-[#FFF6EC] px-3 py-2 text-[11.5px] leading-relaxed text-gray-500">
                💡 Les membres actifs (compte d’au moins 1 mois + une annonce active) paient{' '}
                <b>moitié prix</b> : {formatFCFA(1000)} la semaine au lieu de {formatFCFA(2000)}.
              </p>
            )}

            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {AD_FORMULES.map((f) => {
                const on = formule === f.key
                const eco = savings(f.key)
                return (
                  <button
                    key={f.key}
                    onClick={() => { setFormule(f.key); setQty(1) }}
                    aria-pressed={on}
                    className={`relative rounded-xl border-[1.5px] px-2 py-3.5 text-center transition ${
                      on ? 'border-primary-500 bg-[#FFF6EC]' : 'border-[#E6DAC6] bg-white hover:bg-[#FFFBF4]'
                    }`}
                  >
                    {eco != null && eco > 0 && (
                      <span className="absolute -top-2 right-2 rounded-full bg-ivoire-green px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                        −{eco}%
                      </span>
                    )}
                    <span className="block text-[12px] font-semibold text-gray-500">{f.label}</span>
                    <span className={`tnum mt-1 block font-display text-lg font-extrabold ${on ? 'text-primary-700' : 'text-ink'}`}>
                      {formatFCFA(tariff.prices[f.key]).replace(/ FCFA$/, '')}
                    </span>
                    <span className="block text-[10.5px] text-gray-400">FCFA / {f.unit}</span>
                  </button>
                )
              })}
            </div>

            <p className="mb-1.5 mt-4 text-sm font-semibold text-gray-700">
              Combien de {formuleDef.unitPlural} ?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                aria-label="Diminuer"
                className="grid h-10 w-10 place-items-center rounded-xl border border-[#E6DAC6] bg-white text-gray-600 transition active:scale-95"
              >
                <Minus size={16} />
              </button>
              <span className="tnum w-10 text-center font-display text-xl font-extrabold text-ink">{qty}</span>
              <button
                onClick={() => setQty((n) => Math.min(31, n + 1))}
                aria-label="Augmenter"
                className="grid h-10 w-10 place-items-center rounded-xl border border-[#E6DAC6] bg-white text-gray-600 transition active:scale-95"
              >
                <Plus size={16} />
              </button>
              <span className="ml-1 text-sm text-gray-500">
                soit <b className="tnum text-ink">{formatFCFA(total)}</b>
              </span>
            </div>
          </section>

          {/* 3 · Paiement */}
          <section className="rounded-2xl border border-[#EFE6D7] bg-white p-4 shadow-card md:p-5">
            <StepTitle n={3}>Paiement</StepTitle>

            {/* Consigne : combien payer et où l'envoyer (Orange Money ou Wave). */}
            <div className="mt-3 rounded-xl border border-[#F4D9B0] bg-[#FFF6EC] p-3">
              <p className="text-sm text-gray-700">
                Envoyez <b className="tnum text-ink">{formatFCFA(total)}</b> par <b>Orange Money</b> ou <b>Wave</b> au numéro Chap.ci :
              </p>
              <button
                type="button"
                onClick={() => { navigator.clipboard?.writeText('0759901120'); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
                className="mt-2 flex w-full items-center justify-between gap-2 rounded-lg border border-[#E6DAC6] bg-white px-3 py-2.5 text-left transition active:scale-[0.99]"
              >
                <span className="tnum font-display text-lg font-extrabold text-ink">07 59 90 11 20</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600">
                  {copied ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier</>}
                </span>
              </button>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                Après votre versement, indiquez ci-dessous <b>votre numéro</b> (celui qui a payé) : il nous sert à
                retrouver votre paiement et valider la pub.
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {donationOperators.map((o) => {
                const on = payMethod === o.id
                return (
                  <button
                    key={o.id}
                    onClick={() => setPayMethod(o.id)}
                    aria-pressed={on}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-3 transition ${
                      on ? 'border-primary-500 bg-[#FFF6EC]' : 'border-[#E6DAC6] bg-white hover:bg-[#FFFBF4]'
                    }`}
                  >
                    <PayLogo id={o.id} className="h-6 w-6" />
                    <span className="text-[13px] font-extrabold text-gray-700">{o.name}</span>
                  </button>
                )
              })}
            </div>
            <label htmlFor="ad-paynum" className="mb-1.5 mt-4 block text-sm font-semibold text-gray-700">
              Votre numéro (celui qui a payé)
            </label>
            <input
              id="ad-paynum"
              value={payNumber}
              onChange={(e) => setPayNumber(e.target.value.replace(/[^\d+ ]/g, ''))}
              inputMode="tel"
              maxLength={20}
              placeholder="Ex : 07 00 00 00 00"
              className="input"
            />

            <label htmlFor="ad-email" className="mb-1.5 mt-4 block text-sm font-semibold text-gray-700">
              Votre e-mail <span className="font-normal text-gray-400">(pour le statut de la pub)</span>
            </label>
            <input
              id="ad-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              maxLength={190}
              placeholder="vous@exemple.com"
              className="input"
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">
              Vous recevrez par e-mail : la réception, la validation, et un rappel avant l'expiration (pour renouveler).
            </p>

            <label htmlFor="ad-phone" className="mb-1.5 mt-4 block text-sm font-semibold text-gray-700">
              Téléphone <span className="font-normal text-gray-400">(facultatif)</span>
            </label>
            <input
              id="ad-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, ''))}
              inputMode="tel"
              maxLength={20}
              placeholder="Ex : 07 00 00 00 00"
              className="input"
            />
          </section>
        </div>

        {/* Colonne aperçu + récapitulatif (collante sur grand écran) */}
        <div className="mt-4 space-y-4 lg:sticky lg:top-20 lg:mt-0">
          {/* Aperçu de la bannière — mini écran noir en direct */}
          <section className="rounded-2xl border border-[#EFE6D7] bg-white p-4 shadow-card">
            <p className="flex items-center justify-between font-display text-[15px] font-extrabold text-ink">
              Aperçu de la bannière
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-500">
                ● en direct
              </span>
            </p>
            <div className="relative mt-3 flex min-h-[150px] flex-col justify-end overflow-hidden rounded-2xl bg-black text-white">
              {preview.img && <AdImageFill src={preview.img} />}
              {preview.textEmpty && preview.img ? (
                /* Image seule : rendu réel (juste l'image + repère discret) */
                <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-white/85 backdrop-blur">
                  <Megaphone size={10} /> Publicité
                </span>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/20" />
                  <div className="relative flex flex-col items-center gap-1.5 p-3.5 text-center [text-shadow:0_2px_10px_rgba(0,0,0,.55)]">
                    <AnimatedAdText
                      text={preview.title}
                      style={style}
                      color={textColor}
                      anims={anims.length ? anims : ['fondu']}
                      gapMs={gap * 1000}
                      loop={loop}
                      className="text-[17px] font-extrabold leading-tight"
                    />
                    <p className="text-[12px] font-semibold leading-snug [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden" style={{ color: textColor || 'rgba(255,255,255,0.85)' }}>
                      {preview.desc}
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-bold text-ink">
                      En savoir plus <ArrowRight size={13} />
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Récapitulatif */}
          <section className="rounded-2xl border border-[#EFE6D7] bg-white p-4 shadow-card">
            <p className="font-display text-[15px] font-extrabold text-ink">Récapitulatif</p>
            <dl className="mt-2 divide-y divide-[#F3EADB] text-sm">
              <div className="flex justify-between py-2"><dt className="text-gray-500">Formule</dt><dd className="font-semibold text-gray-800">{formuleDef.label}</dd></div>
              <div className="flex justify-between py-2"><dt className="text-gray-500">Prix unitaire</dt><dd className="tnum font-semibold text-gray-800">{formatFCFA(unit)}</dd></div>
              <div className="flex justify-between py-2"><dt className="text-gray-500">Durée</dt><dd className="font-semibold text-gray-800">{qty} {qty > 1 ? formuleDef.unitPlural : formuleDef.unit}</dd></div>
              <div className="flex justify-between py-2"><dt className="text-gray-500">Paiement</dt><dd className="font-semibold text-gray-800">{op.name}</dd></div>
              <div className="flex justify-between py-2.5"><dt className="font-bold text-ink">Total à payer</dt><dd className="tnum font-display text-lg font-extrabold text-primary-700">{formatFCFA(total)}</dd></div>
            </dl>

            {/* Pot de miel : champ caché hors écran */}
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

            <button onClick={submit} disabled={busy} className="btn-primary mt-3 w-full py-3.5 text-[15px]">
              {busy ? <Loader2 size={20} className="animate-spin" /> : <>💳 Payer {formatFCFA(total)} et publier</>}
            </button>
            <p className="mt-2 text-center text-[11px] leading-relaxed text-gray-400">
              Paiement par Mobile Money au numéro Chap.ci (affiché après l’envoi). Votre bannière
              s’affiche après validation, sous 24 h ouvrées.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
