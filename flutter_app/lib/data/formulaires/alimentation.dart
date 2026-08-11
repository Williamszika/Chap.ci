// =============================================================================
//  ALIMENTATION & AGRICULTURE — dix sous-catégories (port fidèle de
//  src/data/sous/alimentation.dart). De la plantation à l'assiette.
//
//  Trois réalités ivoiriennes commandent les formulaires :
//
//  1. LA CHAÎNE DU FROID. Le poisson, la viande et les plats se vendent sous
//     30 °C. Une rupture ne se voit pas — elle se goûte trop tard. « Jamais
//     réfrigéré » sur du poisson frais refuse l'annonce.
//  2. LA DATE LIMITE. Un produit périmé ne se vend pas — la date dépassée
//     refuse l'annonce.
//  3. LE PRIX AU KILO, PAS « LE TAS ». Le vivrier se vend au tas, au panier, à
//     la cuvette — de vraies unités qu'on garde, mais on demande AUSSI le poids
//     approximatif, sans quoi aucun acheteur ne peut comparer deux annonces.
//
//  Le cacao et le café ont leur propre bloc : campagne, séchage, fèves
//  défectueuses. Un intrant phytosanitaire non homologué refuse aussi l'annonce.
// =============================================================================
import 'schema.dart';

String _t(Vals s, String cle) => (s[cle] ?? '').toString();

/// L'unité de vente : au tas ET au kilo, sinon rien ne se compare.
List<Champ> _quantite(String exemple) => [
      const Champ('unite', 'Unité de vente',
          req: true,
          options: ['Au kilogramme', 'Au sac', 'Au panier', 'À la cuvette', 'Au tas', 'À la tonne', 'Au litre', 'À la pièce', 'Au carton', 'Au régime', 'Au casier'],
          h: 'Le vivrier se vend au tas ou à la cuvette, et c’est très bien. Mais donnez aussi le poids ci-dessous : sans lui, personne ne peut comparer votre prix à celui d’à côté.'),
      Champ('poids', 'Poids ou volume approximatif',
          req: true, ph: exemple,
          h: 'Même approximatif — « environ 5 kg la cuvette » suffit. C’est ce qui fait choisir votre annonce plutôt qu’une autre.'),
      const Champ('stock', 'Quantité disponible',
          req: true,
          options: ['Petite quantité', 'Moins de 100 kg', '100 kg à 1 tonne', '1 à 10 tonnes', 'Plus de 10 tonnes', 'Production continue']),
      const Champ('gros', 'Vente en gros possible', type: TypeChamp.bascule,
          h: 'Cochez si vous fournissez restaurants, maquis, revendeuses ou exportateurs.'),
    ];

/// La date limite : elle refuse l'annonce quand elle est dépassée.
Champ _peremption(String quoi) => Champ(
      'peremption',
      'Date limite de consommation',
      req: true,
      options: const ['Produit frais, du jour', 'Plus de 6 mois', '1 à 6 mois', 'Moins d’un mois', 'Moins d’une semaine', 'Dépassée', 'Sans date (produit brut)'],
      alerte: const Alerte(
        bon: 'Produit frais, du jour',
        ok: ['Plus de 6 mois', '1 à 6 mois', 'Sans date (produit brut)'],
        texteBon: 'Produit du jour. Demandez quand même à voir la marchandise avant de payer.',
        texteMauvais: 'La date approche. Vérifiez-la vous-même sur l’emballage avant d’acheter, surtout si vous achetez en quantité.',
        textes: {
          'Dépassée': 'INTERDIT À LA VENTE. Un produit dont la date est dépassée ne peut pas être proposé sur Chap.ci.',
          'Sans date (produit brut)': 'Produit brut sans date imprimée — c’est normal pour du vivrier. Jugez à l’œil et à l’odeur, et achetez de préférence sur place.'
        },
      ),
      bloque: const ['Dépassée'],
      motifBloc: 'Un produit alimentaire dont la date limite est dépassée ne peut pas être vendu.',
      h: (s) {
        final p = _t(s, 'peremption');
        if (p == 'Dépassée') return '!Vendre $quoi périmé est interdit et dangereux. Cette annonce ne sera pas publiée.';
        if (p == 'Moins d’une semaine') return '!Dites-le clairement dans le titre et ajustez le prix : l’acheteur doit savoir qu’il lui reste peu de temps.';
        return '';
      },
    );

