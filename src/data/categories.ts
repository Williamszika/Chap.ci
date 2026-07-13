import type { Category } from '../types'

/**
 * Catégories de petites annonces, adaptées au marché ivoirien.
 * Les icônes correspondent à des composants de `lucide-react`.
 */
export const categories: Category[] = [
  {
    id: 'vehicules',
    name: 'Véhicules',
    icon: 'Car',
    color: 'bg-blue-100 text-blue-700',
    subcategories: ['Voitures', 'Motos & Scooters', 'Camions & Utilitaires', 'Pièces & Accessoires', 'Bateaux', 'Location de véhicules'],
  },
  {
    id: 'immobilier',
    name: 'Immobilier',
    icon: 'Home',
    color: 'bg-emerald-100 text-emerald-700',
    subcategories: ['Location', 'Vente', 'Terrains', 'Bureaux & Commerces', 'Colocation', 'Location vacances'],
  },
  {
    id: 'telephones',
    name: 'Téléphones',
    icon: 'Smartphone',
    color: 'bg-violet-100 text-violet-700',
    subcategories: ['Smartphones', 'Téléphones fixes', 'Accessoires', 'Tablettes', 'Réparation'],
  },
  {
    id: 'electronique',
    name: 'Électronique',
    icon: 'Laptop',
    color: 'bg-sky-100 text-sky-700',
    subcategories: ['Ordinateurs', 'TV & Écrans', 'Audio & Son', 'Jeux vidéo', 'Appareils photo', 'Accessoires informatiques'],
  },
  {
    id: 'maison',
    name: 'Maison & Meubles',
    icon: 'Sofa',
    color: 'bg-amber-100 text-amber-700',
    subcategories: ['Meubles', 'Électroménager', 'Décoration', 'Cuisine', 'Jardin & Bricolage', 'Literie'],
  },
  {
    id: 'mode',
    name: 'Mode & Beauté',
    icon: 'Shirt',
    color: 'bg-pink-100 text-pink-700',
    subcategories: ['Vêtements Femme', 'Vêtements Homme', 'Chaussures', 'Sacs & Bijoux', 'Pagnes & Tissus', 'Beauté & Cosmétiques'],
  },
  {
    id: 'emploi',
    name: 'Emploi',
    icon: 'Briefcase',
    color: 'bg-indigo-100 text-indigo-700',
    subcategories: ['Offres d’emploi', 'Demandes d’emploi', 'Stages', 'Freelance', 'Emploi maison'],
  },
  {
    id: 'services',
    name: 'Services',
    icon: 'Wrench',
    color: 'bg-teal-100 text-teal-700',
    subcategories: ['BTP & Rénovation', 'Cours & Formation', 'Événementiel', 'Transport & Déménagement', 'Informatique', 'Couture'],
  },
  {
    id: 'materiel-pro',
    name: 'Matériel Pro',
    icon: 'HardHat',
    color: 'bg-orange-100 text-orange-700',
    subcategories: ['Agriculture', 'Restauration', 'Industrie', 'Fournitures de bureau', 'Boutique & Commerce'],
  },
  {
    id: 'alimentation',
    name: 'Alimentation & Boissons',
    icon: 'Apple',
    color: 'bg-red-100 text-red-700',
    subcategories: ['Produits du terroir', 'Miel & Confitures', 'Fruits & Légumes', 'Céréales & Tubercules', 'Épices & Condiments', 'Boissons', 'Plats préparés'],
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    icon: 'Sprout',
    color: 'bg-lime-100 text-lime-700',
    subcategories: ['Produits vivriers', 'Cacao & Café', 'Élevage', 'Semences & Intrants', 'Matériel agricole'],
  },
  {
    id: 'animaux',
    name: 'Animaux',
    icon: 'PawPrint',
    color: 'bg-yellow-100 text-yellow-700',
    subcategories: ['Volaille', 'Bétail & Élevage', 'Chiens & Chats', 'Oiseaux & Poissons', 'Accessoires & Alimentation'],
  },
  {
    id: 'loisirs',
    name: 'Loisirs & Sport',
    icon: 'Dumbbell',
    color: 'bg-rose-100 text-rose-700',
    subcategories: ['Sport & Fitness', 'Instruments de musique', 'Livres', 'Jeux & Jouets', 'Vélos', 'Collections'],
  },
  {
    id: 'bebe',
    name: 'Bébé & Enfant',
    icon: 'Baby',
    color: 'bg-fuchsia-100 text-fuchsia-700',
    subcategories: ['Vêtements bébé', 'Poussettes', 'Jouets', 'Mobilier bébé', 'Matériel de puériculture'],
  },
]

export const categoryById = (id?: string) => categories.find((c) => c.id === id)
