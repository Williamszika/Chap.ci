import { useEffect, useState } from 'react'
import { useAuth } from '../store/AuthContext'
import * as php from './php'

/**
 * Indique si l'utilisateur connecté est administrateur.
 * Décidé par le SERVEUR (propriétaire OU modérateur) — fonctionne quel que soit
 * l'email, y compris pour les modérateurs ajoutés dans le tableau de bord.
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth()
  const [admin, setAdmin] = useState(false)

  useEffect(() => {
    let alive = true
    if (!user) {
      setAdmin(false)
      return
    }
    php.phpAdminCheck().then((v) => { if (alive) setAdmin(v) }).catch(() => {})
    return () => { alive = false }
  }, [user])

  return admin
}
