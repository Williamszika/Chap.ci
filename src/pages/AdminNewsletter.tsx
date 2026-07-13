import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Mail, Loader2, Lock } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { fetchNewsletter, type Subscriber } from '../lib/newsletter'

export function AdminNewsletter() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [subs, setSubs] = useState<Subscriber[]>([])
  // L'autorisation est décidée par le SERVEUR (403 = non-administrateur), pas par
  // une liste côté client — évite tout écart entre config front et back.
  const [state, setState] = useState<'loading' | 'ok' | 'denied' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      setState('denied')
      return
    }
    let alive = true
    fetchNewsletter()
      .then((data) => {
        if (!alive) return
        setSubs(data)
        setState('ok')
      })
      .catch((e) => {
        if (!alive) return
        // 403 côté serveur = non administrateur
        if (/réservé|403|forbidden/i.test((e as Error).message)) setState('denied')
        else {
          setError((e as Error).message)
          setState('error')
        }
      })
    return () => {
      alive = false
    }
  }, [user])

  const exportCsv = () => {
    const header = 'email,date_inscription\n'
    const body = subs
      .map((s) => `${s.email},${new Date(s.createdAt).toISOString().slice(0, 10)}`)
      .join('\n')
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chapci-newsletter-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-white pb-16">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-bold">Abonnés newsletter</h1>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-6">
        {state === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
            <Loader2 className="animate-spin" size={20} /> Chargement…
          </div>
        )}

        {state === 'denied' && (
          <div className="flex flex-col items-center py-16 text-center text-gray-600">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Lock size={26} />
            </span>
            <p className="mt-4 font-semibold text-gray-800">Accès réservé à l’administrateur</p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              Connectez-vous avec le compte administrateur du site pour consulter et exporter les
              abonnés.
            </p>
          </div>
        )}

        {state === 'error' && (
          <p className="py-16 text-center text-sm text-red-600">⚠️ {error}</p>
        )}

        {state === 'ok' && (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-2xl font-bold text-gray-900">{subs.length}</p>
                <p className="text-sm text-gray-500">abonné{subs.length > 1 ? 's' : ''} à la newsletter</p>
              </div>
              <button
                onClick={exportCsv}
                disabled={subs.length === 0}
                className="btn-primary py-2.5 disabled:opacity-50"
              >
                <Download size={18} /> Exporter (CSV)
              </button>
            </div>

            <p className="mb-3 text-xs text-gray-400">
              Importez le fichier CSV dans Brevo, Mailchimp ou MailerLite pour envoyer vos campagnes.
            </p>

            {subs.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">
                Aucun abonné pour l’instant. Le formulaire « Recevez nos bons plans » collectera les
                emails ici.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100">
                {subs.map((s) => (
                  <li key={s.email} className="flex items-center gap-3 px-4 py-3">
                    <Mail size={16} className="shrink-0 text-primary-500" />
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{s.email}</span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
