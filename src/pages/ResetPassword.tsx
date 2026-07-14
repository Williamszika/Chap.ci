import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { PasswordStrength } from '../components/PasswordStrength'
import { checkPassword } from '../lib/password'
import { Mark, Wordmark } from '../components/Logo'

export function ResetPassword() {
  const navigate = useNavigate()
  const { updatePassword, clearRecovery, user } = useAuth()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const check = checkPassword(pw)
    if (!check.ok) return setError(`Mot de passe trop faible — ajoutez : ${check.missing.join(', ')}.`)
    if (pw !== confirm) return setError('Les deux mots de passe ne correspondent pas.')
    setBusy(true)
    const res = await updatePassword(pw)
    setBusy(false)
    if (res.error) return setError(res.error)
    clearRecovery()
    setDone(true)
    setTimeout(() => navigate('/compte'), 1600)
  }

  return (
    <div className="min-h-screen bg-white md:mx-auto md:my-6 md:min-h-0 md:max-w-xl md:rounded-3xl md:shadow-card">
      <div className="mx-auto max-w-sm px-6 pt-10">
        <div className="mb-5 flex flex-col items-center text-center">
          <Mark size={56} />
          <Wordmark className="mt-3 text-2xl text-ink" />
          <p className="mt-1 text-sm text-gray-500">Nouveau mot de passe</p>
        </div>

        {!user ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-center">
            <p className="font-bold text-amber-800">Lien invalide ou expiré</p>
            <p className="mt-1 text-sm text-amber-700">
              Le lien de réinitialisation n’est plus valide. Demandez-en un nouveau.
            </p>
            <button
              onClick={() => navigate('/mot-de-passe-oublie')}
              className="btn-primary mt-4 w-full py-2.5 text-sm"
            >
              Recevoir un nouveau lien
            </button>
          </div>
        ) : done ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
            <ShieldCheck size={40} className="mx-auto text-emerald-500" />
            <p className="mt-2 font-bold text-emerald-800">Mot de passe modifié ✓</p>
            <p className="mt-1 text-sm text-emerald-700">Vous êtes connecté. Redirection…</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-gray-600">Choisissez un nouveau mot de passe robuste.</p>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Nouveau mot de passe"
                className="input pl-10"
                autoComplete="new-password"
              />
            </div>
            <PasswordStrength value={pw} />
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirmer le mot de passe"
                className="input pl-10"
                autoComplete="new-password"
              />
            </div>

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3.5 text-base">
              {busy ? <Loader2 size={20} className="animate-spin" /> : 'Enregistrer le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
