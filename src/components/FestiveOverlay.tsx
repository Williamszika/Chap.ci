import { useEffect, useMemo, useRef, useState } from 'react'
import {
  festiveMode, isFestiveDismissed, onFestiveHide, prefersReducedMotion,
  FESTIVE_COLORS, FIREWORK_COLORS,
} from '../lib/festive'

/**
 * Ambiance festive sur TOUT le site pendant la fête de l'indépendance 🇨🇮.
 *  - « day »   : confettis aux couleurs du drapeau qui flottent sur tout l'écran.
 *  - « night » : feux d'artifice qui éclatent partout sur l'écran.
 * Calque plein écran, fixe, non cliquable (pointer-events:none), sous les barres
 * de navigation et les fenêtres. Se coupe si l'on masque le bandeau, respecte
 * « réduire les animations ». Test : ?fete=a / ?fete=b / ?fete=0.
 */
export function FestiveOverlay() {
  const mode = useMemo(festiveMode, [])
  const [hidden, setHidden] = useState(() => (mode ? isFestiveDismissed(mode) : false))
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => onFestiveHide(() => setHidden(true)), [])

  useEffect(() => {
    if (!mode || hidden || prefersReducedMotion()) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0, w = 0, h = 0
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = window.innerWidth; h = window.innerHeight
      canvas.width = Math.max(1, w * dpr); canvas.height = Math.max(1, h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit()
    window.addEventListener('resize', fit)

    if (mode === 'day') {
      // Confettis qui flottent doucement sur tout l'écran.
      //
      // DENSITÉ RELEVÉE LE 05/08. Mesuré sur un téléphone de 390 px : les
      // confettis ne peignaient que 5 ‰ de l'écran, contre 26,8 ‰ pour les feux
      // d'artifice du soir. Cinq fois moins — d'où « l'animation ne se fait pas
      // sur téléphone » : elle tournait, on ne la voyait pas. Un écran de
      // téléphone reçoit maintenant une trentaine de confettis au lieu d'une
      // douzaine, un peu plus grands ; un grand écran reste plafonné pour ne
      // pas transformer la fête en tempête.
      const N = Math.min(110, Math.max(34, Math.round((w * h) / 11000)))
      const spawn = (init: boolean) => ({
        x: Math.random() * w, y: init ? Math.random() * h : -14,
        vx: (Math.random() - 0.5) * 0.4, vy: 0.5 + Math.random() * 1.1,
        wd: 7 + Math.random() * 7, ht: 9 + Math.random() * 8,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.12,
        sway: Math.random() * 6.28,
        c: FESTIVE_COLORS[(Math.random() * FESTIVE_COLORS.length) | 0],
      })
      const P = Array.from({ length: N }, () => spawn(true))
      const draw = () => {
        ctx.clearRect(0, 0, w, h)
        for (let i = 0; i < P.length; i++) {
          const p = P[i]
          p.sway += 0.02
          p.x += p.vx + Math.sin(p.sway) * 0.5
          p.y += p.vy
          p.rot += p.vr
          if (p.y > h + 16) P[i] = spawn(false)
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot)
          ctx.globalAlpha = 0.72; ctx.fillStyle = p.c
          ctx.fillRect(-p.wd / 2, -p.ht / 2, p.wd, p.ht); ctx.restore()
        }
        raf = requestAnimationFrame(draw)
      }
      draw()
    } else {
      // Feux d'artifice partout — SANS voile sombre (le site reste clair) :
      // on efface chaque image et les particules s'estompent via leur « life ».
      type Part = { x: number; y: number; vx: number; vy: number; life: number; c: string }
      type Shell = { x: number; y: number; vy: number; ty: number }
      const parts: Part[] = []; const shells: Shell[] = []
      let t = 0
      const burst = (x: number, y: number) => {
        const col = FIREWORK_COLORS[(Math.random() * FIREWORK_COLORS.length) | 0]
        const n = 42 + ((Math.random() * 16) | 0)
        for (let i = 0; i < n; i++) {
          const a = (i / n) * 6.283 + Math.random() * 0.1, sp = 1.6 + Math.random() * 3.1
          parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, c: col })
        }
      }
      const draw = () => {
        ctx.clearRect(0, 0, w, h)
        // Fusées fréquentes, réparties sur toute la largeur (parfois 2 à la fois).
        if (t % 24 === 0) {
          const shots = Math.random() < 0.35 ? 2 : 1
          for (let k = 0; k < shots; k++) shells.push({ x: w * (0.08 + Math.random() * 0.84), y: h * 0.98, vy: -(5.5 + Math.random() * 3), ty: h * (0.1 + Math.random() * 0.42) })
        }
        for (let i = shells.length - 1; i >= 0; i--) {
          const s = shells[i]; s.y += s.vy; s.vy += 0.04
          ctx.globalAlpha = 0.9; ctx.fillStyle = '#C2410C'
          ctx.beginPath(); ctx.arc(s.x, s.y, 2.2, 0, 6.28); ctx.fill()
          if (s.vy >= -0.7 || s.y <= s.ty) { burst(s.x, s.y); shells.splice(i, 1) }
        }
        for (let j = parts.length - 1; j >= 0; j--) {
          const p = parts[j]
          p.x += p.vx; p.y += p.vy; p.vy += 0.032; p.vx *= 0.988; p.vy *= 0.988; p.life -= 0.011
          if (p.life <= 0) { parts.splice(j, 1); continue }
          const lf = Math.max(0, p.life)
          // Halo (donne l'éclat du feu, visible même sur fond clair)
          ctx.globalAlpha = lf * 0.3; ctx.fillStyle = p.c
          ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 6.28); ctx.fill()
          // Cœur vif
          ctx.globalAlpha = lf; ctx.fillStyle = p.c
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, 6.28); ctx.fill()
        }
        t++; raf = requestAnimationFrame(draw)
      }
      draw()
    }
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', fit) }
  }, [mode, hidden])

  if (!mode || hidden || prefersReducedMotion()) return null

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[38]"
      style={{ opacity: mode === 'day' ? 0.85 : 0.95 }}
    />
  )
}
