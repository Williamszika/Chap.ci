/* ==========================================================================
 *  Un schéma PAR SOUS-CATÉGORIE.
 *
 *  Une tablette n'a pas de « santé de batterie iPhone », un chargeur n'a pas
 *  de stockage, et une réparation n'est pas un objet — elle n'a ni couleur ni
 *  provenance. Chaque sous-catégorie porte donc sa propre liste de champs,
 *  ses propres marques, et ses propres obligations.
 *
 *  `dependDe` : ce champ tire ses options du champ nommé. C'est ainsi que la
 *  marque ouvre ses modèles, et que « iPad » ne s'affiche jamais sous Samsung.
 * ========================================================================== */

var SOUS = ['Smartphones', 'Tablettes', 'Téléphones fixes', 'Accessoires', 'Réparation']

/* --- Smartphones : ordre = ce qui se vend le plus en Côte d'Ivoire --------- */
var MOD_TEL = {
  'Tecno': ['Spark 30','Spark 20','Spark 20 Pro','Spark Go','Spark Go 2','Spark 30 Pro','Spark Slim','Camon 40','Camon 30','Camon 20','Pop 9','Pop 8','Pova 7','Pova 6','Pova 6 Neo','Pova 5','Pova Curve 2','Pova 7 Pro','Camon 50','Camon 50 Pro','Camon 50 Ultra','Camon 40 Pro','Camon 40 Premier','Camon 30 Pro','Camon 20 Pro','Phantom V Fold 2','Phantom V Flip','Phantom X2'],
  'Infinix': ['Hot 50','Hot 40','Hot 30','Hot 60','Hot 50 Pro','Hot 40 Pro','Hot 60 Pro','Smart 9','Smart 8','Note 40','Note 30','Note 50','Note 40 Pro','Note 50 Pro','Note 50 Pro+','Note 40 Pro+','Note 30 Pro','Zero 30','Zero 40 5G','Zero Flip','GT 10 Pro','GT 20 Pro'],
  'Itel': ['A70','A60','A80','A60s','S24','S23','S25','S23+','S25 Ultra','P40','P55','P65','P40+','P55 5G','Vision 3','Vision 5','RS4','it2160'],
  'Samsung': ['Galaxy A06','Galaxy A05','Galaxy A15','Galaxy A16','Galaxy A25','Galaxy A26','Galaxy A04','Galaxy A03','Galaxy A35','Galaxy A36','Galaxy A55','Galaxy A56','Galaxy M15','Galaxy M35','Galaxy S23','Galaxy S24','Galaxy S25','Galaxy S22','Galaxy S21','Galaxy S24 Ultra','Galaxy S25 Ultra','Galaxy S25+','Galaxy S23 Ultra','Galaxy Z Flip 6','Galaxy Z Fold 6','Galaxy Note 20 Ultra','Galaxy Note 10'],
  'Apple': ['iPhone 11','iPhone 12','iPhone 13','iPhone XR','iPhone 14','iPhone 15','iPhone 11 Pro Max','iPhone 12 Pro Max','iPhone 13 Pro','iPhone 13 Pro Max','iPhone X','iPhone XS Max','iPhone 14 Pro','iPhone 14 Pro Max','iPhone 15 Pro','iPhone 15 Pro Max','iPhone 16','iPhone 16 Pro','iPhone 16 Pro Max','iPhone 16e','iPhone 17','iPhone 17 Pro','iPhone 17 Pro Max','iPhone SE (2022)','iPhone SE (2020)','iPhone 8 Plus','iPhone 7'],
  'Xiaomi': ['Redmi 13C','Redmi 14C','Redmi 12C','Redmi A3','Redmi Note 13','Redmi Note 14','Redmi Note 12','Redmi Note 13 Pro','Redmi Note 14 Pro','Redmi Note 14 Pro+','Poco C65','Poco M6 Pro','Poco X7','Poco X7 Pro','Xiaomi 13','Xiaomi 14'],
  'Oppo': ['A18','A17','A38','A58','A78','A80','Reno 8','Reno 11','Reno 12','Reno 13','Reno 13 Pro','Find X8','Find X8 Pro'],
  'Realme': ['C51','C53','C55','C67','C75','Note 60','12','13 Pro','12 Pro+','13 Pro+','GT 6','GT Neo 5'],
  'Huawei': ['Y7a','Y9a','Nova 9','Nova 10','Nova 11','Nova 12','Nova 13','P40 Lite','P60 Pro','Mate 60 Pro'],
  'Nokia': ['105','C12','C22','C32','G22','G42','3210','8210'],
  'Google': ['Pixel 6a','Pixel 7a','Pixel 8a','Pixel 6','Pixel 7','Pixel 8','Pixel 9','Pixel 9a','Pixel 6 Pro','Pixel 7 Pro','Pixel 8 Pro','Pixel 9 Pro','Pixel 9 Pro XL','Pixel 5','Pixel 4a','Pixel Fold'],
  'Vivo': ['Y19s','Y18','Y28','Y36','Y100','V29','V30','V40','X100'],
  'Honor': ['X5b','X6b','X7b','X8b','X9b','90','200','Magic 6'],
  'OnePlus': ['Nord CE 4','Nord 4','Nord N30','12','12R','11','10 Pro'],
  'Motorola': ['Moto G04','Moto G24','Moto G34','Moto G54','Moto G84','Edge 50','Moto E14'],
  'Alcatel': ['1B','1S','3L','Alcatel 1','Alcatel 5'],
  'ZTE': ['Blade A34','Blade A54','Blade A73','Blade V50','Nubia Neo'],
  'Autre marque': []
}

