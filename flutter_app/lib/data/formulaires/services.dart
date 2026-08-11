// =============================================================================
//  SERVICES — six sous-catégories (port fidèle de src/data/sous/services.dart).
//
//  Un service ne se photographie pas : il se PROMET. C'est ce qui décide des
//  champs.
//
//  1. LE DEVIS ET L'ACOMPTE. Le litige type n'est pas « l'objet est cassé »,
//     c'est « ce n'était pas le prix annoncé » ou « il est parti avec
//     l'acompte ». Chaque formulaire demande comment le prix est établi et payé.
//  2. LA ZONE D'INTERVENTION. Un plombier de Yopougon ne se déplace pas à
//     Bingerville pour une fuite : le dire évite l'appel pour rien.
//  3. « FORMATION PAYANTE POUR ÊTRE EMBAUCHÉ ». La même arnaque que les faux
//     recrutements : une promesse d'embauche contre paiement refuse l'annonce.
//  4. LE TRANSPORT DE PERSONNES exige une assurance et une licence.
// =============================================================================
import 'schema.dart';

String _t(Vals s, String cle) => (s[cle] ?? '').toString();

/// Vrai si le champ multi [cle] contient la valeur [val].
bool _contient(Vals s, String cle, String val) {
  final v = s[cle];
  return v is List && v.contains(val);
}

const _experience = ['Débutant', '1 à 2 ans', '3 à 5 ans', '5 à 10 ans', 'Plus de 10 ans'];
const _zones = [
  'Ma commune uniquement', 'Abidjan Sud (Marcory, Koumassi, Treichville, Port-Bouët)',
  'Abidjan Nord (Abobo, Adjamé, Attécoubé)', 'Abidjan Est (Cocody, Bingerville)',
  'Abidjan Ouest (Yopougon, Songon)', 'Tout Abidjan', 'Toute la Côte d’Ivoire', 'À distance / en ligne'
];

/// Comment le prix est fixé — la première cause de litige sur un service.
final _devis = Champ('devis', 'Comment le prix est fixé',
    req: true,
    options: const ['Tarif fixe annoncé', 'Devis gratuit après visite', 'Devis gratuit à distance', 'Devis payant (déduit si commande)', 'Sur mesure, à discuter'],
    h: (s) => RegExp('Devis payant').hasMatch(_t(s, 'devis'))
        ? '!Un devis payant fait fuir la moitié des demandes ici. Si vous devez le facturer, dites clairement qu’il est déduit de la facture finale.'
        : 'Un tarif annoncé, même « à partir de », multiplie les demandes sérieuses. « Nous consulter » seul fait passer votre tour.');

/// L'acompte : le bandeau de presque toutes les sous-catégories.
Champ _paiement(String quoi) => Champ(
      'paiement',
      'Modalités de paiement',
      req: true,
      options: const ['Paiement à la fin, une fois le travail fait', 'Acompte 30 %, solde à la fin', 'Acompte 50 %, solde à la fin', 'Paiement par étapes', 'Paiement intégral d’avance'],
      alerte: Alerte(
        bon: 'Acompte 50 %, solde à la fin',
        ok: const ['Paiement à la fin, une fois le travail fait', 'Acompte 30 %, solde à la fin', 'Paiement par étapes'],
        texteBon: 'Moitié à la commande, moitié à la fin : c’est l’équilibre habituel. Chacun prend la même part de risque.',
        texteMauvais: 'Le paiement intégral d’avance vous fait porter tout le risque sur $quoi. Proposez un acompte et un solde à la fin — un professionnel sérieux l’accepte.',
        textes: const {
          'Paiement à la fin, une fois le travail fait': 'Paiement à la fin : c’est vous qui êtes protégé. Convenez par écrit de ce qui est « fini » avant de commencer.',
          'Paiement par étapes': 'Paiement par étapes : la bonne formule sur un chantier long. Écrivez les étapes et ce qui est dû à chacune.'
        },
      ),
      h: (s) => _t(s, 'paiement') == 'Paiement intégral d’avance'
          ? '!Exiger la totalité d’avance est le schéma de l’arnaque à l’acompte, et cela fait fuir les bons clients. Un acompte de 50 % rassure bien davantage.'
          : 'Écrivez toujours ce qui est fait, quand, et pour combien. Un simple papier signé des deux côtés règle 90 % des disputes.',
    );

