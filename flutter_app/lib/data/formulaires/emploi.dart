// =============================================================================
//  EMPLOI — cinq sous-catégories (port fidèle de src/data/sous/emploi.dart).
//
//  C'est la catégorie où l'arnaque est la mieux organisée de Côte d'Ivoire, et
//  la seule où la victime est le VENDEUR de son travail, pas l'acheteur.
//
//  1. « LES FRAIS DE DOSSIER ». On copie le logo d'une institution connue, on
//     annonce un recrutement massif, on fait envoyer les dossiers à un Gmail,
//     puis on réclame des « frais de dossier / formation / équipement ». La CIE,
//     le Port autonome, l'aéroport FHB et les Eaux et Forêts ont tous dû
//     démentir de faux recrutements à leur nom. Un employeur ne demande JAMAIS
//     d'argent : une réponse positive refuse l'annonce.
//  2. L'ADRESSE DE CONTACT. Une candidature envoyée à un Gmail plutôt qu'au
//     domaine de l'entreprise est le deuxième signal d'alerte.
//  3. LE TRAVAIL DOMESTIQUE. L'âge (le travail domestique d'un mineur est
//     interdit et refusé) et la déclaration CNPS distinguent l'employeur sérieux.
// =============================================================================
import 'schema.dart';

String _t(Vals s, String cle) => (s[cle] ?? '').toString();

bool _contient(Vals s, String cle, String val) {
  final v = s[cle];
  return v is List && v.contains(val);
}

/// LA question de cette catégorie : elle refuse l'annonce, et elle explique.
Champ _fraisCandidat(String quoi) => Champ(
      'frais',
      'Frais demandés au candidat',
      req: true,
      options: const [
        'Aucun frais — le recrutement est entièrement gratuit',
        'Des frais de dossier sont demandés',
        'Des frais de formation sont demandés',
        'Le candidat doit acheter son équipement ou sa tenue'
      ],
      alerte: Alerte(
        bon: 'Aucun frais — le recrutement est entièrement gratuit',
        texteBon: 'Le recrutement est annoncé gratuit. C’est la règle : ne versez jamais un franc pour obtenir $quoi. Si on vous réclame de l’argent en cours de route, signalez l’annonce.',
        texteMauvais: 'ARNAQUE. Un employeur ne demande jamais d’argent à un candidat. Ne versez rien, et signalez cette annonce.',
      ),
      bloque: const ['Des frais de dossier sont demandés', 'Des frais de formation sont demandés', 'Le candidat doit acheter son équipement ou sa tenue'],
      motifBloc: 'Un employeur ne demande jamais d’argent à un candidat. Une annonce qui réclame des frais ne peut pas être publiée.',
      h: (s) {
        final f = _t(s, 'frais');
        if (f.isNotEmpty && f != 'Aucun frais — le recrutement est entièrement gratuit') {
          return '!Réclamer des frais à un candidat est le schéma exact des faux recrutements démentis par la CIE, le Port autonome d’Abidjan et l’aéroport FHB. Cette annonce ne peut pas être publiée sur Chap.ci.';
        }
        return 'La question est posée à tout le monde, et c’est volontaire : y répondre « gratuit » est ce qui distingue une vraie offre des dizaines de fausses qui circulent chaque semaine.';
      },
    );

/// Le deuxième signal des services qui alertent : l'adresse de candidature.
final _contactCandidature = Champ('contactPro', 'Comment postuler',
    req: true,
    options: const ['Messagerie Chap.ci', 'E-mail au domaine de l’entreprise', 'Site carrière de l’entreprise', 'Adresse Gmail / Yahoo / Hotmail', 'Se présenter sur place', 'WhatsApp'],
    h: (s) {
      final c = _t(s, 'contactPro');
      if (RegExp('Gmail').hasMatch(c)) {
        return '!Une candidature à envoyer sur une boîte Gmail ou Yahoo plutôt qu’au domaine de l’entreprise est le deuxième signal d’alerte cité par les services qui démentent les faux recrutements. Si vous avez une adresse professionnelle, utilisez-la : vous serez pris au sérieux.';
      }
      if (RegExp('domaine de l’entreprise|Site carrière').hasMatch(c)) {
        return 'Une adresse au nom de l’entreprise inspire immédiatement confiance. C’est ce qui vous distingue des fausses annonces.';
      }
      return 'La messagerie Chap.ci protège votre numéro et garde une trace des échanges — utile si un litige survient.';
    });

