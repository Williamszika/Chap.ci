import { useState } from 'react'

/**
 * Image de l'écran publicitaire — NETTE, adaptée automatiquement au visuel.
 *
 * L'écran est large et court. La conversion se fait toute seule selon le format :
 *
 *  • Photo « normale » (paysage, carré, portrait modéré 3:4…) → `object-cover` :
 *    elle REMPLIT tout l'écran, bien nette, sans flou ni bande noire (recadrée
 *    au centre — le « remplir net » demandé).
 *
 *  • Visuel très haut / story / affiche verticale (type 9:16) → visuel DÉJÀ
 *    composé : affiché EN ENTIER et net (`object-contain`), jamais rogné. Pour
 *    éviter les bandes noires sur les côtés, on remplit l'espace restant avec un
 *    dégradé repris des COULEURS DE L'IMAGE elle-même (échantillon de sa colonne
 *    centrale) : le visuel semble alors occuper tout l'écran, sans flou.
 *
 * Le format et les couleurs sont détectés au chargement → ajustement automatique
 * quelle que soit l'image. Le visuel complet reste consultable sur /pub/:id.
 */
export function AdImageFill({ src, className = '' }: { src: string; className?: string }) {
  const [tall, setTall] = useState(false)
  const [bg, setBg] = useState<string | null>(null)

  function onLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const im = e.currentTarget
    const isTall = im.naturalWidth / im.naturalHeight < 0.66
    setTall(isTall)
    if (!isTall) { setBg(null); return }
    // Échantillonne une colonne de BORD (là où se trouve le fond du visuel, pas
    // le texte central) sur toute la hauteur → dégradé vertical assorti aux côtés.
    try {
      const H = 24
      const c = document.createElement('canvas')
      c.width = 1; c.height = H
      const ctx = c.getContext('2d')
      if (!ctx) return
      const edgeX = Math.min(3, im.naturalWidth - 1) // proche du bord gauche = fond
      ctx.drawImage(im, edgeX, 0, 1, im.naturalHeight, 0, 0, 1, H)
      const d = ctx.getImageData(0, 0, 1, H).data
      const stops: string[] = []
      for (let i = 0; i < H; i++) {
        stops.push(`rgb(${d[i * 4]},${d[i * 4 + 1]},${d[i * 4 + 2]}) ${Math.round((i / (H - 1)) * 100)}%`)
      }
      setBg(`linear-gradient(180deg, ${stops.join(',')})`)
    } catch {
      setBg(null) // image protégée (CORS) : on garde le fond noir de l'écran.
    }
  }

  return (
    <>
      {tall && bg && <div className="absolute inset-0" style={{ background: bg }} aria-hidden />}
      <img
        src={src}
        alt=""
        aria-hidden
        onLoad={onLoad}
        className={`absolute inset-0 h-full w-full object-center ${tall ? 'object-contain' : 'object-cover'} ${className}`}
      />
    </>
  )
}
