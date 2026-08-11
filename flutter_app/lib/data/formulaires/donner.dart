// =============================================================================
//  À DONNER — sept sous-catégories (port fidèle de src/data/sous/donner.dart).
//
//  La seule rubrique du site sans prix : il est forcé à zéro, l'annonce
//  s'affiche « Gratuit ». Trois règles tiennent toute la rubrique :
//
//  1. UN DON NE SE PAIE PAS — MÊME PAS « JUSTE LE TRANSPORT ». « C'est gratuit,
//     payez juste le transport » est le piège le plus courant : le transfert
//     Mobile Money part, l'objet n'existe pas. Une contrepartie refuse l'annonce.
//  2. L'ARGENT NE SE DONNE PAS PAR PETITE ANNONCE, ni offert ni demandé.
//  3. CE QUI EST INTERDIT À LA VENTE RESTE INTERDIT AU DON : médicament, produit
//     périmé, siège auto accidenté, article rappelé, soin sans être soignant.
// =============================================================================
import 'schema.dart';

String _t(Vals s, String cle) => (s[cle] ?? '').toString();

bool _contient(Vals s, String cle, String val) {
  final v = s[cle];
  return v is List && v.contains(val);
}

bool _anyMatch(Vals s, String cle, String pattern) {
  final v = s[cle];
  if (v is! List) return false;
  final re = RegExp(pattern);
  return v.any((x) => re.hasMatch(x.toString()));
}

const _etatDon = ['Neuf, jamais servi', 'Très bon état', 'Bon état, traces d’usage', 'Usé mais utilisable', 'À réparer', 'Pour pièces'];

/// La question de la rubrique : un don qui se paie n'est pas un don.
final _contrepartie = Champ('contrepartie', 'Ce que vous demandez en échange',
    req: true,
    options: const [
      'Rien du tout — c’est un don',
      'Rien, mais la personne vient chercher elle-même',
      'Une participation aux frais de transport',
      'Une petite somme, symbolique'
    ],
    alerte: const Alerte(
      bon: 'Rien du tout — c’est un don',
      ok: ['Rien, mais la personne vient chercher elle-même'],
      texteBon: 'Don sans contrepartie. Si on vous réclame quoi que ce soit en cours de route, n’envoyez rien et signalez l’annonce.',
      texteMauvais: 'ARNAQUE. « C’est gratuit, payez juste le transport » est le piège le plus courant de ce rayon. N’envoyez jamais d’argent pour recevoir un don.',
      textes: {'Rien, mais la personne vient chercher elle-même': 'Don à retirer sur place, à vos frais de déplacement. C’est normal — mais rien ne se verse au donateur, jamais.'},
    ),
    bloque: const ['Une participation aux frais de transport', 'Une petite somme, symbolique'],
    motifBloc: 'Un don ne se paie pas, même « juste le transport ». Si vous voulez une contrepartie, publiez plutôt une annonce de vente à petit prix.',
    h: (s) => RegExp('participation aux frais|petite somme').hasMatch(_t(s, 'contrepartie'))
        ? '!Demander de l’argent pour un don, c’est exactement la formule des faux donateurs — et un transfert Mobile Money ne se récupère jamais. Si votre objet vaut quelque chose, il a sa place dans la rubrique normale, avec son prix affiché : c’est plus honnête et cela vous protège aussi.'
        : 'Un don ne coûte rien à celui qui le reçoit. S’il doit venir le chercher, dites-le simplement : cela ne compte pas comme un paiement.');

/// L'argent ne se donne pas par petite annonce, ni dans un sens ni dans l'autre.
final _natureDon = Champ('natureDon', 'Ce que vous donnez',
    req: true,
    options: const [
      'Un objet, un lot d’objets',
      'Du temps, un service, un coup de main',
      'De l’argent (espèces, Mobile Money)',
      'Je cherche à recevoir de l’argent'
    ],
    bloque: const ['De l’argent (espèces, Mobile Money)', 'Je cherche à recevoir de l’argent'],
    motifBloc: 'Chap.ci n’est pas une plateforme de collecte : les dons et les appels aux dons en argent ne s’y publient pas. Les objets et les services, oui.',
    h: (s) => RegExp('argent').hasMatch(_t(s, 'natureDon'))
        ? '!Nous ne publions aucune annonce d’argent, donné ou demandé. Le « donateur » qui offre une grosse somme réclame des frais de transfert au troisième message, et l’appel aux dons ne peut pas être vérifié depuis ici. Donnez un objet, du matériel, un service : cela se voit, cela se remet en main propre, et cela aide vraiment.'
        : 'Les objets et les coups de main se donnent ici. L’argent, non — ni offert, ni demandé.');

