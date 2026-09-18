/**
 * PAGE INTROUVABLE — 17/09/2026.
 *
 * Avant ce jour, `App.tsx` portait `<Route path="*" element={<Home />} />` :
 * TOUTE adresse inconnue servait l'accueil, sans un mot. Quelqu'un qui suivait
 * un lien périmé vers une annonce vendue se retrouvait sur la page d'accueil et
 * croyait s'être trompé de site — ou pire, que son lien avait été détourné.
 *
 * ⚠️ Et pour Google, c'est un « soft 404 » : une adresse morte qui répond comme
 * si elle était vivante. Google le nomme et le pénalise, parce qu'un nombre
 * infini d'adresses servant toutes le même contenu, c'est du contenu dupliqué
 * sans fond. Exactement ce que le chantier du 16/09 a passé la journée à
 * retirer du sitemap.
 *
 * Le vrai 404 — celui qui porte le code HTTP — est servi par `web/seo.php`, qui
 * répond AVANT l'application sur `/annonce/…` et `/vendeur/…`. Cette page-ci est
 * la moitié humaine : elle ne peut pas changer le code HTTP (une application
 * d'une seule page n'en a pas les moyens), mais elle peut dire la vérité et
 * offrir une suite.
 *
 * Ce qu'elle ne fait PAS : accuser le visiteur. « Erreur 404 » ne veut rien dire
 * pour quelqu'un qui cherchait une chemise. On lui dit ce qui s'est passé —
 * l'annonce a pu être vendue — et on lui rouvre une porte.
 */
import { Link } from 'react-router-dom'
import { Home as HomeIcon, Search } from 'lucide-react'

export default function Introuvable() {
  return (
    <main className="mx-auto max-w-app px-4 py-16 text-center">
      <p className="font-display text-5xl font-black text-line2" aria-hidden="true">
        404
      </p>
      <h1 className="mt-3 font-display text-2xl font-bold text-gray-900">
        Cette page n’existe pas
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-gray-600">
        L’annonce a peut-être été vendue ou retirée par son vendeur, ou l’adresse
        comporte une erreur.
      </p>
      <div className="mt-7 flex flex-col items-center gap-3">
        <Link
          to="/explorer"
          className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center gap-2
                     rounded-xl bg-action-600 px-5 font-semibold text-white"
        >
          <Search size={18} aria-hidden="true" />
          Voir toutes les annonces
        </Link>
        <Link
          to="/"
          className="inline-flex min-h-[48px] items-center justify-center gap-2 px-5
                     font-semibold text-primary-700"
        >
          <HomeIcon size={18} aria-hidden="true" />
          Retour à l’accueil
        </Link>
      </div>
    </main>
  )
}
