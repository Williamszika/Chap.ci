import { useCallback, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import {
  X, Check, Crop as CropIcon, SlidersHorizontal, Sparkles, RotateCw, FlipHorizontal2,
  Wand2, Loader2, Palette, Scissors,
} from 'lucide-react'
import { getEditedImage } from '../lib/cropImage'

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('Lecture impossible'))
    r.readAsDataURL(blob)
  })
}

type Tab = 'crop' | 'adjust' | 'filter' | 'bg'

// Fonds « studio » : la photo est posée sur une couleur unie (sans détourage).
const BACKGROUNDS: { label: string; value: string | null }[] = [
  { label: 'Aucun', value: null },
  { label: 'Blanc', value: '#FFFFFF' },
  { label: 'Gris', value: '#F1F1F4' },
  { label: 'Beige', value: '#F3ECE0' },
  { label: 'Bleu', value: '#E4F0FB' },
  { label: 'Vert', value: '#E7F4EA' },
  { label: 'Rose', value: '#FBE9EF' },
  { label: 'Orange', value: '#FDEEDC' },
  { label: 'Noir', value: '#141414' },
]

// Amélioration auto (« ✨ Améliorer ») — rendu vif / punchy façon catalogue.
const ENHANCE = { b: 1.07, c: 1.2, s: 1.4, extra: '' }
const RESET = { b: 1, c: 1, s: 1, extra: '' }

const PRESETS: { id: string; label: string; b: number; c: number; s: number; extra: string }[] = [
  { id: 'orig', label: 'Original', b: 1, c: 1, s: 1, extra: '' },
  { id: 'vif', label: 'Éclatant', b: 1.05, c: 1.18, s: 1.5, extra: '' },
  { id: 'chaud', label: 'Chaud', b: 1.04, c: 1.08, s: 1.2, extra: 'sepia(0.28)' },
  { id: 'froid', label: 'Froid', b: 1.03, c: 1.08, s: 1.12, extra: 'hue-rotate(-12deg)' },
  { id: 'nb', label: 'N&B', b: 1.05, c: 1.15, s: 1, extra: 'grayscale(1)' },
  { id: 'doux', label: 'Doux', b: 1.06, c: 0.92, s: 0.9, extra: '' },
]

const ASPECTS: { label: string; value: number | 'orig' }[] = [
  { label: 'Original', value: 'orig' },
  { label: 'Carré', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: 'Portrait', value: 3 / 4 },
]

