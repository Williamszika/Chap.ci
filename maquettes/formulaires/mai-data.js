/* ==========================================================================
 *  MAISON & MEUBLES — un schéma par sous-catégorie.
 *
 *  Cinq réalités ivoiriennes commandent cette catégorie :
 *
 *  1. LE BOIS DÉCIDE DU PRIX. Iroko, teck, acajou (bois d'Afrique de l'Ouest,
 *     durables) contre aggloméré et MDF plaqués « effet bois ». Dans l'humidité
 *     d'Abidjan, un panneau aggloméré gonfle et se délite en une saison des
 *     pluies ; un iroko massif se transmet. Vendre l'un pour l'autre est
 *     l'arnaque quotidienne du meuble — d'où la question posée en clair.
 *
 *  2. LES TERMITES. Elles ne pardonnent pas au bois non traité. Le dire vaut
 *     mieux que de laisser l'acheteur le découvrir.
 *
 *  3. LE SUR-MESURE ET L'ACOMPTE. Beaucoup de meubles ne sont pas en stock :
 *     le menuisier fabrique. L'acheteur verse un acompte — et l'arnaque
 *     classique est l'acompte encaissé, le meuble jamais livré. Délai et
 *     montant de l'acompte deviennent donc obligatoires sur commande.
 *
 *  4. LA FACTURE CIE. Un réfrigérateur ou un climatiseur d'occasion se paie
 *     deux fois : à l'achat, puis chaque mois. Une boutique de quartier avec
 *     frigo et ventilateurs coûte 30 000 à 60 000 FCFA d'électricité par mois ;
 *     avec des climatiseurs, 70 000 à 150 000. La classe énergétique et la
 *     puissance ne sont pas des détails techniques : c'est le vrai prix.
 *
 *  5. L'ÉTAGE SANS ASCENSEUR. Un canapé trois places au quatrième étage n'est
 *     pas la même livraison qu'au rez-de-chaussée. Les dimensions aussi :
 *     un meuble qui ne passe pas la porte revient chez le vendeur.
 *
 *  Sources (juillet 2026) : CIE, ANARE-CI, annuaireci.com, BeautifulHome
 *  Abidjan, Les Bois d'Ivoire, Galerie Artisan.
 * ========================================================================== */

var SOUS = ['Meubles', 'Électroménager', 'Décoration', 'Cuisine', 'Jardin & Bricolage', 'Literie']

/* -------------------------------------------------------------------------
 *  Palettes — un meuble se choisit sur son bois, un drap sur sa couleur.
 * ------------------------------------------------------------------------- */
var PALETTE_BASE = [
  { nom:'Blanc', css:'#FFFFFF', clair:true }, { nom:'Noir', css:'#1B1A17' },
  { nom:'Gris', css:'#9CA3AF' }, { nom:'Beige', css:'#E8D8C3', clair:true },
  { nom:'Crème', css:'#F5EEE0', clair:true },
  { nom:'Marron', css:'#7A4423' }, { nom:'Taupe', css:'#8B7D6B' },
  { nom:'Bleu', css:'#2563EB' }, { nom:'Bleu nuit', css:'#1E3A5F' },
  { nom:'Vert', css:'#16A34A' }, { nom:'Rouge', css:'#DC2626' },
  { nom:'Bordeaux', css:'#7A1F2B' }, { nom:'Orange', css:'#F97316' },
  { nom:'Jaune', css:'#FACC15', clair:true }, { nom:'Rose', css:'#EC4899' },
  { nom:'Violet', css:'#8B5CF6' }, { nom:'Doré', css:'linear-gradient(135deg,#F5D882,#D4AF37)', clair:true },
  { nom:'Argenté / inox', css:'linear-gradient(135deg,#F3F4F6,#9CA3AF)', clair:true },
  { nom:'Wax / imprimé', css:'conic-gradient(#F77F00,#FACC15,#16A34A,#2563EB,#DC2626,#F77F00)' },
  { nom:'Multicolore', css:'conic-gradient(#EC4899,#8B5CF6,#2563EB,#16A34A,#FACC15,#EC4899)' }
]

/* Les teintes de bois, pour ce qui se vend AU BOIS et non à la couleur. */
var PALETTE_BOIS = [
  { nom:'Bois naturel clair', css:'#D6B98C', clair:true },
  { nom:'Bois miel', css:'#B8823C' },
  { nom:'Teck', css:'#9C6B32' },
  { nom:'Iroko', css:'#8A5A2B' },
  { nom:'Acajou', css:'#6B3A26' },
  { nom:'Wengé / brun foncé', css:'#3E2A20' },
  { nom:'Ébène / noir', css:'#1B1A17' },
  { nom:'Blanc laqué', css:'#FFFFFF', clair:true },
  { nom:'Gris', css:'#9CA3AF' },
  { nom:'Bicolore bois et blanc', css:'linear-gradient(135deg,#B8823C 50%,#FFFFFF 50%)', clair:true }
]

