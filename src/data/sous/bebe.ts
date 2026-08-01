/* ==========================================================================
 *  BÉBÉ & ENFANT — la catégorie où l'occasion est la norme,
 *  et où deux objets ne se revendent pas.
 *
 *  Tout se revend ici, et c'est très bien : un enfant met une taille trois
 *  mois, une poussette sert deux ans. Mais deux objets font exception, et
 *  ce sont précisément ceux qu'on revend le plus :
 *
 *  1. LE SIÈGE AUTO ACCIDENTÉ. Un siège qui a subi un choc, même sans trace
 *     visible, a absorbé l'énergie de l'impact : sa coque est fragilisée et
 *     il ne protégera plus. Tous les fabricants demandent de le remplacer
 *     après un accident. Il ne se revend pas.
 *
 *  2. LE LIT À BARREAUX NON CONFORME. Un écartement de barreaux supérieur à
 *     6,5 cm laisse passer la tête d'un nourrisson. C'est une cause connue
 *     d'étouffement, et c'est pour cela que la norme existe.
 *
 *  S'y ajoute le rappel (« recall ») : un modèle rappelé par son fabricant
 *  ne se revend pas non plus — il se rapporte.
 *
 *  Pour tout le reste, le formulaire encourage franchement l'occasion :
 *  l'état, le lavage, la conformité, et surtout ce qui est COMPLET.
 * ========================================================================== */
import type { ChampCourt, DonneesCat, SchemaSous, Vals } from './contrat'
import type { Couleur } from '../couleurs'


const SOUS = ['Vêtements bébé & enfant', 'Poussettes & Sièges auto', 'Mobilier & Chambre',
            'Jouets & Éveil', 'Puériculture & Repas', 'Vêtements de maternité']

const PALETTE_BASE: Couleur[] = [
  { nom:'Blanc', css:'#FFFFFF', clair:true }, { nom:'Écru / crème', css:'#F5EEE0', clair:true },
  { nom:'Beige', css:'#E8D8C3', clair:true }, { nom:'Gris', css:'#9CA3AF' },
  { nom:'Noir', css:'#1B1A17' }, { nom:'Rose', css:'#F9A8D4', clair:true },
  { nom:'Rose vif', css:'#EC4899' }, { nom:'Bleu ciel', css:'#93C5FD', clair:true },
  { nom:'Bleu', css:'#2563EB' }, { nom:'Bleu marine', css:'#1E3A5F' },
  { nom:'Vert', css:'#16A34A' }, { nom:'Vert d’eau', css:'#A7F3D0', clair:true },
  { nom:'Jaune', css:'#FACC15', clair:true }, { nom:'Orange', css:'#F97316' },
  { nom:'Rouge', css:'#DC2626' }, { nom:'Violet', css:'#8B5CF6' },
  { nom:'Marron', css:'#7A4423' }, { nom:'Wax / pagne', css:'conic-gradient(#F77F00,#FACC15,#16A34A,#2563EB,#DC2626,#F77F00)' },
  { nom:'Imprimé enfant', css:'conic-gradient(#F9A8D4,#93C5FD,#FACC15,#A7F3D0,#F9A8D4)' },
  { nom:'Multicolore', css:'conic-gradient(#EC4899,#8B5CF6,#2563EB,#16A34A,#FACC15,#EC4899)' }
]
const TOUTES_COULEURS: Couleur[] = PALETTE_BASE

const AGES = ['Naissance (0-1 mois)','1 à 3 mois','3 à 6 mois','6 à 12 mois','12 à 18 mois','18 à 24 mois','2 à 3 ans','3 à 5 ans','5 à 8 ans','8 à 12 ans']

/* Le rappel fabricant : un modèle rappelé ne se revend pas, il se rapporte. */
function rappel(): ChampCourt {
  return { k:'rappel', l:'Rappel fabricant', req:true,
    o:['Aucun rappel connu sur ce modèle','Modèle rappelé par le fabricant','Je ne sais pas'],
    bloque:['Modèle rappelé par le fabricant'],
    motifBloc:'Un modèle rappelé par son fabricant ne se revend pas : il se rapporte au vendeur ou au fabricant.',
    h:function (S: Vals) {
      if (/rappelé/.test(S.rappel || ''))
        return '!Un modèle rappelé présente un défaut de sécurité identifié. Ne le revendez pas : rapportez-le au fabricant, qui le reprend ou le répare gratuitement.'
      return 'Le numéro de modèle est sous l’article. Un rappel se vérifie en le tapant dans un moteur de recherche avec le mot « rappel ».'
    } }
}

