// =============================================================================
//  ÉCOLE & FOURNITURES — six sous-catégories (port fidèle de src/data/sous/scolaire.dart).
//
//  La catégorie que le calendrier impose : rentrée, inscriptions, examens
//  (CEPE, BEPC, BAC). Deux interdits, et ils ne sont pas théoriques :
//
//  1. LE KIT GRATUIT DE L'ÉTAT NE SE REVEND PAS. Plus de 4,3 millions de kits
//     (cahiers, stylos, cartables) sont distribués gratuitement chaque année aux
//     élèves du primaire public. Les revendre prive un enfant de ses cahiers.
//  2. LES MANUELS PHOTOCOPIÉS NON PLUS. Le piratage du livre scolaire est
//     illégal, et l'exemplaire arrive presque toujours incomplet chez l'élève.
//
//  Deux avertissements (sans blocage) : l'uniforme d'un autre établissement
//  (chaque école impose sa teinte) et le manuel d'un ancien programme.
// =============================================================================
import 'couleurs.dart';
import 'schema.dart';

String _t(Vals s, String cle) => (s[cle] ?? '').toString();

const _niveaux = ['Maternelle', 'CP1 – CP2', 'CE1 – CE2', 'CM1 – CM2', '6e – 5e', '4e – 3e', '2nde', '1ère', 'Terminale', 'Supérieur / BTS', 'Tous niveaux'];
const _matieres = ['Français', 'Mathématiques', 'Physique-Chimie', 'SVT', 'Histoire-Géographie', 'Anglais', 'Espagnol', 'Allemand', 'Philosophie', 'Économie', 'EDHC', 'Informatique', 'Arts plastiques', 'EPS', 'Éveil / lecture', 'Toutes matières'];
const _etatScol = ['Neuf, sous emballage', 'Neuf, emballage ouvert', 'Très bon état', 'Bon état, traces d’usage', 'Usé mais utilisable'];

/// La question du rayon : d'où vient ce lot ? (un kit d'État ne se revend pas).
final _origineFourniture = Champ('origineFourn', 'D’où vient ce lot ?',
    req: true,
    options: const [
      'Acheté en boutique ou en gros, pour la revente',
      'Mes propres affaires, ou celles de mes enfants',
      'Invendu de l’an dernier',
      'Kit gratuit distribué par l’État (primaire public)'
    ],
    alerte: const Alerte(
      bon: 'Acheté en boutique ou en gros, pour la revente',
      ok: ['Mes propres affaires, ou celles de mes enfants', 'Invendu de l’an dernier'],
      texteBon: 'Lot acheté pour la revente. Demandez à voir la marchandise avant de payer, comme pour tout achat.',
      texteMauvais: 'INTERDIT. Les kits scolaires de l’État sont donnés gratuitement aux élèves du primaire public. Les revendre prive un enfant de ses cahiers.',
      textes: {
        'Mes propres affaires, ou celles de mes enfants': 'Affaires personnelles revendues. Regardez l’état sur les photos, et comptez ce qui est réellement dans le lot.',
        'Invendu de l’an dernier': 'Invendu de l’an dernier : le matériel ne se périme pas, mais vérifiez que les cahiers n’ont pas pris l’humidité.'
      },
    ),
    bloque: const ['Kit gratuit distribué par l’État (primaire public)'],
    motifBloc: 'Les kits scolaires distribués gratuitement par l’État ne se revendent pas : ils sont donnés aux élèves, pas vendus.',
    h: (s) => RegExp('Kit gratuit').hasMatch(_t(s, 'origineFourn'))
        ? '!Plus de 4,3 millions de kits sont distribués gratuitement chaque année aux élèves du primaire public, pour environ 10 milliards de FCFA d’argent public. Les revendre sur un marché est un détournement connu de la filière : un enfant se retrouve sans cahiers pour qu’un autre encaisse. Cette annonce ne sera pas publiée.'
        : 'Dire d’où vient la marchandise vous distingue immédiatement. Les acheteurs de ce rayon ont tous entendu parler des kits d’État revendus.');

