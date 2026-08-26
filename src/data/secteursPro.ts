/**
 * Les comptes professionnels : types d'organisation et secteurs par type.
 *
 * MÊMES identifiants et MÊMES noms français canoniques que l'application
 * (flutter_app/lib/screens/devenir_pro_screen.dart) — c'est sous ces noms que
 * les dossiers s'enregistrent côté serveur. Modifier une liste ici sans la
 * modifier là-bas ferait diverger les deux formulaires.
 */

export interface TypePro {
  id: string
  emoji: string
  label: string
  /** Le libellé du numéro officiel demandé pour ce type. */
  numero: string
  secteurs: string[]
}

export const TYPES_PRO: TypePro[] = [
  {
    id: 'boutique', emoji: '🏪', label: 'Boutique / Commerce',
    numero: 'Numéro RCCM',
    secteurs: ['Électronique', 'Mode & Beauté', 'Maison & Meubles',
      'École & Fournitures', 'Bébé & Enfant', 'Loisirs & Sport', 'Matériel Pro'],
  },
  {
    id: 'vehicules', emoji: '🚗', label: 'Auto-moto / Garage',
    numero: 'Numéro RCCM',
    secteurs: ['Voitures', 'Motos & Scooters', 'Camions & Utilitaires',
      'Engins & Agricoles', 'Pièces & Accessoires', 'Bateaux', 'Location'],
  },
  {
    id: 'immobilier', emoji: '🏠', label: 'Agence immobilière',
    numero: 'Numéro RCCM',
    secteurs: ['Vente immobilière', 'Location & gestion', 'Terrains',
      'Résidences meublées', 'Promotion immobilière'],
  },
  {
    id: 'services', emoji: '🛠️', label: 'Artisan / Prestataire de services',
    numero: 'Numéro RCCM',
    secteurs: ['BTP & Rénovation', 'Événementiel', 'Transport & Déménagement',
      'Informatique & Digital', 'Couture & Artisanat', 'Réparation & Dépannage'],
  },
  {
    id: 'formation', emoji: '🎓', label: 'École / Centre de formation',
    numero: 'Numéro d’agrément',
    secteurs: ['École privée', 'Soutien scolaire', 'Formation professionnelle',
      'Langues', 'Cours & Formation', 'Informatique & Digital'],
  },
  {
    id: 'emploi', emoji: '🏢', label: 'Employeur / Recruteur',
    numero: 'Numéro RCCM',
    secteurs: ['Entreprise qui recrute', 'Cabinet de recrutement',
      'Intérim & placement', 'Emploi maison', 'Freelance'],
  },
  {
    id: 'voyage', emoji: '✈️', label: 'Agence de voyage',
    numero: 'Numéro d’agrément',
    secteurs: ['Billets d’avion', 'Visas & formalités', 'Études à l’étranger',
      'Travail à l’étranger', 'Séjours & circuits'],
  },
  {
    id: 'agro', emoji: '🌾', label: 'Producteur / Agro-élevage',
    numero: 'Numéro RCCM',
    secteurs: ['Produits vivriers', 'Fruits & Légumes', 'Céréales & Tubercules',
      'Cacao & Café', 'Poisson & Produits de mer', 'Volaille',
      'Bétail & Élevage', 'Semences & Intrants'],
  },
  {
    id: 'sante', emoji: '💊', label: 'Santé & Bien-être',
    numero: 'Numéro d’agrément',
    secteurs: ['Compléments & Tisanes', 'Soins & Hygiène',
      'Matériel médical de confort', 'Optique & Audition',
      'Bien-être & Massage', 'Nutrition sportive'],
  },
  {
    id: 'association', emoji: '❤️', label: 'Association / ONG',
    numero: 'Numéro de récépissé',
    secteurs: ['Aide sociale & dons', 'Éducation', 'Santé communautaire',
      'Environnement', 'Religieux & communautaire'],
  },
]

/** Libellé d'un type par identifiant (gère l'ancien nom « commerce »). */
export function labelTypePro(id: string): string {
  if (id === 'commerce') return '🏪 Boutique / Commerce'
  const t = TYPES_PRO.find((x) => x.id === id)
  return t ? `${t.emoji} ${t.label}` : id
}