var TOUTES_COULEURS = PALETTE_BASE.concat(PALETTE_BOIS)

/* -------------------------------------------------------------------------
 *  Blocs partagés
 * ------------------------------------------------------------------------- */

/* Ce qui décide du prix ET de la durée de vie d'un meuble ivoirien. */
function matiereMeuble() {
  return { k:'matiere', l:'Matière', req:true,
    o:['Bois massif — iroko','Bois massif — teck','Bois massif — acajou','Bois massif — autre essence','Contreplaqué','Aggloméré / MDF plaqué','Métal','Rotin / bambou','Plastique / résine','Verre','Tissu et mousse'],
    alerte:{ bon:'Bois massif — iroko',
      ok:['Bois massif — teck','Bois massif — acajou','Bois massif — autre essence','Métal','Rotin / bambou','Verre','Contreplaqué'],
      texteBon:'Iroko massif : c’est le bois qui tient le mieux à l’humidité d’Abidjan. Un meuble en iroko se transmet — vérifiez que la tranche est bien du bois plein, pas un placage.',
      texteMauvais:'Aggloméré ou MDF : sous l’humidité d’Abidjan, ces panneaux gonflent et se délitent, surtout au contact du sol. Regardez la tranche et le dessous du meuble avant de payer.',
      textes:{
        'Bois massif — teck':'Teck massif : dense, naturellement résistant à l’eau et aux insectes. Vérifiez la tranche — le placage imite bien le teck.',
        'Bois massif — acajou':'Acajou massif : bois noble d’Afrique de l’Ouest, solide et beau. Vérifiez que la tranche est du bois plein.',
        'Bois massif — autre essence':'Bois massif : demandez laquelle. Samba et fromager sont tendres et bien plus fragiles qu’un iroko.',
        'Contreplaqué':'Contreplaqué : correct et honnête, bien au-dessus de l’aggloméré, mais loin d’un massif. Le prix doit s’en ressentir.',
        'Métal':'Métal : durable. Regardez les soudures et les points de rouille, surtout aux pieds.',
        'Rotin / bambou':'Rotin ou bambou : léger et joli. Vérifiez qu’aucun brin n’est cassé et que le tressage ne se défait pas.',
        'Verre':'Verre : demandez s’il est trempé. Un verre ordinaire sur une table basse est un accident qui attend.',
        'Tissu et mousse':'Tissu et mousse : la structure en dessous compte autant. Demandez de quel bois est le cadre.'
      } },
    h:'C’est la question qui fait le prix. « Bois » ne veut rien dire tout seul : demandez à voir la tranche du panneau et le dessous du meuble.' }
}

/* Le sur-mesure, et l'acompte qui va avec. */
function surMesure(quoi) {
  return [
    { k:'dispo', l:'Disponibilité', req:true,
      o:['En stock, à emporter tout de suite','Sur commande — je fabrique','Sur commande — je fais venir'],
      h:'Beaucoup de meubles ne sont pas en stock ici : le dire évite un déplacement pour rien.' },
    { k:'delai', l:'Délai de fabrication ou de livraison', req:true,
      when:function (S) { return /Sur commande/.test(S.dispo || '') },
      o:['Moins de 3 jours','3 à 7 jours','1 à 2 semaines','2 à 4 semaines','Plus d’un mois','Selon la commande'] },
    { k:'acompte', l:'Acompte demandé', req:true,
      when:function (S) { return /Sur commande/.test(S.dispo || '') },
      o:['Aucun acompte','25 % à la commande','50 % à la commande','70 % à la commande','Paiement intégral d’avance'],
      h:function (S) {
        if (S.acompte === 'Paiement intégral d’avance')
          return '!Exiger la totalité avant de fabriquer fait fuir les acheteurs prudents — et c’est exactement le schéma de l’arnaque à l’acompte. Un acompte de 50 % rassure bien davantage.'
        if (S.acompte === '70 % à la commande')
          return '!C’est beaucoup. Prévoyez un reçu écrit avec la date de livraison promise : c’est ce qui vous distingue de celui qui encaisse et disparaît.'
        return 'Un acompte est normal pour ' + quoi + '. Remettez toujours un reçu écrit avec la date promise — c’est ce qui vous distingue de l’arnaqueur.'
      } }
  ]
}