/// Ce qui sépare un manuel d'un faux. La contrefaçon est massive ici.
final _authenticiteManuel = Champ('authManuel', 'Exemplaire original ou photocopie ?',
    req: true,
    options: const ['Original neuf, acheté en librairie', 'Original d’occasion', 'Photocopie reliée', 'Je ne sais pas'],
    alerte: const Alerte(
      bon: 'Original neuf, acheté en librairie',
      ok: ['Original d’occasion'],
      texteBon: 'Exemplaire original neuf. C’est ce qu’un enseignant demande, et ce qui se revend l’année suivante.',
      texteMauvais: 'À ÉCARTER. Un manuel photocopié est une contrefaçon : illégal, souvent incomplet, et parfois illisible sur les schémas et les cartes.',
      textes: {
        'Original d’occasion': 'Original d’occasion. Vérifiez qu’aucune page ne manque et que les exercices ne sont pas déjà remplis au stylo.',
        'Je ne sais pas': 'Origine incertaine. Demandez une photo de la couverture ET de la page de garde avant de payer : une contrefaçon s’y reconnaît.'
      },
    ),
    bloque: const ['Photocopie reliée'],
    motifBloc: 'Un manuel photocopié est une contrefaçon. Le piratage du livre scolaire est interdit, et l’exemplaire arrive presque toujours incomplet chez l’élève.',
    h: (s) => RegExp('Photocopie').hasMatch(_t(s, 'authManuel'))
        ? '!Le piratage est une pratique installée de la chaîne du livre scolaire ivoirienne, et il donne lieu à de la contrefaçon à tous les niveaux. L’élève le découvre en classe, devant une carte illisible ou une page absente. Cette annonce ne sera pas publiée.'
        : 'Photographiez la couverture ET la page de garde : c’est là qu’un acheteur averti reconnaît un original.');

const _quantiteLot = Champ('quantiteScol', 'Quantité',
    req: true,
    options: ['1 article', '2 à 5', 'Lot de 6 à 20', 'Lot de 21 à 50', 'Plus de 50', 'Kit complet pour un élève', 'Gros pour revendeurs'],
    h: 'Un « gros pour revendeurs » ne s’adresse pas au même acheteur qu’un kit d’élève. Dites-le dans le titre aussi.');

