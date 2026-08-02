/* ==========================================================================
 *  SERVICES — un schéma par sous-catégorie.
 *
 *  Un service ne se photographie pas : il se PROMET. C'est ce qui le rend
 *  différent de tout le reste du site, et c'est ce qui décide des champs.
 *
 *  1. LE DEVIS ET L'ACOMPTE. Le litige type n'est pas « l'objet est cassé »,
 *     c'est « ce n'était pas le prix annoncé » ou « il est parti avec
 *     l'acompte ». Chaque formulaire demande donc comment le prix est établi
 *     et comment il se paie — et conseille l'artisan honnête plutôt que de
 *     le soupçonner.
 *
 *  2. LA ZONE D'INTERVENTION. Un plombier de Yopougon ne se déplace pas à
 *     Bingerville pour une fuite. Le dire d'emblée évite l'appel pour rien,
 *     des deux côtés.
 *
 *  3. « FORMATION PAYANTE POUR ÊTRE EMBAUCHÉ ». Sous « Cours & Formation »
 *     se glissent des offres qui font payer une formation en promettant un
 *     emploi à la clé. C'est la même arnaque que les faux recrutements :
 *     la question est posée, et une promesse d'embauche contre paiement
 *     refuse l'annonce.
 *
 *  4. LE TRANSPORT DE PERSONNES. Il exige une assurance et une licence.
 *     Un déménageur qui casse sans assurance, personne ne le rembourse.
 * ========================================================================== */
import type { ChampCourt, DonneesCat, SchemaSous, Vals } from './contrat'
import { enregistrerCouleurs, type Couleur } from '../couleurs'


const SOUS = ['BTP & Rénovation', 'Cours & Formation', 'Événementiel', 'Transport & Déménagement', 'Informatique & Digital', 'Couture & Artisanat']

const PALETTE_BASE: Couleur[] = []
const TOUTES_COULEURS: Couleur[] = []

const EXPERIENCE = ['Débutant','1 à 2 ans','3 à 5 ans','5 à 10 ans','Plus de 10 ans']
const ZONES = ['Ma commune uniquement','Abidjan Sud (Marcory, Koumassi, Treichville, Port-Bouët)','Abidjan Nord (Abobo, Adjamé, Attécoubé)','Abidjan Est (Cocody, Bingerville)','Abidjan Ouest (Yopougon, Songon)','Tout Abidjan','Toute la Côte d’Ivoire','À distance / en ligne']

/* Comment le prix est fixé — la première cause de litige sur un service. */
function devis(): ChampCourt {
  return { k:'devis', l:'Comment le prix est fixé', req:true,
    o:['Tarif fixe annoncé','Devis gratuit après visite','Devis gratuit à distance','Devis payant (déduit si commande)','Sur mesure, à discuter'],
    h:function (S: Vals) {
      if (/Devis payant/.test(S.devis || ''))
        return '!Un devis payant fait fuir la moitié des demandes ici. Si vous devez le facturer, dites clairement qu’il est déduit de la facture finale.'
      return 'Un tarif annoncé, même « à partir de », multiplie les demandes sérieuses. « Nous consulter » seul fait passer votre tour.'
    } }
}

/* L'acompte : le bandeau de presque toutes les sous-catégories. */
function paiement(quoi: string): ChampCourt {
  return { k:'paiement', l:'Modalités de paiement', req:true,
    o:['Paiement à la fin, une fois le travail fait','Acompte 30 %, solde à la fin','Acompte 50 %, solde à la fin','Paiement par étapes','Paiement intégral d’avance'],
    alerte:{ bon:'Acompte 50 %, solde à la fin',
      ok:['Paiement à la fin, une fois le travail fait','Acompte 30 %, solde à la fin','Paiement par étapes'],
      texteBon:'Moitié à la commande, moitié à la fin : c’est l’équilibre habituel. Chacun prend la même part de risque.',
      texteMauvais:'Le paiement intégral d’avance vous fait porter tout le risque sur ' + quoi + '. Proposez un acompte et un solde à la fin — un professionnel sérieux l’accepte.',
      textes:{
        'Paiement à la fin, une fois le travail fait':'Paiement à la fin : c’est vous qui êtes protégé. Convenez par écrit de ce qui est « fini » avant de commencer.',
        'Paiement par étapes':'Paiement par étapes : la bonne formule sur un chantier long. Écrivez les étapes et ce qui est dû à chacune.'
      } },
    h:function (S: Vals) {
      if (S.paiement === 'Paiement intégral d’avance')
        return '!Exiger la totalité d’avance est le schéma de l’arnaque à l’acompte, et cela fait fuir les bons clients. Un acompte de 50 % rassure bien davantage.'
      return 'Écrivez toujours ce qui est fait, quand, et pour combien. Un simple papier signé des deux côtés règle 90 % des disputes.'
    } }
}

