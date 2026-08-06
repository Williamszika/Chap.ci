/* ==========================================================================
 *  ÉCOLE & FOURNITURES — la catégorie que le calendrier impose.
 *
 *  POURQUOI ELLE EXISTE. Le 6 août 2026, un vendeur a publié « Uniquement les
 *  cahiers privilégié✅️ », un kit scolaire — dans la rubrique « À donner »,
 *  où le prix est forcé à zéro. Il ne cherchait pas à donner : il n'avait
 *  nulle part où vendre. Les cahiers, les cartables, les uniformes et les
 *  calculatrices n'avaient aucun rayon sur Chap.ci, et les manuels dormaient
 *  dans « Loisirs & Sport », où aucun parent ne va chercher à la rentrée.
 *
 *  LE CALENDRIER IVOIRIEN, qui commande tout ici :
 *    · rentrée 2026-2027 : lundi 14 septembre 2026 ;
 *    · inscriptions en ligne obligatoires du 1er au 31 août — 6 000 FCFA dans
 *      le public, 3 000 dans le privé ;
 *    · les examens : CEPE, BEPC, BAC.
 *  La catégorie ouvre donc cinq semaines avant la rentrée, en plein mois des
 *  inscriptions. C'est la seule fenêtre de l'année où elle compte vraiment.
 *
 *  DEUX INTERDITS, ET ILS NE SONT PAS THÉORIQUES.
 *
 *  1. LE KIT GRATUIT DE L'ÉTAT NE SE REVEND PAS. Chaque année, plus de
 *     4,3 millions de kits — cahiers, stylos, règles, cartables — sont
 *     distribués gratuitement aux élèves du primaire public, pour environ
 *     10 milliards de FCFA d'argent public. Leur revente sur les marchés est
 *     un détournement documenté de la filière. Un enfant se retrouve sans
 *     cahiers pour qu'un autre encaisse.
 *
 *  2. LES MANUELS PHOTOCOPIÉS NON PLUS. Le piratage est une pratique établie
 *     de la chaîne du livre scolaire ivoirienne, et il donne lieu à de la
 *     contrefaçon à tous les niveaux. Un manuel photocopié est illégal, il
 *     ampute l'éditeur, et il arrive à l'élève avec des pages illisibles ou
 *     manquantes — qu'il découvre en classe.
 *
 *  DEUX AVERTISSEMENTS, qui ne bloquent pas mais qui évitent l'achat inutile :
 *  l'uniforme d'un autre établissement (les écoles imposent des couleurs et
 *  des coupes précises, et refusent ce qui ne s'y conforme pas) et le manuel
 *  d'un ancien programme (l'État a fait rééditer des collections entières).
 * ========================================================================== */
import type { ChampCourt, DonneesCat, SchemaSous, Vals } from './contrat'
import { enregistrerCouleurs, type Couleur } from '../couleurs'


const SOUS = ['Fournitures & papeterie', 'Cartables & trousses',
              'Manuels & livres scolaires', 'Annales & parascolaire',
              'Uniformes & tenues', 'Calculatrices & matériel de classe']

/* Le cartable et l'uniforme se déclinent en couleurs ; le cahier, non. La
   palette reste donc simple et conditionnelle, schéma par schéma. */
const PALETTE_BASE: Couleur[] = [
  { nom:'Noir', css:'#1B1A17' }, { nom:'Bleu marine', css:'#1E3A8A' },
  { nom:'Bleu', css:'#2563EB' }, { nom:'Bleu ciel', css:'#7DD3FC', clair:true },
  { nom:'Rouge', css:'#DC2626' }, { nom:'Rose', css:'#EC4899' },
  { nom:'Vert', css:'#16A34A' }, { nom:'Jaune', css:'#FACC15', clair:true },
  { nom:'Orange', css:'#F77F00' }, { nom:'Violet', css:'#8B5CF6' },
  { nom:'Gris', css:'#9CA3AF' }, { nom:'Blanc', css:'#FFFFFF', clair:true },
  { nom:'Kaki', css:'#8A7B4F' }, { nom:'Marron', css:'#7A4423' },
  { nom:'Multicolore', css:'conic-gradient(#EC4899,#8B5CF6,#2563EB,#16A34A,#FACC15,#EC4899)' },
]
const TOUTES_COULEURS: Couleur[] = PALETTE_BASE

