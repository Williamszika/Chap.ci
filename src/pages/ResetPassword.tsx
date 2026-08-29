import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { KeyRound, Loader2, Lock, Mail, ShieldCheck, Smartphone } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { PasswordStrength } from '../components/PasswordStrength'
import { checkPassword } from '../lib/password'
import { Mark, Wordmark } from '../components/Logo'
import { phpResetConfirm, ApiError } from '../lib/php'

/**
 * NOUVEAU MOT DE PASSE — le code reçu par e-mail, puis le mot de passe.
 *
 * Cet écran servait auparavant un flux qui n'existait pas : il attendait une
 * session ouverte par un lien de réinitialisation, et comme aucun lien n'était
 * jamais envoyé, il n'affichait que « Lien invalide ou expiré ». Un utilisateur
 * qui oubliait son mot de passe était perdu pour de bon.
 *
 * Deux choses méritent d'être signalées ici :
 *
 * · la DOUBLE AUTHENTIFICATION reste exigée. Si le compte l'a activée, le
 *   serveur refuse tant que le code de l'application n'accompagne pas la
 *   demande — sinon la réinitialisation par e-mail deviendrait le chemin de
 *   contournement de la 2FA : qui prend la boîte mail prend le compte.
 *
 * · après le changement, TOUTES les sessions ouvertes tombent. C'est ce qui
 *   rend la procédure utile quand le compte a réellement été volé.
 */
export function ResetPassword() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { clearRecovery } = useAuth()

  const [email, setEmail] = useState((state as { email?: string } | null)?.email ?? '')
  const [code, setCode] = useState('')
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  // Demandé seulement si le compte a la double authentification.
  const [code2fa, setCode2fa] = useState('')
  const [demande2fa, setDemande2fa] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Entrez l’adresse email de votre compte.')
    if (code.replace(/\D/g, '').length !== 6) return setError('Le code fait 6 chiffres.')
    const check = checkPassword(pw)
    if (!check.ok) return setError(`Mot de passe trop faible — ajoutez : ${check.missing.join(', ')}.`)
    if (pw !== confirm) return setError('Les deux mots de passe ne correspondent pas.')
    if (demande2fa && code2fa.replace(/\D/g, '').length < 6) {
      return setError('Entrez le code à 6 chiffres de votre application d’authentification.')
    }

    setBusy(true)
    try {
      await phpResetConfirm({
        email: email.trim(),
        code: code.replace(/\D/g, ''),
        password: pw,
        ...(demande2fa ? { code2fa: code2fa.replace(/\D/g, '') } : {}),
      })
      clearRecovery()
      setDone(true)
      setTimeout(() => navigate('/connexion'), 2200)
    } catch (err) {
      // Le serveur réclame la double authentification : on ouvre le champ au
      // lieu d'afficher une erreur sèche.
      const msg = (err as Error).message
      if (err instanceof ApiError && err.status === 401 && !demande2fa
          && /authentification/i.test(msg)) {
        setDemande2fa(true)
        setError('Ce compte est protégé par la double authentification. Entrez le code de votre application.')
      } else {
        setError(msg)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-white md:mx-auto md:my-6 md:min-h-0 md:max-w-xl md:rounded-3xl md:shadow-card">
      <div className="mx-auto max-w-sm px-6 pt-10 pb-12">
        <div className="mb-5 flex flex-col items-center text-center">
          <Mark size={56} />
          <Wordmark className="mt-3 text-2xl text-ink" />
          <p className="mt-1 text-sm text-gray-500">Nouveau mot de passe</p>
        </div>

        {done ? (
          <div className="rounded-2xl border border-ivoire-green/20 bg-ivoire-green/10 p-5 text-center">
            <ShieldCheck size={40} className="mx-auto text-ivoire-green" />
            <p className="mt-2 font-bold text-ivoire-green-dark">Mot de passe modifié ✓</p>
            <p className="mt-1 text-sm text-ivoire-green-dark">
              Toutes les sessions ouvertes ont été fermées. Connectez-vous avec votre
              nouveau mot de passe.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-gray-600">
              Entrez le code à 6 chiffres reçu par e-mail, puis choisissez votre nouveau
              mot de passe.
            </p>

            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Adresse email" className="input pl-10" autoComplete="email" />
            </div>

            <div className="relative">
              <KeyRound size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input value={code} onChange={(e) => setCode(e.target.value)}
                inputMode="numeric" maxLength={6} aria-label="Code à 6 chiffres reçu par email"
                placeholder="Code à 6 chiffres"
                className="input tnum pl-10 tracking-[0.4em]" autoComplete="one-time-code" />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                placeholder="Nouveau mot de passe" className="input pl-10"
                autoComplete="new-password" />
            </div>
            <PasswordStrength value={pw} />

            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirmer le mot de passe" className="input pl-10"
                autoComplete="new-password" />
            </div>

            {demande2fa && (
              <div className="relative">
                <Smartphone size={18} className="absolute left-3 top-3.5 text-gray-400" />
                <input value={code2fa} onChange={(e) => setCode2fa(e.target.value)}
                  inputMode="numeric" maxLength={8}
                  aria-label="Code de double authentification"
                  placeholder="Code de votre application (6 chiffres)"
                  className="input tnum pl-10" autoComplete="one-time-code" />
              </div>
            )}

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3.5 text-base">
              {busy ? <Loader2 size={20} className="animate-spin" /> : 'Enregistrer le mot de passe'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Code expiré ou jamais reçu ?{' '}
              <button type="button" onClick={() => navigate('/mot-de-passe-oublie')}
                className="font-semibold text-primary-600">
                En demander un nouveau
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
