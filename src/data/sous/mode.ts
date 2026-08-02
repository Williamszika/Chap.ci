/* ==========================================================================
 *  MODE & BEAUTÉ — un schéma par sous-catégorie.
 *
 *  Deux réalités commandent cette catégorie en Côte d'Ivoire :
 *
 *  1. LES PRODUITS ÉCLAIRCISSANTS SONT INTERDITS. Un décret adopté en Conseil
 *     des ministres fin avril 2015 — une première en Afrique de l'Ouest —
 *     prohibe la fabrication, la commercialisation ET l'utilisation des
 *     dépigmentants contenant mercure et ses dérivés, corticoïdes, vitamine A
 *     à visée dépigmentante, ou hydroquinone au-delà de 2 %. Chap.ci ne peut
 *     pas héberger ces annonces : la question est donc posée avant publication,
 *     et une réponse positive refuse l'annonce.
 *
 *  2. LE FAUX WAX. La hiérarchie de valeur est connue de tous ici : wax
 *     hollandais (Vlisco) en haut, puis la production du groupe — Uniwax,
 *     fabriqué à Yopougon depuis 1967, et Woodin — puis très loin derrière les
 *     imprimés importés d'Asie. Vendre un imprimé chinois pour du Vlisco est
 *     l'arnaque la plus courante du marché du pagne. Le formulaire demande donc
 *     la marque, et sépare « authentique » de « sans preuve ».
 *
 *  Sources : décret de 2015 (Jeune Afrique, France Info, AlloDocteurs),
 *  Uniwax / Vlisco, Forbes Afrique, France 24.
 * ========================================================================== */
import type { ChampCourt, DonneesCat, SchemaSous, Vals } from './contrat'
import { enregistrerCouleurs, type Couleur } from '../couleurs'


const SOUS = ['Vêtements Femme', 'Vêtements Homme', 'Chaussures', 'Sacs & Bijoux', 'Pagnes & Tissus', 'Beauté & Cosmétiques']

const TAILLES_LETTRE = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'Taille unique']
const TAILLES_FEMME = ['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56']
const TAILLES_HOMME = ['38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60']
const POINTURES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48']

const MATIERES = ['Coton', 'Wax', 'Bazin', 'Lin', 'Soie', 'Polyester', 'Jean', 'Laine', 'Dentelle', 'Satin', 'Cuir', 'Simili cuir', 'Viscose', 'Mélange']

/* ==========================================================================
 *  LES PALETTES — chaque marché a son vocabulaire de couleur.
 *
 *  Proposer « Noir, Blanc, Gris, Argenté, Doré, Bleu… » pour un fond de teint
 *  n'a aucun sens : une carnation ne se choisit pas dans la palette d'une robe.
 *  Une mèche ne se vend pas « marron », elle se vend « 27 · Miel » ou « 1B ».
 *  Chaque sous-catégorie reçoit donc la liste que ses vendeurs emploient déjà.
 * ========================================================================== */

const PALETTE_BASE: Couleur[] = [
  { nom:'Noir', css:'#1B1A17' }, { nom:'Blanc', css:'#FFFFFF', clair:true },
  { nom:'Gris', css:'#9CA3AF' }, { nom:'Argenté', css:'linear-gradient(135deg,#F3F4F6,#9CA3AF)', clair:true },
  { nom:'Doré', css:'linear-gradient(135deg,#F5D882,#D4AF37)', clair:true },
  { nom:'Bleu', css:'#2563EB' }, { nom:'Vert', css:'#16A34A' }, { nom:'Rouge', css:'#DC2626' },
  { nom:'Orange', css:'#F97316' }, { nom:'Jaune', css:'#FACC15', clair:true },
  { nom:'Rose', css:'#EC4899' }, { nom:'Violet', css:'#8B5CF6' }, { nom:'Marron', css:'#92400E' },
  { nom:'Beige', css:'#E8D8C3', clair:true },
  { nom:'Multicolore', css:'conic-gradient(#F77F00,#FACC15,#16A34A,#2563EB,#8B5CF6,#EC4899,#F77F00)' }
]