/* Les niveaux du système ivoirien, dans l'ordre où on les vit. */
const NIVEAUX = ['Maternelle', 'CP1 – CP2', 'CE1 – CE2', 'CM1 – CM2',
                 '6e – 5e', '4e – 3e', '2nde', '1ère', 'Terminale',
                 'Supérieur / BTS', 'Tous niveaux']

/* Les matières telles qu'elles s'appellent ici — EDHC comprise. */
const MATIERES = ['Français', 'Mathématiques', 'Physique-Chimie', 'SVT',
                  'Histoire-Géographie', 'Anglais', 'Espagnol', 'Allemand',
                  'Philosophie', 'Économie', 'EDHC', 'Informatique',
                  'Arts plastiques', 'EPS', 'Éveil / lecture', 'Toutes matières']

/* -------------------------------------------------------------------------
 *  Blocs partagés
 * ------------------------------------------------------------------------- */

/**
 * LA question de ce rayon, posée partout où un lot peut venir d'un kit d'État.
 *
 * Elle est directe, et c'est voulu : « d'où vient ce lot » se répond en une
 * seconde par celui qui le sait, et fait réfléchir celui qui allait mentir.
 */
function origineFourniture(): ChampCourt {
  return { k:'origineFourn', l:'D’où vient ce lot ?', req:true,
    o:['Acheté en boutique ou en gros, pour la revente',
       'Mes propres affaires, ou celles de mes enfants',
       'Invendu de l’an dernier',
       'Kit gratuit distribué par l’État (primaire public)'],
    alerte:{ bon:'Acheté en boutique ou en gros, pour la revente',
      ok:['Mes propres affaires, ou celles de mes enfants','Invendu de l’an dernier'],
      texteBon:'Lot acheté pour la revente. Demandez à voir la marchandise avant de payer, comme pour tout achat.',
      texteMauvais:'INTERDIT. Les kits scolaires de l’État sont donnés gratuitement aux élèves du primaire public. Les revendre prive un enfant de ses cahiers.',
      textes:{
        'Mes propres affaires, ou celles de mes enfants':'Affaires personnelles revendues. Regardez l’état sur les photos, et comptez ce qui est réellement dans le lot.',
        'Invendu de l’an dernier':'Invendu de l’an dernier : le matériel ne se périme pas, mais vérifiez que les cahiers n’ont pas pris l’humidité.'
      } },
    bloque:['Kit gratuit distribué par l’État (primaire public)'],
    motifBloc:'Les kits scolaires distribués gratuitement par l’État ne se revendent pas : ils sont donnés aux élèves, pas vendus.',
    h:function (S: Vals) {
      if (/Kit gratuit/.test(S.origineFourn || ''))
        return '!Plus de 4,3 millions de kits sont distribués gratuitement chaque année aux élèves du primaire public, pour environ 10 milliards de FCFA d’argent public. Les revendre sur un marché est un détournement connu de la filière : un enfant se retrouve sans cahiers pour qu’un autre encaisse. Cette annonce ne sera pas publiée.'
      return 'Dire d’où vient la marchandise vous distingue immédiatement. Les acheteurs de ce rayon ont tous entendu parler des kits d’État revendus.'
    } }
}

/** Ce qui sépare un manuel d'un faux. La contrefaçon est massive ici. */
function authenticiteManuel(): ChampCourt {
  return { k:'authManuel', l:'Exemplaire original ou photocopie ?', req:true,
    o:['Original neuf, acheté en librairie',
       'Original d’occasion',
       'Photocopie reliée',
       'Je ne sais pas'],
    alerte:{ bon:'Original neuf, acheté en librairie',
      ok:['Original d’occasion'],
      texteBon:'Exemplaire original neuf. C’est ce qu’un enseignant demande, et ce qui se revend l’année suivante.',
      texteMauvais:'À ÉCARTER. Un manuel photocopié est une contrefaçon : illégal, souvent incomplet, et parfois illisible sur les schémas et les cartes.',
      textes:{
        'Original d’occasion':'Original d’occasion. Vérifiez qu’aucune page ne manque et que les exercices ne sont pas déjà remplis au stylo.',
        'Je ne sais pas':'Origine incertaine. Demandez une photo de la couverture ET de la page de garde avant de payer : une contrefaçon s’y reconnaît.'
      } },
    bloque:['Photocopie reliée'],
    motifBloc:'Un manuel photocopié est une contrefaçon. Le piratage du livre scolaire est interdit, et l’exemplaire arrive presque toujours incomplet chez l’élève.',
    h:function (S: Vals) {
      if (/Photocopie/.test(S.authManuel || ''))
        return '!Le piratage est une pratique installée de la chaîne du livre scolaire ivoirienne, et il donne lieu à de la contrefaçon à tous les niveaux. L’élève le découvre en classe, devant une carte illisible ou une page absente. Cette annonce ne sera pas publiée.'
      return 'Photographiez la couverture ET la page de garde : c’est là qu’un acheteur averti reconnaît un original.'
    } }
}

