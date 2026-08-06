import type { Category } from '../types'
import { sousDe } from './sous/noms'

/**
 * Les catégories de Chap.ci, adaptées au marché ivoirien.
 * Les icônes correspondent à des composants de `lucide-react`.
 *
 * QUINZE CATÉGORIES.
 * Deux ont été fondues dans une autre, parce qu'elles racontaient la même
 * chose deux fois et forçaient le vendeur à deviner où poster :
 *
 *   • « Téléphones » → Électronique. Un téléphone EST un appareil
 *     électronique, et l'acheteur qui compare un smartphone à une tablette
 *     n'a aucune raison de changer de rayon.
 *   • « Agriculture » → Alimentation pour ce qui se mange (vivriers, cacao,
 *     semences), Animaux pour l'élevage, Matériel Pro pour les tracteurs.
 *     Un régime de bananes se vendait des deux côtés ; personne ne savait
 *     lequel regarder.
 *
 * Les annonces déjà publiées sous les anciens identifiants ne sont pas
 * perdues : le serveur les reclasse une fois pour toutes au déploiement
 * (`fusion_categories` dans server/index.php).
 *
 * LES SOUS-CATÉGORIES NE SONT PLUS ÉCRITES ICI.
 * Elles viennent de `data/sous/`, où chacune porte son formulaire. Les écrire
 * à deux endroits, c'est garantir qu'ils divergeront : une sous-catégorie
 * proposée sans schéma tombe sur un formulaire générique, et un schéma sans
 * sous-catégorie n'est jamais atteignable. L'immobilier fait exception — son
 * dossier foncier est plus ancien et plus riche que ce contrat.
 */
export const categories: Category[] = [
  {
    id: 'electronique',
    name: 'Électronique',
    icon: 'Smartphone',
    color: 'bg-amber-100 text-amber-700',
    subcategories: sousDe('electronique'),
  },
  {
    id: 'vehicules',
    name: 'Véhicules',
    icon: 'Car',
    color: 'bg-sky-100 text-sky-700',
    subcategories: sousDe('vehicules'),
  },
  {
    id: 'immobilier',
    name: 'Immobilier',
    icon: 'Home',
    color: 'bg-ivoire-green/15 text-ivoire-green-dark',
    subcategories: ['Location', 'Vente', 'Terrains', 'Bureaux & Commerces', 'Colocation', 'Location vacances'],
  },
  {
    id: 'mode',
    name: 'Mode & Beauté',
    icon: 'Shirt',
    color: 'bg-rose-100 text-rose-700',
    subcategories: sousDe('mode'),
  },
  {
    id: 'maison',
    name: 'Maison & Meubles',
    icon: 'Sofa',
    color: 'bg-orange-100 text-orange-700',
    subcategories: sousDe('maison'),
  },
  {
    id: 'emploi',
    name: 'Emploi',
    icon: 'Briefcase',
    color: 'bg-stone-100 text-stone-700',
    subcategories: sousDe('emploi'),
  },
  {
    id: 'services',
    name: 'Services',
    icon: 'Wrench',
    color: 'bg-teal-100 text-teal-700',
    subcategories: sousDe('services'),
  },
  {
    id: 'materiel-pro',
    name: 'Matériel Pro',
    icon: 'HardHat',
    color: 'bg-yellow-100 text-yellow-700',
    subcategories: sousDe('materiel-pro'),
  },
  {
    id: 'alimentation',
    name: 'Alimentation & Boissons',
    icon: 'Apple',
    color: 'bg-red-100 text-red-700',
    subcategories: sousDe('alimentation'),
  },
  {
    id: 'animaux',
    name: 'Animaux',
    icon: 'PawPrint',
    color: 'bg-emerald-100 text-emerald-700',
    subcategories: sousDe('animaux'),
  },
  {
    id: 'loisirs',
    name: 'Loisirs & Sport',
    icon: 'Dumbbell',
    color: 'bg-fuchsia-100 text-fuchsia-700',
    subcategories: sousDe('loisirs'),
  },
  {
    id: 'bebe',
    name: 'Bébé & Enfant',
    icon: 'Baby',
    color: 'bg-pink-100 text-pink-700',
    subcategories: sousDe('bebe'),
  },
  // ⚠️ Santé : catégorie VOLONTAIREMENT SANS MÉDICAMENTS.
  // La vente de médicaments — y compris les remèdes traditionnels présentés
  // comme tels — est réservée aux pharmaciens en Côte d'Ivoire, et Google Play
  // interdit les applications qui facilitent la vente de produits
  // pharmaceutiques non approuvés. C'est aussi, depuis toujours, un motif de
  // masquage immédiat dans nos règles de modération.
  // N'ajoutez JAMAIS de sous-catégorie « Médicaments » ici sans avoir d'abord
  // fait valider la question par un pharmacien ou un juriste.
  {
    id: 'sante',
    name: 'Santé & Bien-être',
    icon: 'HeartPulse',
    color: 'bg-teal-100 text-teal-700',
    subcategories: sousDe('sante'),
  },
  // ⚠️ Voyage : c'est, après la Santé, la catégorie où une annonce de trop coûte
  // le plus cher — la victime paie d'avance, part, et n'a plus aucun recours à
  // trois mille kilomètres. Quatre garde-fous sont posés dans les schémas et
  // refusent la publication : « visa garanti » (seul un consulat délivre un
  // visa), l'argent réclamé avant tout contrat écrit, les frais de placement
  // mis à la charge d'un candidat au travail à l'étranger (convention n° 181
  // de l'OIT), et le passage sans visa par la route ou par la mer.
  // N'assouplissez aucun de ces quatre points sans avoir lu `sous/voyage.ts`.
  {
    id: 'voyage',
    name: 'Voyage',
    icon: 'Plane',
    color: 'bg-indigo-100 text-indigo-700',
    subcategories: sousDe('voyage'),
  },
  // « À donner » est la seule rubrique sans prix : il y est forcé à zéro, et
  // l'annonce s'affiche « Gratuit ». Elle vient en dernier volontairement — mise
  // en tête, elle noierait la place de marché sous les objets gratuits.
  {
    id: 'a-donner',
    name: 'À donner',
    icon: 'Gift',
    color: 'bg-ivoire-green/15 text-ivoire-green-dark',
    subcategories: sousDe('a-donner'),
  },
]

export const categoryById = (id?: string) => categories.find((c) => c.id === id)

// -----------------------------------------------------------------------------
//  Les anciens identifiants.
//
//  Une annonce publiée avant la fusion porte encore `telephones` ou
//  `agriculture`. Le serveur les reclasse au déploiement, mais un lien partagé
//  sur WhatsApp il y a trois mois, un favori enregistré, une alerte
//  enregistrée par un acheteur — tout cela continue de circuler avec l'ancien
//  nom. On le traduit ici plutôt que de renvoyer une page vide.
// -----------------------------------------------------------------------------

/** L'ancien identifiant de catégorie → le nouveau. */
export const CATEGORIES_FUSIONNEES: Record<string, string> = {
  telephones: 'electronique',
  agriculture: 'alimentation',
}

/** L'identifiant courant d'une catégorie, ancien ou nouveau. */
export function categorieCourante(id?: string): string {
  if (!id) return ''
  return CATEGORIES_FUSIONNEES[id] ?? id
}
