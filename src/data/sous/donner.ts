/* ==========================================================================
 *  À DONNER — ce qui se donne, gratuitement, à qui en a besoin.
 *
 *  C'est la seule rubrique du site où il n'y a pas de prix. Le prix y est
 *  forcé à zéro par le formulaire, et l'annonce s'affiche « Gratuit ».
 *
 *  TROIS RÈGLES, ET ELLES TIENNENT TOUTE LA RUBRIQUE.
 *
 *  1. UN DON NE SE PAIE PAS — MÊME PAS « JUSTE LE TRANSPORT ». C'est
 *     l'arnaque de ce rayon, partout dans le monde et ici aussi : on annonce
 *     un frigo, un lot de vêtements, un ordinateur « gratuit », puis on
 *     réclame 5 000 F de transport par Mobile Money avant la remise. Le
 *     transfert part, l'objet n'existe pas. Une annonce qui demande de
 *     l'argent, à quelque titre que ce soit, ne se publie pas ici.
 *
 *  2. L'ARGENT NE SE DONNE PAS PAR PETITE ANNONCE. Ni dans un sens ni dans
 *     l'autre : le faux donateur qui « offre 500 000 F » réclame des frais de
 *     transfert au bout de trois messages, et l'appel aux dons qu'on ne peut
 *     pas vérifier fait perdre leur argent à des gens qui en ont peu.
 *     Chap.ci n'est pas une plateforme de collecte, et ne prétend pas savoir
 *     vérifier une détresse. Les objets, oui. L'argent, non.
 *
 *  3. CE QUI EST INTERDIT À LA VENTE RESTE INTERDIT AU DON. Un médicament
 *     donné reste un médicament vendu hors pharmacie ; un produit périmé
 *     donné rend malade exactement pareil. Le don n'est pas une porte de
 *     sortie des règles du site.
 *
 *  Le reste — un lot de vêtements après un déménagement, les cahiers de
 *  l'année passée à la rentrée, un lit d'enfant devenu trop petit, un coup de
 *  main — est ce que cette rubrique existe pour rendre facile.
 * ========================================================================== */
import type { ChampCourt, DonneesCat, SchemaSous, Vals } from './contrat'
import { enregistrerCouleurs, type Couleur } from '../couleurs'


const SOUS = ['Vêtements & chaussures', 'Meubles & électroménager',
              'Fournitures & matériel scolaire', 'Bébé & enfant',
              'Nourriture & hygiène', 'Coup de main & services', 'Autres objets']

/* Aucune couleur : on ne décline pas un don en coloris. Le moteur en réclame
   une liste, on lui en donne une vide. */
const PALETTE_BASE: Couleur[] = []
const TOUTES_COULEURS: Couleur[] = []

/* -------------------------------------------------------------------------
 *  Blocs partagés
 * ------------------------------------------------------------------------- */

/* LA question de la rubrique. Un don qui se paie n'est pas un don. */
function contrepartie(): ChampCourt {
  return { k:'contrepartie', l:'Ce que vous demandez en échange', req:true,
    o:['Rien du tout — c’est un don',
       'Rien, mais la personne vient chercher elle-même',
       'Une participation aux frais de transport',
       'Une petite somme, symbolique'],
    alerte:{ bon:'Rien du tout — c’est un don',
      ok:['Rien, mais la personne vient chercher elle-même'],
      texteBon:'Don sans contrepartie. Si on vous réclame quoi que ce soit en cours de route, n’envoyez rien et signalez l’annonce.',
      texteMauvais:'ARNAQUE. « C’est gratuit, payez juste le transport » est le piège le plus courant de ce rayon. N’envoyez jamais d’argent pour recevoir un don.',
      textes:{
        'Rien, mais la personne vient chercher elle-même':'Don à retirer sur place, à vos frais de déplacement. C’est normal — mais rien ne se verse au donateur, jamais.'
      } },
    bloque:['Une participation aux frais de transport','Une petite somme, symbolique'],
    motifBloc:'Un don ne se paie pas, même « juste le transport ». Si vous voulez une contrepartie, publiez plutôt une annonce de vente à petit prix.',
    h:function (S: Vals) {
      if (/participation aux frais|petite somme/.test(S.contrepartie || ''))
        return '!Demander de l’argent pour un don, c’est exactement la formule des faux donateurs — et un transfert Mobile Money ne se récupère jamais. Si votre objet vaut quelque chose, il a sa place dans la rubrique normale, avec son prix affiché : c’est plus honnête et cela vous protège aussi.'
      return 'Un don ne coûte rien à celui qui le reçoit. S’il doit venir le chercher, dites-le simplement : cela ne compte pas comme un paiement.'
    } }
}

