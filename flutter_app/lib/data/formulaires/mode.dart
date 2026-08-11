// =============================================================================
//  MODE & BEAUTÉ — un schéma par sous-catégorie (port fidèle de src/data/sous/mode.dart).
//
//  Deux réalités commandent cette catégorie en Côte d'Ivoire :
//
//  1. LES PRODUITS ÉCLAIRCISSANTS SONT INTERDITS. Un décret d'avril 2015
//     prohibe la fabrication, la commercialisation ET l'utilisation des
//     dépigmentants (mercure, corticoïdes, vitamine A éclaircissante,
//     hydroquinone au-delà de 2 %). Chap.ci ne peut pas héberger ces annonces :
//     la question est posée avant publication, et une réponse positive la refuse.
//
//  2. LE FAUX WAX. Wax hollandais (Vlisco) en haut, puis Uniwax (Yopougon,
//     depuis 1967) et Woodin, puis très loin les imprimés importés d'Asie.
//     Le formulaire demande la marque et sépare « authentique » de « sans preuve ».
//
//  Le bloc couleurs / variantes du site (pastilles, tailles par coloris) n'est
//  pas encore porté ici : le moteur natif v1 affiche les champs, pas les
//  variantes. Les questions, elles, sont fidèles au mot près.
// =============================================================================
import 'schema.dart';

const _taillesLettre = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'Taille unique'];
const _taillesFemme = ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56'];
const _taillesHomme = ['38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60'];
const _pointures = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];
const _matieres = ['Coton', 'Wax', 'Bazin', 'Lin', 'Soie', 'Polyester', 'Jean', 'Laine', 'Dentelle', 'Satin', 'Cuir', 'Simili cuir', 'Viscose', 'Mélange'];

/// La valeur textuelle d'un champ (pour les tests des fonctions `when`/`titre`).
String _t(Vals s, String cle) => (s[cle] ?? '').toString();

/// Un titre lisible : au-delà de trois tailles, on annonce la fourchette.
String _listeTailles(String mot, dynamic brut) {
  final t = (brut is List) ? brut.map((e) => e.toString()).toList() : <String>[];
  if (t.isEmpty) return '';
  if (t.length <= 3) return '$mot ${t.join('/')}';
  return '${t.length} ${mot}s, du ${t.first} au ${t.last}';
}

/// L'authenticité — le même bloc pour tout ce qui porte une marque. « Sans
/// marque » et « fait main » ne sont pas des aveux de faiblesse : ils se vendent
/// très bien ici. Une seule alarme, celle du flou.
Champ _authenticite(String quoi) => Champ(
      'authenticite',
      'Authenticité',
      req: true,
      options: const [
        'Article authentique, avec preuve d’achat',
        'Article authentique, sans preuve',
        'Sans marque / création locale',
        'Fait main / sur mesure',
      ],
      alerte: Alerte(
        bon: 'Article authentique, avec preuve d’achat',
        ok: const ['Sans marque / création locale', 'Fait main / sur mesure'],
        texteBon:
            'Le vendeur déclare un article authentique et dit pouvoir le prouver. Demandez la facture ou l’emballage d’origine.',
        texteMauvais:
            'Aucune preuve d’authenticité n’est annoncée. Regardez les coutures, l’étiquette et le prix : $quoi de marque vendu très en dessous du marché est rarement authentique.',
        textes: const {
          'Sans marque / création locale':
              'Le vendeur annonce un article sans marque, et le dit. Jugez-le sur ses finitions et sa coupe, pas sur un logo.',
          'Fait main / sur mesure':
              'Pièce faite main ou cousue sur mesure. Demandez le délai de confection, les mesures nécessaires, et si les retouches sont comprises.',
        },
      ),
      h:
          'Vendre une contrefaçon est interdit, quel que soit le prix affiché. Si l’article n’est pas de marque, dites-le : « sans marque » se vend très bien.',
    );

