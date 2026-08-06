// =============================================================================
//  Auto-remplissage du formulaire « Publier » à partir du TITRE.
//  Devine la catégorie (et une sous-catégorie) par correspondance de mots-clés —
//  100 % local, instantané, sans modèle. Pensé pour le marché ivoirien
//  (marques et objets courants).
// =============================================================================
import { categories } from '../data/categories'

/** Minuscules + sans accents, pour une correspondance tolérante. */
function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Mots-clés → { catégorie, sous-catégorie }. Le 1er mot-clé trouvé dans le titre
// gagne (on parcourt du plus spécifique au plus générique).
interface Guess { cat: string; sub?: string }
const KEYWORDS: [string[], Guess][] = [
  // ⚠️ « À donner » EN PREMIER, et ce n'est pas un détail : le premier mot-clé
  // trouvé gagne. « Vêtements à donner » tomberait sinon dans Mode & Beauté,
  // et le vendeur se verrait réclamer un prix pour un don.
  [['a donner','je donne','don gratuit','je offre gratuitement','cadeau gratuit','recuperer gratuitement'], { cat: 'a-donner' }],
  // Voyage — avant l'immobilier, dont « location » et « chambre » attraperaient
  // « location de voiture à Dubaï » ou « chambre d'hôtel Marrakech ».
  [['billet avion','billet d avion','vol abidjan','vol paris','aller retour paris','compagnie aerienne'], { cat: 'voyage', sub: 'Billets d’avion' }],
  [['visa','ambassade','consulat','passeport','formalite voyage'], { cat: 'voyage', sub: 'Visas & formalités' }],
  [['etudier a l etranger','etude a l etranger','bourse etude','campus france','inscription universite etranger'], { cat: 'voyage', sub: 'Études à l’étranger' }],
  [['travailler a l etranger','travail a l etranger','contrat a l etranger','emploi canada','emploi europe'], { cat: 'voyage', sub: 'Travail à l’étranger' }],
  [['agence de voyage','agence voyage','billetterie'], { cat: 'voyage', sub: 'Agences de voyage' }],
  [['sejour','circuit touristique','pelerinage','omra','hadj','croisiere','voyage organise'], { cat: 'voyage', sub: 'Séjours & circuits' }],
  // Téléphones — dans Électronique depuis la fusion : un téléphone EST un
  // appareil électronique, et l'acheteur qui compare un smartphone à une
  // tablette n'a aucune raison de changer de rayon.
  [['iphone','samsung galaxy','tecno','infinix','itel','xiaomi','redmi','oppo','huawei','smartphone','android','telephone','téléphone','portable'], { cat: 'electronique', sub: 'Smartphones' }],
  [['tablette','ipad'], { cat: 'electronique', sub: 'Tablettes' }],
  [['chargeur','ecouteur','écouteur','casque telephone','coque','protege ecran','powerbank','power bank'], { cat: 'electronique', sub: 'Accessoires téléphone' }],
  // Véhicules
  [['voiture','toyota','corolla','rav4','mercedes','peugeot','renault','hyundai','kia','nissan','4x4','berline','vehicule','véhicule'], { cat: 'vehicules', sub: 'Voitures' }],
  [['moto','scooter','yamaha','ktm','tricycle','mobylette'], { cat: 'vehicules', sub: 'Motos & Scooters' }],
  [['camion','remorque','fourgon','utilitaire'], { cat: 'vehicules', sub: 'Camions & Utilitaires' }],
  [['pneu','jante','pare-choc','pare choc','piece auto','pièce auto','batterie voiture'], { cat: 'vehicules', sub: 'Pièces & Accessoires' }],
  // Immobilier
  [['terrain','parcelle','lot'], { cat: 'immobilier', sub: 'Terrains' }],
  [['appartement','villa','maison','studio','chambre','duplex','a louer','à louer','location'], { cat: 'immobilier', sub: 'Location' }],
  [['bureau','magasin','local commercial','entrepot','entrepôt','boutique a louer'], { cat: 'immobilier', sub: 'Bureaux & Commerces' }],
  // Électronique
  [['ordinateur','laptop','pc portable','macbook','hp','dell','lenovo','asus'], { cat: 'electronique', sub: 'Ordinateurs' }],
  [['tv','télé','tele','television','télévision','ecran','écran','smart tv'], { cat: 'electronique', sub: 'TV & Écrans' }],
  [['enceinte','haut-parleur','baffle','ampli','home cinema','barre de son'], { cat: 'electronique', sub: 'Audio & Son' }],
  [['playstation','ps4','ps5','xbox','manette','console','nintendo'], { cat: 'electronique', sub: 'Jeux vidéo' }],
  [['appareil photo','camera','caméra','canon','nikon','gopro'], { cat: 'electronique', sub: 'Appareils photo' }],
  [['imprimante','clavier','souris','disque dur','cle usb','clé usb','routeur'], { cat: 'electronique', sub: 'Accessoires informatiques' }],
  // Maison & Meubles
  [['canape','canapé','fauteuil','salon','table','chaise','lit','matelas','armoire','commode','meuble','etagere','étagère'], { cat: 'maison', sub: 'Meubles' }],
  [['frigo','refrigerateur','réfrigérateur','congelateur','congélateur','cuisiniere','cuisinière','four','micro-onde','micro onde','machine a laver','machine à laver','climatiseur','clim','ventilateur'], { cat: 'maison', sub: 'Électroménager' }],
  [['decoration','décoration','tapis','rideau','miroir','tableau deco'], { cat: 'maison', sub: 'Décoration' }],
  [['ustensile','marmite','casserole','vaisselle','assiette'], { cat: 'maison', sub: 'Cuisine' }],
  // Mode & Beauté
  [['robe','jupe','pagne','tissu','wax','ensemble femme','vetement femme','vêtement femme'], { cat: 'mode', sub: 'Vêtements Femme' }],
  [['chemise','pantalon','costume','tee-shirt','t-shirt','veste','vetement homme','vêtement homme'], { cat: 'mode', sub: 'Vêtements Homme' }],
  [['chaussure','basket','sneakers','sandale','talon','mocassin'], { cat: 'mode', sub: 'Chaussures' }],
  [['sac','sacoche','bijou','montre','collier','bracelet','bague','lunette'], { cat: 'mode', sub: 'Sacs & Bijoux' }],
  [['parfum','maquillage','cosmetique','cosmétique','creme','crème','perruque','meche','mèche'], { cat: 'mode', sub: 'Beauté & Cosmétiques' }],
  // Alimentation
  [['huile rouge','huile','riz','attieke','attiéké','placali','poisson','viande','poulet braise','epice','épice','condiment','miel','confiture','jus','boisson','farine','manioc frais'], { cat: 'alimentation' }],
  // Agriculture — répartie depuis la fusion : ce qui se mange va en
  // Alimentation, le tracteur en Matériel Pro. Un régime de bananes se vendait
  // des deux côtés ; personne ne savait lequel regarder.
  [['cacao','cafe','café','anacarde','hevea','hévéa','coton'], { cat: 'alimentation', sub: 'Cacao & Café' }],
  [['semence','engrais','intrant'], { cat: 'alimentation', sub: 'Semences & Intrants' }],
  [['vivrier','igname','manioc','banane plantain'], { cat: 'alimentation', sub: 'Produits vivriers' }],
  [['tracteur','motoculteur','charrue'], { cat: 'materiel-pro', sub: 'Agriculture & Élevage' }],
  // Animaux
  [['poulet','poule','coq','pintade','mouton','chevre','chèvre','boeuf','bœuf','porc','lapin','chien','chat','poisson aquarium','oiseau','volaille'], { cat: 'animaux' }],
  // Loisirs & Sport
  [['velo','vélo','ballon','football','guitare','piano','clavier musique','livre','roman','jouet','jeu','halter','haltere','haltère','tapis de course','musculation'], { cat: 'loisirs' }],
  // Bébé & Enfant
  [['bebe','bébé','poussette','biberon','couche','berceau','table a langer','table à langer','vetement enfant','vêtement enfant','jouet enfant'], { cat: 'bebe' }],
  // Matériel Pro
  [['groupe electrogene','groupe électrogène','vitrine','presentoir','présentoir','materiel restaurant','matériel restaurant','friteuse pro','photocopieuse'], { cat: 'materiel-pro' }],
  // Emploi & Services (intentions)
  [['offre emploi','recrutement','cherche employe','cherche employé','cdi','cdd','stage'], { cat: 'emploi' }],
  [['plombier','maçon','macon','menuisier','couturier','couture','cours','formation','demenagement','déménagement','transport','coiffure','depannage','dépannage'], { cat: 'services' }],
]

