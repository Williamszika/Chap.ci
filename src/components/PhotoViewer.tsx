import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { mediaUrl } from '../lib/native'

/**
 * Visionneuse plein écran — la photo « en grand ».
 *
 * Sur un téléphone, la vignette carrée d'une annonce ne suffit pas : on achète
 * un objet d'occasion, on veut voir l'état réel, la rayure, l'usure. Ce plein
 * écran affiche la photo ENTIÈRE (jamais rognée) sur fond noir, et l'on passe
 * de l'une à l'autre par un simple balayage.
 *
 * ── Pourquoi un conteneur qui défile plutôt qu'un glisser-déposer maison ──────
 * Le balayage repose sur le défilement horizontal du navigateur, avec accroche
 * (`snap`). C'est le geste natif : inertie, rebond en fin de course, suivi du
 * doigt au pixel près, et il fonctionne identiquement dans la WebView Android,
 * dans Safari iOS et sur le web. Une gestion manuelle des `touchstart` /
 * `touchmove` aurait dû réimplémenter tout cela — moins bien, et en plus de
 * code. Les flèches, elles, servent la tablette et l'ordinateur, où l'on n'a
 * pas de doigt sur l'écran.
 */
export function PhotoViewer({
  images, index, onClose, alt = '',
}: {
  images: string[]
  index: number
  /** Reçoit la photo sur laquelle on s'est arrêté : la galerie s'y recale. */
  onClose: (index: number) => void
  alt?: string
}) {
  const rail = useRef<HTMLDivElement | null>(null)
  const [i, setI] = useState(index)

  const aller = useCallback((n: number) => {
    const el = rail.current
    if (!el) return
    const cible = Math.max(0, Math.min(images.length - 1, n))
    el.scrollTo({ left: cible * el.clientWidth, behavior: 'smooth' })
    setI(cible)
  }, [images.length])

  // Position d'ouverture : on saute directement à la photo touchée, sans
  // animation — elle doit être là avant même que l'écran noir n'apparaisse.
  useEffect(() => {
    const el = rail.current
    if (el) el.scrollLeft = index * el.clientWidth
  }, [index])

  // ── Le bouton « retour » d'Android doit fermer la photo, pas quitter l'annonce
  //
  // Dans l'application, ce bouton appelle window.history.back() : sans rien de
  // plus, l'acheteur qui regarde une photo en grand et appuie sur « retour »
  // sortirait de l'annonce entière — le réflexe le plus naturel du monde, puni.
  // On empile donc une entrée d'historique à l'ouverture ; le retour la dépile
  // et ne fait que refermer la photo. Le même mécanisme sert le bouton retour du
  // navigateur sur le web.
  const iRef = useRef(index)
  iRef.current = i
  const parRetour = useRef(false)
  useEffect(() => {
    window.history.pushState({ chapciViewer: true }, '')
    const onPop = () => { parRetour.current = true; onClose(iRef.current) }
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      // Fermeture par la croix ou par Échap : notre entrée est encore empilée,
      // on la retire — sinon le premier « retour » suivant ne ferait rien.
      if (!parRetour.current && (window.history.state as { chapciViewer?: boolean } | null)?.chapciViewer) {
        window.history.back()
      }
    }
    // Monté une seule fois : l'entrée d'historique ne doit pas se réempiler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Clavier (ordinateur) + fermeture par Échap.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(i)
      else if (e.key === 'ArrowRight') aller(i + 1)
      else if (e.key === 'ArrowLeft') aller(i - 1)
    }
    window.addEventListener('keydown', onKey)
    // La page dessous ne doit pas défiler pendant qu'on regarde une photo.
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = avant
    }
  }, [i, aller, onClose])

  const vue = (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label="Photo en grand">
      {/* Barre du haut : compteur + fermeture */}
      <div className="safe-top relative z-10 flex items-center justify-between px-3 py-3">
        <span className="tnum rounded-full bg-white/15 px-3 py-1 text-[12.5px] font-bold text-white backdrop-blur">
          {i + 1} / {images.length}
        </span>
        <button
          onClick={() => onClose(i)}
          aria-label="Fermer"
          className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition active:scale-95"
        >
          <X size={22} />
        </button>
      </div>

      {/* Rail des photos — c'est lui qui porte le balayage */}
      <div
        ref={rail}
        onScroll={(e) => {
          const el = e.currentTarget
          if (el.clientWidth) setI(Math.round(el.scrollLeft / el.clientWidth))
        }}
        className="no-scrollbar flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain"
      >
        {images.map((src, n) => (
          <div key={n} className="flex h-full w-full shrink-0 snap-center items-center justify-center px-2">
            <img
              src={mediaUrl(src)}
              alt={alt ? `${alt} — photo ${n + 1}` : `Photo ${n + 1}`}
              // « contain » : on ne rogne JAMAIS ici. C'est tout l'intérêt du
              // plein écran — voir la photo telle que le vendeur l'a prise.
              className="max-h-full max-w-full object-contain"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Flèches — tablette et ordinateur (sur téléphone, on balaie) */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => aller(i - 1)}
            disabled={i === 0}
            aria-label="Photo précédente"
            className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 disabled:opacity-25 md:grid"
          >
            <ChevronLeft size={26} />
          </button>
          <button
            onClick={() => aller(i + 1)}
            disabled={i === images.length - 1}
            aria-label="Photo suivante"
            className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 disabled:opacity-25 md:grid"
          >
            <ChevronRight size={26} />
          </button>
        </>
      )}

      {/* Pastilles de position + rappel du geste, à portée du pouce */}
      {images.length > 1 && (
        <div className="safe-bottom flex flex-col items-center gap-2 pb-4 pt-3">
          <div className="flex justify-center gap-1.5">
            {images.map((_, n) => (
              <button
                key={n}
                onClick={() => aller(n)}
                aria-label={`Photo ${n + 1}`}
                className="grid h-8 min-w-8 place-items-center"
              >
                <span className={`block h-1.5 rounded-full transition-all ${n === i ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`} />
              </button>
            ))}
          </div>
          <p className="text-[11.5px] text-white/45 md:hidden">Balayez vers la gauche ou la droite</p>
        </div>
      )}
    </div>
  )

  // Rendu hors de la page : la visionneuse ne doit être coupée ni par un parent
  // en `overflow-hidden`, ni par la barre d'onglets de l'application.
  return createPortal(vue, document.body)
}
