import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Lock, Phone, User, MapPin, Loader2, ChevronDown, LocateFixed } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { useGeo } from '../store/GeoContext'
import { upsertMyProfile, type ProfileFields } from '../lib/profiles'
import { LocationSheet } from '../components/LocationSheet'
import { Mark } from '../components/Logo'
import { PasswordStrength } from '../components/PasswordStrength'
import { checkPassword } from '../lib/password'
import { subscribeNewsletter } from '../lib/newsletter'
import { getBestPosition, reverseGeocode } from '../lib/geo'
import { locationLabel, resolveLocationByName } from '../data/locations'
import type { Coords } from '../data/coords'
import type { LocationFilter } from '../types'

export function Register() {
  const navigate = useNavigate()
  const { signUp, sendPhoneCode, verifyPhoneCode, enabled } = useAuth()
  const { place } = useGeo()

  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState('')
  const [birthDate, setBirthDate] = useState('')

  const [loc, setLoc] = useState<LocationFilter>({})
  const [locOpen, setLocOpen] = useState(false)
  const [address, setAddress] = useState('')
  const [coords, setCoords] = useState<Coords | null>(null)
  const [locating, setLocating] = useState(false)

  // Pré-remplissage depuis la position captée à l'ouverture du site.
  useEffect(() => {
    if (place) {
      setLoc((prev) =>
        prev.regionId ? prev : { regionId: place.regionId, cityId: place.cityId, commune: place.commune },
      )
      setAddress((prev) => prev || place.address || '')
      if (place.lat != null && place.lng != null) {
        setCoords((prev) => prev ?? { lat: place.lat!, lng: place.lng! })
      }
    }
  }, [place])

  // Géolocalise l'utilisateur (GPS) et verrouille sa localisation.
  async function detectLocation() {
    setLocating(true)
    try {
      const fix = await getBestPosition()
      setCoords({ lat: fix.lat, lng: fix.lng })
      const geo = await reverseGeocode(fix.lat, fix.lng)
      const resolved = resolveLocationByName(geo?.suburb, geo?.city, geo?.region) ?? {}
      if (resolved.regionId) {
        setLoc({ regionId: resolved.regionId, cityId: resolved.cityId, commune: resolved.commune })
      }
      if (geo?.suburb) setAddress(geo.suburb)
    } catch {
      alert(
        'Impossible d’obtenir votre position. Autorisez la localisation dans votre navigateur, puis réessayez.',
      )
    } finally {
      setLocating(false)
    }
  }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('+225 ')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')

  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [newsletterOptIn, setNewsletterOptIn] = useState(true)

  function validateProfile(): string | null {
    if (!firstName.trim()) return 'Indiquez votre prénom.'
    if (!lastName.trim()) return 'Indiquez votre nom.'
    if (!gender) return 'Indiquez votre sexe.'
    if (!birthDate) return 'Indiquez votre date de naissance.'
    if (!loc.regionId) return 'Indiquez votre ville / commune.'
    return null
  }

  function profileFields(): ProfileFields {
    return {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      gender,
      birth_date: birthDate || null,
      region_id: loc.regionId,
      city_id: loc.cityId,
      commune: loc.commune,
      address: address.trim() || undefined,
      lat: coords?.lat ?? place?.lat ?? null,
      lng: coords?.lng ?? place?.lng ?? null,
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

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    const v = validateProfile()
    if (v) return setError(v)
    if (!accepted)
      return setError('Vous devez lire et accepter les Conditions d’utilisation et la Politique de confidentialité.')

    if (method === 'email') {
      if (!email.trim()) return setError('Renseignez votre adresse email.')
      const pw = checkPassword(password)
      if (!pw.ok) return setError(`Mot de passe trop faible — ajoutez : ${pw.missing.join(', ')}.`)
      setBusy(true)
      const res = await signUp(email.trim(), password, `${firstName.trim()} ${lastName.trim()}`)
      setBusy(false)
      if (res.error) return setError(res.error)
      // Inscription facultative à la newsletter (best-effort).
      if (newsletterOptIn) subscribeNewsletter(email.trim()).catch(() => {})
      if (res.needsConfirmation) {
        setInfo('Compte créé ! Vérifiez votre email pour confirmer, puis connectez-vous.')
        return
      }
      await saveProfileAndGo(res.userId)
    } else {
      const p = phone.replace(/\s/g, '')
      if (!otpSent) {
        if (p.length < 8) return setError('Entrez un numéro de téléphone valide (+225…).')
        setBusy(true)
        const res = await sendPhoneCode(p)
        setBusy(false)
        if (res.error) return setError(res.error)
        setOtpSent(true)
        setInfo('Un code vous a été envoyé par SMS.')
      } else {
        if (!otp.trim()) return setError('Entrez le code reçu par SMS.')
        setBusy(true)
        const res = await verifyPhoneCode(p, otp.trim(), `${firstName.trim()} ${lastName.trim()}`)
        setBusy(false)
        if (res.error) return setError(res.error)
        await saveProfileAndGo(res.userId)
      }
    }
  }

  return (
    <div className="min-h-screen bg-white pb-10">
      <header className="safe-top flex items-center gap-3 border-b border-gray-100 px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <Mark size={26} />
        <h1 className="font-display text-lg font-bold">Créer un compte</h1>
      </header>

      {!enabled && (
        <p className="mx-4 mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Les comptes ne sont pas encore activés (backend non configuré).
        </p>
      )}

      <form onSubmit={submit} className="space-y-5 px-4 py-5">
        {/* Identité */}
        <section className="space-y-3">
          <p className="text-sm font-bold text-gray-800">Vos informations</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" className="input pl-10" />
            </div>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="input appearance-none pr-9">
                <option value="">Sexe…</option>
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
                <option value="autre">Autre</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-4 text-gray-400" />
            </div>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="input text-gray-700"
              aria-label="Date de naissance"
            />
          </div>
          <p className="text-[11px] text-gray-400">Date de naissance</p>
        </section>

        {/* Localisation — géolocalisée (GPS) et verrouillée */}
        <section className="space-y-2">
          <p className="text-sm font-bold text-gray-800">Votre localisation</p>
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <span className="flex min-w-0 items-center gap-2">
              <MapPin size={18} className="shrink-0 text-primary-500" />
              <span className={`truncate text-sm ${loc.regionId ? 'font-medium text-gray-800' : 'text-gray-400'}`}>
                {loc.regionId
                  ? locationLabel(loc.regionId, loc.cityId, loc.commune)
                  : locating
                    ? 'Détection de votre position…'
                    : 'Position non détectée'}
              </span>
            </span>
            <Lock size={15} className="shrink-0 text-gray-400" />
          </div>
          <button
            type="button"
            onClick={detectLocation}
            disabled={locating}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-700 transition active:scale-[0.99] disabled:opacity-60"
          >
            <LocateFixed size={16} />
            {locating ? 'Localisation…' : loc.regionId ? 'Actualiser ma position (GPS)' : 'Activer ma position (GPS)'}
          </button>
          {!loc.regionId && !locating && (
            <button
              type="button"
              onClick={() => setLocOpen(true)}
              className="w-full text-center text-xs text-gray-400 underline"
            >
              La détection a échoué ? Choisir manuellement
            </button>
          )}
        </section>

        {/* Méthode de compte */}
        <section className="space-y-3">
          <p className="text-sm font-bold text-gray-800">Créer le compte avec</p>
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button type="button" onClick={() => { setMethod('email'); setError('') }} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${method === 'email' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>
              <Mail size={15} className="mr-1 inline" /> Email
            </button>
            <button type="button" onClick={() => { setMethod('phone'); setError('') }} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${method === 'phone' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>
              <Phone size={15} className="mr-1 inline" /> Téléphone
            </button>
          </div>

          {method === 'email' ? (
            <>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Adresse email" className="input pl-10" autoComplete="email" />
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" className="input pl-10" autoComplete="new-password" />
              </div>
              <PasswordStrength value={password} />
            </>
          ) : (
            <>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+225 07 00 00 00 00" disabled={otpSent} className="input pl-10" />
              </div>
              {otpSent && (
                <input inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="Code reçu par SMS" maxLength={6} className="input text-center text-lg tracking-widest" />
              )}
            </>
          )}
        </section>

        {/* Acceptation obligatoire des mentions légales */}
        <label className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-4 py-3">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => { setAccepted(e.target.checked); setError('') }}
            className="mt-0.5 h-5 w-5 shrink-0 accent-primary-500"
          />
          <span className="text-sm text-gray-600">
            J’ai lu et j’accepte les{' '}
            <a href="#/conditions" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-600 underline">
              Conditions d’utilisation
            </a>{' '}
            et la{' '}
            <a href="#/confidentialite" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-600 underline">
              Politique de confidentialité
            </a>.
          </span>
        </label>

        {/* Inscription facultative à la newsletter */}
        <label className="flex items-start gap-2.5 rounded-xl bg-primary-50/60 px-4 py-3">
          <input
            type="checkbox"
            checked={newsletterOptIn}
            onChange={(e) => setNewsletterOptIn(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-primary-500"
          />
          <span className="text-sm text-gray-600">
            📩 Je souhaite recevoir la <b>newsletter</b> : bons plans, promos et nouveautés. <span className="text-gray-400">(facultatif)</span>
          </span>
        </label>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
        {info && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{info}</p>}

        <button type="submit" disabled={busy || !enabled || !accepted} className="btn-primary w-full py-3.5 text-base">
          {busy ? (
            <Loader2 size={20} className="animate-spin" />
          ) : method === 'phone' && !otpSent ? (
            'Recevoir un code SMS'
          ) : (
            'Créer mon compte'
          )}
        </button>

        <p className="text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <button type="button" onClick={() => navigate('/connexion')} className="font-semibold text-primary-600">
            Se connecter
          </button>
        </p>
      </form>

      <LocationSheet open={locOpen} onClose={() => setLocOpen(false)} value={loc} onApply={setLoc} />
    </div>
  )
}
