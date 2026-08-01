/* ==========================================================================
 *  EMPLOI — un schéma par sous-catégorie.
 *
 *  C'est la catégorie où l'arnaque est la mieux organisée de Côte d'Ivoire, et
 *  la seule où la victime est le VENDEUR de son travail, pas l'acheteur.
 *
 *  1. « LES FRAIS DE DOSSIER ». Le schéma est toujours le même : on copie le
 *     logo d'une institution connue, on annonce un recrutement massif sans
 *     préciser les postes, on fait envoyer les dossiers à une adresse Gmail —
 *     puis on réclame des « frais de dossier », de « formation » ou
 *     d'« équipement ». La CIE, le Port autonome d'Abidjan, l'aéroport
 *     Félix-Houphouët-Boigny et le ministère des Eaux et Forêts ont tous dû
 *     démentir publiquement de faux recrutements à leur nom.
 *
 *     Un employeur ne demande JAMAIS d'argent à un candidat. Cette question
 *     est donc posée en clair, et une réponse positive refuse l'annonce.
 *
 *  2. L'ADRESSE DE CONTACT. Une candidature qu'on envoie à un Gmail ou un
 *     Yahoo plutôt qu'au domaine de l'entreprise est le deuxième signal des
 *     services qui alertent. Le formulaire le dit au recruteur honnête, qui
 *     y gagne en crédibilité.
 *
 *  3. LE TRAVAIL DOMESTIQUE. Ménagère, nounou, gardien, chauffeur : c'est un
 *     vrai marché, et le plus exposé. Deux garde-fous — l'âge (le travail
 *     domestique d'un mineur est interdit et l'annonce est refusée) et la
 *     déclaration CNPS, qui distingue un employeur sérieux d'un autre.
 *
 *  Sources (juillet 2026) : AIP, KOACI, L'Infodrome, PesaCheck, RMO Côte
 *  d'Ivoire, communiqués CIE / Port autonome d'Abidjan / Eaux et Forêts.
 * ========================================================================== */

var SOUS = ['Offres d’emploi', 'Demandes d’emploi', 'Stages', 'Freelance', 'Emploi maison']

/* Aucune couleur nulle part : un emploi n'en a pas. Le moteur en réclame une
   liste, on lui en donne une vide plutôt qu'une palette qui ne servirait pas. */
var PALETTE_BASE = []
var TOUTES_COULEURS = []

/* -------------------------------------------------------------------------
 *  Blocs partagés
 * ------------------------------------------------------------------------- */

/* LA question de cette catégorie. Elle refuse l'annonce, et elle explique. */
function fraisCandidat(quoi) {
  return { k:'frais', l:'Frais demandés au candidat', req:true,
    o:['Aucun frais — le recrutement est entièrement gratuit',
       'Des frais de dossier sont demandés',
       'Des frais de formation sont demandés',
       'Le candidat doit acheter son équipement ou sa tenue'],
    alerte:{ bon:'Aucun frais — le recrutement est entièrement gratuit',
      texteBon:'Le recrutement est annoncé gratuit. C’est la règle : ne versez jamais un franc pour obtenir ' + quoi + '. Si on vous réclame de l’argent en cours de route, signalez l’annonce.',
      texteMauvais:'ARNAQUE. Un employeur ne demande jamais d’argent à un candidat. Ne versez rien, et signalez cette annonce.' },
    bloque:['Des frais de dossier sont demandés','Des frais de formation sont demandés','Le candidat doit acheter son équipement ou sa tenue'],
    motifBloc:'Un employeur ne demande jamais d’argent à un candidat. Une annonce qui réclame des frais ne peut pas être publiée.',
    h:function (S) {
      if (S.frais && S.frais !== 'Aucun frais — le recrutement est entièrement gratuit')
        return '!Réclamer des frais à un candidat est le schéma exact des faux recrutements démentis par la CIE, le Port autonome d’Abidjan et l’aéroport FHB. Cette annonce ne peut pas être publiée sur Chap.ci.'
      return 'La question est posée à tout le monde, et c’est volontaire : y répondre « gratuit » est ce qui distingue une vraie offre des dizaines de fausses qui circulent chaque semaine.'
    } }
}

