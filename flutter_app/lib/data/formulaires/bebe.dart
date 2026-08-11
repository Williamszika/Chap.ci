// =============================================================================
//  BÉBÉ & ENFANT — six sous-catégories (port fidèle de src/data/sous/bebe.dart).
//
//  La catégorie où l'occasion est la norme, et où deux objets ne se revendent
//  pas :
//
//  1. LE SIÈGE AUTO ACCIDENTÉ. Un siège qui a subi un choc, même sans trace,
//     a absorbé l'énergie de l'impact : sa coque est fragilisée et il ne
//     protégera plus. Il ne se revend pas.
//  2. LE LIT À BARREAUX NON CONFORME. Un écartement supérieur à 6,5 cm laisse
//     passer la tête d'un nourrisson — cause connue d'étouffement.
//
//  S'y ajoute le RAPPEL fabricant : un modèle rappelé ne se revend pas, il se
//  rapporte. Et le consommable pour bébé périmé. Pour tout le reste, le
//  formulaire encourage franchement l'occasion : l'état, le lavage, ce qui est
//  COMPLET.
// =============================================================================
import 'schema.dart';

String _t(Vals s, String cle) => (s[cle] ?? '').toString();
List<String> _liste(Vals s, String cle) => (s[cle] is List) ? List<String>.from(s[cle] as List) : <String>[];

const _ages = ['Naissance (0-1 mois)', '1 à 3 mois', '3 à 6 mois', '6 à 12 mois', '12 à 18 mois', '18 à 24 mois', '2 à 3 ans', '3 à 5 ans', '5 à 8 ans', '8 à 12 ans'];

/// Le rappel fabricant : un modèle rappelé ne se revend pas, il se rapporte.
final _rappel = Champ('rappel', 'Rappel fabricant',
    req: true,
    options: const ['Aucun rappel connu sur ce modèle', 'Modèle rappelé par le fabricant', 'Je ne sais pas'],
    bloque: const ['Modèle rappelé par le fabricant'],
    motifBloc: 'Un modèle rappelé par son fabricant ne se revend pas : il se rapporte au vendeur ou au fabricant.',
    h: (s) => RegExp('rappelé').hasMatch(_t(s, 'rappel'))
        ? '!Un modèle rappelé présente un défaut de sécurité identifié. Ne le revendez pas : rapportez-le au fabricant, qui le reprend ou le répare gratuitement.'
        : 'Le numéro de modèle est sous l’article. Un rappel se vérifie en le tapant dans un moteur de recherche avec le mot « rappel ».');

/// L'hygiène : ce qui décide vraiment de l'achat d'occasion pour un bébé.
final _lavage = Champ('lavage', 'Nettoyage',
    req: true,
    options: const ['Lavé et désinfecté, prêt à l’usage', 'Lavé', 'À laver avant usage', 'Taches persistantes'],
    alerte: const Alerte(
      bon: 'Lavé et désinfecté, prêt à l’usage',
      ok: ['Lavé', 'À laver avant usage'],
      texteBon: 'Lavé et désinfecté par le vendeur. Un passage en machine avant le premier usage reste une bonne habitude.',
      texteMauvais: 'Des taches persistent. Demandez des photos récentes, à la lumière du jour, avant de vous déplacer.',
      textes: {
        'Lavé': 'Lavé, et le vendeur le dit. Relavez avant le premier usage — c’est rapide et cela ne coûte rien.',
        'À laver avant usage': 'À laver avant usage : c’est honnête, et parfaitement normal sur de l’occasion. Prévoyez-le simplement.'
      },
    ),
    h: (s) => RegExp('Taches persistantes').hasMatch(_t(s, 'lavage'))
        ? '!Photographiez les taches. Un parent qui les découvre à la remise repart, et laisse un avis.'
        : 'Un article lavé et annoncé comme tel se vend nettement plus vite. C’est la première question d’un parent.');

Champ _completB(String quoi) => Champ('completB', 'Complet ?',
    req: true,
    options: const ['Complet, rien ne manque', 'Il manque une pièce, précisée dans la description', 'Incomplet — vendu tel quel'],
    h: 'C’est le premier litige sur $quoi d’occasion. Comptez avant de photographier.');

