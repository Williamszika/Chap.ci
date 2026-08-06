/* ==========================================================================
 *  VOYAGE — agences, billets, visas, études et travail à l'étranger.
 *
 *  C'est la deuxième catégorie la plus dangereuse du site après la Santé, et
 *  pour une raison simple : ici, la victime paie d'avance, part, et se retrouve
 *  à trois mille kilomètres de tout recours. Quatre garde-fous, tous fondés sur
 *  une règle réelle.
 *
 *  1. « VISA GARANTI » N'EXISTE PAS. Un visa est délivré par un consulat, et
 *     par personne d'autre. Aucune agence, aucun intermédiaire, aucun
 *     « contact à l'ambassade » ne peut le promettre. Une annonce qui le
 *     promet ment toujours — et quand elle livre quelque chose, c'est un faux
 *     document, qui vaut à son porteur une interdiction de territoire de
 *     plusieurs années et, souvent, des poursuites.
 *
 *  2. LES FRAIS AVANT LE CONTRAT. Même schéma qu'en Emploi : on réclame des
 *     « frais de dossier » par Mobile Money avant qu'aucun papier n'existe,
 *     puis on disparaît. Un professionnel encaisse APRÈS un contrat écrit.
 *
 *  3. LE PLACEMENT À L'ÉTRANGER PAYÉ PAR LE CANDIDAT. La convention n° 181 de
 *     l'OIT, que la Côte d'Ivoire applique, pose que les frais de recrutement
 *     ne sont JAMAIS à la charge du travailleur. Une agence qui fait payer le
 *     candidat pour un emploi à l'étranger est hors la loi — et c'est
 *     exactement la porte d'entrée des filières de travail domestique du Golfe,
 *     où le passeport est confisqué à l'arrivée.
 *
 *  4. LE VOYAGE SANS VISA. « Passage par la route », « traversée », « on
 *     s'arrange à la frontière » : c'est de la traite, elle tue dans le désert
 *     et en Méditerranée, et elle ne se publie pas ici.
 *
 *  Le reste — billets, séjours, circuits, agences en règle, dossiers d'études
 *  accompagnés honnêtement — est un vrai marché, et le formulaire le facilite.
 * ========================================================================== */
import type { ChampCourt, DonneesCat, SchemaSous, Vals } from './contrat'
import { enregistrerCouleurs, type Couleur } from '../couleurs'


const SOUS = ['Billets d’avion', 'Agences de voyage', 'Visas & formalités',
              'Études à l’étranger', 'Travail à l’étranger', 'Séjours & circuits']

/* Aucune couleur : un voyage n'en a pas. Le moteur en réclame une liste, on lui
   en donne une vide plutôt qu'une palette qui ne servirait jamais. */
const PALETTE_BASE: Couleur[] = []
const TOUTES_COULEURS: Couleur[] = []

const DESTINATIONS = [
  'France', 'Belgique', 'Suisse', 'Canada', 'États-Unis', 'Royaume-Uni',
  'Allemagne', 'Espagne', 'Italie', 'Portugal', 'Turquie', 'Maroc', 'Tunisie',
  'Sénégal', 'Ghana', 'Burkina Faso', 'Mali', 'Nigeria', 'Togo', 'Bénin',
  'Émirats arabes unis', 'Arabie saoudite', 'Qatar', 'Koweït', 'Liban',
  'Chine', 'Inde', 'Afrique du Sud', 'Autre pays',
]

/* Les pays où le travail domestique se fait sous parrainage (kafala) : le
   passeport y est confisqué à l'arrivée dans un très grand nombre de cas, et
   les Ivoiriennes recrutées par des filières informelles s'y retrouvent sans
   contrat, sans salaire et sans moyen de rentrer. On ne les interdit pas — un
   contrat en règle existe aussi — mais on avertit, nommément. */
const KAFALA = /Arabie saoudite|Koweït|Qatar|Liban|Émirats/

/* -------------------------------------------------------------------------
 *  Blocs partagés
 * ------------------------------------------------------------------------- */

/* LA question de cette catégorie. Un visa se délivre au consulat, nulle part
   ailleurs — et une promesse contraire est toujours un mensonge. */
