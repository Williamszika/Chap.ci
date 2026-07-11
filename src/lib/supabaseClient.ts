import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
//  Connexion à Supabase (backend)
// =============================================================================
//  Les valeurs peuvent être fournies via les variables d'environnement
//  VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (recommandé pour la production),
//  sinon les valeurs par défaut ci-dessous (projet Chap.ci) sont utilisées.
//
//  ⚠️ La clé « publishable / anon » est PUBLIQUE par conception : elle peut être
//  incluse dans une application web. La sécurité des données repose sur les
//  règles RLS définies côté Supabase (voir supabase/schema.sql).
// =============================================================================

const DEFAULT_URL = 'https://rkrppimebpufinooshdu.supabase.co'
const DEFAULT_ANON_KEY = 'sb_publishable_pD2_03kT2Em5D5P18W0mvQ_TRhqy3zI'

const url = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_URL
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_ANON_KEY

/** true si une URL et une clé sont disponibles */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'chapci.auth',
      },
    })
  : null
