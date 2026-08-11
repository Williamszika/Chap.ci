// =============================================================================
//  ANIMAUX — six sous-catégories (port fidèle de src/data/sous/animaux.dart).
//  Tout ce qui est vivant, au même endroit.
//
//  Trois réalités commandent ces formulaires :
//
//  1. LES ESPÈCES PROTÉGÉES. Perroquet gris du Gabon, pangolin, tortue, singe,
//     python : la Côte d'Ivoire est partie à la CITES et sa loi sur la faune
//     interdit leur capture, détention et vente. La question est posée, et la
//     réponse « espèce sauvage capturée » refuse l'annonce.
//  2. LES COMBATS D'ANIMAUX. Interdits : un animal vendu « pour le combat »
//     est refusé.
//  3. LA VACCINATION ET LE SEVRAGE. Un chiot vendu à trois semaines meurt
//     souvent ; un animal non vacciné contamine le foyer. Ces champs protègent
//     l'animal, l'acheteur et le vendeur — et un chiot vacciné se vend bien plus
//     cher, ce que beaucoup de vendeurs ignorent.
// =============================================================================
import 'schema.dart';

String _t(Vals s, String cle) => (s[cle] ?? '').toString();

/// La question qui refuse l'annonce : l'animal est-il protégé ?
final _protegee = Champ('protegee', 'Statut de l’espèce',
    req: true,
    options: const [
      'Espèce domestique ou d’élevage courante',
      'Espèce sauvage capturée (perroquet gris, tortue, pangolin, singe, python…)'
    ],
    alerte: const Alerte(
      bon: 'Espèce domestique ou d’élevage courante',
      texteBon: 'Espèce courante, rien à signaler. Demandez tout de même à voir l’animal vivant avant de payer.',
      texteMauvais: 'INTERDIT. La capture, la détention et la vente d’espèces sauvages protégées sont interdites en Côte d’Ivoire et par la convention CITES.',
    ),
    bloque: const ['Espèce sauvage capturée (perroquet gris, tortue, pangolin, singe, python…)'],
    motifBloc: 'La vente d’une espèce sauvage protégée est interdite par la loi ivoirienne et par la convention CITES.',
    h: (s) => RegExp('sauvage capturée').hasMatch(_t(s, 'protegee'))
        ? '!Le perroquet gris du Gabon, le pangolin, les tortues, les singes et les pythons sont protégés. Leur capture et leur vente sont poursuivies, et la détention elle-même l’est. Cette annonce ne sera pas publiée.'
        : 'Le perroquet gris du Gabon est l’oiseau le plus vendu illégalement d’Afrique de l’Ouest. Si votre oiseau vient d’un élevage, dites-le et gardez le justificatif.');

/// Les combats sont interdits, et l'usage annoncé change tout.
Champ _usageAnimal(List<String> o) => Champ(
      'usage',
      'Usage',
      req: true,
      options: [...o, 'Combat / bagarre'],
      bloque: const ['Combat / bagarre'],
      motifBloc: 'Les combats d’animaux sont interdits : une annonce qui vend un animal pour le combat ne peut pas être publiée.',
      h: (s) => _t(s, 'usage') == 'Combat / bagarre'
          ? '!Les combats d’animaux sont interdits et poursuivis. Cette annonce ne sera pas publiée.'
          : '',
    );