/* Le deuxième signal des services qui alertent : l'adresse de candidature. */
function contactCandidature() {
  return { k:'contactPro', l:'Comment postuler', req:true,
    o:['Messagerie Chap.ci','E-mail au domaine de l’entreprise','Site carrière de l’entreprise','Adresse Gmail / Yahoo / Hotmail','Se présenter sur place','WhatsApp'],
    h:function (S) {
      if (/Gmail/.test(S.contactPro || ''))
        return '!Une candidature à envoyer sur une boîte Gmail ou Yahoo plutôt qu’au domaine de l’entreprise est le deuxième signal d’alerte cité par les services qui démentent les faux recrutements. Si vous avez une adresse professionnelle, utilisez-la : vous serez pris au sérieux.'
      if (/domaine de l’entreprise|Site carrière/.test(S.contactPro || ''))
        return 'Une adresse au nom de l’entreprise inspire immédiatement confiance. C’est ce qui vous distingue des fausses annonces.'
      return 'La messagerie Chap.ci protège votre numéro et garde une trace des échanges — utile si un litige survient.'
    } }
}

var EXPERIENCE = ['Débutant accepté','Moins d’un an','1 à 2 ans','3 à 5 ans','5 à 10 ans','Plus de 10 ans']
var NIVEAU = ['Sans diplôme exigé','CEPE','BEPC','BAC','BAC+2 (BTS, DUT)','BAC+3 (Licence)','BAC+5 (Master, ingénieur)','Doctorat','Formation professionnelle / CQP']

/* Les secteurs qui recrutent réellement en Côte d'Ivoire, et leurs postes. */
var POSTES = {
  'Commerce & Vente': ['Vendeur / vendeuse','Caissier(ère)','Commercial terrain','Téléconseiller','Chef de rayon','Responsable boutique','Merchandiseur','Agent de recouvrement'],
  'Restauration & Hôtellerie': ['Serveur(se)','Cuisinier(ère)','Aide-cuisine','Plongeur','Barman','Réceptionniste','Femme / valet de chambre','Gérant de maquis','Pâtissier'],
  'BTP & Construction': ['Maçon','Carreleur','Peintre en bâtiment','Menuisier','Ferrailleur','Plombier','Électricien bâtiment','Chef de chantier','Conducteur d’engin','Manœuvre'],
  'Transport & Logistique': ['Chauffeur poids lourd','Chauffeur véhicule léger','Chauffeur de taxi','Livreur','Coursier moto','Magasinier','Agent de transit','Manutentionnaire','Gestionnaire de stock'],
  'Santé': ['Infirmier(ère)','Sage-femme','Aide-soignant(e)','Pharmacien','Préparateur en pharmacie','Laborantin','Médecin','Kinésithérapeute'],
  'Éducation & Formation': ['Enseignant primaire','Enseignant secondaire','Répétiteur / cours à domicile','Formateur professionnel','Éducateur préscolaire','Surveillant'],
  'Informatique & Digital': ['Développeur','Technicien informatique','Community manager','Graphiste','Administrateur réseau','Data analyst','Support technique','Webmaster'],
  'Comptabilité & Finance': ['Comptable','Aide-comptable','Contrôleur de gestion','Auditeur','Caissier de banque','Chargé de clientèle','Agent de microfinance'],
  'Administration & Secrétariat': ['Secrétaire','Assistant(e) de direction','Agent administratif','Standardiste','Archiviste','Assistant RH'],
  'Sécurité': ['Agent de sécurité','Vigile','Maître-chien','Superviseur sécurité','Agent de sûreté'],
  'Industrie & Production': ['Opérateur de production','Technicien de maintenance','Soudeur','Mécanicien industriel','Contrôleur qualité','Chef d’équipe'],
  'Agriculture & Agroalimentaire': ['Ouvrier agricole','Technicien agricole','Chef de plantation','Pisciculteur','Agent de conditionnement','Éleveur'],
  'Communication & Marketing': ['Chargé de communication','Attaché de presse','Infographiste','Chargé de marketing','Animateur commercial'],
  'Nettoyage & Entretien': ['Agent d’entretien','Technicien de surface','Laveur de vitres','Agent de nettoyage industriel'],
  'Beauté & Bien-être': ['Coiffeur(se)','Esthéticienne','Masseur','Prothésiste ongulaire','Barbier'],
  'Autre secteur': ['Autre poste']
}

