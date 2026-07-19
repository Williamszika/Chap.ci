import { Link } from 'react-router-dom'
import { Megaphone, PlusCircle } from 'lucide-react'

/**
 * Bannière promotionnelle / espace publicitaire — placée entre le héros et les
 * catégories sur l'accueil. Sert à la mise en avant (annonces, promos) et de
 * point d'entrée pour les personnes qui veulent annoncer sur Chap.ci.
 */
export function PromoBanner() {
  return (
    <section className="px-4 pt-2">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 to-accent-gold p-6 text-white shadow-card-lg md:flex md:items-center md:justify-between md:gap-8 md:p-9">
        {/* Texture diagonale discrète (identité « affiche ») */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(135deg,#fff 0 2px,transparent 2px 14px)' }}
        />
        {/* Halo lumineux pour donner de la profondeur à l'espace pub */}
        <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-white/15 blur-2xl" />
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur">
          <Megaphone size={13} /> Publicité
        </span>

        <div className="relative">
          <h2 className="font-display text-2xl font-extrabold leading-tight md:text-4xl">
            Vendez chap-chap, près de chez vous 🧡
          </h2>
          <p className="mt-2 max-w-xl text-[15px] text-white/90 md:text-lg">
            Des milliers d’acheteurs à Abidjan et partout en Côte d’Ivoire. Publier est 100 % gratuit.
          </p>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center gap-4 md:mt-0 md:shrink-0 md:flex-col md:items-end">
          <Link
            to="/publier"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-display font-bold text-primary-700 shadow-sm transition hover:bg-cream-100 active:scale-95 md:text-lg"
          >
            <PlusCircle size={20} /> Publier une annonce
          </Link>
          <Link
            to="/contact"
            className="text-[15px] font-semibold text-white/90 underline-offset-2 hover:underline"
          >
            Annoncer ici ?
          </Link>
        </div>
      </div>
    </section>
  )
}
