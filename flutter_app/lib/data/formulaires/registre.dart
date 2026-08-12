// =============================================================================
//  Le registre des sous-catégories et de leurs formulaires.
//
//  Deux choses distinctes vivent ici :
//
//  • NOMS_SOUS — la liste des sous-catégories de CHAQUE catégorie (port fidèle
//    de src/data/sous/noms.ts). Le sélecteur les montre toutes, même celles
//    dont le formulaire détaillé n'est pas encore porté.
//
//  • SCHEMAS — les formulaires détaillés, catégorie par catégorie. Une
//    sous-catégorie sans schéma retombe sur le formulaire de base (comme sur le
//    site) : le vendeur peut publier, il a juste moins de questions guidées.
//
//  ⚠️ Au fur et à mesure du portage (electronique, vehicules, maison…), on
//  ajoute le fichier ici. L'ordre des sous-catégories doit rester IDENTIQUE à
//  celui du site : c'est sous ces noms que les annonces sont enregistrées.
// =============================================================================
import 'schema.dart';
import 'mode.dart';
import 'electronique.dart';
import 'vehicules.dart';
import 'maison.dart';
import 'alimentation.dart';
import 'animaux.dart';
import 'services.dart';
import 'emploi.dart';
import 'sante.dart';
import 'bebe.dart';
import 'voyage.dart';
import 'loisirs.dart';
import 'scolaire.dart';
import 'materiel.dart';
import 'donner.dart';

/// Les sous-catégories par identifiant de catégorie, dans l'ordre d'affichage.
const Map<String, List<String>> nomsSous = {
  'vehicules': [
    'Voitures', 'Motos & Scooters', 'Camions & Utilitaires', 'Engins & Agricoles',
    'Pièces & Accessoires', 'Bateaux', 'Location'
  ],
  'mode': [
    'Vêtements Femme', 'Vêtements Homme', 'Chaussures', 'Sacs & Bijoux',
    'Pagnes & Tissus', 'Beauté & Cosmétiques'
  ],
  'electronique': [
    'Smartphones', 'Tablettes', 'Ordinateurs', 'TV & Écrans', 'Audio & Son',
    'Jeux vidéo', 'Appareils photo', 'Accessoires téléphone',
    'Accessoires informatiques', 'Téléphones fixes', 'Réparation & Dépannage'
  ],
  'maison': [
    'Meubles', 'Électroménager', 'Décoration', 'Cuisine', 'Jardin & Bricolage',
    'Literie'
  ],
  'emploi': [
    'Offres d’emploi', 'Demandes d’emploi', 'Stages', 'Freelance', 'Emploi maison'
  ],
  'services': [
    'BTP & Rénovation', 'Cours & Formation', 'Événementiel',
    'Transport & Déménagement', 'Informatique & Digital', 'Couture & Artisanat'
  ],
  'materiel-pro': [
    'Restauration & Maquis', 'Boutique & Commerce', 'Agriculture & Élevage',
    'Industrie & Atelier', 'Bureau & Informatique', 'Salon & Esthétique',
    'Médical & Paramédical'
  ],
  'alimentation': [
    'Produits vivriers', 'Fruits & Légumes', 'Céréales & Tubercules',
    'Épices & Condiments', 'Produits du terroir', 'Boissons', 'Plats préparés',
    'Cacao & Café', 'Semences & Intrants', 'Poisson & Produits de mer'
  ],
  'animaux': [
    'Volaille', 'Bétail & Élevage', 'Chiens & Chats',
    'Oiseaux, Poissons & Reptiles', 'Aliments pour animaux',
    'Accessoires & Matériel'
  ],
  'loisirs': [
    'Sport & Fitness', 'Vélos & Trottinettes', 'Instruments de musique',
    'Livres & BD', 'Jeux de société & Puzzles', 'Collections'
  ],
  'bebe': [
    'Vêtements bébé & enfant', 'Poussettes & Sièges auto', 'Mobilier & Chambre',
    'Jouets & Éveil', 'Puériculture & Repas', 'Vêtements de maternité'
  ],
  'sante': [
    'Compléments & Tisanes', 'Soins & Hygiène', 'Matériel médical de confort',
    'Optique & Audition', 'Bien-être & Massage', 'Nutrition sportive'
  ],
  'scolaire': [
    'Fournitures & papeterie', 'Cartables & trousses',
    'Manuels & livres scolaires', 'Annales & parascolaire', 'Uniformes & tenues',
    'Calculatrices & matériel de classe'
  ],
  'voyage': [
    'Billets d’avion', 'Agences de voyage', 'Visas & formalités',
    'Études à l’étranger', 'Travail à l’étranger', 'Séjours & circuits'
  ],
  'a-donner': [
    'Vêtements & chaussures', 'Meubles & électroménager',
    'Fournitures & matériel scolaire', 'Bébé & enfant', 'Nourriture & hygiène',
    'Coup de main & services', 'Autres objets'
  ],
};

/// Les formulaires détaillés portés, par identifiant de catégorie.
/// (On ajoute une entrée ici à chaque catégorie portée.)
final Map<String, Map<String, Schema>> _schemas = {
  'vehicules': vehicules,
  'mode': mode,
  'electronique': electronique,
  'maison': maison,
  'alimentation': alimentation,
  'animaux': animaux,
  'services': services,
  'emploi': emploi,
  'sante': sante,
  'bebe': bebe,
  'voyage': voyage,
  'loisirs': loisirs,
  'scolaire': scolaire,
  'materiel-pro': materiel,
  'a-donner': aDonner,
};

/// Les sous-catégories d'une catégorie, ou une liste vide si elle n'en a pas.
List<String> sousDe(String categoryId) => nomsSous[categoryId] ?? const [];

/// Une catégorie propose-t-elle le choix « neuf / occasion » ?
///
/// L'état se règle par SOUS-catégorie (`Schema.etat`) : un lapin, de l'attiéké
/// ou un billet d'avion n'ont pas de « neuf/occasion ». Une catégorie « a un
/// état » dès qu'AU MOINS une de ses sous-catégories en propose un — c'est la
/// granularité disponible sur l'explorateur, qui ne filtre que par catégorie.
///
/// Une sous-catégorie non encore portée retombe sur le formulaire de base, qui
/// propose l'état : on la compte donc comme « avec état ». Résultat : seules les
/// catégories dont TOUTES les sous-catégories sont explicitement sans état
/// (Alimentation, Emploi, Services, Voyage, À donner…) renvoient `false`.
bool categorieAEtat(String categoryId) {
  final noms = nomsSous[categoryId];
  if (noms == null || noms.isEmpty) return true; // inconnue : on garde le filtre
  for (final nom in noms) {
    final s = _schemas[categoryId]?[nom];
    if (s == null) return true; // sous-cat. non portée → base → état proposé
    if (s.etat != false) return true; // true, ou fonction conditionnelle
  }
  return false; // toutes les sous-catégories sont explicitement sans état
}

/// Le formulaire détaillé d'une sous-catégorie, ou `null` s'il n'est pas encore
/// porté (le formulaire de base prend alors le relais).
Schema? schemaPour(String? categoryId, String? sousNom) {
  if (categoryId == null || sousNom == null) return null;
  return _schemas[categoryId]?[sousNom];
}