List<Champ> _communs(String quoi) => [
      const Champ('zone', 'Zone d’intervention',
          multi: true, req: true, options: _zones,
          h: 'Un artisan de Yopougon ne se déplace pas à Bingerville pour une petite intervention. Le dire évite l’appel pour rien, des deux côtés.'),
      const Champ('deplacement', 'Frais de déplacement',
          req: true, options: ['Déplacement gratuit', 'Déplacement facturé', 'Déplacement offert si commande', 'Le client vient à moi']),
      const Champ('experience', 'Expérience', req: true, options: _experience),
      _devis,
      _paiement(quoi),
      const Champ('refs', 'Références',
          req: true,
          options: ['Photos de réalisations disponibles', 'Clients référencés', 'Attestations de travaux', 'Débutant, pas encore de références'],
          h: 'Trois photos de chantiers finis valent mieux que dix lignes de promesses.'),
      const Champ('garantieS', 'Garantie sur la prestation',
          req: true,
          options: ['Aucune garantie', '15 jours', '1 mois', '3 mois', '6 mois', '1 an', 'Garantie décennale'],
          h: 'Une garantie, même de quinze jours, vous distingue immédiatement de celui d’à côté qui n’en donne aucune.'),
      const Champ('facture', 'Facturation',
          req: true,
          options: ['Facture avec numéro de contribuable', 'Reçu simple', 'Aucune facture'],
          h: 'Une facture en règle ouvre les marchés des entreprises, des ONG et des administrations — elles ne peuvent pas payer sans.'),
      const Champ('dispoS', 'Disponibilité',
          req: true, options: ['Immédiate', 'Sous 48 heures', 'Sous une semaine', 'Sous un mois', 'Sur planning']),
    ];