/* Les numéros que tout le monde emploie à Adjamé et à Cocody. */
const PALETTE_CHEVEUX: Couleur[] = [
  { nom:'1 · Noir de jais', css:'#0A0A0A' },
  { nom:'1B · Noir naturel', css:'#14100E' },
  { nom:'2 · Brun très foncé', css:'#2A1A12' },
  { nom:'4 · Châtain', css:'#5A3722' },
  { nom:'6 · Châtain clair', css:'#7B4E2E' },
  { nom:'27 · Miel', css:'#B87A3D' },
  { nom:'30 · Cuivré', css:'#A85520' },
  { nom:'33 · Acajou', css:'#6E2B22' },
  { nom:'99J · Bordeaux', css:'#5A1224' },
  { nom:'613 · Blond platine', css:'#E4CFA1', clair:true },
  { nom:'Gris / argent', css:'#A8A29E' },
  { nom:'Ombré / mèches', css:'linear-gradient(180deg,#14100E 45%,#B87A3D)' },
  { nom:'Coloré (fantaisie)', css:'conic-gradient(#EC4899,#8B5CF6,#2563EB,#16A34A,#FACC15,#EC4899)' }
]

/* Les carnations, du plus clair au plus profond. Une teinte de fond de teint
   qui ne correspond pas se revend jamais : c'est LE champ de ce marché. */
const PALETTE_TEINT: Couleur[] = [
  { nom:'Très clair', css:'#F0D5BE', clair:true },
  { nom:'Clair', css:'#E8C39E', clair:true },
  { nom:'Beige doré', css:'#D9A97A', clair:true },
  { nom:'Miel', css:'#C68A4E' },
  { nom:'Caramel', css:'#B2703A' },
  { nom:'Noisette', css:'#96562C' },
  { nom:'Cacao', css:'#7A4423' },
  { nom:'Chocolat', css:'#5E3319' },
  { nom:'Ébène', css:'#452412' },
  { nom:'Ébène profond', css:'#2E1709' }
]

/* Lèvres, ongles, yeux : les noms des nuanciers, pas ceux des voitures. */
const PALETTE_MAQUILLAGE: Couleur[] = [
  { nom:'Nude', css:'#D6A48C', clair:true },
  { nom:'Rose', css:'#EC4899' },
  { nom:'Fuchsia', css:'#C2185B' },
  { nom:'Corail', css:'#FF6F52' },
  { nom:'Rouge', css:'#DC2626' },
  { nom:'Bordeaux', css:'#7A1F2B' },
  { nom:'Prune', css:'#6B2D5B' },
  { nom:'Marron', css:'#92400E' },
  { nom:'Orange', css:'#F97316' },
  { nom:'Doré', css:'linear-gradient(135deg,#F5D882,#D4AF37)', clair:true },
  { nom:'Argenté', css:'linear-gradient(135deg,#F3F4F6,#9CA3AF)', clair:true },
  { nom:'Noir', css:'#1B1A17' },
  { nom:'Bleu', css:'#2563EB' },
  { nom:'Vert', css:'#16A34A' },
  { nom:'Violet', css:'#8B5CF6' },
  { nom:'Transparent', css:'linear-gradient(135deg,#FFFFFF,#E5E7EB)', clair:true },
  { nom:'Pailleté', css:'conic-gradient(#FFF3C4,#D4AF37,#FFFFFF,#D4AF37,#FFF3C4)', clair:true }
]

/* Le moteur y puise la pastille de chaque nom rencontré. */
const TOUTES_COULEURS: Couleur[] = PALETTE_BASE.concat(PALETTE_CHEVEUX, PALETTE_TEINT, PALETTE_MAQUILLAGE)

/* Beauté : quels produits ont vraiment une couleur, et laquelle. */
const B_CHEVEUX = /Perruque|Tissage|Mèches|Extensions|Coloration/
const B_TEINT = /Fond de teint|Poudre/
const B_MAQUILLAGE = /Rouge à lèvres|Fard à paupières|Crayon|Mascara|Vernis|Faux ongles/

