// =============================================================================
//  MAISON & MEUBLES — six sous-catégories (port fidèle de src/data/sous/maison.dart).
//
//  Cinq réalités ivoiriennes commandent cette catégorie :
//
//  1. LE BOIS DÉCIDE DU PRIX. Iroko, teck, acajou (durables) contre aggloméré /
//     MDF « effet bois » qui gonfle et se délite en une saison des pluies.
//  2. LES TERMITES ne pardonnent pas au bois non traité.
//  3. LE SUR-MESURE ET L'ACOMPTE : le menuisier fabrique, l'acheteur verse un
//     acompte — l'arnaque classique est l'acompte encaissé, le meuble jamais livré.
//  4. LA FACTURE CIE : un frigo ou un climatiseur d'occasion se paie deux fois,
//     à l'achat puis chaque mois. Classe énergétique et puissance = le vrai prix.
//  5. L'ÉTAGE SANS ASCENSEUR, et les dimensions : un meuble qui ne passe pas la
//     porte revient chez le vendeur.
//
//  Trois réponses interdisent carrément la publication : l'ivoire / trophée
//  d'espèce protégée (CITES), une bouteille de gaz abîmée, un matelas porteur de
//  punaises de lit. Le bloc couleurs / variantes est porté : un meuble se
//  décline en essences de bois (teck, iroko, wengé), le reste dans la palette
//  Maison — et ce qui n'a pas de couleur (un matelas, un frigo, un outil) le dit.
// =============================================================================
import 'couleurs.dart';
import 'schema.dart';

String _t(Vals s, String cle) => (s[cle] ?? '').toString();

// --- Blocs partagés ----------------------------------------------------------

/// Ce qui décide du prix ET de la durée de vie d'un meuble ivoirien.
const _matiereMeuble = Champ('matiere', 'Matière',
    req: true,
    options: [
      'Bois massif — iroko', 'Bois massif — teck', 'Bois massif — acajou',
      'Bois massif — autre essence', 'Contreplaqué', 'Aggloméré / MDF plaqué',
      'Métal', 'Rotin / bambou', 'Plastique / résine', 'Verre', 'Tissu et mousse'
    ],
    alerte: Alerte(
      bon: 'Bois massif — iroko',
      ok: ['Bois massif — teck', 'Bois massif — acajou', 'Bois massif — autre essence', 'Métal', 'Rotin / bambou', 'Verre', 'Contreplaqué'],
      texteBon: 'Iroko massif : c’est le bois qui tient le mieux à l’humidité d’Abidjan. Un meuble en iroko se transmet — vérifiez que la tranche est bien du bois plein, pas un placage.',
      texteMauvais: 'Aggloméré ou MDF : sous l’humidité d’Abidjan, ces panneaux gonflent et se délitent, surtout au contact du sol. Regardez la tranche et le dessous du meuble avant de payer.',
      textes: {
        'Bois massif — teck': 'Teck massif : dense, naturellement résistant à l’eau et aux insectes. Vérifiez la tranche — le placage imite bien le teck.',
        'Bois massif — acajou': 'Acajou massif : bois noble d’Afrique de l’Ouest, solide et beau. Vérifiez que la tranche est du bois plein.',
        'Bois massif — autre essence': 'Bois massif : demandez laquelle. Samba et fromager sont tendres et bien plus fragiles qu’un iroko.',
        'Contreplaqué': 'Contreplaqué : correct et honnête, bien au-dessus de l’aggloméré, mais loin d’un massif. Le prix doit s’en ressentir.',
        'Métal': 'Métal : durable. Regardez les soudures et les points de rouille, surtout aux pieds.',
        'Rotin / bambou': 'Rotin ou bambou : léger et joli. Vérifiez qu’aucun brin n’est cassé et que le tressage ne se défait pas.',
        'Verre': 'Verre : demandez s’il est trempé. Un verre ordinaire sur une table basse est un accident qui attend.',
        'Tissu et mousse': 'Tissu et mousse : la structure en dessous compte autant. Demandez de quel bois est le cadre.'
      },
    ),
    h: 'C’est la question qui fait le prix. « Bois » ne veut rien dire tout seul : demandez à voir la tranche du panneau et le dessous du meuble.');

