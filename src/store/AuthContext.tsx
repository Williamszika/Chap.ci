import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { isPhp } from '../lib/backend'
import * as php from '../lib/php'

const NOT_PHP = { error: 'Indisponible en auto-hébergé (utilisez email + mot de passe).' }

interface AuthResult {
  error?: string
  needsConfirmation?: boolean
  mfaRequired?: boolean
  userId?: string
  /** En mode test serveur (SMS debug) : code renvoyé pour tester sans SMS réel. */
  debugCode?: string
}

export type OAuthProvider = 'google' | 'apple' | 'facebook'

interface EnrollResult {
  factorId?: string
  qr?: string
  secret?: string
  error?: string
}

interface AuthState {
  user: User | null
  loading: boolean
  enabled: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signInWithProvider: (provider: OAuthProvider) => Promise<AuthResult>
  /** Connexion Google via un « credential » (jeton d'identité) de Google Identity Services. */
  signInWithGoogleCredential: (credential: string) => Promise<AuthResult>
  sendPhoneCode: (phone: string) => Promise<AuthResult>
  verifyPhoneCode: (phone: string, token: string, fullName?: string) => Promise<AuthResult>
  verifyLoginMfa: (code: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<AuthResult>
  updatePassword: (newPassword: string) => Promise<AuthResult>
  /** true après un clic sur le lien de récupération de mot de passe reçu par email */
  recovery: boolean
  clearRecovery: () => void
  deleteAccount: (password?: string) => Promise<AuthResult>
  // 2FA (TOTP)
  enrollTotp: () => Promise<EnrollResult>
  activateTotp: (factorId: string, code: string) => Promise<AuthResult>
  listTotp: () => Promise<{ id: string; status: string }[]>
  unenrollTotp: (factorId: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthState | null>(null)

function frError(message?: string): string {
  if (!message) return 'Une erreur est survenue.'
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'Email ou mot de passe incorrect.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Cet email a déjà un compte. Connectez-vous.'
  if (m.includes('password') && m.includes('6')) return 'Le mot de passe doit faire au moins 6 caractères.'
  if (m.includes('email') && m.includes('valid')) return 'Adresse email invalide.'
  if (m.includes('confirm')) return 'Veuillez confirmer votre compte avant de vous connecter.'
  if (m.includes('otp') || m.includes('token')) return 'Code incorrect ou expiré.'
  if (m.includes('sms') || m.includes('phone provider') || m.includes('unsupported phone'))
    return 'La connexion par téléphone n’est pas encore activée sur le serveur.'
  if (m.includes('provider is not enabled')) return 'Ce mode de connexion n’est pas encore activé sur le serveur.'
  return message
}

const redirectTo = () => window.location.origin + (import.meta.env.BASE_URL || '/')

async function checkMfaRequired(): Promise<boolean> {
  if (!supabase) return false
  try {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    return !!data && data.nextLevel === 'aal2' && data.currentLevel !== 'aal2'
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(isPhp || isSupabaseConfigured)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    if (isPhp) {
      setUser((php.phpGetStoredUser() as unknown as User) ?? null)
      php.phpMe().then((u) => setUser((u as unknown as User) ?? null)).finally(() => setLoading(false))
      return
    }
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      // L'utilisateur a cliqué sur le lien « mot de passe oublié » reçu par email.
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string): Promise<AuthResult> => {
    if (isPhp) {
      try {
        const u = await php.phpSignup(email, password, fullName)
        setUser(u as unknown as User)
        return { userId: u.id }
      } catch (e) {
        return { error: (e as Error).message }
      }
    }
    if (!supabase) return { error: 'Comptes indisponibles (Supabase non configuré).' }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: redirectTo() },
    })
    if (error) return { error: frError(error.message) }
    if (!data.session) return { needsConfirmation: true, userId: data.user?.id }
    return { userId: data.user?.id }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (isPhp) {
      try {
        const u = await php.phpLogin(email, password)
        setUser(u as unknown as User)
        return {}
      } catch (e) {
        return { error: (e as Error).message }
      }
    }
    if (!supabase) return { error: 'Comptes indisponibles (Supabase non configuré).' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: frError(error.message) }
    if (await checkMfaRequired()) return { mfaRequired: true }
    return {}
  }, [])

  const signInWithProvider = useCallback(async (provider: OAuthProvider): Promise<AuthResult> => {
    if (isPhp) return NOT_PHP
    if (!supabase) return { error: 'Comptes indisponibles.' }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo() },
    })
    if (error) return { error: frError(error.message) }
    return {} // redirection en cours
  }, [])

  const signInWithGoogleCredential = useCallback(async (credential: string): Promise<AuthResult> => {
    if (isPhp) {
      try {
        const u = await php.phpGoogleLogin(credential)
        setUser(u as unknown as User)
        return { userId: u.id }
      } catch (e) {
        return { error: (e as Error).message }
      }
    }
    if (!supabase) return { error: 'Comptes indisponibles.' }
    const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: credential })
    if (error) return { error: frError(error.message) }
    if (await checkMfaRequired()) return { mfaRequired: true }
    return { userId: data.user?.id }
  }, [])

  const sendPhoneCode = useCallback(async (phone: string): Promise<AuthResult> => {
    if (isPhp) {
      try {
        const r = await php.phpPhoneStart(phone)
        return { debugCode: r.debugCode }
      } catch (e) {
        return { error: (e as Error).message }
      }
    }
    if (!supabase) return { error: 'Comptes indisponibles.' }
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) return { error: frError(error.message) }
    return {}
  }, [])

  const verifyPhoneCode = useCallback(
    async (phone: string, token: string, fullName?: string): Promise<AuthResult> => {
      if (isPhp) {
        try {
          const u = await php.phpPhoneVerify(phone, token, fullName)
          setUser(u as unknown as User)
          return { userId: u.id }
        } catch (e) {
          return { error: (e as Error).message }
        }
      }
      if (!supabase) return { error: 'Comptes indisponibles.' }
      const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
      if (error) return { error: frError(error.message) }
      if (fullName && fullName.trim()) {
        await supabase.auth.updateUser({ data: { full_name: fullName.trim() } })
      }
      if (await checkMfaRequired()) return { mfaRequired: true, userId: data.user?.id }
      return { userId: data.user?.id }
    },
    [],
  )

  const verifyLoginMfa = useCallback(async (code: string): Promise<AuthResult> => {
    if (isPhp) return {}
    if (!supabase) return { error: 'Comptes indisponibles.' }
    const { data: factors, error: e0 } = await supabase.auth.mfa.listFactors()
    if (e0) return { error: frError(e0.message) }
    const totp = factors?.totp?.[0]
    if (!totp) return { error: 'Aucun facteur 2FA trouvé.' }
    const { data: ch, error: e1 } = await supabase.auth.mfa.challenge({ factorId: totp.id })
    if (e1 || !ch) return { error: frError(e1?.message) }
    const { error: e2 } = await supabase.auth.mfa.verify({ factorId: totp.id, challengeId: ch.id, code })
    if (e2) return { error: frError(e2.message) }
    return {}
  }, [])

  const signOut = useCallback(async () => {
    if (isPhp) { php.phpSignOut(); setUser(null); return }
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  const sendPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    if (isPhp) return { error: 'La réinitialisation par email n’est pas disponible en auto-hébergé. Contactez le support du site.' }
    if (!supabase) return { error: 'Comptes indisponibles.' }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() })
    if (error) return { error: frError(error.message) }
    return {}
  }, [])

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    if (isPhp) {
      try { await php.phpUpdatePassword(newPassword); return {} } catch (e) { return { error: (e as Error).message } }
    }
    if (!supabase) return { error: 'Comptes indisponibles.' }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: frError(error.message) }
    return {}
  }, [])

  const clearRecovery = useCallback(() => setRecovery(false), [])

  const deleteAccount = useCallback(async (password = ''): Promise<AuthResult> => {
    if (isPhp) {
      try { await php.phpDeleteAccount(password); setUser(null); return {} } catch (e) { return { error: (e as Error).message } }
    }
    if (!supabase) return { error: 'Comptes indisponibles.' }
    const { error } = await supabase.rpc('delete_my_account')
    if (error) return { error: frError(error.message) }
    await supabase.auth.signOut()
    setUser(null)
    return {}
  }, [])

  // — 2FA (TOTP) —
  const enrollTotp = useCallback(async (): Promise<EnrollResult> => {
    if (isPhp) return NOT_PHP
    if (!supabase) return { error: 'Comptes indisponibles.' }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error) return { error: frError(error.message) }
    return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret }
  }, [])

  const activateTotp = useCallback(async (factorId: string, code: string): Promise<AuthResult> => {
    if (isPhp) return NOT_PHP
    if (!supabase) return { error: 'Comptes indisponibles.' }
    const { data: ch, error: e1 } = await supabase.auth.mfa.challenge({ factorId })
    if (e1 || !ch) return { error: frError(e1?.message) }
    const { error: e2 } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code })
    if (e2) return { error: frError(e2.message) }
    return {}
  }, [])

  const listTotp = useCallback(async () => {
    if (!supabase) return []
    const { data } = await supabase.auth.mfa.listFactors()
    return (data?.totp ?? []).map((f) => ({ id: f.id, status: f.status }))
  }, [])

  const unenrollTotp = useCallback(async (factorId: string): Promise<AuthResult> => {
    if (isPhp) return NOT_PHP
    if (!supabase) return { error: 'Comptes indisponibles.' }
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    if (error) return { error: frError(error.message) }
    return {}
  }, [])

  const value: AuthState = {
    user,
    loading,
    enabled: isPhp || isSupabaseConfigured,
    signUp,
    signIn,
    signInWithProvider,
    signInWithGoogleCredential,
    sendPhoneCode,
    verifyPhoneCode,
    verifyLoginMfa,
    signOut,
    sendPasswordReset,
    updatePassword,
    recovery,
    clearRecovery,
    deleteAccount,
    enrollTotp,
    activateTotp,
    listTotp,
    unenrollTotp,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