final Map<String, Schema> scolaire = {
  'Fournitures & papeterie': Schema(
    couleurs: false,
    sansCouleur: 'Étalez le lot et photographiez-le en entier, sans le trier pour la photo. Un acheteur qui compte 38 cahiers sur une annonce qui en promet 50 ne rappelle pas.',
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeFourn'), _t(s, 'quantiteScol'), _t(s, 'niveauFourn')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeFourn', 'Type de fourniture',
          req: true, multi: true,
          options: ['Cahiers 32 pages', 'Cahiers 64 pages', 'Cahiers 100 pages', 'Cahiers 200 pages', 'Cahiers 300 pages', 'Cahiers de dessin', 'Bloc-notes', 'Feuilles de copie', 'Chemises & pochettes', 'Stylos à bille', 'Crayons à papier', 'Gommes', 'Taille-crayons', 'Règles', 'Ardoises', 'Craies', 'Colle', 'Ciseaux', 'Crayons de couleur', 'Feutres', 'Peinture & pinceaux', 'Protège-cahiers', 'Étiquettes', 'Papier kraft']),
      _origineFourniture,
      const Champ('niveauFourn', 'Niveau visé', multi: true, options: _niveaux,
          h: 'C’est ce qu’un parent tape : « cahiers CM2 », « fournitures 6e ». Cochez tous les niveaux qui conviennent.'),
      const Champ('marqueFourn', 'Marque', ph: 'Ex : Bic, Conquérant, sans marque'),
      const Champ('etatFourn', 'État', req: true, options: _etatScol),
      Champ('humidite', 'Conservation',
          req: true,
          options: const ['Stocké au sec, jamais mouillé', 'A pris un peu l’humidité', 'Pages gondolées ou tachées'],
          h: (s) => RegExp('humidité|gondolées').hasMatch(_t(s, 'humidite'))
              ? '!Dites-le franchement et baissez le prix : un cahier gondolé s’écrit mal, et l’acheteur le verra en ouvrant le paquet. Annoncé, ça se vend quand même.'
              : 'À Abidjan, un lot stocké au sol pendant la saison des pluies prend l’humidité. Le préciser rassure — beaucoup d’acheteurs se sont fait avoir.'),
      _quantiteLot,
      const Champ('venteFourn', 'Vous vendez',
          req: true,
          options: ['À l’unité', 'Par lot uniquement', 'Les deux'],
          h: '« Par lot uniquement » fait fuir un parent qui cherche trois cahiers. Si vous pouvez découper, dites-le.'),
      const Champ('prixRepere', 'Votre prix par rapport au marché',
          options: ['Aligné sur Adjamé / Treichville', 'Un peu au-dessus', 'Prix de boutique de quartier', 'Je ne sais pas'],
          h: 'Les grands marchés d’Adjamé et de Treichville descendent jusqu’à 40 % sous les centres commerciaux, et vos acheteurs le savent. Un prix de centre commercial ne se vend pas en ligne.'),
    ],
  ),
  'Cartables & trousses': Schema(
    couleurs: true,
    palette: paletteScolaire,
    aideCouleurs: 'Cochez chaque coloris disponible : à cet âge, la couleur décide de l’achat plus que le prix.',
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeSac'), _t(s, 'niveauSac'), _t(s, 'marqueSac')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeSac', 'Type',
          req: true,
          options: ['Cartable', 'Sac à dos', 'Sac à roulettes', 'Trousse', 'Boîte à goûter', 'Gourde', 'Sac de sport', 'Porte-documents']),
      _origineFourniture,
      const Champ('niveauSac', 'Pour quel niveau', req: true, multi: true, options: _niveaux),
      const Champ('marqueSac', 'Marque ou motif', ph: 'Ex : sans marque, motif footballeur, motif princesse'),
      const Champ('etatSac', 'État', req: true, options: _etatScol),
      Champ('soliditeSac', 'Points d’usure',
          multi: true,
          when: (s) => !RegExp('Neuf').hasMatch(_t(s, 'etatSac')),
          options: const ['Aucun, comme neuf', 'Fermeture éclair fatiguée', 'Bretelle recousue', 'Fond usé', 'Tache ou décoloration', 'Roulettes à changer'],
          h: 'La fermeture éclair et les bretelles sont ce qui lâche en premier, et ce qu’un parent regarde. Dites-le : un cartable réparé et annoncé se vend, un cartable qui casse en octobre fait un avis à une étoile.'),
      Champ('dosSac', 'Dos et bretelles',
          when: (s) => RegExp('Cartable|Sac à dos|roulettes').hasMatch(_t(s, 'typeSac')),
          options: const ['Dos rembourré, bretelles larges', 'Bretelles simples', 'Sans rembourrage'],
          h: 'Un enfant du primaire porte plusieurs kilos chaque jour. Le dos rembourré est un vrai argument, dites-le s’il y est.'),
      _quantiteLot,
    ],
  ),
  'Manuels & livres scolaires': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez la couverture ET la page de garde. C’est là qu’on distingue un original d’une contrefaçon, et c’est la première chose qu’un parent averti demande.',
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'matiereManuel'), _t(s, 'niveauManuel'), _t(s, 'editeurManuel')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      Champ('natureLivre', 'De quel livre s’agit-il ?',
          req: true,
          options: const ['Manuel au programme', 'Cahier d’activités / d’exercices', 'Roman au programme (lecture suivie)', 'Dictionnaire', 'Atlas', 'Livre de lecture (primaire)', 'Ouvrage universitaire', 'Livre du professeur'],
          h: (s) => RegExp('Roman au programme').hasMatch(_t(s, 'natureLivre'))
              ? 'Un roman qu’on lit pour le plaisir n’est pas ici : il a sa place dans Loisirs & Sport, où les lecteurs le cherchent. Ici, ce sont les œuvres inscrites au programme.'
              : 'Le titre exact et le niveau font trouver votre annonce : c’est ce qu’un parent recopie depuis la liste de l’école.'),
      _authenticiteManuel,
      const Champ('matiereManuel', 'Matière', req: true, options: _matieres),
      const Champ('niveauManuel', 'Niveau', req: true, options: _niveaux),
      const Champ('titreManuel', 'Titre exact',
          req: true, ph: 'Ex : CIAM 3e, Mathématiques · Le Flamboyant CE2',
          h: 'Recopiez-le tel qu’il est écrit sur la couverture, collection comprise. C’est mot pour mot ce que le parent tape.'),
      const Champ('editeurManuel', 'Éditeur ou collection', ph: 'Ex : NEI-CEDA, CIAM, Hachette, Édicef'),
      const Champ('programmeManuel', 'Programme',
          req: true,
          options: ['Programme en cours', 'Programme récent (1 à 3 ans)', 'Ancienne édition', 'Je ne sais pas'],
          alerte: Alerte(
            bon: 'Programme en cours',
            ok: ['Programme récent (1 à 3 ans)'],
            texteBon: 'Édition au programme en cours. C’est celle que l’école demande.',
            texteMauvais: 'Ancienne édition : les chapitres et la pagination ont pu changer. Vérifiez la liste de votre école AVANT d’acheter — l’enseignant travaille avec les numéros de page.',
            textes: {
              'Programme récent (1 à 3 ans)': 'Édition récente. Comparez le titre et l’année avec la liste remise par l’école.',
              'Je ne sais pas': 'Année d’édition inconnue. Demandez une photo de la page de garde : l’année y figure.'
            },
          ),
          h: 'L’État a fait rééditer des collections entières après des erreurs constatées. Une édition dépassée n’est pas sans valeur, mais l’acheteur doit le savoir avant de payer.'),
      Champ('etatManuel', 'État',
          req: true,
          options: const ['Neuf, jamais ouvert', 'Très bon état', 'Quelques annotations au crayon', 'Annoté au stylo', 'Exercices déjà remplis', 'Couverture abîmée', 'Pages manquantes'],
          h: (s) => RegExp('Exercices déjà remplis|Pages manquantes').hasMatch(_t(s, 'etatManuel'))
              ? '!Un cahier d’exercices déjà rempli ne sert plus à l’élève, et un livre amputé se retourne contre vous. Annoncez-le clairement et vendez-le au prix du papier — ou n’en tirez rien.'
              : 'Les annotations au crayon s’effacent, celles au stylo non. Dites lesquelles.'),
      _quantiteLot,
      Champ('lotMatieres', 'Le lot couvre',
          multi: true,
          when: (s) => RegExp('Lot|Kit|Plus de').hasMatch(_t(s, 'quantiteScol')),
          options: _matieres,
          h: 'Un lot complet pour une classe entière se vend beaucoup mieux qu’un livre isolé. Listez les matières couvertes.'),
    ],
  ),
  'Annales & parascolaire': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez la couverture et le sommaire : ce sont les années couvertes et la présence des corrigés qui décident de l’achat.',
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'examenAnn'), _t(s, 'matiereAnn'), _t(s, 'anneesAnn')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeAnn', 'Type d’ouvrage',
          req: true,
          options: ['Annales d’examen', 'Sujets corrigés', 'Cahier de vacances', 'Fiches de révision', 'Manuel de méthode', 'Préparation aux concours', 'Cours particuliers imprimés', 'Exercices supplémentaires']),
      _authenticiteManuel,
      const Champ('examenAnn', 'Examen préparé',
          req: true,
          options: ['CEPE', 'BEPC', 'BAC série A', 'BAC série C', 'BAC série D', 'BAC série G', 'Concours d’entrée', 'Aucun examen précis'],
          h: 'CEPE, BEPC, BAC : mettez le sigle dans le titre. C’est le mot que l’élève tape à trois semaines de l’épreuve.'),
      const Champ('matiereAnn', 'Matière', req: true, options: _matieres),
      const Champ('anneesAnn', 'Années couvertes', ph: 'Ex : 2019 à 2025',
          h: 'Plus les sessions sont récentes, plus l’ouvrage vaut. Dites l’année la plus récente qu’il contient.'),
      const Champ('corrigesAnn', 'Les corrigés',
          req: true,
          options: ['Corrigés complets et détaillés', 'Corrigés succincts', 'Réponses seules, sans démarche', 'Aucun corrigé'],
          alerte: Alerte(
            bon: 'Corrigés complets et détaillés',
            ok: ['Corrigés succincts'],
            texteBon: 'Corrigés détaillés : c’est ce qui fait la valeur d’une annale. Un élève qui révise seul en a besoin.',
            texteMauvais: 'Sans corrigé, un recueil de sujets n’apprend rien à un élève qui travaille seul. Vérifiez que c’est bien ce que vous cherchez.',
            textes: {'Réponses seules, sans démarche': 'Les réponses sans la démarche ne servent qu’à vérifier, pas à apprendre. Dites-le au prix.'},
          ),
          h: 'C’est LA question de ce rayon. Un recueil sans corrigés et un recueil corrigé n’ont pas le même prix, et l’acheteur veut le savoir avant.'),
      const Champ('niveauAnn', 'Niveau', req: true, options: _niveaux),
      Champ('etatAnn', 'État',
          req: true,
          options: const ['Neuf, jamais ouvert', 'Très bon état', 'Quelques annotations', 'Sujets déjà traités au stylo', 'Couverture abîmée'],
          h: (s) => RegExp('déjà traités').hasMatch(_t(s, 'etatAnn'))
              ? '!Des sujets déjà traités au stylo enlèvent tout l’intérêt : l’élève voit la réponse avant de chercher. Annoncez-le, et baissez le prix en conséquence.'
              : ''),
      _quantiteLot,
    ],
  ),
  'Uniformes & tenues': Schema(
    couleurs: true,
    palette: paletteScolaire,
    aideCouleurs: 'Cochez la teinte réelle du tissu, pas celle de la photo au soleil. Un kaki n’est pas l’autre, et c’est justement là que ça coince.',
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeTenue'), _t(s, 'tailleTenue'), _t(s, 'etabTenue')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeTenue', 'Type de tenue',
          req: true,
          options: ['Tenue kaki garçon (chemise)', 'Tenue kaki garçon (pantalon / short)', 'Ensemble kaki complet', 'Robe à petits carreaux (maternelle)', 'Robe à grands carreaux (primaire)', 'Jupe bleue (collège / lycée)', 'Chemisier blanc (collège / lycée)', 'Ensemble fille complet', 'Tenue de sport / EPS', 'Blouse', 'Chaussures d’école', 'Chaussettes', 'Badge ou écusson'],
          h: 'En Côte d’Ivoire, le kaki habille les garçons du primaire au lycée ; les filles portent les carreaux au préscolaire et au primaire, puis le bas bleu et le haut blanc au secondaire.'),
      _origineFourniture,
      const Champ('confTenue', 'Conformité à l’établissement',
          req: true,
          options: ['Modèle standard, accepté partout', 'Modèle propre à un établissement précis', 'Porte le badge ou l’écusson d’une école', 'Je ne sais pas'],
          alerte: Alerte(
            bon: 'Modèle standard, accepté partout',
            texteBon: 'Modèle standard. Montrez tout de même la tenue à votre école avant la rentrée : certaines imposent une teinte précise.',
            texteMauvais: 'ATTENTION. Cette tenue est faite pour une école précise. Beaucoup d’établissements imposent leur couleur exacte et leur coupe, et refusent le reste — vous risquez d’acheter pour rien.',
            textes: {
              'Porte le badge ou l’écusson d’une école': 'Tenue marquée du badge d’une école. Elle ne servira que dans cet établissement, et nulle part ailleurs.',
              'Je ne sais pas': 'Conformité inconnue. Demandez une photo à plat, en plein jour, et comparez avec la tenue exigée par votre école avant de payer.'
            },
          ),
          h: 'Les établissements ivoiriens imposent souvent des teintes et des coupes précises. Un uniforme acheté pour l’école d’à côté peut être refusé à la vôtre — dites franchement d’où vient celui-ci.'),
      Champ('etabTenue', 'Établissement d’origine',
          when: (s) => RegExp('établissement précis|badge').hasMatch(_t(s, 'confTenue')),
          ph: 'Ex : Groupe scolaire Les Palmiers, Cocody',
          h: 'Le nommer fait gagner du temps à tout le monde : les parents de cette école achèteront, les autres ne se déplaceront pas pour rien.'),
      const Champ('tailleTenue', 'Taille',
          req: true, multi: true,
          options: ['2-3 ans', '4-5 ans', '6-7 ans', '8-9 ans', '10-11 ans', '12-13 ans', '14-15 ans', '16 ans et plus', 'XS', 'S', 'M', 'L', 'XL', 'Tailles mélangées']),
      const Champ('sexeTenue', 'Pour', req: true, options: ['Garçon', 'Fille', 'Mixte']),
      const Champ('etatTenue', 'État', req: true, options: _etatScol),
      Champ('hygieneTenue', 'Hygiène',
          req: true,
          when: (s) => !RegExp('Neuf').hasMatch(_t(s, 'etatTenue')),
          options: const ['Lavée et repassée', 'Propre, à relaver par précaution', 'Non lavée'],
          h: (s) => _t(s, 'hygieneTenue') == 'Non lavée'
              ? '!Une tenue lavée et repassée part deux fois plus vite, et coûte une machine. Faites-le.'
              : 'Photographiez la tenue à plat, repassée : c’est ce qui fait la différence sur ce rayon.'),
      const Champ('tissuTenue', 'Tissu',
          options: ['Coton', 'Majorité coton', 'Polyester-coton', 'Synthétique', 'Je ne sais pas'],
          h: 'Sous le climat d’ici, le coton se porte mieux toute la journée. C’est un argument, s’il est vrai.'),
      _quantiteLot,
      Champ('surMesure', 'Couture sur mesure',
          req: true,
          options: const ['Non, tenue déjà confectionnée', 'Oui, je couds sur mesure'],
          h: (s) => RegExp('Oui').hasMatch(_t(s, 'surMesure'))
              ? 'Précisez votre délai et vos tarifs dans la description : à la rentrée, un couturier qui livre en trois jours vaut de l’or.'
              : ''),
    ],
  ),
  'Calculatrices & matériel de classe': Schema(
    couleurs: true,
    palette: paletteScolaire,
    aideCouleurs: 'Cochez les coloris disponibles s’il y en a plusieurs.',
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeMatCl'), _t(s, 'marqueMatCl'), _t(s, 'niveauMatCl')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeMatCl', 'Type',
          req: true,
          options: ['Calculatrice scientifique', 'Calculatrice simple', 'Calculatrice graphique', 'Compas', 'Équerre', 'Rapporteur', 'Kit de géométrie complet', 'Ardoise Velleda', 'Tableau blanc', 'Globe terrestre', 'Carte murale', 'Blouse de laboratoire', 'Matériel de dessin technique', 'Clé USB', 'Ordinateur pour l’école'],
          h: 'La calculatrice scientifique est exigée dès la 4e dans la plupart des établissements. C’est l’article le plus cherché de ce rayon.'),
      _origineFourniture,
      const Champ('marqueMatCl', 'Marque et modèle', ph: 'Ex : Casio fx-92, Texas Instruments',
          h: 'Le modèle exact décide de l’achat : certains professeurs n’acceptent qu’un modèle précis en examen.'),
      Champ('marcheMatCl', 'Fonctionnement',
          req: true,
          when: (s) => RegExp('Calculatrice|Ordinateur|Clé USB|Velleda').hasMatch(_t(s, 'typeMatCl')),
          options: const ['Fonctionne, essai possible sur place', 'Fonctionne, écran légèrement marqué', 'Piles à changer', 'En panne — pour pièces'],
          alerte: const Alerte(
            bon: 'Fonctionne, essai possible sur place',
            ok: ['Fonctionne, écran légèrement marqué', 'Piles à changer'],
            texteBon: 'Essai possible avant achat. Allumez-la devant le vendeur, tapez un calcul : trente secondes suffisent.',
            texteMauvais: 'Appareil en panne, vendu pour pièces. N’engagez pas de frais de transport avant de savoir ce qu’il vaut.',
            textes: {'Piles à changer': 'Piles à changer : c’est courant et peu cher, mais demandez à l’essayer avec des piles neuves.'},
          ),
          h: 'Une calculatrice s’essaie en trente secondes. Proposez-le : c’est ce qui conclut la vente.'),
      Champ('examenMatCl', 'Autorisée en examen ?',
          when: (s) => RegExp('Calculatrice').hasMatch(_t(s, 'typeMatCl')),
          options: const ['Oui, modèle autorisé', 'Non, modèle programmable interdit', 'Je ne sais pas'],
          h: 'Les calculatrices programmables sont refusées à certaines épreuves. Si vous le savez, dites-le : ça évite une catastrophe le jour du BAC.'),
      const Champ('niveauMatCl', 'Niveau visé', multi: true, options: _niveaux),
      const Champ('etatMatCl', 'État', req: true, options: _etatScol),
      const Champ('accessoiresMatCl', 'Fourni avec', multi: true, options: ['Housse ou étui', 'Notice', 'Piles', 'Emballage d’origine', 'Facture', 'Rien de plus']),
      _quantiteLot,
    ],
  ),
};