/* Les dimensions : un meuble qui ne passe pas la porte revient chez le vendeur. */
function dimensions() {
  return { k:'dims', l:'Dimensions (L × l × H)', t:'text', req:true, ph:'Ex : 180 × 85 × 75 cm',
    h:'Obligatoire, et ce n’est pas une formalité : un canapé qui ne passe pas la porte ou l’ascenseur revient chez vous, à vos frais.' }
}

/* La livraison, telle qu'elle se pratique vraiment à Abidjan. */
function livraisonEtage() {
  return [
    { k:'livrDetail', l:'Livraison', req:true,
      o:['À emporter uniquement','Livraison gratuite dans ma commune','Livraison payante — je donne le tarif','Livraison à la charge de l’acheteur'] },
    { k:'etage', l:'Livraison à l’étage', multi:true,
      when:function (S) { return /Livraison/.test(S.livrDetail || '') },
      o:['Rez-de-chaussée uniquement','Étage avec ascenseur','Étage sans ascenseur','Supplément par étage'],
      h:'Un canapé trois places au quatrième sans ascenseur, ce n’est pas la même livraison qu’au rez-de-chaussée. Dites-le avant, pas devant l’immeuble.' },
    { k:'montage', l:'Montage', req:true,
      o:['Livré monté','À monter — notice fournie','À monter — sans notice','Montage assuré par moi (compris)','Montage assuré par moi (en supplément)'] }
  ]
}

/* L'électricité qu'un appareil consommera CHAQUE MOIS, en plus de son prix. */
function energie() {
  return [
    { k:'classeEnergie', l:'Classe énergétique', req:true,
      o:['A+++ / A++','A+','A','B','C','D ou moins','Non indiquée'],
      h:function (S) {
        if (/D ou moins|C$/.test(S.classeEnergie || ''))
          return '!Un appareil de cette classe se paie deux fois : à l’achat, puis chaque mois sur la facture CIE. Annoncez-le honnêtement et ajustez le prix.'
        if (S.classeEnergie === 'Non indiquée')
          return 'L’étiquette est collée sur la porte ou au dos. Si elle a disparu, dites-le — mais photographiez la plaque signalétique.'
        return 'Une boutique de quartier avec frigo et ventilateurs paie 30 000 à 60 000 FCFA d’électricité par mois ; avec des climatiseurs, 70 000 à 150 000. La classe est un vrai argument de vente.'
      } },
    { k:'puissanceW', l:'Puissance', t:'num', unite:'W', ph:'Ex : 150',
      h:'Écrite sur la plaque signalétique. Elle dit aussi si un groupe électrogène pourra faire tourner l’appareil pendant les coupures.' },
    { k:'voltage', l:'Tension d’alimentation', req:true,
      o:['220–240 V (standard Côte d’Ivoire)','110 V — transformateur nécessaire','Bi-tension 110/220 V'],
      h:function (S) {
        if (/110 V —/.test(S.voltage || ''))
          return '!La Côte d’Ivoire est en 230 V / 50 Hz. Sans transformateur, cet appareil grille au premier branchement. Précisez s’il est fourni.'
        return 'La Côte d’Ivoire est en 230 V / 50 Hz, prises de type C et E.'
      } }
  ]
}

/* Un appareil « en panne » se vend très bien — à condition de le dire. */
function etatMarche(quoi) {
  return { k:'etatMarche', l:'Fonctionnement', req:true,
    o:['Fonctionne parfaitement, essai possible','Fonctionne, petit défaut annoncé','En panne — vendu pour pièces ou à réparer'],
    alerte:{ bon:'Fonctionne parfaitement, essai possible',
      ok:['En panne — vendu pour pièces ou à réparer'],
      texteBon:'Le vendeur propose de le faire fonctionner devant vous. Exigez-le : sur ' + quoi + ' d’occasion, c’est la seule vérification qui compte.',
      texteMauvais:'Un défaut est annoncé. Demandez lequel exactement, et faites brancher l’appareil devant vous avant de payer.',
      textes:{
        'En panne — vendu pour pièces ou à réparer':'Vendu en panne, et le vendeur le dit. C’est honnête — le prix doit être celui des pièces, pas celui d’un appareil qui marche.'
      } },
    h:'Un appareil en panne se vend très bien ici, à condition de l’annoncer. Ce qui fait le litige, c’est le silence.' }
}