function visaPromesse(): ChampCourt {
  return { k:'visaPromesse', l:'Ce que vous promettez sur le visa', req:true,
    o:['Aucune garantie — seul le consulat décide',
       'Accompagnement au dossier, sans garantie de résultat',
       'Visa garanti, remboursé en cas de refus',
       'Visa sans entretien ni dossier'],
    alerte:{ bon:'Aucune garantie — seul le consulat décide',
      ok:['Accompagnement au dossier, sans garantie de résultat'],
      texteBon:'Aucune garantie annoncée : c’est la seule réponse honnête. Le visa est délivré par le consulat, jamais par un intermédiaire.',
      texteMauvais:'ARNAQUE. Personne ne peut garantir un visa. Ne versez rien, et signalez cette annonce.',
      textes:{
        'Accompagnement au dossier, sans garantie de résultat':'Accompagnement au dossier, sans promesse de résultat. C’est un vrai service : il aide à monter un dossier complet, il ne décide pas à la place du consulat.'
      } },
    bloque:['Visa garanti, remboursé en cas de refus','Visa sans entretien ni dossier'],
    motifBloc:'Aucune agence ne peut garantir un visa : seul un consulat en délivre. Une annonce qui le promet ne peut pas être publiée.',
    h:function (S: Vals) {
      if (/garanti/.test(S.visaPromesse || ''))
        return '!« Visa garanti » n’existe pas. Ce qu’on livre au bout, c’est un faux : il vaut à son porteur une interdiction de territoire de plusieurs années et des poursuites. Cette annonce ne sera pas publiée.'
      if (/sans entretien/.test(S.visaPromesse || ''))
        return '!Un visa « sans entretien ni dossier » se fabrique, il ne s’obtient pas. Cette annonce ne sera pas publiée.'
      return 'Dire clairement que la décision appartient au consulat vous distingue immédiatement des dizaines d’annonces qui promettent l’impossible.'
    } }
}

/* Le même schéma qu'en Emploi : l'argent réclamé avant qu'un papier existe. */
function fraisAvant(quoi: string): ChampCourt {
  return { k:'fraisAvant', l:'Ce que le client paie, et quand', req:true,
    o:['Rien avant la signature d’un contrat écrit',
       'Un acompte, après le contrat écrit',
       'Des frais de dossier à payer avant tout contact',
       'La totalité par Mobile Money, avant tout document'],
    alerte:{ bon:'Rien avant la signature d’un contrat écrit',
      ok:['Un acompte, après le contrat écrit'],
      texteBon:'Rien n’est demandé avant un contrat écrit. C’est la règle : ne versez jamais un franc pour ' + quoi + ' tant que vous n’avez pas de papier signé.',
      texteMauvais:'ARNAQUE. Réclamer de l’argent avant tout document est le schéma exact des faux voyagistes. Ne versez rien, et signalez cette annonce.',
      textes:{
        'Un acompte, après le contrat écrit':'Un acompte après contrat écrit : c’est l’usage. Gardez le contrat et le reçu — ils sont votre seul recours.'
      } },
    bloque:['Des frais de dossier à payer avant tout contact','La totalité par Mobile Money, avant tout document'],
    motifBloc:'Réclamer de l’argent avant tout contrat écrit est le schéma des faux voyagistes. Une telle annonce ne peut pas être publiée.',
    h:function (S: Vals) {
      if (/avant tout contact|avant tout document/.test(S.fraisAvant || ''))
        return '!Un transfert Mobile Money vers un particulier ne se récupère jamais. C’est précisément pour cela que les faux voyagistes ne demandent que cela. Cette annonce ne sera pas publiée.'
      return 'Un contrat écrit — même une page — protège les deux côtés, et c’est ce que le voyageur regarde en premier chez un professionnel.'
    } }
}

/* Placer quelqu'un à l'étranger n'est pas un service libre : c'est une activité
   réglementée. On ne bloque pas le particulier honnête, on lui fait dire ce
   qu'il est. */
function agrement(): ChampCourt {
  return { k:'agrement', l:'Votre statut', req:true,
    o:['Agence agréée — j’ai un numéro d’agrément',
       'Entreprise enregistrée au RCCM',
       'Particulier — je revends mon propre billet ou séjour',
       'Aucun statut déclaré'],
    h:function (S: Vals) {
      if (/Aucun statut/.test(S.agrement || ''))
        return '!Vendre des voyages ou placer des candidats à l’étranger sans statut déclaré vous expose, et fait fuir les clients prudents. Indiquez au moins votre RCCM.'
      if (/agréée/.test(S.agrement || ''))
        return 'Écrivez votre numéro d’agrément dans la description : c’est le premier élément que vérifie un voyageur échaudé.'
      if (/Particulier/.test(S.agrement || ''))
        return 'Un particulier peut revendre SON billet ou SON séjour. Vendre ceux des autres, c’est une activité d’agence, et elle demande un agrément.'
      return 'Le numéro RCCM se lit sur votre registre de commerce. Écrivez-le dans la description.'
    } }
}

/* La traite ne se publie pas ici. */
function itineraire(): ChampCourt {
  return { k:'itineraire', l:'Comment se fait le voyage', req:true,
    o:['Vol régulier, avec visa en règle',
       'Voie terrestre légale, avec les documents requis',
       'Passage par la route sans visa — « on s’arrange à la frontière »',
       'Traversée en mer'],
    bloque:['Passage par la route sans visa — « on s’arrange à la frontière »','Traversée en mer'],
    motifBloc:'Organiser un passage sans visa, par la route ou par la mer, c’est de la traite. Cela ne se publie pas sur Chap.ci.',
    h:function (S: Vals) {
      if (/sans visa|Traversée/.test(S.itineraire || ''))
        return '!Le désert et la Méditerranée tuent des Ivoiriens chaque mois. Organiser ces passages est un crime, pas un voyage. Cette annonce ne sera pas publiée, et elle sera signalée.'
      return 'Un voyage en règle, c’est un billet, un visa et un passeport valide. Rien d’autre ne protège une fois la frontière franchie.'
    } }
}

