import { useEffect, useRef, useState } from 'react'
import type { AdStyle } from '../lib/ads'

/** L'utilisateur a-t-il demandé « animations réduites » ? */
function prefersReduced(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Texte animé de l'écran publicitaire.
 *
 * Enchaîne les animations CHOISIES (`anims`) l'une après l'autre : chaque
 * animation se joue une fois, puis le texte reste au repos pendant la pause
 * demandée (`gapMs`, entre 5 s et 1 min), puis l'animation SUIVANTE de la liste
 * démarre — et ainsi de suite en boucle. Avec une seule animation, c'est la même
 * qui rejoue après chaque pause. Si `loop` est faux, l'animation ne joue qu'une
 * fois. En « mouvement réduit », le texte reste simplement affiché, sans motion.
 */
export function AnimatedAdText({
  text,
  style = 'classique',
  anims,
  gapMs,
  loop = true,
  color,
  className = '',
}: {
  text: string
  style?: AdStyle | null
  anims: string[]
  gapMs: number
  loop?: boolean
  /** Couleur du texte choisie par l'admin (prioritaire sur le style). */
  color?: string | null
  className?: string
}) {
  const list = anims && anims.length ? anims : ['fondu']
  const reduced = prefersReduced()
  const [step, setStep] = useState(0)
  const timer = useRef<number | null>(null)

  // Repart de zéro si la liste ou le texte change.
  useEffect(() => { setStep(0) }, [text, anims.join(','), gapMs, loop])
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])

  const styleClass = `ad-style-${style ?? 'classique'}`
  // La couleur choisie prime (et neutralise le remplissage dégradé du style « ivoire »).
  const colorStyle = color
    ? { color, WebkitTextFillColor: color, backgroundImage: 'none' as const }
    : undefined
  if (reduced) return <div className={`${styleClass} ${className}`} style={colorStyle}>{text}</div>

  const current = list[step % list.length]

  function onEnd() {
    if (!loop) return
    if (timer.current) window.clearTimeout(timer.current)
    // Pause « au repos » puis on passe à l'animation suivante de la liste.
    timer.current = window.setTimeout(() => setStep((s) => s + 1), Math.max(0, gapMs))
  }

  return (
    <div
      key={step}
      onAnimationEnd={onEnd}
      className={`ad-anim-${current} ${styleClass} ${className}`}
      style={colorStyle}
    >
      {text}
    </div>
  )
}