final Map<String, Schema> mode = {
  'Vêtements Femme': Schema(
    etat: true,
    livraison: true,
    titre: (s) =>
        [_t(s, 'typeF'), _t(s, 'matiere'), _listeTailles('taille', s['tailles'])]
            .where((x) => x.isNotEmpty)
            .join(' · '),
    champs: [
      const Champ('typeF', 'Type de vêtement', req: true, options: [
        'Robe', 'Ensemble', 'Tailleur', 'Chemisier / haut', 'Jupe', 'Pantalon',
        'Jean', 'T-shirt', 'Boubou', 'Kaba', 'Tenue traditionnelle',
        'Tenue de mariage', 'Veste / blazer', 'Manteau', 'Pull / gilet',
        'Maillot de bain', 'Lingerie', 'Tenue de sport', 'Pyjama', 'Autre'
      ]),
      const Champ('tailles', 'Tailles disponibles',
          multi: true,
          req: true,
          options: [..._taillesLettre, ..._taillesFemme],
          h: 'Cochez toutes les tailles que vous avez.'),
      const Champ('matiere', 'Matière', options: _matieres, req: true),
      const Champ('marqueF', 'Marque', ph: 'Ex : Zara, création locale, sans marque'),
      const Champ('style', 'Style', multi: true, options: [
        'Décontracté', 'Chic / soirée', 'Traditionnel', 'Bureau', 'Sport',
        'Cérémonie', 'Grossesse'
      ]),
      const Champ('surMesure', 'Fait sur mesure',
          type: TypeChamp.bascule,
          h: 'Cochez si vous cousez sur mesure : indiquez alors le délai dans la description.'),
      _authenticite('un vêtement'),
    ],
  ),
  'Vêtements Homme': Schema(
    etat: true,
    livraison: true,
    titre: (s) =>
        [_t(s, 'typeH'), _t(s, 'matiere'), _listeTailles('taille', s['tailles'])]
            .where((x) => x.isNotEmpty)
            .join(' · '),
    champs: [
      const Champ('typeH', 'Type de vêtement', req: true, options: [
        'Chemise', 'T-shirt / polo', 'Pantalon', 'Jean', 'Costume',
        'Veste / blazer', 'Boubou', 'Tenue traditionnelle', 'Short',
        'Pull / sweat', 'Manteau', 'Tenue de sport', 'Sous-vêtement', 'Pyjama',
        'Autre'
      ]),
      const Champ('tailles', 'Tailles disponibles',
          multi: true,
          req: true,
          options: [..._taillesLettre, ..._taillesHomme],
          h: 'Cochez toutes les tailles que vous avez.'),
      Champ('colChemise', 'Tour de col',
          options: const ['37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
          when: (s) => _t(s, 'typeH') == 'Chemise'),
      const Champ('matiere', 'Matière', options: _matieres, req: true),
      const Champ('marqueH', 'Marque', ph: 'Ex : Lacoste, création locale, sans marque'),
      const Champ('style', 'Style', multi: true, options: [
        'Décontracté', 'Chic / soirée', 'Traditionnel', 'Bureau', 'Sport',
        'Cérémonie'
      ]),
      const Champ('surMesure', 'Fait sur mesure', type: TypeChamp.bascule),
      _authenticite('un vêtement'),
    ],
  ),
  'Chaussures': Schema(
    etat: true,
    livraison: true,
    titre: (s) =>
        [_t(s, 'typeCh'), _t(s, 'marqueCh'), _listeTailles('pointure', s['pointures'])]
            .where((x) => x.isNotEmpty)
            .join(' · '),
    champs: [
      const Champ('typeCh', 'Type de chaussure', req: true, options: [
        'Baskets', 'Sandales', 'Escarpins', 'Mocassins', 'Chaussures de ville',
        'Bottes', 'Ballerines', 'Claquettes', 'Tongs', 'Chaussures de sport',
        'Chaussures de sécurité', 'Babouches', 'Autre'
      ]),
      const Champ('pour', 'Pour', req: true, options: ['Femme', 'Homme', 'Enfant', 'Mixte']),
      const Champ('pointures', 'Pointures disponibles',
          multi: true,
          req: true,
          options: _pointures,
          h: 'Cochez toutes les pointures en stock. Une annonce qui annonce une pointure absente fait perdre l’acheteur et la vente.'),
      const Champ('marqueCh', 'Marque', ph: 'Ex : Nike, Adidas, sans marque'),
      const Champ('matiereCh', 'Matière', options: [
        'Cuir véritable', 'Simili cuir', 'Toile', 'Daim', 'Caoutchouc',
        'Textile', 'Plastique'
      ]),
      Champ('talon', 'Hauteur de talon',
          options: const [
            'Plat', 'Petit (moins de 5 cm)', 'Moyen (5 à 8 cm)',
            'Haut (plus de 8 cm)', 'Compensé'
          ],
          when: (s) => RegExp('Escarpins|Sandales|Bottes|Ballerines').hasMatch(_t(s, 'typeCh'))),
      _authenticite('un article'),
    ],
  ),
  'Sacs & Bijoux': Schema(
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeSB'), _t(s, 'marqueSB'), _t(s, 'carat')]
        .where((x) => x.isNotEmpty)
        .join(' · '),
    champs: [
      const Champ('famille', 'Catégorie',
          req: true, options: ['Sac / maroquinerie', 'Bijou', 'Montre', 'Accessoire']),
      const Champ('typeSB', 'Type', req: true, dependDe: 'famille', libre: 'Autre', table: {
        'Sac / maroquinerie': [
          'Sac à main', 'Sac à dos', 'Sac bandoulière', 'Pochette', 'Cabas',
          'Valise', 'Portefeuille', 'Ceinture', 'Trousse'
        ],
        'Bijou': [
          'Collier', 'Bracelet', 'Bague', 'Boucles d’oreilles',
          'Parure complète', 'Chaîne', 'Pendentif', 'Chevillère', 'Alliance'
        ],
        'Montre': ['Montre femme', 'Montre homme', 'Montre connectée', 'Montre de luxe'],
        'Accessoire': [
          'Lunettes de soleil', 'Écharpe / foulard', 'Chapeau', 'Gants',
          'Cravate', 'Nœud papillon', 'Bandeau'
        ],
      }),
      const Champ('marqueSB', 'Marque', ph: 'Ex : Guess, artisanat local, sans marque'),
      Champ('matiereSB', 'Matière',
          when: (s) => _t(s, 'famille') == 'Sac / maroquinerie' || _t(s, 'famille') == 'Accessoire',
          options: const [
            'Cuir véritable', 'Simili cuir', 'Toile', 'Raphia', 'Perles', 'Wax',
            'Tissu', 'Plastique'
          ]),
      Champ('metal', 'Métal',
          when: (s) => _t(s, 'famille') == 'Bijou' || _t(s, 'famille') == 'Montre',
          options: const [
            'Or', 'Argent', 'Plaqué or', 'Acier inoxydable', 'Bronze',
            'Fantaisie', 'Perles', 'Pierres'
          ]),
      Champ('carat', 'Titre de l’or',
          when: (s) => _t(s, 'metal') == 'Or' || _t(s, 'metal') == 'Plaqué or',
          options: const [
            '9 carats', '14 carats', '18 carats', '21 carats', '22 carats',
            '24 carats', 'Je ne sais pas'
          ],
          req: true,
          h: 'Le titre change tout sur le prix. Un acheteur averti demandera le poinçon — ou fera peser la pièce.'),
      Champ('poids', 'Poids',
          type: TypeChamp.nombre,
          unite: 'g',
          ph: 'Ex : 12',
          when: (s) => _t(s, 'famille') == 'Bijou' && (_t(s, 'metal') == 'Or' || _t(s, 'metal') == 'Argent'),
          h: 'Sur un bijou en or, le poids et le titre font le prix. Les annoncer évite trois messages de négociation.'),
      _authenticite('un article'),
    ],
  ),
  'Pagnes & Tissus': Schema(
    etat: true,
    livraison: true,
    titre: (s) => [
          _t(s, 'typeTissu'),
          _t(s, 'marqueTissu') != 'Autre / je ne sais pas' ? _t(s, 'marqueTissu') : '',
          _t(s, 'longueur')
        ].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeTissu', 'Type de tissu', req: true, options: [
        'Wax', 'Bazin riche', 'Kita / Kente', 'Bogolan', 'Tissu Korhogo',
        'Dentelle', 'Brodé', 'Satin', 'Soie', 'Lin', 'Uni / coton', 'Voile',
        'Autre'
      ]),
      const Champ('marqueTissu', 'Marque ou origine',
          req: true,
          options: [
            'Vlisco (wax hollandais)', 'Uniwax (Côte d’Ivoire)', 'Woodin',
            'GTP (Ghana)', 'ATL', 'Getzner (bazin)', 'Imprimé importé (Asie)',
            'Tissé / teint à la main', 'Autre / je ne sais pas'
          ],
          alerte: Alerte(
            bon: 'Uniwax (Côte d’Ivoire)',
            ok: [
              'Vlisco (wax hollandais)', 'Woodin', 'GTP (Ghana)', 'ATL',
              'Getzner (bazin)', 'Tissé / teint à la main', 'Imprimé importé (Asie)'
            ],
            texteBon:
                'Uniwax est fabriqué à Yopougon depuis 1967, dans le groupe Vlisco. Vérifiez la lisière : le nom y est imprimé.',
            texteMauvais:
                'Vérifiez la lisière du pagne : les vraies marques y impriment leur nom. Un imprimé importé vendu au prix du wax hollandais est l’arnaque la plus courante du marché du tissu.',
            textes: {
              'Vlisco (wax hollandais)':
                  'Le wax hollandais est le haut de l’échelle des prix. Vérifiez la lisière : Vlisco y imprime son nom, et chaque pièce porte un numéro de dessin.',
              'Woodin':
                  'Woodin appartient au même groupe que Vlisco et Uniwax. Le nom est imprimé sur la lisière.',
              'GTP (Ghana)':
                  'Tissu ghanéen de la Ghana Textiles Printing, du même groupe. La lisière porte le nom.',
              'ATL': 'ATL est un imprimeur ouest-africain reconnu. Vérifiez la lisière.',
              'Getzner (bazin)':
                  'Le bazin riche Getzner est autrichien. Le vrai se reconnaît au grain, au poids et au tampon sur le rouleau.',
              'Tissé / teint à la main':
                  'Pièce artisanale : kita, bogolan, Korhogo. Chaque pièce est unique — demandez des photos du tissu déplié, à la lumière du jour.',
              'Imprimé importé (Asie)':
                  'Le vendeur annonce un imprimé importé, et le dit. C’est honnête : le prix doit être très inférieur à celui d’un wax de marque.'
            },
          ),
          h: 'Le wax hollandais (Vlisco) est en haut de l’échelle des prix, puis Uniwax et Woodin, puis très loin les imprimés importés d’Asie. Dire la vérité sur l’origine vous évite un client fâché.'),
      const Champ('longueur', 'Longueur vendue',
          req: true,
          options: [
            '6 yards (le complet)', '12 yards', '3 yards', '2 yards', 'Au mètre',
            'Coupon / chute', 'Pagne tissé (unité)'
          ],
          h: 'Le pagne se vend traditionnellement en 6 yards — ce qu’on appelle « le complet ».'),
      Champ('metrage', 'Nombre de mètres',
          type: TypeChamp.nombre,
          unite: 'm',
          ph: 'Ex : 5',
          when: (s) => _t(s, 'longueur') == 'Au mètre' || _t(s, 'longueur') == 'Coupon / chute'),
      const Champ('largeur', 'Largeur', options: ['1,15 m', '1,20 m', '1,40 m', '1,50 m', 'Autre']),
      const Champ('motif', 'Motif', multi: true, options: [
        'Fleuri', 'Géométrique', 'Animalier', 'Symbolique', 'Uni', 'Pois',
        'Rayé', 'Ethnique'
      ]),
      const Champ('usageTissu', 'Idéal pour', multi: true, options: [
        'Robe', 'Ensemble', 'Boubou', 'Chemise', 'Décoration', 'Cérémonie',
        'Mariage', 'Deuil'
      ]),
      const Champ('lot', 'Vendu en gros',
          type: TypeChamp.bascule,
          h: 'Cochez si vous vendez par lots : les couturières et revendeuses le cherchent.'),
    ],
  ),
  'Beauté & Cosmétiques': Schema(
    livraison: true,
    // Un flacon de crème n'est pas « neuf ou d'occasion » : il est scellé,
    // ouvert, entamé ou testeur. Un sèche-cheveux, lui, l'est vraiment.
    etat: (s) => _t(s, 'familleB') == 'Accessoire beauté',
    titre: (s) => [_t(s, 'typeBeaute'), _t(s, 'marqueB'), _t(s, 'contenance')]
        .where((x) => x.isNotEmpty)
        .join(' · '),
    champs: [
      const Champ('familleB', 'Famille', req: true, options: [
        'Soin visage', 'Soin corps', 'Cheveux', 'Maquillage', 'Parfum',
        'Ongles', 'Hygiène', 'Accessoire beauté'
      ]),
      const Champ('typeBeaute', 'Type de produit', req: true, dependDe: 'familleB', libre: 'Autre', table: {
        'Soin visage': ['Crème', 'Sérum', 'Nettoyant', 'Masque', 'Gommage', 'Huile', 'Protection solaire'],
        'Soin corps': ['Lait corporel', 'Beurre de karité', 'Huile', 'Gommage', 'Savon', 'Déodorant', 'Anti-vergetures'],
        'Cheveux': [
          'Perruque', 'Tissage', 'Mèches', 'Shampoing', 'Après-shampoing',
          'Masque capillaire', 'Huile capillaire', 'Gel / crème coiffante',
          'Défrisant', 'Coloration', 'Extensions'
        ],
        'Maquillage': [
          'Fond de teint', 'Poudre', 'Rouge à lèvres', 'Mascara',
          'Fard à paupières', 'Palette', 'Crayon', 'Faux cils', 'Pinceaux'
        ],
        'Parfum': ['Eau de parfum', 'Eau de toilette', 'Encens / bakhour', 'Huile parfumée', 'Brume corporelle'],
        'Ongles': ['Vernis', 'Faux ongles', 'Kit manucure', 'Lampe UV', 'Soin des ongles'],
        'Hygiène': ['Savon', 'Gel douche', 'Dentifrice', 'Intime', 'Rasage'],
        'Accessoire beauté': ['Miroir', 'Sèche-cheveux', 'Lisseur', 'Tondeuse', 'Épilateur', 'Éponge / houppette', 'Trousse'],
      }),
      const Champ('marqueB', 'Marque', ph: 'Ex : Nivea, Dudu Osun, artisanal'),
      Champ('contenance', 'Contenance',
          ph: 'Ex : 250 ml, 100 g, lot de 3',
          when: (s) => _t(s, 'familleB') != 'Accessoire beauté'),
      Champ('typeCheveux', 'Type de cheveux',
          req: true,
          options: const [
            'Cheveux naturels (humains)', 'Synthétique', 'Mèche brésilienne',
            'Mèche péruvienne', 'Mèche indienne', 'Fibre mixte'
          ],
          when: (s) => RegExp('Perruque|Tissage|Mèches|Extensions').hasMatch(_t(s, 'typeBeaute'))),
      Champ('longueurCheveux', 'Longueurs disponibles',
          multi: true,
          options: const [
            '8 pouces', '10 pouces', '12 pouces', '14 pouces', '16 pouces',
            '18 pouces', '20 pouces', '22 pouces', '24 pouces', '26 pouces et plus'
          ],
          when: (s) => RegExp('Perruque|Tissage|Mèches|Extensions').hasMatch(_t(s, 'typeBeaute'))),
      Champ('textureCheveux', 'Texture',
          options: const ['Lisse', 'Ondulé', 'Bouclé', 'Crépu', 'Afro kinky', 'Water wave', 'Deep wave'],
          when: (s) => RegExp('Perruque|Tissage|Mèches|Extensions').hasMatch(_t(s, 'typeBeaute'))),
      // La question réglementaire : elle décide de la publication.
      Champ('eclaircissant', 'Ce produit éclaircit-il la peau ?',
          req: true,
          options: const ['Non — aucun agent éclaircissant', 'Oui — il contient un agent éclaircissant'],
          alerte: const Alerte(
            bon: 'Non — aucun agent éclaircissant',
            texteBon:
                'Le vendeur déclare un produit sans agent éclaircissant. Lisez tout de même la composition sur l’emballage.',
            texteMauvais: 'INTERDIT À LA VENTE en Côte d’Ivoire. Cette annonce ne peut pas être publiée.',
          ),
          bloque: const ['Oui — il contient un agent éclaircissant'],
          motifBloc:
              'Les produits éclaircissants sont interdits à la vente en Côte d’Ivoire (décret d’avril 2015).',
          h: (s) {
            const base =
                'Un décret adopté en Conseil des ministres en avril 2015 interdit en Côte d’Ivoire la fabrication, la commercialisation ET l’utilisation des produits dépigmentants contenant du mercure, des corticoïdes, de la vitamine A à visée éclaircissante, ou de l’hydroquinone au-delà de 2 %.';
            if (_t(s, 'eclaircissant') == 'Oui — il contient un agent éclaircissant') {
              return '!Cette annonce ne peut pas être publiée sur Chap.ci. $base';
            }
            return '$base Chap.ci ne peut pas héberger ces annonces.';
          },
          when: (s) => _t(s, 'familleB') != 'Accessoire beauté'),
      Champ('etatProduit', 'État du produit',
          req: true,
          options: const ['Neuf, sous emballage scellé', 'Neuf, emballage ouvert', 'Entamé', 'Testeur'],
          h: 'Un cosmétique entamé se vend, mais il doit être annoncé comme tel.',
          when: (s) => _t(s, 'familleB') != 'Accessoire beauté'),
      Champ('peremption', 'Date de péremption',
          req: true,
          options: const [
            'Plus d’un an', '6 mois à 1 an', '3 à 6 mois', 'Moins de 3 mois',
            'Dépassée', 'Non indiquée sur le produit'
          ],
          bloque: const ['Dépassée'],
          motifBloc: 'Un cosmétique dont la date de péremption est dépassée ne peut pas être vendu.',
          h: (s) {
            if (_t(s, 'peremption') == 'Dépassée') {
              return '!Cette annonce ne peut pas être publiée. Un cosmétique périmé appliqué sur la peau peut brûler.';
            }
            if (_t(s, 'peremption') == 'Moins de 3 mois') {
              return '!Dites-le clairement dans la description, et ajustez le prix : l’acheteur a moins de trois mois pour finir le produit.';
            }
            return 'Un produit périmé appliqué sur la peau peut brûler. La date figure sur l’emballage, souvent près du code-barres.';
          },
          when: (s) => _t(s, 'familleB') != 'Accessoire beauté'),
      const Champ('lot', 'Vendu en gros', type: TypeChamp.bascule),
    ],
  ),
};
