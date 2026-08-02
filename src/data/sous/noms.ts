// =============================================================================
//  Les NOMS des sous-catégories — et rien d'autre.
//
//  Ce fichier existe pour une raison de poids, au sens propre. Les schémas
//  complets (`data/sous/*.ts`) pèsent environ 94 Ko compressés : quatre-vingt-
//  deux formulaires, neuf cent trente-sept champs, leurs aides, leurs règles de
//  blocage. Or l'écran d'accueil, l'explorateur et les filtres n'ont besoin que
//  de CECI : une liste de noms.
//
//  Tant que `categories.ts` allait les chercher dans les schémas, ces 94 Ko
//  partaient au démarrage, sur toutes les pages, pour n'en servir que deux.
//  Sur un Tecno d'entrée de gamme, ce n'est pas le prix des données qui pèse —
//  c'est le temps que le processeur met à analyser le fichier avant que le
//  premier pixel n'apparaisse. Relevé par le bureau Performance le 2 août :
//  le paquet initial était passé de 127 à 221 Ko compressés.
//
//  Le schéma complet d'une catégorie se charge donc à la demande, et seulement
//  celui de la catégorie qu'on regarde (voir `index.ts`).
//
//  ⚠️ CETTE LISTE DOIT RESTER IDENTIQUE aux `SOUS` de chaque fichier de schéma.
//  Une sous-catégorie proposée ici sans schéma tombe sur un formulaire
//  générique ; un schéma absent d'ici n'est jamais atteignable. Le banc d'essai
//  (`npm run banc`) compare les deux et refuse de passer s'ils divergent.
// =============================================================================

/** Les sous-catégories par identifiant de catégorie, dans l'ordre d'affichage. */
export const NOMS_SOUS: Record<string, string[]> = {
  vehicules: [
    "Voitures",
    "Motos & Scooters",
    "Camions & Utilitaires",
    "Engins & Agricoles",
    "Pièces & Accessoires",
    "Bateaux",
    "Location",
  ],
  mode: [
    "Vêtements Femme",
    "Vêtements Homme",
    "Chaussures",
    "Sacs & Bijoux",
    "Pagnes & Tissus",
    "Beauté & Cosmétiques",
  ],
  electronique: [
    "Smartphones",
    "Tablettes",
    "Ordinateurs",
    "TV & Écrans",
    "Audio & Son",
    "Jeux vidéo",
    "Appareils photo",
    "Accessoires téléphone",
    "Accessoires informatiques",
    "Téléphones fixes",
    "Réparation & Dépannage",
  ],
  maison: [
    "Meubles",
    "Électroménager",
    "Décoration",
    "Cuisine",
    "Jardin & Bricolage",
    "Literie",
  ],
  emploi: [
    "Offres d’emploi",
    "Demandes d’emploi",
    "Stages",
    "Freelance",
    "Emploi maison",
  ],
  services: [
    "BTP & Rénovation",
    "Cours & Formation",
    "Événementiel",
    "Transport & Déménagement",
    "Informatique & Digital",
    "Couture & Artisanat",
  ],
  "materiel-pro": [
    "Restauration & Maquis",
    "Boutique & Commerce",
    "Agriculture & Élevage",
    "Industrie & Atelier",
    "Bureau & Informatique",
    "Salon & Esthétique",
    "Médical & Paramédical",
  ],
  alimentation: [
    "Produits vivriers",
    "Fruits & Légumes",
    "Céréales & Tubercules",
    "Épices & Condiments",
    "Produits du terroir",
    "Boissons",
    "Plats préparés",
    "Cacao & Café",
    "Semences & Intrants",
    "Poisson & Produits de mer",
  ],
  animaux: [
    "Volaille",
    "Bétail & Élevage",
    "Chiens & Chats",
    "Oiseaux, Poissons & Reptiles",
    "Aliments pour animaux",
    "Accessoires & Matériel",
  ],
  loisirs: [
    "Sport & Fitness",
    "Vélos & Trottinettes",
    "Instruments de musique",
    "Livres & BD",
    "Jeux de société & Puzzles",
    "Collections",
  ],
  bebe: [
    "Vêtements bébé & enfant",
    "Poussettes & Sièges auto",
    "Mobilier & Chambre",
    "Jouets & Éveil",
    "Puériculture & Repas",
    "Vêtements de maternité",
  ],
  sante: [
    "Compléments & Tisanes",
    "Soins & Hygiène",
    "Matériel médical de confort",
    "Optique & Audition",
    "Bien-être & Massage",
    "Nutrition sportive",
  ],
}

/** Les sous-catégories d'une catégorie, ou une liste vide si elle n'en a pas. */
export function sousDe(categoryId: string): string[] {
  return NOMS_SOUS[categoryId] ?? []
}