/* L'hygiène : ce qui décide vraiment de l'achat d'occasion pour un bébé. */
function lavage(): ChampCourt {
  return { k:'lavage', l:'Nettoyage', req:true,
    o:['Lavé et désinfecté, prêt à l’usage','Lavé','À laver avant usage','Taches persistantes'],
    alerte:{ bon:'Lavé et désinfecté, prêt à l’usage',
      ok:['Lavé','À laver avant usage'],
      texteBon:'Lavé et désinfecté par le vendeur. Un passage en machine avant le premier usage reste une bonne habitude.',
      texteMauvais:'Des taches persistent. Demandez des photos récentes, à la lumière du jour, avant de vous déplacer.',
      textes:{
        'Lavé':'Lavé, et le vendeur le dit. Relavez avant le premier usage — c’est rapide et cela ne coûte rien.',
        'À laver avant usage':'À laver avant usage : c’est honnête, et parfaitement normal sur de l’occasion. Prévoyez-le simplement.'
      } },
    h:function (S: Vals) {
      if (/Taches persistantes/.test(S.lavage || ''))
        return '!Photographiez les taches. Un parent qui les découvre à la remise repart, et laisse un avis.'
      return 'Un article lavé et annoncé comme tel se vend nettement plus vite. C’est la première question d’un parent.'
    } }
}

function completB(quoi: string): ChampCourt {
  return { k:'completB', l:'Complet ?', req:true,
    o:['Complet, rien ne manque','Il manque une pièce, précisée dans la description','Incomplet — vendu tel quel'],
    h:'C’est le premier litige sur ' + quoi + ' d’occasion. Comptez avant de photographier.' }
}

