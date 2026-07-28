import { useCallback, useEffect, useRef, useState } from 'react'
import { mediaUrl } from '../lib/native'

/**
 * Image de l'écran publicitaire — NETTE, adaptée automatiquement au visuel.
 *
 * Un annonceur paie pour que SON visuel soit vu. La règle est donc simple :
 * on ne rogne que ce qu'on peut rogner sans amputer le message.
 *
 *  • Si le recadrage « remplir » ne coûte presque rien (le visuel a des
 *    proportions proches du cadre) → `object-cover` : il occupe tout l'écran,
 *    net, sans bande ni flou.
 *
 *  • Si le recadrage couperait plus d'un quart du visuel → `object-contain` :
 *    il est affiché EN ENTIER, jamais amputé. Pour éviter les bandes noires sur
 *    les côtés, l'espace restant est rempli d'un dégradé repris des COULEURS DU
 *    VISUEL lui-même (échantillon de sa colonne de bord) : il semble alors
 *    occuper tout l'écran.
 *
 * ── Pourquoi cette règle a changé le 28/07 ───────────────────────────────────
 * La version précédente ne basculait en « entier » que pour les visuels TRÈS
 * hauts (rapport < 0,66), sans jamais regarder le cadre. Or le cadre s'élargit
 * avec l'écran alors que sa hauteur est fixe : le recadrage s'aggrave donc à
 * mesure qu'on s'éloigne du téléphone. Mesuré sur la publicité payante en ligne
 * (visuel 1024×500) :
 *
 *     téléphone  412 px  →  99 % du visuel visible
 *     tablette  1024 px  →  61 %
 *     grand écran 1440 px →  48 %   ← plus de la moitié coupée
 *
 * L'annonceur payait 2 000 FCFA la semaine pour un appel à l'action tronqué sur
 * la moitié des écrans. On compare désormais le visuel AU CADRE RÉEL, et on
 * recalcule à chaque redimensionnement.
 */
const SEUIL_VISIBLE = 0.75 // en dessous, on préfère montrer le visuel en entier

export function AdImageFill({ src, className = '' }: { src: string; className?: string }) {
  const [entier, setEntier] = useState(false)
  const [bg, setBg] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  /** Part du visuel encore visible si on le fait « remplir » le cadre. */
  const partVisible = useCallback((im: HTMLImageElement) => {
    const cadre = im.parentElement?.getBoundingClientRect()
    if (!cadre || !cadre.width || !cadre.height || !im.naturalWidth || !im.naturalHeight) return 1
    const rCadre = cadre.width / cadre.height
    const rImage = im.naturalWidth / im.naturalHeight
    // « cover » ajuste sur la plus grande dimension : ce qui dépasse est rogné.
    return rImage > rCadre ? rCadre / rImage : rImage / rCadre
  }, [])

  /** Dégradé assorti, échantillonné sur une colonne de BORD du visuel. */
  const echantillonner = useCallback((im: HTMLImageElement) => {
    try {
      const H = 24
      const c = document.createElement('canvas')
      c.width = 1
      c.height = H
      const ctx = c.getContext('2d')
      if (!ctx) return
      const bordX = Math.min(3, im.naturalWidth - 1) // proche du bord = fond du visuel
      ctx.drawImage(im, bordX, 0, 1, im.naturalHeight, 0, 0, 1, H)
      const d = ctx.getImageData(0, 0, 1, H).data
      const stops: string[] = []
      for (let i = 0; i < H; i++) {
        stops.push(`rgb(${d[i * 4]},${d[i * 4 + 1]},${d[i * 4 + 2]}) ${Math.round((i / (H - 1)) * 100)}%`)
      }
      setBg(`linear-gradient(180deg, ${stops.join(',')})`)
    } catch {
      setBg(null) // image protégée (CORS) : on garde le fond noir de l'écran.
    }
  }, [])

  const decider = useCallback((im: HTMLImageElement | null) => {
    if (!im || !im.complete || !im.naturalWidth) return
    const montrerEntier = partVisible(im) < SEUIL_VISIBLE
    setEntier(montrerEntier)
    if (montrerEntier) echantillonner(im)
    else setBg(null)
  }, [partVisible, echantillonner])

  // Le cadre s'élargit avec l'écran : ce qui tenait sur un téléphone peut être
  // amputé sur un grand écran. On refait donc le calcul à chaque changement de
  // taille, pas seulement au chargement.
  useEffect(() => {
    const im = imgRef.current
    const cadre = im?.parentElement
    if (!im || !cadre) return
    decider(im)
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => decider(imgRef.current))
    ro.observe(cadre)
    return () => ro.disconnect()
  }, [decider, src])

  return (
    <>
      {entier && bg && <div className="absolute inset-0" style={{ background: bg }} aria-hidden />}
      <img
        ref={imgRef}
        src={mediaUrl(src)}
        alt=""
        aria-hidden
        onLoad={(e) => decider(e.currentTarget)}
        className={`absolute inset-0 h-full w-full object-center ${entier ? 'object-contain' : 'object-cover'} ${className}`}
      />
    </>
  )
}