final Map<String, Schema> bebe = {
  'Vêtements bébé & enfant': Schema(
    etat: true,
    livraison: true,
    titre: (s) {
      final t = _liste(s, 'tailleB');
      final tStr = t.isEmpty ? '' : (t.length <= 2 ? t.join(', ') : '${t.length} tailles');
      return [_t(s, 'typeVetB'), tStr, _t(s, 'pourQuiB')].where((x) => x.isNotEmpty).join(' · ');
    },
    champs: [
      const Champ('pourQuiB', 'Pour', req: true, options: ['Fille', 'Garçon', 'Mixte']),
      const Champ('typeVetB', 'Type',
          req: true,
          options: ['Body', 'Pyjama / grenouillère', 'Ensemble', 'Robe', 'Pantalon', 'Short', 'T-shirt', 'Chemise', 'Pull / gilet', 'Manteau', 'Tenue de baptême', 'Tenue traditionnelle', 'Chaussures', 'Chaussettes', 'Bonnet / chapeau', 'Maillot de bain', 'Lot de vêtements']),
      const Champ('tailleB', 'Tailles disponibles',
          multi: true, req: true, options: _ages,
          h: 'Un enfant met une taille trois mois : c’est ce qui rend l’occasion si utile ici. Cochez tout ce que vous avez.'),
      const Champ('nbPiecesB', 'Nombre de pièces',
          req: true,
          options: ['1 pièce', '2 à 5 pièces', 'Lot de 6 à 15', 'Lot de 15 à 30', 'Plus de 30 pièces'],
          h: 'Les lots partent très vite : beaucoup de parents achètent la garde-robe d’une taille d’un coup.'),
      const Champ('matiereB', 'Matière', options: ['Coton', 'Coton bio', 'Polyester', 'Laine', 'Jean', 'Wax / pagne', 'Éponge', 'Mélange']),
      _lavage,
      const Champ('usureB', 'État',
          req: true, options: ['Neuf avec étiquette', 'Neuf sans étiquette', 'Très bon état, peu porté', 'Bon état', 'Traces d’usage', 'Petit accroc ou tache']),
    ],
  ),
  'Poussettes & Sièges auto': Schema(
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typePouss'), _t(s, 'marqueB'), _t(s, 'groupeSiege')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typePouss', 'Type',
          req: true,
          options: ['Poussette canne', 'Poussette 3 roues', 'Poussette double', 'Combiné poussette-nacelle', 'Siège auto', 'Cosy / coque', 'Rehausseur', 'Porte-bébé', 'Écharpe de portage', 'Sac à langer']),
      const Champ('marqueB', 'Marque',
          req: true, ph: 'Ex : Chicco, Bébé Confort, sans marque',
          h: 'La marque et le modèle permettent de vérifier un rappel et de retrouver la notice.'),
      Champ('choc', 'A-t-il subi un choc ou un accident ?',
          req: true,
          when: (s) => RegExp('Siège auto|Cosy|Rehausseur').hasMatch(_t(s, 'typePouss')),
          options: const ['Jamais accidenté', 'A subi un accident, même léger', 'Je ne sais pas — acheté d’occasion'],
          alerte: const Alerte(
            bon: 'Jamais accidenté',
            texteBon: 'Le vendeur déclare un siège jamais accidenté. Vérifiez la coque, les sangles et la date de fabrication sous le siège.',
            texteMauvais: 'INTERDIT À LA REVENTE. Un siège auto qui a subi un choc ne protège plus, même s’il paraît intact.',
          ),
          bloque: const ['A subi un accident, même léger', 'Je ne sais pas — acheté d’occasion'],
          motifBloc: 'Un siège auto accidenté — ou dont l’histoire est inconnue — ne peut pas être revendu : il ne protégera plus l’enfant.',
          h: (s) {
            final c = _t(s, 'choc');
            if (RegExp('accident').hasMatch(c)) return '!Un siège auto absorbe l’énergie du choc : sa coque est fragilisée même sans trace visible. Tous les fabricants demandent de le remplacer après un accident. Il ne se revend pas — il se détruit.';
            if (RegExp('Je ne sais pas').hasMatch(c)) return '!Si vous ne connaissez pas l’histoire du siège, vous ne pouvez pas garantir qu’il protégera. C’est le seul article de puériculture qui ne se revend jamais « à l’aveugle ».';
            return 'C’est LA question du siège auto. Un siège dont on connaît l’histoire se vend en confiance ; un siège inconnu ne se vend pas du tout.';
          }),
      _rappel,
      Champ('groupeSiege', 'Groupe / poids',
          req: true,
          when: (s) => RegExp('Siège auto|Cosy|Rehausseur').hasMatch(_t(s, 'typePouss')),
          options: const ['Groupe 0+ (0-13 kg)', 'Groupe 1 (9-18 kg)', 'Groupe 2/3 (15-36 kg)', 'Groupe 0+/1', 'Groupe 1/2/3', 'i-Size / R129'],
          h: 'Le groupe correspond au poids de l’enfant, pas à son âge. C’est ce qu’un parent vérifie en premier.'),
      Champ('anneeFab', 'Année de fabrication',
          ph: 'Ex : 2022',
          when: (s) => RegExp('Siège auto|Cosy|Rehausseur').hasMatch(_t(s, 'typePouss')),
          h: 'Elle est moulée sous le siège. Le plastique vieillit : au-delà de dix ans, un siège n’est plus recommandé.'),
      const Champ('ageP', 'Âge conseillé', multi: true, req: true, options: _ages),
      Champ('pliage', 'Pliage',
          when: (s) => RegExp('Poussette|Combiné').hasMatch(_t(s, 'typePouss')),
          options: const ['Pliage compact', 'Pliage standard', 'Pliage difficile', 'Ne se plie pas']),
      _completB('une poussette'),
      _lavage,
      const Champ('accessoiresP', 'Fourni avec',
          multi: true, options: ['Notice', 'Housse de pluie', 'Ombrelle', 'Nacelle', 'Adaptateurs', 'Sac de transport', 'Base isofix', 'Housse lavable']),
    ],
  ),
  'Mobilier & Chambre': Schema(
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeMobB'), _t(s, 'marqueB'), _t(s, 'dimsB')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeMobB', 'Type',
          req: true,
          options: ['Lit à barreaux', 'Berceau / couffin', 'Lit évolutif', 'Lit enfant', 'Matelas bébé', 'Table à langer', 'Commode à langer', 'Armoire enfant', 'Bureau enfant', 'Chaise haute', 'Parc', 'Transat', 'Tapis d’éveil', 'Baignoire bébé', 'Trotteur', 'Barrière de sécurité']),
      const Champ('marqueB', 'Marque', ph: 'Ex : Ikea, fabrication locale'),
      Champ('barreaux', 'Écartement des barreaux',
          req: true,
          when: (s) => RegExp('Lit à barreaux|Berceau|Lit évolutif|Parc').hasMatch(_t(s, 'typeMobB')),
          options: const ['Conforme — entre 4,5 et 6,5 cm', 'Supérieur à 6,5 cm', 'Je n’ai pas mesuré'],
          alerte: const Alerte(
            bon: 'Conforme — entre 4,5 et 6,5 cm',
            texteBon: 'Écartement conforme. Vérifiez aussi que le fond est stable et qu’aucun barreau ne bouge.',
            texteMauvais: 'DANGER. Un écartement supérieur à 6,5 cm laisse passer la tête d’un nourrisson — c’est une cause connue d’étouffement.',
          ),
          bloque: const ['Supérieur à 6,5 cm'],
          motifBloc: 'Un lit dont l’écartement des barreaux dépasse 6,5 cm ne peut pas être vendu : la tête d’un nourrisson peut s’y engager.',
          h: (s) {
            final b = _t(s, 'barreaux');
            if (RegExp('Supérieur').hasMatch(b)) return '!Un écartement supérieur à 6,5 cm laisse passer la tête d’un nourrisson qui ne peut plus la retirer. C’est pour cela que la norme existe. Ce lit ne peut pas être vendu.';
            if (RegExp('pas mesuré').hasMatch(b)) return '!Mesurez entre deux barreaux, au centre, avec une règle. C’est l’affaire de dix secondes et cela peut sauver un enfant.';
            return 'Entre 4,5 et 6,5 cm : assez serré pour la tête, assez large pour ne pas coincer un bras.';
          }),
      _rappel,
      const Champ('dimsB', 'Dimensions', req: true, ph: 'Ex : 120 × 60 cm',
          h: 'Le matelas se choisit sur les dimensions du lit : sans elles, un parent ne peut pas savoir si le sien ira.'),
      const Champ('matiereB2', 'Matière',
          req: true, options: ['Bois massif', 'Contreplaqué', 'Aggloméré / MDF', 'Métal', 'Plastique', 'Tissu et mousse']),
      const Champ('montageB', 'Montage',
          req: true, options: ['Livré monté', 'À monter, notice fournie', 'À monter, sans notice', 'Démonté']),
      _completB('un meuble'),
      _lavage,
      const Champ('ageM', 'Âge conseillé', multi: true, options: _ages),
    ],
  ),
  'Jouets & Éveil': Schema(
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeJouet'), _t(s, 'ageJ'), _t(s, 'nbJouets')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeJouet', 'Type',
          req: true,
          options: ['Hochet / éveil', 'Peluche', 'Poupée', 'Voiture / véhicule', 'Circuit / train', 'Construction (briques)', 'Puzzle enfant', 'Jeu éducatif', 'Livre-jouet', 'Instrument-jouet', 'Déguisement', 'Jeu d’extérieur', 'Toboggan / balançoire', 'Piscine gonflable', 'Vélo / porteur', 'Tricycle', 'Trottinette enfant', 'Console d’éveil', 'Lot de jouets']),
      const Champ('ageJ', 'Âge conseillé',
          req: true,
          options: ['0 à 6 mois', '6 à 12 mois', '1 à 2 ans', '2 à 3 ans', '3 à 5 ans', '5 à 8 ans', '8 ans et plus'],
          h: 'L’âge indiqué sur un jouet n’est pas un conseil de difficulté : c’est une consigne de sécurité, liée à la taille des pièces.'),
      Champ('petitesPieces', 'Petites pièces',
          req: true,
          options: const ['Aucune petite pièce', 'Contient de petites pièces — déconseillé avant 3 ans', 'Je ne sais pas'],
          h: (s) => RegExp('petites pièces').hasMatch(_t(s, 'petitesPieces'))
              ? '!Une petite pièce avalée est la première cause d’étouffement chez l’enfant de moins de trois ans. Le signaler est plus important que tout le reste de l’annonce.'
              : 'Un jouet destiné aux moins de trois ans ne doit contenir aucune pièce détachable de petite taille.'),
      _rappel,
      const Champ('pilesJ', 'Piles', options: ['Fonctionne sans piles', 'Piles fournies', 'Piles non fournies', 'Rechargeable', 'Piles à changer']),
      _completB('un jouet'),
      _lavage,
      const Champ('nbJouets', 'Quantité', req: true, options: ['1 jouet', '2 à 5 jouets', 'Lot de 6 à 15', 'Grand lot']),
      const Champ('marqueB', 'Marque', ph: 'Ex : Fisher-Price, Lego, sans marque'),
    ],
  ),
  'Puériculture & Repas': Schema(
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typePueri'), _t(s, 'marqueB')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typePueri', 'Type',
          req: true,
          options: ['Biberon', 'Chauffe-biberon', 'Stérilisateur', 'Tire-lait', 'Chaise haute', 'Assiette / couverts bébé', 'Robot cuiseur bébé', 'Thermomètre', 'Moniteur bébé', 'Veilleuse', 'Coussin d’allaitement', 'Couches lavables', 'Pot / réducteur', 'Sac isotherme', 'Balance bébé', 'Humidificateur']),
      const Champ('marqueB', 'Marque', ph: 'Ex : Philips Avent, Béaba, sans marque'),
      Champ('hygienePueri', 'Hygiène',
          req: true,
          options: const ['Neuf, jamais utilisé', 'Stérilisé et désinfecté', 'Lavé', 'À stériliser avant usage', 'Usage strictement personnel — non revendable'],
          alerte: const Alerte(
            bon: 'Neuf, jamais utilisé',
            ok: ['Stérilisé et désinfecté', 'Lavé', 'À stériliser avant usage'],
            texteBon: 'Article neuf. Vérifiez l’emballage et la date si c’est un consommable.',
            texteMauvais: 'Certains articles ne se partagent pas — tétines, sucettes, et les parties d’un tire-lait en contact avec le lait. Achetez-les neufs.',
            textes: {
              'Stérilisé et désinfecté': 'Stérilisé, et le vendeur le dit. Restérilisez tout de même avant le premier usage : c’est rapide et cela ne coûte rien.',
              'À stériliser avant usage': 'À stériliser avant usage : c’est normal sur de l’occasion, et le vendeur est honnête de le dire.'
            },
          ),
          h: (s) => RegExp('strictement personnel').hasMatch(_t(s, 'hygienePueri'))
              ? '!Tétines, sucettes et pièces d’un tire-lait en contact avec le lait ne se revendent pas. Vendez l’appareil sans ces pièces, en le précisant.'
              : 'La stérilisation est la première question d’un parent sur ce rayon. Y répondre franchement vend.'),
      Champ('peremptionB', 'Date limite',
          req: true,
          when: (s) => RegExp('Biberon|Couches|Assiette').hasMatch(_t(s, 'typePueri')),
          options: const ['Sans objet', 'Plus de 6 mois', 'Moins de 6 mois', 'Dépassée'],
          bloque: const ['Dépassée'],
          motifBloc: 'Un consommable pour bébé dont la date est dépassée ne peut pas être vendu.'),
      _rappel,
      Champ('electriqueB', 'Fonctionnement',
          req: true,
          when: (s) => RegExp('Chauffe|Stérilisateur|Tire-lait|Robot|Moniteur|Balance|Humidificateur|Veilleuse').hasMatch(_t(s, 'typePueri')),
          options: const ['Fonctionne, essai possible', 'Fonctionne, petit défaut', 'En panne']),
      _completB('un article de puériculture'),
      const Champ('ageR', 'Âge conseillé', multi: true, options: _ages),
    ],
  ),
  'Vêtements de maternité': Schema(
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeMat'), _liste(s, 'tailleMat').join('/')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeMat', 'Type',
          req: true,
          options: ['Robe de grossesse', 'Pantalon de grossesse', 'Haut / t-shirt', 'Robe d’allaitement', 'Soutien-gorge d’allaitement', 'Ceinture de grossesse', 'Bandeau de soutien', 'Pyjama de maternité', 'Tenue de sortie de maternité', 'Boubou de grossesse', 'Lot de vêtements']),
      const Champ('tailleMat', 'Tailles disponibles',
          multi: true, req: true,
          options: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '36', '38', '40', '42', '44', '46', '48', 'Taille unique']),
      const Champ('trimestre', 'Adapté au', multi: true, options: ['1er trimestre', '2e trimestre', '3e trimestre', 'Après l’accouchement', 'Allaitement']),
      const Champ('matiereMat', 'Matière', options: ['Coton', 'Coton élasthanne', 'Viscose', 'Polyester', 'Wax / pagne', 'Lin', 'Jersey']),
      _lavage,
      const Champ('usureMat', 'État',
          req: true, options: ['Neuf avec étiquette', 'Neuf sans étiquette', 'Très bon état, peu porté', 'Bon état', 'Traces d’usage']),
      const Champ('nbPiecesMat', 'Nombre de pièces', req: true, options: ['1 pièce', '2 à 5 pièces', 'Lot de 6 à 15', 'Grand lot']),
    ],
  ),
};
