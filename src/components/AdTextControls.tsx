import { AD_STYLES, AD_ANIMS, AD_GAP_MIN, AD_GAP_MAX, type AdStyle } from '../lib/ads'

/**
 * Réglages du TEXTE animé d'une publicité, partagés par le compositeur admin et
 * la page publique « Faire de la publicité » : style d'écriture, animations
 * enchaînées (parmi 50), pause entre animations, boucle, couleur du texte.
 */
export function AdTextControls({
  style, setStyle,
  anims, setAnims,
  gap, setGap,
  loop, setLoop,
  textColor, setTextColor,
}: {
  style: AdStyle; setStyle: (v: AdStyle) => void
  anims: string[]; setAnims: (v: string[]) => void
  gap: number; setGap: (v: number) => void
  loop: boolean; setLoop: (v: boolean) => void
  textColor: string; setTextColor: (v: string) => void
}) {
  return (
    <>
      <label className="mt-2 block">
        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Style d’écriture</span>
        <select value={style} onChange={(e) => setStyle(e.target.value as AdStyle)} className="input">
          {AD_STYLES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </label>

      {/* Animations du texte : une OU PLUSIEURS (50 dispo), enchaînées. */}
      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
            Animations du texte · {anims.length} choisie{anims.length > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2 text-[11px] font-semibold">
            <button type="button" onClick={() => setAnims(AD_ANIMS.map((a) => a.key))} className="text-primary-600">Tout</button>
            <button type="button" onClick={() => setAnims(['fondu'])} className="text-gray-500">Réinitialiser</button>
          </div>
        </div>
        <div className="flex max-h-40 flex-wrap content-start gap-1.5 overflow-y-auto rounded-xl border border-line2 bg-white p-2">
          {AD_ANIMS.map((a) => {
            const on = anims.includes(a.key)
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => setAnims(on ? anims.filter((k) => k !== a.key) : [...anims, a.key])}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${on ? 'bg-primary-500 text-white shadow-sm' : 'bg-cream-100 text-ink hover:bg-cream-200'}`}
              >
                {a.label}
              </button>
            )
          })}
        </div>
        <p className="mt-1 text-[11px] text-gray-400">
          Plusieurs animations = le texte change d’animation à chaque fois.
        </p>
      </div>

      {/* Pause entre deux animations : de 5 s à 1 min. */}
      <label className="mt-2 flex items-center gap-3 rounded-xl border border-line2 bg-white px-3 py-2.5">
        <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-gray-400">Pause entre animations</span>
        <input
          type="range"
          min={AD_GAP_MIN}
          max={AD_GAP_MAX}
          step={1}
          value={gap}
          onChange={(e) => setGap(Number(e.target.value))}
          className="flex-1 accent-primary-500"
          aria-label="Pause entre animations (secondes)"
        />
        <span className="tnum w-12 text-right text-sm font-bold text-ink">{gap} s</span>
      </label>

      {/* Enchaîner en boucle, ou jouer une seule fois. */}
      <label className="mt-2 flex cursor-pointer items-center gap-2.5 rounded-xl border border-line2 bg-white px-3 py-2.5">
        <input
          type="checkbox"
          checked={loop}
          onChange={(e) => setLoop(e.target.checked)}
          className="h-4 w-4 accent-primary-500"
        />
        <span className="text-[13px] font-semibold text-ink">
          Enchaîner en boucle
          <span className="ml-1 font-normal text-gray-400">— rejoue les animations avec la pause ci-dessus (sinon, une seule fois)</span>
        </span>
      </label>

      {/* Couleur du texte : pour rester lisible par-dessus l'image. */}
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-line2 bg-white px-3 py-2.5">
        <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-gray-400">Couleur du texte</span>
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {['#FFFFFF', '#000000', '#F77F00', '#009E60', '#FFD400', '#E4002B'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setTextColor(c)}
              aria-label={`Couleur ${c}`}
              className={`h-6 w-6 rounded-full border transition ${textColor.toUpperCase() === c ? 'ring-2 ring-primary-500 ring-offset-1' : 'border-black/10'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-black/10" title="Couleur personnalisée">
            <span className="absolute inset-0" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} />
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(textColor) ? textColor : '#FFFFFF'}
              onChange={(e) => setTextColor(e.target.value.toUpperCase())}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>
        <span className="tnum text-[11px] font-semibold text-gray-500">{textColor}</span>
      </div>
    </>
  )
}
