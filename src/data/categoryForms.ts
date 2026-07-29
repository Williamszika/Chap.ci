// Raccourcis de lisibilité pour les conditions du formulaire immobilier.
// La source de vérité reste foncier.ts.
import { estBati as bati, estUrbain as urbain } from './foncier'

// =============================================================================
//  Formulaires adaptatifs par catégorie.
//  Chaque catégorie décide des champs standards pertinents (État, Livraison,
//  libellé du prix) et de ses attributs spécifiques (marque, année, surface…),
//  comme sur un vrai site pro. « Occasion / neuf » n'a par exemple aucun sens
//  pour un emploi, un service ou du miel.
// =============================================================================

export type AttrFieldType =
  | 'text'
  | 'number'
  | 'chips'
  | 'toggle'
  /** Puces à choix multiple ; les valeurs sont stockées séparées par « , ». */
  | 'multi'
  /** Bloc spécial : les documents fonciers détenus + leurs numéros (immobilier). */
  | 'docs'

export interface AttrField {
  key: string
  label: string
  type: AttrFieldType
  options?: string[] // pour 'chips' et 'multi'
  placeholder?: string
  unit?: string // ex : 'km', 'm²'
  /** Texte d'aide sous le champ. */
  help?: string
  /** Champ exigé pour publier. Le message est composé à partir de `label`. */
  required?: boolean
  /**
   * Visibilité conditionnelle : reçoit les attributs déjà saisis. Un champ
   * masqué n'est jamais exigé, et sa valeur est effacée à l'enregistrement.
   */
  when?: (a: Record<string, string>) => boolean
}

