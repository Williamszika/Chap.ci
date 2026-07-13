import { useEffect, useState } from 'react'
import { useAuth } from '../store/AuthContext'
import { isPhp } from './backend'
import * as php from './php'
import { isAdminEmail } from './newsletter'

/**
 * Indique si l'utilisateur connecté est administrateur.
 * En mode PHP : décidé par le SERVEUR (propriétaire OU modérateur) — fonctionne
 * quel que soit l'email, y compris pour les modérateurs ajoutés dans le tableau
 * de bord. En mode Supabase : repli sur la liste VITE_ADMIN_EMAILS.
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth()
  const [admin, setAdmin] = useState(false)

  useEffect(() => {
    let alive = true
    if (!user) { setAdmin(false); return }
    if (isPhp) {
      php.phpAdminCheck().then((v) => { if (alive) setAdmin(v) })
    } else {
      setAdmin(isAdminEmail(user.email))
    }
    return () => { alive = false }
  }, [user])

  return admin
}
