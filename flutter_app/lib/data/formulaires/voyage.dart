// =============================================================================
//  VOYAGE — six sous-catégories (port fidèle de src/data/sous/voyage.dart).
//
//  La deuxième catégorie la plus dangereuse après la Santé : ici, la victime
//  paie d'avance, part, et se retrouve à trois mille kilomètres de tout recours.
//  Quatre garde-fous, tous fondés sur une règle réelle :
//
//  1. « VISA GARANTI » N'EXISTE PAS. Un visa est délivré par un consulat, par
//     personne d'autre. Ce qu'on livre au bout d'une promesse, c'est un faux.
//  2. LES FRAIS AVANT LE CONTRAT (« frais de dossier » par Mobile Money) — le
//     schéma des faux voyagistes.
//  3. LE PLACEMENT À L'ÉTRANGER PAYÉ PAR LE CANDIDAT. Convention n° 181 de l'OIT :
//     les frais de recrutement ne sont JAMAIS à la charge du travailleur. Plus
//     le contrat écrit avant le départ, et le passeport qui reste au travailleur.
//  4. LE VOYAGE SANS VISA (« on s'arrange à la frontière », traversée en mer),
//     c'est de la traite : elle ne se publie pas.
// =============================================================================
import 'schema.dart';

String _t(Vals s, String cle) => (s[cle] ?? '').toString();

const _destinations = [
  'France', 'Belgique', 'Suisse', 'Canada', 'États-Unis', 'Royaume-Uni',
  'Allemagne', 'Espagne', 'Italie', 'Portugal', 'Turquie', 'Maroc', 'Tunisie',
  'Sénégal', 'Ghana', 'Burkina Faso', 'Mali', 'Nigeria', 'Togo', 'Bénin',
  'Émirats arabes unis', 'Arabie saoudite', 'Qatar', 'Koweït', 'Liban',
  'Chine', 'Inde', 'Afrique du Sud'
];

/// Les pays de kafala : le passeport y est souvent confisqué à l'arrivée.
final _kafala = RegExp('Arabie saoudite|Koweït|Qatar|Liban|Émirats');

const _dureeSejour = ['Moins d’une semaine', '1 à 2 semaines', '3 à 4 semaines', '1 à 3 mois', '3 à 6 mois', 'Plus de 6 mois'];

/// Un visa se délivre au consulat, nulle part ailleurs.
final _visaPromesse = Champ('visaPromesse', 'Ce que vous promettez sur le visa',
    req: true,
    options: const [
      'Aucune garantie — seul le consulat décide',
      'Accompagnement au dossier, sans garantie de résultat',
      'Visa garanti, remboursé en cas de refus',
      'Visa sans entretien ni dossier'
    ],
    alerte: const Alerte(
      bon: 'Aucune garantie — seul le consulat décide',
      ok: ['Accompagnement au dossier, sans garantie de résultat'],
      texteBon: 'Aucune garantie annoncée : c’est la seule réponse honnête. Le visa est délivré par le consulat, jamais par un intermédiaire.',
      texteMauvais: 'ARNAQUE. Personne ne peut garantir un visa. Ne versez rien, et signalez cette annonce.',
      textes: {'Accompagnement au dossier, sans garantie de résultat': 'Accompagnement au dossier, sans promesse de résultat. C’est un vrai service : il aide à monter un dossier complet, il ne décide pas à la place du consulat.'},
    ),
    bloque: const ['Visa garanti, remboursé en cas de refus', 'Visa sans entretien ni dossier'],
    motifBloc: 'Aucune agence ne peut garantir un visa : seul un consulat en délivre. Une annonce qui le promet ne peut pas être publiée.',
    h: (s) {
      final v = _t(s, 'visaPromesse');
      if (RegExp('garanti').hasMatch(v)) return '!« Visa garanti » n’existe pas. Ce qu’on livre au bout, c’est un faux : il vaut à son porteur une interdiction de territoire de plusieurs années et des poursuites. Cette annonce ne sera pas publiée.';
      if (RegExp('sans entretien').hasMatch(v)) return '!Un visa « sans entretien ni dossier » se fabrique, il ne s’obtient pas. Cette annonce ne sera pas publiée.';
      return 'Dire clairement que la décision appartient au consulat vous distingue immédiatement des dizaines d’annonces qui promettent l’impossible.';
    });

