// =============================================================================
//  SANTÉ & BIEN-ÊTRE — six sous-catégories (port fidèle de src/data/sous/sante.dart).
//
//  La catégorie la plus dangereuse du site : une annonce de trop ne coûte pas de
//  l'argent, elle coûte la santé de quelqu'un. Quatre interdits, tous fondés sur
//  une règle ivoirienne réelle :
//
//  1. LES MÉDICAMENTS. Monopole pharmaceutique. Le marché de la rue (« les
//     médicaments par terre » d'Adjamé) : contrefaits, mal conservés, mal dosés.
//     Aucun médicament ne se vend ici, avec ou sans ordonnance.
//  2. LES PRODUITS ÉCLAIRCISSANTS (décret d'avril 2015), même règle qu'en Mode.
//  3. LES PROMESSES DE GUÉRISON. « Guérit le diabète », « fait maigrir de 10 kg
//     en une semaine » : ces annonces détournent des malades d'un vrai traitement.
//  4. LES ANABOLISANTS / HORMONES en nutrition sportive.
//
//  Tout le reste — tisanes, karité, matériel de confort, optique, sport — se
//  vend librement, et le formulaire le facilite.
// =============================================================================
import 'schema.dart';

String _t(Vals s, String cle) => (s[cle] ?? '').toString();

/// Le monopole pharmaceutique : aucun médicament ne se vend ici.
final _medicament = Champ('medicament', 'Nature du produit',
    req: true,
    options: const [
      'Complément alimentaire ou produit de bien-être',
      'Plante, tisane ou produit naturel',
      'Dispositif de confort (non médicamenteux)',
      'Médicament, avec ou sans ordonnance'
    ],
    alerte: const Alerte(
      bon: 'Complément alimentaire ou produit de bien-être',
      ok: ['Plante, tisane ou produit naturel', 'Dispositif de confort (non médicamenteux)'],
      texteBon: 'Complément ou produit de bien-être : vente libre. Lisez la composition, et parlez-en à votre médecin si vous suivez un traitement.',
      texteMauvais: 'INTERDIT. La vente de médicaments est réservée aux pharmacies. Les produits vendus hors circuit sont souvent contrefaits ou mal conservés.',
      textes: {
        'Plante, tisane ou produit naturel': 'Produit naturel. « Naturel » ne veut pas dire « sans effet » : certaines plantes interagissent avec les traitements. Demandez l’avis d’un professionnel.',
        'Dispositif de confort (non médicamenteux)': 'Dispositif de confort, vente libre. Vérifiez l’état et l’hygiène avant l’achat.'
      },
    ),
    bloque: const ['Médicament, avec ou sans ordonnance'],
    motifBloc: 'La vente de médicaments est un monopole des pharmacies : elle ne peut pas se faire sur Chap.ci.',
    h: (s) => RegExp('Médicament').hasMatch(_t(s, 'medicament'))
        ? '!La vente de médicaments hors pharmacie est interdite en Côte d’Ivoire. Les produits du marché de la rue sont souvent contrefaits, mal dosés ou conservés sous 30 °C — ils tuent. Cette annonce ne sera pas publiée.'
        : 'Les compléments, tisanes et produits de bien-être se vendent librement. Les médicaments, jamais — même sans ordonnance, même en pharmacie fermée.');

/// Le décret d'avril 2015 — même règle qu'en Mode & Beauté.
final _eclaircissant = Champ('eclaircissant', 'Ce produit éclaircit-il la peau ?',
    req: true,
    options: const ['Non — aucun agent éclaircissant', 'Oui — il contient un agent éclaircissant'],
    bloque: const ['Oui — il contient un agent éclaircissant'],
    motifBloc: 'Les produits éclaircissants sont interdits à la vente en Côte d’Ivoire (décret d’avril 2015).',
    h: (s) => RegExp('Oui').hasMatch(_t(s, 'eclaircissant'))
        ? '!Le décret d’avril 2015 interdit en Côte d’Ivoire la fabrication, la commercialisation ET l’utilisation des dépigmentants contenant du mercure, des corticoïdes, de la vitamine A éclaircissante ou de l’hydroquinone au-delà de 2 %. Cette annonce ne sera pas publiée.'
        : 'Même règle qu’en Mode & Beauté : un décret adopté en Conseil des ministres en avril 2015 interdit ces produits en Côte d’Ivoire.');

