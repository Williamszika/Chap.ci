import { useState, type FormEvent } from 'react'
import { Mail, Check, Loader2 } from 'lucide-react'
import { subscribeNewsletter } from '../lib/newsletter'

/** Bloc d'inscription à la newsletter « Bons plans ». */
export function Newsletter({ className = '' }: { className?: string }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Entrez une adresse email valide.')
      setState('error')
      return
    }
    setState('busy')
    setError('')
    try {
      await subscribeNewsletter(value)
      setState('done')
      setEmail('')
    } catch (err) {
      setError((err as Error).message || 'Inscription impossible pour le moment.')
      setState('error')
    }
  }

  return (
    <section className={`mx-4 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-5 text-white shadow-card ${className}`}>
      {state === 'done' ? (
        <div role="status" className="flex flex-col items-center py-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Check size={26} />
          </span>
          <p className="mt-3 font-display text-lg font-bold">Merci, c’est noté ! 🎉</p>
          <p className="mt-1 text-sm text-white/90">
            Vous recevrez nos meilleures offres et nouveautés par email.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Mail size={20} />
            <h2 className="font-display text-lg font-bold">Recevez nos bons plans</h2>
          </div>
          <p className="mt-1 text-sm text-white/90">
            Les meilleures annonces et promotions de Côte d’Ivoire, direct dans votre boîte mail.
          </p>
          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (state === 'error') setState('idle')
              }}
              placeholder="Votre adresse email"
              autoComplete="email"
              className="w-full rounded-xl border-0 px-4 py-3 text-[15px] text-ink outline-none ring-2 ring-transparent focus:ring-white/60"
              aria-label="Adresse email"
            />
            <button
              type="submit"
              disabled={state === 'busy'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-primary-600 transition active:scale-[0.98] hover:bg-white/90 disabled:opacity-60"
            >
              {state === 'busy' ? <Loader2 size={18} className="animate-spin" /> : "S’inscrire"}
            </button>
          </form>
          {state === 'error' && <p role="alert" className="mt-2 text-sm text-white font-medium">⚠️ {error}</p>}
          <p className="mt-2 text-xs text-white/85">
            Gratuit, sans spam. Désinscription à tout moment.
          </p>
        </>
      )}
    </section>
  )
}