/* --- Tablettes : d'autres marques, d'autres gammes ------------------------ */
var MOD_TAB = {
  // Les iPad d'occasion sont ce qui se vend le plus en tablette à Abidjan :
  // la liste va donc jusqu'aux générations anciennes, encore très demandées.
  'Apple': ['iPad (9ᵉ gén.)','iPad (10ᵉ gén.)','iPad (8ᵉ gén.)','iPad (7ᵉ gén.)','iPad (6ᵉ gén.)','iPad (11ᵉ gén.)','iPad Air','iPad Air 11″','iPad Air 13″','iPad Air 2','iPad mini','iPad mini (6ᵉ gén.)','iPad mini (7ᵉ gén.)','iPad Pro 11″','iPad Pro 12,9″','iPad Pro 13″','iPad 2018','iPad 2017'],
  'Samsung': ['Galaxy Tab A9','Galaxy Tab A9+','Galaxy Tab A8','Galaxy Tab A7','Galaxy Tab A7 Lite','Galaxy Tab S6 Lite','Galaxy Tab S9 FE','Galaxy Tab S9','Galaxy Tab S9 Ultra','Galaxy Tab S8','Galaxy Tab Active'],
  'Tecno': ['Megapad 10','Megapad 11'],
  'Infinix': ['XPad','XPad 11'],
  'Itel': ['Pad One','Pad 2','Pad 3'],
  'Lenovo': ['Tab M8','Tab M10','Tab M11','Tab P11','Tab P12'],
  'Xiaomi': ['Redmi Pad SE','Redmi Pad','Pad 6','Pad 7'],
  'Huawei': ['MatePad T10','MatePad SE','MatePad 11','MatePad 11,5'],
  'Oppo': ['Pad Air','Pad Air 2','Pad 2'],
  'Honor': ['Pad X8','Pad X9','Pad 9'],
  'Nokia': ['T20','T21'],
  'Autre marque': []
}

