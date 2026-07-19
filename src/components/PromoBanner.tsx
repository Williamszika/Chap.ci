import { Link } from 'react-router-dom'
import { Megaphone, PlusCircle } from 'lucide-react'

/**
 * Bannière promotionnelle / espace publicitaire — placée entre le héros et les
 * catégories sur l'accueil. Sert à la mise en avant (annonces, promos) et de
 * point d'entrée pour les personnes qui veulent annoncer sur Chap.ci.
 */
export function PromoBanner() {
  return (
    <section className="px-4 pt-1">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-accent-gold p-5 text-white shadow-card md:flex md:items-center md:justify-between md:gap-6 md:p-6">
        {/* Texture diagonale discrète (identité « affiche ») */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg,#fff 0 2px,transparent 2px 14px)' }}
        />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur">
          <Megaphone size={11} /> Publicité
        </span>

        <div className="relative">
          <h2 className="font-display text-lg font-extrabold leading-tight md:text-xl">
            Vendez chap-chap, près de chez vous 🧡
          </h2>
          <p className="mt-1 max-w-lg text-sm text-white/90">
            Des milliers d’acheteurs à Abidjan et partout en Côte d’Ivoire. Publier est 100 % gratuit.
          </p>
        </div>

        <div className="relative mt-3 flex flex-wrap items-center gap-3 md:mt-0 md:shrink-0 md:flex-col md:items-end">
          <Link
            to="/publier"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-display font-bold text-primary-700 shadow-sm transition hover:bg-cream-100 active:scale-95"
          >
            <PlusCircle size={18} /> Publier une annonce
          </Link>
          <Link
            to="/contact"
            className="text-sm font-semibold text-white/90 underline-offset-2 hover:underline"
          >
            Annoncer ici ?
          </Link>
        </div>
      </div>
    </section>
  )
}
