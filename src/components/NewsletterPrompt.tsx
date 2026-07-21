import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Mail, X, Check, Loader2 } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { isSubscribed, subscribeNewsletter } from '../lib/newsletter'

const SEEN_KEY = 'chapci.nlPrompt.v1'
// Pages « action » où aucune pop-up ne doit s'ouvrir (elle recouvrirait le bouton
// d'envoi) : publication et modification d'annonce.
const isActionRoute = (path: string) => /^\/(publier|modifier)/.test(path)

/**
 * Popup proposant la newsletter — affiché UNE seule fois (par appareil) aux
 * utilisateurs connectés qui ne sont pas encore abonnés.
 */
export function NewsletterPrompt() {
  const { user } = useAuth()
  const location = useLocation()
  const suppressed = isActionRoute(location.pathname)
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const cardRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!user?.email) return
    if (localStorage.getItem(SEEN_KEY)) return
    // Ne pas s'ouvrir (ni s'armer) sur une page d'action : on attendra que
    // l'utilisateur quitte /publier ou /modifier.
    if (suppressed) { setOpen(false); return }
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    // On vérifie l'abonnement, puis on propose après un court délai (non intrusif).
    isSubscribed().then((sub) => {
      if (!alive || sub) return
      timer = setTimeout(() => setOpen(true), 2500)
    })
    return () => { alive = false; if (timer) clearTimeout(timer) }
  }, [user, suppressed])

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, '1')
    setOpen(false)
  }

  // Accessibilité clavier (P16) : focus dans la fenêtre + fermeture par Échap.
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    cardRef.current?.querySelector<HTMLElement>('button')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const subscribe = async () => {
    if (!user?.email) return
    setState('busy')
    try {
      await subscribeNewsletter(user.email)
      localStorage.setItem(SEEN_KEY, '1')
      setState('done')
      setTimeout(() => setOpen(false), 1600)
    } catch {
      setState('idle')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={dismiss}>
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={dismiss} aria-label="Fermer" className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        {state === 'done' ? (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check size={28} />
            </span>
            <p className="mt-3 font-display text-lg font-bold">Merci, c’est fait ! 🎉</p>
            <p className="mt-1 text-sm text-gray-500">Vous recevrez nos meilleurs bons plans.</p>
          </div>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
              <Mail size={24} />
            </span>
            <h2 id={titleId} className="mt-3 font-display text-xl font-bold text-gray-900">Ne ratez aucun bon plan 📩</h2>
            <p className="mt-1.5 text-sm text-gray-600">
              Recevez les meilleures annonces et promos de Côte d’Ivoire, avant tout le monde — directement sur{' '}
              <b className="text-gray-800">{user?.email}</b>.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button onClick={subscribe} disabled={state === 'busy'} className="btn-primary w-full py-3 disabled:opacity-60">
                {state === 'busy' ? <Loader2 size={18} className="animate-spin" /> : 'Oui, je m’inscris'}
              </button>
              <button onClick={dismiss} className="w-full py-2 text-sm font-medium text-gray-400">
                Plus tard
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-gray-400">Gratuit, sans spam. Désinscription à tout moment.</p>
          </>
        )}
      </div>
    </div>
  )
}