function communs(quoi: string): ChampCourt[] {
  return [
    { k:'zone', l:'Zone d’intervention', multi:true, req:true, o:ZONES,
      h:'Un artisan de Yopougon ne se déplace pas à Bingerville pour une petite intervention. Le dire évite l’appel pour rien, des deux côtés.' },
    { k:'deplacement', l:'Frais de déplacement', req:true,
      o:['Déplacement gratuit','Déplacement facturé','Déplacement offert si commande','Le client vient à moi'] },
    { k:'experience', l:'Expérience', req:true, o:EXPERIENCE },
    devis(),
    paiement(quoi),
    { k:'refs', l:'Références', req:true,
      o:['Photos de réalisations disponibles','Clients référencés','Attestations de travaux','Débutant, pas encore de références'],
      h:'Trois photos de chantiers finis valent mieux que dix lignes de promesses.' },
    { k:'garantieS', l:'Garantie sur la prestation', req:true,
      o:['Aucune garantie','15 jours','1 mois','3 mois','6 mois','1 an','Garantie décennale'],
      h:'Une garantie, même de quinze jours, vous distingue immédiatement de celui d’à côté qui n’en donne aucune.' },
    { k:'facture', l:'Facturation', req:true,
      o:['Facture avec numéro de contribuable','Reçu simple','Aucune facture'],
      h:'Une facture en règle ouvre les marchés des entreprises, des ONG et des administrations — elles ne peuvent pas payer sans.' },
    { k:'dispoS', l:'Disponibilité', req:true,
      o:['Immédiate','Sous 48 heures','Sous une semaine','Sous un mois','Sur planning'] }
  ]
}