/** Le lot est-il complet ? La question qui évite trois messages. */
function quantiteLot(): ChampCourt {
  return { k:'quantiteScol', l:'Quantité', req:true,
    o:['1 article','2 à 5','Lot de 6 à 20','Lot de 21 à 50','Plus de 50','Kit complet pour un élève','Gros pour revendeurs'],
    h:'Un « gros pour revendeurs » ne s’adresse pas au même acheteur qu’un kit d’élève. Dites-le dans le titre aussi.' }
}

const ETAT_SCOL = ['Neuf, sous emballage', 'Neuf, emballage ouvert', 'Très bon état',
                   'Bon état, traces d’usage', 'Usé mais utilisable']

const SCHEMAS: Record<string, SchemaSous> = {

  /* ================================================================== */
  'Fournitures & papeterie': {
    couleurs: false, etat: true, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Étalez le lot et photographiez-le en entier, sans le trier pour la photo. Un acheteur qui compte 38 cahiers sur une annonce qui en promet 50 ne rappelle pas.',
    titre: function (S: Vals) { return [S.typeFourn, S.quantiteScol, S.niveauFourn].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeFourn', l:'Type de fourniture', req:true, multi:true,
        o:['Cahiers 32 pages','Cahiers 64 pages','Cahiers 100 pages','Cahiers 200 pages','Cahiers 300 pages',
           'Cahiers de dessin','Bloc-notes','Feuilles de copie','Chemises & pochettes','Stylos à bille',
           'Crayons à papier','Gommes','Taille-crayons','Règles','Ardoises','Craies','Colle','Ciseaux',
           'Crayons de couleur','Feutres','Peinture & pinceaux','Protège-cahiers','Étiquettes','Papier kraft'] },
      origineFourniture(),
      { k:'niveauFourn', l:'Niveau visé', multi:true, o:NIVEAUX,
        h:'C’est ce qu’un parent tape : « cahiers CM2 », « fournitures 6e ». Cochez tous les niveaux qui conviennent.' },
      { k:'marqueFourn', l:'Marque', t: 'text' as const, ph:'Ex : Bic, Conquérant, sans marque' },
      { k:'etatFourn', l:'État', req:true, o:ETAT_SCOL },
      { k:'humidite', l:'Conservation', req:true,
        o:['Stocké au sec, jamais mouillé','A pris un peu l’humidité','Pages gondolées ou tachées'],
        h:function (S: Vals) {
          if (/humidité|gondolées/.test(S.humidite || ''))
            return '!Dites-le franchement et baissez le prix : un cahier gondolé s’écrit mal, et l’acheteur le verra en ouvrant le paquet. Annoncé, ça se vend quand même.'
          return 'À Abidjan, un lot stocké au sol pendant la saison des pluies prend l’humidité. Le préciser rassure — beaucoup d’acheteurs se sont fait avoir.'
        } },
      quantiteLot(),
      { k:'venteFourn', l:'Vous vendez', req:true,
        o:['À l’unité','Par lot uniquement','Les deux'],
        h:'« Par lot uniquement » fait fuir un parent qui cherche trois cahiers. Si vous pouvez découper, dites-le.' },
      { k:'prixRepere', l:'Votre prix par rapport au marché',
        o:['Aligné sur Adjamé / Treichville','Un peu au-dessus','Prix de boutique de quartier','Je ne sais pas'],
        h:'Les grands marchés d’Adjamé et de Treichville descendent jusqu’à 40 % sous les centres commerciaux, et vos acheteurs le savent. Un prix de centre commercial ne se vend pas en ligne.' }
    ]
  },

  /* ================================================================== */
  'Cartables & trousses': {
    couleurs: true, etat: true, livraison: true, prixLabel: 'Prix',
    aideCouleurs: 'Cochez chaque coloris disponible : à cet âge, la couleur décide de l’achat plus que le prix.',
    titre: function (S: Vals) { return [S.typeSac, S.niveauSac, S.marqueSac].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeSac', l:'Type', req:true,
        o:['Cartable','Sac à dos','Sac à roulettes','Trousse','Boîte à goûter','Gourde','Sac de sport','Porte-documents'] },
      origineFourniture(),
      { k:'niveauSac', l:'Pour quel niveau', req:true, multi:true, o:NIVEAUX },
      { k:'marqueSac', l:'Marque ou motif', t: 'text' as const, ph:'Ex : sans marque, motif footballeur, motif princesse' },
      { k:'etatSac', l:'État', req:true, o:ETAT_SCOL },
      { k:'soliditeSac', l:'Points d’usure', multi:true,
        when:function (S: Vals) { return !/Neuf/.test(S.etatSac || '') },
        o:['Aucun, comme neuf','Fermeture éclair fatiguée','Bretelle recousue','Fond usé','Tache ou décoloration','Roulettes à changer'],
        h:'La fermeture éclair et les bretelles sont ce qui lâche en premier, et ce qu’un parent regarde. Dites-le : un cartable réparé et annoncé se vend, un cartable qui casse en octobre fait un avis à une étoile.' },
      { k:'dosSac', l:'Dos et bretelles',
        when:function (S: Vals) { return /Cartable|Sac à dos|roulettes/.test(S.typeSac || '') },
        o:['Dos rembourré, bretelles larges','Bretelles simples','Sans rembourrage'],
        h:'Un enfant du primaire porte plusieurs kilos chaque jour. Le dos rembourré est un vrai argument, dites-le s’il y est.' },
      quantiteLot()
    ]
  },

  /* ================================================================== */
  'Manuels & livres scolaires': {
    couleurs: false, etat: true, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez la couverture ET la page de garde. C’est là qu’on distingue un original d’une contrefaçon, et c’est la première chose qu’un parent averti demande.',
    titre: function (S: Vals) { return [S.matiereManuel, S.niveauManuel, S.editeurManuel].filter(Boolean).join(' · ') },
    champs: [
      { k:'natureLivre', l:'De quel livre s’agit-il ?', req:true,
        o:['Manuel au programme','Cahier d’activités / d’exercices','Roman au programme (lecture suivie)',
           'Dictionnaire','Atlas','Livre de lecture (primaire)','Ouvrage universitaire','Livre du professeur'],
        h:function (S: Vals) {
          if (/Roman au programme/.test(S.natureLivre || ''))
            return 'Un roman qu’on lit pour le plaisir n’est pas ici : il a sa place dans Loisirs & Sport, où les lecteurs le cherchent. Ici, ce sont les œuvres inscrites au programme.'
          return 'Le titre exact et le niveau font trouver votre annonce : c’est ce qu’un parent recopie depuis la liste de l’école.'
        } },
      authenticiteManuel(),
      { k:'matiereManuel', l:'Matière', req:true, o:MATIERES },
      { k:'niveauManuel', l:'Niveau', req:true, o:NIVEAUX },
      { k:'titreManuel', l:'Titre exact', t: 'text' as const, req:true,
        ph:'Ex : CIAM 3e, Mathématiques · Le Flamboyant CE2',
        h:'Recopiez-le tel qu’il est écrit sur la couverture, collection comprise. C’est mot pour mot ce que le parent tape.' },
      { k:'editeurManuel', l:'Éditeur ou collection', t: 'text' as const,
        ph:'Ex : NEI-CEDA, CIAM, Hachette, Édicef' },

      { k:'programmeManuel', l:'Programme', req:true,
        o:['Programme en cours','Programme récent (1 à 3 ans)','Ancienne édition','Je ne sais pas'],
        alerte:{ bon:'Programme en cours',
          ok:['Programme récent (1 à 3 ans)'],
          texteBon:'Édition au programme en cours. C’est celle que l’école demande.',
          texteMauvais:'Ancienne édition : les chapitres et la pagination ont pu changer. Vérifiez la liste de votre école AVANT d’acheter — l’enseignant travaille avec les numéros de page.',
          textes:{
            'Programme récent (1 à 3 ans)':'Édition récente. Comparez le titre et l’année avec la liste remise par l’école.',
            'Je ne sais pas':'Année d’édition inconnue. Demandez une photo de la page de garde : l’année y figure.'
          } },
        h:'L’État a fait rééditer des collections entières après des erreurs constatées. Une édition dépassée n’est pas sans valeur, mais l’acheteur doit le savoir avant de payer.' },

      { k:'etatManuel', l:'État', req:true,
        o:['Neuf, jamais ouvert','Très bon état','Quelques annotations au crayon','Annoté au stylo','Exercices déjà remplis','Couverture abîmée','Pages manquantes'],
        h:function (S: Vals) {
          if (/Exercices déjà remplis|Pages manquantes/.test(S.etatManuel || ''))
            return '!Un cahier d’exercices déjà rempli ne sert plus à l’élève, et un livre amputé se retourne contre vous. Annoncez-le clairement et vendez-le au prix du papier — ou n’en tirez rien.'
          return 'Les annotations au crayon s’effacent, celles au stylo non. Dites lesquelles.'
        } },
      quantiteLot(),
      { k:'lotMatieres', l:'Le lot couvre', multi:true,
        when:function (S: Vals) { return /Lot|Kit|Plus de/.test(S.quantiteScol || '') },
        o:MATIERES,
        h:'Un lot complet pour une classe entière se vend beaucoup mieux qu’un livre isolé. Listez les matières couvertes.' }
    ]
  },

  /* ================================================================== */
  'Annales & parascolaire': {
    couleurs: false, etat: true, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez la couverture et le sommaire : ce sont les années couvertes et la présence des corrigés qui décident de l’achat.',
    titre: function (S: Vals) { return [S.examenAnn, S.matiereAnn, S.anneesAnn].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeAnn', l:'Type d’ouvrage', req:true,
        o:['Annales d’examen','Sujets corrigés','Cahier de vacances','Fiches de révision','Manuel de méthode',
           'Préparation aux concours','Cours particuliers imprimés','Exercices supplémentaires'] },
      authenticiteManuel(),
      { k:'examenAnn', l:'Examen préparé', req:true,
        o:['CEPE','BEPC','BAC série A','BAC série C','BAC série D','BAC série G','Concours d’entrée','Aucun examen précis'],
        h:'CEPE, BEPC, BAC : mettez le sigle dans le titre. C’est le mot que l’élève tape à trois semaines de l’épreuve.' },
      { k:'matiereAnn', l:'Matière', req:true, o:MATIERES },
      { k:'anneesAnn', l:'Années couvertes', t: 'text' as const, ph:'Ex : 2019 à 2025',
        h:'Plus les sessions sont récentes, plus l’ouvrage vaut. Dites l’année la plus récente qu’il contient.' },

      { k:'corrigesAnn', l:'Les corrigés', req:true,
        o:['Corrigés complets et détaillés','Corrigés succincts','Réponses seules, sans démarche','Aucun corrigé'],
        alerte:{ bon:'Corrigés complets et détaillés',
          ok:['Corrigés succincts'],
          texteBon:'Corrigés détaillés : c’est ce qui fait la valeur d’une annale. Un élève qui révise seul en a besoin.',
          texteMauvais:'Sans corrigé, un recueil de sujets n’apprend rien à un élève qui travaille seul. Vérifiez que c’est bien ce que vous cherchez.',
          textes:{
            'Réponses seules, sans démarche':'Les réponses sans la démarche ne servent qu’à vérifier, pas à apprendre. Dites-le au prix.'
          } },
        h:'C’est LA question de ce rayon. Un recueil sans corrigés et un recueil corrigé n’ont pas le même prix, et l’acheteur veut le savoir avant.' },

      { k:'niveauAnn', l:'Niveau', req:true, o:NIVEAUX },
      { k:'etatAnn', l:'État', req:true,
        o:['Neuf, jamais ouvert','Très bon état','Quelques annotations','Sujets déjà traités au stylo','Couverture abîmée'],
        h:function (S: Vals) {
          if (/déjà traités/.test(S.etatAnn || ''))
            return '!Des sujets déjà traités au stylo enlèvent tout l’intérêt : l’élève voit la réponse avant de chercher. Annoncez-le, et baissez le prix en conséquence.'
          return ''
        } },
      quantiteLot()
    ]
  },

  /* ================================================================== */
  'Uniformes & tenues': {
    couleurs: true, etat: true, livraison: true, prixLabel: 'Prix',
    aideCouleurs: 'Cochez la teinte réelle du tissu, pas celle de la photo au soleil. Un kaki n’est pas l’autre, et c’est justement là que ça coince.',
    titre: function (S: Vals) { return [S.typeTenue, S.tailleTenue, S.etabTenue].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeTenue', l:'Type de tenue', req:true,
        o:['Tenue kaki garçon (chemise)','Tenue kaki garçon (pantalon / short)','Ensemble kaki complet',
           'Robe à petits carreaux (maternelle)','Robe à grands carreaux (primaire)',
           'Jupe bleue (collège / lycée)','Chemisier blanc (collège / lycée)','Ensemble fille complet',
           'Tenue de sport / EPS','Blouse','Chaussures d’école','Chaussettes','Badge ou écusson'],
        h:'En Côte d’Ivoire, le kaki habille les garçons du primaire au lycée ; les filles portent les carreaux au préscolaire et au primaire, puis le bas bleu et le haut blanc au secondaire.' },
      origineFourniture(),

      // Le vrai piège de ce rayon : chaque établissement impose SA teinte.
      { k:'confTenue', l:'Conformité à l’établissement', req:true,
        o:['Modèle standard, accepté partout',
           'Modèle propre à un établissement précis',
           'Porte le badge ou l’écusson d’une école',
           'Je ne sais pas'],
        alerte:{ bon:'Modèle standard, accepté partout',
          texteBon:'Modèle standard. Montrez tout de même la tenue à votre école avant la rentrée : certaines imposent une teinte précise.',
          texteMauvais:'ATTENTION. Cette tenue est faite pour une école précise. Beaucoup d’établissements imposent leur couleur exacte et leur coupe, et refusent le reste — vous risquez d’acheter pour rien.',
          textes:{
            'Porte le badge ou l’écusson d’une école':'Tenue marquée du badge d’une école. Elle ne servira que dans cet établissement, et nulle part ailleurs.',
            'Je ne sais pas':'Conformité inconnue. Demandez une photo à plat, en plein jour, et comparez avec la tenue exigée par votre école avant de payer.'
          } },
        h:'Les établissements ivoiriens imposent souvent des teintes et des coupes précises. Un uniforme acheté pour l’école d’à côté peut être refusé à la vôtre — dites franchement d’où vient celui-ci.' },
      { k:'etabTenue', l:'Établissement d’origine', t: 'text' as const,
        when:function (S: Vals) { return /établissement précis|badge/.test(S.confTenue || '') },
        ph:'Ex : Groupe scolaire Les Palmiers, Cocody',
        h:'Le nommer fait gagner du temps à tout le monde : les parents de cette école achèteront, les autres ne se déplaceront pas pour rien.' },

      { k:'tailleTenue', l:'Taille', req:true, multi:true,
        o:['2-3 ans','4-5 ans','6-7 ans','8-9 ans','10-11 ans','12-13 ans','14-15 ans','16 ans et plus',
           'XS','S','M','L','XL','Tailles mélangées'] },
      { k:'sexeTenue', l:'Pour', req:true, o:['Garçon','Fille','Mixte'] },
      { k:'etatTenue', l:'État', req:true, o:ETAT_SCOL },
      { k:'hygieneTenue', l:'Hygiène', req:true,
        when:function (S: Vals) { return !/Neuf/.test(S.etatTenue || '') },
        o:['Lavée et repassée','Propre, à relaver par précaution','Non lavée'],
        h:function (S: Vals) {
          if (S.hygieneTenue === 'Non lavée')
            return '!Une tenue lavée et repassée part deux fois plus vite, et coûte une machine. Faites-le.'
          return 'Photographiez la tenue à plat, repassée : c’est ce qui fait la différence sur ce rayon.'
        } },
      { k:'tissuTenue', l:'Tissu',
        o:['Coton','Majorité coton','Polyester-coton','Synthétique','Je ne sais pas'],
        h:'Sous le climat d’ici, le coton se porte mieux toute la journée. C’est un argument, s’il est vrai.' },
      quantiteLot(),
      { k:'surMesure', l:'Couture sur mesure', req:true,
        o:['Non, tenue déjà confectionnée','Oui, je couds sur mesure'],
        h:function (S: Vals) {
          if (/Oui/.test(S.surMesure || ''))
            return 'Précisez votre délai et vos tarifs dans la description : à la rentrée, un couturier qui livre en trois jours vaut de l’or.'
          return ''
        } }
    ]
  },

  /* ================================================================== */
  'Calculatrices & matériel de classe': {
    couleurs: true, etat: true, livraison: true, prixLabel: 'Prix',
    aideCouleurs: 'Cochez les coloris disponibles s’il y en a plusieurs.',
    titre: function (S: Vals) { return [S.typeMatCl, S.marqueMatCl, S.niveauMatCl].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeMatCl', l:'Type', req:true,
        o:['Calculatrice scientifique','Calculatrice simple','Calculatrice graphique','Compas','Équerre','Rapporteur',
           'Kit de géométrie complet','Ardoise Velleda','Tableau blanc','Globe terrestre','Carte murale',
           'Blouse de laboratoire','Matériel de dessin technique','Clé USB','Ordinateur pour l’école'],
        h:'La calculatrice scientifique est exigée dès la 4e dans la plupart des établissements. C’est l’article le plus cherché de ce rayon.' },
      origineFourniture(),
      { k:'marqueMatCl', l:'Marque et modèle', t: 'text' as const, ph:'Ex : Casio fx-92, Texas Instruments',
        h:'Le modèle exact décide de l’achat : certains professeurs n’acceptent qu’un modèle précis en examen.' },

      { k:'marcheMatCl', l:'Fonctionnement', req:true,
        when:function (S: Vals) { return /Calculatrice|Ordinateur|Clé USB|Velleda/.test(S.typeMatCl || '') },
        o:['Fonctionne, essai possible sur place','Fonctionne, écran légèrement marqué','Piles à changer','En panne — pour pièces'],
        alerte:{ bon:'Fonctionne, essai possible sur place',
          ok:['Fonctionne, écran légèrement marqué','Piles à changer'],
          texteBon:'Essai possible avant achat. Allumez-la devant le vendeur, tapez un calcul : trente secondes suffisent.',
          texteMauvais:'Appareil en panne, vendu pour pièces. N’engagez pas de frais de transport avant de savoir ce qu’il vaut.',
          textes:{
            'Piles à changer':'Piles à changer : c’est courant et peu cher, mais demandez à l’essayer avec des piles neuves.'
          } },
        h:'Une calculatrice s’essaie en trente secondes. Proposez-le : c’est ce qui conclut la vente.' },

      { k:'examenMatCl', l:'Autorisée en examen ?',
        when:function (S: Vals) { return /Calculatrice/.test(S.typeMatCl || '') },
        o:['Oui, modèle autorisé','Non, modèle programmable interdit','Je ne sais pas'],
        h:'Les calculatrices programmables sont refusées à certaines épreuves. Si vous le savez, dites-le : ça évite une catastrophe le jour du BAC.' },
      { k:'niveauMatCl', l:'Niveau visé', multi:true, o:NIVEAUX },
      { k:'etatMatCl', l:'État', req:true, o:ETAT_SCOL },
      { k:'accessoiresMatCl', l:'Fourni avec', multi:true,
        o:['Housse ou étui','Notice','Piles','Emballage d’origine','Facture','Rien de plus'] },
      quantiteLot()
    ]
  }
}

export const SCOLAIRE: DonneesCat = {
  sous: SOUS,
  paletteBase: PALETTE_BASE,
  toutesCouleurs: TOUTES_COULEURS,
  schemas: SCHEMAS,
}

// La palette de ce metier rejoint le repertoire general au moment ou ce module
// est charge. C'est ce qui permet a `couleurs.ts` de n'avoir AUCUN import vers
// `data/sous/` : sans quoi les quatre-vingt-quinze schemas repartiraient au
// demarrage, juste pour resoudre le nom d'une teinte.
enregistrerCouleurs(TOUTES_COULEURS)
