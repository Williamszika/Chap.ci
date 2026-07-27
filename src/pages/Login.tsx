import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Phone, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react'
import { useAuth, type OAuthProvider } from '../store/AuthContext'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { FacebookSignInButton } from '../components/FacebookSignInButton'
import { PHONE_LOGIN_ENABLED } from '../lib/features'
import { usePublicConfig } from '../lib/publicConfig'
import { isNative } from '../lib/native'
import { Mark, Wordmark } from '../components/Logo'

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.13 3.02-.77.9-2.03 1.6-3.06 1.52-.13-1.1.42-2.26 1.09-3 .74-.83 2.06-1.46 3.1-1.54zM20.5 17.02c-.55 1.27-.82 1.84-1.53 2.96-.99 1.57-2.4 3.53-4.13 3.54-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.02-3.06-1.78-4.05-3.35C.02 15.9-.5 11.03 1.5 8.4c1.05-1.4 2.7-2.28 4.2-2.28 1.53 0 2.5 1 3.77 1 1.23 0 1.98-1 3.75-1 1.34 0 2.76.73 3.77 2-3.31 1.82-2.77 6.55.51 7.9z" />
    </svg>
  )
}

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  // Page d'origine (ex. « /publier ») : on y revient après connexion.
  const from = (location.state as { from?: string } | null)?.from
  const goAfterAuth = () => navigate(from || '/compte')
  const { signIn, signInWithProvider, signInWithGoogleCredential, signInWithFacebookToken, sendPhoneCode, verifyPhoneCode, verifyLoginMfa, enabled } = useAuth()
  // Connexion Google / Facebook : activées si configurées (runtime, /api/config)
  // — mais JAMAIS dans l'application native.
  //
  // Depuis septembre 2021, Google REFUSE ses connexions OAuth depuis un
  // navigateur embarqué (WebView), pour empêcher l'application hôte de lire les
  // identifiants au passage. Dans l'app, la page est servie depuis
  // https://localhost et le script Google Identity Services ne rend donc aucun
  // bouton. L'écran observé le 27/07 : un blanc, suivi d'un séparateur « ou »
  // orphelin — l'utilisateur croit l'application cassée alors que l'email
  // fonctionne juste en dessous.
  // Rétablir Google dans l'app suppose un plugin de connexion NATIVE ; tant
  // qu'il n'est pas en place et testé sur un vrai téléphone, on masque ces
  // boutons proprement plutôt que d'afficher un vide.
  const cfg = usePublicConfig()
  const googleEnabled = !isNative && !!cfg?.googleClientId
  const facebookEnabled = !isNative && !!cfg?.facebookAppId
  // Connexion Apple non disponible sur le backend auto-hébergé : on la masque.
  const showApple = false

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
    goAfterAuth()
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
      // En mode test serveur (SMS debug), le code est renvoyé pour pouvoir tester.
      setInfo(res.debugCode && import.meta.env.DEV ? `Mode test : votre code est ${res.debugCode}.` : 'Un code vous a été envoyé par SMS.')
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
    goAfterAuth()
  }

  async function oauth(provider: OAuthProvider) {
    setError('')
    const res = await signInWithProvider(provider)
    if (res.error) setError(res.error)
  }

  async function handleGoogle(credential: string) {
    setError('')
    setBusy(true)
    const res = await signInWithGoogleCredential(credential)
    setBusy(false)
    handle(res)
  }

  async function handleFacebook(accessToken: string) {
    setError('')
    setBusy(true)
    const res = await signInWithFacebookToken(accessToken)
    setBusy(false)
    handle(res)
  }

  return (
    <div className="flex min-h-[72vh] items-center justify-center px-5 py-8 md:min-h-[78vh]">
      <div className="w-full max-w-sm rounded-[22px] border border-line bg-white p-6 shadow-[0_12px_34px_-10px_rgba(120,70,10,0.28),0_6px_14px_-8px_rgba(120,70,10,0.20)] md:max-w-[420px] md:p-7">
        <button
          onClick={() => navigate('/')}
          className="mb-3 -ml-1 inline-flex items-center gap-1 text-sm font-semibold text-gray-500 transition hover:text-primary-600"
        >
          <ArrowLeft size={16} /> Accueil
        </button>
        <div className="mb-5 flex flex-col items-center text-center">
          <button onClick={() => navigate('/')} className="flex items-center gap-2" aria-label="Accueil Chap.ci">
            <Mark size={30} />
            <Wordmark className="text-lg text-ink" />
          </button>
          <h1 className="mt-3 font-display text-[22px] font-extrabold leading-tight text-ink">Bienvenue&nbsp;👋</h1>
          <p className="mt-1 text-sm text-gray-500">Connectez-vous pour vendre et acheter chap-chap.</p>
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
              <p className="text-sm text-gray-500">Entrez le code à 6 chiffres de votre application d’authentification (ou un code de secours).</p>
            </div>
            <input inputMode="numeric" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" maxLength={8} className="input text-center text-xl tracking-widest" />
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full py-3.5">
              {busy ? <Loader2 size={20} className="animate-spin" /> : 'Valider'}
            </button>
          </form>
        ) : (
          <>
            {(googleEnabled || facebookEnabled || showApple) && (
              <>
                <div className="flex flex-col items-center gap-2">
                  {googleEnabled && (
                    <GoogleSignInButton onCredential={handleGoogle} text="continue_with" />
                  )}
                  {facebookEnabled && (
                    <FacebookSignInButton onToken={handleFacebook} />
                  )}
                  {showApple && (
                    <button onClick={() => oauth('apple')} disabled={!enabled} className="btn-outline w-full py-3">
                      <AppleIcon /> Continuer avec Apple
                    </button>
                  )}
                </div>

                <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
                  <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
                </div>
              </>
            )}

            {/* Onglet Téléphone masqué tant que le SMS n'est pas activé (PHONE_LOGIN_ENABLED). */}
            {PHONE_LOGIN_ENABLED && (
              <div className="mb-4 flex rounded-xl bg-gray-100 p-1">
                <button onClick={() => { setMethod('email'); setError('') }} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${method === 'email' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>
                  <Mail size={15} className="mr-1 inline" /> Email
                </button>
                <button onClick={() => { setMethod('phone'); setError('') }} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${method === 'phone' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>
                  <Phone size={15} className="mr-1 inline" /> Téléphone
                </button>
              </div>
            )}

            {method === 'email' ? (
              <form onSubmit={submitEmail} className="space-y-3.5">
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-gray-700">Adresse email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.ci" className="input pl-10" autoComplete="email" />
                  </div>
                </div>
                <div>
                  <label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold text-gray-700">Mot de passe</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input pl-10" autoComplete="current-password" />
                  </div>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => navigate('/mot-de-passe-oublie')}
                    className="text-sm font-semibold text-primary-600"
                  >
                    Mot de passe oublié ?
                  </button>
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
                {info && <p className="rounded-xl bg-ivoire-green/10 px-4 py-3 text-sm font-medium text-ivoire-green-dark">{info}</p>}
                <button type="submit" disabled={busy || !enabled} className="btn-primary w-full py-3.5 text-base">
                  {busy ? <Loader2 size={20} className="animate-spin" /> : otpSent ? 'Vérifier le code' : 'Recevoir un code SMS'}
                </button>
              </form>
            )}

            <p className="mt-5 text-center text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <button onClick={() => navigate('/inscription', { state: { from } })} className="font-semibold text-primary-600">
                Créer un compte
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
