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
  /** Couleurs à cocher (pastilles peintes, choix multiple) — liste dans data/couleurs.ts. */
  | 'colors'
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
  /**
   * L'aide n'est plus un conseil mais un avertissement : elle passe en rouge.
   * Posé par l'adaptateur des sous-catégories quand le texte commence par `!`.
   */
  helpRouge?: boolean
  /**
   * Ce champ peut se préciser couleur par couleur — une robe existe en rouge
   * du 38 au 44 et en noir seulement en 40. Annoncer « du 38 au 44 » fait
   * venir un acheteur qui repart déçu.
   */
  varOK?: boolean
  /** Le libellé abrégé du champ dans le bloc des variantes. */
  labelVar?: string
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

// -----------------------------------------------------------------------------
//  Sous-catégorie choisie, injectée par l'écran sous la clé réservée `_sub`.
//  Elle sert UNIQUEMENT aux conditions de visibilité : elle n'est jamais
//  enregistrée avec l'annonce (le nettoyage de PostAd l'écarte, comme tout
//  champ invisible). Sans elle, « Stockage » s'affichait pour une coque de
//  téléphone et « Marque » pour un service de réparation.
// -----------------------------------------------------------------------------
const sousCat = (a: Record<string, string>) => a._sub ?? ''
/** Smartphone ou tablette — la sous-catégorie vide (« Toutes ») compte comme tel : c'est le cas le plus fréquent. */
const telSmart = (a: Record<string, string>) => ['', 'Toutes', 'Smartphones', 'Tablettes'].includes(sousCat(a))
const telFixe = (a: Record<string, string>) => sousCat(a) === 'Téléphones fixes'
const telRep = (a: Record<string, string>) => sousCat(a) === 'Réparation'

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
      { key: 'couleurs', label: 'Couleur', type: 'colors' },
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
  // ---------------------------------------------------------------------------
  //  Téléphones — le formulaire suit la sous-catégorie.
  //
  //  Un smartphone, une coque et un service de réparation ne se décrivent pas
  //  avec les mêmes champs : « Stockage » au-dessus d'une coque faisait aussi
  //  faux que l'exemple d'iPhone au-dessus d'un terrain.
  //
  //  Et comme pour le foncier, la question qui fâche est posée AVANT l'appel :
  //  l'arnaque n° 1 du téléphone d'occasion est l'appareil encore lié au compte
  //  iCloud ou Google de l'ancien propriétaire — inutilisable une fois payé.
  //  La réponse s'affiche en clair sur l'annonce.
  // ---------------------------------------------------------------------------
  telephones: {
    titlePlaceholder: 'Ex : iPhone 13 Pro 256 Go comme neuf',
    condition: true,
    delivery: true,
    fields: [
      { key: 'marque', label: 'Marque', type: 'chips', required: true,
        options: ['Apple', 'Samsung', 'Tecno', 'Infinix', 'Itel', 'Xiaomi', 'Oppo', 'Realme', 'Huawei', 'Nokia', 'Autre'],
        when: (a) => !telRep(a) },
      { key: 'modele', label: 'Modèle', type: 'text',
        placeholder: 'Ex : iPhone 13 Pro, Galaxy A24, Spark 20',
        help: 'Le modèle exact fait trouver votre annonce : c’est lui que les acheteurs tapent dans la recherche.',
        when: (a) => telSmart(a) || telFixe(a) },
      { key: 'stockage', label: 'Stockage', type: 'chips',
        options: ['32 Go', '64 Go', '128 Go', '256 Go', '512 Go', '1 To'],
        when: telSmart },
      { key: 'ram', label: 'Mémoire (RAM)', type: 'chips',
        options: ['2 Go', '3 Go', '4 Go', '6 Go', '8 Go', '12 Go'],
        when: telSmart },
      { key: 'couleurs', label: 'Couleurs disponibles', type: 'colors',
        help: 'Vous en avez plusieurs en stock ? Cochez chaque couleur disponible.',
        when: (a) => telSmart(a) || telFixe(a) },
      { key: 'batterie', label: 'Santé de la batterie', type: 'chips',
        options: ['100 %', 'Plus de 90 %', '80 à 90 %', 'Moins de 80 %', 'Batterie changée', 'Je ne sais pas'],
        help: 'Réglages → Batterie sur iPhone. Une réponse honnête évite le retour fâché.',
        when: telSmart },
      { key: 'provenance', label: 'Provenance', type: 'chips',
        options: ['Neuf scellé (sous carton)', 'Occasion Côte d’Ivoire', 'Occasion d’Europe (« France au revoir »)'],
        when: (a) => telSmart(a) || telFixe(a) },

      // --- La question qui évite l'arnaque ------------------------------------
      { key: 'comptes', label: 'Comptes iCloud / Google', type: 'chips', required: true,
        options: ['Déconnectés — prêt à l’emploi', 'Encore liés (vendu pour pièces)'],
        help: 'Un téléphone encore lié au compte de l’ancien propriétaire est inutilisable. C’est l’arnaque n° 1 sur l’occasion : l’acheteur vérifiera avant de payer — vérifiez avant de vendre.',
        when: telSmart },
      { key: 'accessoires', label: 'Fournis avec', type: 'multi',
        options: ['Boîte d’origine', 'Facture', 'Chargeur', 'Écouteurs', 'Coque offerte'],
        help: 'La boîte d’origine permet à l’acheteur de comparer l’IMEI (*#06#) avec celui imprimé dessus.',
        when: (a) => telSmart(a) || telFixe(a) },
      { key: 'garantie', label: 'Sous garantie', type: 'toggle', when: (a) => !telRep(a) },

      // --- Sous-catégorie Réparation : un service, pas un objet ---------------
      { key: 'prestations', label: 'Ce que vous réparez', type: 'text',
        placeholder: 'Ex : écrans, batteries, connecteurs de charge, désoxydation',
        when: telRep },
      { key: 'deplacement', label: 'Se déplace à domicile', type: 'toggle', when: telRep },
    ],
  },
  electronique: {
    titlePlaceholder: 'Ex : Ordinateur portable HP 15 pouces, 8 Go',
    condition: true,
    delivery: true,
    fields: [
      { key: 'marque', label: 'Marque', type: 'text', placeholder: 'Ex : HP, Sony, LG, Canon…' },
      { key: 'couleurs', label: 'Couleur', type: 'colors' },
      { key: 'garantie', label: 'Sous garantie', type: 'toggle' },
    ],
  },
  maison: {
    titlePlaceholder: 'Ex : Salon 5 places en cuir, très bon état',
    condition: true,
    delivery: true,
    fields: [
      { key: 'materiau', label: 'Matière', type: 'text', placeholder: 'Ex : Bois, métal, cuir, rotin…' },
      { key: 'couleurs', label: 'Couleur', type: 'colors' },
    ],
  },
  mode: {
    titlePlaceholder: 'Ex : Pagne wax 6 yards, neuf',
    condition: true,
    delivery: true,
    fields: [
      { key: 'genre', label: 'Pour', type: 'chips', options: ['Femme', 'Homme', 'Enfant', 'Mixte'] },
      { key: 'taille', label: 'Taille', type: 'text', placeholder: 'Ex : M, 42, 39…' },
      { key: 'couleurs', label: 'Couleurs disponibles', type: 'colors',
        help: 'Plusieurs pièces en stock ? Cochez chaque couleur disponible.' },
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
    fields: [
      { key: 'marque', label: 'Marque', type: 'text', placeholder: 'Ex : Adidas, Yamaha… (optionnel)' },
      { key: 'couleurs', label: 'Couleur', type: 'colors' },
    ],
  },
  bebe: {
    titlePlaceholder: 'Ex : Poussette 3 roues, pliable',
    condition: true,
    delivery: true,
    fields: [
      { key: 'age', label: 'Âge recommandé', type: 'text', placeholder: 'Ex : 0-6 mois, 2 ans…' },
      { key: 'couleurs', label: 'Couleur', type: 'colors' },
    ],
  },
}

/** Retourne la config du formulaire pour une catégorie (défaut : bien physique standard). */
export function formFor(categoryId?: string): CategoryForm {
  return categoryForms[categoryId ?? ''] ?? DEFAULT
}