/* Un titre lisible : au-delà de trois tailles, on annonce la fourchette. */
function listeTailles(mot: string, t: string[]) {
  t = t || []
  if (!t.length) return ''
  if (t.length <= 3) return mot + ' ' + t.join('/')
  return t.length + ' ' + mot + 's, du ' + t[0] + ' au ' + t[t.length - 1]
}

/* L'authenticité — le même bloc pour tout ce qui porte une marque.
   « Sans marque » et « fait main » ne sont pas des aveux de faiblesse : ils se
   vendent très bien ici, et la couture sur mesure est un métier. Chacune des
   quatre réponses a donc sa phrase — une seule alarme, celle du flou. */
function authenticite(quoi: string): ChampCourt {
  return { k:'authenticite', l:'Authenticité', req:true,
    o:['Article authentique, avec preuve d’achat','Article authentique, sans preuve','Sans marque / création locale','Fait main / sur mesure'],
    alerte:{ bon:'Article authentique, avec preuve d’achat',
      ok:['Sans marque / création locale','Fait main / sur mesure'],
      texteBon:'Le vendeur déclare un article authentique et dit pouvoir le prouver. Demandez la facture ou l’emballage d’origine.',
      texteMauvais:'Aucune preuve d’authenticité n’est annoncée. Regardez les coutures, l’étiquette et le prix : ' + quoi + ' de marque vendu très en dessous du marché est rarement authentique.',
      textes:{
        'Sans marque / création locale':'Le vendeur annonce un article sans marque, et le dit. Jugez-le sur ses finitions et sa coupe, pas sur un logo.',
        'Fait main / sur mesure':'Pièce faite main ou cousue sur mesure. Demandez le délai de confection, les mesures nécessaires, et si les retouches sont comprises.'
      } },
    h:'Vendre une contrefaçon est interdit, quel que soit le prix affiché. Si l’article n’est pas de marque, dites-le : « sans marque » se vend très bien.' }
}