const SCHEMAS: Record<string, SchemaSous> = {

  'Vêtements bébé & enfant': {
    couleurs: true, etat: true, livraison: true, prixLabel: 'Prix',
    aideCouleurs: 'Cochez chaque couleur disponible. Ouvrez-en une pour lui donner ses photos, son prix et les tailles qui restent.',
    titre: function (S: Vals) { return [S.typeVetB, (S.tailleB || []).length ? (S.tailleB.length <= 2 ? S.tailleB.join(', ') : S.tailleB.length + ' tailles') : '', S.pourQuiB].filter(Boolean).join(' · ') },
    champs: [
      { k:'pourQuiB', l:'Pour', req:true, o:['Fille','Garçon','Mixte'] },
      { k:'typeVetB', l:'Type', req:true,
        o:['Body','Pyjama / grenouillère','Ensemble','Robe','Pantalon','Short','T-shirt','Chemise','Pull / gilet','Manteau','Tenue de baptême','Tenue traditionnelle','Chaussures','Chaussettes','Bonnet / chapeau','Maillot de bain','Lot de vêtements'] },
      { k:'tailleB', l:'Tailles disponibles', lVar:'Tailles restantes dans cette couleur', multi:true, req:true, varOK:true, o:AGES,
        h:'Un enfant met une taille trois mois : c’est ce qui rend l’occasion si utile ici. Cochez tout ce que vous avez.' },
      { k:'nbPiecesB', l:'Nombre de pièces', req:true,
        o:['1 pièce','2 à 5 pièces','Lot de 6 à 15','Lot de 15 à 30','Plus de 30 pièces'],
        h:'Les lots partent très vite : beaucoup de parents achètent la garde-robe d’une taille d’un coup.' },
      { k:'matiereB', l:'Matière', o:['Coton','Coton bio','Polyester','Laine','Jean','Wax / pagne','Éponge','Mélange'] },
      lavage(),
      { k:'usureB', l:'État', req:true,
        o:['Neuf avec étiquette','Neuf sans étiquette','Très bon état, peu porté','Bon état','Traces d’usage','Petit accroc ou tache'] }
    ]
  },

  'Poussettes & Sièges auto': {
    couleurs: true, etat: true, livraison: true, prixLabel: 'Prix',
    aideCouleurs: 'Cochez chaque coloris disponible.',
    titre: function (S: Vals) { return [S.typePouss, S.marqueB, S.groupeSiege].filter(Boolean).join(' · ') },
    champs: [
      { k:'typePouss', l:'Type', req:true,
        o:['Poussette canne','Poussette 3 roues','Poussette double','Combiné poussette-nacelle','Siège auto','Cosy / coque','Rehausseur','Porte-bébé','Écharpe de portage','Sac à langer'] },
      { k:'marqueB', l:'Marque', t: 'text' as const, req:true, ph:'Ex : Chicco, Bébé Confort, sans marque',
        h:'La marque et le modèle permettent de vérifier un rappel et de retrouver la notice.' },

      // Le champ qui refuse l'annonce.
      { k:'choc', l:'A-t-il subi un choc ou un accident ?', req:true,
        when:function (S: Vals) { return /Siège auto|Cosy|Rehausseur/.test(S.typePouss || '') },
        o:['Jamais accidenté','A subi un accident, même léger','Je ne sais pas — acheté d’occasion'],
        alerte:{ bon:'Jamais accidenté',
          texteBon:'Le vendeur déclare un siège jamais accidenté. Vérifiez la coque, les sangles et la date de fabrication sous le siège.',
          texteMauvais:'INTERDIT À LA REVENTE. Un siège auto qui a subi un choc ne protège plus, même s’il paraît intact.' },
        bloque:['A subi un accident, même léger','Je ne sais pas — acheté d’occasion'],
        motifBloc:'Un siège auto accidenté — ou dont l’histoire est inconnue — ne peut pas être revendu : il ne protégera plus l’enfant.',
        h:function (S: Vals) {
          if (/accident/.test(S.choc || ''))
            return '!Un siège auto absorbe l’énergie du choc : sa coque est fragilisée même sans trace visible. Tous les fabricants demandent de le remplacer après un accident. Il ne se revend pas — il se détruit.'
          if (/Je ne sais pas/.test(S.choc || ''))
            return '!Si vous ne connaissez pas l’histoire du siège, vous ne pouvez pas garantir qu’il protégera. C’est le seul article de puériculture qui ne se revend jamais « à l’aveugle ».'
          return 'C’est LA question du siège auto. Un siège dont on connaît l’histoire se vend en confiance ; un siège inconnu ne se vend pas du tout.'
        } },
      rappel(),
      { k:'groupeSiege', l:'Groupe / poids', req:true,
        when:function (S: Vals) { return /Siège auto|Cosy|Rehausseur/.test(S.typePouss || '') },
        o:['Groupe 0+ (0-13 kg)','Groupe 1 (9-18 kg)','Groupe 2/3 (15-36 kg)','Groupe 0+/1','Groupe 1/2/3','i-Size / R129'],
        h:'Le groupe correspond au poids de l’enfant, pas à son âge. C’est ce qu’un parent vérifie en premier.' },
      { k:'anneeFab', l:'Année de fabrication', t: 'text' as const, ph:'Ex : 2022',
        when:function (S: Vals) { return /Siège auto|Cosy|Rehausseur/.test(S.typePouss || '') },
        h:'Elle est moulée sous le siège. Le plastique vieillit : au-delà de dix ans, un siège n’est plus recommandé.' },
      { k:'ageP', l:'Âge conseillé', multi:true, req:true, o:AGES },
      { k:'pliage', l:'Pliage',
        when:function (S: Vals) { return /Poussette|Combiné/.test(S.typePouss || '') },
        o:['Pliage compact','Pliage standard','Pliage difficile','Ne se plie pas'] },
      completB('une poussette'),
      lavage(),
      { k:'accessoiresP', l:'Fourni avec', multi:true,
        o:['Notice','Housse de pluie','Ombrelle','Nacelle','Adaptateurs','Sac de transport','Base isofix','Housse lavable'] }
    ]
  },

  'Mobilier & Chambre': {
    couleurs: true, etat: true, livraison: true, prixLabel: 'Prix',
    aideCouleurs: 'Cochez chaque finition disponible.',
    titre: function (S: Vals) { return [S.typeMobB, S.marqueB, S.dimsB].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeMobB', l:'Type', req:true,
        o:['Lit à barreaux','Berceau / couffin','Lit évolutif','Lit enfant','Matelas bébé','Table à langer','Commode à langer','Armoire enfant','Bureau enfant','Chaise haute','Parc','Transat','Tapis d’éveil','Baignoire bébé','Trotteur','Barrière de sécurité'] },
      { k:'marqueB', l:'Marque', t: 'text' as const, ph:'Ex : Ikea, fabrication locale' },

      // Le second champ qui refuse l'annonce.
      { k:'barreaux', l:'Écartement des barreaux', req:true,
        when:function (S: Vals) { return /Lit à barreaux|Berceau|Lit évolutif|Parc/.test(S.typeMobB || '') },
        o:['Conforme — entre 4,5 et 6,5 cm','Supérieur à 6,5 cm','Je n’ai pas mesuré'],
        alerte:{ bon:'Conforme — entre 4,5 et 6,5 cm',
          texteBon:'Écartement conforme. Vérifiez aussi que le fond est stable et qu’aucun barreau ne bouge.',
          texteMauvais:'DANGER. Un écartement supérieur à 6,5 cm laisse passer la tête d’un nourrisson — c’est une cause connue d’étouffement.' },
        bloque:['Supérieur à 6,5 cm'],
        motifBloc:'Un lit dont l’écartement des barreaux dépasse 6,5 cm ne peut pas être vendu : la tête d’un nourrisson peut s’y engager.',
        h:function (S: Vals) {
          if (/Supérieur/.test(S.barreaux || ''))
            return '!Un écartement supérieur à 6,5 cm laisse passer la tête d’un nourrisson qui ne peut plus la retirer. C’est pour cela que la norme existe. Ce lit ne peut pas être vendu.'
          if (/pas mesuré/.test(S.barreaux || ''))
            return '!Mesurez entre deux barreaux, au centre, avec une règle. C’est l’affaire de dix secondes et cela peut sauver un enfant.'
          return 'Entre 4,5 et 6,5 cm : assez serré pour la tête, assez large pour ne pas coincer un bras.'
        } },
      rappel(),
      { k:'dimsB', l:'Dimensions', t: 'text' as const, req:true, ph:'Ex : 120 × 60 cm',
        h:'Le matelas se choisit sur les dimensions du lit : sans elles, un parent ne peut pas savoir si le sien ira.' },
      { k:'matiereB2', l:'Matière', req:true,
        o:['Bois massif','Contreplaqué','Aggloméré / MDF','Métal','Plastique','Tissu et mousse'] },
      { k:'montageB', l:'Montage', req:true,
        o:['Livré monté','À monter, notice fournie','À monter, sans notice','Démonté'] },
      completB('un meuble'),
      lavage(),
      { k:'ageM', l:'Âge conseillé', multi:true, o:AGES }
    ]
  },

  'Jouets & Éveil': {
    couleurs: true, etat: true, livraison: true, prixLabel: 'Prix',
    aideCouleurs: 'Cochez chaque couleur disponible.',
    titre: function (S: Vals) { return [S.typeJouet, S.ageJ, S.nbJouets].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeJouet', l:'Type', req:true,
        o:['Hochet / éveil','Peluche','Poupée','Voiture / véhicule','Circuit / train','Construction (briques)','Puzzle enfant','Jeu éducatif','Livre-jouet','Instrument-jouet','Déguisement','Jeu d’extérieur','Toboggan / balançoire','Piscine gonflable','Vélo / porteur','Tricycle','Trottinette enfant','Console d’éveil','Lot de jouets'] },
      { k:'ageJ', l:'Âge conseillé', req:true,
        o:['0 à 6 mois','6 à 12 mois','1 à 2 ans','2 à 3 ans','3 à 5 ans','5 à 8 ans','8 ans et plus'],
        h:'L’âge indiqué sur un jouet n’est pas un conseil de difficulté : c’est une consigne de sécurité, liée à la taille des pièces.' },
      { k:'petitesPieces', l:'Petites pièces', req:true,
        o:['Aucune petite pièce','Contient de petites pièces — déconseillé avant 3 ans','Je ne sais pas'],
        h:function (S: Vals) {
          if (/petites pièces/.test(S.petitesPieces || ''))
            return '!Une petite pièce avalée est la première cause d’étouffement chez l’enfant de moins de trois ans. Le signaler est plus important que tout le reste de l’annonce.'
          return 'Un jouet destiné aux moins de trois ans ne doit contenir aucune pièce détachable de petite taille.'
        } },
      rappel(),
      { k:'pilesJ', l:'Piles', o:['Fonctionne sans piles','Piles fournies','Piles non fournies','Rechargeable','Piles à changer'] },
      completB('un jouet'),
      lavage(),
      { k:'nbJouets', l:'Quantité', req:true, o:['1 jouet','2 à 5 jouets','Lot de 6 à 15','Grand lot'] },
      { k:'marqueB', l:'Marque', t: 'text' as const, ph:'Ex : Fisher-Price, Lego, sans marque' }
    ]
  },

  'Puériculture & Repas': {
    couleurs: true, etat: true, livraison: true, prixLabel: 'Prix',
    aideCouleurs: 'Cochez chaque couleur disponible.',
    titre: function (S: Vals) { return [S.typePueri, S.marqueB].filter(Boolean).join(' · ') },
    champs: [
      { k:'typePueri', l:'Type', req:true,
        o:['Biberon','Chauffe-biberon','Stérilisateur','Tire-lait','Chaise haute','Assiette / couverts bébé','Robot cuiseur bébé','Thermomètre','Moniteur bébé','Veilleuse','Coussin d’allaitement','Couches lavables','Pot / réducteur','Sac isotherme','Balance bébé','Humidificateur'] },
      { k:'marqueB', l:'Marque', t: 'text' as const, ph:'Ex : Philips Avent, Béaba, sans marque' },

      { k:'hygienePueri', l:'Hygiène', req:true,
        o:['Neuf, jamais utilisé','Stérilisé et désinfecté','Lavé','À stériliser avant usage','Usage strictement personnel — non revendable'],
        alerte:{ bon:'Neuf, jamais utilisé',
          ok:['Stérilisé et désinfecté','Lavé','À stériliser avant usage'],
          texteBon:'Article neuf. Vérifiez l’emballage et la date si c’est un consommable.',
          texteMauvais:'Certains articles ne se partagent pas — tétines, sucettes, et les parties d’un tire-lait en contact avec le lait. Achetez-les neufs.',
          textes:{
            'Stérilisé et désinfecté':'Stérilisé, et le vendeur le dit. Restérilisez tout de même avant le premier usage : c’est rapide et cela ne coûte rien.',
            'À stériliser avant usage':'À stériliser avant usage : c’est normal sur de l’occasion, et le vendeur est honnête de le dire.'
          } },
        h:function (S: Vals) {
          if (/strictement personnel/.test(S.hygienePueri || ''))
            return '!Tétines, sucettes et pièces d’un tire-lait en contact avec le lait ne se revendent pas. Vendez l’appareil sans ces pièces, en le précisant.'
          return 'La stérilisation est la première question d’un parent sur ce rayon. Y répondre franchement vend.'
        } },
      { k:'peremptionB', l:'Date limite', req:true,
        when:function (S: Vals) { return /Biberon|Couches|Assiette/.test(S.typePueri || '') },
        o:['Sans objet','Plus de 6 mois','Moins de 6 mois','Dépassée'],
        bloque:['Dépassée'],
        motifBloc:'Un consommable pour bébé dont la date est dépassée ne peut pas être vendu.' },
      rappel(),
      { k:'electriqueB', l:'Fonctionnement', req:true,
        when:function (S: Vals) { return /Chauffe|Stérilisateur|Tire-lait|Robot|Moniteur|Balance|Humidificateur|Veilleuse/.test(S.typePueri || '') },
        o:['Fonctionne, essai possible','Fonctionne, petit défaut','En panne'] },
      completB('un article de puériculture'),
      { k:'ageR', l:'Âge conseillé', multi:true, o:AGES }
    ]
  },

  'Vêtements de maternité': {
    couleurs: true, etat: true, livraison: true, prixLabel: 'Prix',
    aideCouleurs: 'Cochez chaque couleur disponible. Ouvrez-en une pour ses tailles et ses photos.',
    titre: function (S: Vals) { return [S.typeMat, (S.tailleMat || []).join('/')].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeMat', l:'Type', req:true,
        o:['Robe de grossesse','Pantalon de grossesse','Haut / t-shirt','Robe d’allaitement','Soutien-gorge d’allaitement','Ceinture de grossesse','Bandeau de soutien','Pyjama de maternité','Tenue de sortie de maternité','Boubou de grossesse','Lot de vêtements'] },
      { k:'tailleMat', l:'Tailles disponibles', lVar:'Tailles restantes dans cette couleur', multi:true, req:true, varOK:true,
        o:['XS','S','M','L','XL','2XL','3XL','36','38','40','42','44','46','48','Taille unique'] },
      { k:'trimestre', l:'Adapté au', multi:true,
        o:['1er trimestre','2e trimestre','3e trimestre','Après l’accouchement','Allaitement'] },
      { k:'matiereMat', l:'Matière', o:['Coton','Coton élasthanne','Viscose','Polyester','Wax / pagne','Lin','Jersey'] },
      lavage(),
      { k:'usureMat', l:'État', req:true,
        o:['Neuf avec étiquette','Neuf sans étiquette','Très bon état, peu porté','Bon état','Traces d’usage'] },
      { k:'nbPiecesMat', l:'Nombre de pièces', req:true, o:['1 pièce','2 à 5 pièces','Lot de 6 à 15','Grand lot'] }
    ]
  }
}

export const BEBE: DonneesCat = {
  sous: SOUS,
  paletteBase: PALETTE_BASE,
  toutesCouleurs: TOUTES_COULEURS,
  schemas: SCHEMAS,
}