const SCHEMAS: Record<string, SchemaSous> = {

  'BTP & Rénovation': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Tarif à partir de',
    sansCouleur: 'Montrez vos chantiers finis : sur du bâtiment, une photo d’avant/après vaut tous les arguments.',
    titre: function (S: Vals) { return [(S.metier || []).slice(0,2).join(', '), S.uniteBtp].filter(Boolean).join(' · ') },
    champs: ([
      { k:'metier', l:'Ce que vous faites', multi:true, req:true,
        o:['Maçonnerie','Carrelage','Peinture','Plomberie','Électricité','Menuiserie bois','Menuiserie aluminium','Ferronnerie','Étanchéité','Faux plafond','Climatisation','Forage / puits','Terrassement','Démolition','Second œuvre complet'] },
      { k:'uniteBtp', l:'Le tarif est', req:true,
        o:['Au mètre carré','À la journée','Au forfait / au chantier','À l’heure','Sur devis'] },
      { k:'equipe', l:'Taille de l’équipe', req:true,
        o:['Je travaille seul','2 à 3 personnes','4 à 10 personnes','Plus de 10 personnes'] },
      { k:'materiaux', l:'Les matériaux', req:true,
        o:['Fournis par le client','Je les fournis, compris dans le prix','Je les fournis, facturés à part','Au choix du client'],
        h:'C’est la deuxième source de dispute après le prix. Dites-le avant, pas au moment de la facture.' },
      { k:'assurance', l:'Assurance chantier', req:true,
        o:['Assuré responsabilité civile professionnelle','Non assuré'],
        h:function (S: Vals) {
          if (S.assurance === 'Non assuré')
            return '!Sans assurance, un dégât d’eau chez le client est à votre charge — ou à la sienne. Beaucoup de clients d’immeuble l’exigent désormais.'
          return 'Très peu d’artisans peuvent l’afficher ici. Si vous l’avez, mettez-le dans le titre.'
        } }
    ] as ChampCourt[]).concat(communs('un chantier'))
  },

  'Cours & Formation': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Tarif',
    sansCouleur: 'Une photo de vous en situation, ou de vos supports de cours, rassure plus qu’un logo.',
    titre: function (S: Vals) { return [(S.matiere || []).slice(0,2).join(', '), S.niveauEleve, S.uniteCours].filter(Boolean).join(' · ') },
    champs: ([
      { k:'matiere', l:'Ce que vous enseignez', multi:true, req:true,
        o:['Mathématiques','Français','Anglais','Physique-Chimie','SVT','Histoire-Géographie','Philosophie','Comptabilité','Informatique / bureautique','Programmation','Couture','Coiffure','Pâtisserie / cuisine','Mécanique','Conduite','Musique','Sport / coaching','Alphabétisation','Langue locale'] },
      { k:'niveauEleve', l:'Public', multi:true, req:true,
        o:['Primaire','Collège','Lycée','Terminale / BAC','Université','Adultes','Professionnels','Débutants complets'] },
      { k:'uniteCours', l:'Le tarif est', req:true,
        o:['À l’heure','À la séance','Au mois','Au module complet','Gratuit'] },
      { k:'formatCours', l:'Format', multi:true, req:true,
        o:['À domicile chez l’élève','Chez moi','En centre / salle','En ligne','En groupe','Individuel'] },

      // La question qui décide de la publication.
      { k:'promesseEmploi', l:'Emploi promis à la fin', req:true,
        o:['Aucun emploi promis — c’est une formation','Aide à la recherche d’emploi, sans promesse','Emploi garanti contre paiement de la formation'],
        alerte:{ bon:'Aucun emploi promis — c’est une formation',
          ok:['Aide à la recherche d’emploi, sans promesse'],
          texteBon:'Le formateur vend une formation, pas un emploi. C’est honnête : jugez le programme, la durée et l’attestation.',
          texteMauvais:'ARNAQUE. Personne ne peut garantir un emploi contre le paiement d’une formation. C’est le schéma exact des faux recrutements.' },
        bloque:['Emploi garanti contre paiement de la formation'],
        motifBloc:'Promettre un emploi garanti contre le paiement d’une formation est une arnaque : l’annonce ne peut pas être publiée.',
        h:function (S: Vals) {
          if (/garanti contre paiement/.test(S.promesseEmploi || ''))
            return '!Faire payer une formation en promettant un emploi à la clé est la même arnaque que les faux recrutements démentis par la CIE et le Port autonome. Cette annonce ne sera pas publiée.'
          return 'Une formation honnête se vend sur son contenu. Promettre un emploi en échange d’un paiement est interdit ici.'
        } },
      { k:'attestation', l:'Attestation délivrée', req:true,
        o:['Attestation de fin de formation','Certificat reconnu / agréé','Aucune attestation'],
        h:'Un agrément d’État se vérifie : ne l’annoncez que si vous l’avez, sous peine de perdre toute crédibilité.' },
      { k:'dureeCours', l:'Durée', o:['Une séance','Quelques séances','1 mois','3 mois','6 mois','1 an','Selon le besoin'] },
      { k:'effectif', l:'Effectif par groupe', o:['Cours particulier','2 à 5 élèves','6 à 15 élèves','Plus de 15 élèves'] }
    ] as ChampCourt[]).concat(communs('une formation'))
  },

  'Événementiel': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Tarif à partir de',
    sansCouleur: 'Montrez vos prestations passées : sur l’événementiel, tout se décide sur les photos.',
    titre: function (S: Vals) { return [(S.prestaEvt || []).slice(0,2).join(', '), S.typeEvt].filter(Boolean).join(' · ') },
    champs: ([
      { k:'prestaEvt', l:'Ce que vous proposez', multi:true, req:true,
        o:['Traiteur','Décoration','Location de matériel (chaises, bâches)','Sonorisation','DJ / animation','Photographie','Vidéo / drone','Wedding planner','Location de salle','Sécurité','Hôtesses / protocole','Pâtisserie / gâteaux','Location de voiture de cérémonie','Groupe / orchestre'] },
      { k:'typeEvt', l:'Types d’événements', multi:true, req:true,
        o:['Mariage','Baptême','Anniversaire','Funérailles','Séminaire d’entreprise','Lancement / inauguration','Concert','Fête de fin d’année','Cérémonie traditionnelle'] },
      { k:'capacite', l:'Capacité', req:true,
        o:['Moins de 50 personnes','50 à 150 personnes','150 à 500 personnes','Plus de 500 personnes'] },
      { k:'reservation', l:'Réservation', req:true,
        o:['Sans acompte','Acompte pour bloquer la date','Contrat écrit obligatoire'],
        h:'Sur une date de mariage, un contrat écrit protège les deux parties. C’est un argument de sérieux.' },
      { k:'annulation', l:'En cas d’annulation', req:true,
        o:['Acompte remboursé intégralement','Acompte remboursé en partie','Acompte non remboursable','Report de date possible'],
        h:function (S: Vals) {
          if (/non remboursable/.test(S.annulation || ''))
            return '!Annoncez-le très clairement, et par écrit. Un acompte de mariage non remboursable découvert après coup finit toujours mal.'
          return 'Le dire d’avance évite le litige le plus fréquent du métier.'
        } }
    ] as ChampCourt[]).concat(communs('une prestation'))
  },

  'Transport & Déménagement': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Tarif à partir de',
    sansCouleur: 'Photographiez votre véhicule, plaque lisible ou masquée : c’est ce qui rassure avant de confier des affaires.',
    titre: function (S: Vals) { return [(S.prestaT || []).slice(0,2).join(', '), S.vehicule].filter(Boolean).join(' · ') },
    champs: ([
      { k:'prestaT', l:'Ce que vous transportez', multi:true, req:true,
        o:['Déménagement complet','Transport de meubles','Livraison de colis','Course rapide moto','Transport de marchandises','Transport de personnes','Location avec chauffeur','Transport de matériaux','Déblai / évacuation'] },
      { k:'vehicule', l:'Véhicule', req:true,
        o:['Moto / tricycle','Voiture','Camionnette / 4×4','Camion 3,5 t','Camion 10 t','Camion 20 t et plus','Benne','Plusieurs véhicules'] },
      { k:'uniteT', l:'Le tarif est', req:true,
        o:['Au voyage','À la journée','Au kilomètre','À l’heure','Au volume (m³)','Sur devis'] },

      { k:'assuranceT', l:'Assurance des biens transportés', req:true,
        o:['Marchandises assurées','Assurance du véhicule uniquement','Aucune assurance'],
        alerte:{ bon:'Marchandises assurées',
          ok:[],
          texteBon:'Les biens transportés sont couverts. C’est rare ici, et c’est ce qui distingue un vrai professionnel — demandez l’attestation.',
          texteMauvais:'Les biens transportés ne sont pas couverts. En cas de casse ou de vol pendant le trajet, rien ne vous sera remboursé : faites l’inventaire photo avant le chargement.' },
        h:function (S: Vals) {
          if (/Aucune assurance/.test(S.assuranceT || ''))
            return '!Sans assurance marchandises, une casse est à votre charge ou à celle du client. Un inventaire photo signé avant chargement vous protège tous les deux.'
          return 'Très peu de déménageurs assurent les biens ici. Si vous le faites, c’est votre meilleur argument — mettez-le dans le titre.'
        } },
      { k:'mainOeuvre', l:'Main-d’œuvre', req:true,
        o:['Chauffeur seul','Chauffeur + 1 aide','Chauffeur + équipe','Équipe complète avec emballage'] },
      { k:'etages', l:'Étages', multi:true,
        o:['Rez-de-chaussée uniquement','Avec ascenseur','Sans ascenseur','Supplément par étage'] },
      { k:'licence', l:'Autorisation de transport', req:true,
        when:function (S: Vals) { return (S.prestaT || []).indexOf('Transport de personnes') > -1 },
        o:['Licence de transport en règle','En cours de régularisation','Aucune licence'],
        h:'Le transport de personnes exige une licence et une assurance passagers. Sans elles, un accident n’est couvert par personne.' }
    ] as ChampCourt[]).concat(communs('un transport'))
  },

  'Informatique & Digital': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Tarif',
    sansCouleur: 'Montrez vos réalisations : un portfolio vend mieux que n’importe quelle description.',
    titre: function (S: Vals) { return [(S.prestaI || []).slice(0,2).join(', '), S.uniteI].filter(Boolean).join(' · ') },
    champs: ([
      { k:'prestaI', l:'Ce que vous proposez', multi:true, req:true,
        o:['Création de site web','Boutique en ligne','Application mobile','Community management','Publicité en ligne','Référencement (SEO)','Graphisme / logo','Montage vidéo','Photographie produit','Saisie / secrétariat','Formation bureautique','Installation réseau','Maintenance de parc','Développement sur mesure','Hébergement / nom de domaine'],
        h:'La réparation d’appareils n’est pas ici : elle vit dans Électronique → Réparation & Dépannage.' },
      { k:'uniteI', l:'Le tarif est', req:true,
        o:['Au projet','À l’heure','À la journée','Au mois (abonnement)','Sur devis'] },
      { k:'livrable', l:'Ce qui est livré', multi:true, req:true,
        o:['Code source','Accès administrateur','Fichiers sources (PSD, AI…)','Formation à l’usage','Documentation','Maintenance incluse un temps','Nom de domaine','Hébergement la première année'],
        h:'Sur du numérique, c’est LE point de litige : qui garde le code, les accès et le nom de domaine. Dites-le d’emblée.' },
      { k:'delaiI', l:'Délai habituel', req:true,
        o:['Moins de 48 h','Une semaine','2 à 4 semaines','1 à 3 mois','Selon le projet'] },
      { k:'revisions', l:'Corrections comprises', req:true,
        o:['Corrections illimitées','3 séries de corrections','2 séries de corrections','1 seule série','Aucune correction comprise'],
        h:'Fixer un nombre de corrections évite le projet qui ne finit jamais — et c’est aussi ce qui rassure le client.' }
    ] as ChampCourt[]).concat(communs('un projet'))
  },

  'Couture & Artisanat': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Tarif à partir de',
    sansCouleur: 'Montrez vos modèles finis, portés si possible. En couture, tout se décide là.',
    titre: function (S: Vals) { return [(S.prestaC || []).slice(0,2).join(', '), S.delaiC].filter(Boolean).join(' · ') },
    champs: ([
      { k:'prestaC', l:'Ce que vous faites', multi:true, req:true,
        o:['Couture sur mesure femme','Couture sur mesure homme','Tenue traditionnelle','Robe de mariée','Tenue de cérémonie','Uniformes / tenues de travail','Retouches','Broderie','Perlage','Sacs et accessoires','Chaussures','Coiffure / tresses','Maroquinerie','Bijoux artisanaux','Sculpture / bois','Poterie','Vannerie'] },
      { k:'tissuC', l:'Le tissu', req:true,
        o:['Fourni par le client','Je le fournis, compris dans le prix','Je le fournis, facturé à part','Au choix du client'],
        h:'Le malentendu le plus courant du métier. Dites-le avant de prendre les mesures.' },
      { k:'mesures', l:'Prise de mesures', req:true,
        o:['Chez moi','À domicile chez le client','Le client envoie ses mesures','Modèle standard, pas de mesures'] },
      { k:'delaiC', l:'Délai de confection', req:true,
        o:['Moins de 3 jours','3 à 7 jours','1 à 2 semaines','2 à 4 semaines','Plus d’un mois','Selon la pièce'],
        h:'Le délai tenu est ce qui fait revenir un client — et ce qui le fait partir. Annoncez large plutôt que serré.' },
      { k:'retouches', l:'Retouches après essayage', req:true,
        o:['Comprises et illimitées','Deux retouches comprises','Une retouche comprise','Facturées à part'],
        h:'Sur du sur-mesure, promettre au moins une retouche est le minimum attendu.' },
      { k:'essayage', l:'Essayage', req:true,
        o:['Un essayage prévu','Deux essayages prévus','Pas d’essayage'] }
    ] as ChampCourt[]).concat(communs('une commande'))
  }
}

export const SERVICES: DonneesCat = {
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