/// Le froid — ce qui ne se voit pas et se goûte trop tard.
final _froid = Champ('froid', 'Conservation',
    req: true,
    options: const ['Réfrigéré sans rupture', 'Congelé sans rupture', 'Frais du jour, non réfrigéré', 'Séché ou fumé', 'Conserve / stérilisé', 'Jamais réfrigéré'],
    h: (s) {
      final f = _t(s, 'froid');
      if (f == 'Jamais réfrigéré') return '!Sous 30 °C, un produit frais non réfrigéré se dégrade en quelques heures. S’il s’agit de poisson ou de viande, il ne peut pas être vendu ainsi.';
      if (RegExp('rupture').hasMatch(f)) return 'La rupture de froid est ce qui rend malade sans se voir. Le préciser est un vrai argument de sérieux.';
      return '';
    });

const _origine = Champ('origine', 'Origine',
    req: true,
    options: ['Ma production', 'Producteur de ma région', 'Marché de gros', 'Importé', 'Je ne sais pas'],
    h: '« Ma production » se vend mieux et se paie mieux. Si vous êtes producteur, dites-le et montrez le champ.');

final _bio = Champ('culture', 'Mode de culture',
    options: const ['Sans engrais ni pesticide', 'Culture conventionnelle', 'Certifié biologique', 'Agriculture raisonnée', 'Je ne sais pas'],
    h: (s) => _t(s, 'culture') == 'Certifié biologique'
        ? '!Une certification bio se prouve par un certificat d’organisme agréé. Ne l’annoncez que si vous l’avez : c’est vérifiable, et une fausse mention détruit la confiance.'
        : 'Beaucoup de petits producteurs cultivent sans intrants sans être certifiés. Dire « sans engrais ni pesticide » est honnête et se vend très bien.');