final Map<String, Schema> services = {
  'BTP & Rénovation': Schema(
    etat: false,
    prixLabel: 'Tarif à partir de',
    champs: [
      const Champ('metier', 'Ce que vous faites',
          multi: true, req: true,
          options: ['Maçonnerie', 'Carrelage', 'Peinture', 'Plomberie', 'Électricité', 'Menuiserie bois', 'Menuiserie aluminium', 'Ferronnerie', 'Étanchéité', 'Faux plafond', 'Climatisation', 'Forage / puits', 'Terrassement', 'Démolition', 'Second œuvre complet']),
      const Champ('uniteBtp', 'Le tarif est',
          req: true, options: ['Au mètre carré', 'À la journée', 'Au forfait / au chantier', 'À l’heure', 'Sur devis']),
      const Champ('equipe', 'Taille de l’équipe',
          req: true, options: ['Je travaille seul', '2 à 3 personnes', '4 à 10 personnes', 'Plus de 10 personnes']),
      const Champ('materiaux', 'Les matériaux',
          req: true,
          options: ['Fournis par le client', 'Je les fournis, compris dans le prix', 'Je les fournis, facturés à part', 'Au choix du client'],
          h: 'C’est la deuxième source de dispute après le prix. Dites-le avant, pas au moment de la facture.'),
      Champ('assurance', 'Assurance chantier',
          req: true,
          options: const ['Assuré responsabilité civile professionnelle', 'Non assuré'],
          h: (s) => _t(s, 'assurance') == 'Non assuré'
              ? '!Sans assurance, un dégât d’eau chez le client est à votre charge — ou à la sienne. Beaucoup de clients d’immeuble l’exigent désormais.'
              : 'Très peu d’artisans peuvent l’afficher ici. Si vous l’avez, mettez-le dans le titre.'),
      ..._communs('un chantier'),
    ],
  ),
  'Cours & Formation': Schema(
    etat: false,
    prixLabel: 'Tarif',
    champs: [
      const Champ('matiere', 'Ce que vous enseignez',
          multi: true, req: true,
          options: ['Mathématiques', 'Français', 'Anglais', 'Physique-Chimie', 'SVT', 'Histoire-Géographie', 'Philosophie', 'Comptabilité', 'Informatique / bureautique', 'Programmation', 'Couture', 'Coiffure', 'Pâtisserie / cuisine', 'Mécanique', 'Conduite', 'Musique', 'Sport / coaching', 'Alphabétisation', 'Langue locale']),
      const Champ('niveauEleve', 'Public',
          multi: true, req: true,
          options: ['Primaire', 'Collège', 'Lycée', 'Terminale / BAC', 'Université', 'Adultes', 'Professionnels', 'Débutants complets']),
      const Champ('uniteCours', 'Le tarif est',
          req: true, options: ['À l’heure', 'À la séance', 'Au mois', 'Au module complet', 'Gratuit']),
      const Champ('formatCours', 'Format',
          multi: true, req: true,
          options: ['À domicile chez l’élève', 'Chez moi', 'En centre / salle', 'En ligne', 'En groupe', 'Individuel']),
      Champ('promesseEmploi', 'Emploi promis à la fin',
          req: true,
          options: const ['Aucun emploi promis — c’est une formation', 'Aide à la recherche d’emploi, sans promesse', 'Emploi garanti contre paiement de la formation'],
          alerte: const Alerte(
            bon: 'Aucun emploi promis — c’est une formation',
            ok: ['Aide à la recherche d’emploi, sans promesse'],
            texteBon: 'Le formateur vend une formation, pas un emploi. C’est honnête : jugez le programme, la durée et l’attestation.',
            texteMauvais: 'ARNAQUE. Personne ne peut garantir un emploi contre le paiement d’une formation. C’est le schéma exact des faux recrutements.',
          ),
          bloque: const ['Emploi garanti contre paiement de la formation'],
          motifBloc: 'Promettre un emploi garanti contre le paiement d’une formation est une arnaque : l’annonce ne peut pas être publiée.',
          h: (s) => RegExp('garanti contre paiement').hasMatch(_t(s, 'promesseEmploi'))
              ? '!Faire payer une formation en promettant un emploi à la clé est la même arnaque que les faux recrutements démentis par la CIE et le Port autonome. Cette annonce ne sera pas publiée.'
              : 'Une formation honnête se vend sur son contenu. Promettre un emploi en échange d’un paiement est interdit ici.'),
      const Champ('attestation', 'Attestation délivrée',
          req: true,
          options: ['Attestation de fin de formation', 'Certificat reconnu / agréé', 'Aucune attestation'],
          h: 'Un agrément d’État se vérifie : ne l’annoncez que si vous l’avez, sous peine de perdre toute crédibilité.'),
      const Champ('dureeCours', 'Durée', options: ['Une séance', 'Quelques séances', '1 mois', '3 mois', '6 mois', '1 an', 'Selon le besoin']),
      const Champ('effectif', 'Effectif par groupe', options: ['Cours particulier', '2 à 5 élèves', '6 à 15 élèves', 'Plus de 15 élèves']),
      ..._communs('une formation'),
    ],
  ),
  'Événementiel': Schema(
    etat: false,
    prixLabel: 'Tarif à partir de',
    champs: [
      const Champ('prestaEvt', 'Ce que vous proposez',
          multi: true, req: true,
          options: ['Traiteur', 'Décoration', 'Location de matériel (chaises, bâches)', 'Sonorisation', 'DJ / animation', 'Photographie', 'Vidéo / drone', 'Wedding planner', 'Location de salle', 'Sécurité', 'Hôtesses / protocole', 'Pâtisserie / gâteaux', 'Location de voiture de cérémonie', 'Groupe / orchestre']),
      const Champ('typeEvt', 'Types d’événements',
          multi: true, req: true,
          options: ['Mariage', 'Baptême', 'Anniversaire', 'Funérailles', 'Séminaire d’entreprise', 'Lancement / inauguration', 'Concert', 'Fête de fin d’année', 'Cérémonie traditionnelle']),
      const Champ('capacite', 'Capacité',
          req: true, options: ['Moins de 50 personnes', '50 à 150 personnes', '150 à 500 personnes', 'Plus de 500 personnes']),
      const Champ('reservation', 'Réservation',
          req: true,
          options: ['Sans acompte', 'Acompte pour bloquer la date', 'Contrat écrit obligatoire'],
          h: 'Sur une date de mariage, un contrat écrit protège les deux parties. C’est un argument de sérieux.'),
      Champ('annulation', 'En cas d’annulation',
          req: true,
          options: const ['Acompte remboursé intégralement', 'Acompte remboursé en partie', 'Acompte non remboursable', 'Report de date possible'],
          h: (s) => RegExp('non remboursable').hasMatch(_t(s, 'annulation'))
              ? '!Annoncez-le très clairement, et par écrit. Un acompte de mariage non remboursable découvert après coup finit toujours mal.'
              : 'Le dire d’avance évite le litige le plus fréquent du métier.'),
      ..._communs('une prestation'),
    ],
  ),
  'Transport & Déménagement': Schema(
    etat: false,
    prixLabel: 'Tarif à partir de',
    champs: [
      const Champ('prestaT', 'Ce que vous transportez',
          multi: true, req: true,
          options: ['Déménagement complet', 'Transport de meubles', 'Livraison de colis', 'Course rapide moto', 'Transport de marchandises', 'Transport de personnes', 'Location avec chauffeur', 'Transport de matériaux', 'Déblai / évacuation']),
      const Champ('vehicule', 'Véhicule',
          req: true,
          options: ['Moto / tricycle', 'Voiture', 'Camionnette / 4×4', 'Camion 3,5 t', 'Camion 10 t', 'Camion 20 t et plus', 'Benne', 'Plusieurs véhicules']),
      const Champ('uniteT', 'Le tarif est',
          req: true, options: ['Au voyage', 'À la journée', 'Au kilomètre', 'À l’heure', 'Au volume (m³)', 'Sur devis']),
      Champ('assuranceT', 'Assurance des biens transportés',
          req: true,
          options: const ['Marchandises assurées', 'Assurance du véhicule uniquement', 'Aucune assurance'],
          alerte: const Alerte(
            bon: 'Marchandises assurées',
            texteBon: 'Les biens transportés sont couverts. C’est rare ici, et c’est ce qui distingue un vrai professionnel — demandez l’attestation.',
            texteMauvais: 'Les biens transportés ne sont pas couverts. En cas de casse ou de vol pendant le trajet, rien ne vous sera remboursé : faites l’inventaire photo avant le chargement.',
          ),
          h: (s) => RegExp('Aucune assurance').hasMatch(_t(s, 'assuranceT'))
              ? '!Sans assurance marchandises, une casse est à votre charge ou à celle du client. Un inventaire photo signé avant chargement vous protège tous les deux.'
              : 'Très peu de déménageurs assurent les biens ici. Si vous le faites, c’est votre meilleur argument — mettez-le dans le titre.'),
      const Champ('mainOeuvre', 'Main-d’œuvre',
          req: true, options: ['Chauffeur seul', 'Chauffeur + 1 aide', 'Chauffeur + équipe', 'Équipe complète avec emballage']),
      const Champ('etages', 'Étages',
          multi: true, options: ['Rez-de-chaussée uniquement', 'Avec ascenseur', 'Sans ascenseur', 'Supplément par étage']),
      Champ('licence', 'Autorisation de transport',
          req: true,
          when: (s) => _contient(s, 'prestaT', 'Transport de personnes'),
          options: const ['Licence de transport en règle', 'En cours de régularisation', 'Aucune licence'],
          h: 'Le transport de personnes exige une licence et une assurance passagers. Sans elles, un accident n’est couvert par personne.'),
      ..._communs('un transport'),
    ],
  ),
  'Informatique & Digital': Schema(
    etat: false,
    prixLabel: 'Tarif',
    champs: [
      const Champ('prestaI', 'Ce que vous proposez',
          multi: true, req: true,
          options: ['Création de site web', 'Boutique en ligne', 'Application mobile', 'Community management', 'Publicité en ligne', 'Référencement (SEO)', 'Graphisme / logo', 'Montage vidéo', 'Photographie produit', 'Saisie / secrétariat', 'Formation bureautique', 'Installation réseau', 'Maintenance de parc', 'Développement sur mesure', 'Hébergement / nom de domaine'],
          h: 'La réparation d’appareils n’est pas ici : elle vit dans Électronique → Réparation & Dépannage.'),
      const Champ('uniteI', 'Le tarif est',
          req: true, options: ['Au projet', 'À l’heure', 'À la journée', 'Au mois (abonnement)', 'Sur devis']),
      const Champ('livrable', 'Ce qui est livré',
          multi: true, req: true,
          options: ['Code source', 'Accès administrateur', 'Fichiers sources (PSD, AI…)', 'Formation à l’usage', 'Documentation', 'Maintenance incluse un temps', 'Nom de domaine', 'Hébergement la première année'],
          h: 'Sur du numérique, c’est LE point de litige : qui garde le code, les accès et le nom de domaine. Dites-le d’emblée.'),
      const Champ('delaiI', 'Délai habituel',
          req: true, options: ['Moins de 48 h', 'Une semaine', '2 à 4 semaines', '1 à 3 mois', 'Selon le projet']),
      const Champ('revisions', 'Corrections comprises',
          req: true,
          options: ['Corrections illimitées', '3 séries de corrections', '2 séries de corrections', '1 seule série', 'Aucune correction comprise'],
          h: 'Fixer un nombre de corrections évite le projet qui ne finit jamais — et c’est aussi ce qui rassure le client.'),
      ..._communs('un projet'),
    ],
  ),
  'Couture & Artisanat': Schema(
    etat: false,
    prixLabel: 'Tarif à partir de',
    champs: [
      const Champ('prestaC', 'Ce que vous faites',
          multi: true, req: true,
          options: ['Couture sur mesure femme', 'Couture sur mesure homme', 'Tenue traditionnelle', 'Robe de mariée', 'Tenue de cérémonie', 'Uniformes / tenues de travail', 'Retouches', 'Broderie', 'Perlage', 'Sacs et accessoires', 'Chaussures', 'Coiffure / tresses', 'Maroquinerie', 'Bijoux artisanaux', 'Sculpture / bois', 'Poterie', 'Vannerie']),
      const Champ('tissuC', 'Le tissu',
          req: true,
          options: ['Fourni par le client', 'Je le fournis, compris dans le prix', 'Je le fournis, facturé à part', 'Au choix du client'],
          h: 'Le malentendu le plus courant du métier. Dites-le avant de prendre les mesures.'),
      const Champ('mesures', 'Prise de mesures',
          req: true, options: ['Chez moi', 'À domicile chez le client', 'Le client envoie ses mesures', 'Modèle standard, pas de mesures']),
      const Champ('delaiC', 'Délai de confection',
          req: true,
          options: ['Moins de 3 jours', '3 à 7 jours', '1 à 2 semaines', '2 à 4 semaines', 'Plus d’un mois', 'Selon la pièce'],
          h: 'Le délai tenu est ce qui fait revenir un client — et ce qui le fait partir. Annoncez large plutôt que serré.'),
      const Champ('retouches', 'Retouches après essayage',
          req: true,
          options: ['Comprises et illimitées', 'Deux retouches comprises', 'Une retouche comprise', 'Facturées à part'],
          h: 'Sur du sur-mesure, promettre au moins une retouche est le minimum attendu.'),
      const Champ('essayage', 'Essayage',
          req: true, options: ['Un essayage prévu', 'Deux essayages prévus', 'Pas d’essayage']),
      ..._communs('une commande'),
    ],
  ),
};
