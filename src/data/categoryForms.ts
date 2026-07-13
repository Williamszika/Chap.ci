// =============================================================================
//  Formulaires adaptatifs par catégorie.
//  Chaque catégorie décide des champs standards pertinents (État, Livraison,
//  libellé du prix) et de ses attributs spécifiques (marque, année, surface…),
//  comme sur un vrai site pro. « Occasion / neuf » n'a par exemple aucun sens
//  pour un emploi, un service ou du miel.
// =============================================================================

export type AttrFieldType = 'text' | 'number' | 'chips' | 'toggle'

export interface AttrField {
  key: string
  label: string
  type: AttrFieldType
  options?: string[] // pour type 'chips'
  placeholder?: string
  unit?: string // ex : 'km', 'm²'
}

export interface CategoryForm {
  /** Afficher le sélecteur État (occasion / neuf). */
  condition: boolean
  /** Afficher l'option « Livraison possible ». */
  delivery: boolean
  /** Libellé du champ prix (défaut : « Prix (FCFA) »). */
  priceLabel?: string
  pricePlaceholder?: string
  /** Attributs spécifiques à la catégorie. */
  fields: AttrField[]
}

const DEFAULT: CategoryForm = { condition: true, delivery: true, fields: [] }

export const categoryForms: Record<string, CategoryForm> = {
  vehicules: {
    condition: true,
    delivery: false,
    fields: [
      { key: 'marque', label: 'Marque', type: 'text', placeholder: 'Ex : Toyota, Peugeot, Hyundai…' },
      { key: 'annee', label: 'Année', type: 'number', placeholder: 'Ex : 2015' },
      { key: 'kilometrage', label: 'Kilométrage', type: 'number', unit: 'km', placeholder: 'Ex : 120000' },
      { key: 'carburant', label: 'Carburant', type: 'chips', options: ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'] },
      { key: 'boite', label: 'Boîte de vitesse', type: 'chips', options: ['Manuelle', 'Automatique'] },
    ],
  },
  immobilier: {
    condition: false,
    delivery: false,
    priceLabel: 'Prix / Loyer (FCFA)',
    pricePlaceholder: 'Ex : 150000 (loyer mensuel ou prix de vente)',
    fields: [
      { key: 'transaction', label: 'Type d’offre', type: 'chips', options: ['Location', 'Vente'] },
      { key: 'pieces', label: 'Nombre de pièces', type: 'number', placeholder: 'Ex : 3' },
      { key: 'surface', label: 'Surface', type: 'number', unit: 'm²', placeholder: 'Ex : 90' },
      { key: 'meuble', label: 'Meublé', type: 'toggle' },
    ],
  },
  telephones: {
    condition: true,
    delivery: true,
    fields: [
      { key: 'marque', label: 'Marque', type: 'chips', options: ['Apple', 'Samsung', 'Tecno', 'Infinix', 'Itel', 'Xiaomi', 'Huawei', 'Nokia', 'Autre'] },
      { key: 'stockage', label: 'Stockage', type: 'chips', options: ['32 Go', '64 Go', '128 Go', '256 Go', '512 Go', '1 To'] },
      { key: 'garantie', label: 'Sous garantie', type: 'toggle' },
    ],
  },
  electronique: {
    condition: true,
    delivery: true,
    fields: [
      { key: 'marque', label: 'Marque', type: 'text', placeholder: 'Ex : HP, Sony, LG, Canon…' },
      { key: 'garantie', label: 'Sous garantie', type: 'toggle' },
    ],
  },
  maison: {
    condition: true,
    delivery: true,
    fields: [{ key: 'materiau', label: 'Matière', type: 'text', placeholder: 'Ex : Bois, métal, cuir, rotin…' }],
  },
  mode: {
    condition: true,
    delivery: true,
    fields: [
      { key: 'genre', label: 'Pour', type: 'chips', options: ['Femme', 'Homme', 'Enfant', 'Mixte'] },
      { key: 'taille', label: 'Taille', type: 'text', placeholder: 'Ex : M, 42, 39…' },
      { key: 'marque', label: 'Marque', type: 'text', placeholder: 'Ex : Nike, Zara… (optionnel)' },
    ],
  },
  emploi: {
    condition: false,
    delivery: false,
    priceLabel: 'Salaire (FCFA / mois)',
    pricePlaceholder: 'Ex : 150000 (mettez 0 si non précisé)',
    fields: [
      { key: 'contrat', label: 'Type de contrat', type: 'chips', options: ['CDI', 'CDD', 'Stage', 'Freelance', 'Temps partiel', 'Intérim'] },
      { key: 'experience', label: 'Expérience demandée', type: 'text', placeholder: 'Ex : 2 ans, débutant accepté…' },
      { key: 'entreprise', label: 'Entreprise', type: 'text', placeholder: 'Nom de l’entreprise (optionnel)' },
    ],
  },
  services: {
    condition: false,
    delivery: false,
    priceLabel: 'Tarif (FCFA)',
    pricePlaceholder: 'Ex : 20000 (mettez 0 pour « sur devis »)',
    fields: [
      { key: 'deplacement', label: 'Se déplace à domicile', type: 'toggle' },
      { key: 'dispo', label: 'Disponibilité', type: 'text', placeholder: 'Ex : 7j/7, week-ends, soirs…' },
    ],
  },
  'materiel-pro': {
    condition: true,
    delivery: true,
    fields: [{ key: 'marque', label: 'Marque', type: 'text', placeholder: 'Ex : Bosch, Caterpillar…' }],
  },
  alimentation: {
    condition: false,
    delivery: true,
    fields: [
      { key: 'quantite', label: 'Quantité / Poids', type: 'text', placeholder: 'Ex : 1 kg, 50 cl, 12 pièces' },
      { key: 'bio', label: 'Bio / Naturel', type: 'toggle' },
    ],
  },
  agriculture: {
    condition: true,
    delivery: true,
    fields: [{ key: 'quantite', label: 'Quantité disponible', type: 'text', placeholder: 'Ex : 50 kg, 1 tonne…' }],
  },
  animaux: {
    condition: false,
    delivery: false,
    fields: [
      { key: 'race', label: 'Race / Type', type: 'text', placeholder: 'Ex : Berger allemand, poule pondeuse…' },
      { key: 'age', label: 'Âge', type: 'text', placeholder: 'Ex : 3 mois' },
      { key: 'vaccine', label: 'Vacciné', type: 'toggle' },
    ],
  },
  loisirs: {
    condition: true,
    delivery: true,
    fields: [{ key: 'marque', label: 'Marque', type: 'text', placeholder: 'Ex : Adidas, Yamaha… (optionnel)' }],
  },
  bebe: {
    condition: true,
    delivery: true,
    fields: [{ key: 'age', label: 'Âge recommandé', type: 'text', placeholder: 'Ex : 0-6 mois, 2 ans…' }],
  },
}

/** Retourne la config du formulaire pour une catégorie (défaut : bien physique standard). */
export function formFor(categoryId?: string): CategoryForm {
  return categoryForms[categoryId ?? ''] ?? DEFAULT
}
