import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Lock, User, Loader2 } from 'lucide-react'
import { useAuth } from '../store/AuthContext'

export function Login() {
  const navigate = useNavigate()
  const { signIn, signUp, enabled } = useAuth()
  const [tab, setTab] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!email.trim() || !password) {
      setError('Renseignez votre email et votre mot de passe.')
      return
    }
    setBusy(true)
    const res =
      tab === 'in'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, fullName.trim())
    setBusy(false)
    if (res.error) {
      setError(res.error)
      return
    }
    if (res.needsConfirmation) {
      setInfo('Compte créé ! Vérifiez votre boîte mail pour confirmer, puis connectez-vous.')
      setTab('in')
      return
    }
    navigate('/compte')
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="safe-top flex items-center gap-3 px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
      </header>

      <div className="px-6 pt-4">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-500 text-2xl font-black text-white">
            C
          </div>
          <h1 className="mt-3 text-2xl font-black text-gray-900">Chap.ci</h1>
          <p className="text-sm text-gray-500">
            {tab === 'in' ? 'Connectez-vous à votre compte' : 'Créez votre compte gratuit'}
          </p>
        </div>

        {!enabled && (
          <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Les comptes ne sont pas encore activés (backend non configuré).
          </p>
        )}

        {/* Onglets */}
        <div className="mb-5 flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setTab('in')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              tab === 'in' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => setTab('up')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              tab === 'up' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            Créer un compte
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {tab === 'up' && (
            <div className="relative">
              <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nom complet"
                className="input pl-10"
                autoComplete="name"
              />
            </div>
          )}
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
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe (min. 6 caractères)"
              className="input pl-10"
              autoComplete={tab === 'in' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
          )}
          {info && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !enabled}
            className="btn-primary w-full py-3.5 text-base"
          >
            {busy ? (
              <Loader2 size={20} className="animate-spin" />
            ) : tab === 'in' ? (
              'Se connecter'
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          En continuant, vous acceptez d’utiliser Chap.ci de façon responsable et respectueuse.
        </p>
      </div>
    </div>
  )
}
