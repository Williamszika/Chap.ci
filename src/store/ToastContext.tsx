import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type ToastKind = 'info' | 'success' | 'error'
interface Toast { id: number; msg: string; kind: ToastKind; leaving?: boolean }

interface ToastApi {
  show: (msg: string, kind?: ToastKind) => void
  success: (msg: string) => void
  error: (msg: string) => void
}

const ToastCtx = createContext<ToastApi | null>(null)
let seq = 0

/**
 * Notifications « toast » stylées à la charte (P17), en remplacement des boîtes
 * grises du navigateur (alert). Annoncées aux lecteurs d'écran (aria-live).
 * Entrée ET sortie animées par transitions interruptibles (pas de keyframes).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  // Ids déjà « montés » (déclenche la transition d'entrée à la frame suivante).
  const [shown, setShown] = useState<Set<number>>(() => new Set())
  const timers = useRef<Record<number, number>>({})

  const remove = useCallback((id: number) => {
    // Marque le toast comme sortant, puis le retire après l'animation.
    setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x)))
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
      setShown((s) => {
        if (!s.has(id)) return s
        const n = new Set(s)
        n.delete(id)
        return n
      })
    }, 220)
  }, [])

  const show = useCallback((msg: string, kind: ToastKind = 'info') => {
    const id = ++seq
    setToasts((t) => [...t, { id, msg, kind }])
    // Frame suivante → état visible (transition d'entrée).
    requestAnimationFrame(() => setShown((s) => new Set(s).add(id)))
    timers.current[id] = window.setTimeout(() => remove(id), 3800)
  }, [remove])

  // Nettoyage des minuteries au démontage.
  useEffect(() => {
    const t = timers.current
    return () => { Object.values(t).forEach((h) => window.clearTimeout(h)) }
  }, [])

  const api = useMemo<ToastApi>(
    () => ({ show, success: (m) => show(m, 'success'), error: (m) => show(m, 'error') }),
    [show],
  )

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[80] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const visible = shown.has(t.id) && !t.leaving
          return (
            <button
              key={t.id}
              onClick={() => remove(t.id)}
              role={t.kind === 'error' ? 'alert' : 'status'}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 220ms var(--ease-smooth), transform 220ms var(--ease-smooth)',
              }}
              className={`pointer-events-auto flex max-w-md items-start gap-2.5 rounded-2xl px-4 py-3 text-left text-sm font-medium shadow-card ${
                t.kind === 'success'
                  ? 'bg-ivoire-green text-white'
                  : t.kind === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-ink text-white'
              }`}
            >
              <span className="mt-px shrink-0">
                {t.kind === 'success' ? '✅' : t.kind === 'error' ? '⚠️' : 'ℹ️'}
              </span>
              <span className="leading-snug">{t.msg}</span>
            </button>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast doit être utilisé dans <ToastProvider>')
  return ctx
}
