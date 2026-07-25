import { MapPin, ChevronRight } from 'lucide-react'
import { categories } from '../data/categories'
import { CategoryIcon } from './CategoryIcon'
import { useGeo } from '../store/GeoContext'

// Villes SEO — DOIT rester aligné avec web/seo.php → chapci_seo_cities().
// (slug => nom affiché). Sert à construire les liens /vendre/{cat}/{ville}.
const SEO_CITIES: Record<string, string> = {
  abidjan: 'Abidjan', cocody: 'Cocody', yopougon: 'Yopougon', abobo: 'Abobo',
  marcory: 'Marcory', treichville: 'Treichville', plateau: 'Plateau', adjame: 'Adjamé',
  koumassi: 'Koumassi', 'port-bouet': 'Port-Bouët', anyama: 'Anyama', 'grand-bassam': 'Grand-Bassam',
  bouake: 'Bouaké', yamoussoukro: 'Yamoussoukro', daloa: 'Daloa', 'san-pedro': 'San-Pédro',
  korhogo: 'Korhogo', man: 'Man', gagnoa: 'Gagnoa', divo: 'Divo', abengourou: 'Abengourou',
}
// Villes mises en avant dans la rangée « Autres villes » (grosses zones + communes actives).
const POPULAR = ['abidjan', 'cocody', 'yopougon', 'abobo', 'marcory', 'bouake', 'yamoussoukro', 'san-pedro']

/** Minuscules, sans accents, en slug : « Port-Bouët » -> « port-bouet ». */
function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/**
 * Section « Vendez près de chez vous » : cartes catégories pointant vers les
 * pages d'atterrissage SEO /vendre/{catégorie}/{ville}. Double objectif :
 *   1) maillage interne (liens crawlables de l'accueil vers les pages SEO) ;
 *   2) pousser le visiteur vers la publication (chaque page a un CTA « Publier »).
 * Les liens sont de vrais <a href> : navigation pleine page vers le rendu serveur
 * (hors app SPA), donc suivis par Google. Personnalisé par la commune détectée
 * (défaut Abidjan — c'est aussi ce que voit Googlebot, sans géoloc).
 */
export function SellNearYou() {
  const { place } = useGeo()
  const communeSlug = place?.commune ? slugify(place.commune) : ''
  const citySlug = SEO_CITIES[communeSlug] ? communeSlug : 'abidjan'
  const cityName = SEO_CITIES[citySlug]
  const topCats = categories.slice(0, 6)

  return (
    <section className="px-4 py-5">
      <div className="mb-3">
        <h2 className="font-display text-[17px] font-extrabold tracking-tight text-gray-900">
          Vendez près de chez vous 🇨🇮
        </h2>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
          <MapPin size={13} className="shrink-0 text-ivoire-green" />
          Publiez gratuitement à {cityName} — vendez à des acheteurs proches.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {topCats.map((cat) => (
          <a
            key={cat.id}
            href={`/vendre/${cat.id}/${citySlug}`}
            className="group flex items-center gap-2.5 rounded-2xl border border-line bg-white p-3 shadow-sm transition active:scale-[0.98] md:hover:border-ivoire-green/40"
          >
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${cat.color}`}>
              <CategoryIcon name={cat.icon} size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-bold text-gray-900">{cat.name}</span>
              <span className="block truncate text-[11px] text-gray-500">à {cityName}</span>
            </span>
            <ChevronRight size={15} className="shrink-0 text-gray-300 transition group-hover:text-ivoire-green" />
          </a>
        ))}
      </div>

      {/* Autres villes — maillage interne vers d'autres pages /vendre. */}
      <div className="mt-3.5">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">Autres villes</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR.filter((c) => c !== citySlug).map((c) => (
            <a
              key={c}
              href={`/vendre/telephones/${c}`}
              className="rounded-full border border-line2 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 transition active:scale-95 md:hover:border-ivoire-green/40 md:hover:text-ivoire-green-dark"
            >
              {SEO_CITIES[c]}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
