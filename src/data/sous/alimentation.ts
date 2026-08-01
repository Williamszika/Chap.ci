/* ==========================================================================
 *  ALIMENTATION & AGRICULTURE — la fusion de deux catégories qui n'en
 *  faisaient qu'une.
 *
 *  « Alimentation & Boissons » proposait « Céréales & Tubercules » ;
 *  « Agriculture » proposait « Produits vivriers ». Un producteur de manioc
 *  devait DEVINER, et l'acheteur chercher deux fois. Les listes se
 *  recouvraient presque entièrement. Elles vivent désormais ensemble, de la
 *  plantation à l'assiette.
 *
 *  Trois réalités ivoiriennes commandent les formulaires :
 *
 *  1. LA CHAÎNE DU FROID. Le poisson, la viande et les plats préparés se
 *     vendent sous 30 °C. Une rupture de froid ne se voit pas — elle se
 *     goûte trop tard. La question est posée, et « jamais réfrigéré » sur du
 *     poisson frais refuse l'annonce.
 *
 *  2. LA DATE LIMITE. Un produit périmé ne se vend pas, quel qu'en soit le
 *     prix. La date dépassée refuse l'annonce.
 *
 *  3. LE PRIX AU KILO, PAS « LE TAS ». Le vivrier se vend traditionnellement
 *     au tas, au panier, à la cuvette. Ce sont de vraies unités et le
 *     formulaire les garde — mais il demande AUSSI le poids approximatif,
 *     sans quoi aucun acheteur ne peut comparer deux annonces.
 *
 *  Le cacao et le café ont leur propre bloc : campagne, prix bord champ fixé
 *  par le Conseil du Café-Cacao, taux d'humidité et de fèves défectueuses.
 * ========================================================================== */
import type { ChampCourt, DonneesCat, SchemaSous, Vals } from './contrat'
import type { Couleur } from '../couleurs'


const SOUS = ['Produits vivriers', 'Fruits & Légumes', 'Céréales & Tubercules', 'Épices & Condiments',
            'Produits du terroir', 'Boissons', 'Plats préparés', 'Cacao & Café',
            'Semences & Intrants', 'Poisson & Produits de mer']

const PALETTE_BASE: Couleur[] = []
const TOUTES_COULEURS: Couleur[] = []

/* L'unité de vente : au tas ET au kilo, sinon rien ne se compare. */
function quantite(exemple: string): ChampCourt[] {
  return [
    { k:'unite', l:'Unité de vente', req:true,
      o:['Au kilogramme','Au sac','Au panier','À la cuvette','Au tas','À la tonne','Au litre','À la pièce','Au carton','Au régime','Au casier'],
      h:'Le vivrier se vend au tas ou à la cuvette, et c’est très bien. Mais donnez aussi le poids ci-dessous : sans lui, personne ne peut comparer votre prix à celui d’à côté.' },
    { k:'poids', l:'Poids ou volume approximatif', t: 'text' as const, req:true, ph:exemple,
      h:'Même approximatif — « environ 5 kg la cuvette » suffit. C’est ce qui fait choisir votre annonce plutôt qu’une autre.' },
    { k:'stock', l:'Quantité disponible', req:true,
      o:['Petite quantité','Moins de 100 kg','100 kg à 1 tonne','1 à 10 tonnes','Plus de 10 tonnes','Production continue'] },
    { k:'gros', l:'Vente en gros possible', t: 'toggle' as const,
      h:'Cochez si vous fournissez restaurants, maquis, revendeuses ou exportateurs.' }
  ]
}