var SCHEMAS = {

  /* ================================================================== */
  'Offres d’emploi': {
    couleurs: false, etat: false, livraison: false,
    prixLabel: 'Salaire mensuel proposé',
    sansCouleur: 'Une offre d’emploi n’a pas de couleur. Ajoutez le logo de l’entreprise et, si vous le pouvez, une photo des locaux : cela rassure plus que tout le reste.',
    titre: function (S) {
      return [S.poste === 'Autre poste' ? S.posteLibre : S.poste, S.contrat, S.entreprise].filter(Boolean).join(' · ')
    },
    champs: [
      { k:'secteur', l:'Secteur', req:true, o:Object.keys(POSTES) },
      { k:'poste', l:'Poste à pourvoir', req:true, dependDe:'secteur', table:POSTES, libre:'Autre poste',
        h:'Le poste exact fait trouver votre annonce : c’est lui que les candidats tapent dans la recherche.' },
      { k:'entreprise', l:'Nom de l’entreprise', t:'text', req:true, ph:'Ex : Boulangerie Le Croissant, SARL Kouassi & Fils',
        h:'Une annonce sans nom d’entreprise n’est presque jamais lue jusqu’au bout. Si vous recrutez pour un tiers, dites-le.' },

      // Le champ qui décide de la publication.
      fraisCandidat('un emploi'),
      contactCandidature(),

      { k:'contrat', l:'Type de contrat', req:true,
        o:['CDI','CDD','Stage','Intérim','Journalier','Temps partiel','Prestation / freelance','Apprentissage'] },
      { k:'dureeCdd', l:'Durée du contrat',
        when:function (S) { return /CDD|Intérim|Journalier|Apprentissage/.test(S.contrat || '') },
        o:['Moins d’un mois','1 à 3 mois','3 à 6 mois','6 mois à 1 an','1 à 2 ans','Renouvelable'] },
      { k:'experience', l:'Expérience demandée', req:true, o:EXPERIENCE },
      { k:'niveau', l:'Niveau d’études', req:true, o:NIVEAU },
      { k:'nbPostes', l:'Nombre de postes', req:true,
        o:['1 poste','2 à 5 postes','6 à 10 postes','Plus de 10 postes'],
        h:function (S) {
          if (/Plus de 10/.test(S.nbPostes || ''))
            return '!Un recrutement massif sans postes précis est le premier signal des fausses campagnes. Détaillez chaque profil dans la description : c’est ce qui vous rendra crédible.'
          return ''
        } },
      { k:'salaireType', l:'Le salaire indiqué est', req:true,
        o:['Un montant fixe','Un minimum (évolutif)','À négocier selon le profil','Fixe plus commissions','Commissions uniquement'],
        h:'Annoncer un salaire, même approximatif, multiplie les candidatures sérieuses. « À négocier » seul fait fuir.' },
      { k:'lieuTravail', l:'Lieu de travail', req:true,
        o:['Sur site','Télétravail complet','Hybride','Terrain / déplacements','Plusieurs sites'] },
      { k:'horaires', l:'Horaires',
        o:['Temps plein, journée','Temps plein, en équipes (3×8)','Nuit','Week-end','Temps partiel','Horaires variables'] },
      { k:'avantages', l:'Avantages proposés', multi:true,
        o:['Transport','Restauration / panier','Logement','Déclaration CNPS','Assurance maladie','Prime de rendement','Treizième mois','Formation','Téléphone / forfait','Véhicule de service'],
        h:'La déclaration CNPS et la prise en charge du transport sont les deux avantages les plus regardés ici.' },
      { k:'documentsDemandes', l:'Documents à fournir', multi:true,
        o:['CV','Lettre de motivation','Copie des diplômes','Copie de la CNI','Extrait de casier judiciaire','Certificat de travail','Photo d’identité'],
        h:'Demandez le strict nécessaire au premier contact. Réclamer une copie de CNI avant même un entretien inquiète les bons candidats — et c’est une pratique d’escrocs.' },
      { k:'dateLimite', l:'Date limite de candidature',
        o:['Dans la semaine','Dans les 15 jours','Dans le mois','Jusqu’à pourvoir le poste'] }
    ]
  },

  /* ================================================================== */
  'Demandes d’emploi': {
    couleurs: false, etat: false, livraison: false,
    prixLabel: 'Prétention salariale mensuelle',
    sansCouleur: 'Ajoutez une photo d’identité sobre si vous le souhaitez — jamais votre CNI, jamais un document officiel.',
    titre: function (S) {
      return [S.posteCherche === 'Autre poste' ? S.posteCherheLibre : S.posteCherche, S.experienceD, S.dispo].filter(Boolean).join(' · ')
    },
    champs: [
      { k:'secteurD', l:'Secteur recherché', req:true, o:Object.keys(POSTES) },
      { k:'posteCherche', l:'Poste recherché', req:true, dependDe:'secteurD', table:POSTES, libre:'Autre poste' },
      { k:'experienceD', l:'Votre expérience', req:true, o:EXPERIENCE },
      { k:'niveauD', l:'Votre niveau d’études', req:true, o:NIVEAU },

      { k:'dossier', l:'Votre dossier', req:true,
        o:['CV à jour, prêt à envoyer','CV à mettre à jour','Aucun document pour l’instant'],
        alerte:{ bon:'CV à jour, prêt à envoyer',
          texteBon:'Cette personne a un dossier prêt. Demandez-le par la messagerie Chap.ci — jamais de document officiel avant un vrai entretien.',
          texteMauvais:'Pas encore de dossier constitué. Ce n’est pas rédhibitoire pour un premier emploi : jugez sur l’entretien.' },
        h:'Un CV à jour double les réponses reçues. Ne joignez jamais votre CNI à une annonce publique.' },
      { k:'documents', l:'Ce que vous pouvez fournir', multi:true,
        o:['CV','Copies de diplômes','Certificats de travail','Lettres de recommandation','Portfolio / réalisations','Permis de conduire'] },
      { k:'contratD', l:'Type de contrat souhaité', multi:true, req:true,
        o:['CDI','CDD','Stage','Intérim','Journalier','Temps partiel','Freelance','Apprentissage'] },
      { k:'dispo', l:'Disponibilité', req:true,
        o:['Immédiate','Sous 15 jours','Sous un mois','Sous trois mois','À convenir'] },
      { k:'mobilite', l:'Zones où vous pouvez travailler', multi:true, req:true,
        o:['Ma commune uniquement','Tout Abidjan','Abidjan et environs','Toute la Côte d’Ivoire','Je peux déménager','Télétravail uniquement'] },
      { k:'permis', l:'Permis de conduire', multi:true,
        o:['Aucun','Permis A (moto)','Permis B (voiture)','Permis C (poids lourd)','Permis D (transport de personnes)','Permis E (remorque)'] },
      { k:'langues', l:'Langues parlées', multi:true,
        o:['Français','Anglais','Dioula','Baoulé','Bété','Sénoufo','Malinké','Espagnol','Arabe'] },
      { k:'compétences', l:'Compétences', t:'text', ph:'Ex : Excel, caisse, soudure à l’arc, couture',
        h:'Trois ou quatre compétences concrètes valent mieux qu’un paragraphe de qualités.' },
      { k:'salaireTypeD', l:'Votre prétention est', req:true,
        o:['Un montant ferme','Un minimum','Négociable','À discuter selon le poste'] }
    ]
  },

  /* ================================================================== */
  'Stages': {
    couleurs: false, etat: false, livraison: false,
    prixLabel: 'Gratification mensuelle',
    sansCouleur: 'Ajoutez le logo de l’entreprise et, si possible, une photo des locaux.',
    titre: function (S) { return [S.posteStage === 'Autre poste' ? S.posteStageLibre : S.posteStage, S.dureeStage, S.entrepriseS].filter(Boolean).join(' · ') },
    champs: [
      { k:'secteurS', l:'Secteur', req:true, o:Object.keys(POSTES) },
      { k:'posteStage', l:'Poste du stage', req:true, dependDe:'secteurS', table:POSTES, libre:'Autre poste' },
      { k:'entrepriseS', l:'Nom de l’entreprise', t:'text', req:true, ph:'Ex : Cabinet Diallo, Clinique Sainte-Marie' },

      fraisCandidat('un stage'),
      contactCandidature(),

      { k:'typeStage', l:'Type de stage', req:true,
        o:['Stage école (avec convention)','Stage de perfectionnement','Stage pré-embauche','Alternance','Stage d’observation'] },
      { k:'gratifie', l:'Gratification', req:true,
        o:['Stage gratifié — indemnité mensuelle versée','Gratification symbolique (transport, repas)','Stage non gratifié','À négocier'],
        h:function (S) {
          if (S.gratifie === 'Stage non gratifié')
            return '!Un stage non gratifié se remplit difficilement, surtout à Abidjan où le transport coûte cher. Prendre en charge le transport et le repas change tout, pour très peu.'
          if (/gratifié — indemnité/.test(S.gratifie || ''))
            return 'Un stage gratifié attire des candidats sérieux et les garde. Indiquez le montant : c’est le premier filtre du stagiaire.'
          return ''
        } },
      { k:'convention', l:'Convention de stage', req:true,
        o:['Convention école exigée','Convention souhaitée mais pas obligatoire','Aucune convention nécessaire','Nous fournissons la convention'],
        h:'Sans convention, un stage n’a aucune valeur pour l’école du stagiaire — dites-le clairement.' },
      { k:'dureeStage', l:'Durée', req:true,
        o:['1 mois','2 mois','3 mois','4 à 6 mois','6 mois à 1 an','Plus d’un an'] },
      { k:'niveauS', l:'Niveau recherché', req:true, o:NIVEAU },
      { k:'nbStages', l:'Nombre de places', o:['1 place','2 à 5 places','6 à 10 places','Plus de 10 places'] },
      { k:'encadrement', l:'Encadrement', multi:true,
        o:['Tuteur désigné','Attestation de stage remise','Formation interne','Possibilité d’embauche à la fin','Rapport de stage encadré'],
        h:'La « possibilité d’embauche » et l’attestation sont les deux choses que regarde un stagiaire. Ne les promettez que si c’est vrai.' },
      { k:'lieuStage', l:'Lieu', req:true, o:['Sur site','Télétravail','Hybride','Terrain'] }
    ]
  },

  /* ================================================================== */
  'Freelance': {
    couleurs: false, etat: false, livraison: false,
    prixLabel: 'Tarif',
    sansCouleur: 'Montrez vos réalisations : sur du freelance, le portfolio vend mieux que n’importe quel texte.',
    titre: function (S) { return [S.prestation === 'Autre poste' ? S.prestationLibre : S.prestation, S.uniteTarif].filter(Boolean).join(' · ') },
    champs: [
      { k:'sensFree', l:'Vous êtes', req:true,
        o:['Un prestataire — je propose mes services','Un client — je cherche un prestataire'] },
      { k:'secteurF', l:'Domaine', req:true, o:Object.keys(POSTES) },
      { k:'prestation', l:'Prestation', req:true, dependDe:'secteurF', table:POSTES, libre:'Autre poste' },
      { k:'uniteTarif', l:'Le tarif est', req:true,
        o:['À l’heure','À la journée','Au projet','Au mois','Sur devis'],
        h:'Un tarif affiché, même indicatif, fait gagner trois échanges de messages.' },

      // Le pendant du meuble sur commande : l'acompte est le point de friction.
      { k:'paiement', l:'Modalités de paiement', req:true,
        o:['Paiement à la livraison','Acompte 30 %, solde à la livraison','Acompte 50 %, solde à la livraison','Paiement intégral d’avance','Paiement échelonné par étapes'],
        alerte:{ bon:'Acompte 50 %, solde à la livraison',
          ok:['Paiement à la livraison','Acompte 30 %, solde à la livraison','Paiement échelonné par étapes'],
          texteBon:'Moitié à la commande, moitié à la livraison : c’est l’équilibre habituel. Chacun prend la même part de risque.',
          texteMauvais:'Le paiement intégral d’avance vous fait porter tout le risque. Proposez plutôt un acompte et un solde à la livraison — un prestataire sérieux l’accepte.',
          textes:{
            'Paiement à la livraison':'Paiement à la livraison : c’est vous qui êtes protégé. Convenez précisément de ce qui est « livré » avant de commencer.',
            'Paiement échelonné par étapes':'Paiement par étapes : la meilleure formule sur un projet long. Écrivez les étapes et ce qui est dû à chacune.'
          } },
        h:function (S) {
          if (S.paiement === 'Paiement intégral d’avance')
            return '!Exiger la totalité d’avance fait fuir les clients prudents, et c’est le schéma de l’arnaque à l’acompte. Un acompte de 50 % rassure bien davantage.'
          return 'Mettez toujours par écrit ce qui est livré, quand, et pour combien. C’est ce qui distingue un professionnel.'
        } },
      { k:'delaiFree', l:'Délai habituel', req:true,
        o:['Moins de 24 h','2 à 3 jours','Une semaine','2 à 4 semaines','Plus d’un mois','Selon le projet'] },
      { k:'refs', l:'Références', req:true,
        when:function (S) { return /prestataire/.test(S.sensFree || '') },
        o:['Portfolio en ligne','Réalisations sur demande','Clients référencés','Débutant, pas encore de références'],
        h:'Sur du freelance, trois réalisations montrées valent mieux que dix lignes de promesses.' },
      { k:'experienceF', l:'Expérience', req:true, o:EXPERIENCE },
      { k:'modaliteF', l:'Vous travaillez', req:true, multi:true,
        o:['À distance','Chez le client','Dans mon atelier / bureau','Sur chantier'] },
      { k:'factureF', l:'Facturation', req:true,
        o:['Facture avec numéro de contribuable','Reçu simple','Aucune facture'],
        h:'Une facture en règle ouvre les marchés des entreprises et des ONG, qui ne peuvent pas payer sans.' },
      { k:'dispoF', l:'Disponibilité', req:true,
        o:['Immédiate','Sous une semaine','Sous un mois','Sur planning'] }
    ]
  },

  /* ================================================================== */
  'Emploi maison': {
    couleurs: false, etat: false, livraison: false,
    prixLabel: 'Salaire mensuel',
    sansCouleur: 'Une photo du lieu de travail rassure une candidate. Ne publiez jamais de document d’identité.',
    titre: function (S) { return [S.posteMaison, S.tempsMaison, S.logement].filter(Boolean).join(' · ') },
    champs: [
      { k:'sensMaison', l:'Vous', req:true,
        o:['Proposez un emploi','Cherchez un emploi'] },
      { k:'posteMaison', l:'Poste', req:true,
        o:['Ménagère / aide-ménagère','Nounou / garde d’enfants','Cuisinier(ère)','Gardien / vigile','Chauffeur','Jardinier','Garde-malade / aide à domicile','Repassage','Lessive','Aide aux devoirs','Homme / femme à tout faire'] },

      // Le garde-fou : le travail domestique d'un mineur est interdit.
      { k:'age', l:'Âge', req:true,
        o:['18 à 25 ans','25 à 35 ans','35 à 50 ans','Plus de 50 ans','Peu importe, à partir de 18 ans','Moins de 18 ans'],
        alerte:{ bon:'Peu importe, à partir de 18 ans',
          ok:['18 à 25 ans','25 à 35 ans','35 à 50 ans','Plus de 50 ans'],
          texteBon:'Aucune condition d’âge au-delà de la majorité. C’est la règle sur Chap.ci.',
          texteMauvais:'INTERDIT. Le travail domestique d’un mineur ne peut pas être proposé ni recherché sur Chap.ci.' },
        bloque:['Moins de 18 ans'],
        motifBloc:'Le travail domestique d’une personne mineure est interdit. Cette annonce ne peut pas être publiée.',
        h:function (S) {
          if (S.age === 'Moins de 18 ans')
            return '!Employer un mineur au travail domestique est interdit par la loi ivoirienne et poursuivi. Cette annonce ne sera pas publiée.'
          return 'Éviter de restreindre inutilement l’âge élargit beaucoup le nombre de candidates.'
        } },

      { k:'contratMaison', l:'Cadre de l’emploi', req:true,
        o:['Contrat écrit et déclaration CNPS','Contrat écrit sans déclaration','Accord verbal uniquement','À définir ensemble'],
        h:function (S) {
          if (/verbal/.test(S.contratMaison || ''))
            return '!Sans écrit, ni l’employeur ni l’employée n’est protégé le jour d’un désaccord sur le salaire ou les horaires. Une simple feuille signée par les deux suffit.'
          if (/CNPS/.test(S.contratMaison || ''))
            return 'La déclaration CNPS vous distingue immédiatement : très peu d’employeurs domestiques le font, et les meilleures candidates le cherchent.'
          return 'Un écrit, même bref — horaires, tâches, salaire, jour de repos — évite l’essentiel des litiges.'
        } },
      { k:'tempsMaison', l:'Temps de travail', req:true,
        o:['Temps plein, en journée','Temps plein, à demeure','Mi-temps','Quelques jours par semaine','À la tâche','Week-end uniquement'] },
      { k:'joursMaison', l:'Jours travaillés', multi:true,
        o:['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'] },
      { k:'reposMaison', l:'Jour de repos', req:true,
        o:['Un jour par semaine','Deux jours par semaine','Dimanche','À convenir','Aucun jour fixe'],
        h:function (S) {
          if (S.reposMaison === 'Aucun jour fixe')
            return '!Un emploi sans jour de repos annoncé fait fuir les candidates expérimentées, et se retourne contre l’employeur au premier conflit.'
          return 'Le jour de repos est la deuxième question posée, juste après le salaire.'
        } },
      { k:'logement', l:'Logement et repas', req:true,
        o:['Logée et nourrie','Nourrie, non logée','Ni logée ni nourrie','Transport pris en charge','Nourrie et transport pris en charge'],
        h:'« Logée et nourrie » change complètement le salaire attendu : dites-le d’emblée pour éviter des négociations inutiles.' },
      { k:'tachesMaison', l:'Tâches', multi:true, req:true,
        o:['Ménage','Cuisine','Vaisselle','Lessive','Repassage','Garde d’enfants','Aide aux devoirs','Courses','Jardinage','Gardiennage','Soins à une personne âgée'],
        h:'Lister les tâches évite le malentendu le plus courant de ce métier : « on m’avait dit ménage, on me demande aussi les enfants ».' },
      { k:'enfantsMaison', l:'Nombre d’enfants à garder',
        when:function (S) { return /Nounou|garde d’enfants/i.test(S.posteMaison || '') || (S.tachesMaison || []).indexOf('Garde d’enfants') > -1 },
        o:['1 enfant','2 enfants','3 enfants','4 enfants et plus'] },
      { k:'experienceM', l:'Expérience', req:true, o:EXPERIENCE },
      { k:'referencesM', l:'Références', req:true,
        o:['Références vérifiables fournies','Références sur demande','Aucune référence'],
        h:'Des références vérifiables sont ce qui rassure le plus des deux côtés. Demandez-les, et donnez les vôtres.' }
    ]
  }
}