export interface CategoryForm {
  /**
   * Exemple de titre, montré en filigrane dans le champ « Titre de l'annonce ».
   * Il doit parler de CE QUE l'on vend : un exemple d'iPhone au-dessus d'un
   * formulaire de terrain n'aide personne et donne l'impression d'un site qui
   * ne regarde pas ce qu'on lui dit.
   */
  titlePlaceholder?: string
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
    titlePlaceholder: 'Ex : Toyota Corolla 2015, essence, 120 000 km',
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
  // ---------------------------------------------------------------------------
  //  Immobilier — le formulaire le plus exigeant du site, et c'est voulu.
  //
  //  Vendre un terrain en Côte d'Ivoire suppose de dire quel document on
  //  détient : trois seulement donnent la propriété. La question est donc posée
  //  d'abord, et la réponse est affichée en clair sur l'annonce. Le référentiel
  //  vit dans src/data/foncier.ts ; le bloc `docs` est rendu par un composant
  //  dédié, parce qu'il engendre un champ « numéro » par document coché.
  //
  //  Une LOCATION ne déclenche rien de tout cela.
  // ---------------------------------------------------------------------------
  immobilier: {
    titlePlaceholder: 'Ex : Terrain 500 m² à Bingerville, ACD',
    condition: false,
    delivery: false,
    priceLabel: 'Prix / Loyer (FCFA)',
    pricePlaceholder: 'Ex : 150000 (loyer mensuel ou prix de vente)',
    fields: [
      { key: 'transaction', label: 'Type d’offre', type: 'chips', options: ['Vente', 'Location'], required: true },
      { key: 'nature', label: 'Nature du bien', type: 'chips', required: true,
        options: ['Terrain nu', 'Terrain agricole', 'Maison / Villa', 'Appartement', 'Immeuble', 'Bureau / Commerce'] },
      { key: 'zone', label: 'Zone', type: 'chips', required: true,
        options: ['Zone urbaine (lotissement)', 'Zone rurale (domaine coutumier)'],
        when: (a) => a.transaction === 'Vente' },
      { key: 'surface', label: 'Superficie du terrain', type: 'number', unit: 'm²', placeholder: 'Ex : 500', required: true },
      { key: 'habitable', label: 'Surface habitable', type: 'number', unit: 'm²', placeholder: 'Ex : 180',
        when: (a) => bati(a.nature) },
      { key: 'pieces', label: 'Nombre de pièces', type: 'number', placeholder: 'Ex : 4', when: (a) => bati(a.nature) },
      { key: 'chambres', label: 'Chambres', type: 'number', placeholder: 'Ex : 3', when: (a) => bati(a.nature) },
      { key: 'sdb', label: 'Salles d’eau', type: 'number', placeholder: 'Ex : 2', when: (a) => bati(a.nature) },
      { key: 'etat', label: 'État du bâti', type: 'chips',
        options: ['Neuf', 'Bon état', 'À rafraîchir', 'À rénover', 'En construction'],
        when: (a) => bati(a.nature) },
      { key: 'meuble', label: 'Meublé', type: 'toggle',
        when: (a) => a.transaction === 'Location' && bati(a.nature) },

      // --- Le dossier foncier (vente uniquement) -----------------------------
      { key: 'docs', label: 'Documents que vous détenez', type: 'docs', required: true,
        help: 'Cochez tout ce que vous avez. Un vendeur détient souvent plusieurs pièces à la fois.',
        when: (a) => a.transaction === 'Vente' },
      { key: 'lotissement', label: 'Nom du lotissement', type: 'text', placeholder: 'Ex : Extension Nord 2',
        when: (a) => a.transaction === 'Vente' && urbain(a.zone) },
      { key: 'lot', label: 'N° de lot et d’îlot', type: 'text', placeholder: 'Ex : lot 214, îlot 12',
        when: (a) => a.transaction === 'Vente' && urbain(a.zone) },
      { key: 'idufci', label: 'Identifiant IDUFCI de la parcelle', type: 'text', required: true,
        placeholder: 'Communiqué par votre géomètre',
        help: 'Numéro unique attribué à chaque parcelle du pays depuis 2019. Il figure sur les documents récents ; sinon votre notaire ou votre géomètre agréé peut vous le donner — eux seuls ont accès à la plateforme.',
        when: (a) => a.transaction === 'Vente' },
      { key: 'titulaire', label: 'Vos documents sont établis au nom de', type: 'chips', required: true,
        options: ['Moi-même', 'Un parent (succession)', 'Ma société', 'Un tiers (procuration)'],
        when: (a) => a.transaction === 'Vente' },
      { key: 'bornage', label: 'Bornage du terrain', type: 'chips', required: true,
        options: ['Borné (géomètre agréé)', 'Non borné', 'Je ne sais pas'],
        help: 'Un terrain borné par un géomètre agréé se vend mieux, et plus vite.',
        when: (a) => a.transaction === 'Vente' },
      { key: 'plan', label: 'Plan de situation ou de lotissement disponible', type: 'toggle',
        when: (a) => a.transaction === 'Vente' },
      { key: 'permis', label: 'Permis de construire', type: 'toggle',
        when: (a) => a.transaction === 'Vente' && bati(a.nature) },
      { key: 'conformite', label: 'Certificat de conformité', type: 'toggle',
        when: (a) => a.transaction === 'Vente' && bati(a.nature) },

      // --- Situation du bien -------------------------------------------------
      { key: 'juridique', label: 'Situation juridique', type: 'chips', required: true,
        options: ['Libre de tout litige', 'Succession en cours', 'Litige en cours', 'Hypothèque en cours'],
        when: (a) => a.transaction === 'Vente' },
      { key: 'occupation', label: 'Occupation', type: 'chips', required: true,
        options: ['Libre', 'Locataire en place', 'Occupé par des tiers', 'Cultures en place'],
        when: (a) => a.transaction === 'Vente' },
      { key: 'acces', label: 'Accès', type: 'chips',
        options: ['Voie bitumée', 'Voie carrossable', 'Piste', 'Enclavé'],
        when: (a) => a.transaction === 'Vente' },
      { key: 'viabilisation', label: 'Viabilisation', type: 'multi',
        options: ['Eau (SODECI)', 'Électricité (CIE)', 'Assainissement', 'Éclairage public'],
        when: (a) => a.transaction === 'Vente' },

      // --- Vente et frais ----------------------------------------------------
      { key: 'vendeur', label: 'Vous êtes', type: 'chips', required: true,
        options: ['Propriétaire', 'Héritier', 'Mandataire', 'Agence', 'Promoteur', 'Chefferie / famille'],
        when: (a) => a.transaction === 'Vente' },
      { key: 'notaire', label: 'Vente devant notaire', type: 'toggle',
        help: 'Le transfert de propriété passe par un acte notarié : sans lui, la mutation ne peut pas être enregistrée.',
        when: (a) => a.transaction === 'Vente' },
      { key: 'frais', label: 'Frais à la charge de l’acheteur', type: 'multi',
        options: ['Frais de notaire', 'Droits d’enregistrement', 'Mutation / transfert', 'Bornage', 'Commission d’agence'],
        when: (a) => a.transaction === 'Vente' },
    ],
  },
  telephones: {
    titlePlaceholder: 'Ex : iPhone 13 Pro 256 Go comme neuf',
    condition: true,
    delivery: true,
    fields: [
      { key: 'marque', label: 'Marque', type: 'chips', options: ['Apple', 'Samsung', 'Tecno', 'Infinix', 'Itel', 'Xiaomi', 'Huawei', 'Nokia', 'Autre'] },
      { key: 'stockage', label: 'Stockage', type: 'chips', options: ['32 Go', '64 Go', '128 Go', '256 Go', '512 Go', '1 To'] },
      { key: 'garantie', label: 'Sous garantie', type: 'toggle' },
    ],
  },
  electronique: {
    titlePlaceholder: 'Ex : Ordinateur portable HP 15 pouces, 8 Go',
    condition: true,
    delivery: true,
    fields: [
      { key: 'marque', label: 'Marque', type: 'text', placeholder: 'Ex : HP, Sony, LG, Canon…' },
      { key: 'garantie', label: 'Sous garantie', type: 'toggle' },
    ],
  },
  maison: {
    titlePlaceholder: 'Ex : Salon 5 places en cuir, très bon état',
    condition: true,
    delivery: true,
    fields: [{ key: 'materiau', label: 'Matière', type: 'text', placeholder: 'Ex : Bois, métal, cuir, rotin…' }],
  },
  mode: {
    titlePlaceholder: 'Ex : Pagne wax 6 yards, neuf',
    condition: true,
    delivery: true,
    fields: [
      { key: 'genre', label: 'Pour', type: 'chips', options: ['Femme', 'Homme', 'Enfant', 'Mixte'] },
      { key: 'taille', label: 'Taille', type: 'text', placeholder: 'Ex : M, 42, 39…' },
      { key: 'marque', label: 'Marque', type: 'text', placeholder: 'Ex : Nike, Zara… (optionnel)' },
    ],
  },
  emploi: {
    titlePlaceholder: 'Ex : Caissière — supermarché à Cocody',
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
    titlePlaceholder: 'Ex : Plombier — dépannage à domicile, Abidjan',
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
    titlePlaceholder: 'Ex : Groupe électrogène 5 kVA, peu servi',
    condition: true,
    delivery: true,
    fields: [{ key: 'marque', label: 'Marque', type: 'text', placeholder: 'Ex : Bosch, Caterpillar…' }],
  },
  alimentation: {
    titlePlaceholder: 'Ex : Huile rouge de Man, bidon de 5 litres',
    condition: false,
    delivery: true,
    fields: [
      { key: 'quantite', label: 'Quantité / Poids', type: 'text', placeholder: 'Ex : 1 kg, 50 cl, 12 pièces' },
      { key: 'bio', label: 'Bio / Naturel', type: 'toggle' },
    ],
  },
  agriculture: {
    titlePlaceholder: 'Ex : Semences de maïs, sac de 25 kg',
    // Produits agricoles (récoltes, semences, aliments) : « occasion / neuf »
    // n'a pas de sens.
    condition: false,
    delivery: true,
    fields: [{ key: 'quantite', label: 'Quantité disponible', type: 'text', placeholder: 'Ex : 50 kg, 1 tonne…' }],
  },
  animaux: {
    titlePlaceholder: 'Ex : Chiot berger allemand, 3 mois, vacciné',
    condition: false,
    delivery: false,
    fields: [
      { key: 'race', label: 'Race / Type', type: 'text', placeholder: 'Ex : Berger allemand, poule pondeuse…' },
      { key: 'age', label: 'Âge', type: 'text', placeholder: 'Ex : 3 mois' },
      { key: 'vaccine', label: 'Vacciné', type: 'toggle' },
    ],
  },
  loisirs: {
    titlePlaceholder: 'Ex : Vélo VTT 26 pouces, bon état',
    condition: true,
    delivery: true,
    fields: [{ key: 'marque', label: 'Marque', type: 'text', placeholder: 'Ex : Adidas, Yamaha… (optionnel)' }],
  },
  bebe: {
    titlePlaceholder: 'Ex : Poussette 3 roues, pliable',
    condition: true,
    delivery: true,
    fields: [{ key: 'age', label: 'Âge recommandé', type: 'text', placeholder: 'Ex : 0-6 mois, 2 ans…' }],
  },
}

/** Retourne la config du formulaire pour une catégorie (défaut : bien physique standard). */
export function formFor(categoryId?: string): CategoryForm {
  return categoryForms[categoryId ?? ''] ?? DEFAULT
}