var SCHEMAS = {

  /* ================================================================== */
  'Meubles': {
    etat: true, livraison: false, couleurs: true,
    palette: PALETTE_BOIS,
    labCouleurs: 'Teintes disponibles',
    aideCouleurs: 'Cochez chaque teinte que vous proposez. Ouvrez-en une pour lui donner ses photos, son prix et un détail court.',
    aideCoulChamp: 'La teinte du bois ou de la finition, pas celle du tissu.',
    titre: function (S) { return [S.typeMeuble, S.matiere, S.dims].filter(Boolean).join(' · ') },
    champs: [
      { k:'piece', l:'Pièce', req:true,
        o:['Salon','Chambre','Salle à manger','Bureau','Entrée','Terrasse / extérieur','Enfant','Rangement'] },
      { k:'typeMeuble', l:'Type de meuble', req:true, dependDe:'piece', libre:'Autre',
        table:{
          'Salon': ['Canapé 2 places','Canapé 3 places','Salon complet','Fauteuil','Table basse','Meuble TV','Bibliothèque','Pouf','Bar'],
          'Chambre': ['Lit','Armoire','Commode','Table de chevet','Coiffeuse','Chambre complète','Dressing'],
          'Salle à manger': ['Table à manger','Chaises','Ensemble table et chaises','Buffet','Vaisselier','Desserte'],
          'Bureau': ['Bureau','Chaise de bureau','Caisson','Étagère','Bureau complet','Table de réunion'],
          'Entrée': ['Meuble à chaussures','Porte-manteau','Console','Miroir sur pied'],
          'Terrasse / extérieur': ['Salon de jardin','Chaise longue','Table extérieure','Parasol','Hamac','Balancelle'],
          'Enfant': ['Lit enfant','Bureau enfant','Armoire enfant','Table à langer','Coffre à jouets'],
          'Rangement': ['Étagère','Armoire de rangement','Coffre','Casier','Meuble à tiroirs']
        } },
      matiereMeuble(),
      { k:'traite', l:'Bois traité contre les termites', req:true,
        when:function (S) { return /Bois|Contreplaqué|Rotin/.test(S.matiere || '') },
        o:['Oui, traité','Non traité','Je ne sais pas'],
        h:function (S) {
          if (S.traite === 'Non traité')
            return '!Les termites ne pardonnent pas au bois non traité. Dites-le — et proposez éventuellement un traitement avant livraison, c’est un argument.'
          return 'Les termites sont le premier ennemi du meuble en bois ici. Un bois traité se vend mieux, et c’est mérité.'
        } },
      dimensions(),
      { k:'places', l:'Nombre de places',
        when:function (S) { return /Canapé|Salon complet|Fauteuil|Table à manger|Ensemble/.test(S.typeMeuble || '') },
        o:['1','2','3','4','5','6','7','8 et plus'] },
      { k:'revetement', l:'Revêtement',
        when:function (S) { return /Canapé|Fauteuil|Salon|Pouf|Chaise|Lit|Balancelle/.test(S.typeMeuble || '') },
        o:['Cuir véritable','Simili cuir','Tissu','Velours','Wax / pagne','Rotin tressé','Sans revêtement'] },
      { k:'fabrication', l:'Fabrication', req:true,
        o:['Fabriqué en Côte d’Ivoire','Importé','Fait main sur mesure','Je ne sais pas'],
        h:'La menuiserie ivoirienne se vend bien : si c’est fabriqué ici, dites-le.' },
      ].concat(surMesure('un meuble fabriqué à la demande'), livraisonEtage(), [
      { k:'defauts', l:'Défauts à signaler', multi:true,
        o:['Aucun','Rayures','Tache','Pied abîmé','Tiroir difficile','Charnière à revoir','Tissu usé','Léger jeu dans la structure'] }
    ])
  },

  /* ================================================================== */
  'Électroménager': {
    etat: true, livraison: false,
    couleurs: function (S) { return /Réfrigérateur|Congélateur|Cuisinière|Micro-ondes|Lave-linge|Climatiseur/.test(S.typeElec || '') },
    sansCouleur: function (S) {
      return S.typeElec ? 'Cet appareil n’a pas de variante de couleur. Photographiez la plaque signalétique et l’étiquette énergie.' : 'La première photo sert de couverture.'
    },
    aideCouleurs: 'Cochez chaque couleur disponible. Ouvrez-en une pour lui donner ses photos et son prix.',
    titre: function (S) { return [S.typeElec, S.marqueElec, S.capaciteElec, S.classeEnergie && S.classeEnergie !== 'Non indiquée' ? 'classe ' + S.classeEnergie : ''].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeElec', l:'Type d’appareil', req:true,
        o:['Réfrigérateur','Congélateur','Réfrigérateur-congélateur','Climatiseur','Ventilateur','Lave-linge','Sèche-linge','Cuisinière','Four','Micro-ondes','Chauffe-eau','Fer à repasser','Aspirateur','Robot ménager','Machine à coudre','Purificateur / humidificateur'] },
      { k:'marqueElec', l:'Marque', req:true,
        o:['Samsung','LG','Nasco','Hisense','Whirlpool','Beko','Sharp','Roch','Astech','Smart Technology','Midea','Haier','Innova','Binatone','Moulinex','Autre'] },
      { k:'refElec', l:'Référence', t:'text', ph:'Ex : RT29K5030S8',
        h:'Écrite sur la plaque signalétique, au dos ou à l’intérieur de la porte.' },
      etatMarche('un appareil électroménager'),
      { k:'capaciteElec', l:'Capacité',
        when:function (S) { return /Réfrigérateur|Congélateur|Lave-linge|Sèche-linge|Micro-ondes|Four/.test(S.typeElec || '') },
        o:['Moins de 100 L','100 à 200 L','200 à 300 L','300 à 400 L','Plus de 400 L','5 kg','6 kg','7 kg','8 kg','9 kg et plus'] },
      { k:'btu', l:'Puissance de froid', req:true,
        when:function (S) { return S.typeElec === 'Climatiseur' },
        o:['9 000 BTU','12 000 BTU','18 000 BTU','24 000 BTU','36 000 BTU et plus'],
        h:'Comptez environ 1 000 BTU par m². Un 9 000 BTU ne refroidira pas un grand salon — et un climatiseur sous-dimensionné tourne en permanence, donc coûte cher.' },
      { k:'typeClim', l:'Type de climatiseur',
        when:function (S) { return S.typeElec === 'Climatiseur' },
        o:['Split mural','Split cassette','Fenêtre','Mobile sur roulettes','Inverter (économique)'] },
      ].concat(energie(), [
      { k:'accessoiresElec', l:'Fourni avec', multi:true,
        o:['Notice','Facture d’origine','Boîte d’origine','Télécommande','Tuyaux / raccords','Support mural','Rallonge / stabilisateur'] },
      { k:'installation', l:'Installation', req:true,
        when:function (S) { return /Climatiseur|Chauffe-eau|Lave-linge|Cuisinière/.test(S.typeElec || '') },
        o:['Installation comprise','Installation en supplément','À la charge de l’acheteur'],
        h:'Un climatiseur mal installé fuit, givre et consomme. L’installer vous-même est un vrai argument de vente.' },
      { k:'garantieElec', l:'Garantie', req:true,
        o:['Aucune garantie','7 jours','15 jours','1 mois','3 mois','6 mois','1 an','Garantie constructeur en cours'] }
    ]).concat(livraisonEtage())
  },

  /* ================================================================== */
  'Décoration': {
    etat: true, livraison: false, couleurs: true,
    aideCouleurs: 'Cochez chaque couleur disponible. Ouvrez-en une pour lui donner ses photos, son prix et un détail court.',
    titre: function (S) { return [S.typeDeco, S.origineDeco === 'Artisanat ivoirien fait main' ? 'artisanat ivoirien' : '', S.dimsDeco].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeDeco', l:'Type d’objet', req:true,
        o:['Tableau / peinture','Masque','Statue / sculpture','Tapis','Rideaux','Coussins','Miroir','Vase','Luminaire','Horloge','Plante artificielle','Cadre photo','Panier / vannerie','Tenture murale','Bougie / senteur','Autre'] },
      { k:'origineDeco', l:'Origine', req:true,
        o:['Artisanat ivoirien fait main','Artisanat d’un autre pays africain','Fabrication industrielle','Importé','Je ne sais pas'],
        h:'L’artisanat ivoirien — Korhogo, vannerie, bronze de Bouaké — se vend bien et se paie mieux. Si c’est fait main ici, dites-le et montrez le détail du travail.' },

      // La question qui décide de la publication.
      { k:'matiereDeco', l:'Matière', req:true,
        o:['Bois','Bronze / laiton','Terre cuite','Tissu / pagne','Raphia / vannerie','Verre','Métal','Pierre','Résine / plastique','Ivoire','Peau ou trophée d’animal sauvage'],
        alerte:{ bon:'Bois',
          ok:['Bronze / laiton','Terre cuite','Tissu / pagne','Raphia / vannerie','Verre','Métal','Pierre','Résine / plastique'],
          texteBon:'Matière ordinaire, rien à signaler. Regardez la finition et l’état des angles.',
          texteMauvais:'INTERDIT À LA VENTE. Cet objet ne peut pas être proposé sur Chap.ci.' },
        bloque:['Ivoire','Peau ou trophée d’animal sauvage'],
        motifBloc:'L’ivoire et les trophées d’espèces protégées sont interdits à la vente en Côte d’Ivoire et par la convention CITES.',
        h:function (S) {
          if (/Ivoire|Peau ou trophée/.test(S.matiereDeco || ''))
            return '!L’ivoire et les dépouilles d’espèces protégées sont interdits par la loi ivoirienne et par la convention CITES. Cette annonce ne peut pas être publiée, et la détention elle-même est sanctionnée.'
          return 'Le bronze de Bouaké, la terre cuite et la vannerie se vendent très bien. Photographiez le détail du travail : c’est lui qui fait le prix.'
        } },
      { k:'dimsDeco', l:'Dimensions', t:'text', req:true, ph:'Ex : 120 × 80 cm, hauteur 45 cm',
        h:'Un tableau ou un tapis s’achète sur ses dimensions. Sans elles, l’acheteur ne peut pas décider.' },
      { k:'piecesDeco', l:'Vendu par', req:true,
        o:['À l’unité','Par paire','Lot de 3','Lot de 4 et plus','Ensemble complet'] },
      { k:'fixation', l:'Fixation',
        when:function (S) { return /Tableau|Miroir|Luminaire|Horloge|Tenture|Rideaux/.test(S.typeDeco || '') },
        o:['Prêt à poser, accroches fournies','Accroches à prévoir','Fixation murale nécessaire','Pose comprise'] }
    ].concat(livraisonEtage())
  },

  /* ================================================================== */
  'Cuisine': {
    etat: true, livraison: false,
    couleurs: function (S) { return /Vaisselle|Casserole|Ustensile|Textile|Rangement|Service/.test(S.typeCuisine || '') },
    sansCouleur: function (S) {
      return S.typeCuisine ? 'Cet article se vend sur sa matière et sa contenance, pas sur sa couleur. Photographiez-le sous plusieurs angles.' : 'La première photo sert de couverture.'
    },
    titre: function (S) { return [S.typeCuisine, S.matiereCuisine, S.piecesCuisine].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeCuisine', l:'Type d’article', req:true,
        o:['Vaisselle / service','Casseroles et marmites','Ustensiles','Réchaud à gaz','Bouteille de gaz','Plaque électrique','Blender / mixeur','Bouilloire','Cafetière','Friteuse','Rangement de cuisine','Textile de cuisine','Batterie de cuisine complète','Mortier / pilon','Autre'] },
      { k:'matiereCuisine', l:'Matière',
        when:function (S) { return !/gaz|Plaque|Blender|Bouilloire|Cafetière|Friteuse/i.test(S.typeCuisine || '') },
        o:['Inox','Aluminium','Fonte','Céramique','Porcelaine','Verre','Plastique alimentaire','Bois','Terre cuite','Antiadhésif'] },
      { k:'piecesCuisine', l:'Nombre de pièces',
        when:function (S) { return /Vaisselle|Casseroles|Ustensiles|Batterie|Rangement|Textile/.test(S.typeCuisine || '') },
        o:['1 pièce','2 à 5 pièces','6 à 12 pièces','12 à 24 pièces','Plus de 24 pièces'] },

      // Le gaz : la seule chose de cette sous-catégorie qui peut blesser.
      { k:'tailleBouteille', l:'Taille de la bouteille', req:true,
        when:function (S) { return S.typeCuisine === 'Bouteille de gaz' },
        o:['B6 (6 kg)','B12 (12,5 kg)','B15 (15 kg)','B38 (38 kg)','Autre'] },
      { k:'etatBouteille', l:'État de la bouteille', req:true,
        when:function (S) { return S.typeCuisine === 'Bouteille de gaz' },
        o:['Bon état, sans rouille ni choc','Légères traces d’usage','Rouille importante','Bosse ou choc visible','Fuite constatée'],
        alerte:{ bon:'Bon état, sans rouille ni choc',
          ok:['Légères traces d’usage'],
          texteBon:'Bouteille en bon état déclaré. Vérifiez tout de même le joint du robinet et l’absence de rouille au culot.',
          texteMauvais:'DANGER. Une bouteille rouillée, choquée ou qui fuit ne doit pas être vendue ni utilisée : rapportez-la à un revendeur agréé.' },
        bloque:['Rouille importante','Bosse ou choc visible','Fuite constatée'],
        motifBloc:'Une bouteille de gaz rouillée, choquée ou qui fuit ne peut pas être vendue : elle doit être rapportée à un revendeur agréé.',
        h:function (S) {
          if (/Rouille importante|Bosse|Fuite/.test(S.etatBouteille || ''))
            return '!Une bouteille abîmée peut exploser. Elle ne se vend pas entre particuliers : rapportez-la à un revendeur agréé, qui la reprendra et la retirera du circuit.'
          return 'Vendez toujours une bouteille vide ou clairement annoncée pleine, et laissez l’acheteur vérifier le joint du robinet.'
        } },
      { k:'gazPlein', l:'Bouteille', req:true,
        when:function (S) { return S.typeCuisine === 'Bouteille de gaz' },
        o:['Vide (consigne seule)','Pleine','Partiellement remplie'] },
      { k:'feux', l:'Nombre de feux',
        when:function (S) { return /Réchaud|Plaque/.test(S.typeCuisine || '') },
        o:['1 feu','2 feux','3 feux','4 feux','5 feux et plus'] },
      { k:'lot', l:'Vendu en gros', t:'toggle',
        h:'Cochez si vous vendez par lots : les restaurants et maquis le cherchent.' },
      { k:'etatUsage', l:'Défauts à signaler', multi:true,
        o:['Aucun','Rayures','Fond noirci','Anse desserrée','Revêtement usé','Éclat / fêlure','Manque une pièce du lot'] }
    ].concat(livraisonEtage())
  },

  /* ================================================================== */
  'Jardin & Bricolage': {
    etat: true, livraison: false,
    couleurs: function (S) { return /Mobilier de jardin|Parasol|Pot|Arrosage/.test(S.typeJardin || '') },
    sansCouleur: function (S) {
      return S.typeJardin ? 'Un outil se vend sur son état de marche, pas sur sa couleur. Photographiez la plaque et faites une vidéo au démarrage.' : 'La première photo sert de couverture.'
    },
    titre: function (S) { return [S.typeJardin, S.marqueOutil, S.puissanceOutil ? S.puissanceOutil + ' W' : ''].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeJardin', l:'Type de matériel', req:true,
        o:['Groupe électrogène','Perceuse','Meuleuse','Scie','Ponceuse','Poste à souder','Compresseur','Tondeuse','Débroussailleuse','Tronçonneuse','Pompe à eau','Échelle','Outils à main','Mobilier de jardin','Parasol','Pot / jardinière','Arrosage','Peinture / matériaux','Groupe de sécurité / portail','Autre'] },
      { k:'marqueOutil', l:'Marque', t:'text', ph:'Ex : Bosch, Makita, Kipor, sans marque' },
      etatMarche('un outil'),
      { k:'alimOutil', l:'Alimentation', req:true,
        when:function (S) { return !/Mobilier|Parasol|Pot|Arrosage|Échelle|Outils à main|Peinture/.test(S.typeJardin || '') },
        o:['Secteur 220 V','Batterie rechargeable','Essence','Diesel','Manuel'] },
      { k:'puissanceOutil', l:'Puissance', t:'num', unite:'W', ph:'Ex : 800',
        when:function (S) { return /Perceuse|Meuleuse|Scie|Ponceuse|Poste|Compresseur|Pompe|Tondeuse/.test(S.typeJardin || '') } },
      { k:'puissanceKva', l:'Puissance du groupe', req:true,
        when:function (S) { return S.typeJardin === 'Groupe électrogène' },
        o:['Moins de 1 kVA','1 à 2,5 kVA','2,5 à 5 kVA','5 à 10 kVA','10 à 20 kVA','Plus de 20 kVA'],
        h:'Un groupe de 800 W ne fait tourner ni un gros réfrigérateur ni un climatiseur. Annoncez la puissance réelle : c’est la première question de l’acheteur.' },
      { k:'heuresOutil', l:'Heures de fonctionnement', t:'num', unite:'h', ph:'Ex : 400',
        when:function (S) { return /Groupe électrogène|Compresseur|Pompe/.test(S.typeJardin || '') },
        h:'L’heure de fonctionnement est le kilométrage d’un moteur. Si le compteur existe, donnez-le ; sinon, dites-le honnêtement.' },
      { k:'usagePro', l:'Usage précédent',
        when:function (S) { return !/Mobilier|Parasol|Pot|Peinture/.test(S.typeJardin || '') },
        o:['Usage domestique occasionnel','Usage domestique régulier','Usage professionnel','Neuf, jamais servi'],
        h:'Un outil sorti d’un chantier n’a pas vécu la même vie qu’un outil de garage. Le dire protège le prix des deux côtés.' },
      { k:'accessoiresOutil', l:'Fourni avec', multi:true,
        o:['Mallette / coffret','Notice','Facture','Batterie supplémentaire','Chargeur','Lames / disques','Rallonge','Bidon / entonnoir'] },
      { k:'garantieOutil', l:'Garantie', req:true,
        o:['Aucune garantie','7 jours','15 jours','1 mois','3 mois','6 mois','1 an'] }
    ].concat(livraisonEtage())
  },

  /* ================================================================== */
  'Literie': {
    etat: true, livraison: false,
    couleurs: function (S) { return !/Matelas|Sommier/.test(S.typeLiterie || '') },
    sansCouleur: 'Un matelas est blanc. Photographiez plutôt l’étiquette, les coins, et la tranche pour montrer l’épaisseur.',
    aideCouleurs: 'Cochez chaque couleur disponible. Ouvrez-en une pour lui donner ses photos, son prix et un détail court.',
    titre: function (S) { return [S.typeLiterie, S.taille, S.epaisseur].filter(Boolean).join(' · ') },
    champs: [
      { k:'typeLiterie', l:'Type d’article', req:true,
        o:['Matelas','Sommier','Ensemble matelas et sommier','Drap / parure','Couette','Couverture','Oreiller','Traversin','Moustiquaire','Protège-matelas','Tête de lit'] },
      { k:'taille', l:'Dimensions', req:true,
        o:['90 × 190 (1 place)','120 × 190','140 × 190 (2 places)','160 × 200 (queen)','180 × 200 (king)','200 × 200','Lit bébé 60 × 120','Sur mesure'],
        h:'Les tailles standard vendues ici. Un matelas hors format oblige à faire fabriquer les draps — dites-le.' },
      { k:'garnissage', l:'Garnissage', req:true,
        when:function (S) { return /Matelas|Ensemble/.test(S.typeLiterie || '') },
        o:['Mousse haute densité','Mousse standard','Ressorts','Ressorts ensachés','Latex','Mémoire de forme','Coco / fibre'] },
      { k:'densite', l:'Densité de la mousse',
        when:function (S) { return /Mousse/.test(S.garnissage || '') },
        o:['Moins de 20 kg/m³','20 à 25 kg/m³','25 à 30 kg/m³','30 à 35 kg/m³','Plus de 35 kg/m³','Je ne sais pas'],
        h:'La densité fait la durée de vie. En dessous de 20 kg/m³, une mousse se creuse en moins d’un an sous un adulte.' },
      { k:'epaisseur', l:'Épaisseur',
        when:function (S) { return /Matelas|Ensemble|Protège/.test(S.typeLiterie || '') },
        o:['10 cm','15 cm','20 cm','25 cm','30 cm et plus'] },
      { k:'matiereLit', l:'Matière',
        when:function (S) { return /Drap|Couette|Couverture|Oreiller|Traversin|Tête de lit|Moustiquaire/.test(S.typeLiterie || '') },
        o:['Coton','Coton satiné','Polyester','Microfibre','Wax / pagne','Velours','Polaire','Tulle (moustiquaire)'] },

      // Un matelas d'occasion : la seule question qui compte vraiment.
      { k:'hygiene', l:'État sanitaire', req:true,
        o:['Neuf, jamais utilisé','Utilisé, nettoyé et sans tache','Utilisé, quelques taches','Utilisé, non nettoyé','Punaises de lit constatées'],
        alerte:{ bon:'Neuf, jamais utilisé',
          ok:['Utilisé, nettoyé et sans tache'],
          texteBon:'Article neuf. Demandez tout de même à voir l’emballage d’origine ou l’étiquette du fabricant.',
          texteMauvais:'Article utilisé et non nettoyé. Exigez des photos récentes des deux faces et des coins, à la lumière du jour, avant de vous déplacer.',
          textes:{
            'Punaises de lit constatées':'INTERDIT À LA VENTE. Un matelas porteur de punaises contaminerait votre logement entier — et il coûte une fortune à en débarrasser.'
          } },
        bloque:['Punaises de lit constatées'],
        motifBloc:'Un matelas ou un textile porteur de punaises de lit ne peut pas être vendu : il contaminerait le logement de l’acheteur.',
        h:function (S) {
          if (S.hygiene === 'Punaises de lit constatées')
            return '!Les punaises de lit se propagent au logement entier de l’acheteur et coûtent une fortune à éliminer. Cet article ne peut pas être vendu — il doit être détruit, emballé et fermé.'
          if (/non nettoyé|quelques taches/.test(S.hygiene || ''))
            return '!Un matelas d’occasion se vend, mais photographiez les deux faces et les coins à la lumière du jour. C’est ce que l’acheteur demandera de toute façon.'
          return 'C’est la première question sur de la literie d’occasion. Y répondre franchement vend mieux qu’un silence.'
        } },
      { k:'fermete', l:'Fermeté',
        when:function (S) { return /Matelas|Ensemble/.test(S.typeLiterie || '') },
        o:['Souple','Équilibré','Ferme','Très ferme'] },
      { k:'lotLit', l:'Vendu en gros', t:'toggle',
        h:'Cochez si vous fournissez hôtels, résidences ou maquis : ils achètent par lots.' }
    ].concat(livraisonEtage())
  }
}
