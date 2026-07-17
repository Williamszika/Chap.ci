import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ToastKind = 'info' | 'success' | 'error'
interface Toast { id: number; msg: string; kind: ToastKind }

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
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const remove = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const show = useCallback((msg: string, kind: ToastKind = 'info') => {
    const id = ++seq
    setToasts((t) => [...t, { id, msg, kind }])
    setTimeout(() => remove(id), 3800)
  }, [remove])

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
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => remove(t.id)}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex max-w-md items-start gap-2.5 rounded-2xl px-4 py-3 text-left text-sm font-medium shadow-card animate-[toastin_.25s_ease] ${
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
        ))}
      </div>
      <style>{`@keyframes toastin{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </ToastCtx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast doit être utilisé dans <ToastProvider>')
  return ctx
}