/// L'argent réclamé avant qu'un papier existe — le schéma des faux voyagistes.
Champ _fraisAvant(String quoi) => Champ(
      'fraisAvant',
      'Ce que le client paie, et quand',
      req: true,
      options: const [
        'Rien avant la signature d’un contrat écrit',
        'Un acompte, après le contrat écrit',
        'Des frais de dossier à payer avant tout contact',
        'La totalité par Mobile Money, avant tout document'
      ],
      alerte: Alerte(
        bon: 'Rien avant la signature d’un contrat écrit',
        ok: const ['Un acompte, après le contrat écrit'],
        texteBon: 'Rien n’est demandé avant un contrat écrit. C’est la règle : ne versez jamais un franc pour $quoi tant que vous n’avez pas de papier signé.',
        texteMauvais: 'ARNAQUE. Réclamer de l’argent avant tout document est le schéma exact des faux voyagistes. Ne versez rien, et signalez cette annonce.',
        textes: const {'Un acompte, après le contrat écrit': 'Un acompte après contrat écrit : c’est l’usage. Gardez le contrat et le reçu — ils sont votre seul recours.'},
      ),
      bloque: const ['Des frais de dossier à payer avant tout contact', 'La totalité par Mobile Money, avant tout document'],
      motifBloc: 'Réclamer de l’argent avant tout contrat écrit est le schéma des faux voyagistes. Une telle annonce ne peut pas être publiée.',
      h: (s) => RegExp('avant tout contact|avant tout document').hasMatch(_t(s, 'fraisAvant'))
          ? '!Un transfert Mobile Money vers un particulier ne se récupère jamais. C’est précisément pour cela que les faux voyagistes ne demandent que cela. Cette annonce ne sera pas publiée.'
          : 'Un contrat écrit — même une page — protège les deux côtés, et c’est ce que le voyageur regarde en premier chez un professionnel.',
    );

/// Placer quelqu'un à l'étranger est une activité réglementée : on fait dire le statut.
final _agrement = Champ('agrement', 'Votre statut',
    req: true,
    options: const [
      'Agence agréée — j’ai un numéro d’agrément',
      'Entreprise enregistrée au RCCM',
      'Particulier — je revends mon propre billet ou séjour',
      'Aucun statut déclaré'
    ],
    h: (s) {
      final a = _t(s, 'agrement');
      if (RegExp('Aucun statut').hasMatch(a)) return '!Vendre des voyages ou placer des candidats à l’étranger sans statut déclaré vous expose, et fait fuir les clients prudents. Indiquez au moins votre RCCM.';
      if (RegExp('agréée').hasMatch(a)) return 'Écrivez votre numéro d’agrément dans la description : c’est le premier élément que vérifie un voyageur échaudé.';
      if (RegExp('Particulier').hasMatch(a)) return 'Un particulier peut revendre SON billet ou SON séjour. Vendre ceux des autres, c’est une activité d’agence, et elle demande un agrément.';
      return 'Le numéro RCCM se lit sur votre registre de commerce. Écrivez-le dans la description.';
    });

/// La traite ne se publie pas ici.
final _itineraire = Champ('itineraire', 'Comment se fait le voyage',
    req: true,
    options: const [
      'Vol régulier, avec visa en règle',
      'Voie terrestre légale, avec les documents requis',
      'Passage par la route sans visa — « on s’arrange à la frontière »',
      'Traversée en mer'
    ],
    bloque: const ['Passage par la route sans visa — « on s’arrange à la frontière »', 'Traversée en mer'],
    motifBloc: 'Organiser un passage sans visa, par la route ou par la mer, c’est de la traite. Cela ne se publie pas sur Chap.ci.',
    h: (s) => RegExp('sans visa|Traversée').hasMatch(_t(s, 'itineraire'))
        ? '!Le désert et la Méditerranée tuent des Ivoiriens chaque mois. Organiser ces passages est un crime, pas un voyage. Cette annonce ne sera pas publiée, et elle sera signalée.'
        : 'Un voyage en règle, c’est un billet, un visa et un passeport valide. Rien d’autre ne protège une fois la frontière franchie.');