export function PhotoEditor({
  src,
  onCancel,
  onApply,
}: {
  src: string
  onCancel: () => void
  onApply: (dataUri: string) => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0) // pas de 90°
  const [tilt, setTilt] = useState(0) // redressement fin -15..15
  const [flipH, setFlipH] = useState(false)
  const [aspectSel, setAspectSel] = useState<number | 'orig'>('orig')
  const [naturalAspect, setNaturalAspect] = useState(3 / 4)
  const [bg, setBg] = useState<string | null>(null) // fond studio
  const [restrict, setRestrict] = useState(true) // false pour laisser une marge de fond
  const [minZoom, setMinZoom] = useState(1)
  const [cutout, setCutout] = useState<string | null>(null) // photo détourée (fond transparent)
  const [removing, setRemoving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [aiError, setAiError] = useState<string | null>(null)

  // Image de travail : la version détourée si le décor a été enlevé, sinon l'originale.
  const workingSrc = cutout ?? src

  const [b, setB] = useState(1)
  const [c, setC] = useState(1)
  const [s, setS] = useState(1)
  const [extra, setExtra] = useState('')

  const [tab, setTab] = useState<Tab>('crop')
  const [pixels, setPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  const filter = `brightness(${b}) contrast(${c}) saturate(${s}) ${extra}`.trim()
  const aspect = aspectSel === 'orig' ? naturalAspect : aspectSel

  const onCropComplete = useCallback((_: Area, px: Area) => setPixels(px), [])

  function applyPreset(p: { b: number; c: number; s: number; extra: string }) {
    setB(p.b); setC(p.c); setS(p.s); setExtra(p.extra)
  }

  // Choix d'un fond : « Aucun » revient à l'original (et annule le détourage).
  function chooseBg(color: string | null) {
    if (color === null) {
      setCutout(null)
      setBg(null)
      setAiError(null)
      setRestrict(true)
      setMinZoom(1)
      setZoom((z) => Math.max(1, z))
      setCrop({ x: 0, y: 0 })
      return
    }
    setBg(color)
    if (cutout) {
      // Décor enlevé : le produit est déjà isolé, cadrage normal sur la couleur.
      setRestrict(true)
      setMinZoom(1)
    } else {
      // Cadre coloré simple : on dézoome pour créer une marge autour de la photo.
      setRestrict(false)
      setMinZoom(0.4)
      setZoom((z) => (z > 0.95 ? 0.82 : z))
    }
  }

  // Détourage IA : enlève le décor et pose le produit sur un fond de couleur.
  // Charge le modèle à la demande (télécharge ~une fois). Ne casse jamais l'éditeur.
  async function removeDecor() {
    if (removing) return
    setRemoving(true)
    setAiError(null)
    setProgress(0)
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      const blob = await removeBackground(src, {
        model: 'isnet_fp16',
        output: { format: 'image/png' },
        progress: (_key: string, cur: number, total: number) => {
          if (total > 0) setProgress(Math.min(100, Math.round((cur / total) * 100)))
        },
      })
      const uri = await blobToDataURL(blob)
      setCutout(uri)
      setBg((prev) => prev ?? '#FFFFFF')
      setRestrict(true)
      setMinZoom(1)
      setZoom(1)
      setCrop({ x: 0, y: 0 })
    } catch {
      setAiError('Détourage impossible (connexion instable ou photo trop complexe). Réessayez, ou choisissez un fond simple.')
    } finally {
      setRemoving(false)
    }
  }

  async function apply() {
    if (!pixels) return
    setBusy(true)
    try {
      const out = await getEditedImage(workingSrc, pixels, rotation + tilt, { horizontal: flipH, vertical: false }, filter, 1280, 0.85, bg)
      onApply(out)
    } catch {
      onApply(src) // repli : on garde la photo d'origine
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black text-white">
      {/* Barre du haut */}
      <div className="safe-top flex items-center justify-between px-3 py-3">
        <button onClick={onCancel} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-white/90 active:scale-95">
          <X size={20} /> Annuler
        </button>
        <span className="text-sm font-semibold text-white/70">Modifier la photo</span>
        <button onClick={apply} disabled={busy || !pixels} className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-bold text-white active:scale-95 disabled:opacity-50">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Appliquer
        </button>
      </div>

      {/* Zone de recadrage */}
      <div className="relative flex-1">
        <Cropper
          image={workingSrc}
          crop={crop}
          zoom={zoom}
          minZoom={minZoom}
          maxZoom={4}
          restrictPosition={restrict}
          rotation={rotation + tilt}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          onMediaLoaded={(m) => setNaturalAspect(m.naturalWidth / m.naturalHeight)}
          objectFit="contain"
          showGrid={tab === 'crop'}
          style={{ mediaStyle: { filter }, containerStyle: { background: bg ?? '#000' } }}
        />
      </div>

      {/* Bouton « Améliorer » / Réinitialiser */}
      <div className="flex items-center justify-center gap-2 px-4 py-2.5">
        <button
          onClick={() => applyPreset(ENHANCE)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-500 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg active:scale-95"
        >
          <Sparkles size={17} /> Améliorer
        </button>
        <button
          onClick={() => { applyPreset(RESET); setRotation(0); setTilt(0); setFlipH(false); setZoom(1); chooseBg(null) }}
          className="rounded-full border border-white/25 px-4 py-2.5 text-sm font-semibold text-white/80 active:scale-95"
        >
          Réinitialiser
        </button>
      </div>

      {/* Contrôles de l'onglet actif */}
      <div className="px-4 pb-1">
        {tab === 'crop' && (
          <div className="space-y-3">
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {ASPECTS.map((a) => (
                <button
                  key={String(a.value)}
                  onClick={() => setAspectSel(a.value)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${aspectSel === a.value ? 'bg-white text-black' : 'bg-white/10 text-white/80'}`}
                >
                  {a.label}
                </button>
              ))}
              <button onClick={() => setRotation((r) => (r + 90) % 360)} className="shrink-0 rounded-full bg-white/10 p-2.5 text-white/80 active:scale-95" aria-label="Pivoter">
                <RotateCw size={18} />
              </button>
              <button onClick={() => setFlipH((f) => !f)} className={`shrink-0 rounded-full p-2.5 active:scale-95 ${flipH ? 'bg-white text-black' : 'bg-white/10 text-white/80'}`} aria-label="Retourner">
                <FlipHorizontal2 size={18} />
              </button>
            </div>
            <Slider label="Redresser" value={tilt} min={-15} max={15} step={1} onChange={setTilt} suffix="°" />
            <Slider label="Zoom" value={zoom} min={minZoom} max={4} step={0.01} onChange={setZoom} />
          </div>
        )}

        {tab === 'bg' && (
          <div className="space-y-2.5 pt-1">
            <button
              onClick={removeDecor}
              disabled={removing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/12 py-2.5 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
            >
              {removing ? (
                <><Loader2 size={16} className="animate-spin" /> Détourage… {progress}%</>
              ) : (
                <><Scissors size={16} /> {cutout ? 'Refaire le détourage' : 'Enlever le décor (IA)'}</>
              )}
            </button>
            {aiError ? (
              <p className="text-[11px] leading-snug text-red-300">{aiError}</p>
            ) : cutout ? (
              <p className="text-[11px] text-emerald-300/90">✓ Décor enlevé — choisissez la couleur du fond ci-dessous.</p>
            ) : (
              <p className="text-[11px] leading-snug text-white/50">
                « Enlever le décor » isole le produit sur un vrai fond de couleur (télécharge un modèle la 1ʳᵉ fois).
                Sinon, choisissez une couleur : la photo sera posée dessus (dézoomez pour la marge).
              </p>
            )}
            <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
              {BACKGROUNDS.map((bgc) => (
                <button key={bgc.label} onClick={() => chooseBg(bgc.value)} className="flex shrink-0 flex-col items-center gap-1.5">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-xl border-2 ${bg === bgc.value ? 'border-primary-400' : 'border-white/15'}`}
                    style={{ background: bgc.value ?? 'repeating-conic-gradient(#666 0% 25%, #444 0% 50%) 50% / 12px 12px' }}
                  >
                    {bgc.value === null && <X size={16} className="text-white/70" />}
                  </span>
                  <span className="text-[11px] font-semibold text-white/80">{bgc.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'adjust' && (
          <div className="space-y-3 pt-1">
            <Slider label="Luminosité" value={b} min={0.5} max={1.5} step={0.01} onChange={setB} pct />
            <Slider label="Contraste" value={c} min={0.5} max={1.5} step={0.01} onChange={setC} pct />
            <Slider label="Saturation" value={s} min={0} max={2} step={0.01} onChange={setS} pct />
          </div>
        )}

        {tab === 'filter' && (
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1 pt-1">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className="flex shrink-0 flex-col items-center gap-1.5"
              >
                <span
                  className="h-14 w-14 rounded-xl border-2 bg-gradient-to-br from-amber-200 via-orange-300 to-rose-300"
                  style={{ filter: `brightness(${p.b}) contrast(${p.c}) saturate(${p.s}) ${p.extra}`, borderColor: b === p.b && c === p.c && s === p.s && extra === p.extra ? '#fff' : 'transparent' }}
                />
                <span className="text-[11px] font-semibold text-white/80">{p.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Onglets */}
      <div className="safe-bottom grid grid-cols-4 border-t border-white/10">
        <TabBtn active={tab === 'crop'} onClick={() => setTab('crop')} icon={<CropIcon size={19} />} label="Recadrer" />
        <TabBtn active={tab === 'adjust'} onClick={() => setTab('adjust')} icon={<SlidersHorizontal size={19} />} label="Ajuster" />
        <TabBtn active={tab === 'filter'} onClick={() => setTab('filter')} icon={<Wand2 size={19} />} label="Filtres" />
        <TabBtn active={tab === 'bg'} onClick={() => setTab('bg')} icon={<Palette size={19} />} label="Fond" />
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 py-3 text-[11px] font-semibold ${active ? 'text-primary-400' : 'text-white/60'}`}>
      {icon}
      {label}
    </button>
  )
}

function Slider({ label, value, min, max, step, onChange, suffix, pct }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; suffix?: string; pct?: boolean
}) {
  const display = pct ? `${Math.round(value * 100)}%` : suffix ? `${value}${suffix}` : value.toFixed(2)
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12px] font-medium text-white/70">
        <span>{label}</span>
        <span className="tabular-nums text-white/50">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-primary-500"
      />
    </div>
  )
}