/// Le vrai danger de cette catégorie : détourner un malade d'un traitement.
final _promesse = Champ('promesse', 'Ce que vous annoncez',
    req: true,
    options: const [
      'Aucune promesse de guérison — bien-être uniquement',
      'Aide à la digestion, à l’énergie, au confort',
      'Guérit une maladie (diabète, hypertension, VIH, cancer…)',
      'Fait maigrir rapidement et sans effort'
    ],
    bloque: const ['Guérit une maladie (diabète, hypertension, VIH, cancer…)', 'Fait maigrir rapidement et sans effort'],
    motifBloc: 'Annoncer qu’un produit guérit une maladie détourne des malades d’un vrai traitement : c’est interdit sur Chap.ci.',
    h: (s) {
      final p = _t(s, 'promesse');
      if (RegExp('Guérit une maladie').hasMatch(p)) return '!Promettre de guérir le diabète, l’hypertension, le VIH ou un cancer détourne des malades d’un traitement qui, lui, les soigne. C’est le danger le plus réel de ce rayon. Cette annonce ne sera pas publiée.';
      if (RegExp('maigrir rapidement').hasMatch(p)) return '!« Perdre 10 kg en une semaine » n’existe pas, et les produits qui le promettent contiennent souvent des diurétiques ou des laxatifs dangereux. Cette annonce ne sera pas publiée.';
      return 'Vantez le confort, l’énergie, le goût, la qualité de la plante. Pas la guérison — c’est là que se joue la limite.';
    });

final _peremptionS = Champ('peremptionS', 'Date de péremption',
    req: true,
    options: const ['Plus d’un an', '6 mois à 1 an', '3 à 6 mois', 'Moins de 3 mois', 'Dépassée', 'Sans date (produit brut)'],
    bloque: const ['Dépassée'],
    motifBloc: 'Un produit de santé dont la date est dépassée ne peut pas être vendu.',
    h: (s) {
      final p = _t(s, 'peremptionS');
      if (p == 'Dépassée') return '!Un complément ou un cosmétique périmé peut être toxique. Cette annonce ne sera pas publiée.';
      if (p == 'Moins de 3 mois') return '!Dites-le dans le titre et ajustez le prix : l’acheteur doit savoir qu’il lui reste peu de temps.';
      return 'La date figure sur l’emballage, souvent près du code-barres. Photographiez-la : cela évite toutes les questions.';
    });

final _scelle = Champ('scelle', 'Emballage',
    req: true,
    options: const ['Neuf, scellé d’origine', 'Neuf, emballage ouvert', 'Entamé', 'Reconditionné par mes soins'],
    h: (s) => RegExp('Entamé|Reconditionné').hasMatch(_t(s, 'scelle'))
        ? '!Un produit à avaler ou à appliquer, une fois ouvert ou reconditionné, ne peut plus être garanti. Beaucoup d’acheteurs refuseront — et ils ont raison.'
        : 'Le scellé d’origine est la meilleure garantie qu’un acheteur puisse avoir sur ce rayon.');