const SCHEMAS: Record<string, SchemaSous> = {

  /* ---------------------------------------------------------------- */
  'Vêtements Femme': {
    couleurs: true, etat: true, livraison: true, aideCouleurs: 'Cochez chaque couleur que vous avez. Ouvrez-la ensuite pour lui donner ses photos, son prix et les tailles qui lui restent.',
    titre: function (S: Vals) { return [S.typeF, S.matiere, listeTailles('taille', S.tailles)].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeF', l:'Type de vêtement', req:true,
        o:['Robe','Ensemble','Tailleur','Chemisier / haut','Jupe','Pantalon','Jean','T-shirt','Boubou','Kaba','Tenue traditionnelle','Tenue de mariage','Veste / blazer','Manteau','Pull / gilet','Maillot de bain','Lingerie','Tenue de sport','Pyjama','Autre'] },
      { k:'tailles', l:'Tailles disponibles', lVar:'Tailles restantes dans cette couleur', multi:true, req:true, varOK:true, o:TAILLES_LETTRE.concat(TAILLES_FEMME),
        h:'Cochez toutes les tailles que vous avez. Vous pourrez ensuite préciser, couleur par couleur, celles qui restent.' },
      { k:'matiere', l:'Matière', o:MATIERES, req:true },
      { k:'marqueF', l:'Marque', t: 'text' as const, ph:'Ex : Zara, création locale, sans marque' },
      { k:'style', l:'Style', multi:true, o:['Décontracté','Chic / soirée','Traditionnel','Bureau','Sport','Cérémonie','Grossesse'] },
      { k:'surMesure', l:'Fait sur mesure', t: 'toggle' as const, h:'Cochez si vous cousez sur mesure : indiquez alors le délai dans la description.' },
      authenticite('un vêtement')
    ]
  },

  /* ---------------------------------------------------------------- */
  'Vêtements Homme': {
    couleurs: true, etat: true, livraison: true, aideCouleurs: 'Cochez chaque couleur que vous avez. Ouvrez-la ensuite pour lui donner ses photos, son prix et les tailles qui lui restent.',
    titre: function (S: Vals) { return [S.typeH, S.matiere, listeTailles('taille', S.tailles)].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeH', l:'Type de vêtement', req:true,
        o:['Chemise','T-shirt / polo','Pantalon','Jean','Costume','Veste / blazer','Boubou','Tenue traditionnelle','Short','Pull / sweat','Manteau','Tenue de sport','Sous-vêtement','Pyjama','Autre'] },
      { k:'tailles', l:'Tailles disponibles', lVar:'Tailles restantes dans cette couleur', multi:true, req:true, varOK:true, o:TAILLES_LETTRE.concat(TAILLES_HOMME),
        h:'Cochez toutes les tailles que vous avez. Vous pourrez ensuite préciser, couleur par couleur, celles qui restent.' },
      { k:'colChemise', l:'Tour de col', o:['37','38','39','40','41','42','43','44','45','46'],
        when:function (S: Vals) { return S.typeH === 'Chemise' } },
      { k:'matiere', l:'Matière', o:MATIERES, req:true },
      { k:'marqueH', l:'Marque', t: 'text' as const, ph:'Ex : Lacoste, création locale, sans marque' },
      { k:'style', l:'Style', multi:true, o:['Décontracté','Chic / soirée','Traditionnel','Bureau','Sport','Cérémonie'] },
      { k:'surMesure', l:'Fait sur mesure', t: 'toggle' as const },
      authenticite('un vêtement')
    ]
  },

  /* ---------------------------------------------------------------- */
  'Chaussures': {
    couleurs: true, etat: true, livraison: true,
    aideCouleurs: 'Cochez chaque couleur que vous avez. Ouvrez-la ensuite pour lui donner ses photos, son prix et les pointures qui lui restent.',
    titre: function (S: Vals) { return [S.typeCh, S.marqueCh, listeTailles('pointure', S.pointures)].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeCh', l:'Type de chaussure', req:true,
        o:['Baskets','Sandales','Escarpins','Mocassins','Chaussures de ville','Bottes','Ballerines','Claquettes','Tongs','Chaussures de sport','Chaussures de sécurité','Babouches','Autre'] },
      { k:'pour', l:'Pour', req:true, o:['Femme','Homme','Enfant','Mixte'] },
      { k:'pointures', l:'Pointures disponibles', lVar:'Pointures restantes dans cette couleur', multi:true, req:true, varOK:true, o:POINTURES,
        h:'Cochez toutes les pointures en stock. Une annonce qui annonce une pointure absente fait perdre l’acheteur et la vente.' },
      { k:'marqueCh', l:'Marque', t: 'text' as const, ph:'Ex : Nike, Adidas, sans marque' },
      { k:'matiereCh', l:'Matière', o:['Cuir véritable','Simili cuir','Toile','Daim','Caoutchouc','Textile','Plastique'] },
      { k:'talon', l:'Hauteur de talon', o:['Plat','Petit (moins de 5 cm)','Moyen (5 à 8 cm)','Haut (plus de 8 cm)','Compensé'],
        when:function (S: Vals) { return /Escarpins|Sandales|Bottes|Ballerines/.test(S.typeCh || '') } },
      authenticite('un article')
    ]
  },

  /* ---------------------------------------------------------------- */
  'Sacs & Bijoux': {
    etat: true, livraison: true,
    // Un sac existe en noir et en marron : la couleur est une vraie variante.
    // Un bijou, non — sa « couleur », c'est son métal, et une chaîne en or ne
    // se vend pas au prix d'une chaîne en argent. Deux annonces, pas deux
    // pastilles.
    couleurs: function (S: Vals) { return !!S.famille && S.famille !== 'Bijou' },
    sansCouleur: function (S: Vals) {
      return S.famille === 'Bijou'
        ? 'Un bijou n’a pas de pastille de couleur : c’est son métal qui la donne. Une chaîne en or et la même en argent sont deux annonces, pas deux variantes.'
        : 'La première photo sert de couverture.'
    },
    aideCouleurs: 'Cochez chaque couleur que vous avez. Ouvrez-la ensuite pour lui donner ses photos, son prix et un détail court.',
    titre: function (S: Vals) { return [S.typeSB, S.marqueSB, S.carat].filter(Boolean).join(' · ') },
    champs: [
      { k:'famille', l:'Catégorie', req:true, o:['Sac / maroquinerie','Bijou','Montre','Accessoire'] },
      { k:'typeSB', l:'Type', req:true, dependDe:'famille', libre:'Autre',
        table:{
          'Sac / maroquinerie': ['Sac à main','Sac à dos','Sac bandoulière','Pochette','Cabas','Valise','Portefeuille','Ceinture','Trousse'],
          'Bijou': ['Collier','Bracelet','Bague','Boucles d’oreilles','Parure complète','Chaîne','Pendentif','Chevillère','Alliance'],
          'Montre': ['Montre femme','Montre homme','Montre connectée','Montre de luxe'],
          'Accessoire': ['Lunettes de soleil','Écharpe / foulard','Chapeau','Gants','Cravate','Nœud papillon','Bandeau']
        } },
      { k:'marqueSB', l:'Marque', t: 'text' as const, ph:'Ex : Guess, artisanat local, sans marque' },
      { k:'matiereSB', l:'Matière', when:function (S: Vals) { return S.famille === 'Sac / maroquinerie' || S.famille === 'Accessoire' },
        o:['Cuir véritable','Simili cuir','Toile','Raphia','Perles','Wax','Tissu','Plastique'] },
      { k:'metal', l:'Métal', when:function (S: Vals) { return S.famille === 'Bijou' || S.famille === 'Montre' },
        o:['Or','Argent','Plaqué or','Acier inoxydable','Bronze','Fantaisie','Perles','Pierres'] },
      { k:'carat', l:'Titre de l’or', when:function (S: Vals) { return S.metal === 'Or' || S.metal === 'Plaqué or' },
        o:['9 carats','14 carats','18 carats','21 carats','22 carats','24 carats','Je ne sais pas'], req:true,
        h:'Le titre change tout sur le prix. Un acheteur averti demandera le poinçon — ou fera peser la pièce.' },
      { k:'poids', l:'Poids', t: 'num' as const, unite:'g', ph:'Ex : 12',
        when:function (S: Vals) { return S.famille === 'Bijou' && (S.metal === 'Or' || S.metal === 'Argent') },
        h:'Sur un bijou en or, le poids et le titre font le prix. Les annoncer évite trois messages de négociation.' },
      authenticite('un article')
    ]
  },

  /* ---------------------------------------------------------------- */
  'Pagnes & Tissus': {
    couleurs: true, etat: true, livraison: true,
    // Un même dessin de wax se décline en plusieurs coloris. Ce qu'on coche
    // ici, c'est la couleur dominante de chaque pièce — pas toutes celles de
    // l'imprimé, sinon la réponse est « multicolore » à chaque fois.
    labCouleurs: 'Coloris disponibles',
    aideCouleurs: 'Le même dessin existe souvent en plusieurs coloris. Cochez-les, puis ouvrez-en un pour lui donner ses photos, son prix et un détail court.',
    aideCoulChamp: 'Cochez la couleur dominante de chaque pièce. Pour un imprimé très chargé, « Multicolore ».',
    titre: function (S: Vals) {
      return [S.typeTissu, S.marqueTissu !== 'Autre / je ne sais pas' ? S.marqueTissu : '', S.longueur].filter(Boolean).join(' · ')
    },
    champs: [
      { k:'typeTissu', l:'Type de tissu', req:true,
        o:['Wax','Bazin riche','Kita / Kente','Bogolan','Tissu Korhogo','Dentelle','Brodé','Satin','Soie','Lin','Uni / coton','Voile','Autre'] },
      { k:'marqueTissu', l:'Marque ou origine', req:true,
        o:['Vlisco (wax hollandais)','Uniwax (Côte d’Ivoire)','Woodin','GTP (Ghana)','ATL','Getzner (bazin)','Imprimé importé (Asie)','Tissé / teint à la main','Autre / je ne sais pas'],
        alerte:{ bon:'Uniwax (Côte d’Ivoire)',
          ok:['Vlisco (wax hollandais)','Woodin','GTP (Ghana)','ATL','Getzner (bazin)','Tissé / teint à la main','Imprimé importé (Asie)'],
          texteBon:'Uniwax est fabriqué à Yopougon depuis 1967, dans le groupe Vlisco. Vérifiez la lisière : le nom y est imprimé.',
          texteMauvais:'Vérifiez la lisière du pagne : les vraies marques y impriment leur nom. Un imprimé importé vendu au prix du wax hollandais est l’arnaque la plus courante du marché du tissu.',
          textes:{
            'Vlisco (wax hollandais)':'Le wax hollandais est le haut de l’échelle des prix. Vérifiez la lisière : Vlisco y imprime son nom, et chaque pièce porte un numéro de dessin.',
            'Woodin':'Woodin appartient au même groupe que Vlisco et Uniwax. Le nom est imprimé sur la lisière.',
            'GTP (Ghana)':'Tissu ghanéen de la Ghana Textiles Printing, du même groupe. La lisière porte le nom.',
            'ATL':'ATL est un imprimeur ouest-africain reconnu. Vérifiez la lisière.',
            'Getzner (bazin)':'Le bazin riche Getzner est autrichien. Le vrai se reconnaît au grain, au poids et au tampon sur le rouleau.',
            'Tissé / teint à la main':'Pièce artisanale : kita, bogolan, Korhogo. Chaque pièce est unique — demandez des photos du tissu déplié, à la lumière du jour.',
            'Imprimé importé (Asie)':'Le vendeur annonce un imprimé importé, et le dit. C’est honnête : le prix doit être très inférieur à celui d’un wax de marque.'
          } },
        h:'Le wax hollandais (Vlisco) est en haut de l’échelle des prix, puis Uniwax et Woodin, puis très loin les imprimés importés d’Asie. Dire la vérité sur l’origine vous évite un client fâché.' },
      { k:'longueur', l:'Longueur vendue', req:true,
        o:['6 yards (le complet)','12 yards','3 yards','2 yards','Au mètre','Coupon / chute','Pagne tissé (unité)'],
        h:'Le pagne se vend traditionnellement en 6 yards — ce qu’on appelle « le complet ».' },
      { k:'metrage', l:'Nombre de mètres', t: 'num' as const, unite:'m', ph:'Ex : 5',
        when:function (S: Vals) { return S.longueur === 'Au mètre' || S.longueur === 'Coupon / chute' } },
      { k:'largeur', l:'Largeur', o:['1,15 m','1,20 m','1,40 m','1,50 m','Autre'] },
      { k:'motif', l:'Motif', multi:true, o:['Fleuri','Géométrique','Animalier','Symbolique','Uni','Pois','Rayé','Ethnique'] },
      { k:'usageTissu', l:'Idéal pour', multi:true, o:['Robe','Ensemble','Boubou','Chemise','Décoration','Cérémonie','Mariage','Deuil'] },
      { k:'lot', l:'Vendu en gros', t: 'toggle' as const, h:'Cochez si vous vendez par lots : les couturières et revendeuses le cherchent.' }
    ]
  },

  /* ---------------------------------------------------------------- */
  'Beauté & Cosmétiques': {
    livraison: true,
    // Un tube de lait corporel n'a pas de couleur. Un fond de teint a une
    // carnation, une mèche a un numéro, un vernis a une nuance — et ce ne
    // sont pas les mêmes listes. Le formulaire choisit la bonne, ou n'en
    // propose aucune.
    couleurs: function (S: Vals) {
      var t = S.typeBeaute || ''
      return B_CHEVEUX.test(t) || B_TEINT.test(t) || B_MAQUILLAGE.test(t)
    },
    palette: function (S: Vals) {
      var t = S.typeBeaute || ''
      if (B_CHEVEUX.test(t)) return PALETTE_CHEVEUX
      if (B_TEINT.test(t)) return PALETTE_TEINT
      return PALETTE_MAQUILLAGE
    },
    labCouleurs: function (S: Vals) {
      return B_CHEVEUX.test(S.typeBeaute || '') ? 'Couleurs disponibles' : 'Teintes disponibles'
    },
    aideCouleurs: function (S: Vals) {
      var t = S.typeBeaute || ''
      if (B_CHEVEUX.test(t)) return 'Cochez chaque couleur que vous avez. Ouvrez-la ensuite pour lui donner ses photos, son prix et les longueurs qui lui restent.'
      if (B_TEINT.test(t)) return 'Cochez chaque carnation que vous avez en stock. Ouvrez-en une pour lui donner ses photos et son prix.'
      return 'Cochez chaque teinte que vous avez. Ouvrez-en une pour lui donner ses photos, son prix et un détail court.'
    },
    aideCoulChamp: function (S: Vals) {
      var t = S.typeBeaute || ''
      if (B_CHEVEUX.test(t)) return 'Les numéros du marché : 1B pour le noir naturel, 27 pour le miel, 613 pour le blond platine.'
      if (B_TEINT.test(t)) return 'Une teinte qui ne correspond pas à la carnation ne se revend jamais. Photographiez la référence écrite sur le flacon.'
      return ''
    },
    sansCouleur: function (S: Vals) {
      return S.typeBeaute
        ? 'Ce produit n’a pas de teinte à choisir. Ajoutez vos photos — pensez à une vue lisible de l’étiquette.'
        : 'La première photo sert de couverture.'
    },
    // Un flacon de crème n'est pas « neuf ou d'occasion » : il est scellé,
    // ouvert, entamé ou testeur. Un sèche-cheveux, lui, l'est vraiment.
    etat: function (S: Vals) { return S.familleB === 'Accessoire beauté' },
    titre: function (S: Vals) { return [S.typeBeaute, S.marqueB, S.contenance].filter(Boolean).join(' · ') },
    champs: [
      { k:'familleB', l:'Famille', req:true,
        o:['Soin visage','Soin corps','Cheveux','Maquillage','Parfum','Ongles','Hygiène','Accessoire beauté'] },
      { k:'typeBeaute', l:'Type de produit', req:true, dependDe:'familleB', libre:'Autre',
        table:{
          'Soin visage': ['Crème','Sérum','Nettoyant','Masque','Gommage','Huile','Protection solaire'],
          'Soin corps': ['Lait corporel','Beurre de karité','Huile','Gommage','Savon','Déodorant','Anti-vergetures'],
          'Cheveux': ['Perruque','Tissage','Mèches','Shampoing','Après-shampoing','Masque capillaire','Huile capillaire','Gel / crème coiffante','Défrisant','Coloration','Extensions'],
          'Maquillage': ['Fond de teint','Poudre','Rouge à lèvres','Mascara','Fard à paupières','Palette','Crayon','Faux cils','Pinceaux'],
          'Parfum': ['Eau de parfum','Eau de toilette','Encens / bakhour','Huile parfumée','Brume corporelle'],
          'Ongles': ['Vernis','Faux ongles','Kit manucure','Lampe UV','Soin des ongles'],
          'Hygiène': ['Savon','Gel douche','Dentifrice','Intime','Rasage'],
          'Accessoire beauté': ['Miroir','Sèche-cheveux','Lisseur','Tondeuse','Épilateur','Éponge / houppette','Trousse']
        } },
      { k:'marqueB', l:'Marque', t: 'text' as const, ph:'Ex : Nivea, Dudu Osun, artisanal' },
      { k:'contenance', l:'Contenance', t: 'text' as const, ph:'Ex : 250 ml, 100 g, lot de 3',
        when:function (S: Vals) { return S.familleB !== 'Accessoire beauté' } },

      // --- Cheveux : le marché le plus actif de la catégorie ---------------
      { k:'typeCheveux', l:'Type de cheveux', req:true,
        o:['Cheveux naturels (humains)','Synthétique','Mèche brésilienne','Mèche péruvienne','Mèche indienne','Fibre mixte'],
        when:function (S: Vals) { return /Perruque|Tissage|Mèches|Extensions/.test(S.typeBeaute || '') } },
      { k:'longueurCheveux', l:'Longueurs disponibles', lVar:'Longueurs restantes dans cette couleur', multi:true, varOK:true,
        o:['8 pouces','10 pouces','12 pouces','14 pouces','16 pouces','18 pouces','20 pouces','22 pouces','24 pouces','26 pouces et plus'],
        h:'Comme pour les tailles : vous pourrez préciser, couleur par couleur, les longueurs qui restent.',
        when:function (S: Vals) { return /Perruque|Tissage|Mèches|Extensions/.test(S.typeBeaute || '') } },
      { k:'textureCheveux', l:'Texture', o:['Lisse','Ondulé','Bouclé','Crépu','Afro kinky','Water wave','Deep wave'],
        when:function (S: Vals) { return /Perruque|Tissage|Mèches|Extensions/.test(S.typeBeaute || '') } },

      // --- La question réglementaire : elle décide de la publication -------
      { k:'eclaircissant', l:'Ce produit éclaircit-il la peau ?', req:true,
        o:['Non — aucun agent éclaircissant','Oui — il contient un agent éclaircissant'],
        alerte:{ bon:'Non — aucun agent éclaircissant',
          texteBon:'Le vendeur déclare un produit sans agent éclaircissant. Lisez tout de même la composition sur l’emballage.',
          texteMauvais:'INTERDIT À LA VENTE en Côte d’Ivoire. Cette annonce ne peut pas être publiée.' },
        bloque:['Oui — il contient un agent éclaircissant'],
        motifBloc:'Les produits éclaircissants sont interdits à la vente en Côte d’Ivoire (décret d’avril 2015).',
        h:function (S: Vals) {
          var base = 'Un décret adopté en Conseil des ministres en avril 2015 interdit en Côte d’Ivoire la fabrication, la commercialisation ET l’utilisation des produits dépigmentants contenant du mercure, des corticoïdes, de la vitamine A à visée éclaircissante, ou de l’hydroquinone au-delà de 2 %.'
          if (S.eclaircissant === 'Oui — il contient un agent éclaircissant')
            return '!Cette annonce ne peut pas être publiée sur Chap.ci. ' + base
          return base + ' Chap.ci ne peut pas héberger ces annonces.'
        },
        when:function (S: Vals) { return S.familleB !== 'Accessoire beauté' } },

      { k:'etatProduit', l:'État du produit', req:true,
        o:['Neuf, sous emballage scellé','Neuf, emballage ouvert','Entamé','Testeur'],
        h:'Un cosmétique entamé se vend, mais il doit être annoncé comme tel.',
        when:function (S: Vals) { return S.familleB !== 'Accessoire beauté' } },
      { k:'peremption', l:'Date de péremption', req:true,
        o:['Plus d’un an','6 mois à 1 an','3 à 6 mois','Moins de 3 mois','Dépassée','Non indiquée sur le produit'],
        bloque:['Dépassée'],
        motifBloc:'Un cosmétique dont la date de péremption est dépassée ne peut pas être vendu.',
        h:function (S: Vals) {
          if (S.peremption === 'Dépassée')
            return '!Cette annonce ne peut pas être publiée. Un cosmétique périmé appliqué sur la peau peut brûler.'
          if (S.peremption === 'Moins de 3 mois')
            return '!Dites-le clairement dans la description, et ajustez le prix : l’acheteur a moins de trois mois pour finir le produit.'
          return 'Un produit périmé appliqué sur la peau peut brûler. La date figure sur l’emballage, souvent près du code-barres.'
        },
        when:function (S: Vals) { return S.familleB !== 'Accessoire beauté' } },
      { k:'lot', l:'Vendu en gros', t: 'toggle' as const }
    ]
  }
}

export const MODE: DonneesCat = {
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
