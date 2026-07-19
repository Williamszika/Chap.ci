import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import * as php from '../lib/php'

/**
 * Utilisateur connecté. Le site est 100 % auto-hébergé sur la base TPE Cloud
 * (backend PHP `server/`), unique backend du site.
 */
export interface User {
  id: string
  email: string
  user_metadata?: { full_name?: string | null; avatar_url?: string | null }
}

const NOT_AVAILABLE = { error: 'Cette fonction n’est pas disponible sur ce site.' }

interface AuthResult {
  error?: string
  needsConfirmation?: boolean
  mfaRequired?: boolean
  userId?: string
  /** En mode test serveur (SMS debug) : code renvoyé pour tester sans SMS réel. */
  debugCode?: string
  /** Codes de secours 2FA, renvoyés une seule fois à l'activation. */
  recoveryCodes?: string[]
}

export type OAuthProvider = 'google' | 'apple' | 'facebook'

interface EnrollResult {
  factorId?: string
  /** URI otpauth:// à scanner (QR) ou à ouvrir dans l'app d'authentification. */
  uri?: string
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
  /** Connexion Facebook via le jeton d'accès du SDK Facebook. */
  signInWithFacebookToken: (accessToken: string) => Promise<AuthResult>
  sendPhoneCode: (phone: string) => Promise<AuthResult>
  verifyPhoneCode: (phone: string, token: string, fullName?: string) => Promise<AuthResult>
  verifyLoginMfa: (code: string) => Promise<AuthResult>
  hasPendingMfa: () => boolean
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<AuthResult>
  updatePassword: (newPassword: string, currentPassword?: string) => Promise<AuthResult>
  /** true après un clic sur le lien de récupération de mot de passe reçu par email */
  recovery: boolean
  clearRecovery: () => void
  deleteAccount: (password?: string) => Promise<AuthResult>
  // 2FA (TOTP)
  enrollTotp: () => Promise<EnrollResult>
  activateTotp: (factorId: string, code: string) => Promise<AuthResult>
  listTotp: () => Promise<{ id: string; status: string }[]>
  unenrollTotp: (code: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthState | null>(null)

/** Traduit en français les messages d'erreur techniques éventuels. */
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
  // Échecs réseau bruts du navigateur (Safari « Load failed », Chrome « Failed to
  // fetch »…) : message clair au lieu du jargon technique.
  if (m.includes('load failed') || m.includes('failed to fetch') || m.includes('networkerror') || m.includes('network request failed'))
    return 'Connexion au serveur impossible. Vérifiez votre connexion internet et réessayez.'
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [recovery] = useState(false)

  useEffect(() => {
    // Affichage instantané depuis le cache, puis confirmation par le serveur
    // (session portée par le cookie HttpOnly).
    setUser(php.phpGetStoredUser() ?? null)
    php.phpMe().then((u) => setUser(u ?? null)).finally(() => setLoading(false))
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string): Promise<AuthResult> => {
    try {
      const u = await php.phpSignup(email, password, fullName)
      setUser(u)
      return { userId: u.id }
    } catch (e) {
      return { error: frError((e as Error).message) }
    }
  }, [])

  // Jeton de défi 2FA conservé entre la saisie du mot de passe et celle du code
  // (en mémoire uniquement : jamais persisté).
  const mfaTokenRef = useRef('')

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const r = await php.phpLogin(email, password)
      if (r.mfaRequired) {
        mfaTokenRef.current = r.mfaToken || ''
        return { mfaRequired: true }
      }
      if (r.user) setUser(r.user)
      return {}
    } catch (e) {
      return { error: frError((e as Error).message) }
    }
  }, [])

  // Connexion OAuth par redirection : non disponible (on utilise Google/Facebook
  // par jeton, ci-dessous).
  const signInWithProvider = useCallback(async (_provider: OAuthProvider): Promise<AuthResult> => NOT_AVAILABLE, [])

  const signInWithGoogleCredential = useCallback(async (credential: string): Promise<AuthResult> => {
    try {
      const u = await php.phpGoogleLogin(credential)
      setUser(u)
      return { userId: u.id }
    } catch (e) {
      return { error: frError((e as Error).message) }
    }
  }, [])

  const signInWithFacebookToken = useCallback(async (accessToken: string): Promise<AuthResult> => {
    try {
      const u = await php.phpFacebookLogin(accessToken)
      setUser(u)
      return { userId: u.id }
    } catch (e) {
      return { error: frError((e as Error).message) }
    }
  }, [])

  const sendPhoneCode = useCallback(async (phone: string): Promise<AuthResult> => {
    try {
      const r = await php.phpPhoneStart(phone)
      return { debugCode: r.debugCode }
    } catch (e) {
      return { error: frError((e as Error).message) }
    }
  }, [])

  const verifyPhoneCode = useCallback(
    async (phone: string, token: string, fullName?: string): Promise<AuthResult> => {
      try {
        const u = await php.phpPhoneVerify(phone, token, fullName)
        setUser(u)
        return { userId: u.id }
      } catch (e) {
        return { error: frError((e as Error).message) }
      }
    },
    [],
  )

  const verifyLoginMfa = useCallback(async (code: string): Promise<AuthResult> => {
    if (!mfaTokenRef.current) return { error: 'Session expirée. Reconnectez-vous.' }
    try {
      const u = await php.phpTwoFAVerify(mfaTokenRef.current, code)
      mfaTokenRef.current = ''
      setUser(u)
      return {}
    } catch (e) {
      return { error: frError((e as Error).message) }
    }
  }, [])
  const hasPendingMfa = useCallback(() => mfaTokenRef.current !== '', [])

  const signOut = useCallback(async () => {
    await php.phpSignOut()
    setUser(null)
  }, [])

  const sendPasswordReset = useCallback(async (_email: string): Promise<AuthResult> => ({
    error: 'La réinitialisation par email n’est pas disponible sur ce site. Contactez le support à contact@chap.ci.',
  }), [])

  const updatePassword = useCallback(async (newPassword: string, currentPassword?: string): Promise<AuthResult> => {
    try {
      await php.phpUpdatePassword(newPassword, currentPassword)
      return {}
    } catch (e) {
      return { error: frError((e as Error).message) }
    }
  }, [])

  const clearRecovery = useCallback(() => {}, [])

  const deleteAccount = useCallback(async (password = ''): Promise<AuthResult> => {
    try {
      await php.phpDeleteAccount(password)
      setUser(null)
      return {}
    } catch (e) {
      return { error: frError((e as Error).message) }
    }
  }, [])

  // — 2FA (TOTP) — application d'authentification (Google Authenticator / Authy) —
  const enrollTotp = useCallback(async (): Promise<EnrollResult> => {
    try {
      const r = await php.phpTwoFASetup()
      return { factorId: r.factorId, secret: r.secret, uri: r.uri }
    } catch (e) {
      return { error: frError((e as Error).message) }
    }
  }, [])
  const activateTotp = useCallback(async (_factorId: string, code: string): Promise<AuthResult> => {
    try {
      const r = await php.phpTwoFAActivate(code)
      return { recoveryCodes: r.recoveryCodes }
    } catch (e) {
      return { error: frError((e as Error).message) }
    }
  }, [])
  const listTotp = useCallback(async () => {
    const s = await php.phpTwoFAStatus()
    return s.enabled ? [{ id: 'totp', status: 'verified' }] : []
  }, [])
  const unenrollTotp = useCallback(async (code: string): Promise<AuthResult> => {
    try {
      await php.phpTwoFADisable(code)
      return {}
    } catch (e) {
      return { error: frError((e as Error).message) }
    }
  }, [])

  const value: AuthState = {
    user,
    loading,
    enabled: true,
    signUp,
    signIn,
    signInWithProvider,
    signInWithGoogleCredential,
    signInWithFacebookToken,
    sendPhoneCode,
    verifyPhoneCode,
    verifyLoginMfa,
    hasPendingMfa,
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