final Map<String, Schema> voyage = {
  'Billets d’avion': Schema(
    etat: false,
    livraison: false,
    prixLabel: 'Prix du billet',
    titre: (s) => [_t(s, 'villeDepart'), _t(s, 'destination'), _t(s, 'typeVol')].where((x) => x.isNotEmpty).join(' → '),
    champs: [
      const Champ('sensBillet', 'Vous', req: true, options: ['Vendez un billet', 'Cherchez un billet']),
      const Champ('villeDepart', 'Départ de', req: true, options: ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Autre ville']),
      const Champ('destination', 'Destination', req: true, options: _destinations, libre: 'Autre pays'),
      const Champ('compagnie', 'Compagnie', ph: 'Ex : Air Côte d’Ivoire, Air France, Turkish Airlines'),
      Champ('nomBillet', 'Le nom sur le billet',
          req: true,
          when: (s) => RegExp('Vendez').hasMatch(_t(s, 'sensBillet')),
          options: const [
            'Le billet n’est pas encore émis — il sera à votre nom',
            'Billet émis, le changement de nom est possible et payant',
            'Billet émis à mon nom, changement de nom impossible'
          ],
          alerte: const Alerte(
            bon: 'Le billet n’est pas encore émis — il sera à votre nom',
            ok: ['Billet émis, le changement de nom est possible et payant'],
            texteBon: 'Le billet sera émis à VOTRE nom : c’est la seule façon d’acheter un billet à quelqu’un d’autre.',
            texteMauvais: 'ATTENTION. Un billet d’avion est nominatif : celui-ci porte le nom du vendeur, et vous ne pourrez jamais embarquer avec. N’achetez pas.',
            textes: {'Billet émis, le changement de nom est possible et payant': 'Le changement de nom est possible mais payant. Faites-le confirmer par la compagnie AVANT de payer, et demandez le montant exact.'},
          ),
          bloque: const ['Billet émis à mon nom, changement de nom impossible'],
          motifBloc: 'Un billet nominatif non modifiable ne peut pas être revendu : l’acheteur ne pourra jamais embarquer avec.',
          h: (s) => RegExp('impossible').hasMatch(_t(s, 'nomBillet'))
              ? '!Un billet d’avion porte le nom du passager, contrôlé au comptoir contre le passeport. Vendre le vôtre, c’est vendre un papier inutilisable. Cette annonce ne sera pas publiée — voyez plutôt avec la compagnie pour un remboursement ou un avoir.'
              : 'C’est LA question du billet d’avion d’occasion : le nom se contrôle contre le passeport à l’enregistrement. Faites confirmer le changement de nom par la compagnie avant toute transaction.'),
      _fraisAvant('un billet'),
      const Champ('typeVol', 'Type de vol', req: true, options: ['Aller simple', 'Aller-retour', 'Multi-destinations']),
      const Champ('dateVol', 'Date du départ', req: true, ph: 'Ex : 22 septembre 2026'),
      const Champ('classeVol', 'Classe', options: ['Économique', 'Économique premium', 'Affaires', 'Première']),
      const Champ('bagages', 'Bagages inclus',
          req: true,
          options: ['Bagage cabine uniquement', '1 bagage en soute (23 kg)', '2 bagages en soute', 'Plus de 2 bagages', 'À vérifier'],
          h: 'Un billet « pas cher » sans bagage en soute coûte souvent plus cher qu’un billet complet, une fois le bagage payé au comptoir.'),
      const Champ('escales', 'Escales', options: ['Vol direct', '1 escale', '2 escales ou plus']),
      const Champ('modifBillet', 'Modification et annulation',
          req: true,
          options: ['Modifiable et remboursable', 'Modifiable avec frais', 'Ni modifiable ni remboursable', 'Je ne sais pas'],
          h: 'Un billet non remboursable acheté à un particulier ne se rattrape pas si le voyage tombe à l’eau. Dites-le franchement.'),
      Champ('paiementBillet', 'Où se fait la transaction',
          req: true,
          options: const ['Au comptoir de l’agence', 'Dans une agence de la compagnie', 'En main propre, dans un lieu public', 'Par Mobile Money à distance'],
          h: (s) => RegExp('à distance').hasMatch(_t(s, 'paiementBillet'))
              ? '!Payer un billet à distance, à quelqu’un que vous n’avez jamais vu, est la façon la plus courante de perdre son argent sur ce rayon. Exigez le comptoir d’une agence.'
              : 'Se retrouver au comptoir d’une agence pour l’émission règle tout : vous voyez le billet sortir à votre nom.'),
    ],
  ),
  'Agences de voyage': Schema(
    etat: false,
    livraison: false,
    service: true,
    prixLabel: 'Tarif à partir de',
    titre: (s) => _t(s, 'nomAgence'),
    champs: [
      const Champ('nomAgence', 'Nom de l’agence', req: true, ph: 'Ex : Agence Wôrô Voyages'),
      _agrement,
      Champ('numAgrement', 'Numéro d’agrément ou RCCM',
          when: (s) => RegExp('agréée|RCCM').hasMatch(_t(s, 'agrement')),
          ph: 'Ex : CI-ABJ-2024-B-12345',
          h: 'Écrit en clair, ce numéro est vérifiable. C’est ce qui vous sépare des annonces sans adresse.'),
      const Champ('prestations', 'Ce que vous proposez',
          multi: true, req: true,
          options: ['Billetterie aérienne', 'Réservation d’hôtel', 'Circuits et séjours', 'Accompagnement au dossier de visa', 'Assurance voyage', 'Location de voiture', 'Transferts aéroport', 'Pèlerinage', 'Voyages de groupe', 'Voyages d’affaires']),
      _visaPromesse,
      _fraisAvant('un voyage'),
      Champ('adresseAgence', 'Votre agence',
          req: true,
          options: const ['Local ouvert au public, avec adresse', 'Bureau sur rendez-vous', 'En ligne uniquement'],
          h: (s) => RegExp('En ligne uniquement').hasMatch(_t(s, 'adresseAgence'))
              ? '!Une agence sans adresse physique inquiète, et à juste titre : c’est la première chose que regarde un client qui a déjà été volé. Si vous en avez une, donnez-la.'
              : 'Écrivez l’adresse et un point de repère dans la description : « à côté de la pharmacie du carrefour » sert plus qu’un nom de rue.'),
      const Champ('iata', 'Accréditation IATA',
          options: ['Agence accréditée IATA', 'Non accréditée', 'En cours'],
          h: 'L’accréditation IATA permet d’émettre soi-même les billets. Ce n’est pas obligatoire, mais cela se dit.'),
      const Champ('anciennete', 'Depuis quand exercez-vous', options: ['Moins d’un an', '1 à 3 ans', '3 à 10 ans', 'Plus de 10 ans']),
      const Champ('paiementAgence', 'Moyens de paiement acceptés',
          multi: true, options: ['Espèces au comptoir', 'Mobile Money', 'Virement bancaire', 'Carte bancaire', 'Paiement en plusieurs fois']),
      const Champ('recu', 'Ce que reçoit le client',
          multi: true, req: true,
          options: ['Facture au nom de l’agence', 'Reçu simple', 'Contrat écrit', 'Billet électronique par e-mail', 'Rien'],
          h: 'Une facture au nom de l’agence est le seul document qui permette à un client de se retourner. Donnez-la systématiquement.'),
    ],
  ),
  'Visas & formalités': Schema(
    etat: false,
    livraison: false,
    service: true,
    prixLabel: 'Honoraires d’accompagnement',
    titre: (s) => [_t(s, 'typeDossier'), _t(s, 'paysVisa')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeDossier', 'Type de dossier',
          req: true,
          options: ['Visa touristique', 'Visa d’affaires', 'Visa étudiant', 'Visa de travail', 'Regroupement familial', 'Passeport ivoirien', 'Carte consulaire', 'Légalisation de documents', 'Traduction assermentée', 'Attestation d’hébergement', 'Casier judiciaire', 'Certificat de nationalité']),
      const Champ('paysVisa', 'Pays concerné', req: true, options: _destinations, libre: 'Autre pays'),
      _visaPromesse,
      _fraisAvant('un dossier de visa'),
      _agrement,
      Champ('fraisSepares', 'Les frais consulaires',
          req: true,
          options: const ['Payés directement par le client au consulat', 'Inclus dans mon tarif, détaillés sur la facture', 'Inclus, non détaillés'],
          h: (s) => RegExp('non détaillés').hasMatch(_t(s, 'fraisSepares'))
              ? '!Mélanger frais consulaires et honoraires empêche le client de savoir ce qu’il vous paie à vous. Détaillez : c’est ce que fait un professionnel.'
              : 'Les frais du consulat ne sont pas les vôtres. Les séparer sur la facture est le geste qui inspire le plus confiance sur ce rayon.'),
      const Champ('prestationVisa', 'Ce que vous faites exactement',
          multi: true, req: true,
          options: ['Vérification de la liste des pièces', 'Remplissage du formulaire en ligne', 'Prise de rendez-vous', 'Préparation à l’entretien', 'Rédaction de la lettre de motivation', 'Traduction de documents', 'Accompagnement physique au centre de dépôt'],
          h: 'Un accompagnement honnête se décrit par des gestes précis. Les annonces qui ne disent que « je m’occupe de tout » sont celles qui inquiètent.'),
      const Champ('documentsVisa', 'Documents que vous demandez au client',
          multi: true,
          options: ['Passeport en cours de validité', 'Photos d’identité', 'Justificatifs de ressources', 'Attestation d’emploi', 'Réservation d’hôtel', 'Assurance voyage', 'Acte de naissance'],
          h: 'Ne réclamez jamais l’original d’un passeport avant un rendez-vous confirmé. Un client prudent refusera, et il aura raison.'),
      Champ('delaiVisa', 'Délai annoncé',
          req: true,
          options: const ['Selon le consulat — je ne le maîtrise pas', '2 à 4 semaines', '1 à 2 mois', 'Plus de deux mois'],
          h: (s) => RegExp('2 à 4 semaines|1 à 2 mois').hasMatch(_t(s, 'delaiVisa'))
              ? 'Annoncez ce délai comme une estimation. Les consulats changent leurs cadences sans prévenir, et une promesse de date se retourne contre vous.'
              : 'Dire que le délai appartient au consulat est honnête, et cela vous évite le reproche du client pressé.'),
      const Champ('refusVisa', 'En cas de refus',
          req: true,
          options: ['Les honoraires restent dus, c’est dit à l’avance', 'Honoraires partiellement remboursés', 'Nouveau dossier accompagné gratuitement'],
          h: 'Un refus de visa n’est pas votre faute. Le dire AVANT, par écrit, évite l’essentiel des conflits de ce métier.'),
    ],
  ),
  'Études à l’étranger': Schema(
    etat: false,
    livraison: false,
    service: true,
    prixLabel: 'Frais d’accompagnement',
    titre: (s) => [_t(s, 'paysEtude'), _t(s, 'niveauEtude'), _t(s, 'domaineEtude')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('sensEtude', 'Vous', req: true, options: ['Proposez un accompagnement ou une formation', 'Cherchez à partir étudier']),
      const Champ('paysEtude', 'Pays d’études', req: true, options: _destinations, libre: 'Autre pays'),
      const Champ('niveauEtude', 'Niveau visé',
          req: true, options: ['Année préparatoire / langue', 'Licence (BAC+1 à BAC+3)', 'Master (BAC+4, BAC+5)', 'Doctorat', 'BTS / DUT', 'Formation professionnelle']),
      const Champ('domaineEtude', 'Domaine',
          req: true, libre: 'Autre domaine',
          options: ['Informatique & numérique', 'Commerce & gestion', 'Santé & paramédical', 'Ingénierie', 'Droit', 'Sciences', 'Lettres & sciences humaines', 'Agronomie', 'Hôtellerie & tourisme', 'Arts & design']),
      Champ('admissionPromesse', 'Ce que vous promettez sur l’admission',
          req: true,
          when: (s) => RegExp('Proposez').hasMatch(_t(s, 'sensEtude')),
          options: const [
            'Aucune garantie — l’école décide',
            'Accompagnement au dossier, sans garantie',
            'Admission garantie dans une école partenaire',
            'Inscription garantie sans dossier ni diplôme'
          ],
          alerte: const Alerte(
            bon: 'Aucune garantie — l’école décide',
            ok: ['Accompagnement au dossier, sans garantie'],
            texteBon: 'Aucune garantie d’admission : c’est la réponse honnête. L’école décide, sur dossier.',
            texteMauvais: 'ARNAQUE. Une admission ne se garantit pas, et une « inscription sans diplôme » se paie très cher pour un papier sans valeur.',
          ),
          bloque: const ['Inscription garantie sans dossier ni diplôme'],
          motifBloc: 'Une inscription sans dossier ni diplôme ne mène à aucun diplôme reconnu. Cette annonce ne peut pas être publiée.',
          h: (s) {
            final a = _t(s, 'admissionPromesse');
            if (RegExp('sans dossier ni diplôme').hasMatch(a)) return '!Les « écoles » qui inscrivent sans dossier délivrent des diplômes que personne ne reconnaît, ni là-bas ni ici. L’étudiant perd son argent et ses années. Cette annonce ne sera pas publiée.';
            if (RegExp('Admission garantie').hasMatch(a)) return '!Une école partenaire admet sur dossier, comme les autres. Promettre l’admission engage votre responsabilité sur une décision qui n’est pas la vôtre — écrivez plutôt ce que vous faites pour rendre le dossier solide.';
            return 'Les familles paient parfois plusieurs années d’économies pour ce départ. Dire ce que vous ne maîtrisez pas est ce qui vous rendra recommandable.';
          }),
      _visaPromesse,
      _fraisAvant('un départ en études'),
      _agrement,
      _itineraire,
      const Champ('etablissement', 'Établissement visé', ph: 'Ex : Université de Lille, Cégep de Trois-Rivières',
          h: 'Nommez l’établissement : c’est ce que la famille vérifie, et c’est ce qui rend une annonce crédible.'),
      Champ('reconnuEtude', 'Reconnaissance du diplôme',
          req: true,
          when: (s) => RegExp('Proposez').hasMatch(_t(s, 'sensEtude')),
          options: const ['Diplôme d’État reconnu', 'Diplôme d’école privée reconnu par le pays', 'Certificat d’établissement uniquement', 'Je ne sais pas'],
          h: 'Un diplôme non reconnu ne vaut rien au retour. La famille doit le savoir avant de vendre un terrain pour le financer.'),
      const Champ('coutTotal', 'Ce que coûte l’année, tout compris',
          req: true,
          options: ['Moins de 1 million FCFA', '1 à 3 millions FCFA', '3 à 6 millions FCFA', '6 à 12 millions FCFA', 'Plus de 12 millions FCFA', 'Cela dépend du dossier'],
          h: 'Scolarité, logement, visa, billet, assurance et premiers mois de vie. Un chiffre honnête évite à une famille de partir à moitié financée.'),
      const Champ('bourseEtude', 'Bourse',
          multi: true, options: ['Bourse du pays d’accueil possible', 'Bourse ivoirienne', 'Bourse de l’établissement', 'Aucune bourse', 'Je ne sais pas']),
      const Champ('logementEtude', 'Logement sur place',
          req: true,
          options: ['Logement étudiant réservé avant le départ', 'Aide à la recherche', 'À la charge de l’étudiant'],
          h: 'Arriver sans logement est ce qui fait échouer les premières semaines, surtout au Canada et en France.'),
      const Champ('travailEtude', 'Travail pendant les études',
          options: ['Autorisé, dans la limite légale', 'Non autorisé', 'Je ne sais pas'],
          h: 'Ne promettez jamais qu’un étudiant « financera ses études en travaillant là-bas ». C’est la promesse qui ruine le plus de familles.'),
    ],
  ),
  'Travail à l’étranger': Schema(
    etat: false,
    livraison: false,
    service: true,
    prixLabel: 'Salaire mensuel proposé',
    titre: (s) => [_t(s, 'posteEtranger'), _t(s, 'paysTravail')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('sensTravail', 'Vous', req: true, options: ['Proposez un emploi ou un placement à l’étranger', 'Cherchez un emploi à l’étranger']),
      const Champ('paysTravail', 'Pays', req: true, options: _destinations, libre: 'Autre pays'),
      const Champ('posteEtranger', 'Poste',
          req: true, libre: 'Autre poste',
          options: ['Bâtiment & travaux publics', 'Restauration & hôtellerie', 'Travail domestique / ménage', 'Garde d’enfants', 'Santé & aide à la personne', 'Agriculture & saisonnier', 'Chauffeur', 'Sécurité', 'Nettoyage', 'Informatique & numérique', 'Commerce & vente', 'Industrie & usine']),
      Champ('fraisPlacement', 'Frais demandés au candidat',
          req: true,
          options: const [
            'Aucun — le recrutement est entièrement gratuit pour le candidat',
            'Des frais de placement sont demandés',
            'Le candidat paie son billet et son visa, le reste est pris en charge',
            'Le candidat avance tout, il est remboursé sur ses premiers salaires'
          ],
          alerte: const Alerte(
            bon: 'Aucun — le recrutement est entièrement gratuit pour le candidat',
            ok: ['Le candidat paie son billet et son visa, le reste est pris en charge'],
            texteBon: 'Recrutement gratuit pour le candidat : c’est la règle internationale, et c’est le signe d’un employeur sérieux.',
            texteMauvais: 'ARNAQUE, ET ILLÉGAL. Les frais de recrutement ne sont jamais à la charge du travailleur. Ne versez rien, et signalez cette annonce.',
            textes: {'Le candidat paie son billet et son visa, le reste est pris en charge': 'Le candidat paie son transport et son visa. C’est courant, mais exigez le contrat AVANT d’acheter le moindre billet.'},
          ),
          bloque: const ['Des frais de placement sont demandés', 'Le candidat avance tout, il est remboursé sur ses premiers salaires'],
          motifBloc: 'Les frais de recrutement ne sont jamais à la charge du travailleur (convention n° 181 de l’OIT). Une annonce qui les réclame ne peut pas être publiée.',
          h: (s) {
            final f = _t(s, 'fraisPlacement');
            if (RegExp('remboursé sur ses premiers salaires').hasMatch(f)) return '!« Vous remboursez sur vos salaires » est la formule de la servitude pour dettes : le travailleur arrive endetté, ne peut plus partir, et son passeport est confisqué. Cette annonce ne sera pas publiée.';
            if (RegExp('frais de placement').hasMatch(f)) return '!Faire payer un candidat pour un emploi à l’étranger est interdit. C’est aussi le premier geste de toutes les filières qui envoient des Ivoiriennes travailler sans contrat ni salaire. Cette annonce ne sera pas publiée.';
            return 'Un employeur qui paie lui-même le recrutement est un employeur qui existe. Dites-le clairement, cela vous distingue.';
          }),
      Champ('contratEcrit', 'Le contrat de travail',
          req: true,
          options: const [
            'Contrat écrit signé avant le départ, en français',
            'Contrat écrit signé à l’arrivée',
            'Accord verbal — le contrat se fait sur place',
            'Aucun contrat'
          ],
          alerte: const Alerte(
            bon: 'Contrat écrit signé avant le départ, en français',
            texteBon: 'Contrat écrit signé avant le départ : c’est la seule protection qui existe une fois la frontière franchie. Gardez-en une copie chez vous.',
            texteMauvais: 'DANGER. Partir sans contrat signé, c’est partir sans aucun recours. Ne partez pas.',
            textes: {'Contrat écrit signé à l’arrivée': 'Un contrat signé seulement à l’arrivée peut être remplacé par un autre, dans une langue que vous ne lisez pas. Exigez-le avant de monter dans l’avion.'},
          ),
          bloque: const ['Accord verbal — le contrat se fait sur place', 'Aucun contrat'],
          motifBloc: 'Envoyer quelqu’un travailler à l’étranger sans contrat écrit signé avant le départ ne peut pas se proposer sur Chap.ci.',
          h: (s) => RegExp('verbal|Aucun contrat').hasMatch(_t(s, 'contratEcrit'))
              ? '!Sans contrat signé avant le départ, le travailleur n’a aucun recours : ni salaire prouvable, ni horaires, ni billet de retour. C’est ainsi que des Ivoiriennes se retrouvent bloquées à l’étranger sans passeport. Cette annonce ne sera pas publiée.'
              : 'Salaire, horaires, jour de repos, logement, billet de retour, qui garde le passeport : ces six lignes doivent être écrites et signées avant le départ.'),
      Champ('passeport', 'Qui garde le passeport sur place',
          req: true,
          options: const ['Le travailleur garde son passeport', 'L’employeur le conserve', 'L’agence le conserve'],
          alerte: const Alerte(
            bon: 'Le travailleur garde son passeport',
            texteBon: 'Le travailleur garde son passeport. C’est la condition non négociable d’un départ sûr.',
            texteMauvais: 'DANGER ABSOLU. Un passeport confisqué, c’est l’impossibilité de rentrer. Ne partez pas, et signalez cette annonce.',
          ),
          bloque: const ['L’employeur le conserve', 'L’agence le conserve'],
          motifBloc: 'La confiscation du passeport d’un travailleur est une pratique de traite. Elle ne se propose pas sur Chap.ci.',
          h: (s) {
            final p = _t(s, 'passeport');
            if (RegExp('conserve').hasMatch(p)) return '!Confisquer le passeport est le geste par lequel un emploi devient une séquestration. C’est ce qui arrive à des travailleuses domestiques ivoiriennes chaque année. Cette annonce ne sera pas publiée, et elle sera signalée.';
            if (_kafala.hasMatch(_t(s, 'paysTravail'))) return 'Vous partez vers un pays où le travail se fait sous parrainage. Avant de partir : contrat écrit en français, copie laissée à votre famille, numéro de l’ambassade de Côte d’Ivoire enregistré dans votre téléphone, et votre passeport reste dans VOTRE poche.';
            return 'Le passeport reste au travailleur, toujours. Aucune raison légale ne justifie qu’un employeur le garde.';
          }),
      _itineraire,
      _agrement,
      _visaPromesse,
      Champ('billetTravail', 'Le billet et le visa',
          req: true,
          options: const ['Pris en charge par l’employeur', 'Pris en charge, retenus sur salaire', 'À la charge du candidat'],
          h: (s) => RegExp('retenus sur salaire').hasMatch(_t(s, 'billetTravail'))
              ? '!Un billet « retenu sur salaire » est une dette contractée avant même d’arriver. C’est le mécanisme exact du travail forcé. Prenez-le en charge, ou faites-le payer au candidat une fois pour toutes.'
              : ''),
      const Champ('retourTravail', 'Le billet de retour',
          req: true,
          options: ['Billet de retour garanti par le contrat', 'Retour à la charge du travailleur', 'Non prévu'],
          h: 'Le billet de retour écrit dans le contrat est le second garde-fou, après le passeport. Sans lui, on ne rentre pas.'),
      const Champ('dureeTravail', 'Durée du contrat', req: true, options: ['Saisonnier, moins de 6 mois', '1 an', '2 ans', 'Plus de 2 ans', 'Indéterminée']),
      const Champ('logementTravail', 'Logement et repas', options: ['Logé et nourri par l’employeur', 'Logé, non nourri', 'Ni logé ni nourri', 'Indemnité de logement']),
      const Champ('languesTravail', 'Langues exigées', multi: true, options: ['Français', 'Anglais', 'Arabe', 'Italien', 'Espagnol', 'Portugais', 'Aucune']),
    ],
  ),
  'Séjours & circuits': Schema(
    etat: false,
    livraison: false,
    prixLabel: 'Prix par personne',
    titre: (s) => [_t(s, 'typeSejour'), _t(s, 'destinationSejour'), _t(s, 'dureeSejour')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeSejour', 'Type de séjour',
          req: true,
          options: ['Séjour balnéaire', 'Circuit découverte', 'Week-end', 'Voyage de groupe', 'Voyage scolaire', 'Pèlerinage', 'Lune de miel', 'Séminaire d’entreprise', 'Séjour en Côte d’Ivoire', 'Croisière']),
      const Champ('destinationSejour', 'Destination',
          req: true, libre: 'Autre',
          options: ['Côte d’Ivoire — Assinie', 'Côte d’Ivoire — Grand-Bassam', 'Côte d’Ivoire — Man', 'Côte d’Ivoire — Yamoussoukro', 'Côte d’Ivoire — autre', 'Afrique de l’Ouest', 'Maghreb', 'Europe', 'Amérique du Nord', 'Moyen-Orient', 'Asie']),
      const Champ('dureeSejour', 'Durée', req: true, options: _dureeSejour),
      const Champ('dateSejour', 'Dates', ph: 'Ex : du 20 au 27 décembre 2026'),
      _agrement,
      _fraisAvant('un séjour'),
      _visaPromesse,
      const Champ('inclusSejour', 'Ce qui est compris dans le prix',
          multi: true, req: true,
          options: ['Vol aller-retour', 'Transferts aéroport', 'Hébergement', 'Petit-déjeuner', 'Pension complète', 'Excursions', 'Guide', 'Assurance voyage', 'Frais de visa', 'Rien de tout cela'],
          h: 'La liste de ce qui est compris est ce qui évite le litige de fin de séjour. Soyez précis, et dites aussi ce qui NE l’est pas.'),
      const Champ('hebergement', 'Hébergement', options: ['Hôtel 5 étoiles', 'Hôtel 4 étoiles', 'Hôtel 3 étoiles', 'Résidence / appartement', 'Maison d’hôtes', 'Campement', 'Chez l’habitant']),
      const Champ('groupeSejour', 'Nombre de places', options: ['1 à 2 personnes', '3 à 10 personnes', '11 à 30 personnes', 'Plus de 30 personnes']),
      Champ('acompteSejour', 'Acompte demandé',
          req: true,
          options: const ['Aucun acompte', '30 % à la réservation', '50 % à la réservation', 'Totalité à la réservation'],
          h: (s) => RegExp('Totalité').hasMatch(_t(s, 'acompteSejour'))
              ? '!Exiger la totalité à la réservation fait porter tout le risque au client. Un acompte et un solde avant le départ rassurent beaucoup plus.'
              : 'Remettez un reçu à chaque versement, avec la date, le montant et ce qu’il couvre.'),
      const Champ('annulSejour', 'Conditions d’annulation',
          req: true,
          options: ['Remboursement intégral jusqu’à 30 jours avant', 'Remboursement partiel', 'Acompte non remboursable', 'Aucun remboursement'],
          h: 'Les conditions d’annulation écrites à l’avance sont ce qui distingue un voyagiste d’un particulier. Mettez-les dans la description.'),
      const Champ('assuranceSejour', 'Assurance voyage',
          options: ['Incluse', 'En option', 'Non proposée'],
          h: 'Une assurance rapatriement coûte peu et sauve un séjour qui tourne mal. Proposez-la, même en option.'),
    ],
  ),
};