final Map<String, Schema> alimentation = {
  'Produits vivriers': Schema(
    etat: false,
    livraison: true,
    titre: (s) => [_t(s, 'produitV'), _t(s, 'poids'), _t(s, 'unite')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('produitV', 'Produit',
          req: true,
          options: ['Manioc', 'Igname', 'Banane plantain', 'Patate douce', 'Taro', 'Attiéké', 'Placali', 'Gari', 'Foutou', 'Farine de manioc', 'Riz local', 'Maïs', 'Mil / sorgho', 'Haricot / niébé', 'Arachide', 'Pois', 'Autre']),
      _origine,
      _bio,
      _peremption('un produit vivrier'),
      const Champ('transforme', 'État du produit',
          req: true,
          options: ['Brut, tel que récolté', 'Épluché / nettoyé', 'Transformé (attiéké, gari, farine)', 'Séché', 'Fermenté']),
      ..._quantite('Ex : environ 5 kg la cuvette'),
    ],
  ),
  'Fruits & Légumes': Schema(
    etat: false,
    livraison: true,
    titre: (s) => [_t(s, 'produitF'), _t(s, 'poids'), _t(s, 'unite')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('produitF', 'Produit',
          req: true,
          options: ['Mangue', 'Ananas', 'Banane douce', 'Papaye', 'Orange', 'Citron', 'Pastèque', 'Avocat', 'Noix de coco', 'Goyave', 'Corossol', 'Tomate', 'Piment', 'Aubergine', 'Gombo', 'Oignon', 'Chou', 'Carotte', 'Concombre', 'Salade', 'Épinard / feuilles', 'Autre']),
      _origine,
      _bio,
      const Champ('maturite', 'Maturité',
          req: true,
          options: ['Mûr, à consommer tout de suite', 'Presque mûr', 'Vert, à faire mûrir', 'Mélange'],
          h: 'Sur des fruits vendus en gros, la maturité décide de tout : un revendeur veut du vert, un particulier veut du mûr.'),
      _peremption('des fruits ou légumes'),
      _froid,
      ..._quantite('Ex : cageot de 20 kg'),
    ],
  ),
  'Céréales & Tubercules': Schema(
    etat: false,
    livraison: true,
    titre: (s) => [_t(s, 'produitC'), _t(s, 'poids'), _t(s, 'unite')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('produitC', 'Produit',
          req: true,
          options: ['Riz local', 'Riz importé', 'Maïs', 'Mil', 'Sorgho', 'Blé', 'Fonio', 'Igname', 'Manioc', 'Patate douce', 'Farine de blé', 'Farine de maïs', 'Semoule', 'Autre']),
      _origine,
      const Champ('qualiteGrain', 'Qualité',
          req: true,
          options: ['Trié, sans impuretés', 'Léger tri à faire', 'Non trié', 'Brisé / grain cassé'],
          h: 'Le taux de brisure fait le prix du riz. L’annoncer honnêtement évite le refus à la livraison.'),
      const Champ('humidite', 'Séchage',
          req: true,
          options: ['Bien séché, conservable', 'Séchage moyen', 'Récent, à sécher encore'],
          h: 'Un grain mal séché moisit en sac au bout de quelques semaines. C’est la première cause de perte sur du stockage.'),
      _peremption('des céréales'),
      const Champ('conditionnement', 'Conditionnement',
          req: true,
          options: ['Sac de 25 kg', 'Sac de 50 kg', 'Sac de 100 kg', 'En vrac', 'Sachets détail']),
      ..._quantite('Ex : sacs de 50 kg'),
    ],
  ),
  'Épices & Condiments': Schema(
    etat: false,
    livraison: true,
    titre: (s) => [_t(s, 'produitE'), _t(s, 'poids')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('produitE', 'Produit',
          req: true,
          options: ['Piment', 'Gingembre', 'Ail', 'Poivre', 'Cube / bouillon', 'Soumbala', 'Néré', 'Graine de courge (pistache)', 'Feuille de baobab', 'Kinkeliba', 'Curcuma', 'Clou de girofle', 'Sel', 'Huile de palme', 'Huile d’arachide', 'Beurre de karité', 'Pâte d’arachide', 'Tomate concentrée', 'Autre']),
      _origine,
      _bio,
      const Champ('formeE', 'Forme', req: true, options: ['Frais', 'Séché', 'En poudre', 'En pâte', 'En huile', 'En graines']),
      _peremption('un condiment'),
      const Champ('emballage', 'Emballage', req: true, options: ['Sachet scellé', 'Bocal / pot', 'Bidon', 'En vrac', 'Sous vide']),
      ..._quantite('Ex : sachet de 250 g'),
    ],
  ),
  'Produits du terroir': Schema(
    etat: false,
    livraison: true,
    titre: (s) => [_t(s, 'produitT'), _t(s, 'regionT'), _t(s, 'poids')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('produitT', 'Produit',
          req: true,
          options: ['Miel', 'Confiture', 'Sirop', 'Beurre de karité', 'Huile de coco', 'Noix de cajou', 'Noix de cola', 'Café moulu', 'Chocolat artisanal', 'Jus naturel', 'Vin de palme', 'Bissap séché', 'Gingembre confit', 'Attiéké de Dabou', 'Poisson fumé', 'Autre']),
      const Champ('regionT', 'Région d’origine',
          req: true,
          options: ['Abidjan et lagunes', 'Sud-Comoé', 'Bas-Sassandra', 'Montagnes (Man, Danané)', 'Centre (Bouaké, Yamoussoukro)', 'Nord (Korhogo, Ferké)', 'Est (Abengourou, Bondoukou)', 'Ouest (Daloa, Gagnoa)', 'Autre région'],
          h: 'L’origine régionale est ce qui fait la valeur d’un produit du terroir. Le miel de Korhogo et l’attiéké de Dabou se vendent sur leur nom.'),
      _origine,
      _bio,
      const Champ('artisanal', 'Fabrication', req: true, options: ['Fait main, artisanal', 'Petite unité de transformation', 'Industriel']),
      _peremption('un produit du terroir'),
      const Champ('emballageT', 'Emballage', req: true, options: ['Bocal / pot', 'Bouteille', 'Sachet scellé', 'Sous vide', 'En vrac']),
      ..._quantite('Ex : pot de 500 g'),
    ],
  ),
  'Boissons': Schema(
    etat: false,
    livraison: true,
    titre: (s) => [_t(s, 'produitB'), _t(s, 'contenanceB'), _t(s, 'unite')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('produitB', 'Boisson',
          req: true,
          options: ['Jus de fruits naturel', 'Bissap', 'Gingembre', 'Bandji / vin de palme', 'Eau minérale', 'Sucrerie / soda', 'Bière', 'Vin', 'Spiritueux', 'Café', 'Thé', 'Lait', 'Yaourt', 'Boisson énergisante', 'Autre']),
      Champ('alcool', 'Contient de l’alcool',
          req: true,
          options: const ['Sans alcool', 'Avec alcool'],
          h: (s) => _t(s, 'alcool') == 'Avec alcool'
              ? '!La vente d’alcool aux mineurs est interdite. Vérifiez l’âge de l’acheteur à la remise — c’est votre responsabilité.'
              : ''),
      const Champ('contenanceB', 'Contenance',
          req: true,
          options: ['25 cl', '33 cl', '50 cl', '75 cl', '1 litre', '1,5 litre', '5 litres', 'Bidon 20 litres', 'Fût']),
      _origine,
      const Champ('artisanaleB', 'Fabrication',
          req: true,
          options: ['Artisanale / maison', 'Petite unité', 'Industrielle'],
          h: 'Une boisson artisanale se conserve moins longtemps : précisez-le et gardez la chaîne du froid.'),
      _peremption('une boisson'),
      _froid,
      ..._quantite('Ex : casier de 12 bouteilles'),
    ],
  ),
  'Plats préparés': Schema(
    etat: false,
    livraison: true,
    prixLabel: 'Prix la portion',
    titre: (s) => [_t(s, 'plat'), _t(s, 'portions')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('plat', 'Plat',
          req: true,
          options: ['Attiéké poisson', 'Garba', 'Foutou sauce graine', 'Placali sauce gombo', 'Riz sauce', 'Kedjenou', 'Alloco', 'Braisé (poulet, poisson)', 'Soupe', 'Tchep', 'Couscous', 'Pâtisserie / gâteau', 'Beignets', 'Salade', 'Plateau-repas', 'Buffet', 'Autre']),
      const Champ('portions', 'Vendu par',
          req: true,
          options: ['Portion individuelle', 'Pour 2 personnes', 'Pour 4 personnes', 'Pour 10 personnes', 'Plat familial', 'Sur commande, à la demande']),
      Champ('quand', 'Préparation',
          req: true,
          options: const ['Préparé à la commande', 'Préparé du jour', 'Préparé la veille', 'Surgelé'],
          h: (s) => _t(s, 'quand') == 'Préparé la veille'
              ? '!Un plat de la veille doit avoir été réfrigéré sans rupture, et réchauffé à cœur. Dites-le, et baissez le prix.'
              : ''),
      _froid,
      _peremption('un plat préparé'),
      const Champ('hygieneP', 'Cuisine',
          req: true,
          options: ['Restaurant / maquis déclaré', 'Cuisine à domicile', 'Cantine d’entreprise', 'Traiteur professionnel'],
          h: 'Beaucoup de très bonne cuisine se fait à domicile ici, et cela se dit sans honte. Ce qui compte, c’est de le dire.'),
      const Champ('livraisonP', 'Livraison',
          req: true,
          options: ['À emporter uniquement', 'Livraison dans ma commune', 'Livraison tout Abidjan', 'Sur place et à emporter']),
      const Champ('allergenes', 'Contient',
          multi: true,
          options: ['Arachide', 'Fruits de mer', 'Poisson', 'Œuf', 'Lait', 'Gluten', 'Piment fort', 'Aucun de ces éléments'],
          h: 'L’arachide est le premier allergène ici, et il est partout. Le signaler peut éviter un accident grave.'),
    ],
  ),
  'Cacao & Café': Schema(
    etat: false,
    livraison: true,
    prixLabel: 'Prix au kilogramme',
    titre: (s) => [_t(s, 'produitCC'), _t(s, 'campagne'), _t(s, 'poids')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('produitCC', 'Produit',
          req: true,
          options: ['Fèves de cacao', 'Cacao en poudre', 'Beurre de cacao', 'Café robusta', 'Café arabica', 'Café moulu', 'Café vert', 'Cabosses fraîches']),
      const Champ('campagne', 'Campagne',
          req: true,
          options: ['Campagne principale (octobre–mars)', 'Campagne intermédiaire (avril–septembre)', 'Récolte précédente', 'Stock ancien'],
          h: 'La campagne fixe le prix bord champ. Un stock ancien se vend moins cher, et le dire évite la contestation à la pesée.'),
      Champ('sechageCC', 'Séchage',
          req: true,
          options: const ['Bien séché (humidité ≤ 8 %)', 'Séchage moyen', 'Insuffisamment séché', 'Non séché'],
          h: (s) => RegExp('Insuffisamment|Non séché').hasMatch(_t(s, 'sechageCC'))
              ? '!Des fèves mal séchées moisissent en sac et sont refusées à l’achat. Séchez encore avant de vendre — vous en tirerez bien plus.'
              : 'Le taux d’humidité est le premier critère de l’acheteur. En dessous de 8 %, les fèves se conservent et se vendent au meilleur prix.'),
      const Champ('defauts', 'Fèves défectueuses',
          req: true,
          options: ['Moins de 3 %', '3 à 5 %', '5 à 10 %', 'Plus de 10 %', 'Non trié'],
          h: 'Fèves moisies, plates, germées ou ardoisées. C’est ce qui est mesuré à la réception : l’annoncer évite la décote surprise.'),
      Champ('fermentation', 'Fermentation',
          when: (s) => RegExp('cacao|Cabosses', caseSensitive: false).hasMatch(_t(s, 'produitCC')),
          options: const ['Bien fermenté', 'Partiellement fermenté', 'Non fermenté']),
      _origine,
      _bio,
      const Champ('certifCC', 'Certification',
          options: ['Aucune', 'Rainforest Alliance', 'Fairtrade', 'Biologique', 'UTZ', 'Certification coopérative'],
          h: 'Une certification se prouve par un certificat au nom de la coopérative. Ne l’annoncez que si vous pouvez la montrer.'),
      ..._quantite('Ex : sacs de 65 kg'),
    ],
  ),
  'Semences & Intrants': Schema(
    etat: false,
    livraison: true,
    titre: (s) => [_t(s, 'typeIntrant'), _t(s, 'cultureCible'), _t(s, 'poids')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeIntrant', 'Type',
          req: true,
          options: ['Semences', 'Plants / boutures', 'Engrais', 'Pesticide', 'Herbicide', 'Fongicide', 'Aliment pour bétail', 'Aliment pour volaille', 'Terreau / substrat', 'Produit vétérinaire']),
      Champ('cultureCible', 'Pour quelle culture',
          multi: true,
          when: (s) => !RegExp('Aliment|vétérinaire').hasMatch(_t(s, 'typeIntrant')),
          options: const ['Cacao', 'Café', 'Hévéa', 'Palmier à huile', 'Anacarde', 'Coton', 'Riz', 'Maïs', 'Manioc', 'Igname', 'Maraîchage', 'Banane', 'Toutes cultures']),
      Champ('homologation', 'Homologation',
          req: true,
          when: (s) => RegExp('Pesticide|Herbicide|Fongicide|vétérinaire|Engrais').hasMatch(_t(s, 'typeIntrant')),
          options: const ['Produit homologué en Côte d’Ivoire', 'Homologation inconnue', 'Produit non homologué / importation parallèle'],
          alerte: const Alerte(
            bon: 'Produit homologué en Côte d’Ivoire',
            texteBon: 'Produit déclaré homologué. Vérifiez le numéro d’homologation sur l’étiquette avant d’acheter.',
            texteMauvais: 'INTERDIT. Les pesticides et produits vétérinaires non homologués sont interdits à la vente : ils empoisonnent les cultures, les sols et ceux qui les manipulent.',
          ),
          bloque: const ['Produit non homologué / importation parallèle'],
          motifBloc: 'Un pesticide ou un produit vétérinaire non homologué en Côte d’Ivoire ne peut pas être vendu.',
          h: (s) => RegExp('non homologué').hasMatch(_t(s, 'homologation'))
              ? '!Les produits phytosanitaires non homologués sont interdits, et dangereux pour celui qui les épand comme pour celui qui mange la récolte. Cette annonce ne sera pas publiée.'
              : 'Le numéro d’homologation figure sur l’étiquette. C’est ce que regarde un acheteur averti.'),
      Champ('varieteS', 'Variété',
          when: (s) => RegExp('Semences|Plants').hasMatch(_t(s, 'typeIntrant')),
          ph: 'Ex : maïs EV8728, hévéa GT1'),
      Champ('germination', 'Taux de germination',
          when: (s) => RegExp('Semences').hasMatch(_t(s, 'typeIntrant')),
          options: const ['Plus de 90 %', '80 à 90 %', '70 à 80 %', 'Moins de 70 %', 'Non testé']),
      _peremption('un intrant'),
      ..._quantite('Ex : sac de 50 kg'),
    ],
  ),
  'Poisson & Produits de mer': Schema(
    etat: false,
    livraison: true,
    titre: (s) => [_t(s, 'produitP'), _t(s, 'etatP'), _t(s, 'poids')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('produitP', 'Produit',
          req: true,
          options: ['Thon', 'Machoiron', 'Carpe', 'Tilapie', 'Sardine', 'Bar', 'Capitaine', 'Sole', 'Silure', 'Crevettes', 'Crabes', 'Poulpe', 'Escargots', 'Poisson fumé', 'Poisson séché', 'Mélange / friture']),
      const Champ('etatP', 'État', req: true, options: ['Frais du jour', 'Frais, glacé', 'Congelé', 'Fumé', 'Séché', 'Salé']),
      Champ('froidP', 'Chaîne du froid',
          req: true,
          options: const ['Réfrigéré sans rupture depuis la pêche', 'Congelé sans rupture', 'Sur glace', 'Fumé ou séché, pas de froid nécessaire', 'Jamais réfrigéré'],
          alerte: const Alerte(
            bon: 'Réfrigéré sans rupture depuis la pêche',
            ok: ['Congelé sans rupture', 'Sur glace', 'Fumé ou séché, pas de froid nécessaire'],
            texteBon: 'Chaîne du froid annoncée sans rupture. Vérifiez tout de même l’œil, brillant et bombé, et les branchies bien rouges.',
            texteMauvais: 'DANGER. Du poisson frais jamais réfrigéré sous 30 °C se dégrade en quelques heures et rend malade sans prévenir.',
          ),
          bloque: const ['Jamais réfrigéré'],
          motifBloc: 'Du poisson ou des produits de mer frais jamais réfrigérés ne peuvent pas être vendus : le risque sanitaire est réel.',
          h: (s) => _t(s, 'froidP') == 'Jamais réfrigéré'
              ? '!Sous 30 °C, du poisson frais non réfrigéré devient dangereux en quelques heures. Fumez-le, séchez-le ou glacez-le — mais ne le vendez pas ainsi.'
              : 'La rupture de froid est ce qui rend malade sans se voir. L’annoncer est un vrai argument de sérieux.'),
      const Champ('peche', 'Provenance',
          req: true,
          options: ['Pêche artisanale locale', 'Pêche industrielle', 'Élevage / pisciculture', 'Importé congelé', 'Marché de gros']),
      const Champ('vide', 'Préparation',
          multi: true,
          options: ['Entier', 'Vidé', 'Écaillé', 'En filets', 'En darnes', 'Nettoyé et prêt à cuire']),
      _peremption('du poisson'),
      ..._quantite('Ex : caisse de 20 kg'),
    ],
  ),
};
