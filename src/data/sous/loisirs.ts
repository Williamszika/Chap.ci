/* ==========================================================================
 *  LOISIRS & SPORT — ce qu'on achète pour son plaisir.
 *
 *  Une catégorie légère, avec deux endroits où il ne faut pas l'être :
 *
 *  1. LES ARMES. Fusils, armes de poing, munitions : leur vente est
 *     strictement encadrée en Côte d'Ivoire et passe par un armurier agréé
 *     avec autorisation préfectorale. Elle ne se fait pas par petite annonce.
 *     Les répliques et le matériel de chasse non létal restent autorisés.
 *
 *  2. LE COMPLET / INCOMPLET. C'est le litige n°1 de tout ce qui se joue à
 *     plusieurs ou se monte : un jeu de société sans ses pions, un vélo sans
 *     sa clé, un instrument sans son archet. La question est posée partout.
 *
 *  Le reste est du bon sens de marché : la taille pour un vélo, la tonalité
 *  pour un instrument, l'état de la jante et des freins, l'édition d'un livre.
 * ========================================================================== */
import type { ChampCourt, DonneesCat, SchemaSous, Vals } from './contrat'
import { enregistrerCouleurs, type Couleur } from '../couleurs'


const SOUS = ['Sport & Fitness', 'Vélos & Trottinettes', 'Instruments de musique', 'Livres & BD', 'Jeux de société & Puzzles', 'Collections']

const PALETTE_BASE: Couleur[] = [
  { nom:'Noir', css:'#1B1A17' }, { nom:'Blanc', css:'#FFFFFF', clair:true },
  { nom:'Gris', css:'#9CA3AF' }, { nom:'Argenté', css:'linear-gradient(135deg,#F3F4F6,#9CA3AF)', clair:true },
  { nom:'Rouge', css:'#DC2626' }, { nom:'Bleu', css:'#2563EB' },
  { nom:'Vert', css:'#16A34A' }, { nom:'Jaune', css:'#FACC15', clair:true },
  { nom:'Orange', css:'#F97316' }, { nom:'Rose', css:'#EC4899' },
  { nom:'Violet', css:'#8B5CF6' }, { nom:'Marron / bois', css:'#7A4423' },
  { nom:'Doré', css:'linear-gradient(135deg,#F5D882,#D4AF37)', clair:true },
  { nom:'Multicolore', css:'conic-gradient(#F77F00,#FACC15,#16A34A,#2563EB,#EC4899,#F77F00)' }
]
const TOUTES_COULEURS: Couleur[] = PALETTE_BASE

/* Le litige n°1 : il manque une pièce. */
function complet(quoi: string): ChampCourt {
  return { k:'complet', l:'Complet ?', req:true,
    o:['Complet, rien ne manque','Il manque une pièce, je le dis dans la description','Incomplet — vendu tel quel'],
    alerte:{ bon:'Complet, rien ne manque',
      ok:['Il manque une pièce, je le dis dans la description','Incomplet — vendu tel quel'],
      texteBon:'Annoncé complet. Vérifiez-le à la remise : c’est plus facile que de rappeler le vendeur le lendemain.',
      texteMauvais:'Il manque quelque chose. Demandez exactement quoi, et si la pièce se retrouve, avant de fixer le prix.',
      textes:{
        'Il manque une pièce, je le dis dans la description':'Le vendeur annonce ce qui manque. C’est honnête — demandez si la pièce se remplace facilement.',
        'Incomplet — vendu tel quel':'Vendu incomplet, et le vendeur le dit. Le prix doit être celui d’un objet incomplet.'
      } },
    h:'C’est le premier litige sur ' + quoi + ' d’occasion. Comptez avant de photographier, cela vous évitera un message désagréable.' }
}

