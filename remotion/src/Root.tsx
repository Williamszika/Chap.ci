import { Composition } from 'remotion'
import { Promo, promoSchema } from './Promo'

// Format 16:5 (comme la bannière du site) — 1280×400 à 30 i/s, 6 s.
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Promo"
      component={Promo}
      durationInFrames={180}
      fps={30}
      width={1280}
      height={400}
      schema={promoSchema}
      defaultProps={{
        title: 'Vendez chap-chap sur Chap.ci 🧡',
        subtitle: 'La marketplace 100 % ivoirienne — publiez gratuitement.',
        style: 'ivoire' as const,
      }}
    />
  )
}
