// Sélecteur de backend (défini au build via VITE_BACKEND).
//  - 'php'      : backend PHP/MySQL auto-hébergé (dossier server/) — TPE Cloud.
//  - sinon      : Supabase (par défaut).
export const isPhp = import.meta.env.VITE_BACKEND === 'php'
