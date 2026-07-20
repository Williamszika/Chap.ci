import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Loader2, Eye, EyeOff, RefreshCw, ShieldCheck } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { FacebookSignInButton } from '../components/FacebookSignInButton'
import { usePublicConfig } from '../lib/publicConfig'
import { useGeo } from '../store/GeoContext'
import { upsertMyProfile, type ProfileFields } from '../lib/profiles'
import { Mark, Wordmark } from '../components/Logo'
import { PasswordStrength } from '../components/PasswordStrength'
import { checkPassword } from '../lib/password'
import { subscribeNewsletter } from '../lib/newsletter'

export function Register() {
  const navigate = useNavigate()
  const { signUp, signInWithGoogleCredential, signInWithFacebookToken, enabled } = useAuth()
  const cfg = usePublicConfig()
  const googleEnabled = !!cfg?.googleClientId
  const facebookEnabled = !!cfg?.facebookAppId
  // La localisation est déjà captée à l'ouverture du site (GeoContext) : on
  // l'enregistre silencieusement dans le profil, sans alourdir le formulaire.
  const { place } = useGeo()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [accepted, setAccepted] = useState(false)

  // Captcha anti-robot : un petit calcul généré côté client (sans service
  // externe ni clé secrète). L'utilisateur doit donner la bonne réponse.
  const [captcha, setCaptcha] = useState(() => ({
    a: 1 + Math.floor(Math.random() * 8),
    b: 1 + Math.floor(Math.random() * 8),
  }))
  const [captchaInput, setCaptchaInput] = useState('')
  const captchaOk = parseInt(captchaInput, 10) === captcha.a + captcha.b
  function newCaptcha() {
    setCaptcha({ a: 1 + Math.floor(Math.random() * 8), b: 1 + Math.floor(Math.random() * 8) })
    setCaptchaInput('')
  }

  // Profil minimal : on scinde « Nom complet » en prénom + nom, et on reprend
  // la localisation détectée (region/commune/GPS) sans champ dédié.
  function profileFields(): ProfileFields {
    const name = fullName.trim()
    const [first, ...rest] = name.split(/\s+/)
    return {
      first_name: first || name,
      last_name: rest.join(' '),
      full_name: name,
      region_id: place?.regionId,
      city_id: place?.cityId,
      commune: place?.commune,
      address: place?.address || undefined,
      lat: place?.lat ?? null,
      lng: place?.lng ?? null,
    }
  }

  async function saveProfileAndGo(userId?: string) {
    if (userId) {
      try {
        await upsertMyProfile(userId, profileFields())
      } catch {
        /* le profil pourra être complété dans les paramètres */
      }
    }
    navigate('/compte')
  }

  // Inscription rapide via Google : le compte (nom + email) est créé côté
  // serveur ; l'utilisateur pourra compléter son profil dans les paramètres.
  async function handleGoogleSignup(credential: string) {
    setError('')
    setBusy(true)
    const res = await signInWithGoogleCredential(credential)
    setBusy(false)
    if (res.error) return setError(res.error)
    navigate('/compte')
  }

  async function handleFacebookSignup(accessToken: string) {
    setError('')
    setBusy(true)
    const res = await signInWithFacebookToken(accessToken)
    setBusy(false)
    if (res.error) return setError(res.error)
    navigate('/compte')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!fullName.trim()) return setError('Indiquez votre nom complet.')
    if (!email.trim()) return setError('Renseignez votre adresse email.')
    const pw = checkPassword(password)
    if (!pw.ok) return setError(`Mot de passe trop faible — ajoutez : ${pw.missing.join(', ')}.`)
    if (password !== confirmPassword) return setError('Les deux mots de passe ne correspondent pas.')
    if (!captchaOk) {
      newCaptcha()
      return setError('Vérification anti-robot incorrecte. Refaites le petit calcul.')
    }
    if (!accepted)
      return setError('Vous devez lire et accepter les Conditions d’utilisation et la Politique de confidentialité.')

    setBusy(true)
    const res = await signUp(email.trim(), password, fullName.trim())
    setBusy(false)
    if (res.error) return setError(res.error)
    // Inscription facultative à la newsletter (best-effort, silencieux).
    subscribeNewsletter(email.trim()).catch(() => {})
    if (res.needsConfirmation) {
      setInfo('Compte créé ! Vérifiez votre email pour confirmer, puis connectez-vous.')
      return
    }
    await saveProfileAndGo(res.userId)
  }

  return (
    <div className="flex min-h-[72vh] items-center justify-center px-5 py-8 md:min-h-[78vh]">
      <div className="w-full max-w-sm rounded-[22px] border border-[#EFE6D7] bg-white p-6 shadow-[0_12px_34px_-10px_rgba(120,70,10,0.28),0_6px_14px_-8px_rgba(120,70,10,0.20)] md:max-w-[420px] md:p-7">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <Mark size={30} />
            <Wordmark className="text-lg text-ink" />
          </div>
          <h1 className="mt-3 font-display text-[22px] font-extrabold leading-tight text-ink">Créer un compte</h1>
          <p className="mt-1 text-sm text-gray-500">C’est gratuit, en 30 secondes.</p>
        </div>

        {!enabled && (
          <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Les comptes ne sont pas encore activés (backend non configuré).
          </p>
        )}

        {/* Inscription rapide via Google / Facebook (si configurées) */}
        {(googleEnabled || facebookEnabled) && (
          <>
            <div className="flex flex-col items-center gap-2">
              {googleEnabled && (
                <GoogleSignInButton onCredential={handleGoogleSignup} text="signup_with" />
              )}
              {facebookEnabled && (
                <FacebookSignInButton onToken={handleFacebookSignup} label="S’inscrire avec Facebook" />
              )}
            </div>
            <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
              <span className="h-px flex-1 bg-[#EFE6D7]" /> ou <span className="h-px flex-1 bg-[#EFE6D7]" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label htmlFor="reg-name" className="mb-1.5 block text-sm font-semibold text-gray-700">Nom complet</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input id="reg-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Aya Koffi" className="input pl-10" autoComplete="name" />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="mb-1.5 block text-sm font-semibold text-gray-700">Adresse email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.ci" className="input pl-10" autoComplete="email" />
            </div>
          </div>

          <div>
            <label htmlFor="reg-password" className="mb-1.5 block text-sm font-semibold text-gray-700">Mot de passe</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input id="reg-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input pl-10 pr-11" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Voir le mot de passe'} className="absolute right-2 top-1.5 grid h-9 w-9 place-items-center rounded-lg text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <PasswordStrength value={password} />
          </div>

          <div>
            <label htmlFor="reg-confirm" className="mb-1.5 block text-sm font-semibold text-gray-700">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input id="reg-confirm" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="input pl-10" autoComplete="new-password" />
            </div>
            {confirmPassword.length > 0 && confirmPassword !== password && (
              <p className="mt-1 pl-1 text-xs font-medium text-red-500">Les deux mots de passe ne correspondent pas.</p>
            )}
          </div>

          {/* Captcha anti-robot (calcul simple, sans service externe) */}
          <div>
            <label htmlFor="reg-captcha" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <ShieldCheck size={15} className="text-ivoire-green" /> Vérification anti-robot
            </label>
            <div className="flex items-center gap-2">
              <span className="select-none rounded-xl border border-[#EFE6D7] bg-[#FFF6EA] px-3.5 py-2.5 font-display text-base font-bold tracking-wide text-ink">
                {captcha.a} + {captcha.b} = ?
              </span>
              <input
                id="reg-captcha"
                inputMode="numeric"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Réponse"
                aria-label={`Combien font ${captcha.a} plus ${captcha.b} ?`}
                className={`input flex-1 ${captchaInput.length > 0 ? (captchaOk ? 'border-ivoire-green' : 'border-red-300') : ''}`}
              />
              <button
                type="button"
                onClick={newCaptcha}
                aria-label="Nouveau calcul"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#EFE6D7] bg-white text-gray-500 transition hover:text-gray-700 active:scale-95"
              >
                <RefreshCw size={17} />
              </button>
            </div>
          </div>

          {/* Acceptation obligatoire des mentions légales */}
          <label className="flex items-start gap-2.5 pt-1 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => { setAccepted(e.target.checked); setError('') }}
              className="mt-0.5 h-5 w-5 shrink-0 accent-primary-500"
            />
            <span>
              J’accepte les{' '}
              <a href="#/conditions" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-600">
                conditions
              </a>{' '}
              et la{' '}
              <a href="#/confidentialite" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-600">
                politique de confidentialité
              </a>.
            </span>
          </label>

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
          {info && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{info}</p>}

          <button type="submit" disabled={busy || !enabled || !accepted} className="btn-primary w-full py-3.5 text-base">
            {busy ? <Loader2 size={20} className="animate-spin" /> : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <button type="button" onClick={() => navigate('/connexion')} className="font-semibold text-primary-600">
            Se connecter
          </button>
        </p>
      </div>
    </div>
  )
}