const _experience = ['Débutant accepté', 'Moins d’un an', '1 à 2 ans', '3 à 5 ans', '5 à 10 ans', 'Plus de 10 ans'];
const _niveau = ['Sans diplôme exigé', 'CEPE', 'BEPC', 'BAC', 'BAC+2 (BTS, DUT)', 'BAC+3 (Licence)', 'BAC+5 (Master, ingénieur)', 'Doctorat', 'Formation professionnelle / CQP'];

const _postes = {
  'Commerce & Vente': ['Vendeur / vendeuse', 'Caissier(ère)', 'Commercial terrain', 'Téléconseiller', 'Chef de rayon', 'Responsable boutique', 'Merchandiseur', 'Agent de recouvrement'],
  'Restauration & Hôtellerie': ['Serveur(se)', 'Cuisinier(ère)', 'Aide-cuisine', 'Plongeur', 'Barman', 'Réceptionniste', 'Femme / valet de chambre', 'Gérant de maquis', 'Pâtissier'],
  'BTP & Construction': ['Maçon', 'Carreleur', 'Peintre en bâtiment', 'Menuisier', 'Ferrailleur', 'Plombier', 'Électricien bâtiment', 'Chef de chantier', 'Conducteur d’engin', 'Manœuvre'],
  'Transport & Logistique': ['Chauffeur poids lourd', 'Chauffeur véhicule léger', 'Chauffeur de taxi', 'Livreur', 'Coursier moto', 'Magasinier', 'Agent de transit', 'Manutentionnaire', 'Gestionnaire de stock'],
  'Santé': ['Infirmier(ère)', 'Sage-femme', 'Aide-soignant(e)', 'Pharmacien', 'Préparateur en pharmacie', 'Laborantin', 'Médecin', 'Kinésithérapeute'],
  'Éducation & Formation': ['Enseignant primaire', 'Enseignant secondaire', 'Répétiteur / cours à domicile', 'Formateur professionnel', 'Éducateur préscolaire', 'Surveillant'],
  'Informatique & Digital': ['Développeur', 'Technicien informatique', 'Community manager', 'Graphiste', 'Administrateur réseau', 'Data analyst', 'Support technique', 'Webmaster'],
  'Comptabilité & Finance': ['Comptable', 'Aide-comptable', 'Contrôleur de gestion', 'Auditeur', 'Caissier de banque', 'Chargé de clientèle', 'Agent de microfinance'],
  'Administration & Secrétariat': ['Secrétaire', 'Assistant(e) de direction', 'Agent administratif', 'Standardiste', 'Archiviste', 'Assistant RH'],
  'Sécurité': ['Agent de sécurité', 'Vigile', 'Maître-chien', 'Superviseur sécurité', 'Agent de sûreté'],
  'Industrie & Production': ['Opérateur de production', 'Technicien de maintenance', 'Soudeur', 'Mécanicien industriel', 'Contrôleur qualité', 'Chef d’équipe'],
  'Agriculture & Agroalimentaire': ['Ouvrier agricole', 'Technicien agricole', 'Chef de plantation', 'Pisciculteur', 'Agent de conditionnement', 'Éleveur'],
  'Communication & Marketing': ['Chargé de communication', 'Attaché de presse', 'Infographiste', 'Chargé de marketing', 'Animateur commercial'],
  'Nettoyage & Entretien': ['Agent d’entretien', 'Technicien de surface', 'Laveur de vitres', 'Agent de nettoyage industriel'],
  'Beauté & Bien-être': ['Coiffeur(se)', 'Esthéticienne', 'Masseur', 'Prothésiste ongulaire', 'Barbier'],
  'Autre secteur': ['Autre poste'],
};