const DUREE_SEJOUR = ['Moins d’une semaine', '1 à 2 semaines', '3 à 4 semaines',
                      '1 à 3 mois', '3 à 6 mois', 'Plus de 6 mois']

const SCHEMAS: Record<string, SchemaSous> = {

  /* ================================================================== */
  'Billets d’avion': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Prix du billet',
    sansCouleur: 'Photographiez la réservation en masquant le numéro de dossier et le numéro de passeport. Un billet complet en photo se revend à votre place.',
    titre: function (S: Vals) { return [S.villeDepart, S.destination, S.typeVol].filter(Boolean).join(' → ') },
    champs: [
      { k:'sensBillet', l:'Vous', req:true,
        o:['Vendez un billet','Cherchez un billet'] },
      { k:'villeDepart', l:'Départ de', req:true,
        o:['Abidjan','Bouaké','Yamoussoukro','San-Pédro','Korhogo','Autre ville'] },
      { k:'destination', l:'Destination', req:true, o:DESTINATIONS, libre:'Autre pays' },
      { k:'compagnie', l:'Compagnie', t: 'text' as const, ph:'Ex : Air Côte d’Ivoire, Air France, Turkish Airlines' },

      // LE piège du billet d'occasion : un billet d'avion est nominatif.
      { k:'nomBillet', l:'Le nom sur le billet', req:true,
        when:function (S: Vals) { return /Vendez/.test(S.sensBillet || '') },
        o:['Le billet n’est pas encore émis — il sera à votre nom',
           'Billet émis, le changement de nom est possible et payant',
           'Billet émis à mon nom, changement de nom impossible'],
        alerte:{ bon:'Le billet n’est pas encore émis — il sera à votre nom',
          ok:['Billet émis, le changement de nom est possible et payant'],
          texteBon:'Le billet sera émis à VOTRE nom : c’est la seule façon d’acheter un billet à quelqu’un d’autre.',
          texteMauvais:'ATTENTION. Un billet d’avion est nominatif : celui-ci porte le nom du vendeur, et vous ne pourrez jamais embarquer avec. N’achetez pas.',
          textes:{
            'Billet émis, le changement de nom est possible et payant':'Le changement de nom est possible mais payant. Faites-le confirmer par la compagnie AVANT de payer, et demandez le montant exact.'
          } },
        bloque:['Billet émis à mon nom, changement de nom impossible'],
        motifBloc:'Un billet nominatif non modifiable ne peut pas être revendu : l’acheteur ne pourra jamais embarquer avec.',
        h:function (S: Vals) {
          if (/impossible/.test(S.nomBillet || ''))
            return '!Un billet d’avion porte le nom du passager, contrôlé au comptoir contre le passeport. Vendre le vôtre, c’est vendre un papier inutilisable. Cette annonce ne sera pas publiée — voyez plutôt avec la compagnie pour un remboursement ou un avoir.'
          return 'C’est LA question du billet d’avion d’occasion : le nom se contrôle contre le passeport à l’enregistrement. Faites confirmer le changement de nom par la compagnie avant toute transaction.'
        } },

      fraisAvant('un billet'),
      { k:'typeVol', l:'Type de vol', req:true, o:['Aller simple','Aller-retour','Multi-destinations'] },
      { k:'dateVol', l:'Date du départ', t: 'text' as const, req:true, ph:'Ex : 22 septembre 2026' },
      { k:'classeVol', l:'Classe', o:['Économique','Économique premium','Affaires','Première'] },
      { k:'bagages', l:'Bagages inclus', req:true,
        o:['Bagage cabine uniquement','1 bagage en soute (23 kg)','2 bagages en soute','Plus de 2 bagages','À vérifier'],
        h:'Un billet « pas cher » sans bagage en soute coûte souvent plus cher qu’un billet complet, une fois le bagage payé au comptoir.' },
      { k:'escales', l:'Escales', o:['Vol direct','1 escale','2 escales ou plus'] },
      { k:'modifBillet', l:'Modification et annulation', req:true,
        o:['Modifiable et remboursable','Modifiable avec frais','Ni modifiable ni remboursable','Je ne sais pas'],
        h:'Un billet non remboursable acheté à un particulier ne se rattrape pas si le voyage tombe à l’eau. Dites-le franchement.' },
      { k:'paiementBillet', l:'Où se fait la transaction', req:true,
        o:['Au comptoir de l’agence','Dans une agence de la compagnie','En main propre, dans un lieu public','Par Mobile Money à distance'],
        h:function (S: Vals) {
          if (/à distance/.test(S.paiementBillet || ''))
            return '!Payer un billet à distance, à quelqu’un que vous n’avez jamais vu, est la façon la plus courante de perdre son argent sur ce rayon. Exigez le comptoir d’une agence.'
          return 'Se retrouver au comptoir d’une agence pour l’émission règle tout : vous voyez le billet sortir à votre nom.'
        } }
    ]
  },

  /* ================================================================== */
  'Agences de voyage': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Tarif à partir de',
    service: true,
    sansCouleur: 'Photographiez votre devanture, votre agrément et votre équipe. Sur ce rayon, un visage et une adresse valent tous les arguments.',
    titre: function (S: Vals) { return [S.nomAgence, (S.prestations || []).slice(0, 2).join(', ')].filter(Boolean).join(' · ') },
    champs: [
      { k:'nomAgence', l:'Nom de l’agence', t: 'text' as const, req:true, ph:'Ex : Agence Wôrô Voyages' },
      agrement(),
      { k:'numAgrement', l:'Numéro d’agrément ou RCCM', t: 'text' as const,
        when:function (S: Vals) { return /agréée|RCCM/.test(S.agrement || '') },
        ph:'Ex : CI-ABJ-2024-B-12345',
        h:'Écrit en clair, ce numéro est vérifiable. C’est ce qui vous sépare des annonces sans adresse.' },
      { k:'prestations', l:'Ce que vous proposez', multi:true, req:true,
        o:['Billetterie aérienne','Réservation d’hôtel','Circuits et séjours','Accompagnement au dossier de visa',
           'Assurance voyage','Location de voiture','Transferts aéroport','Pèlerinage','Voyages de groupe','Voyages d’affaires'] },

      visaPromesse(),
      fraisAvant('un voyage'),

      { k:'adresseAgence', l:'Votre agence', req:true,
        o:['Local ouvert au public, avec adresse','Bureau sur rendez-vous','En ligne uniquement'],
        h:function (S: Vals) {
          if (/En ligne uniquement/.test(S.adresseAgence || ''))
            return '!Une agence sans adresse physique inquiète, et à juste titre : c’est la première chose que regarde un client qui a déjà été volé. Si vous en avez une, donnez-la.'
          return 'Écrivez l’adresse et un point de repère dans la description : « à côté de la pharmacie du carrefour » sert plus qu’un nom de rue.'
        } },
      { k:'iata', l:'Accréditation IATA', o:['Agence accréditée IATA','Non accréditée','En cours'],
        h:'L’accréditation IATA permet d’émettre soi-même les billets. Ce n’est pas obligatoire, mais cela se dit.' },
      { k:'anciennete', l:'Depuis quand exercez-vous',
        o:['Moins d’un an','1 à 3 ans','3 à 10 ans','Plus de 10 ans'] },
      { k:'paiementAgence', l:'Moyens de paiement acceptés', multi:true,
        o:['Espèces au comptoir','Mobile Money','Virement bancaire','Carte bancaire','Paiement en plusieurs fois'] },
      { k:'recu', l:'Ce que reçoit le client', multi:true, req:true,
        o:['Facture au nom de l’agence','Reçu simple','Contrat écrit','Billet électronique par e-mail','Rien'],
        h:'Une facture au nom de l’agence est le seul document qui permette à un client de se retourner. Donnez-la systématiquement.' }
    ]
  },

  /* ================================================================== */
  'Visas & formalités': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Honoraires d’accompagnement',
    service: true,
    sansCouleur: 'Ne publiez JAMAIS la photo d’un passeport, d’un visa ou d’une carte de séjour — le vôtre ou celui d’un client. Ces images se recopient pour fabriquer des faux.',
    titre: function (S: Vals) { return [S.typeDossier, S.paysVisa].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeDossier', l:'Type de dossier', req:true,
        o:['Visa touristique','Visa d’affaires','Visa étudiant','Visa de travail','Regroupement familial',
           'Passeport ivoirien','Carte consulaire','Légalisation de documents','Traduction assermentée',
           'Attestation d’hébergement','Casier judiciaire','Certificat de nationalité'] },
      { k:'paysVisa', l:'Pays concerné', req:true, o:DESTINATIONS, libre:'Autre pays' },

      visaPromesse(),
      fraisAvant('un dossier de visa'),
      agrement(),

      { k:'fraisSepares', l:'Les frais consulaires', req:true,
        o:['Payés directement par le client au consulat','Inclus dans mon tarif, détaillés sur la facture','Inclus, non détaillés'],
        h:function (S: Vals) {
          if (/non détaillés/.test(S.fraisSepares || ''))
            return '!Mélanger frais consulaires et honoraires empêche le client de savoir ce qu’il vous paie à vous. Détaillez : c’est ce que fait un professionnel.'
          return 'Les frais du consulat ne sont pas les vôtres. Les séparer sur la facture est le geste qui inspire le plus confiance sur ce rayon.'
        } },
      { k:'prestationVisa', l:'Ce que vous faites exactement', multi:true, req:true,
        o:['Vérification de la liste des pièces','Remplissage du formulaire en ligne','Prise de rendez-vous',
           'Préparation à l’entretien','Rédaction de la lettre de motivation','Traduction de documents',
           'Accompagnement physique au centre de dépôt'],
        h:'Un accompagnement honnête se décrit par des gestes précis. Les annonces qui ne disent que « je m’occupe de tout » sont celles qui inquiètent.' },
      { k:'documentsVisa', l:'Documents que vous demandez au client', multi:true,
        o:['Passeport en cours de validité','Photos d’identité','Justificatifs de ressources','Attestation d’emploi',
           'Réservation d’hôtel','Assurance voyage','Acte de naissance'],
        h:'Ne réclamez jamais l’original d’un passeport avant un rendez-vous confirmé. Un client prudent refusera, et il aura raison.' },
      { k:'delaiVisa', l:'Délai annoncé', req:true,
        o:['Selon le consulat — je ne le maîtrise pas','2 à 4 semaines','1 à 2 mois','Plus de deux mois'],
        h:function (S: Vals) {
          if (/2 à 4 semaines|1 à 2 mois/.test(S.delaiVisa || ''))
            return 'Annoncez ce délai comme une estimation. Les consulats changent leurs cadences sans prévenir, et une promesse de date se retourne contre vous.'
          return 'Dire que le délai appartient au consulat est honnête, et cela vous évite le reproche du client pressé.'
        } },
      { k:'refusVisa', l:'En cas de refus', req:true,
        o:['Les honoraires restent dus, c’est dit à l’avance','Honoraires partiellement remboursés','Nouveau dossier accompagné gratuitement'],
        h:'Un refus de visa n’est pas votre faute. Le dire AVANT, par écrit, évite l’essentiel des conflits de ce métier.' }
    ]
  },

  /* ================================================================== */
  'Études à l’étranger': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Frais d’accompagnement',
    service: true,
    sansCouleur: 'Photographiez vos locaux ou vos partenariats signés. Ne publiez jamais le dossier d’un étudiant, même anonymisé.',
    titre: function (S: Vals) { return [S.paysEtude, S.niveauEtude, S.domaineEtude].filter(Boolean).join(' · ') },
    champs: [
      { k:'sensEtude', l:'Vous', req:true,
        o:['Proposez un accompagnement ou une formation','Cherchez à partir étudier'] },
      { k:'paysEtude', l:'Pays d’études', req:true, o:DESTINATIONS, libre:'Autre pays' },
      { k:'niveauEtude', l:'Niveau visé', req:true,
        o:['Année préparatoire / langue','Licence (BAC+1 à BAC+3)','Master (BAC+4, BAC+5)','Doctorat','BTS / DUT','Formation professionnelle'] },
      { k:'domaineEtude', l:'Domaine', req:true,
        o:['Informatique & numérique','Commerce & gestion','Santé & paramédical','Ingénierie','Droit','Sciences',
           'Lettres & sciences humaines','Agronomie','Hôtellerie & tourisme','Arts & design','Autre domaine'], libre:'Autre domaine' },

      // Une école admet ou n'admet pas. Personne d'autre.
      { k:'admissionPromesse', l:'Ce que vous promettez sur l’admission', req:true,
        when:function (S: Vals) { return /Proposez/.test(S.sensEtude || '') },
        o:['Aucune garantie — l’école décide',
           'Accompagnement au dossier, sans garantie',
           'Admission garantie dans une école partenaire',
           'Inscription garantie sans dossier ni diplôme'],
        alerte:{ bon:'Aucune garantie — l’école décide',
          ok:['Accompagnement au dossier, sans garantie'],
          texteBon:'Aucune garantie d’admission : c’est la réponse honnête. L’école décide, sur dossier.',
          texteMauvais:'ARNAQUE. Une admission ne se garantit pas, et une « inscription sans diplôme » se paie très cher pour un papier sans valeur.' },
        bloque:['Inscription garantie sans dossier ni diplôme'],
        motifBloc:'Une inscription sans dossier ni diplôme ne mène à aucun diplôme reconnu. Cette annonce ne peut pas être publiée.',
        h:function (S: Vals) {
          if (/sans dossier ni diplôme/.test(S.admissionPromesse || ''))
            return '!Les « écoles » qui inscrivent sans dossier délivrent des diplômes que personne ne reconnaît, ni là-bas ni ici. L’étudiant perd son argent et ses années. Cette annonce ne sera pas publiée.'
          if (/Admission garantie/.test(S.admissionPromesse || ''))
            return '!Une école partenaire admet sur dossier, comme les autres. Promettre l’admission engage votre responsabilité sur une décision qui n’est pas la vôtre — écrivez plutôt ce que vous faites pour rendre le dossier solide.'
          return 'Les familles paient parfois plusieurs années d’économies pour ce départ. Dire ce que vous ne maîtrisez pas est ce qui vous rendra recommandable.'
        } },

      visaPromesse(),
      fraisAvant('un départ en études'),
      agrement(),
      itineraire(),

      { k:'etablissement', l:'Établissement visé', t: 'text' as const, ph:'Ex : Université de Lille, Cégep de Trois-Rivières',
        h:'Nommez l’établissement : c’est ce que la famille vérifie, et c’est ce qui rend une annonce crédible.' },
      { k:'reconnuEtude', l:'Reconnaissance du diplôme', req:true,
        when:function (S: Vals) { return /Proposez/.test(S.sensEtude || '') },
        o:['Diplôme d’État reconnu','Diplôme d’école privée reconnu par le pays','Certificat d’établissement uniquement','Je ne sais pas'],
        h:'Un diplôme non reconnu ne vaut rien au retour. La famille doit le savoir avant de vendre un terrain pour le financer.' },
      { k:'coutTotal', l:'Ce que coûte l’année, tout compris', req:true,
        o:['Moins de 1 million FCFA','1 à 3 millions FCFA','3 à 6 millions FCFA','6 à 12 millions FCFA','Plus de 12 millions FCFA','Cela dépend du dossier'],
        h:'Scolarité, logement, visa, billet, assurance et premiers mois de vie. Un chiffre honnête évite à une famille de partir à moitié financée.' },
      { k:'bourseEtude', l:'Bourse', multi:true,
        o:['Bourse du pays d’accueil possible','Bourse ivoirienne','Bourse de l’établissement','Aucune bourse','Je ne sais pas'] },
      { k:'logementEtude', l:'Logement sur place', req:true,
        o:['Logement étudiant réservé avant le départ','Aide à la recherche','À la charge de l’étudiant'],
        h:'Arriver sans logement est ce qui fait échouer les premières semaines, surtout au Canada et en France.' },
      { k:'travailEtude', l:'Travail pendant les études',
        o:['Autorisé, dans la limite légale','Non autorisé','Je ne sais pas'],
        h:'Ne promettez jamais qu’un étudiant « financera ses études en travaillant là-bas ». C’est la promesse qui ruine le plus de familles.' }
    ]
  },

  /* ================================================================== */
  'Travail à l’étranger': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Salaire mensuel proposé',
    service: true,
    sansCouleur: 'Photographiez le contrat type, vos locaux, votre agrément. Ne publiez jamais le passeport ni les papiers d’un candidat.',
    titre: function (S: Vals) { return [S.posteEtranger, S.paysTravail, S.contratEcrit ? '' : ''].filter(Boolean).join(' · ') },
    champs: [
      { k:'sensTravail', l:'Vous', req:true,
        o:['Proposez un emploi ou un placement à l’étranger','Cherchez un emploi à l’étranger'] },
      { k:'paysTravail', l:'Pays', req:true, o:DESTINATIONS, libre:'Autre pays' },
      { k:'posteEtranger', l:'Poste', req:true,
        o:['Bâtiment & travaux publics','Restauration & hôtellerie','Travail domestique / ménage','Garde d’enfants',
           'Santé & aide à la personne','Agriculture & saisonnier','Chauffeur','Sécurité','Nettoyage',
           'Informatique & numérique','Commerce & vente','Industrie & usine','Autre poste'], libre:'Autre poste' },

      // Convention n° 181 de l'OIT : les frais de recrutement ne sont jamais à
      // la charge du travailleur. C'est la porte d'entrée des filières.
      { k:'fraisPlacement', l:'Frais demandés au candidat', req:true,
        o:['Aucun — le recrutement est entièrement gratuit pour le candidat',
           'Des frais de placement sont demandés',
           'Le candidat paie son billet et son visa, le reste est pris en charge',
           'Le candidat avance tout, il est remboursé sur ses premiers salaires'],
        alerte:{ bon:'Aucun — le recrutement est entièrement gratuit pour le candidat',
          ok:['Le candidat paie son billet et son visa, le reste est pris en charge'],
          texteBon:'Recrutement gratuit pour le candidat : c’est la règle internationale, et c’est le signe d’un employeur sérieux.',
          texteMauvais:'ARNAQUE, ET ILLÉGAL. Les frais de recrutement ne sont jamais à la charge du travailleur. Ne versez rien, et signalez cette annonce.',
          textes:{
            'Le candidat paie son billet et son visa, le reste est pris en charge':'Le candidat paie son transport et son visa. C’est courant, mais exigez le contrat AVANT d’acheter le moindre billet.'
          } },
        bloque:['Des frais de placement sont demandés','Le candidat avance tout, il est remboursé sur ses premiers salaires'],
        motifBloc:'Les frais de recrutement ne sont jamais à la charge du travailleur (convention n° 181 de l’OIT). Une annonce qui les réclame ne peut pas être publiée.',
        h:function (S: Vals) {
          if (/remboursé sur ses premiers salaires/.test(S.fraisPlacement || ''))
            return '!« Vous remboursez sur vos salaires » est la formule de la servitude pour dettes : le travailleur arrive endetté, ne peut plus partir, et son passeport est confisqué. Cette annonce ne sera pas publiée.'
          if (/frais de placement/.test(S.fraisPlacement || ''))
            return '!Faire payer un candidat pour un emploi à l’étranger est interdit. C’est aussi le premier geste de toutes les filières qui envoient des Ivoiriennes travailler sans contrat ni salaire. Cette annonce ne sera pas publiée.'
          return 'Un employeur qui paie lui-même le recrutement est un employeur qui existe. Dites-le clairement, cela vous distingue.'
        } },

      // La protection vérifiable : un contrat écrit signé AVANT le départ.
      { k:'contratEcrit', l:'Le contrat de travail', req:true,
        o:['Contrat écrit signé avant le départ, en français',
           'Contrat écrit signé à l’arrivée',
           'Accord verbal — le contrat se fait sur place',
           'Aucun contrat'],
        alerte:{ bon:'Contrat écrit signé avant le départ, en français',
          texteBon:'Contrat écrit signé avant le départ : c’est la seule protection qui existe une fois la frontière franchie. Gardez-en une copie chez vous.',
          texteMauvais:'DANGER. Partir sans contrat signé, c’est partir sans aucun recours. Ne partez pas.',
          textes:{
            'Contrat écrit signé à l’arrivée':'Un contrat signé seulement à l’arrivée peut être remplacé par un autre, dans une langue que vous ne lisez pas. Exigez-le avant de monter dans l’avion.'
          } },
        bloque:['Accord verbal — le contrat se fait sur place','Aucun contrat'],
        motifBloc:'Envoyer quelqu’un travailler à l’étranger sans contrat écrit signé avant le départ ne peut pas se proposer sur Chap.ci.',
        h:function (S: Vals) {
          if (/verbal|Aucun contrat/.test(S.contratEcrit || ''))
            return '!Sans contrat signé avant le départ, le travailleur n’a aucun recours : ni salaire prouvable, ni horaires, ni billet de retour. C’est ainsi que des Ivoiriennes se retrouvent bloquées à l’étranger sans passeport. Cette annonce ne sera pas publiée.'
          return 'Salaire, horaires, jour de repos, logement, billet de retour, qui garde le passeport : ces six lignes doivent être écrites et signées avant le départ.'
        } },

      // L'avertissement nommé, quand la destination est un pays de kafala.
      { k:'passeport', l:'Qui garde le passeport sur place', req:true,
        o:['Le travailleur garde son passeport',
           'L’employeur le conserve',
           'L’agence le conserve'],
        alerte:{ bon:'Le travailleur garde son passeport',
          texteBon:'Le travailleur garde son passeport. C’est la condition non négociable d’un départ sûr.',
          texteMauvais:'DANGER ABSOLU. Un passeport confisqué, c’est l’impossibilité de rentrer. Ne partez pas, et signalez cette annonce.' },
        bloque:['L’employeur le conserve','L’agence le conserve'],
        motifBloc:'La confiscation du passeport d’un travailleur est une pratique de traite. Elle ne se propose pas sur Chap.ci.',
        h:function (S: Vals) {
          if (/conserve/.test(S.passeport || ''))
            return '!Confisquer le passeport est le geste par lequel un emploi devient une séquestration. C’est ce qui arrive à des travailleuses domestiques ivoiriennes chaque année. Cette annonce ne sera pas publiée, et elle sera signalée.'
          if (KAFALA.test(S.paysTravail || ''))
            return 'Vous partez vers un pays où le travail se fait sous parrainage. Avant de partir : contrat écrit en français, copie laissée à votre famille, numéro de l’ambassade de Côte d’Ivoire enregistré dans votre téléphone, et votre passeport reste dans VOTRE poche.'
          return 'Le passeport reste au travailleur, toujours. Aucune raison légale ne justifie qu’un employeur le garde.'
        } },

      itineraire(),
      agrement(),
      visaPromesse(),

      { k:'billetTravail', l:'Le billet et le visa', req:true,
        o:['Pris en charge par l’employeur','Pris en charge, retenus sur salaire','À la charge du candidat'],
        h:function (S: Vals) {
          if (/retenus sur salaire/.test(S.billetTravail || ''))
            return '!Un billet « retenu sur salaire » est une dette contractée avant même d’arriver. C’est le mécanisme exact du travail forcé. Prenez-le en charge, ou faites-le payer au candidat une fois pour toutes.'
          return ''
        } },
      { k:'retourTravail', l:'Le billet de retour', req:true,
        o:['Billet de retour garanti par le contrat','Retour à la charge du travailleur','Non prévu'],
        h:'Le billet de retour écrit dans le contrat est le second garde-fou, après le passeport. Sans lui, on ne rentre pas.' },
      { k:'dureeTravail', l:'Durée du contrat', req:true,
        o:['Saisonnier, moins de 6 mois','1 an','2 ans','Plus de 2 ans','Indéterminée'] },
      { k:'logementTravail', l:'Logement et repas',
        o:['Logé et nourri par l’employeur','Logé, non nourri','Ni logé ni nourri','Indemnité de logement'] },
      { k:'languesTravail', l:'Langues exigées', multi:true,
        o:['Français','Anglais','Arabe','Italien','Espagnol','Portugais','Aucune'] }
    ]
  },

  /* ================================================================== */
  'Séjours & circuits': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Prix par personne',
    sansCouleur: 'Photographiez le lieu réel du séjour, pas une image trouvée en ligne. Un client qui reconnaît une photo de catalogue ne rappelle pas.',
    titre: function (S: Vals) { return [S.typeSejour, S.destinationSejour, S.dureeSejour].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeSejour', l:'Type de séjour', req:true,
        o:['Séjour balnéaire','Circuit découverte','Week-end','Voyage de groupe','Voyage scolaire',
           'Pèlerinage','Lune de miel','Séminaire d’entreprise','Séjour en Côte d’Ivoire','Croisière'] },
      { k:'destinationSejour', l:'Destination', req:true,
        o:['Côte d’Ivoire — Assinie','Côte d’Ivoire — Grand-Bassam','Côte d’Ivoire — Man','Côte d’Ivoire — Yamoussoukro',
           'Côte d’Ivoire — autre','Afrique de l’Ouest','Maghreb','Europe','Amérique du Nord','Moyen-Orient','Asie','Autre'],
        libre:'Autre' },
      { k:'dureeSejour', l:'Durée', req:true, o:DUREE_SEJOUR },
      { k:'dateSejour', l:'Dates', t: 'text' as const, ph:'Ex : du 20 au 27 décembre 2026' },

      agrement(),
      fraisAvant('un séjour'),
      visaPromesse(),

      { k:'inclusSejour', l:'Ce qui est compris dans le prix', multi:true, req:true,
        o:['Vol aller-retour','Transferts aéroport','Hébergement','Petit-déjeuner','Pension complète',
           'Excursions','Guide','Assurance voyage','Frais de visa','Rien de tout cela'],
        h:'La liste de ce qui est compris est ce qui évite le litige de fin de séjour. Soyez précis, et dites aussi ce qui NE l’est pas.' },
      { k:'hebergement', l:'Hébergement',
        o:['Hôtel 5 étoiles','Hôtel 4 étoiles','Hôtel 3 étoiles','Résidence / appartement','Maison d’hôtes','Campement','Chez l’habitant'] },
      { k:'groupeSejour', l:'Nombre de places',
        o:['1 à 2 personnes','3 à 10 personnes','11 à 30 personnes','Plus de 30 personnes'] },
      { k:'acompteSejour', l:'Acompte demandé', req:true,
        o:['Aucun acompte','30 % à la réservation','50 % à la réservation','Totalité à la réservation'],
        h:function (S: Vals) {
          if (/Totalité/.test(S.acompteSejour || ''))
            return '!Exiger la totalité à la réservation fait porter tout le risque au client. Un acompte et un solde avant le départ rassurent beaucoup plus.'
          return 'Remettez un reçu à chaque versement, avec la date, le montant et ce qu’il couvre.'
        } },
      { k:'annulSejour', l:'Conditions d’annulation', req:true,
        o:['Remboursement intégral jusqu’à 30 jours avant','Remboursement partiel','Acompte non remboursable','Aucun remboursement'],
        h:'Les conditions d’annulation écrites à l’avance sont ce qui distingue un voyagiste d’un particulier. Mettez-les dans la description.' },
      { k:'assuranceSejour', l:'Assurance voyage',
        o:['Incluse','En option','Non proposée'],
        h:'Une assurance rapatriement coûte peu et sauve un séjour qui tourne mal. Proposez-la, même en option.' }
    ]
  }
}

export const VOYAGE: DonneesCat = {
  sous: SOUS,
  paletteBase: PALETTE_BASE,
  toutesCouleurs: TOUTES_COULEURS,
  schemas: SCHEMAS,
}

// La palette de ce metier rejoint le repertoire general au moment ou ce module
// est charge. C'est ce qui permet a `couleurs.ts` de n'avoir AUCUN import vers
// `data/sous/` : sans quoi les quatre-vingt-deux schemas repartiraient au
// demarrage, juste pour resoudre le nom d'une teinte.
enregistrerCouleurs(TOUTES_COULEURS)