/* L'argent ne se donne pas par petite annonce — ni dans un sens ni dans l'autre. */
function natureDon(): ChampCourt {
  return { k:'natureDon', l:'Ce que vous donnez', req:true,
    o:['Un objet, un lot d’objets',
       'Du temps, un service, un coup de main',
       'De l’argent (espèces, Mobile Money)',
       'Je cherche à recevoir de l’argent'],
    bloque:['De l’argent (espèces, Mobile Money)','Je cherche à recevoir de l’argent'],
    motifBloc:'Chap.ci n’est pas une plateforme de collecte : les dons et les appels aux dons en argent ne s’y publient pas. Les objets et les services, oui.',
    h:function (S: Vals) {
      if (/argent/.test(S.natureDon || ''))
        return '!Nous ne publions aucune annonce d’argent, donné ou demandé. Le « donateur » qui offre une grosse somme réclame des frais de transfert au troisième message, et l’appel aux dons ne peut pas être vérifié depuis ici. Donnez un objet, du matériel, un service : cela se voit, cela se remet en main propre, et cela aide vraiment.'
      return 'Les objets et les coups de main se donnent ici. L’argent, non — ni offert, ni demandé.'
    } }
}

/* Où et comment la remise se fait. Rien ne s'envoie contre paiement. */
function remise(): ChampCourt {
  return { k:'remise', l:'Comment se fait la remise', req:true,
    o:['En main propre, dans un lieu public',
       'La personne vient chercher chez moi',
       'Je peux déposer dans la commune',
       'Par transporteur, à la charge du bénéficiaire'],
    h:function (S: Vals) {
      if (/transporteur/.test(S.remise || ''))
        return '!Un envoi par transporteur est le terrain de l’arnaque : personne ne se voit, et le « transport » sert de prétexte à réclamer de l’argent. Préférez la main propre chaque fois que c’est possible.'
      if (/vient chercher chez moi/.test(S.remise || ''))
        return 'Si vous recevez chez vous, convenez d’un créneau en journée et ne restez pas seul. Un lieu public reste plus simple pour tout le monde.'
      return 'Le lieu public en journée est ce qui convient le mieux, des deux côtés.'
    } }
}

/* À qui, et sur quel critère. Aucune réponse ne bloque : c'est le donateur qui
   choisit. Mais l'écrire évite trente messages. */
function pourQui(): ChampCourt {
  return { k:'pourQui', l:'À qui vous souhaitez donner', req:true,
    o:['À qui en a besoin, premier arrivé','Une famille en difficulté','Un élève ou un étudiant',
       'Une association, une ONG, un orphelinat','Un artisan qui veut s’installer','Peu importe'],
    h:'Le dire évite d’avoir à répondre trente fois. Personne n’a à vous prouver quoi que ce soit : c’est vous qui choisissez.' }
}

/* Combien il y en a. Un lot et une pièce unique n'appellent pas les mêmes messages. */
function quantite(): ChampCourt {
  return { k:'quantiteDon', l:'Quantité', req:true,
    o:['Une seule pièce','2 à 5 pièces','Un petit lot (5 à 20)','Un gros lot (plus de 20)','Un carton complet','Plusieurs cartons'],
    h:'Un gros lot trouve preneur plus vite auprès d’une association que d’un particulier. Dites-le dans le titre.' }
}