/* --- Téléphones fixes : le TYPE compte plus que le modèle ----------------- */
var MOD_FIXE = {
  'Panasonic': ['KX-TS500 (filaire)','KX-TGB110 (sans fil)','KX-TGC212 (2 combinés)','KX-TS880 (filaire écran)'],
  'Nokia': ['105','3210','8210'],
  'Alcatel': ['T20 (filaire)','T50 (filaire écran)','D285 (sans fil)'],
  'Gigaset': ['A170 (sans fil)','AS405 (sans fil)','DL580'],
  'Yealink': ['T31P (IP)','T33G (IP)','T54W (IP)'],
  'Orchid': ['KP1000 (standard)'],
  'Autre marque': []
}

/* --- Accessoires : le type d'abord, la marque ensuite --------------------- */
var TYPES_ACC = [
  'Chargeur secteur','Câble USB','Chargeur sans fil','Powerbank','Écouteurs filaires',
  'Écouteurs Bluetooth','Casque','Coque / étui','Verre trempé','Support voiture',
  'Carte mémoire','Adaptateur','Batterie de remplacement','Stylet','Clavier tablette','Autre accessoire'
]
var MARQUES_ACC = ['Oraimo','Anker','Samsung','Apple','Baseus','Xiaomi','Tecno','Infinix','Itel','Sans marque','Autre marque']

/* --- Réparation : un service, décrit comme un service -------------------- */
var PRESTATIONS = [
  'Écran cassé','Batterie','Connecteur de charge','Désoxydation (tombé dans l’eau)',
  'Vitre arrière','Caméra','Haut-parleur / micro','Face ID / Touch ID',
  'Déblocage réseau','Récupération de données','Changement de coque','Diagnostic'
]

/* ==========================================================================
 *  Les champs, sous-catégorie par sous-catégorie.
 *  req : obligatoire · multi : plusieurs choix · dependDe : options tirées
 *  d'un autre champ · varOK : une couleur peut avoir sa propre valeur.
 * ========================================================================== */
