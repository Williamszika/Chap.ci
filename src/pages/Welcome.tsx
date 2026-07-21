import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Search, Sparkles } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { Mark, Wordmark } from '../components/Logo'

/**
 * Écran de bienvenue affiché juste après l'inscription : au lieu d'atterrir sur un
 * compte vide, on invite tout de suite à publier sa première annonce (activation).
 */
export function Welcome() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  // Accès direct sans compte (ex. lien collé) : on renvoie à l'accueil.
  useEffect(() => {
    if (!loading && !user) navigate('/', { replace: true })
  }, [loading, user, navigate])

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex items-center gap-2">
        <Mark size={30} />
        <Wordmark className="text-lg text-ink" />
      </div>

      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-card">
        <Sparkles size={30} />
      </div>
      <h1 className="mt-4 font-display text-2xl font-black text-ink">Bienvenue sur Chap.ci&nbsp;! 🎉</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Votre compte est prêt. Lancez-vous&nbsp;: publiez votre première annonce — c’est
        <b className="text-gray-700"> gratuit</b> et ça prend moins de 2&nbsp;minutes.
      </p>

      <div className="mt-6 flex w-full max-w-xs flex-col gap-2.5">
        <button onClick={() => navigate('/publier')} className="btn-primary w-full py-3.5 text-base">
          <PlusCircle size={20} /> Publier ma première annonce
        </button>
        <button onClick={() => navigate('/explorer')} className="btn-outline w-full py-3">
          <Search size={18} /> Explorer les annonces
        </button>
      </div>

      <button onClick={() => navigate('/compte')} className="mt-4 text-sm font-medium text-gray-400">
        Plus tard — aller à mon compte
      </button>
    </div>
  )
}
