import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { Mark, Wordmark } from '../components/Logo'

export function ForgotPassword() {
  const navigate = useNavigate()
  const { sendPasswordReset, enabled } = useAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Entrez votre adresse email.')
    setBusy(true)
    const res = await sendPasswordReset(email.trim())
    setBusy(false)
    if (res.error) return setError(res.error)
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="safe-top flex items-center gap-3 px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
      </header>

      <div className="mx-auto max-w-sm px-6 pt-2">
        <div className="mb-5 flex flex-col items-center text-center">
          <Mark size={56} />
          <Wordmark className="mt-3 text-2xl text-ink" />
          <p className="mt-1 text-sm text-gray-500">Réinitialiser votre mot de passe</p>
        </div>

        {!enabled && (
          <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Les comptes ne sont pas encore activés (backend non configuré).
          </p>
        )}

        {sent ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
            <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
            <p className="mt-2 font-bold text-emerald-800">Email envoyé !</p>
            <p className="mt-1 text-sm text-emerald-700">
              Un lien de réinitialisation a été envoyé à <strong>{email}</strong>. Ouvrez-le pour
              choisir un nouveau mot de passe.
            </p>
            <p className="mt-2 text-xs text-emerald-600">
              Pensez à vérifier vos courriers indésirables (spam).
            </p>
            <button onClick={() => navigate('/connexion')} className="btn-outline mt-4 w-full py-2.5 text-sm">
              Retour à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-gray-600">
              Entrez l’adresse email de votre compte. Nous vous enverrons un lien pour définir un
              nouveau mot de passe.
            </p>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresse email"
                className="input pl-10"
                autoComplete="email"
              />
            </div>

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

            <button type="submit" disabled={busy || !enabled} className="btn-primary w-full py-3.5 text-base">
              {busy ? <Loader2 size={20} className="animate-spin" /> : 'Envoyer le lien'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Vous vous souvenez ?{' '}
              <button type="button" onClick={() => navigate('/connexion')} className="font-semibold text-primary-600">
                Se connecter
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