List<Champ> _sante(String quoi) => [
      Champ('vaccins', 'Vaccination',
          req: true,
          options: const ['Vacciné, carnet à l’appui', 'Vacciné, sans carnet', 'Primo-vaccination faite', 'Non vacciné', 'Trop jeune pour être vacciné'],
          alerte: const Alerte(
            bon: 'Vacciné, carnet à l’appui',
            ok: ['Vacciné, sans carnet', 'Primo-vaccination faite', 'Trop jeune pour être vacciné'],
            texteBon: 'Vacciné avec carnet à l’appui. Demandez à le voir avant de payer, et vérifiez que les dates correspondent à l’âge annoncé.',
            texteMauvais: 'Animal non vacciné. Il peut contaminer vos autres bêtes ou votre foyer : prévoyez une visite vétérinaire dès la remise, et négociez le prix en conséquence.',
            textes: {
              'Vacciné, sans carnet': 'Vacciné, mais sans carnet à montrer. Demandez le nom du vétérinaire et la date — un vendeur sérieux s’en souvient.',
              'Trop jeune pour être vacciné': 'Trop jeune pour être vacciné, c’est normal. Prévoyez la primo-vaccination dans les semaines qui suivent.'
            },
          ),
          h: (s) {
            final v = _t(s, 'vaccins');
            if (v == 'Non vacciné') return '!Un animal non vacciné se vend bien moins cher et peut contaminer le foyer de l’acheteur. Une primo-vaccination coûte peu et change le prix du tout au tout.';
            if (RegExp('carnet à l’appui').hasMatch(v)) return 'Le carnet est ce qui rassure le plus. Photographiez-le, en masquant vos coordonnées.';
            return '';
          }),
      const Champ('vermifuge', 'Vermifuge',
          req: true,
          options: ['Vermifugé récemment', 'Vermifugé il y a plus de 3 mois', 'Jamais vermifugé', 'Je ne sais pas']),
      Champ('santeGen', 'État de santé',
          req: true,
          options: const ['En parfaite santé', 'Bon état général', 'Sous traitement', 'Handicap ou maladie chronique'],
          h: 'Annoncer un traitement en cours n’empêche pas de vendre — le cacher fait le litige et met $quoi en danger.'),
    ];