/// Le sur-mesure, et l'acompte qui va avec.
List<Champ> _surMesure(String quoi) => [
      const Champ('dispo', 'Disponibilité',
          req: true,
          options: ['En stock, à emporter tout de suite', 'Sur commande — je fabrique', 'Sur commande — je fais venir'],
          h: 'Beaucoup de meubles ne sont pas en stock ici : le dire évite un déplacement pour rien.'),
      Champ('delai', 'Délai de fabrication ou de livraison',
          req: true,
          when: (s) => RegExp('Sur commande').hasMatch(_t(s, 'dispo')),
          options: const ['Moins de 3 jours', '3 à 7 jours', '1 à 2 semaines', '2 à 4 semaines', 'Plus d’un mois', 'Selon la commande']),
      Champ('acompte', 'Acompte demandé',
          req: true,
          when: (s) => RegExp('Sur commande').hasMatch(_t(s, 'dispo')),
          options: const ['Aucun acompte', '25 % à la commande', '50 % à la commande', '70 % à la commande', 'Paiement intégral d’avance'],
          h: (s) {
            final a = _t(s, 'acompte');
            if (a == 'Paiement intégral d’avance') {
              return '!Exiger la totalité avant de fabriquer fait fuir les acheteurs prudents — et c’est exactement le schéma de l’arnaque à l’acompte. Un acompte de 50 % rassure bien davantage.';
            }
            if (a == '70 % à la commande') {
              return '!C’est beaucoup. Prévoyez un reçu écrit avec la date de livraison promise : c’est ce qui vous distingue de celui qui encaisse et disparaît.';
            }
            return 'Un acompte est normal pour $quoi. Remettez toujours un reçu écrit avec la date promise — c’est ce qui vous distingue de l’arnaqueur.';
          }),
    ];

/// Les dimensions : un meuble qui ne passe pas la porte revient chez le vendeur.
const _dimensions = Champ('dims', 'Dimensions (L × l × H)',
    req: true, ph: 'Ex : 180 × 85 × 75 cm',
    h: 'Obligatoire, et ce n’est pas une formalité : un canapé qui ne passe pas la porte ou l’ascenseur revient chez vous, à vos frais.');

/// La livraison, telle qu'elle se pratique vraiment à Abidjan.
final List<Champ> _livraisonEtage = [
  const Champ('livrDetail', 'Livraison',
      req: true,
      options: ['À emporter uniquement', 'Livraison gratuite dans ma commune', 'Livraison payante — je donne le tarif', 'Livraison à la charge de l’acheteur']),
  Champ('etage', 'Livraison à l’étage',
      multi: true,
      when: (s) => RegExp('Livraison').hasMatch(_t(s, 'livrDetail')),
      options: const ['Rez-de-chaussée uniquement', 'Étage avec ascenseur', 'Étage sans ascenseur', 'Supplément par étage'],
      h: 'Un canapé trois places au quatrième sans ascenseur, ce n’est pas la même livraison qu’au rez-de-chaussée. Dites-le avant, pas devant l’immeuble.'),
  const Champ('montage', 'Montage',
      req: true,
      options: ['Livré monté', 'À monter — notice fournie', 'À monter — sans notice', 'Montage assuré par moi (compris)', 'Montage assuré par moi (en supplément)']),
];

/// L'électricité qu'un appareil consommera CHAQUE MOIS, en plus de son prix.
final List<Champ> _energie = [
  Champ('classeEnergie', 'Classe énergétique',
      req: true,
      options: const ['A+++ / A++', 'A+', 'A', 'B', 'C', 'D ou moins', 'Non indiquée'],
      h: (s) {
        final c = _t(s, 'classeEnergie');
        if (RegExp(r'D ou moins|C$').hasMatch(c)) {
          return '!Un appareil de cette classe se paie deux fois : à l’achat, puis chaque mois sur la facture CIE. Annoncez-le honnêtement et ajustez le prix.';
        }
        if (c == 'Non indiquée') {
          return 'L’étiquette est collée sur la porte ou au dos. Si elle a disparu, dites-le — mais photographiez la plaque signalétique.';
        }
        return 'Une boutique de quartier avec frigo et ventilateurs paie 30 000 à 60 000 FCFA d’électricité par mois ; avec des climatiseurs, 70 000 à 150 000. La classe est un vrai argument de vente.';
      }),
  const Champ('puissanceW', 'Puissance',
      type: TypeChamp.nombre, unite: 'W', ph: 'Ex : 150',
      h: 'Écrite sur la plaque signalétique. Elle dit aussi si un groupe électrogène pourra faire tourner l’appareil pendant les coupures.'),
  Champ('voltage', 'Tension d’alimentation',
      req: true,
      options: const ['220–240 V (standard Côte d’Ivoire)', '110 V — transformateur nécessaire', 'Bi-tension 110/220 V'],
      h: (s) => RegExp('110 V —').hasMatch(_t(s, 'voltage'))
          ? '!La Côte d’Ivoire est en 230 V / 50 Hz. Sans transformateur, cet appareil grille au premier branchement. Précisez s’il est fourni.'
          : 'La Côte d’Ivoire est en 230 V / 50 Hz, prises de type C et E.'),
];

