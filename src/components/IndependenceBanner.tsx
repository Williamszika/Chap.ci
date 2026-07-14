import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import {
  festiveMode, daysToFete, isFestiveDismissed, dismissFestive, onFestiveHide, FESTIVE_COLORS,
} from '../lib/festive'

/**
 * Bandeau festif « Fête de l'Indépendance » 🇨🇮 (7 août), en haut de l'accueil.
 * L'ambiance sur TOUT le site (confettis / feux) est gérée par <FestiveOverlay/>.
 */
const OR = '#F77F00', OR2 = '#FF9A2E', VERT = '#009E60', VERT2 = '#00B86B', GOLD2 = '#FFD34E', WHITE = '#FFFFFF'

export function IndependenceBanner() {
  const mode = useMemo(festiveMode, [])
  const [hidden, setHidden] = useState(() => (mode ? isFestiveDismissed(mode) : false))
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => onFestiveHide(() => setHidden(true)), [])

  useEffect(() => {
    if (!mode || hidden) return
    const canvas = canvasRef.current
    if (!canvas) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let w = 0, h = 0
    const fit = () => {
      const r = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.max(1, r.width * dpr)
      canvas.height = Math.max(1, r.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      w = r.width; h = r.height
    }
    fit()
    window.addEventListener('resize', fit)

    if (mode === 'day') {
      // --- Confettis ---
      const N = Math.min(80, Math.round(w / 7))
      const spawn = (init: boolean) => ({
        x: Math.random() * w, y: init ? Math.random() * h : -12 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 0.6, vy: 1 + Math.random() * 1.7,
        wd: 5 + Math.random() * 5, ht: 7 + Math.random() * 6,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.2,
        c: FESTIVE_COLORS[(Math.random() * FESTIVE_COLORS.length) | 0],
      })
      const P = Array.from({ length: N }, () => spawn(true))
      const draw = () => {
        ctx.clearRect(0, 0, w, h)
        for (let i = 0; i < P.length; i++) {
          const p = P[i]
          p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vx += Math.sin(p.y * 0.02) * 0.02
          if (p.y > h + 14) P[i] = spawn(false)
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot)
          ctx.globalAlpha = 0.92; ctx.fillStyle = p.c
          ctx.fillRect(-p.wd / 2, -p.ht / 2, p.wd, p.ht); ctx.restore()
        }
        raf = requestAnimationFrame(draw)
      }
      if (reduce) draw(); else draw()
      if (reduce) cancelAnimationFrame(raf)
    } else {
      // --- Feux d'artifice ---
      type Part = { x: number; y: number; vx: number; vy: number; life: number; c: string }
      type Shell = { x: number; y: number; vy: number; ty: number }
      const parts: Part[] = []; const shells: Shell[] = []
      let t = 0
      const burst = (x: number, y: number) => {
        const col = FESTIVE_COLORS[(Math.random() * FESTIVE_COLORS.length) | 0]; const n = 40
        for (let i = 0; i < n; i++) {
          const a = (i / n) * 6.283, sp = 1.2 + Math.random() * 2.3
          parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, c: col })
        }
      }
      const draw = () => {
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = 'rgba(10,14,42,0.22)'; ctx.fillRect(0, 0, w, h)
        ctx.globalCompositeOperation = 'lighter'
        if (t % 40 === 0) shells.push({ x: w * (0.2 + Math.random() * 0.6), y: h, vy: -(4 + Math.random() * 2), ty: h * (0.22 + Math.random() * 0.28) })
        for (let i = shells.length - 1; i >= 0; i--) {
          const s = shells[i]; s.y += s.vy; s.vy += 0.03
          ctx.globalAlpha = 0.9; ctx.fillStyle = '#ffe9b0'
          ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, 6.28); ctx.fill()
          if (s.vy >= -0.6 || s.y <= s.ty) { burst(s.x, s.y); shells.splice(i, 1) }
        }
        for (let j = parts.length - 1; j >= 0; j--) {
          const p = parts[j]; p.x += p.vx; p.y += p.vy; p.vy += 0.035; p.vx *= 0.985; p.vy *= 0.985; p.life -= 0.012
          if (p.life <= 0) { parts.splice(j, 1); continue }
          ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.1, 0, 6.28); ctx.fill()
        }
        t++; raf = requestAnimationFrame(draw)
      }
      if (reduce) { burst(w * 0.3, h * 0.4); burst(w * 0.7, h * 0.5); ctx.globalCompositeOperation = 'lighter'; parts.forEach((p) => { ctx.globalAlpha = 0.9; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x + p.vx * 10, p.y + p.vy * 10, 2.2, 0, 6.28); ctx.fill() }) }
      else draw()
    }
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', fit) }
  }, [mode, hidden])

  if (!mode || hidden) return null

  const close = () => {
    setHidden(true)
    dismissFestive(mode) // coupe aussi l'ambiance sur tout le site
  }
  const days = daysToFete()
  const isDay = mode === 'day'

  const bg = isDay
    ? `radial-gradient(120% 90% at 12% 8%, rgba(255,255,255,.45), transparent 55%), linear-gradient(115deg, ${OR} 0%, ${OR2} 34%, ${WHITE} 50%, ${VERT2} 66%, ${VERT} 100%)`
    : `radial-gradient(120% 130% at 50% -10%, #232a66 0%, #141a4d 40%, #0A0E2A 100%)`

  return (
    <div
      className="relative mt-3 overflow-hidden rounded-3xl shadow-card lg:mt-4"
      style={{ background: bg }}
      role="img"
      aria-label={isDay ? 'Bonne fête de l’indépendance de la Côte d’Ivoire' : 'Feux d’artifice pour la fête nationale de la Côte d’Ivoire'}
    >
      {isDay && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.13]"
          style={{ background: `repeating-linear-gradient(115deg, ${OR} 0 60px, ${WHITE} 60px 120px, ${VERT} 120px 180px)` }}
        />
      )}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

      <button
        onClick={close}
        aria-label="Masquer"
        className={`absolute right-2.5 top-2.5 z-10 grid h-7 w-7 place-items-center rounded-full ${
          isDay ? 'bg-black/15 text-black/70 hover:bg-black/25' : 'bg-white/15 text-white/80 hover:bg-white/25'
        }`}
      >
        <X size={15} />
      </button>

      <div className="relative z-[2] px-5 py-6 sm:px-8 sm:py-8">
        <span
          className="text-[11px] font-extrabold uppercase tracking-[0.16em]"
          style={{ color: isDay ? '#0b6b45' : GOLD2 }}
        >
          {isDay ? '🇨🇮 7 août 1960 — 2026 · Fête nationale' : '✨ Bonne fête, Côte d’Ivoire'}
        </span>

        <p className="mt-1.5 font-black leading-[0.92] tracking-tight">
          <span
            className="block text-[clamp(2.6rem,11vw,4.5rem)]"
            style={
              isDay
                ? { color: '#fff', textShadow: '0 3px 0 rgba(180,80,0,.25),0 10px 24px rgba(0,0,0,.18)' }
                : {
                    backgroundImage: `linear-gradient(100deg, ${OR2}, ${GOLD2} 45%, #fff 55%, ${VERT2})`,
                    WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                    filter: 'drop-shadow(0 4px 16px rgba(246,179,1,.4))',
                  }
            }
          >
            66 ans
          </span>
          <span
            className="block text-[clamp(1rem,3.6vw,1.5rem)] font-extrabold"
            style={{ color: '#fff', textShadow: isDay ? '0 2px 10px rgba(0,80,45,.35)' : 'none' }}
          >
            d’indépendance
          </span>
        </p>

        <p
          className="mt-2 max-w-[42ch] text-[15px] font-semibold sm:text-base"
          style={{ color: isDay ? '#2a2110' : '#c9d0f5' }}
        >
          {isDay
            ? <>Chap.ci célèbre la <b>Terre d’Espérance</b>. Fier d’être 100 % ivoirien.</>
            : <>« Terre d’espérance, pays de l’hospitalité. » Ce soir, on illumine le ciel ivoirien 🎆</>}
        </p>

        <div className="mt-2 flex items-center gap-3">
          <span className="text-lg tracking-[0.15em]">🧡 🤍 💚</span>
          {isDay && days > 0 && (
            <span className="rounded-full bg-black/15 px-3 py-1 text-xs font-bold text-black/75">
              {days === 1 ? 'Demain, la fête !' : `Plus que ${days} jours`}
            </span>
          )}
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-[-0.4rem] right-2 z-[2] text-[clamp(3.5rem,15vw,7rem)] sm:right-6"
        style={{ filter: isDay ? 'drop-shadow(0 8px 14px rgba(0,0,0,.22))' : 'drop-shadow(0 0 22px rgba(246,179,1,.5))' }}
      >
        🐘
      </div>
    </div>
  )
}
