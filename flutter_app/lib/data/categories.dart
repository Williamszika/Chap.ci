/// Les 16 catégories de Chap.ci — mêmes identifiants et mêmes libellés que le
/// site (`src/data/categories.ts`), pour que l'app et le site parlent pareil.
///
/// L'emoji sert d'icône simple ; on le remplacera par les vraies icônes plus
/// tard si besoin.
library;

class Categorie {
  final String id;
  final String nom;
  final String emoji;
  const Categorie(this.id, this.nom, this.emoji);
}

const List<Categorie> categories = [
  Categorie('electronique', 'Électronique', '📱'),
  Categorie('vehicules', 'Véhicules', '🚗'),
  Categorie('immobilier', 'Immobilier', '🏠'),
  Categorie('mode', 'Mode & Beauté', '👗'),
  Categorie('maison', 'Maison & Meubles', '🛋️'),
  Categorie('scolaire', 'École & Fournitures', '🎒'),
  Categorie('emploi', 'Emploi', '💼'),
  Categorie('services', 'Services', '🔧'),
  Categorie('materiel-pro', 'Matériel Pro', '🚜'),
  Categorie('alimentation', 'Alimentation & Boissons', '🍚'),
  Categorie('animaux', 'Animaux', '🐐'),
  Categorie('loisirs', 'Loisirs & Sport', '⚽'),
  Categorie('bebe', 'Bébé & Enfant', '🍼'),
  Categorie('sante', 'Santé & Bien-être', '💊'),
  Categorie('voyage', 'Voyage', '✈️'),
  Categorie('a-donner', 'À donner', '🎁'),
];

/// Le libellé lisible d'un identifiant de catégorie (ou l'identifiant tel quel
/// s'il est inconnu — mieux vaut « materiel-pro » que rien).
String nomCategorie(String id) {
  for (final c in categories) {
    if (c.id == id) return c.nom;
  }
  return id;
}
