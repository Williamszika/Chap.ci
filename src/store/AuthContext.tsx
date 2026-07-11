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

interface AuthResult {
  error?: string
  needsConfirmation?: boolean
}

interface AuthState {
  user: User | null
  loading: boolean
  /** true si Supabase est configuré (comptes disponibles) */
  enabled: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

/** Traduit les messages d'erreur Supabase en français. */
function frError(message?: string): string {
  if (!message) return 'Une erreur est survenue.'
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'Email ou mot de passe incorrect.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Cet email a déjà un compte. Connectez-vous.'
  if (m.includes('password') && m.includes('6')) return 'Le mot de passe doit faire au moins 6 caractères.'
  if (m.includes('email') && m.includes('valid')) return 'Adresse email invalide.'
  if (m.includes('confirm')) return 'Veuillez confirmer votre email avant de vous connecter.'
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, fullName: string): Promise<AuthResult> => {
      if (!supabase) return { error: 'Comptes indisponibles (Supabase non configuré).' }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) return { error: frError(error.message) }
      // Si la confirmation par email est activée, pas de session immédiate.
      if (!data.session) return { needsConfirmation: true }
      return {}
    },
    [],
  )

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Comptes indisponibles (Supabase non configuré).' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: frError(error.message) }
    return {}
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  const value: AuthState = {
    user,
    loading,
    enabled: isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
