import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Lock, Phone, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth, type OAuthProvider } from '../store/AuthContext'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.3 5.2C41.4 35.9 44 30.4 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  )
}
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.13 3.02-.77.9-2.03 1.6-3.06 1.52-.13-1.1.42-2.26 1.09-3 .74-.83 2.06-1.46 3.1-1.54zM20.5 17.02c-.55 1.27-.82 1.84-1.53 2.96-.99 1.57-2.4 3.53-4.13 3.54-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.02-3.06-1.78-4.05-3.35C.02 15.9-.5 11.03 1.5 8.4c1.05-1.4 2.7-2.28 4.2-2.28 1.53 0 2.5 1 3.77 1 1.23 0 1.98-1 3.75-1 1.34 0 2.76.73 3.77 2-3.31 1.82-2.77 6.55.51 7.9z" />
    </svg>
  )
}

export function Login() {
  const navigate = useNavigate()
  const { signIn, signInWithProvider, sendPhoneCode, verifyPhoneCode, verifyLoginMfa, enabled } = useAuth()

  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('+225 ')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [mfaStep, setMfaStep] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  function handle(res: { error?: string; mfaRequired?: boolean }) {
    if (res.error) return setError(res.error)
    if (res.mfaRequired) return setMfaStep(true)
    navigate('/compte')
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) return setError('Renseignez votre email et votre mot de passe.')
    setBusy(true)
    const res = await signIn(email.trim(), password)
    setBusy(false)
    handle(res)
  }

  async function submitPhone(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    const p = phone.replace(/\s/g, '')
    if (!otpSent) {
      if (p.length < 8) return setError('Entrez un numéro valide (+225…).')
      setBusy(true)
      const res = await sendPhoneCode(p)
      setBusy(false)
      if (res.error) return setError(res.error)
      setOtpSent(true)
      setInfo('Un code vous a été envoyé par SMS.')
    } else {
      if (!otp.trim()) return setError('Entrez le code reçu par SMS.')
      setBusy(true)
      const res = await verifyPhoneCode(p, otp.trim())
      setBusy(false)
      handle(res)
    }
  }

  async function submitMfa(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const res = await verifyLoginMfa(mfaCode.trim())
    setBusy(false)
    if (res.error) return setError(res.error)
    navigate('/compte')
  }

  async function oauth(provider: OAuthProvider) {
    setError('')
    const res = await signInWithProvider(provider)
    if (res.error) setError(res.error)
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
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-500 text-2xl font-black text-white">C</div>
          <h1 className="mt-3 text-2xl font-black text-gray-900">Chap.ci</h1>
          <p className="text-sm text-gray-500">Connectez-vous à votre compte</p>
        </div>

        {!enabled && (
          <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Les comptes ne sont pas encore activés (backend non configuré).
          </p>
        )}

        {mfaStep ? (
          <form onSubmit={submitMfa} className="space-y-3">
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <ShieldCheck size={40} className="text-primary-500" />
              <p className="font-bold text-gray-900">Double authentification</p>
              <p className="text-sm text-gray-500">Entrez le code à 6 chiffres de votre application d’authentification.</p>
            </div>
            <input inputMode="numeric" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" maxLength={6} className="input text-center text-xl tracking-widest" />
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full py-3.5">
              {busy ? <Loader2 size={20} className="animate-spin" /> : 'Valider'}
            </button>
          </form>
        ) : (
          <>
            <div className="space-y-2">
              <button onClick={() => oauth('google')} disabled={!enabled} className="btn-outline w-full py-3">
                <GoogleIcon /> Continuer avec Google
              </button>
              <button onClick={() => oauth('apple')} disabled={!enabled} className="btn-outline w-full py-3">
                <AppleIcon /> Continuer avec Apple
              </button>
            </div>

            <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
              <span className="h-px flex-1 bg-gray-200" /> ou <span className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="mb-4 flex rounded-xl bg-gray-100 p-1">
              <button onClick={() => { setMethod('email'); setError('') }} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${method === 'email' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>
                <Mail size={15} className="mr-1 inline" /> Email
              </button>
              <button onClick={() => { setMethod('phone'); setError('') }} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${method === 'phone' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>
                <Phone size={15} className="mr-1 inline" /> Téléphone
              </button>
            </div>

            {method === 'email' ? (
              <form onSubmit={submitEmail} className="space-y-3">
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Adresse email" className="input pl-10" autoComplete="email" />
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" className="input pl-10" autoComplete="current-password" />
                </div>
                {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
                <button type="submit" disabled={busy || !enabled} className="btn-primary w-full py-3.5 text-base">
                  {busy ? <Loader2 size={20} className="animate-spin" /> : 'Se connecter'}
                </button>
              </form>
            ) : (
              <form onSubmit={submitPhone} className="space-y-3">
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-3.5 text-gray-400" />
                  <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+225 07 00 00 00 00" disabled={otpSent} className="input pl-10" />
                </div>
                {otpSent && (
                  <input inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="Code reçu par SMS" maxLength={6} className="input text-center text-lg tracking-widest" />
                )}
                {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
                {info && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{info}</p>}
                <button type="submit" disabled={busy || !enabled} className="btn-primary w-full py-3.5 text-base">
                  {busy ? <Loader2 size={20} className="animate-spin" /> : otpSent ? 'Vérifier le code' : 'Recevoir un code SMS'}
                </button>
              </form>
            )}

            <p className="mt-5 text-center text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <button onClick={() => navigate('/inscription')} className="font-semibold text-primary-600">
                Créer un compte
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
