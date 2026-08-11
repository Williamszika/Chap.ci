// =============================================================================
//  LOISIRS & SPORT — six sous-catégories (port fidèle de src/data/sous/loisirs.dart).
//
//  Une catégorie légère, avec deux endroits où il ne faut pas l'être :
//
//  1. LES ARMES. Fusils, armes de poing, munitions : leur vente passe par un
//     armurier agréé avec autorisation préfectorale, jamais par une petite
//     annonce. Répliques et matériel de chasse non létal restent autorisés.
//  2. LE COMPLET / INCOMPLET : le litige n°1 de tout ce qui se joue à plusieurs
//     ou se monte — un jeu sans ses pions, un vélo sans sa clé, un instrument
//     sans son archet. La question est posée partout.
// =============================================================================
import 'couleurs.dart';
import 'schema.dart';

String _t(Vals s, String cle) => (s[cle] ?? '').toString();

/// Le litige n°1 : il manque une pièce.
Champ _complet(String quoi) => Champ('complet', 'Complet ?',
    req: true,
    options: const ['Complet, rien ne manque', 'Il manque une pièce, je le dis dans la description', 'Incomplet — vendu tel quel'],
    alerte: const Alerte(
      bon: 'Complet, rien ne manque',
      ok: ['Il manque une pièce, je le dis dans la description', 'Incomplet — vendu tel quel'],
      texteBon: 'Annoncé complet. Vérifiez-le à la remise : c’est plus facile que de rappeler le vendeur le lendemain.',
      texteMauvais: 'Il manque quelque chose. Demandez exactement quoi, et si la pièce se retrouve, avant de fixer le prix.',
      textes: {
        'Il manque une pièce, je le dis dans la description': 'Le vendeur annonce ce qui manque. C’est honnête — demandez si la pièce se remplace facilement.',
        'Incomplet — vendu tel quel': 'Vendu incomplet, et le vendeur le dit. Le prix doit être celui d’un objet incomplet.'
      },
    ),
    h: 'C’est le premier litige sur $quoi d’occasion. Comptez avant de photographier, cela vous évitera un message désagréable.');

