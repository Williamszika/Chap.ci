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
      'Informatique & Digital', 'Couture & Artisanat', 'Réparation & Dépannage',
      'Coiffure & Esthétique'],
  },
  {
    id: 'formation', emoji: '🎓', label: 'École / Centre de formation',
    numero: 'Numéro d’agrément',
    secteurs: ['École privée', 'Soutien scolaire', 'Formation professionnelle',
      'Langues', 'Cours & Formation', 'Informatique & Digital',
      'Auto-école', 'Université & grande école', 'Crèche & maternelle'],
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
      'Bien-être & Massage', 'Nutrition sportive',
      'Pharmacie', 'Clinique & cabinet médical'],
  },
  {
    id: 'association', emoji: '❤️', label: 'Association / ONG',
    numero: 'Numéro de récépissé',
    secteurs: ['Aide sociale & dons', 'Éducation', 'Santé communautaire',
      'Environnement', 'Religieux & communautaire'],
  },
  // Cinq types de plus le 07/09/2026, sur décision du Patron (« Ajoute
  // tout ») : un restaurant, un hôtel, une animalerie, une banque, une agence
  // de communication n'avaient aucune case où se ranger.
  {
    id: 'restauration', emoji: '🍽️', label: 'Restaurant / Alimentation',
    numero: 'Numéro RCCM',
    secteurs: ['Restaurant', 'Maquis & bar', 'Traiteur & événements',
      'Boulangerie & pâtisserie', 'Fast-food & livraison',
      'Épicerie & supermarché', 'Boissons & glaces'],
  },
  {
    id: 'hebergement', emoji: '🏨', label: 'Hôtel / Hébergement',
    numero: 'Numéro d’agrément',
    secteurs: ['Hôtel', 'Résidence meublée', 'Auberge & maison d’hôtes',
      'Location de vacances', 'Salle & espace événementiel'],
  },
  {
    id: 'animalerie', emoji: '🐾', label: 'Animalerie / Vétérinaire',
    numero: 'Numéro RCCM',
    secteurs: ['Animalerie', 'Clinique vétérinaire', 'Élevage & vente d’animaux',
      'Toilettage & pension', 'Alimentation animale'],
  },
  {
    id: 'finance', emoji: '🏦', label: 'Banque, microfinance & assurance',
    numero: 'Numéro d’agrément',
    secteurs: ['Banque', 'Microfinance', 'Assurance', 'Mobile Money & transfert',
      'Prêt & crédit'],
  },
  {
    id: 'media', emoji: '📣', label: 'Média & communication',
    numero: 'Numéro RCCM',
    secteurs: ['Agence de communication', 'Presse & médias',
      'Imprimerie & signalétique', 'Photo & vidéo', 'Marketing digital & influence'],
  },
]

/** Libellé d'un type par identifiant (gère l'ancien nom « commerce »). */
export function labelTypePro(id: string): string {
  if (id === 'commerce') return '🏪 Boutique / Commerce'
  const t = TYPES_PRO.find((x) => x.id === id)
  return t ? `${t.emoji} ${t.label}` : id
}

/**
 * Les mots de la vitrine et de la console selon le type de structure
 * (07/09/2026, le Patron : « adapte les mots par type pour les associations »).
 * Une association ne conclut pas des ventes, elle remet des dons ; son numéro
 * n'est pas un RCCM mais un récépissé ; sa page n'est pas une boutique. Les
 * métiers à agrément (école, agence de voyage, santé, hôtel, banque) ont fait
 * vérifier un agrément, pas un registre.
 */
export interface MotsPro {
  /** La pastille sur la bannière : « Professionnel », « Association vérifiée ». */
  badge: string
  /** « Professionnel depuis juin 2026 » — les mots avant la date. */
  depuis: string
  /** Le libellé du quatrième chiffre, l'ancienneté : « professionnel », « vérifiée ». */
  anciennete: string
  /** Le troisième chiffre, au singulier puis au pluriel : « vente conclue » / « dons remis ». */
  compte: [string, string]
  /** La pastille du registre et la phrase qui l'explique. */
  registre: string
  registreNote: string
  /** Quand la structure n'a pas écrit sa présentation. */
  presentationVide: string
  /** La console : le titre de section, la fiche, sa légende, le nom de la page. */
  gerer: string
  fiche: string
  ficheSous: string
  page: string
  /** « vendue(s) » / « donnée(s) », sous la tuile Mes annonces. */
  ecoulee: [string, string]
  /** « Mes commandes » / « Mes demandes », « Statistiques de vente » / « Statistiques », le KPI. */
  commandes: string
  stats: string
  kpi: string
}

const TYPES_A_AGREMENT = new Set(['formation', 'voyage', 'sante', 'hebergement', 'finance'])
const TYPES_BOUTIQUE = new Set(['', 'boutique', 'commerce', 'restauration', 'vehicules'])

export function motsPro(type?: string | null): MotsPro {
  const t = type || ''
  if (t === 'association') {
    return {
      badge: 'Association vérifiée', depuis: 'Association depuis', anciennete: 'vérifiée',
      compte: ['don remis', 'dons remis'],
      registre: 'Récépissé vérifié par l’équipe Chap.ci',
      registreNote: 'Le récépissé de cette association a été contrôlé avant l’approbation du compte.',
      presentationVide: 'Cette association n’a pas encore écrit sa présentation.',
      gerer: 'Gérer mon association', fiche: 'Fiche de l’association',
      ficheSous: 'Ce que les visiteurs voient sur votre page', page: 'page',
      ecoulee: ['donnée', 'données'], commandes: 'Mes demandes', stats: 'Statistiques', kpi: 'Dons remis',
    }
  }
  const agrement = TYPES_A_AGREMENT.has(t)
  const boutique = TYPES_BOUTIQUE.has(t)
  return {
    badge: 'Professionnel', depuis: 'Professionnel depuis', anciennete: 'professionnel',
    compte: ['vente conclue', 'ventes conclues'],
    registre: agrement ? 'Agrément vérifié par l’équipe Chap.ci' : 'Registre vérifié par l’équipe Chap.ci',
    registreNote: agrement
      ? 'Le numéro d’agrément de cette structure a été contrôlé avant l’approbation du compte.'
      : 'Le numéro officiel de cette entreprise a été contrôlé au registre avant l’approbation du compte.',
    presentationVide: boutique
      ? 'Cette boutique n’a pas encore écrit sa présentation.'
      : 'Cette structure n’a pas encore écrit sa présentation.',
    gerer: boutique ? 'Gérer ma boutique' : 'Gérer mon activité', fiche: 'Fiche professionnelle',
    ficheSous: 'Ce que les acheteurs voient sur votre page vendeur', page: 'page vendeur',
    ecoulee: ['vendue', 'vendues'], commandes: 'Mes commandes', stats: 'Statistiques de vente', kpi: 'Ventes conclues',
  }
}
