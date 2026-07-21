import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

/** Feuille modale qui remonte depuis le bas (style app mobile). */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  // `onClose` est presque toujours une fonction fléchée inline (identité qui change
  // à chaque rendu du parent). On la garde dans un ref pour NE PAS relancer l'effet
  // de focus ci-dessous à chaque re-render — sinon le focus saute sur le bouton « X »
  // en pleine saisie (ex. champ « Prix min » d'un filtre).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  // Montage différé : on garde la feuille montée le temps de jouer l'animation
  // de SORTIE (transition interruptible) avant de la démonter.
  const [render, setRender] = useState(open)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (open) {
      setRender(true)
      return
    }
    setShown(false)
    const t = setTimeout(() => setRender(false), 250)
    return () => clearTimeout(t)
  }, [open])

  // Une fois montée, on bascule vers l'état visible à la frame suivante → entrée.
  useEffect(() => {
    if (!render || !open) return
    const r = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(r)
  }, [render, open])

  // Accessibilité clavier (P16) : focus déplacé et piégé dans la feuille,
  // fermeture par Échap, focus restauré à la fermeture, défilement bloqué.
  useEffect(() => {
    if (!open || !render) {
      document.body.style.overflow = ''
      return
    }
    document.body.style.overflow = 'hidden'
    const prevActive = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusables = (): HTMLElement[] =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.offsetParent !== null)
        : []
    ;(focusables()[0] ?? panel)?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key === 'Tab') {
        const f = focusables()
        if (!f.length) {
          e.preventDefault()
          return
        }
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prevActive?.focus?.()
    }
  }, [open, render])

  if (!render) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        style={{ opacity: shown ? 1 : 0, transition: 'opacity 200ms var(--ease-smooth)' }}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : 'Fenêtre'}
        tabIndex={-1}
        className="relative z-10 w-full max-w-app rounded-t-3xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl outline-none"
        style={{
          transform: shown ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 250ms var(--ease-drawer)',
        }}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 id={titleId} className="text-base font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Fermer"
          >
            <X size={22} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