const SCHEMAS: Record<string, SchemaSous> = {

  'Sport & Fitness': {
    couleurs: true, etat: true, livraison: true, prixLabel: 'Prix',
    aideCouleurs: 'Cochez chaque couleur disponible. Ouvrez-en une pour lui donner ses photos et son prix.',
    titre: function (S: Vals) { return [S.typeSport, S.marqueL, S.tailleSport].filter(Boolean).join(' · ') },
    champs: [
      { k:'disciplineS', l:'Discipline', req:true,
        o:['Musculation / fitness','Football','Basketball','Course à pied','Arts martiaux','Boxe','Natation','Tennis','Cyclisme','Yoga / pilates','Danse','Pétanque','Randonnée','Pêche','Chasse'] },
      { k:'typeSport', l:'Type d’article', req:true,
        o:['Haltères / poids','Banc de musculation','Appareil de musculation','Tapis de course','Vélo d’appartement','Rameur','Corde à sauter','Ballon','Raquette','Gants','Tenue / maillot','Chaussures de sport','Sac de sport','Protection / casque','Tapis de sol','Filet / but','Matériel de pêche','Matériel de chasse'] },

      // Une réponse refuse l'annonce.
      { k:'arme', l:'S’agit-il d’une arme ?', req:true,
        when:function (S: Vals) { return /Chasse|Pêche|Arts martiaux|Boxe/.test(S.disciplineS || '') || /chasse|pêche/i.test(S.typeSport || '') },
        o:['Non — accessoire, vêtement ou matériel non létal','Réplique factice ou de décoration, non fonctionnelle','Arme à feu, munitions ou arme blanche'],
        alerte:{ bon:'Non — accessoire, vêtement ou matériel non létal',
          ok:['Réplique factice ou de décoration, non fonctionnelle'],
          texteBon:'Matériel de sport ou de loisir ordinaire, rien à signaler.',
          texteMauvais:'INTERDIT. La vente d’armes à feu, de munitions et d’armes blanches passe par un armurier agréé avec autorisation préfectorale, jamais par une petite annonce.' },
        bloque:['Arme à feu, munitions ou arme blanche'],
        motifBloc:'La vente d’armes et de munitions est strictement encadrée : elle passe par un armurier agréé, pas par une petite annonce.',
        h:function (S: Vals) {
          if (/Arme à feu/.test(S.arme || ''))
            return '!Fusils, armes de poing, munitions et armes blanches ne se vendent qu’en armurerie agréée, sur présentation d’une autorisation préfectorale. Cette annonce ne sera pas publiée.'
          return 'Les cannes, moulinets, leurres, gilets et lampes restent parfaitement autorisés.'
        } },
      { k:'marqueL', l:'Marque', t: 'text' as const, ph:'Ex : Adidas, Decathlon, sans marque' },
      { k:'tailleSport', l:'Taille',
        when:function (S: Vals) { return /Tenue|Chaussures|Gants|Protection|Sac/.test(S.typeSport || '') },
        o:['XS','S','M','L','XL','2XL','3XL','Taille unique','Enfant','Pointure 36-40','Pointure 41-45'] },
      { k:'poidsSport', l:'Poids ou charge', t: 'text' as const,
        when:function (S: Vals) { return /Haltères|poids|Appareil|Banc/.test(S.typeSport || '') }, ph:'Ex : 2 × 10 kg' },
      complet('du matériel de sport'),
      { k:'usureSport', l:'Usure', req:true,
        o:['Comme neuf','Traces d’usage normales','Bien usé mais fonctionnel','Usure importante'] }
    ]
  },

  'Vélos & Trottinettes': {
    couleurs: true, etat: true, livraison: true, prixLabel: 'Prix',
    aideCouleurs: 'Cochez chaque couleur disponible.',
    titre: function (S: Vals) { return [S.typeVelo, S.marqueL, S.tailleVelo].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeVelo', l:'Type', req:true,
        o:['VTT','Vélo de ville','Vélo de course','Vélo enfant','Vélo pliant','Vélo électrique','Trottinette','Trottinette électrique','Draisienne','Tricycle enfant','BMX','Remorque / siège enfant'] },
      { k:'marqueL', l:'Marque', t: 'text' as const, ph:'Ex : Btwin, Rockrider, sans marque' },
      { k:'tailleVelo', l:'Taille de cadre / roue', req:true,
        o:['Roue 12" (enfant)','Roue 16"','Roue 20"','Roue 24"','Roue 26"','Roue 27,5"','Roue 29"','Cadre S','Cadre M','Cadre L','Cadre XL'],
        h:'La taille de roue ou de cadre est ce qui décide de l’achat. Sans elle, personne ne se déplace.' },
      { k:'vitesses', l:'Vitesses', o:['Vitesse unique','3 vitesses','6 vitesses','18 vitesses','21 vitesses','24 vitesses','27 vitesses et plus'] },
      { k:'freins', l:'Freins', req:true,
        o:['Freins à disque','Freins V-brake','Freins à patins','Frein à rétropédalage','Freins à revoir'],
        h:function (S: Vals) {
          if (/à revoir/.test(S.freins || ''))
            return '!Des freins à revoir sur un vélo, c’est un accident qui attend. Faites-les régler avant la vente, ou annoncez-le très clairement.'
          return ''
        } },
      { k:'batterieVelo', l:'Batterie', req:true,
        when:function (S: Vals) { return /électrique/.test(S.typeVelo || '') },
        o:['Batterie neuve','Bonne autonomie','Autonomie faible','Batterie à changer','Sans batterie'],
        h:'Sur un vélo ou une trottinette électrique, la batterie EST la valeur. Une batterie à changer coûte souvent la moitié du prix de l’engin.' },
      { k:'autonomieVelo', l:'Autonomie annoncée', t: 'num' as const, unite:'km',
        when:function (S: Vals) { return /électrique/.test(S.typeVelo || '') } },
      { k:'etatVelo', l:'État mécanique', req:true,
        o:['Roule parfaitement, essai possible','Petit réglage à faire','Chambre à air ou pneu à changer','Ne roule pas en l’état'],
        h:'Proposer un essai devant l’acheteur vend un vélo deux fois plus vite.' },
      complet('un vélo'),
      { k:'accessoiresVelo', l:'Fourni avec', multi:true,
        o:['Antivol','Casque','Pompe','Porte-bagages','Panier','Éclairage','Garde-boue','Béquille','Chargeur'] }
    ]
  },

  'Instruments de musique': {
    couleurs: true, etat: true, livraison: true, prixLabel: 'Prix',
    aideCouleurs: 'Cochez chaque finition disponible.',
    titre: function (S: Vals) { return [S.instrument, S.marqueL, S.tonalite].filter(Boolean).join(' · ') },
    champs: [
      { k:'familleInstru', l:'Famille', req:true,
        o:['Percussions','Cordes','Vents','Claviers','Sono & studio','Traditionnel ivoirien'] },
      { k:'instrument', l:'Instrument', req:true, dependDe:'familleInstru', libre:'Autre',
        table:{
          'Percussions': ['Djembé','Doundoun','Congas','Batterie complète','Caisse claire','Cajón','Tambour parleur','Balafon','Maracas'],
          'Cordes': ['Guitare acoustique','Guitare classique','Guitare électrique','Basse','Violon','Ukulélé','Kora','Ngoni','Harpe'],
          'Vents': ['Saxophone','Trompette','Trombone','Flûte','Clarinette','Harmonica','Tuba'],
          'Claviers': ['Piano droit','Piano numérique','Synthétiseur','Orgue','Accordéon','Clavier arrangeur'],
          'Sono & studio': ['Ampli guitare','Ampli basse','Table de mixage','Micro studio','Carte son','Casque studio','Enceinte de retour','Pied de micro'],
          'Traditionnel ivoirien': ['Djembé','Balafon','Kora','Tambour parleur','Ngoni','Calebasse percussion','Sanza']
        } },
      { k:'marqueL', l:'Marque', t: 'text' as const, ph:'Ex : Yamaha, Fender, fabrication artisanale' },
      { k:'tonalite', l:'Tonalité / taille',
        when:function (S: Vals) { return /Cordes|Vents|Claviers/.test(S.familleInstru || '') },
        o:['1/4','1/2','3/4','4/4 (entier)','Si bémol','Mi bémol','Do','61 touches','76 touches','88 touches'] },
      { k:'etatInstru', l:'État de jeu', req:true,
        o:['Prêt à jouer, bien réglé','Jouable, réglage à faire','Réparation nécessaire','Décoratif uniquement'],
        h:'Un instrument « jouable » et un instrument « bien réglé » ne sont pas le même prix. Une vidéo de vous en train d’en jouer vaut toutes les descriptions.' },
      { k:'artisanalInstru', l:'Fabrication', req:true,
        o:['Fabrication artisanale ivoirienne','Fabrication artisanale africaine','Fabrication industrielle','Je ne sais pas'],
        h:'Un djembé ou un balafon fabriqué ici, en bois massif et peau naturelle, se vend bien mieux qu’un instrument d’import. Dites-le et montrez le bois.' },
      complet('un instrument'),
      { k:'accessoiresInstru', l:'Fourni avec', multi:true,
        o:['Housse / étui','Sangle','Archet','Baguettes','Câble','Pied','Ampli','Accordeur','Pédale','Partitions'] }
    ]
  },

  'Livres & BD': {
    couleurs: false, etat: true, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez la couverture, la tranche et une page ouverte : c’est ce qui montre l’état réel.',
    titre: function (S: Vals) { return [S.genreLivre, S.nbLivres, S.langueLivre].filter(Boolean).join(' · ') },
    champs: [
      { k:'genreLivre', l:'Genre', req:true,
        o:['Scolaire / manuel','Parascolaire / annales','Roman','Bande dessinée','Littérature africaine','Religieux','Développement personnel','Cuisine','Enfant / jeunesse','Dictionnaire','Universitaire','Professionnel / technique','Magazine','Bande dessinée jeunesse'] },
      { k:'niveauLivre', l:'Niveau',
        when:function (S: Vals) { return /Scolaire|Parascolaire|Universitaire/.test(S.genreLivre || '') },
        o:['Maternelle','CP à CM2','6e à 3e','2nde à Terminale','BTS / licence','Master et plus'],
        h:'Le niveau et le programme sont ce qu’un parent tape dans la recherche à la rentrée.' },
      { k:'langueLivre', l:'Langue', req:true, o:['Français','Anglais','Bilingue','Arabe','Autre'] },
      { k:'nbLivres', l:'Nombre', req:true,
        o:['1 livre','2 à 5 livres','Lot de 6 à 20','Lot de plus de 20','Collection complète'] },
      { k:'etatLivre', l:'État', req:true,
        o:['Neuf, jamais ouvert','Très bon état','Bon état, quelques annotations','Pages cornées ou surlignées','Couverture abîmée','Pages manquantes'],
        alerte:{ bon:'Neuf, jamais ouvert',
          ok:['Très bon état','Bon état, quelques annotations','Pages cornées ou surlignées'],
          texteBon:'Livre neuf, jamais ouvert. Vérifiez tout de même l’année d’édition : sur un manuel scolaire, le programme change.',
          texteMauvais:'Livre abîmé. Demandez des photos de la reliure et des pages concernées avant de vous déplacer.',
          textes:{
            'Bon état, quelques annotations':'Quelques annotations : sur un manuel scolaire, cela ne gêne pas — et beaucoup d’élèves trouvent les surlignages utiles.',
            'Pages cornées ou surlignées':'Pages cornées ou surlignées : le livre reste tout à fait lisible. Le prix doit s’en ressentir un peu.',
            'Pages manquantes':'Des pages manquent. Sur un manuel scolaire, cela le rend inutilisable : demandez lesquelles avant d’acheter.'
          } },
        h:function (S: Vals) {
          if (/Pages manquantes/.test(S.etatLivre || ''))
            return '!Un manuel scolaire avec des pages manquantes ne sert plus à l’élève. Dites lesquelles, ou vendez le lot au poids.'
          return 'Sur un manuel scolaire, les annotations ne gênent pas — le dire honnêtement suffit largement.'
        } },
      { k:'anneeEdition', l:'Année d’édition', t: 'text' as const, ph:'Ex : 2023',
        h:'Sur un manuel scolaire, l’édition compte autant que le titre : le programme change.' }
    ]
  },

  'Jeux de société & Puzzles': {
    couleurs: false, etat: true, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez le contenu étalé, pas seulement la boîte. C’est ce qui prouve qu’il est complet.',
    titre: function (S: Vals) { return [S.typeJeuS, S.ageJeu, S.joueurs].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeJeuS', l:'Type', req:true,
        o:['Jeu de société','Puzzle','Jeu de cartes','Échecs / dames','Ludo / awalé','Jeu éducatif','Jeu de rôle','Jeu d’extérieur','Baby-foot','Billard','Fléchettes'],
        h:'Les jeux vidéo et les consoles sont dans Électronique ; les jouets d’enfant dans Bébé & Enfant.' },
      { k:'joueurs', l:'Nombre de joueurs', o:['1 joueur','2 joueurs','2 à 4 joueurs','4 à 6 joueurs','Plus de 6 joueurs'] },
      { k:'ageJeu', l:'Âge conseillé', req:true,
        o:['3 ans et plus','6 ans et plus','8 ans et plus','12 ans et plus','Adulte'] },
      { k:'piecesPuzzle', l:'Nombre de pièces',
        when:function (S: Vals) { return /Puzzle/.test(S.typeJeuS || '') },
        o:['Moins de 100','100 à 500','500 à 1000','1000 à 2000','Plus de 2000'] },
      complet('un jeu'),
      { k:'notice', l:'Règle du jeu', req:true,
        o:['Règle incluse','Règle trouvable en ligne','Sans règle'],
        h:'Un jeu sans sa règle et sans nom précis ne se rejoue jamais. Photographiez la notice.' },
      { k:'langueJeuS', l:'Langue', o:['Français','Anglais','Sans texte'] }
    ]
  },

  'Collections': {
    couleurs: false, etat: true, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez chaque pièce nettement, recto et verso, avec un repère de taille.',
    titre: function (S: Vals) { return [S.typeCollec, S.epoque, S.nbCollec].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeCollec', l:'Type de collection', req:true,
        o:['Timbres','Pièces de monnaie','Billets anciens','Cartes postales','Vinyles','Cassettes / CD','Figurines','Maquettes','Montres anciennes','Appareils photo anciens','Objets d’art','Masques anciens','Affiches','Journaux anciens','Cartes à collectionner'] },
      { k:'epoque', l:'Époque', o:['Avant 1960','1960-1980','1980-2000','Après 2000','Contemporain','Je ne sais pas'] },
      { k:'nbCollec', l:'Nombre de pièces', req:true,
        o:['1 pièce','2 à 10 pièces','10 à 50 pièces','50 à 200 pièces','Collection complète'] },
      { k:'authenticiteC', l:'Authenticité', req:true,
        o:['Authentique, avec certificat ou provenance','Authentique, sans document','Reproduction / copie assumée','Je ne sais pas'],
        alerte:{ bon:'Authentique, avec certificat ou provenance',
          ok:['Reproduction / copie assumée'],
          texteBon:'Le vendeur peut justifier la provenance. Demandez à voir le document avant de payer.',
          texteMauvais:'Aucun document de provenance. Sur une pièce de collection, faites expertiser avant de payer une somme importante.',
          textes:{
            'Reproduction / copie assumée':'Reproduction annoncée comme telle. C’est honnête, et cela se vend — au prix d’une reproduction.'
          } },
        h:'Sur les masques et objets d’art anciens, la reproduction est la règle et l’original l’exception. Le dire franchement vaut mieux que de laisser croire.' },
      { k:'etatCollec', l:'État de conservation', req:true,
        o:['Parfait','Très bon','Bon, traces du temps','Abîmé','Restauré'] }
    ]
  }
}

export const LOISIRS: DonneesCat = {
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