/// Un appareil « en panne » se vend très bien — à condition de le dire.
Champ _etatMarche(String quoi) => Champ(
      'etatMarche',
      'Fonctionnement',
      req: true,
      options: const ['Fonctionne parfaitement, essai possible', 'Fonctionne, petit défaut annoncé', 'En panne — vendu pour pièces ou à réparer'],
      alerte: Alerte(
        bon: 'Fonctionne parfaitement, essai possible',
        ok: const ['En panne — vendu pour pièces ou à réparer'],
        texteBon: 'Le vendeur propose de le faire fonctionner devant vous. Exigez-le : sur $quoi d’occasion, c’est la seule vérification qui compte.',
        texteMauvais: 'Un défaut est annoncé. Demandez lequel exactement, et faites brancher l’appareil devant vous avant de payer.',
        textes: const {
          'En panne — vendu pour pièces ou à réparer': 'Vendu en panne, et le vendeur le dit. C’est honnête — le prix doit être celui des pièces, pas celui d’un appareil qui marche.'
        },
      ),
      h: 'Un appareil en panne se vend très bien ici, à condition de l’annoncer. Ce qui fait le litige, c’est le silence.',
    );

final Map<String, Schema> maison = {
  'Meubles': Schema(
    livraison: false,
    couleurs: true,
    palette: paletteBois,
    labCouleurs: 'Teintes disponibles',
    aideCouleurs:
        'Cochez chaque teinte que vous proposez. Ouvrez-en une pour lui donner ses photos, son prix et un détail court.',
    aideCoulChamp: 'La teinte du bois ou de la finition, pas celle du tissu.',
    titre: (s) => [_t(s, 'typeMeuble'), _t(s, 'matiere'), _t(s, 'dims')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('piece', 'Pièce',
          req: true,
          options: ['Salon', 'Chambre', 'Salle à manger', 'Bureau', 'Entrée', 'Terrasse / extérieur', 'Enfant', 'Rangement']),
      const Champ('typeMeuble', 'Type de meuble', req: true, dependDe: 'piece', libre: 'Autre', table: {
        'Salon': ['Canapé 2 places', 'Canapé 3 places', 'Salon complet', 'Fauteuil', 'Table basse', 'Meuble TV', 'Bibliothèque', 'Pouf', 'Bar'],
        'Chambre': ['Lit', 'Armoire', 'Commode', 'Table de chevet', 'Coiffeuse', 'Chambre complète', 'Dressing'],
        'Salle à manger': ['Table à manger', 'Chaises', 'Ensemble table et chaises', 'Buffet', 'Vaisselier', 'Desserte'],
        'Bureau': ['Bureau', 'Chaise de bureau', 'Caisson', 'Étagère', 'Bureau complet', 'Table de réunion'],
        'Entrée': ['Meuble à chaussures', 'Porte-manteau', 'Console', 'Miroir sur pied'],
        'Terrasse / extérieur': ['Salon de jardin', 'Chaise longue', 'Table extérieure', 'Parasol', 'Hamac', 'Balancelle'],
        'Enfant': ['Lit enfant', 'Bureau enfant', 'Armoire enfant', 'Table à langer', 'Coffre à jouets'],
        'Rangement': ['Étagère', 'Armoire de rangement', 'Coffre', 'Casier', 'Meuble à tiroirs'],
      }),
      _matiereMeuble,
      Champ('traite', 'Bois traité contre les termites',
          req: true,
          when: (s) => RegExp('Bois|Contreplaqué|Rotin').hasMatch(_t(s, 'matiere')),
          options: const ['Oui, traité', 'Non traité', 'Je ne sais pas'],
          h: (s) => _t(s, 'traite') == 'Non traité'
              ? '!Les termites ne pardonnent pas au bois non traité. Dites-le — et proposez éventuellement un traitement avant livraison, c’est un argument.'
              : 'Les termites sont le premier ennemi du meuble en bois ici. Un bois traité se vend mieux, et c’est mérité.'),
      _dimensions,
      Champ('places', 'Nombre de places',
          when: (s) => RegExp('Canapé|Salon complet|Fauteuil|Table à manger|Ensemble').hasMatch(_t(s, 'typeMeuble')),
          options: const ['1', '2', '3', '4', '5', '6', '7', '8 et plus']),
      Champ('revetement', 'Revêtement',
          when: (s) => RegExp('Canapé|Fauteuil|Salon|Pouf|Chaise|Lit|Balancelle').hasMatch(_t(s, 'typeMeuble')),
          options: const ['Cuir véritable', 'Simili cuir', 'Tissu', 'Velours', 'Wax / pagne', 'Rotin tressé', 'Sans revêtement']),
      const Champ('fabrication', 'Fabrication',
          req: true,
          options: ['Fabriqué en Côte d’Ivoire', 'Importé', 'Fait main sur mesure', 'Je ne sais pas'],
          h: 'La menuiserie ivoirienne se vend bien : si c’est fabriqué ici, dites-le.'),
      ..._surMesure('un meuble fabriqué à la demande'),
      ..._livraisonEtage,
      const Champ('defauts', 'Défauts à signaler',
          multi: true,
          options: ['Aucun', 'Rayures', 'Tache', 'Pied abîmé', 'Tiroir difficile', 'Charnière à revoir', 'Tissu usé', 'Léger jeu dans la structure']),
    ],
  ),
  'Électroménager': Schema(
    livraison: false,
    couleurs: (s) => RegExp('Réfrigérateur|Congélateur|Cuisinière|Micro-ondes|Lave-linge|Climatiseur')
        .hasMatch(_t(s, 'typeElec')),
    palette: paletteMaison,
    sansCouleur: (s) => _t(s, 'typeElec').isNotEmpty
        ? 'Cet appareil n’a pas de variante de couleur. Photographiez la plaque signalétique et l’étiquette énergie.'
        : 'La première photo sert de couverture.',
    aideCouleurs: 'Cochez chaque couleur disponible. Ouvrez-en une pour lui donner ses photos et son prix.',
    titre: (s) => [
          _t(s, 'typeElec'),
          _t(s, 'marqueElec'),
          _t(s, 'capaciteElec'),
          (_t(s, 'classeEnergie').isNotEmpty && _t(s, 'classeEnergie') != 'Non indiquée') ? 'classe ${_t(s, 'classeEnergie')}' : ''
        ].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeElec', 'Type d’appareil',
          req: true,
          options: ['Réfrigérateur', 'Congélateur', 'Réfrigérateur-congélateur', 'Climatiseur', 'Ventilateur', 'Lave-linge', 'Sèche-linge', 'Cuisinière', 'Four', 'Micro-ondes', 'Chauffe-eau', 'Fer à repasser', 'Aspirateur', 'Robot ménager', 'Machine à coudre', 'Purificateur / humidificateur']),
      const Champ('marqueElec', 'Marque',
          req: true,
          options: ['Samsung', 'LG', 'Nasco', 'Hisense', 'Whirlpool', 'Beko', 'Sharp', 'Roch', 'Astech', 'Smart Technology', 'Midea', 'Haier', 'Innova', 'Binatone', 'Moulinex', 'Autre']),
      const Champ('refElec', 'Référence', ph: 'Ex : RT29K5030S8',
          h: 'Écrite sur la plaque signalétique, au dos ou à l’intérieur de la porte.'),
      _etatMarche('un appareil électroménager'),
      Champ('capaciteElec', 'Capacité',
          when: (s) => RegExp('Réfrigérateur|Congélateur|Lave-linge|Sèche-linge|Micro-ondes|Four').hasMatch(_t(s, 'typeElec')),
          options: const ['Moins de 100 L', '100 à 200 L', '200 à 300 L', '300 à 400 L', 'Plus de 400 L', '5 kg', '6 kg', '7 kg', '8 kg', '9 kg et plus']),
      Champ('btu', 'Puissance de froid',
          req: true,
          when: (s) => _t(s, 'typeElec') == 'Climatiseur',
          options: const ['9 000 BTU', '12 000 BTU', '18 000 BTU', '24 000 BTU', '36 000 BTU et plus'],
          h: 'Comptez environ 1 000 BTU par m². Un 9 000 BTU ne refroidira pas un grand salon — et un climatiseur sous-dimensionné tourne en permanence, donc coûte cher.'),
      Champ('typeClim', 'Type de climatiseur',
          when: (s) => _t(s, 'typeElec') == 'Climatiseur',
          options: const ['Split mural', 'Split cassette', 'Fenêtre', 'Mobile sur roulettes', 'Inverter (économique)']),
      ..._energie,
      const Champ('accessoiresElec', 'Fourni avec',
          multi: true,
          options: ['Notice', 'Facture d’origine', 'Boîte d’origine', 'Télécommande', 'Tuyaux / raccords', 'Support mural', 'Rallonge / stabilisateur']),
      Champ('installation', 'Installation',
          req: true,
          when: (s) => RegExp('Climatiseur|Chauffe-eau|Lave-linge|Cuisinière').hasMatch(_t(s, 'typeElec')),
          options: const ['Installation comprise', 'Installation en supplément', 'À la charge de l’acheteur'],
          h: 'Un climatiseur mal installé fuit, givre et consomme. L’installer vous-même est un vrai argument de vente.'),
      const Champ('garantieElec', 'Garantie',
          req: true,
          options: ['Aucune garantie', '7 jours', '15 jours', '1 mois', '3 mois', '6 mois', '1 an', 'Garantie constructeur en cours']),
      ..._livraisonEtage,
    ],
  ),
  'Décoration': Schema(
    livraison: false,
    couleurs: true,
    palette: paletteMaison,
    aideCouleurs:
        'Cochez chaque couleur disponible. Ouvrez-en une pour lui donner ses photos, son prix et un détail court.',
    titre: (s) => [_t(s, 'typeDeco'), _t(s, 'origineDeco') == 'Artisanat ivoirien fait main' ? 'artisanat ivoirien' : '', _t(s, 'dimsDeco')]
        .where((x) => x.isNotEmpty)
        .join(' · '),
    champs: [
      const Champ('typeDeco', 'Type d’objet',
          req: true,
          options: ['Tableau / peinture', 'Masque', 'Statue / sculpture', 'Tapis', 'Rideaux', 'Coussins', 'Miroir', 'Vase', 'Luminaire', 'Horloge', 'Plante artificielle', 'Cadre photo', 'Panier / vannerie', 'Tenture murale', 'Bougie / senteur', 'Autre']),
      const Champ('origineDeco', 'Origine',
          req: true,
          options: ['Artisanat ivoirien fait main', 'Artisanat d’un autre pays africain', 'Fabrication industrielle', 'Importé', 'Je ne sais pas'],
          h: 'L’artisanat ivoirien — Korhogo, vannerie, bronze de Bouaké — se vend bien et se paie mieux. Si c’est fait main ici, dites-le et montrez le détail du travail.'),
      Champ('matiereDeco', 'Matière',
          req: true,
          options: const ['Bois', 'Bronze / laiton', 'Terre cuite', 'Tissu / pagne', 'Raphia / vannerie', 'Verre', 'Métal', 'Pierre', 'Résine / plastique', 'Ivoire', 'Peau ou trophée d’animal sauvage'],
          alerte: const Alerte(
            bon: 'Bois',
            ok: ['Bronze / laiton', 'Terre cuite', 'Tissu / pagne', 'Raphia / vannerie', 'Verre', 'Métal', 'Pierre', 'Résine / plastique'],
            texteBon: 'Matière ordinaire, rien à signaler. Regardez la finition et l’état des angles.',
            texteMauvais: 'INTERDIT À LA VENTE. Cet objet ne peut pas être proposé sur Chap.ci.',
          ),
          bloque: const ['Ivoire', 'Peau ou trophée d’animal sauvage'],
          motifBloc: 'L’ivoire et les trophées d’espèces protégées sont interdits à la vente en Côte d’Ivoire et par la convention CITES.',
          h: (s) => RegExp('Ivoire|Peau ou trophée').hasMatch(_t(s, 'matiereDeco'))
              ? '!L’ivoire et les dépouilles d’espèces protégées sont interdits par la loi ivoirienne et par la convention CITES. Cette annonce ne peut pas être publiée, et la détention elle-même est sanctionnée.'
              : 'Le bronze de Bouaké, la terre cuite et la vannerie se vendent très bien. Photographiez le détail du travail : c’est lui qui fait le prix.'),
      const Champ('dimsDeco', 'Dimensions', req: true, ph: 'Ex : 120 × 80 cm, hauteur 45 cm',
          h: 'Un tableau ou un tapis s’achète sur ses dimensions. Sans elles, l’acheteur ne peut pas décider.'),
      const Champ('piecesDeco', 'Vendu par', req: true, options: ['À l’unité', 'Par paire', 'Lot de 3', 'Lot de 4 et plus', 'Ensemble complet']),
      Champ('fixation', 'Fixation',
          when: (s) => RegExp('Tableau|Miroir|Luminaire|Horloge|Tenture|Rideaux').hasMatch(_t(s, 'typeDeco')),
          options: const ['Prêt à poser, accroches fournies', 'Accroches à prévoir', 'Fixation murale nécessaire', 'Pose comprise']),
      ..._livraisonEtage,
    ],
  ),
  'Cuisine': Schema(
    livraison: false,
    couleurs: (s) => RegExp('Vaisselle|Casserole|Ustensile|Textile|Rangement|Service').hasMatch(_t(s, 'typeCuisine')),
    palette: paletteMaison,
    sansCouleur: (s) => _t(s, 'typeCuisine').isNotEmpty
        ? 'Cet article se vend sur sa matière et sa contenance, pas sur sa couleur. Photographiez-le sous plusieurs angles.'
        : 'La première photo sert de couverture.',
    titre: (s) => [_t(s, 'typeCuisine'), _t(s, 'matiereCuisine'), _t(s, 'piecesCuisine')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeCuisine', 'Type d’article',
          req: true,
          options: ['Vaisselle / service', 'Casseroles et marmites', 'Ustensiles', 'Réchaud à gaz', 'Bouteille de gaz', 'Plaque électrique', 'Blender / mixeur', 'Bouilloire', 'Cafetière', 'Friteuse', 'Rangement de cuisine', 'Textile de cuisine', 'Batterie de cuisine complète', 'Mortier / pilon', 'Autre']),
      Champ('matiereCuisine', 'Matière',
          when: (s) => !RegExp('gaz|Plaque|Blender|Bouilloire|Cafetière|Friteuse', caseSensitive: false).hasMatch(_t(s, 'typeCuisine')),
          options: const ['Inox', 'Aluminium', 'Fonte', 'Céramique', 'Porcelaine', 'Verre', 'Plastique alimentaire', 'Bois', 'Terre cuite', 'Antiadhésif']),
      Champ('piecesCuisine', 'Nombre de pièces',
          when: (s) => RegExp('Vaisselle|Casseroles|Ustensiles|Batterie|Rangement|Textile').hasMatch(_t(s, 'typeCuisine')),
          options: const ['1 pièce', '2 à 5 pièces', '6 à 12 pièces', '12 à 24 pièces', 'Plus de 24 pièces']),
      Champ('tailleBouteille', 'Taille de la bouteille',
          req: true,
          when: (s) => _t(s, 'typeCuisine') == 'Bouteille de gaz',
          options: const ['B6 (6 kg)', 'B12 (12,5 kg)', 'B15 (15 kg)', 'B38 (38 kg)', 'Autre']),
      Champ('etatBouteille', 'État de la bouteille',
          req: true,
          when: (s) => _t(s, 'typeCuisine') == 'Bouteille de gaz',
          options: const ['Bon état, sans rouille ni choc', 'Légères traces d’usage', 'Rouille importante', 'Bosse ou choc visible', 'Fuite constatée'],
          alerte: const Alerte(
            bon: 'Bon état, sans rouille ni choc',
            ok: ['Légères traces d’usage'],
            texteBon: 'Bouteille en bon état déclaré. Vérifiez tout de même le joint du robinet et l’absence de rouille au culot.',
            texteMauvais: 'DANGER. Une bouteille rouillée, choquée ou qui fuit ne doit pas être vendue ni utilisée : rapportez-la à un revendeur agréé.',
          ),
          bloque: const ['Rouille importante', 'Bosse ou choc visible', 'Fuite constatée'],
          motifBloc: 'Une bouteille de gaz rouillée, choquée ou qui fuit ne peut pas être vendue : elle doit être rapportée à un revendeur agréé.',
          h: (s) => RegExp('Rouille importante|Bosse|Fuite').hasMatch(_t(s, 'etatBouteille'))
              ? '!Une bouteille abîmée peut exploser. Elle ne se vend pas entre particuliers : rapportez-la à un revendeur agréé, qui la reprendra et la retirera du circuit.'
              : 'Vendez toujours une bouteille vide ou clairement annoncée pleine, et laissez l’acheteur vérifier le joint du robinet.'),
      Champ('gazPlein', 'Bouteille',
          req: true,
          when: (s) => _t(s, 'typeCuisine') == 'Bouteille de gaz',
          options: const ['Vide (consigne seule)', 'Pleine', 'Partiellement remplie']),
      Champ('feux', 'Nombre de feux',
          when: (s) => RegExp('Réchaud|Plaque').hasMatch(_t(s, 'typeCuisine')),
          options: const ['1 feu', '2 feux', '3 feux', '4 feux', '5 feux et plus']),
      const Champ('lot', 'Vendu en gros', type: TypeChamp.bascule,
          h: 'Cochez si vous vendez par lots : les restaurants et maquis le cherchent.'),
      const Champ('etatUsage', 'Défauts à signaler',
          multi: true,
          options: ['Aucun', 'Rayures', 'Fond noirci', 'Anse desserrée', 'Revêtement usé', 'Éclat / fêlure', 'Manque une pièce du lot']),
      ..._livraisonEtage,
    ],
  ),
  'Jardin & Bricolage': Schema(
    livraison: false,
    couleurs: (s) => RegExp('Mobilier de jardin|Parasol|Pot|Arrosage').hasMatch(_t(s, 'typeJardin')),
    palette: paletteMaison,
    sansCouleur: (s) => _t(s, 'typeJardin').isNotEmpty
        ? 'Un outil se vend sur son état de marche, pas sur sa couleur. Photographiez la plaque et faites une vidéo au démarrage.'
        : 'La première photo sert de couverture.',
    titre: (s) => [_t(s, 'typeJardin'), _t(s, 'marqueOutil'), _t(s, 'puissanceOutil').isNotEmpty ? '${_t(s, 'puissanceOutil')} W' : '']
        .where((x) => x.isNotEmpty)
        .join(' · '),
    champs: [
      const Champ('typeJardin', 'Type de matériel',
          req: true,
          options: ['Groupe électrogène', 'Perceuse', 'Meuleuse', 'Scie', 'Ponceuse', 'Poste à souder', 'Compresseur', 'Tondeuse', 'Débroussailleuse', 'Tronçonneuse', 'Pompe à eau', 'Échelle', 'Outils à main', 'Mobilier de jardin', 'Parasol', 'Pot / jardinière', 'Arrosage', 'Peinture / matériaux', 'Groupe de sécurité / portail', 'Autre']),
      const Champ('marqueOutil', 'Marque', ph: 'Ex : Bosch, Makita, Kipor, sans marque'),
      _etatMarche('un outil'),
      Champ('alimOutil', 'Alimentation',
          req: true,
          when: (s) => !RegExp('Mobilier|Parasol|Pot|Arrosage|Échelle|Outils à main|Peinture').hasMatch(_t(s, 'typeJardin')),
          options: const ['Secteur 220 V', 'Batterie rechargeable', 'Essence', 'Diesel', 'Manuel']),
      Champ('puissanceOutil', 'Puissance',
          type: TypeChamp.nombre, unite: 'W', ph: 'Ex : 800',
          when: (s) => RegExp('Perceuse|Meuleuse|Scie|Ponceuse|Poste|Compresseur|Pompe|Tondeuse').hasMatch(_t(s, 'typeJardin'))),
      Champ('puissanceKva', 'Puissance du groupe',
          req: true,
          when: (s) => _t(s, 'typeJardin') == 'Groupe électrogène',
          options: const ['Moins de 1 kVA', '1 à 2,5 kVA', '2,5 à 5 kVA', '5 à 10 kVA', '10 à 20 kVA', 'Plus de 20 kVA'],
          h: 'Un groupe de 800 W ne fait tourner ni un gros réfrigérateur ni un climatiseur. Annoncez la puissance réelle : c’est la première question de l’acheteur.'),
      Champ('heuresOutil', 'Heures de fonctionnement',
          type: TypeChamp.nombre, unite: 'h', ph: 'Ex : 400',
          when: (s) => RegExp('Groupe électrogène|Compresseur|Pompe').hasMatch(_t(s, 'typeJardin')),
          h: 'L’heure de fonctionnement est le kilométrage d’un moteur. Si le compteur existe, donnez-le ; sinon, dites-le honnêtement.'),
      Champ('usagePro', 'Usage précédent',
          when: (s) => !RegExp('Mobilier|Parasol|Pot|Peinture').hasMatch(_t(s, 'typeJardin')),
          options: const ['Usage domestique occasionnel', 'Usage domestique régulier', 'Usage professionnel', 'Neuf, jamais servi'],
          h: 'Un outil sorti d’un chantier n’a pas vécu la même vie qu’un outil de garage. Le dire protège le prix des deux côtés.'),
      const Champ('accessoiresOutil', 'Fourni avec',
          multi: true,
          options: ['Mallette / coffret', 'Notice', 'Facture', 'Batterie supplémentaire', 'Chargeur', 'Lames / disques', 'Rallonge', 'Bidon / entonnoir']),
      const Champ('garantieOutil', 'Garantie',
          req: true,
          options: ['Aucune garantie', '7 jours', '15 jours', '1 mois', '3 mois', '6 mois', '1 an']),
      ..._livraisonEtage,
    ],
  ),
  'Literie': Schema(
    livraison: false,
    couleurs: (s) => !RegExp('Matelas|Sommier').hasMatch(_t(s, 'typeLiterie')),
    palette: paletteMaison,
    sansCouleur:
        'Un matelas est blanc. Photographiez plutôt l’étiquette, les coins, et la tranche pour montrer l’épaisseur.',
    aideCouleurs:
        'Cochez chaque couleur disponible. Ouvrez-en une pour lui donner ses photos, son prix et un détail court.',
    titre: (s) => [_t(s, 'typeLiterie'), _t(s, 'taille'), _t(s, 'epaisseur')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeLiterie', 'Type d’article',
          req: true,
          options: ['Matelas', 'Sommier', 'Ensemble matelas et sommier', 'Drap / parure', 'Couette', 'Couverture', 'Oreiller', 'Traversin', 'Moustiquaire', 'Protège-matelas', 'Tête de lit']),
      const Champ('taille', 'Dimensions',
          req: true,
          options: ['90 × 190 (1 place)', '120 × 190', '140 × 190 (2 places)', '160 × 200 (queen)', '180 × 200 (king)', '200 × 200', 'Lit bébé 60 × 120', 'Sur mesure'],
          h: 'Les tailles standard vendues ici. Un matelas hors format oblige à faire fabriquer les draps — dites-le.'),
      Champ('garnissage', 'Garnissage',
          req: true,
          when: (s) => RegExp('Matelas|Ensemble').hasMatch(_t(s, 'typeLiterie')),
          options: const ['Mousse haute densité', 'Mousse standard', 'Ressorts', 'Ressorts ensachés', 'Latex', 'Mémoire de forme', 'Coco / fibre']),
      Champ('densite', 'Densité de la mousse',
          when: (s) => RegExp('Mousse').hasMatch(_t(s, 'garnissage')),
          options: const ['Moins de 20 kg/m³', '20 à 25 kg/m³', '25 à 30 kg/m³', '30 à 35 kg/m³', 'Plus de 35 kg/m³', 'Je ne sais pas'],
          h: 'La densité fait la durée de vie. En dessous de 20 kg/m³, une mousse se creuse en moins d’un an sous un adulte.'),
      Champ('epaisseur', 'Épaisseur',
          when: (s) => RegExp('Matelas|Ensemble|Protège').hasMatch(_t(s, 'typeLiterie')),
          options: const ['10 cm', '15 cm', '20 cm', '25 cm', '30 cm et plus']),
      Champ('matiereLit', 'Matière',
          when: (s) => RegExp('Drap|Couette|Couverture|Oreiller|Traversin|Tête de lit|Moustiquaire').hasMatch(_t(s, 'typeLiterie')),
          options: const ['Coton', 'Coton satiné', 'Polyester', 'Microfibre', 'Wax / pagne', 'Velours', 'Polaire', 'Tulle (moustiquaire)']),
      Champ('hygiene', 'État sanitaire',
          req: true,
          options: const ['Neuf, jamais utilisé', 'Utilisé, nettoyé et sans tache', 'Utilisé, quelques taches', 'Utilisé, non nettoyé', 'Punaises de lit constatées'],
          alerte: const Alerte(
            bon: 'Neuf, jamais utilisé',
            ok: ['Utilisé, nettoyé et sans tache'],
            texteBon: 'Article neuf. Demandez tout de même à voir l’emballage d’origine ou l’étiquette du fabricant.',
            texteMauvais: 'Article utilisé et non nettoyé. Exigez des photos récentes des deux faces et des coins, à la lumière du jour, avant de vous déplacer.',
            textes: {
              'Punaises de lit constatées': 'INTERDIT À LA VENTE. Un matelas porteur de punaises contaminerait votre logement entier — et il coûte une fortune à en débarrasser.'
            },
          ),
          bloque: const ['Punaises de lit constatées'],
          motifBloc: 'Un matelas ou un textile porteur de punaises de lit ne peut pas être vendu : il contaminerait le logement de l’acheteur.',
          h: (s) {
            final hy = _t(s, 'hygiene');
            if (hy == 'Punaises de lit constatées') {
              return '!Les punaises de lit se propagent au logement entier de l’acheteur et coûtent une fortune à éliminer. Cet article ne peut pas être vendu — il doit être détruit, emballé et fermé.';
            }
            if (RegExp('non nettoyé|quelques taches').hasMatch(hy)) {
              return '!Un matelas d’occasion se vend, mais photographiez les deux faces et les coins à la lumière du jour. C’est ce que l’acheteur demandera de toute façon.';
            }
            return 'C’est la première question sur de la literie d’occasion. Y répondre franchement vend mieux qu’un silence.';
          }),
      Champ('fermete', 'Fermeté',
          when: (s) => RegExp('Matelas|Ensemble').hasMatch(_t(s, 'typeLiterie')),
          options: const ['Souple', 'Équilibré', 'Ferme', 'Très ferme']),
      const Champ('lotLit', 'Vendu en gros', type: TypeChamp.bascule,
          h: 'Cochez si vous fournissez hôtels, résidences ou maquis : ils achètent par lots.'),
      ..._livraisonEtage,
    ],
  ),
};