/**
 * Devine la catégorie (et une sous-catégorie) depuis le titre saisi.
 * Essaie d'abord les mots-clés (marques/objets), puis les noms de
 * sous-catégories eux-mêmes. Renvoie {} si rien de sûr.
 */
export function guessFromTitle(title: string): { categoryId?: string; subcategory?: string } {
  const t = norm(title)
  if (t.trim().length < 3) return {}
  // 1) Dictionnaire de mots-clés.
  for (const [words, g] of KEYWORDS) {
    if (words.some((w) => t.includes(norm(w)))) {
      return { categoryId: g.cat, subcategory: g.sub }
    }
  }
  // 2) Nom d'une sous-catégorie présent tel quel dans le titre.
  for (const c of categories) {
    for (const sub of c.subcategories) {
      if (t.includes(norm(sub))) return { categoryId: c.id, subcategory: sub }
    }
  }
  // 3) Nom de catégorie présent dans le titre.
  //
  // Le garde-fou des quatre lettres n'est pas décoratif : le premier mot de
  // « À donner » est « À », qui devient « a » une fois normalisé. Sans lui,
  // toute annonce contenant la lettre « a » et n'ayant rien déclenché plus haut
  // — c'est-à-dire presque toutes — atterrirait dans « À donner », prix forcé à
  // zéro. Aucun autre nom de catégorie ne descend sous quatre lettres.
  for (const c of categories) {
    const premier = norm(c.name.split(' ')[0])
    if (premier.length >= 4 && t.includes(premier)) return { categoryId: c.id }
  }
  return {}
}