/* La date limite : elle refuse l'annonce quand elle est dépassée. */
function peremption(quoi: string): ChampCourt {
  return { k:'peremption', l:'Date limite de consommation', req:true,
    o:['Produit frais, du jour','Plus de 6 mois','1 à 6 mois','Moins d’un mois','Moins d’une semaine','Dépassée','Sans date (produit brut)'],
    alerte:{ bon:'Produit frais, du jour',
      ok:['Plus de 6 mois','1 à 6 mois','Sans date (produit brut)'],
      texteBon:'Produit du jour. Demandez quand même à voir la marchandise avant de payer.',
      texteMauvais:'La date approche. Vérifiez-la vous-même sur l’emballage avant d’acheter, surtout si vous achetez en quantité.',
      textes:{
        'Dépassée':'INTERDIT À LA VENTE. Un produit dont la date est dépassée ne peut pas être proposé sur Chap.ci.',
        'Sans date (produit brut)':'Produit brut sans date imprimée — c’est normal pour du vivrier. Jugez à l’œil et à l’odeur, et achetez de préférence sur place.'
      } },
    bloque:['Dépassée'],
    motifBloc:'Un produit alimentaire dont la date limite est dépassée ne peut pas être vendu.',
    h:function (S: Vals) {
      if (S.peremption === 'Dépassée')
        return '!Vendre ' + quoi + ' périmé est interdit et dangereux. Cette annonce ne sera pas publiée.'
      if (S.peremption === 'Moins d’une semaine')
        return '!Dites-le clairement dans le titre et ajustez le prix : l’acheteur doit savoir qu’il lui reste peu de temps.'
      return ''
    } }
}

/* Le froid — ce qui ne se voit pas et se goûte trop tard. */
function froid(): ChampCourt {
  return { k:'froid', l:'Conservation', req:true,
    o:['Réfrigéré sans rupture','Congelé sans rupture','Frais du jour, non réfrigéré','Séché ou fumé','Conserve / stérilisé','Jamais réfrigéré'],
    h:function (S: Vals) {
      if (S.froid === 'Jamais réfrigéré')
        return '!Sous 30 °C, un produit frais non réfrigéré se dégrade en quelques heures. S’il s’agit de poisson ou de viande, il ne peut pas être vendu ainsi.'
      if (/rupture/.test(S.froid || ''))
        return 'La rupture de froid est ce qui rend malade sans se voir. Le préciser est un vrai argument de sérieux.'
      return ''
    } }
}

function origine(): ChampCourt {
  return { k:'origine', l:'Origine', req:true,
    o:['Ma production','Producteur de ma région','Marché de gros','Importé','Je ne sais pas'],
    h:'« Ma production » se vend mieux et se paie mieux. Si vous êtes producteur, dites-le et montrez le champ.' }
}

function bio(): ChampCourt {
  return { k:'culture', l:'Mode de culture',
    o:['Sans engrais ni pesticide','Culture conventionnelle','Certifié biologique','Agriculture raisonnée','Je ne sais pas'],
    h:function (S: Vals) {
      if (S.culture === 'Certifié biologique')
        return '!Une certification bio se prouve par un certificat d’organisme agréé. Ne l’annoncez que si vous l’avez : c’est vérifiable, et une fausse mention détruit la confiance.'
      return 'Beaucoup de petits producteurs cultivent sans intrants sans être certifiés. Dire « sans engrais ni pesticide » est honnête et se vend très bien.'
    } }
}