var SCHEMAS = {
  'Smartphones': {
    couleurs: true, etat: true, livraison: true,
    titre: function (S) { return [S.marque !== 'Autre marque' ? S.marque : '', S.modele === 'Autre modèle' ? S.modeleLibre : S.modele, S.stockage].filter(Boolean).join(' ') },
    champs: [
      { k:'marque', l:'Marque', o:Object.keys(MOD_TEL), req:true },
      { k:'modele', l:'Modèle', dependDe:'marque', table:MOD_TEL, req:true, libre:'Autre modèle',
        h:'Le modèle exact fait trouver votre annonce : c’est lui que les acheteurs tapent dans la recherche.' },
      { k:'stockage', l:'Stockage', o:['32 Go','64 Go','128 Go','256 Go','512 Go','1 To'], req:true, varOK:true },
      { k:'ram', l:'Mémoire (RAM)', o:['2 Go','3 Go','4 Go','6 Go','8 Go','12 Go'], varOK:true },
      { k:'batterie', l:'Santé de la batterie', o:['100 %','Plus de 90 %','80 à 90 %','Moins de 80 %','Batterie changée','Je ne sais pas'],
        h:'Réglages → Batterie sur iPhone. Une réponse honnête évite le retour fâché.', varOK:true },
      { k:'provenance', l:'Provenance', o:['Neuf scellé (sous carton)','Occasion Côte d’Ivoire','Occasion d’Europe (« France au revoir »)'], req:true, varOK:true },
      { k:'comptes', l:'Comptes iCloud / Google', o:['Déconnectés — prêt à l’emploi','Encore liés (vendu pour pièces)'], req:true, varOK:true,
        alerte:{ bon:'Déconnectés — prêt à l’emploi',
          texteBon:'Le vendeur déclare l’appareil dissocié de son compte. Vérifiez-le avant de payer.',
          texteMauvais:'Cet appareil ne pourra pas être utilisé tel quel : il est vendu pour pièces.' },
        h:'Un téléphone encore lié au compte de l’ancien propriétaire est inutilisable. C’est l’arnaque n° 1 sur l’occasion : l’acheteur vérifiera avant de payer — vérifiez avant de vendre.' },
      { k:'fournis', l:'Fournis avec', o:['Boîte d’origine','Facture','Chargeur','Écouteurs','Coque offerte'], multi:true, varOK:true,
        h:'La boîte d’origine permet à l’acheteur de comparer l’IMEI (*#06#) avec celui imprimé dessus.' },
      { k:'garantie', l:'Sous garantie', t:'toggle', varOK:true }
    ]
  },

  'Tablettes': {
    couleurs: true, etat: true, livraison: true,
    titre: function (S) { return [S.marque !== 'Autre marque' ? S.marque : '', S.modele === 'Autre modèle' ? S.modeleLibre : S.modele, S.stockage].filter(Boolean).join(' ') },
    champs: [
      { k:'marque', l:'Marque', o:Object.keys(MOD_TAB), req:true },
      { k:'modele', l:'Modèle', dependDe:'marque', table:MOD_TAB, req:true, libre:'Autre modèle' },
      { k:'ecran', l:'Taille de l’écran', o:['7 pouces','8 pouces','10 pouces','11 pouces','12 pouces et plus'], req:true },
      { k:'stockage', l:'Stockage', o:['16 Go','32 Go','64 Go','128 Go','256 Go','512 Go','1 To'], req:true, varOK:true },
      { k:'ram', l:'Mémoire (RAM)', o:['2 Go','3 Go','4 Go','6 Go','8 Go'], varOK:true },
      { k:'reseau', l:'Connectivité', o:['Wi-Fi seulement','Wi-Fi + carte SIM (4G/5G)'], req:true,
        h:'Une tablette avec carte SIM se vend nettement plus cher : dites-le.' },
      { k:'batterie', l:'Santé de la batterie', o:['Comme neuve','Bonne','Moyenne','Batterie changée','Je ne sais pas'], varOK:true },
      { k:'provenance', l:'Provenance', o:['Neuf scellé (sous carton)','Occasion Côte d’Ivoire','Occasion d’Europe (« France au revoir »)'], req:true, varOK:true },
      { k:'comptes', l:'Comptes iCloud / Google', o:['Déconnectés — prêt à l’emploi','Encore liés (vendu pour pièces)'], req:true, varOK:true,
        alerte:{ bon:'Déconnectés — prêt à l’emploi',
          texteBon:'Le vendeur déclare la tablette dissociée de son compte. Vérifiez-le avant de payer.',
          texteMauvais:'Cette tablette ne pourra pas être réinitialisée : elle est vendue pour pièces.' },
        h:'Un iPad encore lié à l’identifiant Apple de l’ancien propriétaire ne se réinitialise pas. Même arnaque que sur les téléphones.' },
      { k:'fournis', l:'Fournis avec', o:['Boîte d’origine','Facture','Chargeur','Étui / clavier','Stylet'], multi:true, varOK:true },
      { k:'garantie', l:'Sous garantie', t:'toggle', varOK:true }
    ]
  },

  'Téléphones fixes': {
    couleurs: true, etat: true, livraison: true,
    titre: function (S) { return [S.marque !== 'Autre marque' ? S.marque : '', S.modele === 'Autre modèle' ? S.modeleLibre : S.modele, S.typeFixe].filter(Boolean).join(' ') },
    champs: [
      { k:'typeFixe', l:'Type d’appareil', o:['Filaire','Sans fil (DECT)','Téléphone IP / VoIP','Standard (PABX)','Téléphone de bureau'], req:true },
      { k:'marque', l:'Marque', o:Object.keys(MOD_FIXE), req:true },
      { k:'modele', l:'Modèle', dependDe:'marque', table:MOD_FIXE, req:true, libre:'Autre modèle' },
      { k:'combines', l:'Nombre de combinés', o:['1','2','3','4 et plus'], when:function (S) { return S.typeFixe === 'Sans fil (DECT)' } },
      { k:'fonctions', l:'Fonctions', o:['Écran','Répondeur','Mains libres','Blocage d’appels','Grandes touches','Rétroéclairage'], multi:true },
      { k:'provenance', l:'Provenance', o:['Neuf scellé (sous carton)','Occasion Côte d’Ivoire','Occasion d’Europe'], req:true, varOK:true },
      { k:'fournis', l:'Fournis avec', o:['Boîte d’origine','Facture','Adaptateur secteur','Câble téléphonique','Notice'], multi:true, varOK:true },
      { k:'garantie', l:'Sous garantie', t:'toggle', varOK:true }
    ]
  },

  'Accessoires': {
    couleurs: true, etat: true, livraison: true,
    titre: function (S) { return [S.typeAcc, S.marque && S.marque !== 'Autre marque' && S.marque !== 'Sans marque' ? S.marque : '', S.compatible].filter(Boolean).join(' — ') },
    champs: [
      { k:'typeAcc', l:'Type d’accessoire', o:TYPES_ACC, req:true },
      { k:'marque', l:'Marque', o:MARQUES_ACC, req:true },
      { k:'compatible', l:'Compatible avec', t:'text', ph:'Ex : iPhone 13, tous Android, USB-C', req:true,
        h:'La première question de l’acheteur. Un chargeur « universel » qui ne l’est pas fait un litige.' },
      { k:'puissance', l:'Puissance', o:['5 W','10 W','18 W','20 W','25 W','33 W','45 W','65 W et plus'],
        when:function (S) { return /Chargeur/.test(S.typeAcc) } },
      { k:'capacite', l:'Capacité', o:['5 000 mAh','10 000 mAh','20 000 mAh','30 000 mAh et plus'],
        when:function (S) { return S.typeAcc === 'Powerbank' || S.typeAcc === 'Batterie de remplacement' } },
      { k:'go', l:'Capacité', o:['16 Go','32 Go','64 Go','128 Go','256 Go','512 Go'],
        when:function (S) { return S.typeAcc === 'Carte mémoire' } },
      { k:'sansFil', l:'Sans fil / Bluetooth', t:'toggle',
        when:function (S) { return /Écouteurs|Casque|Clavier/.test(S.typeAcc) } },
      { k:'lot', l:'Vendu par lot', t:'toggle', h:'Cochez si vous vendez en gros : l’acheteur revendeur le cherche.' },
      { k:'provenance', l:'Provenance', o:['Neuf scellé (sous carton)','Neuf sans boîte','Occasion'], req:true, varOK:true },
      { k:'garantie', l:'Sous garantie', t:'toggle', varOK:true }
    ]
  },

  'Réparation': {
    couleurs: false, etat: false, livraison: false, service: true,
    prixLabel: 'Tarif à partir de',
    titre: function (S) {
      var p = (S.prestations || []).slice(0, 2).join(', ')
      return p ? 'Réparation ' + p.toLowerCase() : 'Service de réparation téléphone'
    },
    champs: [
      { k:'prestations', l:'Ce que vous réparez', o:PRESTATIONS, multi:true, req:true },
      { k:'marquesRep', l:'Marques prises en charge', o:['Toutes marques','Apple','Samsung','Tecno','Infinix','Itel','Xiaomi','Oppo','Huawei'], multi:true, req:true },
      { k:'delai', l:'Délai habituel', o:['30 minutes','1 heure','Le jour même','24 heures','48 heures','Sur devis'], req:true },
      { k:'garantieRep', l:'Garantie sur la réparation', o:['Aucune','7 jours','15 jours','1 mois','3 mois'], req:true,
        h:'Une garantie, même de sept jours, vous distingue de la boutique du coin qui n’en donne aucune.' },
      { k:'pieces', l:'Pièces utilisées', o:['Origine','Compatible de bonne qualité','Selon le budget du client'] },
      { k:'atelier', l:'Vous recevez en atelier', t:'toggle' },
      { k:'dom', l:'Vous vous déplacez à domicile', t:'toggle' },
      { k:'devis', l:'Devis gratuit', t:'toggle' }
    ]
  }
}