/// Où et comment la remise se fait. Rien ne s'envoie contre paiement.
final _remise = Champ('remise', 'Comment se fait la remise',
    req: true,
    options: const [
      'En main propre, dans un lieu public',
      'La personne vient chercher chez moi',
      'Je peux déposer dans la commune',
      'Par transporteur, à la charge du bénéficiaire'
    ],
    h: (s) {
      final r = _t(s, 'remise');
      if (RegExp('transporteur').hasMatch(r)) return '!Un envoi par transporteur est le terrain de l’arnaque : personne ne se voit, et le « transport » sert de prétexte à réclamer de l’argent. Préférez la main propre chaque fois que c’est possible.';
      if (RegExp('vient chercher chez moi').hasMatch(r)) return 'Si vous recevez chez vous, convenez d’un créneau en journée et ne restez pas seul. Un lieu public reste plus simple pour tout le monde.';
      return 'Le lieu public en journée est ce qui convient le mieux, des deux côtés.';
    });

const _pourQui = Champ('pourQui', 'À qui vous souhaitez donner',
    req: true,
    options: ['À qui en a besoin, premier arrivé', 'Une famille en difficulté', 'Un élève ou un étudiant', 'Une association, une ONG, un orphelinat', 'Un artisan qui veut s’installer', 'Peu importe'],
    h: 'Le dire évite d’avoir à répondre trente fois. Personne n’a à vous prouver quoi que ce soit : c’est vous qui choisissez.');

const _quantite = Champ('quantiteDon', 'Quantité',
    req: true,
    options: ['Une seule pièce', '2 à 5 pièces', 'Un petit lot (5 à 20)', 'Un gros lot (plus de 20)', 'Un carton complet', 'Plusieurs cartons'],
    h: 'Un gros lot trouve preneur plus vite auprès d’une association que d’un particulier. Dites-le dans le titre.');