final Map<String, Schema> loisirs = {
  'Sport & Fitness': Schema(
    couleurs: true,
    palette: paletteLoisirs,
    aideCouleurs: 'Cochez chaque couleur disponible. Ouvrez-en une pour lui donner ses photos et son prix.',
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeSport'), _t(s, 'marqueL'), _t(s, 'tailleSport')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('disciplineS', 'Discipline',
          req: true,
          options: ['Musculation / fitness', 'Football', 'Basketball', 'Course à pied', 'Arts martiaux', 'Boxe', 'Natation', 'Tennis', 'Cyclisme', 'Yoga / pilates', 'Danse', 'Pétanque', 'Randonnée', 'Pêche', 'Chasse']),
      const Champ('typeSport', 'Type d’article',
          req: true,
          options: ['Haltères / poids', 'Banc de musculation', 'Appareil de musculation', 'Tapis de course', 'Vélo d’appartement', 'Rameur', 'Corde à sauter', 'Ballon', 'Raquette', 'Gants', 'Tenue / maillot', 'Chaussures de sport', 'Sac de sport', 'Protection / casque', 'Tapis de sol', 'Filet / but', 'Matériel de pêche', 'Matériel de chasse']),
      Champ('arme', 'S’agit-il d’une arme ?',
          req: true,
          when: (s) => RegExp('Chasse|Pêche|Arts martiaux|Boxe').hasMatch(_t(s, 'disciplineS')) || RegExp('chasse|pêche', caseSensitive: false).hasMatch(_t(s, 'typeSport')),
          options: const ['Non — accessoire, vêtement ou matériel non létal', 'Réplique factice ou de décoration, non fonctionnelle', 'Arme à feu, munitions ou arme blanche'],
          alerte: const Alerte(
            bon: 'Non — accessoire, vêtement ou matériel non létal',
            ok: ['Réplique factice ou de décoration, non fonctionnelle'],
            texteBon: 'Matériel de sport ou de loisir ordinaire, rien à signaler.',
            texteMauvais: 'INTERDIT. La vente d’armes à feu, de munitions et d’armes blanches passe par un armurier agréé avec autorisation préfectorale, jamais par une petite annonce.',
          ),
          bloque: const ['Arme à feu, munitions ou arme blanche'],
          motifBloc: 'La vente d’armes et de munitions est strictement encadrée : elle passe par un armurier agréé, pas par une petite annonce.',
          h: (s) => RegExp('Arme à feu').hasMatch(_t(s, 'arme'))
              ? '!Fusils, armes de poing, munitions et armes blanches ne se vendent qu’en armurerie agréée, sur présentation d’une autorisation préfectorale. Cette annonce ne sera pas publiée.'
              : 'Les cannes, moulinets, leurres, gilets et lampes restent parfaitement autorisés.'),
      const Champ('marqueL', 'Marque', ph: 'Ex : Adidas, Decathlon, sans marque'),
      Champ('tailleSport', 'Taille',
          when: (s) => RegExp('Tenue|Chaussures|Gants|Protection|Sac').hasMatch(_t(s, 'typeSport')),
          options: const ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Taille unique', 'Enfant', 'Pointure 36-40', 'Pointure 41-45']),
      Champ('poidsSport', 'Poids ou charge',
          when: (s) => RegExp('Haltères|poids|Appareil|Banc').hasMatch(_t(s, 'typeSport')),
          ph: 'Ex : 2 × 10 kg'),
      _complet('du matériel de sport'),
      const Champ('usureSport', 'Usure', req: true, options: ['Comme neuf', 'Traces d’usage normales', 'Bien usé mais fonctionnel', 'Usure importante']),
    ],
  ),
  'Vélos & Trottinettes': Schema(
    couleurs: true,
    palette: paletteLoisirs,
    aideCouleurs: 'Cochez chaque couleur disponible.',
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeVelo'), _t(s, 'marqueL'), _t(s, 'tailleVelo')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeVelo', 'Type',
          req: true,
          options: ['VTT', 'Vélo de ville', 'Vélo de course', 'Vélo enfant', 'Vélo pliant', 'Vélo électrique', 'Trottinette', 'Trottinette électrique', 'Draisienne', 'Tricycle enfant', 'BMX', 'Remorque / siège enfant']),
      const Champ('marqueL', 'Marque', ph: 'Ex : Btwin, Rockrider, sans marque'),
      const Champ('tailleVelo', 'Taille de cadre / roue',
          req: true,
          options: ['Roue 12" (enfant)', 'Roue 16"', 'Roue 20"', 'Roue 24"', 'Roue 26"', 'Roue 27,5"', 'Roue 29"', 'Cadre S', 'Cadre M', 'Cadre L', 'Cadre XL'],
          h: 'La taille de roue ou de cadre est ce qui décide de l’achat. Sans elle, personne ne se déplace.'),
      const Champ('vitesses', 'Vitesses', options: ['Vitesse unique', '3 vitesses', '6 vitesses', '18 vitesses', '21 vitesses', '24 vitesses', '27 vitesses et plus']),
      Champ('freins', 'Freins',
          req: true,
          options: const ['Freins à disque', 'Freins V-brake', 'Freins à patins', 'Frein à rétropédalage', 'Freins à revoir'],
          h: (s) => RegExp('à revoir').hasMatch(_t(s, 'freins'))
              ? '!Des freins à revoir sur un vélo, c’est un accident qui attend. Faites-les régler avant la vente, ou annoncez-le très clairement.'
              : ''),
      Champ('batterieVelo', 'Batterie',
          req: true,
          when: (s) => RegExp('électrique').hasMatch(_t(s, 'typeVelo')),
          options: const ['Batterie neuve', 'Bonne autonomie', 'Autonomie faible', 'Batterie à changer', 'Sans batterie'],
          h: 'Sur un vélo ou une trottinette électrique, la batterie EST la valeur. Une batterie à changer coûte souvent la moitié du prix de l’engin.'),
      Champ('autonomieVelo', 'Autonomie annoncée',
          type: TypeChamp.nombre, unite: 'km',
          when: (s) => RegExp('électrique').hasMatch(_t(s, 'typeVelo'))),
      const Champ('etatVelo', 'État mécanique',
          req: true,
          options: ['Roule parfaitement, essai possible', 'Petit réglage à faire', 'Chambre à air ou pneu à changer', 'Ne roule pas en l’état'],
          h: 'Proposer un essai devant l’acheteur vend un vélo deux fois plus vite.'),
      _complet('un vélo'),
      const Champ('accessoiresVelo', 'Fourni avec',
          multi: true, options: ['Antivol', 'Casque', 'Pompe', 'Porte-bagages', 'Panier', 'Éclairage', 'Garde-boue', 'Béquille', 'Chargeur']),
    ],
  ),
  'Instruments de musique': Schema(
    couleurs: true,
    palette: paletteLoisirs,
    aideCouleurs: 'Cochez chaque finition disponible.',
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'instrument'), _t(s, 'marqueL'), _t(s, 'tonalite')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('familleInstru', 'Famille', req: true, options: ['Percussions', 'Cordes', 'Vents', 'Claviers', 'Sono & studio', 'Traditionnel ivoirien']),
      const Champ('instrument', 'Instrument', req: true, dependDe: 'familleInstru', libre: 'Autre', table: {
        'Percussions': ['Djembé', 'Doundoun', 'Congas', 'Batterie complète', 'Caisse claire', 'Cajón', 'Tambour parleur', 'Balafon', 'Maracas'],
        'Cordes': ['Guitare acoustique', 'Guitare classique', 'Guitare électrique', 'Basse', 'Violon', 'Ukulélé', 'Kora', 'Ngoni', 'Harpe'],
        'Vents': ['Saxophone', 'Trompette', 'Trombone', 'Flûte', 'Clarinette', 'Harmonica', 'Tuba'],
        'Claviers': ['Piano droit', 'Piano numérique', 'Synthétiseur', 'Orgue', 'Accordéon', 'Clavier arrangeur'],
        'Sono & studio': ['Ampli guitare', 'Ampli basse', 'Table de mixage', 'Micro studio', 'Carte son', 'Casque studio', 'Enceinte de retour', 'Pied de micro'],
        'Traditionnel ivoirien': ['Djembé', 'Balafon', 'Kora', 'Tambour parleur', 'Ngoni', 'Calebasse percussion', 'Sanza'],
      }),
      const Champ('marqueL', 'Marque', ph: 'Ex : Yamaha, Fender, fabrication artisanale'),
      Champ('tonalite', 'Tonalité / taille',
          when: (s) => RegExp('Cordes|Vents|Claviers').hasMatch(_t(s, 'familleInstru')),
          options: const ['1/4', '1/2', '3/4', '4/4 (entier)', 'Si bémol', 'Mi bémol', 'Do', '61 touches', '76 touches', '88 touches']),
      const Champ('etatInstru', 'État de jeu',
          req: true,
          options: ['Prêt à jouer, bien réglé', 'Jouable, réglage à faire', 'Réparation nécessaire', 'Décoratif uniquement'],
          h: 'Un instrument « jouable » et un instrument « bien réglé » ne sont pas le même prix. Une vidéo de vous en train d’en jouer vaut toutes les descriptions.'),
      const Champ('artisanalInstru', 'Fabrication',
          req: true,
          options: ['Fabrication artisanale ivoirienne', 'Fabrication artisanale africaine', 'Fabrication industrielle', 'Je ne sais pas'],
          h: 'Un djembé ou un balafon fabriqué ici, en bois massif et peau naturelle, se vend bien mieux qu’un instrument d’import. Dites-le et montrez le bois.'),
      _complet('un instrument'),
      const Champ('accessoiresInstru', 'Fourni avec',
          multi: true, options: ['Housse / étui', 'Sangle', 'Archet', 'Baguettes', 'Câble', 'Pied', 'Ampli', 'Accordeur', 'Pédale', 'Partitions']),
    ],
  ),
  'Livres & BD': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez la couverture, la tranche et une page ouverte : c’est ce qui montre l’état réel.',
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'genreLivre'), _t(s, 'nbLivres'), _t(s, 'langueLivre')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('genreLivre', 'Genre',
          req: true,
          options: ['Scolaire / manuel', 'Parascolaire / annales', 'Roman', 'Bande dessinée', 'Littérature africaine', 'Religieux', 'Développement personnel', 'Cuisine', 'Enfant / jeunesse', 'Dictionnaire', 'Universitaire', 'Professionnel / technique', 'Magazine', 'Bande dessinée jeunesse']),
      Champ('niveauLivre', 'Niveau',
          when: (s) => RegExp('Scolaire|Parascolaire|Universitaire').hasMatch(_t(s, 'genreLivre')),
          options: const ['Maternelle', 'CP à CM2', '6e à 3e', '2nde à Terminale', 'BTS / licence', 'Master et plus'],
          h: 'Le niveau et le programme sont ce qu’un parent tape dans la recherche à la rentrée.'),
      const Champ('langueLivre', 'Langue', req: true, options: ['Français', 'Anglais', 'Bilingue', 'Arabe', 'Autre']),
      const Champ('nbLivres', 'Nombre', req: true, options: ['1 livre', '2 à 5 livres', 'Lot de 6 à 20', 'Lot de plus de 20', 'Collection complète']),
      Champ('etatLivre', 'État',
          req: true,
          options: const ['Neuf, jamais ouvert', 'Très bon état', 'Bon état, quelques annotations', 'Pages cornées ou surlignées', 'Couverture abîmée', 'Pages manquantes'],
          alerte: const Alerte(
            bon: 'Neuf, jamais ouvert',
            ok: ['Très bon état', 'Bon état, quelques annotations', 'Pages cornées ou surlignées'],
            texteBon: 'Livre neuf, jamais ouvert. Vérifiez tout de même l’année d’édition : sur un manuel scolaire, le programme change.',
            texteMauvais: 'Livre abîmé. Demandez des photos de la reliure et des pages concernées avant de vous déplacer.',
            textes: {
              'Bon état, quelques annotations': 'Quelques annotations : sur un manuel scolaire, cela ne gêne pas — et beaucoup d’élèves trouvent les surlignages utiles.',
              'Pages cornées ou surlignées': 'Pages cornées ou surlignées : le livre reste tout à fait lisible. Le prix doit s’en ressentir un peu.',
              'Pages manquantes': 'Des pages manquent. Sur un manuel scolaire, cela le rend inutilisable : demandez lesquelles avant d’acheter.'
            },
          ),
          h: (s) => RegExp('Pages manquantes').hasMatch(_t(s, 'etatLivre'))
              ? '!Un manuel scolaire avec des pages manquantes ne sert plus à l’élève. Dites lesquelles, ou vendez le lot au poids.'
              : 'Sur un manuel scolaire, les annotations ne gênent pas — le dire honnêtement suffit largement.'),
      const Champ('anneeEdition', 'Année d’édition', ph: 'Ex : 2023',
          h: 'Sur un manuel scolaire, l’édition compte autant que le titre : le programme change.'),
    ],
  ),
  'Jeux de société & Puzzles': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez le contenu étalé, pas seulement la boîte. C’est ce qui prouve qu’il est complet.',
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeJeuS'), _t(s, 'ageJeu'), _t(s, 'joueurs')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeJeuS', 'Type',
          req: true,
          options: ['Jeu de société', 'Puzzle', 'Jeu de cartes', 'Échecs / dames', 'Ludo / awalé', 'Jeu éducatif', 'Jeu de rôle', 'Jeu d’extérieur', 'Baby-foot', 'Billard', 'Fléchettes'],
          h: 'Les jeux vidéo et les consoles sont dans Électronique ; les jouets d’enfant dans Bébé & Enfant.'),
      const Champ('joueurs', 'Nombre de joueurs', options: ['1 joueur', '2 joueurs', '2 à 4 joueurs', '4 à 6 joueurs', 'Plus de 6 joueurs']),
      const Champ('ageJeu', 'Âge conseillé', req: true, options: ['3 ans et plus', '6 ans et plus', '8 ans et plus', '12 ans et plus', 'Adulte']),
      Champ('piecesPuzzle', 'Nombre de pièces',
          when: (s) => RegExp('Puzzle').hasMatch(_t(s, 'typeJeuS')),
          options: const ['Moins de 100', '100 à 500', '500 à 1000', '1000 à 2000', 'Plus de 2000']),
      _complet('un jeu'),
      const Champ('notice', 'Règle du jeu',
          req: true,
          options: ['Règle incluse', 'Règle trouvable en ligne', 'Sans règle'],
          h: 'Un jeu sans sa règle et sans nom précis ne se rejoue jamais. Photographiez la notice.'),
      const Champ('langueJeuS', 'Langue', options: ['Français', 'Anglais', 'Sans texte']),
    ],
  ),
  'Collections': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez chaque pièce nettement, recto et verso, avec un repère de taille.',
    etat: true,
    livraison: true,
    titre: (s) => [_t(s, 'typeCollec'), _t(s, 'epoque'), _t(s, 'nbCollec')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeCollec', 'Type de collection',
          req: true,
          options: ['Timbres', 'Pièces de monnaie', 'Billets anciens', 'Cartes postales', 'Vinyles', 'Cassettes / CD', 'Figurines', 'Maquettes', 'Montres anciennes', 'Appareils photo anciens', 'Objets d’art', 'Masques anciens', 'Affiches', 'Journaux anciens', 'Cartes à collectionner']),
      const Champ('epoque', 'Époque', options: ['Avant 1960', '1960-1980', '1980-2000', 'Après 2000', 'Contemporain', 'Je ne sais pas']),
      const Champ('nbCollec', 'Nombre de pièces', req: true, options: ['1 pièce', '2 à 10 pièces', '10 à 50 pièces', '50 à 200 pièces', 'Collection complète']),
      const Champ('authenticiteC', 'Authenticité',
          req: true,
          options: ['Authentique, avec certificat ou provenance', 'Authentique, sans document', 'Reproduction / copie assumée', 'Je ne sais pas'],
          alerte: Alerte(
            bon: 'Authentique, avec certificat ou provenance',
            ok: ['Reproduction / copie assumée'],
            texteBon: 'Le vendeur peut justifier la provenance. Demandez à voir le document avant de payer.',
            texteMauvais: 'Aucun document de provenance. Sur une pièce de collection, faites expertiser avant de payer une somme importante.',
            textes: {'Reproduction / copie assumée': 'Reproduction annoncée comme telle. C’est honnête, et cela se vend — au prix d’une reproduction.'},
          ),
          h: 'Sur les masques et objets d’art anciens, la reproduction est la règle et l’original l’exception. Le dire franchement vaut mieux que de laisser croire.'),
      const Champ('etatCollec', 'État de conservation', req: true, options: ['Parfait', 'Très bon', 'Bon, traces du temps', 'Abîmé', 'Restauré']),
    ],
  ),
};