const SCHEMAS: Record<string, SchemaSous> = {

  'Produits vivriers': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez la marchandise en pleine lumière, et de près. Sur du vivrier, l’œil décide.',
    titre: function (S: Vals) { return [S.produitV, S.poids, S.unite].filter(Boolean).join(' · ') },
    champs: ([
      { k:'produitV', l:'Produit', req:true,
        o:['Manioc','Igname','Banane plantain','Patate douce','Taro','Attiéké','Placali','Gari','Foutou','Farine de manioc','Riz local','Maïs','Mil / sorgho','Haricot / niébé','Arachide','Pois','Autre'] },
      origine(), bio(),
      peremption('un produit vivrier'),
      { k:'transforme', l:'État du produit', req:true,
        o:['Brut, tel que récolté','Épluché / nettoyé','Transformé (attiéké, gari, farine)','Séché','Fermenté'] }
    ] as ChampCourt[]).concat(quantite('Ex : environ 5 kg la cuvette'))
  },

  'Fruits & Légumes': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Une photo prise à la lumière du jour, sans flash : c’est ce qui montre la fraîcheur.',
    titre: function (S: Vals) { return [S.produitF, S.poids, S.unite].filter(Boolean).join(' · ') },
    champs: ([
      { k:'produitF', l:'Produit', req:true,
        o:['Mangue','Ananas','Banane douce','Papaye','Orange','Citron','Pastèque','Avocat','Noix de coco','Goyave','Corossol','Tomate','Piment','Aubergine','Gombo','Oignon','Chou','Carotte','Concombre','Salade','Épinard / feuilles','Autre'] },
      origine(), bio(),
      { k:'maturite', l:'Maturité', req:true,
        o:['Mûr, à consommer tout de suite','Presque mûr','Vert, à faire mûrir','Mélange'],
        h:'Sur des fruits vendus en gros, la maturité décide de tout : un revendeur veut du vert, un particulier veut du mûr.' },
      peremption('des fruits ou légumes'),
      froid()
    ] as ChampCourt[]).concat(quantite('Ex : cageot de 20 kg'))
  },

  'Céréales & Tubercules': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez le grain de près, et le sac ouvert : c’est ce qu’un acheteur en gros regarde.',
    titre: function (S: Vals) { return [S.produitC, S.poids, S.unite].filter(Boolean).join(' · ') },
    champs: ([
      { k:'produitC', l:'Produit', req:true,
        o:['Riz local','Riz importé','Maïs','Mil','Sorgho','Blé','Fonio','Igname','Manioc','Patate douce','Farine de blé','Farine de maïs','Semoule','Autre'] },
      origine(),
      { k:'qualiteGrain', l:'Qualité', req:true,
        o:['Trié, sans impuretés','Léger tri à faire','Non trié','Brisé / grain cassé'],
        h:'Le taux de brisure fait le prix du riz. L’annoncer honnêtement évite le refus à la livraison.' },
      { k:'humidite', l:'Séchage', req:true,
        o:['Bien séché, conservable','Séchage moyen','Récent, à sécher encore'],
        h:'Un grain mal séché moisit en sac au bout de quelques semaines. C’est la première cause de perte sur du stockage.' },
      peremption('des céréales'),
      { k:'conditionnement', l:'Conditionnement', req:true,
        o:['Sac de 25 kg','Sac de 50 kg','Sac de 100 kg','En vrac','Sachets détail'] }
    ] as ChampCourt[]).concat(quantite('Ex : sacs de 50 kg'))
  },

  'Épices & Condiments': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez le produit hors de son sachet : la couleur et la finesse de la mouture se voient.',
    titre: function (S: Vals) { return [S.produitE, S.poids].filter(Boolean).join(' · ') },
    champs: ([
      { k:'produitE', l:'Produit', req:true,
        o:['Piment','Gingembre','Ail','Poivre','Cube / bouillon','Soumbala','Néré','Graine de courge (pistache)','Feuille de baobab','Kinkeliba','Curcuma','Clou de girofle','Sel','Huile de palme','Huile d’arachide','Beurre de karité','Pâte d’arachide','Tomate concentrée','Autre'] },
      origine(), bio(),
      { k:'formeE', l:'Forme', req:true,
        o:['Frais','Séché','En poudre','En pâte','En huile','En graines'] },
      peremption('un condiment'),
      { k:'emballage', l:'Emballage', req:true,
        o:['Sachet scellé','Bocal / pot','Bidon','En vrac','Sous vide'] }
    ] as ChampCourt[]).concat(quantite('Ex : sachet de 250 g'))
  },

  'Produits du terroir': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Montrez le produit et son étiquette. Sur du terroir, l’origine fait le prix.',
    titre: function (S: Vals) { return [S.produitT, S.regionT, S.poids].filter(Boolean).join(' · ') },
    champs: ([
      { k:'produitT', l:'Produit', req:true,
        o:['Miel','Confiture','Sirop','Beurre de karité','Huile de coco','Noix de cajou','Noix de cola','Café moulu','Chocolat artisanal','Jus naturel','Vin de palme','Bissap séché','Gingembre confit','Attiéké de Dabou','Poisson fumé','Autre'] },
      { k:'regionT', l:'Région d’origine', req:true,
        o:['Abidjan et lagunes','Sud-Comoé','Bas-Sassandra','Montagnes (Man, Danané)','Centre (Bouaké, Yamoussoukro)','Nord (Korhogo, Ferké)','Est (Abengourou, Bondoukou)','Ouest (Daloa, Gagnoa)','Autre région'],
        h:'L’origine régionale est ce qui fait la valeur d’un produit du terroir. Le miel de Korhogo et l’attiéké de Dabou se vendent sur leur nom.' },
      origine(), bio(),
      { k:'artisanal', l:'Fabrication', req:true,
        o:['Fait main, artisanal','Petite unité de transformation','Industriel'] },
      peremption('un produit du terroir'),
      { k:'emballageT', l:'Emballage', req:true,
        o:['Bocal / pot','Bouteille','Sachet scellé','Sous vide','En vrac'] }
    ] as ChampCourt[]).concat(quantite('Ex : pot de 500 g'))
  },

  'Boissons': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez l’étiquette lisiblement, avec la date.',
    titre: function (S: Vals) { return [S.produitB, S.contenanceB, S.unite].filter(Boolean).join(' · ') },
    champs: ([
      { k:'produitB', l:'Boisson', req:true,
        o:['Jus de fruits naturel','Bissap','Gingembre','Bandji / vin de palme','Eau minérale','Sucrerie / soda','Bière','Vin','Spiritueux','Café','Thé','Lait','Yaourt','Boisson énergisante','Autre'] },
      { k:'alcool', l:'Contient de l’alcool', req:true,
        o:['Sans alcool','Avec alcool'],
        h:function (S: Vals) {
          if (S.alcool === 'Avec alcool')
            return '!La vente d’alcool aux mineurs est interdite. Vérifiez l’âge de l’acheteur à la remise — c’est votre responsabilité.'
          return ''
        } },
      { k:'contenanceB', l:'Contenance', req:true,
        o:['25 cl','33 cl','50 cl','75 cl','1 litre','1,5 litre','5 litres','Bidon 20 litres','Fût'] },
      origine(),
      { k:'artisanaleB', l:'Fabrication', req:true,
        o:['Artisanale / maison','Petite unité','Industrielle'],
        h:'Une boisson artisanale se conserve moins longtemps : précisez-le et gardez la chaîne du froid.' },
      peremption('une boisson'),
      froid()
    ] as ChampCourt[]).concat(quantite('Ex : casier de 12 bouteilles'))
  },

  'Plats préparés': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix la portion',
    sansCouleur: 'Une vraie photo de votre plat, pas une image trouvée sur internet. C’est ce qui fait revenir.',
    titre: function (S: Vals) { return [S.plat, S.portions].filter(Boolean).join(' · ') },
    champs: [
      { k:'plat', l:'Plat', req:true,
        o:['Attiéké poisson','Garba','Foutou sauce graine','Placali sauce gombo','Riz sauce','Kedjenou','Alloco','Braisé (poulet, poisson)','Soupe','Tchep','Couscous','Pâtisserie / gâteau','Beignets','Salade','Plateau-repas','Buffet','Autre'] },
      { k:'portions', l:'Vendu par', req:true,
        o:['Portion individuelle','Pour 2 personnes','Pour 4 personnes','Pour 10 personnes','Plat familial','Sur commande, à la demande'] },
      { k:'quand', l:'Préparation', req:true,
        o:['Préparé à la commande','Préparé du jour','Préparé la veille','Surgelé'],
        h:function (S: Vals) {
          if (S.quand === 'Préparé la veille')
            return '!Un plat de la veille doit avoir été réfrigéré sans rupture, et réchauffé à cœur. Dites-le, et baissez le prix.'
          return ''
        } },
      froid(),
      peremption('un plat préparé'),
      { k:'hygieneP', l:'Cuisine', req:true,
        o:['Restaurant / maquis déclaré','Cuisine à domicile','Cantine d’entreprise','Traiteur professionnel'],
        h:'Beaucoup de très bonne cuisine se fait à domicile ici, et cela se dit sans honte. Ce qui compte, c’est de le dire.' },
      { k:'livraisonP', l:'Livraison', req:true,
        o:['À emporter uniquement','Livraison dans ma commune','Livraison tout Abidjan','Sur place et à emporter'] },
      { k:'allergenes', l:'Contient', multi:true,
        o:['Arachide','Fruits de mer','Poisson','Œuf','Lait','Gluten','Piment fort','Aucun de ces éléments'],
        h:'L’arachide est le premier allergène ici, et il est partout. Le signaler peut éviter un accident grave.' }
    ]
  },

  'Cacao & Café': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix au kilogramme',
    sansCouleur: 'Photographiez les fèves étalées, à la lumière du jour : l’acheteur juge la couleur et la taille.',
    titre: function (S: Vals) { return [S.produitCC, S.campagne, S.poids].filter(Boolean).join(' · ') },
    champs: ([
      { k:'produitCC', l:'Produit', req:true,
        o:['Fèves de cacao','Cacao en poudre','Beurre de cacao','Café robusta','Café arabica','Café moulu','Café vert','Cabosses fraîches'] },
      { k:'campagne', l:'Campagne', req:true,
        o:['Campagne principale (octobre–mars)','Campagne intermédiaire (avril–septembre)','Récolte précédente','Stock ancien'],
        h:'La campagne fixe le prix bord champ. Un stock ancien se vend moins cher, et le dire évite la contestation à la pesée.' },
      { k:'sechageCC', l:'Séchage', req:true,
        o:['Bien séché (humidité ≤ 8 %)','Séchage moyen','Insuffisamment séché','Non séché'],
        h:function (S: Vals) {
          if (/Insuffisamment|Non séché/.test(S.sechageCC || ''))
            return '!Des fèves mal séchées moisissent en sac et sont refusées à l’achat. Séchez encore avant de vendre — vous en tirerez bien plus.'
          return 'Le taux d’humidité est le premier critère de l’acheteur. En dessous de 8 %, les fèves se conservent et se vendent au meilleur prix.'
        } },
      { k:'defauts', l:'Fèves défectueuses', req:true,
        o:['Moins de 3 %','3 à 5 %','5 à 10 %','Plus de 10 %','Non trié'],
        h:'Fèves moisies, plates, germées ou ardoisées. C’est ce qui est mesuré à la réception : l’annoncer évite la décote surprise.' },
      { k:'fermentation', l:'Fermentation',
        when:function (S: Vals) { return /cacao|Cabosses/i.test(S.produitCC || '') },
        o:['Bien fermenté','Partiellement fermenté','Non fermenté'] },
      origine(), bio(),
      { k:'certifCC', l:'Certification',
        o:['Aucune','Rainforest Alliance','Fairtrade','Biologique','UTZ','Certification coopérative'],
        h:'Une certification se prouve par un certificat au nom de la coopérative. Ne l’annoncez que si vous pouvez la montrer.' }
    ] as ChampCourt[]).concat(quantite('Ex : sacs de 65 kg'))
  },

  'Semences & Intrants': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez l’étiquette du sac : numéro de lot, date, et composition.',
    titre: function (S: Vals) { return [S.typeIntrant, S.cultureCible, S.poids].filter(Boolean).join(' · ') },
    champs: ([
      { k:'typeIntrant', l:'Type', req:true,
        o:['Semences','Plants / boutures','Engrais','Pesticide','Herbicide','Fongicide','Aliment pour bétail','Aliment pour volaille','Terreau / substrat','Produit vétérinaire'] },
      { k:'cultureCible', l:'Pour quelle culture', multi:true,
        when:function (S: Vals) { return !/Aliment|vétérinaire/.test(S.typeIntrant || '') },
        o:['Cacao','Café','Hévéa','Palmier à huile','Anacarde','Coton','Riz','Maïs','Manioc','Igname','Maraîchage','Banane','Toutes cultures'] },

      { k:'homologation', l:'Homologation', req:true,
        when:function (S: Vals) { return /Pesticide|Herbicide|Fongicide|vétérinaire|Engrais/.test(S.typeIntrant || '') },
        o:['Produit homologué en Côte d’Ivoire','Homologation inconnue','Produit non homologué / importation parallèle'],
        alerte:{ bon:'Produit homologué en Côte d’Ivoire',
          texteBon:'Produit déclaré homologué. Vérifiez le numéro d’homologation sur l’étiquette avant d’acheter.',
          texteMauvais:'INTERDIT. Les pesticides et produits vétérinaires non homologués sont interdits à la vente : ils empoisonnent les cultures, les sols et ceux qui les manipulent.' },
        bloque:['Produit non homologué / importation parallèle'],
        motifBloc:'Un pesticide ou un produit vétérinaire non homologué en Côte d’Ivoire ne peut pas être vendu.',
        h:function (S: Vals) {
          if (/non homologué/.test(S.homologation || ''))
            return '!Les produits phytosanitaires non homologués sont interdits, et dangereux pour celui qui les épand comme pour celui qui mange la récolte. Cette annonce ne sera pas publiée.'
          return 'Le numéro d’homologation figure sur l’étiquette. C’est ce que regarde un acheteur averti.'
        } },
      { k:'varieteS', l:'Variété', t: 'text' as const,
        when:function (S: Vals) { return /Semences|Plants/.test(S.typeIntrant || '') }, ph:'Ex : maïs EV8728, hévéa GT1' },
      { k:'germination', l:'Taux de germination',
        when:function (S: Vals) { return /Semences/.test(S.typeIntrant || '') },
        o:['Plus de 90 %','80 à 90 %','70 à 80 %','Moins de 70 %','Non testé'] },
      peremption('un intrant')
    ] as ChampCourt[]).concat(quantite('Ex : sac de 50 kg'))
  },

  'Poisson & Produits de mer': {
    couleurs: false, etat: false, livraison: true, prixLabel: 'Prix',
    sansCouleur: 'Photographiez l’œil et les branchies : c’est là que se voit la fraîcheur, et tout acheteur le sait.',
    titre: function (S: Vals) { return [S.produitP, S.etatP, S.poids].filter(Boolean).join(' · ') },
    champs: ([
      { k:'produitP', l:'Produit', req:true,
        o:['Thon','Machoiron','Carpe','Tilapie','Sardine','Bar','Capitaine','Sole','Silure','Crevettes','Crabes','Poulpe','Escargots','Poisson fumé','Poisson séché','Mélange / friture'] },
      { k:'etatP', l:'État', req:true,
        o:['Frais du jour','Frais, glacé','Congelé','Fumé','Séché','Salé'] },

      { k:'froidP', l:'Chaîne du froid', req:true,
        o:['Réfrigéré sans rupture depuis la pêche','Congelé sans rupture','Sur glace','Fumé ou séché, pas de froid nécessaire','Jamais réfrigéré'],
        alerte:{ bon:'Réfrigéré sans rupture depuis la pêche',
          ok:['Congelé sans rupture','Sur glace','Fumé ou séché, pas de froid nécessaire'],
          texteBon:'Chaîne du froid annoncée sans rupture. Vérifiez tout de même l’œil, brillant et bombé, et les branchies bien rouges.',
          texteMauvais:'DANGER. Du poisson frais jamais réfrigéré sous 30 °C se dégrade en quelques heures et rend malade sans prévenir.' },
        bloque:['Jamais réfrigéré'],
        motifBloc:'Du poisson ou des produits de mer frais jamais réfrigérés ne peuvent pas être vendus : le risque sanitaire est réel.',
        h:function (S: Vals) {
          if (S.froidP === 'Jamais réfrigéré')
            return '!Sous 30 °C, du poisson frais non réfrigéré devient dangereux en quelques heures. Fumez-le, séchez-le ou glacez-le — mais ne le vendez pas ainsi.'
          return 'La rupture de froid est ce qui rend malade sans se voir. L’annoncer est un vrai argument de sérieux.'
        } },
      { k:'peche', l:'Provenance', req:true,
        o:['Pêche artisanale locale','Pêche industrielle','Élevage / pisciculture','Importé congelé','Marché de gros'] },
      { k:'vide', l:'Préparation', multi:true,
        o:['Entier','Vidé','Écaillé','En filets','En darnes','Nettoyé et prêt à cuire'] },
      peremption('du poisson')
    ] as ChampCourt[]).concat(quantite('Ex : caisse de 20 kg'))
  }
}

export const ALIMENTATION: DonneesCat = {
  sous: SOUS,
  paletteBase: PALETTE_BASE,
  toutesCouleurs: TOUTES_COULEURS,
  schemas: SCHEMAS,
}