final Map<String, Schema> sante = {
  'Compléments & Tisanes': Schema(
    etat: false,
    livraison: true,
    titre: (s) => [_t(s, 'typeComp'), _t(s, 'marqueS'), _t(s, 'contenanceS')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeComp', 'Type de produit',
          req: true,
          options: ['Tisane / infusion', 'Plante séchée', 'Gélules', 'Comprimés complément', 'Sirop naturel', 'Huile essentielle', 'Huile végétale', 'Miel médicinal', 'Poudre (moringa, baobab…)', 'Vitamines', 'Probiotiques', 'Écorce / racine', 'Complément minéral']),
      _medicament,
      _promesse,
      const Champ('plante', 'Plante ou principe', ph: 'Ex : moringa, kinkeliba, gingembre, curcuma',
          h: 'Nommez la plante précisément : c’est ce que l’acheteur tape dans la recherche.'),
      const Champ('marqueS', 'Marque ou producteur', ph: 'Ex : préparation artisanale, marque connue'),
      const Champ('contenanceS', 'Contenance', req: true, ph: 'Ex : 60 gélules, 250 g, 50 cl'),
      _scelle,
      _peremptionS,
      const Champ('origineS', 'Origine', req: true, options: ['Production ivoirienne', 'Autre pays africain', 'Importé', 'Préparation artisanale personnelle']),
    ],
  ),
  'Soins & Hygiène': Schema(
    etat: false,
    livraison: true,
    titre: (s) => [_t(s, 'typeSoin'), _t(s, 'marqueS'), _t(s, 'contenanceS')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeSoin', 'Type de produit',
          req: true,
          options: ['Savon', 'Savon noir', 'Beurre de karité', 'Huile de coco', 'Crème hydratante', 'Gel douche', 'Shampoing', 'Déodorant', 'Dentifrice', 'Protection intime', 'Couches adulte', 'Gel hydroalcoolique', 'Coton / compresses', 'Pansements', 'Antiseptique', 'Serviettes hygiéniques', 'Crème solaire']),
      _medicament,
      _eclaircissant,
      _promesse,
      const Champ('marqueS', 'Marque', ph: 'Ex : Dudu Osun, artisanal, Nivea'),
      const Champ('contenanceS', 'Contenance', req: true, ph: 'Ex : 250 ml, 100 g, lot de 3'),
      _scelle,
      _peremptionS,
      const Champ('naturelS', 'Composition',
          req: true,
          options: ['100 % naturel', 'Majoritairement naturel', 'Formulation classique', 'Je ne sais pas'],
          h: 'Le karité et le savon noir ivoiriens se vendent très bien sur leur naturalité. Ne l’annoncez que si c’est vrai.'),
    ],
  ),
  'Matériel médical de confort': Schema(
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeMatS'), _t(s, 'marqueS')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeMatS', 'Type de matériel',
          req: true,
          options: ['Fauteuil roulant', 'Béquilles', 'Canne', 'Déambulateur', 'Attelle / orthèse', 'Ceinture lombaire', 'Bas de contention', 'Matelas anti-escarres', 'Coussin ergonomique', 'Chaise percée', 'Barre d’appui', 'Tensiomètre', 'Glucomètre', 'Oxymètre', 'Thermomètre', 'Balance', 'Pilulier', 'Nébuliseur'],
          h: 'Les échographes, autoclaves et matériels de laboratoire ne sont pas ici : leur revente est réservée aux distributeurs agréés (voir Matériel Pro).'),
      _medicament,
      const Champ('marqueS', 'Marque'),
      const Champ('etatMatS', 'Fonctionnement',
          req: true, options: ['Fonctionne, essai possible', 'Fonctionne, petit défaut', 'En panne — pour pièces', 'Sans mécanisme']),
      Champ('hygieneS', 'Hygiène',
          req: true,
          options: const ['Désinfecté, prêt à l’usage', 'À désinfecter avant usage', 'Housse ou mousse à changer', 'Usage strictement personnel — non revendable'],
          h: (s) => RegExp('strictement personnel').hasMatch(_t(s, 'hygieneS'))
              ? '!Bas de contention, embouts buccaux de nébuliseur, protections : ces pièces ne se revendent pas. Vendez l’appareil sans elles, en le précisant.'
              : 'Un matériel de confort d’occasion se désinfecte toujours avant réemploi, même s’il paraît propre.'),
      Champ('poidsMaxS', 'Poids supporté',
          when: (s) => RegExp('Fauteuil|Déambulateur|Chaise percée|Barre').hasMatch(_t(s, 'typeMatS')),
          options: const ['Jusqu’à 80 kg', 'Jusqu’à 100 kg', 'Jusqu’à 120 kg', 'Plus de 120 kg'],
          h: 'Le poids supporté est ce qui décide de l’achat pour un aidant. Sans lui, il ne se déplace pas.'),
      Champ('etalonnage', 'Étalonnage',
          when: (s) => RegExp('Tensiomètre|Glucomètre|Oxymètre|Balance|Thermomètre').hasMatch(_t(s, 'typeMatS')),
          options: const ['Étalonné récemment', 'Jamais étalonné', 'Je ne sais pas'],
          h: 'Un tensiomètre déréglé donne des chiffres faux, et c’est pire que pas de tensiomètre du tout.'),
      const Champ('accessoiresS', 'Fourni avec',
          multi: true, options: ['Notice', 'Chargeur', 'Brassard', 'Bandelettes', 'Housse', 'Facture', 'Sangles de rechange']),
    ],
  ),
  'Optique & Audition': Schema(
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeOpt'), _t(s, 'marqueS')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeOpt', 'Type',
          req: true,
          options: ['Monture de lunettes', 'Lunettes de soleil', 'Lunettes de lecture', 'Étui à lunettes', 'Cordon', 'Loupe', 'Appareil auditif', 'Pile pour appareil auditif', 'Produit d’entretien lentilles', 'Verres correcteurs']),
      const Champ('correction', 'Correction',
          req: true,
          options: ['Monture seule, sans verres correcteurs', 'Verres de lecture standard (+1, +1,5, +2…)', 'Verres correcteurs à ma vue', 'Verres solaires non correcteurs'],
          alerte: Alerte(
            bon: 'Monture seule, sans verres correcteurs',
            ok: ['Verres de lecture standard (+1, +1,5, +2…)', 'Verres solaires non correcteurs'],
            texteBon: 'Monture seule : vous y ferez monter vos propres verres chez un opticien. C’est la bonne façon d’acheter des lunettes d’occasion.',
            texteMauvais: 'Des verres taillés pour la vue de quelqu’un d’autre fatiguent les yeux et donnent des maux de tête. Achetez la monture, et faites tailler vos verres.',
            textes: {
              'Verres de lecture standard (+1, +1,5, +2…)': 'Verres de lecture standard : ils conviennent si votre correction correspond. Une visite chez l’opticien reste préférable.',
              'Verres solaires non correcteurs': 'Verres solaires sans correction. Vérifiez la catégorie de protection UV — une lunette sombre sans filtre UV est pire que pas de lunette.'
            },
          ),
          h: 'C’est LA question des lunettes d’occasion. La monture se revend très bien ; les verres, non — ils sont taillés pour un œil précis.'),
      const Champ('marqueS', 'Marque', ph: 'Ex : Ray-Ban, sans marque'),
      Champ('uv', 'Protection UV',
          when: (s) => RegExp('soleil').hasMatch(_t(s, 'typeOpt')),
          options: const ['Catégorie 3 (soleil fort)', 'Catégorie 2', 'Catégorie 1', 'Catégorie 4 (montagne)', 'Non indiquée'],
          h: 'Sous le soleil d’Abidjan, une lunette sombre sans filtre UV fait dilater la pupille et laisse entrer plus d’UV qu’à l’œil nu.'),
      const Champ('etatOpt', 'État',
          req: true, options: ['Neuf', 'Très bon état', 'Rayures légères sur les verres', 'Branche à réparer', 'Verres rayés']),
      Champ('hygieneOpt', 'Hygiène',
          req: true,
          when: (s) => RegExp('auditif').hasMatch(_t(s, 'typeOpt')),
          options: const ['Embouts neufs fournis', 'Embouts à changer', 'Usage strictement personnel — non revendable'],
          h: 'Les embouts d’un appareil auditif ne se partagent pas : ils se remplacent, et ils sont sur mesure.'),
      const Champ('accessoiresOpt', 'Fourni avec', multi: true, options: ['Étui', 'Chiffon', 'Cordon', 'Notice', 'Facture', 'Piles']),
    ],
  ),
  'Bien-être & Massage': Schema(
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeBien'), _t(s, 'marqueS')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeBien', 'Type',
          req: true,
          options: ['Huile de massage', 'Appareil de massage', 'Pistolet de massage', 'Tapis d’acupression', 'Coussin chauffant', 'Bouillotte', 'Encens', 'Diffuseur', 'Bougie parfumée', 'Sauna facial', 'Hammam / sauna portable', 'Ventouses', 'Rouleau de massage', 'Tapis de yoga', 'Balle de massage', 'Prestation de massage']),
      _medicament,
      _promesse,
      const Champ('marqueS', 'Marque'),
      Champ('prestationB', 'S’agit-il d’une prestation ?',
          req: true,
          options: const ['Non — vente d’un produit', 'Oui — je propose une séance'],
          h: (s) => RegExp('Oui').hasMatch(_t(s, 'prestationB'))
              ? 'Une prestation de massage bien-être se propose librement. Le massage thérapeutique et la kinésithérapie, eux, sont réservés aux professionnels diplômés.'
              : ''),
      Champ('lieuB', 'Où',
          multi: true,
          when: (s) => RegExp('Oui').hasMatch(_t(s, 'prestationB')),
          options: const ['Dans mon institut', 'À domicile', 'En entreprise', 'En hôtel']),
      Champ('dureeB', 'Durée de la séance',
          when: (s) => RegExp('Oui').hasMatch(_t(s, 'prestationB')),
          options: const ['30 minutes', '45 minutes', '1 heure', '1 h 30', '2 heures']),
      Champ('contenanceS', 'Contenance',
          when: (s) => RegExp('huile|encens|bougie|Diffuseur', caseSensitive: false).hasMatch(_t(s, 'typeBien')),
          ph: 'Ex : 100 ml'),
      _scelle,
      _peremptionS,
    ],
  ),
  'Nutrition sportive': Schema(
    etat: false,
    livraison: true,
    titre: (s) => [_t(s, 'typeNut'), _t(s, 'marqueS'), _t(s, 'contenanceS')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeNut', 'Type de produit',
          req: true,
          options: ['Protéine en poudre (whey)', 'Gainer / prise de masse', 'Créatine', 'BCAA / acides aminés', 'Brûleur de graisse', 'Pré-workout', 'Barre protéinée', 'Boisson isotonique', 'Multivitamines sportives', 'Oméga 3', 'Magnésium', 'Shaker', 'Substitut de repas']),
      _medicament,
      _promesse,
      Champ('dopant', 'Substances',
          req: true,
          options: const ['Aucune substance interdite — complément alimentaire courant', 'Contient un anabolisant, une hormone ou un stéroïde'],
          alerte: const Alerte(
            bon: 'Aucune substance interdite — complément alimentaire courant',
            texteBon: 'Complément alimentaire courant. Lisez tout de même la composition, et parlez-en à un médecin si vous suivez un traitement.',
            texteMauvais: 'INTERDIT ET DANGEREUX. Les anabolisants et hormones vendus hors circuit médical détruisent le foie, le cœur et la fertilité.',
          ),
          bloque: const ['Contient un anabolisant, une hormone ou un stéroïde'],
          motifBloc: 'La vente d’anabolisants, d’hormones et de stéroïdes est interdite : ils relèvent de la prescription médicale.',
          h: (s) => RegExp('anabolisant').hasMatch(_t(s, 'dopant'))
              ? '!Anabolisants, testostérone et hormones de croissance vendus en salle ou en ligne sont presque toujours contrefaits, et détruisent le foie, le cœur et la fertilité. Cette annonce ne sera pas publiée.'
              : 'Whey, créatine, BCAA et vitamines sont des compléments alimentaires ordinaires, en vente libre.'),
      const Champ('marqueS', 'Marque', ph: 'Ex : Optimum Nutrition, sans marque'),
      const Champ('contenanceS', 'Contenance', req: true, ph: 'Ex : 2 kg, 90 gélules'),
      const Champ('gout', 'Parfum', ph: 'Ex : chocolat, vanille, fraise'),
      _scelle,
      _peremptionS,
      const Champ('authenticiteN', 'Authenticité',
          req: true,
          options: ['Produit authentique, avec facture ou preuve', 'Produit authentique, sans preuve', 'Je ne sais pas'],
          h: 'La contrefaçon est massive sur la protéine en poudre : un pot rempli de farine et d’arôme se vend au prix du vrai. Le numéro de lot et le sceau sous le couvercle se vérifient.'),
    ],
  ),
};