final Map<String, Schema> aDonner = {
  'Vêtements & chaussures': Schema(
    couleurs: false,
    sansCouleur: 'Étalez le lot et photographiez-le tel qu’il est, sans le trier pour la photo. Une personne qui reçoit préfère savoir à quoi s’attendre.',
    etat: false,
    livraison: false,
    titre: (s) => [_t(s, 'typeVet'), _t(s, 'tailleVet'), _t(s, 'quantiteDon')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      _natureDon,
      _contrepartie,
      const Champ('typeVet', 'Type de vêtements',
          req: true, multi: true,
          options: ['Vêtements femme', 'Vêtements homme', 'Vêtements enfant', 'Vêtements bébé', 'Chaussures', 'Sacs', 'Pagnes & tissus', 'Tenues de travail', 'Uniformes scolaires', 'Vêtements de maternité', 'Manteaux & vestes']),
      Champ('hygieneVet', 'État d’hygiène',
          req: true,
          options: const ['Lavé et prêt à porter', 'Propre, à relaver par précaution', 'Non lavé', 'Sous-vêtements déjà portés'],
          alerte: const Alerte(
            bon: 'Lavé et prêt à porter',
            ok: ['Propre, à relaver par précaution'],
            texteBon: 'Lot lavé et prêt à porter. C’est ce qui fait la différence entre un don et un débarras.',
            texteMauvais: 'Lot non lavé : lavez-le avant de le porter, sans exception.',
            textes: {'Propre, à relaver par précaution': 'Propre, mais un passage en machine avant de porter reste la bonne habitude.'},
          ),
          bloque: const ['Sous-vêtements déjà portés'],
          motifBloc: 'Les sous-vêtements déjà portés ne se donnent pas : c’est une question d’hygiène, et cela vaut aussi pour un don.',
          h: (s) {
            final h = _t(s, 'hygieneVet');
            if (RegExp('Sous-vêtements').hasMatch(h)) return '!Culottes, slips, soutiens-gorge et chaussettes déjà portés ne se redonnent pas. Neufs et sous emballage, aucun problème.';
            if (h == 'Non lavé') return '!Laver le lot avant de le donner prend une machine et change tout pour celui qui le reçoit. Faites-le si vous le pouvez.';
            return 'Un lot lavé et plié part en une journée. Un lot en vrac reste en ligne des semaines.';
          }),
      const Champ('tailleVet', 'Tailles',
          multi: true,
          options: ['Bébé (0-2 ans)', 'Enfant (3-12 ans)', 'Ado', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL et plus', 'Tailles mélangées']),
      Champ('pointureVet', 'Pointures',
          multi: true,
          when: (s) => _contient(s, 'typeVet', 'Chaussures'),
          options: const ['Enfant 20-30', 'Enfant 31-35', '36-38', '39-41', '42-44', '45 et plus', 'Pointures mélangées']),
      const Champ('etatVet', 'État général', req: true, options: _etatDon),
      const Champ('saisonVet', 'Adapté à',
          multi: true,
          options: ['Tous les jours', 'Travail', 'École', 'Cérémonie', 'Sport', 'Pays froid'],
          h: 'Les vêtements pour pays froid partent très vite auprès de ceux qui préparent un départ. Signalez-les.'),
      _quantite,
      _pourQui,
      _remise,
    ],
  ),
  'Meubles & électroménager': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez le meuble en entier, chez vous, avec ce qu’il y a autour. On doit pouvoir juger son encombrement d’un coup d’œil.',
    etat: false,
    livraison: false,
    titre: (s) => [_t(s, 'typeMeuble'), _t(s, 'fonctionne')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      _natureDon,
      _contrepartie,
      const Champ('typeMeuble', 'Ce que vous donnez',
          req: true, libre: 'Autre meuble',
          options: ['Lit / matelas', 'Armoire', 'Commode', 'Table', 'Chaises', 'Canapé / fauteuil', 'Étagère', 'Bureau', 'Réfrigérateur', 'Congélateur', 'Cuisinière', 'Four', 'Micro-ondes', 'Machine à laver', 'Ventilateur', 'Climatiseur', 'Téléviseur', 'Vaisselle & ustensiles', 'Rideaux & linge de maison']),
      Champ('fonctionne', 'État de marche',
          req: true,
          when: (s) => RegExp('Réfrigérateur|Congélateur|Cuisinière|Four|Micro-ondes|Machine|Ventilateur|Climatiseur|Téléviseur').hasMatch(_t(s, 'typeMeuble')),
          options: const ['Fonctionne, essai possible sur place', 'Fonctionne, petit défaut connu', 'En panne — à réparer', 'Je ne sais pas, jamais essayé'],
          alerte: const Alerte(
            bon: 'Fonctionne, essai possible sur place',
            ok: ['Fonctionne, petit défaut connu'],
            texteBon: 'L’appareil s’essaie sur place avant d’être emporté. Branchez-le devant la personne : cela règle tout.',
            texteMauvais: 'Appareil en panne ou non essayé. Il est donné tel quel : n’engagez pas de frais de transport avant de savoir ce qu’il vaut.',
            textes: {'Fonctionne, petit défaut connu': 'Petit défaut annoncé : c’est honnête, et cela évite une déception après le transport.'},
          ),
          h: (s) => RegExp('En panne|jamais essayé').hasMatch(_t(s, 'fonctionne'))
              ? 'Dites-le franchement dans le titre : « en panne, pour pièces ». Beaucoup de réparateurs cherchent exactement cela, et personne ne se déplace pour rien.'
              : 'Un appareil qu’on branche devant la personne ne se discute plus. C’est le meilleur geste de ce rayon.'),
      const Champ('etatMeuble', 'État général', req: true, options: _etatDon),
      const Champ('encombrement', 'Encombrement',
          req: true,
          options: ['Se porte à une personne', 'Se porte à deux', 'Se démonte', 'Camionnette nécessaire', 'Kia / camion nécessaire'],
          h: 'C’est LA question qui décide si quelqu’un se déplace. Un lit à deux places sans camionnette ne trouve pas preneur.'),
      Champ('delaiRetrait', 'Délai de retrait',
          req: true,
          options: const ['Aujourd’hui ou demain', 'Dans la semaine', 'Dans le mois', 'Sans urgence'],
          h: (s) => RegExp('Aujourd’hui').hasMatch(_t(s, 'delaiRetrait'))
              ? 'Urgent : écrivez-le aussi dans le titre, sinon personne ne le voit à temps.'
              : ''),
      _quantite,
      _pourQui,
      _remise,
    ],
  ),
  'Fournitures & matériel scolaire': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez le lot posé à plat. À la rentrée, une photo claire d’un lot de cahiers part dans l’heure.',
    etat: false,
    livraison: false,
    titre: (s) => [_t(s, 'typeScol'), _t(s, 'niveauScol'), _t(s, 'quantiteDon')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      _natureDon,
      _contrepartie,
      const Champ('typeScol', 'Ce que vous donnez',
          req: true, multi: true,
          options: ['Cahiers', 'Livres scolaires', 'Romans & BD', 'Cartable / sac', 'Trousse & petit matériel', 'Uniformes', 'Calculatrice', 'Ordinateur portable', 'Tablette', 'Matériel de dessin', 'Instruments de géométrie', 'Dictionnaire', 'Manuels universitaires', 'Blouse']),
      const Champ('niveauScol', 'Niveau',
          multi: true, req: true,
          options: ['Maternelle', 'Primaire (CP-CM2)', 'Collège (6e-3e)', 'Lycée (2nde-Tle)', 'Université', 'Formation professionnelle', 'Tous niveaux']),
      Champ('matiereScol', 'Matières concernées',
          multi: true,
          when: (s) => _anyMatch(s, 'typeScol', 'Livres scolaires|Manuels'),
          options: const ['Français', 'Mathématiques', 'Physique-Chimie', 'SVT', 'Histoire-Géographie', 'Anglais', 'Philosophie', 'Économie', 'Informatique', 'Droit', 'Médecine', 'Toutes matières']),
      const Champ('etatScol', 'État', req: true, options: _etatDon),
      Champ('anneeScol', 'Programme',
          when: (s) => _anyMatch(s, 'typeScol', 'Livres scolaires|Manuels'),
          options: const ['Programme en cours', 'Programme récent (2 à 3 ans)', 'Programme ancien', 'Je ne sais pas'],
          h: 'Un manuel au programme actuel vaut de l’or à la rentrée. Un ancien programme sert quand même : dites-le, l’élève choisira.'),
      _quantite,
      _pourQui,
      _remise,
    ],
  ),
  'Bébé & enfant': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez l’article entier, les sangles et l’étiquette de norme s’il y en a une. C’est ce que regarde un parent prudent.',
    etat: false,
    livraison: false,
    titre: (s) => [_t(s, 'typeBebeDon'), _t(s, 'ageBebeDon')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      _natureDon,
      _contrepartie,
      const Champ('typeBebeDon', 'Ce que vous donnez',
          req: true,
          options: ['Poussette', 'Siège auto', 'Lit à barreaux', 'Berceau', 'Parc', 'Chaise haute', 'Baignoire', 'Table à langer', 'Porte-bébé', 'Stérilisateur', 'Chauffe-biberon', 'Jouets', 'Livres pour enfants', 'Vêtements bébé', 'Couches non entamées', 'Tapis d’éveil', 'Trotteur']),
      Champ('accidentSiege', 'Ce siège a-t-il subi un accident ?',
          req: true,
          when: (s) => RegExp('Siège auto').hasMatch(_t(s, 'typeBebeDon')),
          options: const ['Non, jamais', 'Oui, un choc léger', 'Oui, un accident', 'Je ne sais pas — je l’ai eu d’occasion'],
          alerte: const Alerte(
            bon: 'Non, jamais',
            texteBon: 'Siège jamais accidenté. Vérifiez tout de même la date de fabrication sous la coque : au-delà de dix ans, le plastique se fragilise.',
            texteMauvais: 'À ÉCARTER. Un siège auto ayant subi un choc a une structure fragilisée qui ne se voit pas, et il ne protège plus.',
          ),
          bloque: const ['Oui, un choc léger', 'Oui, un accident', 'Je ne sais pas — je l’ai eu d’occasion'],
          motifBloc: 'Un siège auto ayant subi un choc — ou dont l’histoire est inconnue — ne protège plus l’enfant. Il ne se donne pas.',
          h: (s) => (_t(s, 'accidentSiege').isNotEmpty && _t(s, 'accidentSiege') != 'Non, jamais')
              ? '!Après un choc, même léger, la coque d’un siège auto se fissure de l’intérieur sans rien laisser voir. Le siège paraît neuf et ne retient plus l’enfant. Cette annonce ne sera pas publiée : ce siège se jette, il ne se transmet pas.'
              : 'C’est la seule question qui compte sur un siège auto d’occasion, et elle ne se lit sur aucune photo. Merci d’y répondre honnêtement.'),
      Champ('rappelBebeDon', 'Rappel fabricant',
          req: true,
          when: (s) => RegExp('Poussette|Lit à barreaux|Berceau|Parc|Chaise haute|Trotteur|Porte-bébé').hasMatch(_t(s, 'typeBebeDon')),
          options: const ['Aucun rappel connu', 'Article concerné par un rappel', 'Je ne sais pas'],
          bloque: const ['Article concerné par un rappel'],
          motifBloc: 'Un article de puériculture faisant l’objet d’un rappel fabricant ne peut pas être remis en circulation, même gratuitement.',
          h: (s) => (RegExp('rappel').hasMatch(_t(s, 'rappelBebeDon')) && !RegExp('Aucun').hasMatch(_t(s, 'rappelBebeDon')))
              ? '!Un article rappelé a été retiré parce qu’il a blessé un enfant. Le donner le remet en circulation. Cette annonce ne sera pas publiée.'
              : 'Le rappel se cherche avec la marque et le modèle. Deux minutes, et cela peut éviter un accident.'),
      Champ('hygieneBebeDon', 'Hygiène',
          req: true,
          options: const ['Nettoyé, housse lavée', 'Propre, à nettoyer par précaution', 'Non nettoyé', 'Tétines, biberons ou sucettes déjà utilisés'],
          bloque: const ['Tétines, biberons ou sucettes déjà utilisés'],
          motifBloc: 'Tétines, biberons et sucettes déjà utilisés ne se redonnent pas : ils ne se stérilisent pas complètement.',
          h: (s) => RegExp('Tétines').hasMatch(_t(s, 'hygieneBebeDon'))
              ? '!Une tétine ou un biberon déjà utilisé garde des micro-fissures où les bactéries se logent. Neufs et sous emballage, aucun problème.'
              : 'Un article de puériculture se nettoie toujours avant réemploi, même s’il paraît propre.'),
      const Champ('ageBebeDon', 'Âge concerné', req: true, multi: true, options: ['0-6 mois', '6-12 mois', '1-2 ans', '2-4 ans', '4-8 ans', '8-12 ans']),
      const Champ('etatBebeDon', 'État', req: true, options: _etatDon),
      const Champ('completBebeDon', 'Fourni avec', multi: true, options: ['Notice', 'Housse', 'Sangles complètes', 'Matelas', 'Pièces de rechange', 'Emballage d’origine', 'Rien de plus']),
      _quantite,
      _pourQui,
      _remise,
    ],
  ),
  'Nourriture & hygiène': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez les emballages ET les dates. Sur ce rayon, la date est l’information principale.',
    etat: false,
    livraison: false,
    titre: (s) => [_t(s, 'typeNourr'), _t(s, 'peremptionDon')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      _natureDon,
      _contrepartie,
      Champ('typeNourr', 'Ce que vous donnez',
          req: true,
          options: const ['Riz, pâtes, céréales', 'Conserves', 'Huile', 'Sucre, sel, farine', 'Lait en poudre', 'Fruits & légumes', 'Produits frais', 'Plat cuisiné maison', 'Eau & boissons', 'Savon & hygiène', 'Couches bébé', 'Serviettes hygiéniques', 'Produits d’entretien', 'Médicaments'],
          bloque: const ['Médicaments'],
          motifBloc: 'Un médicament donné reste un médicament remis hors pharmacie : c’est interdit en Côte d’Ivoire, au don comme à la vente.',
          h: (s) => RegExp('Médicaments').hasMatch(_t(s, 'typeNourr'))
              ? '!La vente et la remise de médicaments sont réservées aux pharmaciens, et un médicament mal conservé sous 30 °C devient dangereux. Le don ne change rien à cette règle. Cette annonce ne sera pas publiée.'
              : ''),
      Champ('peremptionDon', 'Date de péremption',
          req: true,
          options: const ['Plus de 6 mois', '1 à 6 mois', 'Moins d’un mois', 'À consommer dans les jours qui viennent', 'Dépassée', 'Sans date (produit brut)'],
          alerte: const Alerte(
            bon: 'Plus de 6 mois',
            ok: ['1 à 6 mois', 'Moins d’un mois', 'À consommer dans les jours qui viennent', 'Sans date (produit brut)'],
            texteBon: 'Date largement valable.',
            texteMauvais: 'À ÉCARTER. Un produit dont la date est dépassée ne se donne pas : il rend malade exactement comme s’il avait été vendu.',
            textes: {
              'Moins d’un mois': 'Date proche : dites-le en clair, la personne saura qu’il faut consommer vite.',
              'À consommer dans les jours qui viennent': 'À consommer tout de suite. Écrivez-le dans le titre, et donnez-le aujourd’hui.',
              'Sans date (produit brut)': 'Produit brut sans date : jugez à l’odeur et à l’aspect, et dites franchement depuis quand vous l’avez.'
            },
          ),
          bloque: const ['Dépassée'],
          motifBloc: 'Un produit périmé ne se donne pas. Le don n’est pas une façon d’écouler ce qui ne se vend plus.',
          h: (s) => _t(s, 'peremptionDon') == 'Dépassée'
              ? '!Donner un produit périmé, c’est donner une intoxication. Cette annonce ne sera pas publiée.'
              : 'La date figure sur l’emballage, souvent près du code-barres. Photographiez-la : c’est ce que la personne regardera en premier.'),
      Champ('chaineFroid', 'Conservation',
          req: true,
          when: (s) => RegExp('Produits frais|Plat cuisiné|Lait en poudre|Fruits').hasMatch(_t(s, 'typeNourr')),
          options: const ['Conservé au froid depuis le départ', 'Sorti du froid il y a moins de deux heures', 'Hors froid depuis plus de deux heures', 'Ne nécessite pas de froid'],
          bloque: const ['Hors froid depuis plus de deux heures'],
          motifBloc: 'Un produit frais ou un plat cuisiné laissé plus de deux heures hors du froid ne se donne pas.',
          h: (s) {
            if (RegExp('plus de deux heures').hasMatch(_t(s, 'chaineFroid'))) return '!Sous 30 °C, deux heures suffisent à rendre un plat dangereux. Cette annonce ne sera pas publiée — et ne donnez pas ce plat.';
            if (RegExp('Plat cuisiné').hasMatch(_t(s, 'typeNourr'))) return 'Un plat cuisiné se donne le jour même, encore chaud ou sorti du froid. Dites l’heure à laquelle il a été préparé.';
            return '';
          }),
      Champ('emballageDon', 'Emballage',
          req: true,
          options: const ['Neuf, scellé d’origine', 'Ouvert mais refermé proprement', 'Entamé', 'En vrac'],
          h: (s) => RegExp('Entamé|En vrac').hasMatch(_t(s, 'emballageDon'))
              ? 'Un produit entamé ne se refuse pas, mais dites-le : la personne décidera elle-même.'
              : 'Un produit scellé rassure et se garde plus longtemps.'),
      _quantite,
      _pourQui,
      _remise,
    ],
  ),
  'Coup de main & services': Schema(
    couleurs: false,
    sansCouleur: 'Une photo n’est pas indispensable ici. Si vous en mettez une, montrez votre atelier ou votre matériel, jamais des visages d’enfants.',
    etat: false,
    livraison: false,
    service: true,
    titre: (s) => [_t(s, 'typeAide'), _t(s, 'dispoAide')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      _natureDon,
      _contrepartie,
      Champ('typeAide', 'Le coup de main que vous proposez',
          req: true,
          options: const ['Cours et soutien scolaire', 'Alphabétisation', 'Aide à un déménagement', 'Petite réparation', 'Électricité / plomberie de dépannage', 'Couture & retouches', 'Coiffure', 'Informatique & téléphone', 'Rédaction de CV', 'Traduction', 'Transport occasionnel', 'Garde ponctuelle', 'Aide administrative', 'Aide à une personne âgée', 'Bricolage', 'Jardinage', 'Soins ou traitement médical'],
          bloque: const ['Soins ou traitement médical'],
          motifBloc: 'Proposer des soins ou un traitement médical est réservé aux professionnels de santé, que ce soit payant ou gratuit.',
          h: (s) => RegExp('Soins ou traitement').hasMatch(_t(s, 'typeAide'))
              ? '!Un soin gratuit reste un soin : il engage la santé de quelqu’un et il est réservé aux professionnels. Cette annonce ne sera pas publiée. Une aide à domicile non médicale — courses, ménage, compagnie — est en revanche la bienvenue.'
              : 'Décrivez ce que vous savez faire, simplement. Ce sont les propositions concrètes qui trouvent preneur.'),
      const Champ('dispoAide', 'Quand vous êtes disponible',
          req: true, multi: true,
          options: ['En semaine, en journée', 'En semaine, en soirée', 'Le samedi', 'Le dimanche', 'Pendant les vacances scolaires', 'Sur rendez-vous']),
      const Champ('lieuAide', 'Où',
          req: true, multi: true,
          options: ['Chez moi', 'Chez la personne', 'Dans un lieu public', 'À distance, par téléphone ou internet', 'Dans ma commune uniquement']),
      const Champ('frequenceAide', 'Fréquence',
          req: true, options: ['Une seule fois', 'Quelques heures par semaine', 'Régulièrement, à définir', 'Selon les demandes']),
      const Champ('publicAide', 'Pour qui', multi: true, options: ['Élèves', 'Étudiants', 'Adultes', 'Personnes âgées', 'Associations', 'Tout le monde']),
      Champ('appatAide', 'Est-ce lié à une vente ?',
          req: true,
          options: const ['Non — c’est gratuit, sans condition', 'Gratuit, mais il faut acheter quelque chose chez moi', 'Gratuit la première fois, payant ensuite'],
          alerte: const Alerte(
            bon: 'Non — c’est gratuit, sans condition',
            ok: ['Gratuit la première fois, payant ensuite'],
            texteBon: 'Gratuit et sans condition.',
            texteMauvais: 'Ce n’est pas un don : c’est une offre commerciale. Elle a sa place dans la rubrique Services, pas ici.',
            textes: {'Gratuit la première fois, payant ensuite': 'Première fois offerte, payant ensuite. C’est honnête si c’est dit — et cela reste une offre commerciale : la rubrique Services lui va mieux.'},
          ),
          bloque: const ['Gratuit, mais il faut acheter quelque chose chez moi'],
          motifBloc: 'Un service conditionné à un achat est une offre commerciale : publiez-la dans Services, où elle sera vue par les bons acheteurs.',
          h: (s) => RegExp('il faut acheter').hasMatch(_t(s, 'appatAide'))
              ? '!Un don qui oblige à acheter n’est pas un don. Votre offre est légitime — elle sera simplement mieux placée dans Services, où les gens viennent justement pour acheter.'
              : ''),
      _pourQui,
      _remise,
    ],
  ),
  'Autres objets': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez l’objet tel qu’il est, avec ses défauts. Un don décrit honnêtement trouve preneur ; un don embelli fait perdre son temps à tout le monde.',
    etat: false,
    livraison: false,
    titre: (s) => [_t(s, 'natureObjet'), _t(s, 'etatObjet')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      _natureDon,
      _contrepartie,
      const Champ('natureObjet', 'Ce que vous donnez',
          req: true, ph: 'Ex : vélo d’enfant, cartons de déménagement, plantes en pot',
          h: 'Nommez l’objet précisément : c’est ce que la personne tape dans la recherche.'),
      const Champ('familleObjet', 'Famille d’objets',
          req: true, libre: 'Autre',
          options: ['Sport & loisirs', 'Outils & bricolage', 'Informatique & téléphonie', 'Livres & médias', 'Décoration', 'Jardinage & plantes', 'Matériel de commerce', 'Emballages & cartons', 'Matériaux de construction', 'Instruments de musique', 'Animaux — accessoires']),
      const Champ('etatObjet', 'État', req: true, options: _etatDon),
      const Champ('fonctionneObjet', 'Fonctionnement',
          options: ['Fonctionne, essai possible', 'Fonctionne, petit défaut', 'En panne — pour pièces', 'Sans mécanisme'],
          h: 'Si l’objet a un moteur, une batterie ou une prise, dites s’il marche. Cela évite un déplacement pour rien.'),
      const Champ('encombrementObjet', 'Encombrement',
          req: true, options: ['Tient dans un sac', 'Se porte à une personne', 'Se porte à deux', 'Camionnette nécessaire']),
      _quantite,
      _pourQui,
      _remise,
    ],
  ),
};