final Map<String, Schema> emploi = {
  'Offres d’emploi': Schema(
    etat: false,
    livraison: false,
    prixLabel: 'Salaire mensuel proposé',
    titre: (s) => [_t(s, 'poste'), _t(s, 'contrat'), _t(s, 'entreprise')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      Champ('secteur', 'Secteur', req: true, options: _postes.keys.toList()),
      const Champ('poste', 'Poste à pourvoir',
          req: true, dependDe: 'secteur', table: _postes, libre: 'Autre poste',
          h: 'Le poste exact fait trouver votre annonce : c’est lui que les candidats tapent dans la recherche.'),
      const Champ('entreprise', 'Nom de l’entreprise',
          req: true, ph: 'Ex : Boulangerie Le Croissant, SARL Kouassi & Fils',
          h: 'Une annonce sans nom d’entreprise n’est presque jamais lue jusqu’au bout. Si vous recrutez pour un tiers, dites-le.'),
      _fraisCandidat('un emploi'),
      _contactCandidature,
      const Champ('contrat', 'Type de contrat',
          req: true, options: ['CDI', 'CDD', 'Stage', 'Intérim', 'Journalier', 'Temps partiel', 'Prestation / freelance', 'Apprentissage']),
      Champ('dureeCdd', 'Durée du contrat',
          when: (s) => RegExp('CDD|Intérim|Journalier|Apprentissage').hasMatch(_t(s, 'contrat')),
          options: const ['Moins d’un mois', '1 à 3 mois', '3 à 6 mois', '6 mois à 1 an', '1 à 2 ans', 'Renouvelable']),
      const Champ('experience', 'Expérience demandée', req: true, options: _experience),
      const Champ('niveau', 'Niveau d’études', req: true, options: _niveau),
      Champ('nbPostes', 'Nombre de postes',
          req: true,
          options: const ['1 poste', '2 à 5 postes', '6 à 10 postes', 'Plus de 10 postes'],
          h: (s) => RegExp('Plus de 10').hasMatch(_t(s, 'nbPostes'))
              ? '!Un recrutement massif sans postes précis est le premier signal des fausses campagnes. Détaillez chaque profil dans la description : c’est ce qui vous rendra crédible.'
              : ''),
      const Champ('salaireType', 'Le salaire indiqué est',
          req: true,
          options: ['Un montant fixe', 'Un minimum (évolutif)', 'À négocier selon le profil', 'Fixe plus commissions', 'Commissions uniquement'],
          h: 'Annoncer un salaire, même approximatif, multiplie les candidatures sérieuses. « À négocier » seul fait fuir.'),
      const Champ('lieuTravail', 'Lieu de travail',
          req: true, options: ['Sur site', 'Télétravail complet', 'Hybride', 'Terrain / déplacements', 'Plusieurs sites']),
      const Champ('horaires', 'Horaires',
          options: ['Temps plein, journée', 'Temps plein, en équipes (3×8)', 'Nuit', 'Week-end', 'Temps partiel', 'Horaires variables']),
      const Champ('avantages', 'Avantages proposés',
          multi: true,
          options: ['Transport', 'Restauration / panier', 'Logement', 'Déclaration CNPS', 'Assurance maladie', 'Prime de rendement', 'Treizième mois', 'Formation', 'Téléphone / forfait', 'Véhicule de service'],
          h: 'La déclaration CNPS et la prise en charge du transport sont les deux avantages les plus regardés ici.'),
      const Champ('documentsDemandes', 'Documents à fournir',
          multi: true,
          options: ['CV', 'Lettre de motivation', 'Copie des diplômes', 'Copie de la CNI', 'Extrait de casier judiciaire', 'Certificat de travail', 'Photo d’identité'],
          h: 'Demandez le strict nécessaire au premier contact. Réclamer une copie de CNI avant même un entretien inquiète les bons candidats — et c’est une pratique d’escrocs.'),
      const Champ('dateLimite', 'Date limite de candidature',
          options: ['Dans la semaine', 'Dans les 15 jours', 'Dans le mois', 'Jusqu’à pourvoir le poste']),
    ],
  ),
  'Demandes d’emploi': Schema(
    etat: false,
    livraison: false,
    prixLabel: 'Prétention salariale mensuelle',
    titre: (s) => [_t(s, 'posteCherche'), _t(s, 'experienceD'), _t(s, 'dispo')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      Champ('secteurD', 'Secteur recherché', req: true, options: _postes.keys.toList()),
      const Champ('posteCherche', 'Poste recherché', req: true, dependDe: 'secteurD', table: _postes, libre: 'Autre poste'),
      const Champ('experienceD', 'Votre expérience', req: true, options: _experience),
      const Champ('niveauD', 'Votre niveau d’études', req: true, options: _niveau),
      const Champ('dossier', 'Votre dossier',
          req: true,
          options: ['CV à jour, prêt à envoyer', 'CV à mettre à jour', 'Aucun document pour l’instant'],
          alerte: Alerte(
            bon: 'CV à jour, prêt à envoyer',
            texteBon: 'Cette personne a un dossier prêt. Demandez-le par la messagerie Chap.ci — jamais de document officiel avant un vrai entretien.',
            texteMauvais: 'Pas encore de dossier constitué. Ce n’est pas rédhibitoire pour un premier emploi : jugez sur l’entretien.',
          ),
          h: 'Un CV à jour double les réponses reçues. Ne joignez jamais votre CNI à une annonce publique.'),
      const Champ('documents', 'Ce que vous pouvez fournir',
          multi: true,
          options: ['CV', 'Copies de diplômes', 'Certificats de travail', 'Lettres de recommandation', 'Portfolio / réalisations', 'Permis de conduire']),
      const Champ('contratD', 'Type de contrat souhaité',
          multi: true, req: true,
          options: ['CDI', 'CDD', 'Stage', 'Intérim', 'Journalier', 'Temps partiel', 'Freelance', 'Apprentissage']),
      const Champ('dispo', 'Disponibilité', req: true, options: ['Immédiate', 'Sous 15 jours', 'Sous un mois', 'Sous trois mois', 'À convenir']),
      const Champ('mobilite', 'Zones où vous pouvez travailler',
          multi: true, req: true,
          options: ['Ma commune uniquement', 'Tout Abidjan', 'Abidjan et environs', 'Toute la Côte d’Ivoire', 'Je peux déménager', 'Télétravail uniquement']),
      const Champ('permis', 'Permis de conduire',
          multi: true,
          options: ['Aucun', 'Permis A (moto)', 'Permis B (voiture)', 'Permis C (poids lourd)', 'Permis D (transport de personnes)', 'Permis E (remorque)']),
      const Champ('langues', 'Langues parlées',
          multi: true,
          options: ['Français', 'Anglais', 'Dioula', 'Baoulé', 'Bété', 'Sénoufo', 'Malinké', 'Espagnol', 'Arabe']),
      const Champ('competences', 'Compétences', ph: 'Ex : Excel, caisse, soudure à l’arc, couture',
          h: 'Trois ou quatre compétences concrètes valent mieux qu’un paragraphe de qualités.'),
      const Champ('salaireTypeD', 'Votre prétention est',
          req: true, options: ['Un montant ferme', 'Un minimum', 'Négociable', 'À discuter selon le poste']),
    ],
  ),
  'Stages': Schema(
    etat: false,
    livraison: false,
    prixLabel: 'Gratification mensuelle',
    titre: (s) => [_t(s, 'posteStage'), _t(s, 'dureeStage'), _t(s, 'entrepriseS')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      Champ('secteurS', 'Secteur', req: true, options: _postes.keys.toList()),
      const Champ('posteStage', 'Poste du stage', req: true, dependDe: 'secteurS', table: _postes, libre: 'Autre poste'),
      const Champ('entrepriseS', 'Nom de l’entreprise', req: true, ph: 'Ex : Cabinet Diallo, Clinique Sainte-Marie'),
      _fraisCandidat('un stage'),
      _contactCandidature,
      const Champ('typeStage', 'Type de stage',
          req: true, options: ['Stage école (avec convention)', 'Stage de perfectionnement', 'Stage pré-embauche', 'Alternance', 'Stage d’observation']),
      Champ('gratifie', 'Gratification',
          req: true,
          options: const ['Stage gratifié — indemnité mensuelle versée', 'Gratification symbolique (transport, repas)', 'Stage non gratifié', 'À négocier'],
          h: (s) {
            final g = _t(s, 'gratifie');
            if (g == 'Stage non gratifié') return '!Un stage non gratifié se remplit difficilement, surtout à Abidjan où le transport coûte cher. Prendre en charge le transport et le repas change tout, pour très peu.';
            if (RegExp('gratifié — indemnité').hasMatch(g)) return 'Un stage gratifié attire des candidats sérieux et les garde. Indiquez le montant : c’est le premier filtre du stagiaire.';
            return '';
          }),
      const Champ('convention', 'Convention de stage',
          req: true,
          options: ['Convention école exigée', 'Convention souhaitée mais pas obligatoire', 'Aucune convention nécessaire', 'Nous fournissons la convention'],
          h: 'Sans convention, un stage n’a aucune valeur pour l’école du stagiaire — dites-le clairement.'),
      const Champ('dureeStage', 'Durée', req: true, options: ['1 mois', '2 mois', '3 mois', '4 à 6 mois', '6 mois à 1 an', 'Plus d’un an']),
      const Champ('niveauS', 'Niveau recherché', req: true, options: _niveau),
      const Champ('nbStages', 'Nombre de places', options: ['1 place', '2 à 5 places', '6 à 10 places', 'Plus de 10 places']),
      const Champ('encadrement', 'Encadrement',
          multi: true,
          options: ['Tuteur désigné', 'Attestation de stage remise', 'Formation interne', 'Possibilité d’embauche à la fin', 'Rapport de stage encadré'],
          h: 'La « possibilité d’embauche » et l’attestation sont les deux choses que regarde un stagiaire. Ne les promettez que si c’est vrai.'),
      const Champ('lieuStage', 'Lieu', req: true, options: ['Sur site', 'Télétravail', 'Hybride', 'Terrain']),
    ],
  ),
  'Freelance': Schema(
    etat: false,
    livraison: false,
    prixLabel: 'Tarif',
    titre: (s) => [_t(s, 'prestation'), _t(s, 'uniteTarif')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('sensFree', 'Vous êtes',
          req: true, options: ['Un prestataire — je propose mes services', 'Un client — je cherche un prestataire']),
      Champ('secteurF', 'Domaine', req: true, options: _postes.keys.toList()),
      const Champ('prestation', 'Prestation', req: true, dependDe: 'secteurF', table: _postes, libre: 'Autre poste'),
      const Champ('uniteTarif', 'Le tarif est',
          req: true,
          options: ['À l’heure', 'À la journée', 'Au projet', 'Au mois', 'Sur devis'],
          h: 'Un tarif affiché, même indicatif, fait gagner trois échanges de messages.'),
      Champ('paiement', 'Modalités de paiement',
          req: true,
          options: const ['Paiement à la livraison', 'Acompte 30 %, solde à la livraison', 'Acompte 50 %, solde à la livraison', 'Paiement intégral d’avance', 'Paiement échelonné par étapes'],
          alerte: const Alerte(
            bon: 'Acompte 50 %, solde à la livraison',
            ok: ['Paiement à la livraison', 'Acompte 30 %, solde à la livraison', 'Paiement échelonné par étapes'],
            texteBon: 'Moitié à la commande, moitié à la livraison : c’est l’équilibre habituel. Chacun prend la même part de risque.',
            texteMauvais: 'Le paiement intégral d’avance vous fait porter tout le risque. Proposez plutôt un acompte et un solde à la livraison — un prestataire sérieux l’accepte.',
            textes: {
              'Paiement à la livraison': 'Paiement à la livraison : c’est vous qui êtes protégé. Convenez précisément de ce qui est « livré » avant de commencer.',
              'Paiement échelonné par étapes': 'Paiement par étapes : la meilleure formule sur un projet long. Écrivez les étapes et ce qui est dû à chacune.'
            },
          ),
          h: (s) => _t(s, 'paiement') == 'Paiement intégral d’avance'
              ? '!Exiger la totalité d’avance fait fuir les clients prudents, et c’est le schéma de l’arnaque à l’acompte. Un acompte de 50 % rassure bien davantage.'
              : 'Mettez toujours par écrit ce qui est livré, quand, et pour combien. C’est ce qui distingue un professionnel.'),
      const Champ('delaiFree', 'Délai habituel',
          req: true, options: ['Moins de 24 h', '2 à 3 jours', 'Une semaine', '2 à 4 semaines', 'Plus d’un mois', 'Selon le projet']),
      Champ('refs', 'Références',
          req: true,
          when: (s) => RegExp('prestataire').hasMatch(_t(s, 'sensFree')),
          options: const ['Portfolio en ligne', 'Réalisations sur demande', 'Clients référencés', 'Débutant, pas encore de références'],
          h: 'Sur du freelance, trois réalisations montrées valent mieux que dix lignes de promesses.'),
      const Champ('experienceF', 'Expérience', req: true, options: _experience),
      const Champ('modaliteF', 'Vous travaillez',
          req: true, multi: true, options: ['À distance', 'Chez le client', 'Dans mon atelier / bureau', 'Sur chantier']),
      const Champ('factureF', 'Facturation',
          req: true,
          options: ['Facture avec numéro de contribuable', 'Reçu simple', 'Aucune facture'],
          h: 'Une facture en règle ouvre les marchés des entreprises et des ONG, qui ne peuvent pas payer sans.'),
      const Champ('dispoF', 'Disponibilité', req: true, options: ['Immédiate', 'Sous une semaine', 'Sous un mois', 'Sur planning']),
    ],
  ),
  'Emploi maison': Schema(
    etat: false,
    livraison: false,
    prixLabel: 'Salaire mensuel',
    titre: (s) => [_t(s, 'posteMaison'), _t(s, 'tempsMaison'), _t(s, 'logement')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('sensMaison', 'Vous', req: true, options: ['Proposez un emploi', 'Cherchez un emploi']),
      const Champ('posteMaison', 'Poste',
          req: true,
          options: ['Ménagère / aide-ménagère', 'Nounou / garde d’enfants', 'Cuisinier(ère)', 'Gardien / vigile', 'Chauffeur', 'Jardinier', 'Garde-malade / aide à domicile', 'Repassage', 'Lessive', 'Aide aux devoirs', 'Homme / femme à tout faire']),
      Champ('age', 'Âge',
          req: true,
          options: const ['18 à 25 ans', '25 à 35 ans', '35 à 50 ans', 'Plus de 50 ans', 'Peu importe, à partir de 18 ans', 'Moins de 18 ans'],
          alerte: const Alerte(
            bon: 'Peu importe, à partir de 18 ans',
            ok: ['18 à 25 ans', '25 à 35 ans', '35 à 50 ans', 'Plus de 50 ans'],
            texteBon: 'Aucune condition d’âge au-delà de la majorité. C’est la règle sur Chap.ci.',
            texteMauvais: 'INTERDIT. Le travail domestique d’un mineur ne peut pas être proposé ni recherché sur Chap.ci.',
          ),
          bloque: const ['Moins de 18 ans'],
          motifBloc: 'Le travail domestique d’une personne mineure est interdit. Cette annonce ne peut pas être publiée.',
          h: (s) => _t(s, 'age') == 'Moins de 18 ans'
              ? '!Employer un mineur au travail domestique est interdit par la loi ivoirienne et poursuivi. Cette annonce ne sera pas publiée.'
              : 'Éviter de restreindre inutilement l’âge élargit beaucoup le nombre de candidates.'),
      Champ('contratMaison', 'Cadre de l’emploi',
          req: true,
          options: const ['Contrat écrit et déclaration CNPS', 'Contrat écrit sans déclaration', 'Accord verbal uniquement', 'À définir ensemble'],
          h: (s) {
            final c = _t(s, 'contratMaison');
            if (RegExp('verbal').hasMatch(c)) return '!Sans écrit, ni l’employeur ni l’employée n’est protégé le jour d’un désaccord sur le salaire ou les horaires. Une simple feuille signée par les deux suffit.';
            if (RegExp('CNPS').hasMatch(c)) return 'La déclaration CNPS vous distingue immédiatement : très peu d’employeurs domestiques le font, et les meilleures candidates le cherchent.';
            return 'Un écrit, même bref — horaires, tâches, salaire, jour de repos — évite l’essentiel des litiges.';
          }),
      const Champ('tempsMaison', 'Temps de travail',
          req: true, options: ['Temps plein, en journée', 'Temps plein, à demeure', 'Mi-temps', 'Quelques jours par semaine', 'À la tâche', 'Week-end uniquement']),
      const Champ('joursMaison', 'Jours travaillés',
          multi: true, options: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']),
      Champ('reposMaison', 'Jour de repos',
          req: true,
          options: const ['Un jour par semaine', 'Deux jours par semaine', 'Dimanche', 'À convenir', 'Aucun jour fixe'],
          h: (s) => _t(s, 'reposMaison') == 'Aucun jour fixe'
              ? '!Un emploi sans jour de repos annoncé fait fuir les candidates expérimentées, et se retourne contre l’employeur au premier conflit.'
              : 'Le jour de repos est la deuxième question posée, juste après le salaire.'),
      const Champ('logement', 'Logement et repas',
          req: true,
          options: ['Logée et nourrie', 'Nourrie, non logée', 'Ni logée ni nourrie', 'Transport pris en charge', 'Nourrie et transport pris en charge'],
          h: '« Logée et nourrie » change complètement le salaire attendu : dites-le d’emblée pour éviter des négociations inutiles.'),
      const Champ('tachesMaison', 'Tâches',
          multi: true, req: true,
          options: ['Ménage', 'Cuisine', 'Vaisselle', 'Lessive', 'Repassage', 'Garde d’enfants', 'Aide aux devoirs', 'Courses', 'Jardinage', 'Gardiennage', 'Soins à une personne âgée'],
          h: 'Lister les tâches évite le malentendu le plus courant de ce métier : « on m’avait dit ménage, on me demande aussi les enfants ».'),
      Champ('enfantsMaison', 'Nombre d’enfants à garder',
          when: (s) => RegExp('Nounou|garde d’enfants', caseSensitive: false).hasMatch(_t(s, 'posteMaison')) || _contient(s, 'tachesMaison', 'Garde d’enfants'),
          options: const ['1 enfant', '2 enfants', '3 enfants', '4 enfants et plus']),
      const Champ('experienceM', 'Expérience', req: true, options: _experience),
      const Champ('referencesM', 'Références',
          req: true,
          options: ['Références vérifiables fournies', 'Références sur demande', 'Aucune référence'],
          h: 'Des références vérifiables sont ce qui rassure le plus des deux côtés. Demandez-les, et donnez les vôtres.'),
    ],
  ),
};