const ETAT_DON = ['Neuf, jamais servi', 'Très bon état', 'Bon état, traces d’usage',
                  'Usé mais utilisable', 'À réparer', 'Pour pièces']

const SCHEMAS: Record<string, SchemaSous> = {

  /* ================================================================== */
  'Vêtements & chaussures': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Prix',
    sansCouleur: 'Étalez le lot et photographiez-le tel qu’il est, sans le trier pour la photo. Une personne qui reçoit préfère savoir à quoi s’attendre.',
    titre: function (S: Vals) { return [S.typeVet, S.tailleVet, S.quantiteDon].filter(Boolean).join(' · ') },
    champs: [
      natureDon(),
      contrepartie(),
      { k:'typeVet', l:'Type de vêtements', req:true, multi:true,
        o:['Vêtements femme','Vêtements homme','Vêtements enfant','Vêtements bébé','Chaussures','Sacs',
           'Pagnes & tissus','Tenues de travail','Uniformes scolaires','Vêtements de maternité','Manteaux & vestes'] },

      // L'hygiène : la seule limite de ce rayon.
      { k:'hygieneVet', l:'État d’hygiène', req:true,
        o:['Lavé et prêt à porter','Propre, à relaver par précaution','Non lavé','Sous-vêtements déjà portés'],
        alerte:{ bon:'Lavé et prêt à porter',
          ok:['Propre, à relaver par précaution'],
          texteBon:'Lot lavé et prêt à porter. C’est ce qui fait la différence entre un don et un débarras.',
          texteMauvais:'Lot non lavé : lavez-le avant de le porter, sans exception.',
          textes:{
            'Propre, à relaver par précaution':'Propre, mais un passage en machine avant de porter reste la bonne habitude.'
          } },
        bloque:['Sous-vêtements déjà portés'],
        motifBloc:'Les sous-vêtements déjà portés ne se donnent pas : c’est une question d’hygiène, et cela vaut aussi pour un don.',
        h:function (S: Vals) {
          if (/Sous-vêtements/.test(S.hygieneVet || ''))
            return '!Culottes, slips, soutiens-gorge et chaussettes déjà portés ne se redonnent pas. Neufs et sous emballage, aucun problème.'
          if (S.hygieneVet === 'Non lavé')
            return '!Laver le lot avant de le donner prend une machine et change tout pour celui qui le reçoit. Faites-le si vous le pouvez.'
          return 'Un lot lavé et plié part en une journée. Un lot en vrac reste en ligne des semaines.'
        } },

      { k:'tailleVet', l:'Tailles', multi:true,
        o:['Bébé (0-2 ans)','Enfant (3-12 ans)','Ado','XS','S','M','L','XL','XXL','3XL et plus','Tailles mélangées'] },
      { k:'pointureVet', l:'Pointures',
        when:function (S: Vals) { return (S.typeVet || []).indexOf('Chaussures') > -1 },
        multi:true,
        o:['Enfant 20-30','Enfant 31-35','36-38','39-41','42-44','45 et plus','Pointures mélangées'] },
      { k:'etatVet', l:'État général', req:true, o:ETAT_DON },
      { k:'saisonVet', l:'Adapté à', multi:true,
        o:['Tous les jours','Travail','École','Cérémonie','Sport','Pays froid'],
        h:'Les vêtements pour pays froid partent très vite auprès de ceux qui préparent un départ. Signalez-les.' },
      quantite(),
      pourQui(),
      remise()
    ]
  },

  /* ================================================================== */
  'Meubles & électroménager': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Prix',
    sansCouleur: 'Photographiez le meuble en entier, chez vous, avec ce qu’il y a autour. On doit pouvoir juger son encombrement d’un coup d’œil.',
    titre: function (S: Vals) { return [S.typeMeuble, S.fonctionne].filter(Boolean).join(' · ') },
    champs: [
      natureDon(),
      contrepartie(),
      { k:'typeMeuble', l:'Ce que vous donnez', req:true,
        o:['Lit / matelas','Armoire','Commode','Table','Chaises','Canapé / fauteuil','Étagère','Bureau',
           'Réfrigérateur','Congélateur','Cuisinière','Four','Micro-ondes','Machine à laver','Ventilateur',
           'Climatiseur','Téléviseur','Vaisselle & ustensiles','Rideaux & linge de maison','Autre meuble'],
        libre:'Autre meuble' },

      { k:'fonctionne', l:'État de marche', req:true,
        when:function (S: Vals) { return /Réfrigérateur|Congélateur|Cuisinière|Four|Micro-ondes|Machine|Ventilateur|Climatiseur|Téléviseur/.test(S.typeMeuble || '') },
        o:['Fonctionne, essai possible sur place','Fonctionne, petit défaut connu','En panne — à réparer','Je ne sais pas, jamais essayé'],
        alerte:{ bon:'Fonctionne, essai possible sur place',
          ok:['Fonctionne, petit défaut connu'],
          texteBon:'L’appareil s’essaie sur place avant d’être emporté. Branchez-le devant la personne : cela règle tout.',
          texteMauvais:'Appareil en panne ou non essayé. Il est donné tel quel : n’engagez pas de frais de transport avant de savoir ce qu’il vaut.',
          textes:{
            'Fonctionne, petit défaut connu':'Petit défaut annoncé : c’est honnête, et cela évite une déception après le transport.'
          } },
        h:function (S: Vals) {
          if (/En panne|jamais essayé/.test(S.fonctionne || ''))
            return 'Dites-le franchement dans le titre : « en panne, pour pièces ». Beaucoup de réparateurs cherchent exactement cela, et personne ne se déplace pour rien.'
          return 'Un appareil qu’on branche devant la personne ne se discute plus. C’est le meilleur geste de ce rayon.'
        } },

      { k:'etatMeuble', l:'État général', req:true, o:ETAT_DON },
      { k:'encombrement', l:'Encombrement', req:true,
        o:['Se porte à une personne','Se porte à deux','Se démonte','Camionnette nécessaire','Kia / camion nécessaire'],
        h:'C’est LA question qui décide si quelqu’un se déplace. Un lit à deux places sans camionnette ne trouve pas preneur.' },
      { k:'delaiRetrait', l:'Délai de retrait', req:true,
        o:['Aujourd’hui ou demain','Dans la semaine','Dans le mois','Sans urgence'],
        h:function (S: Vals) {
          if (/Aujourd’hui/.test(S.delaiRetrait || ''))
            return 'Urgent : écrivez-le aussi dans le titre, sinon personne ne le voit à temps.'
          return ''
        } },
      quantite(),
      pourQui(),
      remise()
    ]
  },

  /* ================================================================== */
  'Fournitures & matériel scolaire': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Prix',
    sansCouleur: 'Photographiez le lot posé à plat. À la rentrée, une photo claire d’un lot de cahiers part dans l’heure.',
    titre: function (S: Vals) { return [S.typeScol, S.niveauScol, S.quantiteDon].filter(Boolean).join(' · ') },
    champs: [
      natureDon(),
      contrepartie(),
      { k:'typeScol', l:'Ce que vous donnez', req:true, multi:true,
        o:['Cahiers','Livres scolaires','Romans & BD','Cartable / sac','Trousse & petit matériel','Uniformes',
           'Calculatrice','Ordinateur portable','Tablette','Matériel de dessin','Instruments de géométrie',
           'Dictionnaire','Manuels universitaires','Blouse'] },
      { k:'niveauScol', l:'Niveau', multi:true, req:true,
        o:['Maternelle','Primaire (CP-CM2)','Collège (6e-3e)','Lycée (2nde-Tle)','Université','Formation professionnelle','Tous niveaux'] },
      { k:'matiereScol', l:'Matières concernées', multi:true,
        when:function (S: Vals) { return (S.typeScol || []).some(function (x: string) { return /Livres scolaires|Manuels/.test(x) }) },
        o:['Français','Mathématiques','Physique-Chimie','SVT','Histoire-Géographie','Anglais','Philosophie',
           'Économie','Informatique','Droit','Médecine','Toutes matières'] },
      { k:'etatScol', l:'État', req:true, o:ETAT_DON },
      { k:'anneeScol', l:'Programme',
        when:function (S: Vals) { return (S.typeScol || []).some(function (x: string) { return /Livres scolaires|Manuels/.test(x) }) },
        o:['Programme en cours','Programme récent (2 à 3 ans)','Programme ancien','Je ne sais pas'],
        h:'Un manuel au programme actuel vaut de l’or à la rentrée. Un ancien programme sert quand même : dites-le, l’élève choisira.' },
      quantite(),
      pourQui(),
      remise()
    ]
  },

  /* ================================================================== */
  'Bébé & enfant': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Prix',
    sansCouleur: 'Photographiez l’article entier, les sangles et l’étiquette de norme s’il y en a une. C’est ce que regarde un parent prudent.',
    titre: function (S: Vals) { return [S.typeBebeDon, S.ageBebeDon].filter(Boolean).join(' · ') },
    champs: [
      natureDon(),
      contrepartie(),
      { k:'typeBebeDon', l:'Ce que vous donnez', req:true,
        o:['Poussette','Siège auto','Lit à barreaux','Berceau','Parc','Chaise haute','Baignoire','Table à langer',
           'Porte-bébé','Stérilisateur','Chauffe-biberon','Jouets','Livres pour enfants','Vêtements bébé',
           'Couches non entamées','Tapis d’éveil','Trotteur'] },

      // Un siège auto accidenté a une structure fragilisée qui ne se voit pas.
      { k:'accidentSiege', l:'Ce siège a-t-il subi un accident ?', req:true,
        when:function (S: Vals) { return /Siège auto/.test(S.typeBebeDon || '') },
        o:['Non, jamais','Oui, un choc léger','Oui, un accident','Je ne sais pas — je l’ai eu d’occasion'],
        alerte:{ bon:'Non, jamais',
          texteBon:'Siège jamais accidenté. Vérifiez tout de même la date de fabrication sous la coque : au-delà de dix ans, le plastique se fragilise.',
          texteMauvais:'À ÉCARTER. Un siège auto ayant subi un choc a une structure fragilisée qui ne se voit pas, et il ne protège plus.' },
        bloque:['Oui, un choc léger','Oui, un accident','Je ne sais pas — je l’ai eu d’occasion'],
        motifBloc:'Un siège auto ayant subi un choc — ou dont l’histoire est inconnue — ne protège plus l’enfant. Il ne se donne pas.',
        h:function (S: Vals) {
          if (S.accidentSiege && S.accidentSiege !== 'Non, jamais')
            return '!Après un choc, même léger, la coque d’un siège auto se fissure de l’intérieur sans rien laisser voir. Le siège paraît neuf et ne retient plus l’enfant. Cette annonce ne sera pas publiée : ce siège se jette, il ne se transmet pas.'
          return 'C’est la seule question qui compte sur un siège auto d’occasion, et elle ne se lit sur aucune photo. Merci d’y répondre honnêtement.'
        } },

      { k:'rappelBebeDon', l:'Rappel fabricant', req:true,
        when:function (S: Vals) { return /Poussette|Lit à barreaux|Berceau|Parc|Chaise haute|Trotteur|Porte-bébé/.test(S.typeBebeDon || '') },
        o:['Aucun rappel connu','Article concerné par un rappel','Je ne sais pas'],
        bloque:['Article concerné par un rappel'],
        motifBloc:'Un article de puériculture faisant l’objet d’un rappel fabricant ne peut pas être remis en circulation, même gratuitement.',
        h:function (S: Vals) {
          if (/rappel/.test(S.rappelBebeDon || '') && !/Aucun/.test(S.rappelBebeDon || ''))
            return '!Un article rappelé a été retiré parce qu’il a blessé un enfant. Le donner le remet en circulation. Cette annonce ne sera pas publiée.'
          return 'Le rappel se cherche avec la marque et le modèle. Deux minutes, et cela peut éviter un accident.'
        } },
      { k:'hygieneBebeDon', l:'Hygiène', req:true,
        o:['Nettoyé, housse lavée','Propre, à nettoyer par précaution','Non nettoyé','Tétines, biberons ou sucettes déjà utilisés'],
        bloque:['Tétines, biberons ou sucettes déjà utilisés'],
        motifBloc:'Tétines, biberons et sucettes déjà utilisés ne se redonnent pas : ils ne se stérilisent pas complètement.',
        h:function (S: Vals) {
          if (/Tétines/.test(S.hygieneBebeDon || ''))
            return '!Une tétine ou un biberon déjà utilisé garde des micro-fissures où les bactéries se logent. Neufs et sous emballage, aucun problème.'
          return 'Un article de puériculture se nettoie toujours avant réemploi, même s’il paraît propre.'
        } },
      { k:'ageBebeDon', l:'Âge concerné', req:true, multi:true,
        o:['0-6 mois','6-12 mois','1-2 ans','2-4 ans','4-8 ans','8-12 ans'] },
      { k:'etatBebeDon', l:'État', req:true, o:ETAT_DON },
      { k:'completBebeDon', l:'Fourni avec', multi:true,
        o:['Notice','Housse','Sangles complètes','Matelas','Pièces de rechange','Emballage d’origine','Rien de plus'] },
      quantite(),
      pourQui(),
      remise()
    ]
  },

  /* ================================================================== */
  'Nourriture & hygiène': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Prix',
    sansCouleur: 'Photographiez les emballages ET les dates. Sur ce rayon, la date est l’information principale.',
    titre: function (S: Vals) { return [S.typeNourr, S.peremptionDon].filter(Boolean).join(' · ') },
    champs: [
      natureDon(),
      contrepartie(),
      { k:'typeNourr', l:'Ce que vous donnez', req:true,
        o:['Riz, pâtes, céréales','Conserves','Huile','Sucre, sel, farine','Lait en poudre','Fruits & légumes',
           'Produits frais','Plat cuisiné maison','Eau & boissons','Savon & hygiène','Couches bébé',
           'Serviettes hygiéniques','Produits d’entretien','Médicaments'],

        // Le don ne contourne pas le monopole pharmaceutique.
        bloque:['Médicaments'],
        motifBloc:'Un médicament donné reste un médicament remis hors pharmacie : c’est interdit en Côte d’Ivoire, au don comme à la vente.',
        h:function (S: Vals) {
          if (/Médicaments/.test(S.typeNourr || ''))
            return '!La vente et la remise de médicaments sont réservées aux pharmaciens, et un médicament mal conservé sous 30 °C devient dangereux. Le don ne change rien à cette règle. Cette annonce ne sera pas publiée.'
          return ''
        } },

      { k:'peremptionDon', l:'Date de péremption', req:true,
        o:['Plus de 6 mois','1 à 6 mois','Moins d’un mois','À consommer dans les jours qui viennent','Dépassée','Sans date (produit brut)'],
        alerte:{ bon:'Plus de 6 mois',
          ok:['1 à 6 mois','Moins d’un mois','À consommer dans les jours qui viennent','Sans date (produit brut)'],
          texteBon:'Date largement valable.',
          texteMauvais:'À ÉCARTER. Un produit dont la date est dépassée ne se donne pas : il rend malade exactement comme s’il avait été vendu.',
          textes:{
            'Moins d’un mois':'Date proche : dites-le en clair, la personne saura qu’il faut consommer vite.',
            'À consommer dans les jours qui viennent':'À consommer tout de suite. Écrivez-le dans le titre, et donnez-le aujourd’hui.',
            'Sans date (produit brut)':'Produit brut sans date : jugez à l’odeur et à l’aspect, et dites franchement depuis quand vous l’avez.'
          } },
        bloque:['Dépassée'],
        motifBloc:'Un produit périmé ne se donne pas. Le don n’est pas une façon d’écouler ce qui ne se vend plus.',
        h:function (S: Vals) {
          if (S.peremptionDon === 'Dépassée')
            return '!Donner un produit périmé, c’est donner une intoxication. Cette annonce ne sera pas publiée.'
          return 'La date figure sur l’emballage, souvent près du code-barres. Photographiez-la : c’est ce que la personne regardera en premier.'
        } },

      { k:'chaineFroid', l:'Conservation', req:true,
        when:function (S: Vals) { return /Produits frais|Plat cuisiné|Lait en poudre|Fruits/.test(S.typeNourr || '') },
        o:['Conservé au froid depuis le départ','Sorti du froid il y a moins de deux heures','Hors froid depuis plus de deux heures','Ne nécessite pas de froid'],
        bloque:['Hors froid depuis plus de deux heures'],
        motifBloc:'Un produit frais ou un plat cuisiné laissé plus de deux heures hors du froid ne se donne pas.',
        h:function (S: Vals) {
          if (/plus de deux heures/.test(S.chaineFroid || ''))
            return '!Sous 30 °C, deux heures suffisent à rendre un plat dangereux. Cette annonce ne sera pas publiée — et ne donnez pas ce plat.'
          if (/Plat cuisiné/.test(S.typeNourr || ''))
            return 'Un plat cuisiné se donne le jour même, encore chaud ou sorti du froid. Dites l’heure à laquelle il a été préparé.'
          return ''
        } },
      { k:'emballageDon', l:'Emballage', req:true,
        o:['Neuf, scellé d’origine','Ouvert mais refermé proprement','Entamé','En vrac'],
        h:function (S: Vals) {
          if (/Entamé|En vrac/.test(S.emballageDon || ''))
            return 'Un produit entamé ne se refuse pas, mais dites-le : la personne décidera elle-même.'
          return 'Un produit scellé rassure et se garde plus longtemps.'
        } },
      quantite(),
      pourQui(),
      remise()
    ]
  },

  /* ================================================================== */
  'Coup de main & services': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Prix',
    service: true,
    sansCouleur: 'Une photo n’est pas indispensable ici. Si vous en mettez une, montrez votre atelier ou votre matériel, jamais des visages d’enfants.',
    titre: function (S: Vals) { return [S.typeAide, S.dispoAide].filter(Boolean).join(' · ') },
    champs: [
      natureDon(),
      contrepartie(),
      { k:'typeAide', l:'Le coup de main que vous proposez', req:true,
        o:['Cours et soutien scolaire','Alphabétisation','Aide à un déménagement','Petite réparation',
           'Électricité / plomberie de dépannage','Couture & retouches','Coiffure','Informatique & téléphone',
           'Rédaction de CV','Traduction','Transport occasionnel','Garde ponctuelle','Aide administrative',
           'Aide à une personne âgée','Bricolage','Jardinage','Soins ou traitement médical'],

        // Poser un acte de soin sans être soignant, gratuitement, reste un acte
        // de soin. C'est le même interdit que dans Santé & Bien-être.
        bloque:['Soins ou traitement médical'],
        motifBloc:'Proposer des soins ou un traitement médical est réservé aux professionnels de santé, que ce soit payant ou gratuit.',
        h:function (S: Vals) {
          if (/Soins ou traitement/.test(S.typeAide || ''))
            return '!Un soin gratuit reste un soin : il engage la santé de quelqu’un et il est réservé aux professionnels. Cette annonce ne sera pas publiée. Une aide à domicile non médicale — courses, ménage, compagnie — est en revanche la bienvenue.'
          return 'Décrivez ce que vous savez faire, simplement. Ce sont les propositions concrètes qui trouvent preneur.'
        } },

      { k:'dispoAide', l:'Quand vous êtes disponible', req:true, multi:true,
        o:['En semaine, en journée','En semaine, en soirée','Le samedi','Le dimanche','Pendant les vacances scolaires','Sur rendez-vous'] },
      { k:'lieuAide', l:'Où', req:true, multi:true,
        o:['Chez moi','Chez la personne','Dans un lieu public','À distance, par téléphone ou internet','Dans ma commune uniquement'] },
      { k:'frequenceAide', l:'Fréquence', req:true,
        o:['Une seule fois','Quelques heures par semaine','Régulièrement, à définir','Selon les demandes'] },
      { k:'publicAide', l:'Pour qui', multi:true,
        o:['Élèves','Étudiants','Adultes','Personnes âgées','Associations','Tout le monde'] },

      // Le seul faux don de service : celui qui sert d'appât commercial.
      { k:'appatAide', l:'Est-ce lié à une vente ?', req:true,
        o:['Non — c’est gratuit, sans condition',
           'Gratuit, mais il faut acheter quelque chose chez moi',
           'Gratuit la première fois, payant ensuite'],
        alerte:{ bon:'Non — c’est gratuit, sans condition',
          ok:['Gratuit la première fois, payant ensuite'],
          texteBon:'Gratuit et sans condition.',
          texteMauvais:'Ce n’est pas un don : c’est une offre commerciale. Elle a sa place dans la rubrique Services, pas ici.',
          textes:{
            'Gratuit la première fois, payant ensuite':'Première fois offerte, payant ensuite. C’est honnête si c’est dit — et cela reste une offre commerciale : la rubrique Services lui va mieux.'
          } },
        bloque:['Gratuit, mais il faut acheter quelque chose chez moi'],
        motifBloc:'Un service conditionné à un achat est une offre commerciale : publiez-la dans Services, où elle sera vue par les bons acheteurs.',
        h:function (S: Vals) {
          if (/il faut acheter/.test(S.appatAide || ''))
            return '!Un don qui oblige à acheter n’est pas un don. Votre offre est légitime — elle sera simplement mieux placée dans Services, où les gens viennent justement pour acheter.'
          return ''
        } },
      pourQui(),
      remise()
    ]
  },

  /* ================================================================== */
  'Autres objets': {
    couleurs: false, etat: false, livraison: false, prixLabel: 'Prix',
    sansCouleur: 'Photographiez l’objet tel qu’il est, avec ses défauts. Un don décrit honnêtement trouve preneur ; un don embelli fait perdre son temps à tout le monde.',
    titre: function (S: Vals) { return [S.natureObjet, S.etatObjet].filter(Boolean).join(' · ') },
    champs: [
      natureDon(),
      contrepartie(),
      { k:'natureObjet', l:'Ce que vous donnez', t: 'text' as const, req:true,
        ph:'Ex : vélo d’enfant, cartons de déménagement, plantes en pot',
        h:'Nommez l’objet précisément : c’est ce que la personne tape dans la recherche.' },
      { k:'familleObjet', l:'Famille d’objets', req:true,
        o:['Sport & loisirs','Outils & bricolage','Informatique & téléphonie','Livres & médias','Décoration',
           'Jardinage & plantes','Matériel de commerce','Emballages & cartons','Matériaux de construction',
           'Instruments de musique','Animaux — accessoires','Autre'], libre:'Autre' },
      { k:'etatObjet', l:'État', req:true, o:ETAT_DON },
      { k:'fonctionneObjet', l:'Fonctionnement',
        o:['Fonctionne, essai possible','Fonctionne, petit défaut','En panne — pour pièces','Sans mécanisme'],
        h:'Si l’objet a un moteur, une batterie ou une prise, dites s’il marche. Cela évite un déplacement pour rien.' },
      { k:'encombrementObjet', l:'Encombrement', req:true,
        o:['Tient dans un sac','Se porte à une personne','Se porte à deux','Camionnette nécessaire'] },
      quantite(),
      pourQui(),
      remise()
    ]
  }
}

export const A_DONNER: DonneesCat = {
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
