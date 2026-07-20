import { z } from 'remotion'
import {
  AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig,
} from 'remotion'

// Styles d'écriture — mêmes intentions que l'écran du site (index.css).
export const promoSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  style: z.enum(['classique', 'impact', 'neon', 'script', 'ivoire']),
})

const FONT = '"Plus Jakarta Sans", system-ui, sans-serif'

function titleStyle(style: z.infer<typeof promoSchema>['style']): React.CSSProperties {
  switch (style) {
    case 'impact':
      return { fontFamily: FONT, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#fff' }
    case 'neon':
      return { fontFamily: FONT, fontWeight: 800, color: '#fff', textShadow: '0 0 8px #f77f00, 0 0 24px #f77f00, 0 0 48px rgba(247,127,0,.65)' }
    case 'script':
      return { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, color: '#fff' }
    case 'ivoire':
      return { fontFamily: FONT, fontWeight: 800, background: 'linear-gradient(90deg,#f77f00 15%,#fff 50%,#009e60 85%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }
    default:
      return { fontFamily: FONT, fontWeight: 800, color: '#fff' }
  }
}

/**
 * Composition promo Chap.ci : titre animé (ressort + montée), sous-titre en
 * fondu décalé, sur fond noir cinématographique. Rendu en MP4 par Remotion.
 */
export const Promo: React.FC<z.infer<typeof promoSchema>> = ({ title, subtitle, style }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const enter = spring({ frame, fps, config: { damping: 200 } })
  const titleY = interpolate(enter, [0, 1], [40, 0])
  const titleOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' })
  const subOpacity = interpolate(frame, [24, 44], [0, 1], { extrapolateRight: 'clamp' })
  // Léger zoom permanent (effet « Ken Burns ») pour un fond vivant.
  const bgScale = interpolate(frame, [0, 180], [1, 1.08])

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <AbsoluteFill
        style={{
          transform: `scale(${bgScale})`,
          background: 'radial-gradient(600px 300px at 80% 10%, rgba(247,127,0,.35), transparent 70%)',
        }}
      />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 60, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: FONT, fontWeight: 700, fontSize: 20, letterSpacing: 6,
            color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', marginBottom: 18,
            opacity: titleOpacity,
          }}
        >
          Chap.ci
        </div>
        <div style={{ ...titleStyle(style), fontSize: 72, lineHeight: 1.05, opacity: titleOpacity, transform: `translateY(${titleY}px)` }}>
          {title}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 28, color: 'rgba(255,255,255,.82)', marginTop: 20, opacity: subOpacity }}>
          {subtitle}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