final Map<String, Schema> animaux = {
  'Volaille': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez les bêtes vivantes, dans leur enclos. Une photo de catalogue ne rassure personne.',
    etat: false,
    livraison: true,
    titre: (s) => [_t(s, 'especeV'), _t(s, 'ageV'), _t(s, 'nombreV')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('especeV', 'Espèce',
          req: true,
          options: ['Poulet de chair', 'Poule pondeuse', 'Poulet bicyclette (local)', 'Pintade', 'Canard', 'Dindon', 'Pigeon', 'Caille', 'Oie', 'Poussins d’un jour', 'Œufs à couver', 'Œufs de consommation']),
      const Champ('ageV', 'Âge', req: true, options: ['1 jour', '1 à 4 semaines', '1 à 2 mois', '2 à 4 mois', 'Plus de 4 mois', 'Adulte en ponte']),
      const Champ('nombreV', 'Nombre disponible', req: true, options: ['À l’unité', '2 à 10', '10 à 50', '50 à 200', '200 à 1000', 'Plus de 1000']),
      const Champ('poidsV', 'Poids moyen', ph: 'Ex : 1,8 kg par sujet',
          h: 'Sur du poulet de chair, le poids fait le prix. Sans lui, l’acheteur en gros passe son chemin.'),
      const Champ('elevageV', 'Mode d’élevage',
          req: true,
          options: ['Élevage au sol', 'En cage', 'Plein air / divagation', 'Élevage bicyclette traditionnel'],
          h: 'Le poulet bicyclette se vend deux fois le prix du poulet de chair : si c’en est un, dites-le.'),
      ..._sante('la bête'),
      Champ('ponte', 'Production d’œufs',
          when: (s) => RegExp('pondeuse|Caille|Canard|Pintade').hasMatch(_t(s, 'especeV')),
          options: const ['En pleine ponte', 'Début de ponte', 'Fin de ponte', 'Pas encore en ponte']),
      const Champ('livraisonV', 'Remise',
          req: true,
          options: ['À venir chercher sur place', 'Je livre dans ma commune', 'Je livre tout Abidjan', 'Je livre en région'],
          h: 'Le transport de volaille vivante par forte chaleur tue. Convenez d’une heure fraîche, tôt le matin.'),
    ],
  ),
  'Bétail & Élevage': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez chaque bête entière, de profil, debout. C’est ainsi qu’on juge un animal.',
    etat: false,
    livraison: true,
    prixLabel: 'Prix par tête',
    titre: (s) => [_t(s, 'especeB'), _t(s, 'sexeB'), _t(s, 'ageB')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('especeB', 'Espèce',
          req: true,
          options: ['Mouton', 'Bélier', 'Chèvre', 'Bouc', 'Bœuf', 'Vache', 'Veau', 'Porc', 'Truie', 'Porcelet', 'Lapin', 'Aulacode (agouti)', 'Escargot', 'Âne', 'Cheval']),
      const Champ('sexeB', 'Sexe', req: true, options: ['Mâle', 'Femelle', 'Lot mixte']),
      const Champ('ageB', 'Âge', req: true, options: ['Moins de 3 mois', '3 à 6 mois', '6 mois à 1 an', '1 à 2 ans', '2 à 4 ans', 'Plus de 4 ans']),
      const Champ('poidsB', 'Poids approximatif', req: true, ph: 'Ex : 35 kg',
          h: 'Un mouton se vend au poids autant qu’à la vue. Le donner, même approximatif, évite trois négociations.'),
      _usageAnimal(const ['Boucherie', 'Reproduction', 'Fête religieuse (Tabaski, Noël)', 'Élevage / cheptel', 'Travail / trait', 'Lait']),
      const Champ('raceB', 'Race', ph: 'Ex : Djallonké, Sahélien, Balami'),
      Champ('gestation', 'Gestation',
          when: (s) => _t(s, 'sexeB') == 'Femelle',
          options: const ['Non gestante', 'Gestante', 'Vient de mettre bas', 'Suitée (avec petits)']),
      const Champ('nombreB', 'Nombre disponible', req: true, options: ['1 tête', '2 à 5 têtes', '5 à 20 têtes', '20 à 100 têtes', 'Plus de 100 têtes']),
      ..._sante('la bête'),
      const Champ('certifB', 'Documents',
          multi: true,
          options: ['Carnet de vaccination', 'Certificat vétérinaire', 'Certificat d’origine', 'Aucun document'],
          h: 'Un certificat vétérinaire est exigé pour transporter du bétail entre régions. Sans lui, le contrôle routier bloque le camion.'),
    ],
  ),
  'Chiens & Chats': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez l’animal éveillé, entier, et avec sa mère s’il est jeune. C’est le meilleur gage de sérieux.',
    etat: false,
    livraison: false,
    titre: (s) => [_t(s, 'especeC'), _t(s, 'raceC'), _t(s, 'ageC')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('especeC', 'Animal', req: true, options: ['Chien', 'Chiot', 'Chat', 'Chaton']),
      const Champ('raceC', 'Race',
          req: true, ph: 'Ex : Berger allemand, Rottweiler, croisé, chat de gouttière',
          h: '« Croisé » et « chat de gouttière » sont des réponses parfaitement honnêtes et se vendent très bien.'),
      const Champ('ageC', 'Âge', req: true, options: ['Moins de 8 semaines', '8 semaines à 3 mois', '3 à 6 mois', '6 mois à 1 an', '1 à 3 ans', 'Plus de 3 ans']),
      Champ('sevrage', 'Sevrage',
          req: true,
          when: (s) => RegExp('Chiot|Chaton').hasMatch(_t(s, 'especeC')) || RegExp('Moins de 8|8 semaines').hasMatch(_t(s, 'ageC')),
          options: const ['Sevré', 'En cours de sevrage', 'Non sevré, encore sous la mère'],
          h: (s) => RegExp('Non sevré').hasMatch(_t(s, 'sevrage'))
              ? '!Un chiot séparé de sa mère avant huit semaines développe des troubles et meurt souvent. Attendez le sevrage : il se vendra mieux, et il survivra.'
              : 'Huit semaines est le minimum. Un chiot sevré, vacciné et vermifugé se vend plusieurs fois le prix d’un chiot pris trop tôt.'),
      const Champ('sexeC', 'Sexe', req: true, options: ['Mâle', 'Femelle', 'Portée mixte']),
      _usageAnimal(const ['Compagnie', 'Garde', 'Chasse', 'Reproduction / élevage']),
      const Champ('sterilise', 'Stérilisation', options: ['Stérilisé', 'Non stérilisé', 'Trop jeune']),
      const Champ('pedigree', 'Papiers',
          req: true,
          options: ['Pedigree / LOF', 'Certificat de naissance', 'Carnet de santé uniquement', 'Aucun papier'],
          h: 'Un pedigree se vérifie. Sans papiers, un « pure race » se vend au prix d’un croisé — et c’est normal.'),
      const Champ('caractere', 'Caractère',
          multi: true,
          options: ['Sociable avec les enfants', 'S’entend avec d’autres animaux', 'Craintif', 'Dominant', 'Éduqué / propre', 'Aboie beaucoup'],
          h: 'Dire qu’un chien est dominant ou craintif évite qu’il revienne dans un mois. Un mauvais placement finit toujours mal pour l’animal.'),
      ..._sante('l’animal'),
    ],
  ),
  'Oiseaux, Poissons & Reptiles': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez l’animal vivant dans son installation, et non une image trouvée en ligne.',
    etat: false,
    livraison: true,
    titre: (s) => [_t(s, 'especeO'), _t(s, 'ageO')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('familleO', 'Famille', req: true, options: ['Oiseau', 'Poisson d’aquarium', 'Reptile', 'Rongeur', 'Autre']),
      const Champ('especeO', 'Espèce', req: true, dependDe: 'familleO', libre: 'Autre', table: {
        'Oiseau': ['Canari', 'Perruche ondulée', 'Inséparable', 'Mandarin', 'Tourterelle', 'Poule d’ornement', 'Paon'],
        'Poisson d’aquarium': ['Poisson rouge', 'Guppy', 'Combattant (betta)', 'Cichlidé', 'Scalaire', 'Silure d’ornement', 'Poissons assortis'],
        'Reptile': ['Tortue d’élevage déclarée', 'Gecko d’élevage', 'Iguane d’élevage'],
        'Rongeur': ['Hamster', 'Cochon d’Inde', 'Lapin nain', 'Souris', 'Rat domestique'],
      }),
      _protegee,
      const Champ('ageO', 'Âge', req: true, options: ['Jeune', 'Adulte', 'Reproducteur', 'Je ne sais pas']),
      Champ('origineO', 'Origine',
          req: true,
          options: const ['Né en captivité, élevage local', 'Élevage déclaré avec justificatif', 'Importé avec documents', 'Origine inconnue'],
          h: (s) => _t(s, 'origineO') == 'Origine inconnue'
              ? '!Un oiseau ou un reptile d’origine inconnue est présumé capturé dans la nature. Sans justificatif, l’annonce sera signalée.'
              : 'Un animal né en captivité se vend légalement et sereinement. Gardez le justificatif de l’éleveur.'),
      const Champ('nombreO', 'Nombre', req: true, options: ['À l’unité', 'Par paire', 'Petit groupe', 'Lot complet']),
      const Champ('installation', 'Fourni avec',
          multi: true,
          options: ['Cage', 'Aquarium', 'Terrarium', 'Mangeoire', 'Filtre / pompe', 'Chauffage', 'Aucun matériel']),
      ..._sante('l’animal'),
    ],
  ),
  'Aliments pour animaux': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez le sac et son étiquette : composition, date, numéro de lot.',
    etat: false,
    livraison: true,
    titre: (s) => [_t(s, 'typeAl'), _t(s, 'pourQui'), _t(s, 'condAl')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('pourQui', 'Pour quel animal',
          req: true,
          options: ['Volaille', 'Bétail', 'Porc', 'Chien', 'Chat', 'Poisson', 'Lapin', 'Oiseau', 'Aulacode']),
      const Champ('typeAl', 'Type d’aliment',
          req: true,
          options: ['Aliment complet', 'Provende', 'Son de blé', 'Tourteau', 'Maïs concassé', 'Croquettes', 'Pâtée', 'Fourrage / foin', 'Complément minéral', 'Vitamines']),
      Champ('stade', 'Stade',
          when: (s) => RegExp('Volaille|Porc|Bétail').hasMatch(_t(s, 'pourQui')),
          options: const ['Démarrage', 'Croissance', 'Finition', 'Ponte', 'Gestation / lactation']),
      const Champ('condAl', 'Conditionnement',
          req: true,
          options: ['Sac de 5 kg', 'Sac de 10 kg', 'Sac de 25 kg', 'Sac de 50 kg', 'En vrac', 'Petit sachet']),
      Champ('peremptionAl', 'Date limite',
          req: true,
          options: const ['Plus de 6 mois', '1 à 6 mois', 'Moins d’un mois', 'Dépassée', 'Sans date'],
          alerte: const Alerte(
            bon: 'Plus de 6 mois',
            ok: ['1 à 6 mois', 'Sans date'],
            texteBon: 'Date confortable. Vérifiez tout de même le sac : ni humidité, ni odeur de moisi.',
            texteMauvais: 'La date approche. Vérifiez l’état du sac avant d’acheter en quantité.',
            textes: {'Dépassée': 'INTERDIT. Un aliment périmé rend les bêtes malades et ne peut pas être vendu.'},
          ),
          bloque: const ['Dépassée'],
          motifBloc: 'Un aliment pour animaux dont la date est dépassée ne peut pas être vendu.',
          h: (s) => _t(s, 'peremptionAl') == 'Dépassée'
              ? '!Un aliment périmé ou moisi provoque des mortalités en élevage. Cette annonce ne sera pas publiée.'
              : 'Un aliment mal stocké moisit et devient toxique. Précisez qu’il est resté au sec.'),
      const Champ('marqueAl', 'Marque ou fabricant', ph: 'Ex : Ivograin, provende maison'),
      const Champ('grosAl', 'Vente en gros', type: TypeChamp.bascule),
    ],
  ),
  'Accessoires & Matériel': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez le matériel monté, et de près sur les points d’usure.',
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeMat'), _t(s, 'pourQuiM')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('pourQuiM', 'Pour quel animal',
          req: true,
          options: ['Volaille', 'Bétail', 'Porc', 'Chien', 'Chat', 'Poisson', 'Lapin', 'Oiseau', 'Tous animaux']),
      const Champ('typeMat', 'Type de matériel',
          req: true,
          options: ['Cage', 'Poulailler', 'Couveuse / incubateur', 'Mangeoire', 'Abreuvoir', 'Éleveuse / chauffage', 'Aquarium', 'Terrarium', 'Niche', 'Laisse et collier', 'Panier de transport', 'Litière', 'Clôture / grillage', 'Matériel de traite', 'Tondeuse animale', 'Produit de soin']),
      Champ('capaciteMat', 'Capacité',
          when: (s) => RegExp('Cage|Poulailler|Couveuse|Aquarium|Mangeoire|Abreuvoir').hasMatch(_t(s, 'typeMat')),
          options: const ['Moins de 10 sujets', '10 à 50 sujets', '50 à 200 sujets', 'Plus de 200 sujets', 'Petit volume', 'Grand volume']),
      const Champ('matiereMat', 'Matière', options: ['Métal galvanisé', 'Grillage', 'Bois', 'Plastique', 'Verre', 'Tissu']),
      const Champ('etatMat', 'Fonctionnement',
          req: true,
          options: ['Fonctionne parfaitement, essai possible', 'Fonctionne, petit défaut', 'En panne — pour pièces ou à réparer', 'Sans mécanisme'],
          alerte: Alerte(
            bon: 'Fonctionne parfaitement, essai possible',
            ok: ['Sans mécanisme', 'En panne — pour pièces ou à réparer'],
            texteBon: 'Le vendeur propose un essai devant vous. Exigez-le sur une couveuse : c’est le seul moyen de vérifier la régulation.',
            texteMauvais: 'Un défaut est annoncé. Demandez lequel exactement et faites brancher l’appareil avant de payer.',
            textes: {'En panne — pour pièces ou à réparer': 'Vendu en panne, et le vendeur le dit. Le prix doit être celui des pièces.'},
          )),
      const Champ('dimsMat', 'Dimensions', ph: 'Ex : 120 × 60 × 90 cm'),
      const Champ('grosMat', 'Vente en gros', type: TypeChamp.bascule),
    ],
  ),
};
