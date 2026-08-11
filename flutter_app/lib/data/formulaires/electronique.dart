// =============================================================================
//  ÉLECTRONIQUE — onze sous-catégories (port fidèle de src/data/sous/electronique.dart).
//
//  Cinq réalités ivoiriennes commandent ces formulaires :
//
//  1. LE COMPTE ENCORE LIÉ. Un iPhone / iPad / Mac qui porte encore le compte
//     de l'ancien propriétaire est inutilisable — premier signe d'un vol. La
//     question est posée partout où elle a un sens ; sur ordinateur, un
//     verrouillage d'entreprise ou un mot de passe BIOS bloque la publication.
//  2. LE 230 V / 50 Hz. Un appareil rapporté des États-Unis est en 110 V et
//     grille sans transformateur.
//  3. LA TNT EN DVB-T2. Un téléviseur sans décodeur intégré ne capte aucune
//     chaîne ivoirienne (décodeur plafonné à 10 000 FCFA, antenne à 6 000).
//  4. LE CLAVIER. Un portable ramené des États-Unis est en QWERTY.
//  5. LE DÉCLENCHEMENT. L'obturateur d'un reflex d'entrée de gamme est donné
//     pour ~100 000 déclenchements ; un boîtier pro tient jusqu'à 400 000.
//
//  Le bloc couleurs / variantes est porté : un même téléphone en noir et en
//  bleu tient dans une seule annonce, chaque coloris avec sa photo, son prix,
//  et — le cas échéant — son stockage, sa RAM ou sa provenance (les champs
//  marqués varOK). Ce qui n'a pas de couleur (un téléviseur, une réparation)
//  le dit clairement (sansCouleur).
// =============================================================================
import 'schema.dart';

String _t(Vals s, String cle) => (s[cle] ?? '').toString();

/// Groupe les milliers avec une espace insécable fine (24000 → « 24 000 »).
String _milliers(int n) {
  final str = n.toString();
  final buf = StringBuffer();
  for (int i = 0; i < str.length; i++) {
    if (i > 0 && (str.length - i) % 3 == 0) buf.write(' ');
    buf.write(str[i]);
  }
  return buf.toString();
}

// --- Blocs partagés ----------------------------------------------------------

/// La garantie : obligatoire partout. « Aucune » est une réponse honnête.
const _garantie = Champ('garantie', 'Garantie',
    req: true,
    options: [
      'Aucune garantie', '7 jours', '15 jours', '1 mois', '3 mois', '6 mois',
      '1 an', 'Garantie constructeur encore en cours'
    ],
    h: 'Dire « aucune garantie » ne fait pas fuir : c’est la norme sur l’occasion. Ce qui fait fuir, c’est de ne rien dire et de se disputer après.');

/// Le 230 V. Un appareil rapporté des États-Unis est en 110 V et grille.
final _voltage = Champ('voltage', 'Tension d’alimentation',
    req: true,
    options: const [
      '220–240 V (standard Côte d’Ivoire)', '110 V — transformateur nécessaire',
      'Bi-tension 110/220 V', 'Fonctionne sur batterie uniquement'
    ],
    h: (s) => _t(s, 'voltage') == '110 V — transformateur nécessaire'
        ? '!La Côte d’Ivoire est en 230 V / 50 Hz. Cet appareil a besoin d’un transformateur — précisez s’il est fourni, sinon l’acheteur le grille au premier branchement.'
        : 'La Côte d’Ivoire est en 230 V / 50 Hz, prises de type C et E. Un appareil ramené des États-Unis est en 110 V et ne survit pas au branchement direct.');

/// La contrefaçon : le faux JBL et la fausse carte mémoire sont les arnaques
/// les plus courantes du rayon électronique à Abidjan.
Champ _authenticite(String quoi) => Champ(
      'authenticite',
      'Authenticité',
      req: true,
      options: const [
        'Produit authentique, avec facture ou boîte d’origine',
        'Produit authentique, sans preuve',
        'Copie / compatible, et je le dis',
        'Je ne sais pas'
      ],
      alerte: Alerte(
        bon: 'Produit authentique, avec facture ou boîte d’origine',
        ok: const ['Copie / compatible, et je le dis'],
        texteBon:
            'Le vendeur déclare un produit authentique et dit pouvoir le prouver. Demandez la facture ou la boîte, et comparez le numéro de série.',
        texteMauvais:
            'Aucune preuve d’authenticité. $quoi vendu très en dessous du prix du marché est presque toujours une copie : testez-le avant de payer.',
        textes: const {
          'Copie / compatible, et je le dis':
              'Le vendeur annonce une copie, et le dit. C’est honnête : le prix doit être très inférieur à celui de l’original, et la durée de vie l’est aussi.'
        },
      ),
      h: 'Vendre une copie en la faisant passer pour l’original est interdit. Annoncée comme copie, elle se vend sans problème.',
    );

// --- Tables du marché ivoirien ----------------------------------------------

const _modTel = {
  'Tecno': ['Spark 30', 'Spark 20', 'Spark 20 Pro', 'Spark Go', 'Spark Go 2', 'Spark 30 Pro', 'Spark Slim', 'Camon 40', 'Camon 30', 'Camon 20', 'Pop 9', 'Pop 8', 'Pova 7', 'Pova 6', 'Pova 6 Neo', 'Pova 5', 'Pova Curve 2', 'Pova 7 Pro', 'Camon 50', 'Camon 50 Pro', 'Camon 50 Ultra', 'Camon 40 Pro', 'Camon 40 Premier', 'Camon 30 Pro', 'Camon 20 Pro', 'Phantom V Fold 2', 'Phantom V Flip', 'Phantom X2'],
  'Infinix': ['Hot 50', 'Hot 40', 'Hot 30', 'Hot 60', 'Hot 50 Pro', 'Hot 40 Pro', 'Hot 60 Pro', 'Smart 9', 'Smart 8', 'Note 40', 'Note 30', 'Note 50', 'Note 40 Pro', 'Note 50 Pro', 'Note 50 Pro+', 'Note 40 Pro+', 'Note 30 Pro', 'Zero 30', 'Zero 40 5G', 'Zero Flip', 'GT 10 Pro', 'GT 20 Pro'],
  'Itel': ['A70', 'A60', 'A80', 'A60s', 'S24', 'S23', 'S25', 'S23+', 'S25 Ultra', 'P40', 'P55', 'P65', 'P40+', 'P55 5G', 'Vision 3', 'Vision 5', 'RS4', 'it2160'],
  'Samsung': ['Galaxy A06', 'Galaxy A05', 'Galaxy A15', 'Galaxy A16', 'Galaxy A25', 'Galaxy A26', 'Galaxy A04', 'Galaxy A03', 'Galaxy A35', 'Galaxy A36', 'Galaxy A55', 'Galaxy A56', 'Galaxy M15', 'Galaxy M35', 'Galaxy S23', 'Galaxy S24', 'Galaxy S25', 'Galaxy S22', 'Galaxy S21', 'Galaxy S24 Ultra', 'Galaxy S25 Ultra', 'Galaxy S25+', 'Galaxy S23 Ultra', 'Galaxy Z Flip 6', 'Galaxy Z Fold 6', 'Galaxy Note 20 Ultra', 'Galaxy Note 10'],
  'Apple': ['iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone XR', 'iPhone 14', 'iPhone 15', 'iPhone 11 Pro Max', 'iPhone 12 Pro Max', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone X', 'iPhone XS Max', 'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16', 'iPhone 16 Pro', 'iPhone 16 Pro Max', 'iPhone 16e', 'iPhone 17', 'iPhone 17 Pro', 'iPhone 17 Pro Max', 'iPhone SE (2022)', 'iPhone SE (2020)', 'iPhone 8 Plus', 'iPhone 7'],
  'Xiaomi': ['Redmi 13C', 'Redmi 14C', 'Redmi 12C', 'Redmi A3', 'Redmi Note 13', 'Redmi Note 14', 'Redmi Note 12', 'Redmi Note 13 Pro', 'Redmi Note 14 Pro', 'Redmi Note 14 Pro+', 'Poco C65', 'Poco M6 Pro', 'Poco X7', 'Poco X7 Pro', 'Xiaomi 13', 'Xiaomi 14'],
  'Oppo': ['A18', 'A17', 'A38', 'A58', 'A78', 'A80', 'Reno 8', 'Reno 11', 'Reno 12', 'Reno 13', 'Reno 13 Pro', 'Find X8', 'Find X8 Pro'],
  'Realme': ['C51', 'C53', 'C55', 'C67', 'C75', 'Note 60', '12', '13 Pro', '12 Pro+', '13 Pro+', 'GT 6', 'GT Neo 5'],
  'Huawei': ['Y7a', 'Y9a', 'Nova 9', 'Nova 10', 'Nova 11', 'Nova 12', 'Nova 13', 'P40 Lite', 'P60 Pro', 'Mate 60 Pro'],
  'Nokia': ['105', 'C12', 'C22', 'C32', 'G22', 'G42', '3210', '8210'],
  'Google': ['Pixel 6a', 'Pixel 7a', 'Pixel 8a', 'Pixel 6', 'Pixel 7', 'Pixel 8', 'Pixel 9', 'Pixel 9a', 'Pixel 6 Pro', 'Pixel 7 Pro', 'Pixel 8 Pro', 'Pixel 9 Pro', 'Pixel 9 Pro XL', 'Pixel 5', 'Pixel 4a', 'Pixel Fold'],
  'Vivo': ['Y19s', 'Y18', 'Y28', 'Y36', 'Y100', 'V29', 'V30', 'V40', 'X100'],
  'Honor': ['X5b', 'X6b', 'X7b', 'X8b', 'X9b', '90', '200', 'Magic 6'],
  'OnePlus': ['Nord CE 4', 'Nord 4', 'Nord N30', '12', '12R', '11', '10 Pro'],
  'Motorola': ['Moto G04', 'Moto G24', 'Moto G34', 'Moto G54', 'Moto G84', 'Edge 50', 'Moto E14'],
  'Alcatel': ['1B', '1S', '3L', 'Alcatel 1', 'Alcatel 5'],
  'ZTE': ['Blade A34', 'Blade A54', 'Blade A73', 'Blade V50', 'Nubia Neo'],
  'Autre marque': <String>[],
};

const _modTab = {
  'Apple': ['iPad (9ᵉ gén.)', 'iPad (10ᵉ gén.)', 'iPad (8ᵉ gén.)', 'iPad (7ᵉ gén.)', 'iPad (6ᵉ gén.)', 'iPad (11ᵉ gén.)', 'iPad Air', 'iPad Air 11″', 'iPad Air 13″', 'iPad Air 2', 'iPad mini', 'iPad mini (6ᵉ gén.)', 'iPad mini (7ᵉ gén.)', 'iPad Pro 11″', 'iPad Pro 12,9″', 'iPad Pro 13″', 'iPad 2018', 'iPad 2017'],
  'Samsung': ['Galaxy Tab A9', 'Galaxy Tab A9+', 'Galaxy Tab A8', 'Galaxy Tab A7', 'Galaxy Tab A7 Lite', 'Galaxy Tab S6 Lite', 'Galaxy Tab S9 FE', 'Galaxy Tab S9', 'Galaxy Tab S9 Ultra', 'Galaxy Tab S8', 'Galaxy Tab Active'],
  'Tecno': ['Megapad 10', 'Megapad 11'],
  'Infinix': ['XPad', 'XPad 11'],
  'Itel': ['Pad One', 'Pad 2', 'Pad 3'],
  'Lenovo': ['Tab M8', 'Tab M10', 'Tab M11', 'Tab P11', 'Tab P12'],
  'Xiaomi': ['Redmi Pad SE', 'Redmi Pad', 'Pad 6', 'Pad 7'],
  'Huawei': ['MatePad T10', 'MatePad SE', 'MatePad 11', 'MatePad 11,5'],
  'Oppo': ['Pad Air', 'Pad Air 2', 'Pad 2'],
  'Honor': ['Pad X8', 'Pad X9', 'Pad 9'],
  'Nokia': ['T20', 'T21'],
  'Autre marque': <String>[],
};

const _modFixe = {
  'Panasonic': ['KX-TS500 (filaire)', 'KX-TGB110 (sans fil)', 'KX-TGC212 (2 combinés)', 'KX-TS880 (filaire écran)'],
  'Nokia': ['105', '3210', '8210'],
  'Alcatel': ['T20 (filaire)', 'T50 (filaire écran)', 'D285 (sans fil)'],
  'Gigaset': ['A170 (sans fil)', 'AS405 (sans fil)', 'DL580'],
  'Yealink': ['T31P (IP)', 'T33G (IP)', 'T54W (IP)'],
  'Orchid': ['KP1000 (standard)'],
  'Autre marque': <String>[],
};

const _modOrdi = {
  'HP': ['EliteBook', 'ProBook', 'Pavilion', 'HP 250 / 255', 'HP 15', 'Envy', 'Omen', 'Victus', 'Spectre', 'ZBook', 'Chromebook', 'Compaq', 'ProDesk / EliteDesk', 'All-in-One'],
  'Dell': ['Latitude', 'Inspiron', 'Vostro', 'XPS', 'Precision', 'OptiPlex', 'G15 / G16', 'Alienware', 'Chromebook'],
  'Lenovo': ['ThinkPad', 'IdeaPad', 'ThinkBook', 'V15 / V14', 'Legion', 'Yoga', 'ThinkCentre', 'Chromebook'],
  'Apple': ['MacBook Air M1', 'MacBook Air M2', 'MacBook Air M3', 'MacBook Air M4', 'MacBook Air (Intel)', 'MacBook Pro 13"', 'MacBook Pro 14"', 'MacBook Pro 16"', 'MacBook Pro (Intel)', 'iMac', 'Mac mini', 'Mac Studio', 'Mac Pro'],
  'Asus': ['VivoBook', 'ZenBook', 'ExpertBook', 'TUF Gaming', 'ROG', 'Chromebook', 'X / F Series'],
  'Acer': ['Aspire', 'Swift', 'Extensa', 'TravelMate', 'Nitro', 'Predator', 'Chromebook'],
  'Toshiba': ['Satellite', 'Tecra', 'Portégé', 'Dynabook'],
  'MSI': ['Modern', 'Prestige', 'Katana', 'GF63', 'Thin', 'Raider'],
  'Samsung': ['Galaxy Book', 'Notebook', 'Chromebook'],
  'Microsoft': ['Surface Laptop', 'Surface Pro', 'Surface Go', 'Surface Book'],
  'Fujitsu': ['Lifebook', 'Esprimo', 'Celsius'],
  'Assemblé / sur mesure': ['Unité centrale assemblée', 'PC de jeu assemblé', 'Serveur assemblé'],
};

const _modPhoto = {
  'Canon': ['EOS 2000D', 'EOS 4000D', 'EOS 250D', 'EOS 850D', 'EOS 90D', 'EOS 700D', 'EOS 600D', 'EOS 80D', 'EOS 6D', 'EOS 5D Mark III', 'EOS 5D Mark IV', 'EOS R50', 'EOS R10', 'EOS R8', 'EOS R6', 'EOS R5', 'PowerShot', 'Autre Canon'],
  'Nikon': ['D3500', 'D5600', 'D7500', 'D750', 'D780', 'D850', 'D90', 'D3200', 'D5300', 'Z 50', 'Z fc', 'Z 6', 'Z 6II', 'Z 7', 'Coolpix', 'Autre Nikon'],
  'Sony': ['Alpha A6000', 'Alpha A6400', 'Alpha A6600', 'Alpha ZV-E10', 'Alpha A7 II', 'Alpha A7 III', 'Alpha A7 IV', 'Alpha A7R', 'RX100', 'ZV-1', 'Autre Sony'],
  'Fujifilm': ['X-T30', 'X-T4', 'X-T5', 'X-S10', 'X-S20', 'X100V', 'X100VI', 'Instax Mini', 'Instax Wide', 'Autre Fujifilm'],
  'Panasonic': ['Lumix G7', 'Lumix G85', 'Lumix GH5', 'Lumix GH6', 'Lumix S5', 'Lumix FZ', 'Autre Panasonic'],
  'GoPro': ['Hero 9', 'Hero 10', 'Hero 11', 'Hero 12', 'Hero 13', 'Max', 'Session'],
  'DJI': ['Mini 2', 'Mini 3', 'Mini 4', 'Air 2S', 'Air 3', 'Mavic 2', 'Mavic 3', 'Osmo Action', 'Osmo Pocket', 'Ronin'],
  'Olympus / OM System': ['OM-D E-M10', 'OM-D E-M5', 'OM-1', 'Tough TG'],
  'Polaroid': ['Now', 'Go', 'OneStep'],
  'Kodak': ['PixPro', 'Printomatic', 'Ektar'],
};

const _typesAcc = [
  'Chargeur secteur', 'Câble USB', 'Chargeur sans fil', 'Powerbank', 'Écouteurs filaires',
  'Écouteurs Bluetooth', 'Casque', 'Coque / étui', 'Verre trempé', 'Support voiture',
  'Carte mémoire', 'Adaptateur', 'Batterie de remplacement', 'Stylet', 'Clavier tablette', 'Autre accessoire'
];
const _marquesAcc = ['Oraimo', 'Anker', 'Samsung', 'Apple', 'Baseus', 'Xiaomi', 'Tecno', 'Infinix', 'Itel', 'Sans marque', 'Autre marque'];

const _prestations = [
  'Écran cassé', 'Batterie', 'Connecteur de charge', 'Désoxydation (tombé dans l’eau)',
  'Vitre arrière', 'Caméra', 'Haut-parleur / micro', 'Face ID / Touch ID', 'Déblocage réseau',
  'Dalle d’ordinateur', 'Clavier', 'Installation de système', 'Suppression de virus',
  'Ajout de RAM ou de SSD', 'Nettoyage et pâte thermique', 'Surchauffe', 'Carte mère / micro-soudure',
  'Ne s’allume plus', 'Rétroéclairage de dalle', 'Carte d’alimentation', 'Panne de son',
  'Lecteur de disque', 'Têtes d’impression / bourrage',
  'Récupération de données', 'Diagnostic'
];

/// Le kilométrage de l'appareil photo.
String _avisDeclenchements(Vals s) {
  const base = 'Le compte se lit dans les données EXIF d’une photo — ShutterCount, PhotoME. L’acheteur le vérifiera : autant l’annoncer.';
  final n = int.tryParse(_t(s, 'declenchements')) ?? 0;
  if (n == 0) return base;
  final f = _milliers(n);
  if (n < 5000) return '$f déclenchements : très peu. Sur un boîtier d’occasion, c’est un vrai argument de vente — mettez-le dans le titre.';
  if (n < 50000) return '$f déclenchements : usage normal, l’obturateur a encore une longue vie devant lui.';
  if (n < 100000) return '$f déclenchements : déjà bien utilisé. L’obturateur d’un boîtier d’entrée de gamme est donné pour environ 100 000 — dites-le honnêtement, le prix s’ajuste.';
  return '!$f déclenchements : au-delà des 100 000 annoncés pour un boîtier d’entrée de gamme. Sur un boîtier professionnel, donné jusqu’à 400 000, c’est encore raisonnable — précisez lequel, sinon l’acheteur suppose le pire.';
}

// --- Les schémas -------------------------------------------------------------

final Map<String, Schema> electronique = {
  'Smartphones': Schema(
    livraison: true,
    couleurs: true,
    titre: (s) => [_t(s, 'marque') != 'Autre marque' ? _t(s, 'marque') : '', _t(s, 'modele'), _t(s, 'stockage')]
        .where((x) => x.isNotEmpty)
        .join(' '),
    champs: [
      Champ('marque', 'Marque', options: _modTel.keys.toList(), req: true),
      const Champ('modele', 'Modèle',
          dependDe: 'marque', table: _modTel, req: true, libre: 'Autre modèle',
          h: 'Le modèle exact fait trouver votre annonce : c’est lui que les acheteurs tapent dans la recherche.'),
      const Champ('stockage', 'Stockage', options: ['32 Go', '64 Go', '128 Go', '256 Go', '512 Go', '1 To'], req: true, varOK: true),
      const Champ('ram', 'Mémoire (RAM)', options: ['2 Go', '3 Go', '4 Go', '6 Go', '8 Go', '12 Go'], varOK: true),
      const Champ('batterie', 'Santé de la batterie',
          options: ['100 %', 'Plus de 90 %', '80 à 90 %', 'Moins de 80 %', 'Batterie changée', 'Je ne sais pas'],
          varOK: true,
          h: 'Réglages → Batterie sur iPhone. Une réponse honnête évite le retour fâché.'),
      const Champ('provenance', 'Provenance',
          options: ['Neuf scellé (sous carton)', 'Occasion Côte d’Ivoire', 'Occasion d’Europe (« France au revoir »)'], req: true, varOK: true),
      const Champ('comptes', 'Comptes iCloud / Google',
          options: ['Déconnectés — prêt à l’emploi', 'Encore liés (vendu pour pièces)'],
          req: true,
          varOK: true,
          alerte: Alerte(
            bon: 'Déconnectés — prêt à l’emploi',
            texteBon: 'Le vendeur déclare l’appareil dissocié de son compte. Vérifiez-le avant de payer.',
            texteMauvais: 'Cet appareil ne pourra pas être utilisé tel quel : il est vendu pour pièces.',
          ),
          h: 'Un téléphone encore lié au compte de l’ancien propriétaire est inutilisable. C’est l’arnaque n° 1 sur l’occasion : l’acheteur vérifiera avant de payer — vérifiez avant de vendre.'),
      const Champ('fournis', 'Fournis avec',
          options: ['Boîte d’origine', 'Facture', 'Chargeur', 'Écouteurs', 'Coque offerte'], multi: true, varOK: true,
          h: 'La boîte d’origine permet à l’acheteur de comparer l’IMEI (*#06#) avec celui imprimé dessus.'),
      const Champ('garantie', 'Sous garantie', type: TypeChamp.bascule),
    ],
  ),
  'Tablettes': Schema(
    livraison: true,
    couleurs: true,
    titre: (s) => [_t(s, 'marque') != 'Autre marque' ? _t(s, 'marque') : '', _t(s, 'modele'), _t(s, 'stockage')]
        .where((x) => x.isNotEmpty)
        .join(' '),
    champs: [
      Champ('marque', 'Marque', options: _modTab.keys.toList(), req: true),
      const Champ('modele', 'Modèle', dependDe: 'marque', table: _modTab, req: true, libre: 'Autre modèle'),
      const Champ('ecran', 'Taille de l’écran',
          options: ['7 pouces', '8 pouces', '10 pouces', '11 pouces', '12 pouces et plus'], req: true),
      const Champ('stockage', 'Stockage', options: ['16 Go', '32 Go', '64 Go', '128 Go', '256 Go', '512 Go', '1 To'], req: true, varOK: true),
      const Champ('ram', 'Mémoire (RAM)', options: ['2 Go', '3 Go', '4 Go', '6 Go', '8 Go'], varOK: true),
      const Champ('reseau', 'Connectivité',
          options: ['Wi-Fi seulement', 'Wi-Fi + carte SIM (4G/5G)'], req: true,
          h: 'Une tablette avec carte SIM se vend nettement plus cher : dites-le.'),
      const Champ('batterie', 'Santé de la batterie', options: ['Comme neuve', 'Bonne', 'Moyenne', 'Batterie changée', 'Je ne sais pas'], varOK: true),
      const Champ('provenance', 'Provenance',
          options: ['Neuf scellé (sous carton)', 'Occasion Côte d’Ivoire', 'Occasion d’Europe (« France au revoir »)'], req: true, varOK: true),
      const Champ('comptes', 'Comptes iCloud / Google',
          options: ['Déconnectés — prêt à l’emploi', 'Encore liés (vendu pour pièces)'],
          req: true,
          varOK: true,
          alerte: Alerte(
            bon: 'Déconnectés — prêt à l’emploi',
            texteBon: 'Le vendeur déclare la tablette dissociée de son compte. Vérifiez-le avant de payer.',
            texteMauvais: 'Cette tablette ne pourra pas être réinitialisée : elle est vendue pour pièces.',
          ),
          h: 'Un iPad encore lié à l’identifiant Apple de l’ancien propriétaire ne se réinitialise pas. Même arnaque que sur les téléphones.'),
      const Champ('fournis', 'Fournis avec',
          options: ['Boîte d’origine', 'Facture', 'Chargeur', 'Étui / clavier', 'Stylet'], multi: true, varOK: true),
      const Champ('garantie', 'Sous garantie', type: TypeChamp.bascule),
    ],
  ),
  'Ordinateurs': Schema(
    livraison: true,
    couleurs: true,
    aideCouleurs:
        'Cochez chaque couleur que vous avez. Ouvrez-la ensuite pour lui donner ses photos, son prix, sa mémoire et son stockage.',
    titre: (s) => [_t(s, 'marqueOrdi'), _t(s, 'modeleOrdi'), _t(s, 'processeur'), _t(s, 'ram'), _t(s, 'capaciteStockage')]
        .where((x) => x.isNotEmpty)
        .join(' · '),
    champs: [
      const Champ('typeOrdi', 'Type d’ordinateur',
          req: true,
          options: ['Portable', 'Unité centrale (bureau)', 'Tout-en-un', 'Mini-PC', 'Station de travail', 'Serveur', 'Chromebook', 'Tablette PC / 2-en-1']),
      const Champ('marqueOrdi', 'Marque',
          req: true,
          options: ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'Toshiba', 'MSI', 'Samsung', 'Microsoft', 'Fujitsu', 'Assemblé / sur mesure']),
      const Champ('modeleOrdi', 'Modèle',
          req: true, dependDe: 'marqueOrdi', table: _modOrdi, libre: 'Autre modèle',
          h: 'Choisissez la gamme, puis précisez la référence exacte dans la description — « EliteBook 840 G8 » se cherche, « HP » ne se cherche pas.'),
      const Champ('processeur', 'Processeur',
          req: true,
          options: ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'Intel Core Ultra', 'Intel Celeron / Pentium', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'AMD Athlon / A-Series', 'Apple M1', 'Apple M2', 'Apple M3', 'Apple M4', 'Autre / je ne sais pas']),
      Champ('generation', 'Génération du processeur',
          req: true,
          when: (s) => RegExp(r'^Intel Core i').hasMatch(_t(s, 'processeur')),
          options: const ['4e génération ou avant', '5e', '6e', '7e', '8e', '9e', '10e', '11e', '12e', '13e', '14e', 'Je ne sais pas'],
          h: (s) => RegExp(r'^(4e|5e|6e)').hasMatch(_t(s, 'generation'))
              ? '!La génération compte autant que le numéro. Un Core i7 de 6e génération est plus lent qu’un Core i5 de 11e — annoncez-la, sinon l’acheteur découvre le chiffre au démarrage et repart.'
              : 'La génération compte autant que le i5 ou le i7. Elle se lit dans le numéro complet : un « i5-1135G7 » est de 11e génération, un « i7-4600U » de 4e.'),
      const Champ('ram', 'Mémoire vive (RAM)',
          req: true, varOK: true, lVar: 'RAM de cette version',
          options: ['2 Go', '4 Go', '6 Go', '8 Go', '12 Go', '16 Go', '24 Go', '32 Go', '64 Go et plus']),
      Champ('typeStockage', 'Type de stockage',
          req: true,
          options: const ['SSD', 'Disque dur (HDD)', 'SSD + disque dur', 'eMMC'],
          h: (s) {
            if (_t(s, 'typeStockage') == 'Disque dur (HDD)') {
              return 'Un SSD rend un ordinateur ancien deux fois plus vif qu’un disque dur neuf. Si vous en posez un avant de vendre, dites-le : c’est l’argument qui fait la différence de prix.';
            }
            if (_t(s, 'typeStockage') == 'SSD') return 'Le SSD est l’argument de vente le plus fort sur un ordinateur d’occasion. Mettez-le dans le titre.';
            return '';
          }),
      const Champ('capaciteStockage', 'Capacité de stockage',
          req: true, varOK: true, lVar: 'Stockage de cette version',
          options: ['32 Go', '64 Go', '128 Go', '250 Go', '256 Go', '320 Go', '500 Go', '512 Go', '1 To', '2 To et plus']),
      Champ('ecranPouces', 'Taille de l’écran',
          when: (s) => RegExp('Portable|Tout-en-un|Chromebook|Tablette').hasMatch(_t(s, 'typeOrdi')),
          options: const ['11,6 pouces', '12,5 pouces', '13,3 pouces', '14 pouces', '15,6 pouces', '16 pouces', '17,3 pouces', '21 pouces', '24 pouces', '27 pouces']),
      Champ('carteGraphique', 'Carte graphique',
          when: (s) => !RegExp('Serveur').hasMatch(_t(s, 'typeOrdi')),
          options: const ['Graphique intégré', 'NVIDIA GeForce GTX', 'NVIDIA GeForce RTX', 'NVIDIA MX', 'NVIDIA Quadro', 'AMD Radeon', 'Apple (puce intégrée)']),
      Champ('clavier', 'Disposition du clavier',
          req: true,
          when: (s) => RegExp('Portable|Tout-en-un|Chromebook|Tablette|Station').hasMatch(_t(s, 'typeOrdi')),
          options: const ['AZERTY (français)', 'AZERTY rétroéclairé', 'QWERTY (anglais)', 'QWERTY rétroéclairé', 'AZERTY belge', 'Arabe', 'Autre'],
          h: (s) => RegExp('QWERTY').hasMatch(_t(s, 'clavier'))
              ? '!Un clavier QWERTY se négocie moins cher ici, et surtout : dites-le dans l’annonce. C’est la première cause d’annulation au moment de la remise.'
              : 'C’est la première question de l’acheteur francophone. Un portable ramené des États-Unis est en QWERTY — le dire évite un déplacement pour rien.'),
      Champ('batterie', 'Autonomie de la batterie',
          req: true,
          when: (s) => RegExp('Portable|Chromebook|Tablette').hasMatch(_t(s, 'typeOrdi')),
          options: const ['Excellente — plus de 4 h', 'Bonne — 2 à 4 h', 'Faible — moins de 2 h', 'Ne tient pas — fonctionne branché', 'Batterie neuve, remplacée']),
      Champ('chargeur', 'Chargeur',
          req: true,
          when: (s) => RegExp('Portable|Chromebook|Tablette|Mini-PC').hasMatch(_t(s, 'typeOrdi')),
          options: const ['Chargeur d’origine fourni', 'Chargeur compatible fourni', 'Sans chargeur'],
          h: (s) => _t(s, 'chargeur') == 'Sans chargeur'
              ? '!Un portable sans chargeur perd un acheteur sur deux : le bon modèle est difficile à trouver ici, et coûte cher. Baissez le prix en conséquence.'
              : ''),
      Champ('ecranEtat', 'État de l’écran',
          when: (s) => RegExp('Portable|Tout-en-un|Chromebook|Tablette').hasMatch(_t(s, 'typeOrdi')),
          options: const ['Parfait', 'Rayures légères', 'Quelques pixels morts', 'Traces / halo lumineux', 'Dalle fêlée — à changer'],
          h: (s) => _t(s, 'ecranEtat') == 'Dalle fêlée — à changer'
              ? '!Photographiez l’écran allumé, pas éteint. Un acheteur qui découvre la fêlure à la remise annule, et laisse un avis.'
              : ''),
      Champ('etatLogiciel', 'État à la vente',
          req: true,
          options: const [
            'Réinitialisé, prêt à l’emploi', 'Windows installé et activé', 'Windows installé, non activé',
            'Livré sans système d’exploitation', 'Compte encore lié — vendu pour pièces', 'Verrouillage d’entreprise ou mot de passe BIOS'
          ],
          alerte: const Alerte(
            bon: 'Réinitialisé, prêt à l’emploi',
            ok: ['Windows installé et activé', 'Livré sans système d’exploitation'],
            texteBon: 'L’appareil a été réinitialisé : aucun compte de l’ancien propriétaire ne reste dessus. Allumez-le devant le vendeur pour le vérifier.',
            texteMauvais: 'Cet ordinateur n’est pas libre. Ne payez pas avant de l’avoir allumé et d’avoir vérifié qu’aucun compte ni mot de passe ne bloque le démarrage.',
            textes: {
              'Windows installé et activé': 'Windows est installé et activé. Vérifiez-le à la remise : Paramètres › Système › Activation.',
              'Windows installé, non activé': 'Windows n’est pas activé : un filigrane restera à l’écran et certaines options seront bloquées. Comptez le prix d’une licence.',
              'Livré sans système d’exploitation': 'L’ordinateur est vendu nu. Prévoyez l’installation du système — c’est normal sur du matériel professionnel reconditionné.',
              'Compte encore lié — vendu pour pièces': 'Cet ordinateur ne pourra pas être utilisé tel quel : il est vendu pour pièces. N’en payez pas le prix d’un ordinateur qui fonctionne.'
            },
          ),
          bloque: const ['Verrouillage d’entreprise ou mot de passe BIOS'],
          motifBloc: 'Un ordinateur verrouillé par une entreprise ne peut pas être mis en vente. Faites lever le verrou — ou vendez-le pour pièces, en le disant.',
          h: (s) {
            if (_t(s, 'etatLogiciel') == 'Compte encore lié — vendu pour pièces') {
              return '!Vendu pour pièces : écrivez-le aussi dans le titre et dans le prix. Si vous pouvez retirer le compte (Réglages › votre nom › Déconnexion), faites-le — l’appareil vaudra trois fois plus.';
            }
            if (_t(s, 'etatLogiciel') == 'Verrouillage d’entreprise ou mot de passe BIOS') {
              return '!Un mot de passe BIOS ou un verrouillage d’entreprise ne se retire pas par une réinstallation. Faites-le lever, puis republiez.';
            }
            return 'Réinitialisez avant de photographier : cela protège vos données autant que la vente.';
          }),
      const Champ('usageOrdi', 'Convient pour', multi: true,
          options: ['Bureautique', 'Études', 'Graphisme / montage vidéo', 'Jeux', 'Développement', 'Caisse / point de vente', 'Serveur / réseau']),
      const Champ('accessoiresOrdi', 'Fourni avec', multi: true,
          options: ['Sacoche', 'Souris', 'Clavier externe', 'Station d’accueil', 'Boîte d’origine', 'Facture', 'Câble HDMI']),
      _garantie,
    ],
  ),
  'TV & Écrans': Schema(
    livraison: true,
    couleurs: false,
    sansCouleur:
        'Un téléviseur est noir. Ajoutez plutôt une photo de l’écran allumé — c’est la seule qui rassure.',
    titre: (s) => [_t(s, 'typeEcran'), _t(s, 'marqueTV'), _t(s, 'pouces'), _t(s, 'resolution')]
        .where((x) => x.isNotEmpty)
        .join(' · '),
    champs: [
      const Champ('typeEcran', 'Type d’écran',
          req: true, options: ['Téléviseur', 'Écran d’ordinateur', 'Vidéoprojecteur', 'Écran géant / affichage professionnel']),
      const Champ('marqueTV', 'Marque',
          req: true,
          options: ['Samsung', 'LG', 'Hisense', 'TCL', 'Sony', 'Nasco', 'Smart Technology', 'Syinix', 'Astech', 'Innova', 'Philips', 'Panasonic', 'Sharp', 'Skyworth', 'Vitron', 'Autre']),
      const Champ('refTV', 'Référence exacte', ph: 'Ex : UA43T5300, 43UM7050',
          h: 'La référence est écrite au dos de l’appareil. C’est elle que l’acheteur tape pour comparer les prix.'),
      Champ('pouces', 'Taille de la dalle',
          req: true,
          when: (s) => _t(s, 'typeEcran') != 'Vidéoprojecteur',
          options: const ['19 pouces', '22 pouces', '24 pouces', '27 pouces', '32 pouces', '40 pouces', '43 pouces', '50 pouces', '55 pouces', '65 pouces', '75 pouces', '85 pouces et plus']),
      const Champ('resolution', 'Résolution', req: true, options: ['HD (720p)', 'Full HD (1080p)', '4K UHD', '8K']),
      const Champ('technologie', 'Technologie de dalle',
          options: ['LED', 'QLED', 'OLED', 'Mini-LED', 'LCD', 'Plasma (ancien)', 'Tube cathodique (ancien)']),
      Champ('smart', 'Connectée ou non',
          req: true,
          when: (s) => _t(s, 'typeEcran') == 'Téléviseur',
          options: const ['Smart TV (Android, WebOS, Tizen…)', 'TV connectée simple', 'TV non connectée']),
      Champ('tnt', 'Décodeur TNT intégré',
          req: true,
          when: (s) => _t(s, 'typeEcran') == 'Téléviseur',
          options: const ['Oui — décodeur TNT DVB-T2 intégré', 'Non — il faut un décodeur externe', 'Je ne sais pas'],
          alerte: const Alerte(
            bon: 'Oui — décodeur TNT DVB-T2 intégré',
            texteBon: 'Ce téléviseur capte directement les chaînes ivoiriennes de la TNT. Il ne manque qu’une antenne UHF, plafonnée à 6 000 FCFA par décret.',
            texteMauvais: 'Ce téléviseur ne capte pas la TNT tout seul. Comptez un décodeur DVB-T2 — plafonné à 10 000 FCFA — et une antenne UHF plafonnée à 6 000 FCFA.',
          ),
          h: 'La TNT ivoirienne est en DVB-T2. Sans décodeur intégré ni boîtier externe, l’écran n’affiche aucune chaîne — RTI 1, RTI 2, La 3, A+ Ivoire, Life TV, 7 Info, NCI.'),
      Champ('dalle', 'État de la dalle',
          req: true,
          options: const ['Écran parfait', 'Quelques pixels morts', 'Marques ou halo lumineux', 'Bandes / lignes à l’image', 'Dalle fêlée ou cassée', 'L’écran ne s’allume plus'],
          h: (s) {
            final d = _t(s, 'dalle');
            if (RegExp('fêlée|ne s’allume plus').hasMatch(d)) {
              return '!Une dalle de rechange coûte plus cher qu’un téléviseur neuf de la même taille : celui-ci ne se répare pas. Vendez-le en pièces détachées, et écrivez-le dans le titre.';
            }
            if (RegExp('Bandes|Marques|pixels').hasMatch(d)) {
              return '!Photographiez le défaut, écran allumé, sur fond blanc puis sur fond noir. Un acheteur qui le découvre à la remise annule.';
            }
            return 'Photographiez toujours l’écran allumé. Une photo d’écran éteint ne prouve rien, et tout le monde le sait.';
          }),
      _voltage,
      const Champ('regulateur', 'Régulateur de tension fourni', type: TypeChamp.bascule,
          h: 'Entre les coupures et les surtensions, un régulateur protège l’appareil. En fournir un est un vrai argument de vente ici.'),
      Champ('telecommande', 'Télécommande',
          req: true,
          when: (s) => _t(s, 'typeEcran') == 'Téléviseur',
          options: const ['Télécommande d’origine', 'Télécommande universelle', 'Sans télécommande']),
      const Champ('entrees', 'Connectique', multi: true,
          options: ['HDMI', 'USB', 'Prise antenne', 'Péritel', 'VGA', 'Sortie optique', 'Jack casque', 'Bluetooth', 'Wi-Fi', 'Ethernet']),
      const Champ('accessoiresTV', 'Fourni avec', multi: true,
          options: ['Pied d’origine', 'Support mural', 'Boîte d’origine', 'Câble HDMI', 'Câble d’alimentation', 'Facture']),
      _garantie,
    ],
  ),
  'Audio & Son': Schema(
    livraison: true,
    // Une enceinte portable ou un casque existe en dix teintes ; une table de
    // mixage est noire, et le restera.
    couleurs: (s) => RegExp('Enceinte Bluetooth|Casque|Écouteurs|Radio|Enceinte connectée')
        .hasMatch(_t(s, 'typeAudio')),
    sansCouleur: (s) => _t(s, 'typeAudio').isNotEmpty
        ? 'Ce matériel se vend en noir. Ajoutez plutôt une photo des branchements et une des haut-parleurs.'
        : 'La première photo sert de couverture.',
    titre: (s) => [_t(s, 'typeAudio'), _t(s, 'marqueAudio'), _t(s, 'puissance').isNotEmpty ? '${_t(s, 'puissance')} W' : '']
        .where((x) => x.isNotEmpty)
        .join(' · '),
    champs: [
      const Champ('typeAudio', 'Type de matériel',
          req: true,
          options: ['Enceinte Bluetooth', 'Sono / enceinte amplifiée', 'Enceinte connectée', 'Barre de son', 'Home cinéma', 'Casque', 'Écouteurs', 'Ampli / amplificateur', 'Table de mixage', 'Micro', 'Platine DJ / contrôleur', 'Autoradio', 'Radio', 'Caisson de basses']),
      const Champ('marqueAudio', 'Marque',
          req: true,
          options: ['JBL', 'Sony', 'Bose', 'Harman Kardon', 'Yamaha', 'Behringer', 'Mackie', 'Peavey', 'Pioneer', 'Denon', 'Philips', 'Samsung', 'LG', 'Anker / Soundcore', 'Nasco', 'Shure', 'Sans marque', 'Autre']),
      const Champ('refAudio', 'Modèle', ph: 'Ex : Flip 6, SRM450, WH-1000XM4'),
      _authenticite('Un JBL'),
      Champ('puissance', 'Puissance',
          type: TypeChamp.nombre, unite: 'W', ph: 'Ex : 300',
          when: (s) => RegExp('Sono|Ampli|Enceinte|Barre|Home cinéma|Caisson').hasMatch(_t(s, 'typeAudio')),
          h: 'La puissance RMS, pas la puissance « crête » écrite sur le carton. Les acheteurs qui sonorisent une cérémonie comparent celle-là.'),
      const Champ('alimentation', 'Alimentation', req: true, options: ['Secteur 220 V', 'Batterie rechargeable', 'Batterie + secteur', 'Piles']),
      _voltage,
      Champ('autonomie', 'Autonomie annoncée',
          type: TypeChamp.nombre, unite: 'h', ph: 'Ex : 12',
          when: (s) => RegExp('Batterie').hasMatch(_t(s, 'alimentation'))),
      const Champ('connexions', 'Connexions', multi: true,
          options: ['Bluetooth', 'Jack 3,5 mm', 'USB', 'Carte SD', 'Radio FM', 'Optique', 'XLR', 'RCA', 'Wi-Fi', 'NFC']),
      Champ('microFourni', 'Micro(s) fourni(s)',
          type: TypeChamp.bascule,
          when: (s) => RegExp('Sono|Ampli|Table de mixage').hasMatch(_t(s, 'typeAudio'))),
      Champ('etatSon', 'État du son',
          req: true,
          options: const ['Aucun défaut', 'Léger grésillement à fort volume', 'Un haut-parleur faible', 'Un canal ne fonctionne plus', 'Ne fonctionne que branché'],
          h: (s) => (_t(s, 'etatSon').isNotEmpty && _t(s, 'etatSon') != 'Aucun défaut')
              ? '!Ajoutez une courte vidéo avec le son. C’est ce que l’acheteur demandera de toute façon, et cela vous évite dix messages.'
              : 'Une courte vidéo avec le son vaut mieux que trois photos.'),
      const Champ('accessoiresAudio', 'Fourni avec', multi: true,
          options: ['Câble d’alimentation', 'Câble jack', 'Câble XLR', 'Housse / sacoche', 'Télécommande', 'Boîte d’origine', 'Facture', 'Pied d’enceinte']),
      _garantie,
    ],
  ),
  'Jeux vidéo': Schema(
    livraison: true,
    couleurs: (s) => RegExp('Console|Manette|Accessoire').hasMatch(_t(s, 'typeJeu')),
    sansCouleur: 'Un jeu n’a pas de couleur. Photographiez la jaquette, le disque, et le dos de la boîte.',
    titre: (s) => [
          _t(s, 'modeleConsole').isNotEmpty ? _t(s, 'modeleConsole') : _t(s, 'plateforme'),
          _t(s, 'typeJeu') == 'Jeu (disque ou boîte)' ? _t(s, 'refJeu') : '',
          _t(s, 'stockageConsole')
        ].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeJeu', 'Ce que vous vendez',
          req: true,
          options: ['Console', 'Jeu (disque ou boîte)', 'Manette', 'Accessoire (casque, volant, station)', 'Carte cadeau / abonnement']),
      const Champ('plateforme', 'Plateforme',
          req: true,
          options: ['PlayStation 5', 'PlayStation 4', 'PlayStation 3', 'PlayStation 2', 'Xbox Series X|S', 'Xbox One', 'Xbox 360', 'Nintendo Switch', 'Nintendo Switch 2', 'Nintendo Switch Lite', 'Nintendo 3DS', 'Nintendo Wii', 'PC', 'Steam Deck', 'Console rétro / autre']),
      Champ('modeleConsole', 'Modèle exact',
          req: true, dependDe: 'plateforme', libre: 'Autre',
          when: (s) => _t(s, 'typeJeu') == 'Console',
          table: const {
            'PlayStation 5': ['PS5 Standard (avec lecteur)', 'PS5 Digital Edition', 'PS5 Slim', 'PS5 Slim Digital', 'PS5 Pro'],
            'PlayStation 4': ['PS4 Fat', 'PS4 Slim', 'PS4 Pro'],
            'PlayStation 3': ['PS3 Fat', 'PS3 Slim', 'PS3 Super Slim'],
            'PlayStation 2': ['PS2 Fat', 'PS2 Slim'],
            'Xbox Series X|S': ['Xbox Series X', 'Xbox Series S'],
            'Xbox One': ['Xbox One', 'Xbox One S', 'Xbox One X'],
            'Xbox 360': ['Xbox 360 Fat', 'Xbox 360 Slim', 'Xbox 360 E'],
            'Nintendo Switch': ['Switch V1', 'Switch V2', 'Switch OLED'],
            'Nintendo Switch 2': ['Switch 2'],
            'Nintendo Switch Lite': ['Switch Lite'],
            'Nintendo 3DS': ['3DS', '3DS XL', 'New 3DS', '2DS'],
            'Nintendo Wii': ['Wii', 'Wii U'],
            'Steam Deck': ['Steam Deck LCD', 'Steam Deck OLED'],
          }),
      Champ('refJeu', 'Titre du jeu',
          ph: 'Ex : EA FC 26, GTA V', req: true,
          when: (s) => _t(s, 'typeJeu') == 'Jeu (disque ou boîte)'),
      Champ('jeuxInclus', 'Jeux inclus',
          req: true,
          when: (s) => _t(s, 'typeJeu') == 'Console',
          options: const ['Aucun jeu — console seule', 'Jeux sur disque, fournis avec les boîtes', 'Jeux numériques sur un compte que je cède à l’acheteur', 'Jeux numériques sur un compte partagé (je reste dessus)'],
          alerte: const Alerte(
            bon: 'Jeux sur disque, fournis avec les boîtes',
            ok: ['Aucun jeu — console seule', 'Jeux numériques sur un compte que je cède à l’acheteur'],
            texteBon: 'Les jeux sont sur disque : ils vous appartiennent dès la remise, et personne ne peut vous les retirer.',
            texteMauvais: 'Ces jeux ne vous appartiendront pas. Ils restent liés au compte du vendeur, qui peut changer son mot de passe, les retirer, ou se faire bannir — et tout disparaît. Une console « avec 30 jeux » sur compte partagé vaut le prix d’une console vide.',
            textes: {
              'Aucun jeu — console seule': 'Console vendue seule. Le prix doit le refléter — et rien ne peut vous être retiré après l’achat.',
              'Jeux numériques sur un compte que je cède à l’acheteur': 'Le vendeur cède le compte. Changez le mot de passe et l’adresse e-mail devant lui, à la remise, avant de payer le solde.'
            },
          ),
          h: (s) => RegExp('compte partagé').hasMatch(_t(s, 'jeuxInclus'))
              ? '!Vendre une console « pleine de jeux » qui restent sur votre compte n’est pas une vente : l’acheteur perdra tout le jour où vous changerez de mot de passe. Annoncez-la comme console seule, au prix d’une console seule.'
              : 'C’est la première question à poser sur une console d’occasion — et la première arnaque du marché.'),
      Champ('stockageConsole', 'Stockage',
          when: (s) => _t(s, 'typeJeu') == 'Console',
          options: const ['320 Go', '500 Go', '825 Go', '1 To', '2 To', 'Autre']),
      Champ('manettes', 'Manettes fournies',
          when: (s) => _t(s, 'typeJeu') == 'Console',
          options: const ['Aucune', '1 manette', '2 manettes', '3 manettes', '4 manettes']),
      Champ('drift', 'État des sticks (drift)',
          req: true,
          when: (s) => _t(s, 'typeJeu') == 'Manette' || (_t(s, 'typeJeu') == 'Console' && _t(s, 'manettes').isNotEmpty && _t(s, 'manettes') != 'Aucune'),
          options: const ['Aucun drift — sticks parfaits', 'Léger drift sur une manette', 'Drift important', 'Je n’ai pas vérifié'],
          h: (s) => RegExp('Drift important|Léger drift').hasMatch(_t(s, 'drift'))
              ? '!Le drift est le défaut n°1 des manettes d’occasion. L’annoncer vaut mieux que de le laisser découvrir : la manette se vend quand même, moins cher.'
              : 'Le drift, c’est le personnage qui bouge tout seul, manette posée. Testez-le avant de publier : l’acheteur le testera devant vous.'),
      Champ('region', 'Zone / région',
          when: (s) => RegExp('Console|Jeu').hasMatch(_t(s, 'typeJeu')),
          options: const ['PAL / Europe', 'NTSC / États-Unis', 'NTSC-J / Japon', 'Multi-région', 'Je ne sais pas'],
          h: 'Une console américaine se branche ici avec un transformateur, mais certains jeux et abonnements restent liés à sa zone.'),
      _voltage,
      Champ('langueJeu', 'Langue',
          when: (s) => _t(s, 'typeJeu') == 'Jeu (disque ou boîte)',
          options: const ['Français', 'Anglais', 'Multilingue', 'Japonais']),
      const Champ('boiteJeu', 'Boîte et notice d’origine', type: TypeChamp.bascule),
      Champ('accessoiresJeu', 'Fourni avec',
          multi: true,
          when: (s) => _t(s, 'typeJeu') == 'Console',
          options: const ['Câble HDMI', 'Câble d’alimentation', 'Câble de manette', 'Casque', 'Support vertical', 'Boîte d’origine', 'Facture']),
      _garantie,
    ],
  ),
  'Appareils photo': Schema(
    livraison: true,
    couleurs: (s) => RegExp('Instantané|Compact|Caméra d’action').hasMatch(_t(s, 'typeAppareil')),
    sansCouleur:
        'Un boîtier est noir. Ajoutez plutôt une photo du capteur, une de l’écran allumé, et une du dessous avec le numéro de série masqué.',
    titre: (s) => [
          _t(s, 'marquePhoto'),
          _t(s, 'modelePhoto'),
          _t(s, 'declenchements').isNotEmpty ? '${_milliers(int.tryParse(_t(s, 'declenchements')) ?? 0)} décl.' : ''
        ].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeAppareil', 'Type d’appareil',
          req: true,
          options: ['Reflex (DSLR)', 'Hybride (sans miroir)', 'Compact', 'Bridge', 'Caméra d’action', 'Caméscope', 'Drone', 'Instantané (Polaroid, Instax)', 'Objectif seul', 'Accessoire photo']),
      const Champ('marquePhoto', 'Marque',
          req: true,
          options: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic', 'GoPro', 'DJI', 'Olympus / OM System', 'Polaroid', 'Kodak', 'Autre']),
      const Champ('modelePhoto', 'Modèle', req: true, dependDe: 'marquePhoto', table: _modPhoto, libre: 'Autre modèle'),
      Champ('declenchements', 'Nombre de déclenchements',
          type: TypeChamp.nombre, ph: 'Ex : 24000', req: true,
          when: (s) => RegExp('Reflex|Hybride').hasMatch(_t(s, 'typeAppareil')),
          h: _avisDeclenchements),
      Champ('compteDeclare', 'Ce nombre est',
          req: true,
          when: (s) => RegExp('Reflex|Hybride').hasMatch(_t(s, 'typeAppareil')),
          options: const ['Vérifié dans les EXIF, je peux le prouver', 'Estimé, non vérifié', 'Compteur remis à zéro ou carte mère changée', 'Je ne sais pas'],
          alerte: const Alerte(
            bon: 'Vérifié dans les EXIF, je peux le prouver',
            texteBon: 'Le vendeur dit pouvoir prouver le compteur. Demandez-lui une photo récente prise avec le boîtier : le compte s’y lit dans les données EXIF.',
            texteMauvais: 'Le compteur n’est pas prouvé. Demandez une photo prise à l’instant avec le boîtier et vérifiez-la vous-même — ShutterCount ou PhotoME le font gratuitement.',
            textes: {
              'Compteur remis à zéro ou carte mère changée': 'Le compteur a été remis à zéro : le chiffre affiché ne représente pas l’usure réelle de l’obturateur. Le vendeur le dit, c’est honnête — jugez l’appareil sur son état, pas sur ce nombre.'
            },
          ),
          h: 'Le déclarer vous protège : un vice caché se retourne contre le vendeur, même longtemps après la vente.'),
      Champ('capteur', 'Taille du capteur',
          when: (s) => RegExp('Reflex|Hybride|Compact|Bridge').hasMatch(_t(s, 'typeAppareil')),
          options: const ['Plein format (24×36)', 'APS-C', 'Micro 4/3', '1 pouce', 'Petit capteur']),
      Champ('megapixels', 'Résolution',
          type: TypeChamp.nombre, unite: 'Mpx', ph: 'Ex : 24',
          when: (s) => !RegExp('Objectif seul|Accessoire').hasMatch(_t(s, 'typeAppareil'))),
      Champ('objectifFourni', 'Objectif',
          req: true,
          when: (s) => RegExp('Reflex|Hybride').hasMatch(_t(s, 'typeAppareil')),
          options: const ['Boîtier nu, sans objectif', 'Avec l’objectif du kit (18-55)', 'Avec un ou plusieurs objectifs']),
      Champ('objectifs', 'Lesquels',
          ph: 'Ex : 50 mm f/1.8, 18-135 mm',
          when: (s) => _t(s, 'objectifFourni') == 'Avec un ou plusieurs objectifs'),
      Champ('monture', 'Monture',
          req: true,
          when: (s) => _t(s, 'typeAppareil') == 'Objectif seul',
          options: const ['Canon EF', 'Canon EF-S', 'Canon RF', 'Nikon F', 'Nikon Z', 'Sony E', 'Sony A', 'Fujifilm X', 'Micro 4/3', 'Pentax K', 'M42 (ancienne)', 'Autre'],
          h: 'La monture décide de tout : un objectif Canon EF ne se monte pas sur un Nikon. C’est la première chose que l’acheteur vérifie.'),
      Champ('etatCapteur', 'État du capteur',
          when: (s) => RegExp('Reflex|Hybride').hasMatch(_t(s, 'typeAppareil')),
          options: const ['Capteur propre', 'Quelques poussières', 'Poussières visibles sur les photos', 'Rayure sur le capteur'],
          h: (s) => RegExp('Rayure').hasMatch(_t(s, 'etatCapteur'))
              ? '!Une rayure sur le capteur marque toutes les photos et ne se nettoie pas. Montrez une photo test sur fond uni clair.'
              : 'Les poussières se nettoient. Une photo test sur ciel uni, à f/16, les montre toutes — jointe à l’annonce, elle inspire confiance.'),
      Champ('stabilisation', 'Stabilisation',
          type: TypeChamp.bascule,
          when: (s) => !RegExp('Objectif seul|Accessoire|Instantané').hasMatch(_t(s, 'typeAppareil'))),
      Champ('video', 'Vidéo',
          when: (s) => !RegExp('Objectif seul|Accessoire|Instantané').hasMatch(_t(s, 'typeAppareil')),
          options: const ['Pas de vidéo', 'Full HD (1080p)', '4K', '4K 60 images/s', '6K ou 8K']),
      const Champ('accessoiresPhoto', 'Fourni avec', multi: true,
          options: ['Batterie d’origine', 'Batterie supplémentaire', 'Chargeur', 'Carte mémoire', 'Sac / sacoche', 'Trépied', 'Flash', 'Pare-soleil', 'Boîte d’origine', 'Facture']),
      _garantie,
    ],
  ),
  'Accessoires téléphone': Schema(
    livraison: true,
    couleurs: true,
    titre: (s) => [
          _t(s, 'typeAcc'),
          (_t(s, 'marque').isNotEmpty && _t(s, 'marque') != 'Autre marque' && _t(s, 'marque') != 'Sans marque') ? _t(s, 'marque') : '',
          _t(s, 'compatible')
        ].where((x) => x.isNotEmpty).join(' — '),
    champs: [
      const Champ('typeAcc', 'Type d’accessoire', req: true, options: _typesAcc),
      const Champ('marque', 'Marque', req: true, options: _marquesAcc),
      const Champ('compatible', 'Compatible avec',
          ph: 'Ex : iPhone 13, tous Android, USB-C', req: true,
          h: 'La première question de l’acheteur. Un chargeur « universel » qui ne l’est pas fait un litige.'),
      Champ('puissance', 'Puissance',
          when: (s) => RegExp('Chargeur').hasMatch(_t(s, 'typeAcc')),
          options: const ['5 W', '10 W', '18 W', '20 W', '25 W', '33 W', '45 W', '65 W et plus']),
      Champ('capacite', 'Capacité',
          when: (s) => _t(s, 'typeAcc') == 'Powerbank' || _t(s, 'typeAcc') == 'Batterie de remplacement',
          options: const ['5 000 mAh', '10 000 mAh', '20 000 mAh', '30 000 mAh et plus']),
      Champ('go', 'Capacité',
          when: (s) => _t(s, 'typeAcc') == 'Carte mémoire',
          options: const ['16 Go', '32 Go', '64 Go', '128 Go', '256 Go', '512 Go']),
      Champ('sansFil', 'Sans fil / Bluetooth',
          type: TypeChamp.bascule,
          when: (s) => RegExp('Écouteurs|Casque|Clavier').hasMatch(_t(s, 'typeAcc'))),
      _authenticite('Un chargeur ou un écouteur de marque'),
      const Champ('lot', 'Vendu par lot', type: TypeChamp.bascule,
          h: 'Cochez si vous vendez en gros : l’acheteur revendeur le cherche.'),
      const Champ('provenance', 'Provenance', req: true, varOK: true, options: ['Neuf scellé (sous carton)', 'Neuf sans boîte', 'Occasion']),
      const Champ('garantie', 'Sous garantie', type: TypeChamp.bascule),
    ],
  ),
  'Accessoires informatiques': Schema(
    livraison: true,
    couleurs: (s) => RegExp('Clavier|Souris|Casque|Sacoche|Clé USB|Webcam|Support').hasMatch(_t(s, 'typeAcc')),
    sansCouleur: (s) => _t(s, 'typeAcc').isNotEmpty
        ? 'Ce matériel n’a pas de variante de couleur. Photographiez l’étiquette et les branchements.'
        : 'La première photo sert de couverture.',
    titre: (s) => [_t(s, 'typeAcc'), _t(s, 'marqueAcc'), _t(s, 'capaciteAcc'), _t(s, 'disposition')]
        .where((x) => x.isNotEmpty)
        .join(' · '),
    champs: [
      const Champ('typeAcc', 'Type d’accessoire',
          req: true,
          options: ['Clavier', 'Souris', 'Casque / micro', 'Webcam', 'Imprimante', 'Scanner', 'Disque dur externe', 'Clé USB', 'Carte mémoire', 'Onduleur / régulateur', 'Câble / adaptateur', 'Sacoche / sac', 'Support / refroidisseur', 'Routeur / point d’accès', 'Switch / matériel réseau', 'Composant PC (RAM, carte graphique…)', 'Encre / toner', 'Autre']),
      const Champ('marqueAcc', 'Marque', ph: 'Ex : Logitech, HP, SanDisk, sans marque'),
      Champ('compatible', 'Compatible avec',
          req: true, multi: true,
          when: (s) => !RegExp('Onduleur|Câble|Sacoche|Support|Encre|Switch|Composant').hasMatch(_t(s, 'typeAcc')),
          options: const ['Windows', 'macOS', 'Linux', 'Android', 'iPhone / iPad', 'Console de jeu', 'Tous ordinateurs'],
          h: 'C’est la première question de l’acheteur. Un accessoire « universel » qui ne l’est pas fait un litige à chaque fois.'),
      Champ('disposition', 'Disposition du clavier',
          req: true,
          when: (s) => _t(s, 'typeAcc') == 'Clavier',
          options: const ['AZERTY (français)', 'AZERTY belge', 'QWERTY (anglais)', 'QWERTZ (allemand)', 'Arabe', 'Autre'],
          h: (s) => RegExp('QWERTY|QWERTZ').hasMatch(_t(s, 'disposition'))
              ? '!Précisez-le dans le titre. Un clavier QWERTY se vend ici, mais moins cher, et seulement à qui le cherche.'
              : 'La disposition, pas la marque, décide de l’achat. Photographiez le clavier de face, touches lisibles.'),
      Champ('connexion', 'Connexion',
          when: (s) => !RegExp('Encre|Composant|Sacoche|Onduleur|Support').hasMatch(_t(s, 'typeAcc')),
          options: const ['USB-A', 'USB-C', 'Sans fil (dongle USB)', 'Bluetooth', 'Filaire PS/2', 'Réseau (RJ45)', 'Wi-Fi', 'Jack 3,5 mm']),
      Champ('capaciteAcc', 'Capacité',
          req: true,
          when: (s) => RegExp('Disque dur externe|Clé USB|Carte mémoire').hasMatch(_t(s, 'typeAcc')),
          options: const ['8 Go', '16 Go', '32 Go', '64 Go', '128 Go', '256 Go', '500 Go', '512 Go', '1 To', '2 To', '4 To et plus'],
          h: 'Les fausses capacités sont courantes : une carte annoncée 128 Go qui n’en contient que 8 se remplit puis efface tout en silence. Testez-la en copiant un gros fichier avant de la vendre, et dites que vous l’avez fait.'),
      Champ('typeImprimante', 'Type d’imprimante',
          req: true,
          when: (s) => _t(s, 'typeAcc') == 'Imprimante',
          options: const ['Jet d’encre', 'Laser noir et blanc', 'Laser couleur', 'Multifonction (impression + scan)', 'Thermique (tickets)', 'Traceur / grand format']),
      Champ('cartouche', 'Cartouches',
          req: true,
          when: (s) => _t(s, 'typeAcc') == 'Imprimante',
          options: const ['Cartouches neuves fournies', 'Cartouches entamées', 'Sans cartouche', 'Réservoir rechargeable (Ecotank, Ink Tank)'],
          h: (s) => _t(s, 'cartouche') == 'Sans cartouche'
              ? '!Un jeu de cartouches coûte souvent plus cher qu’une imprimante d’entrée de gamme. L’acheteur doit le savoir avant, pas après.'
              : 'Le coût des cartouches pèse plus lourd que le prix de l’imprimante. Précisez la référence exacte dans la description.'),
      Champ('puissanceOnduleur', 'Puissance',
          type: TypeChamp.nombre, unite: 'VA', ph: 'Ex : 650',
          when: (s) => _t(s, 'typeAcc') == 'Onduleur / régulateur',
          h: 'Un onduleur de 650 VA tient un ordinateur de bureau quelques minutes — assez pour l’éteindre proprement pendant une coupure.'),
      Champ('batterieOnduleur', 'État de la batterie',
          req: true,
          when: (s) => _t(s, 'typeAcc') == 'Onduleur / régulateur',
          options: const ['Batterie neuve', 'Batterie bonne', 'Batterie faible — à changer', 'Sans batterie — régule seulement'],
          h: 'La batterie d’un onduleur est la seule pièce qui meurt. Son état fait le prix.'),
      _authenticite('Un accessoire de marque'),
      const Champ('accessoiresAcc', 'Fourni avec', multi: true,
          options: ['Câble d’alimentation', 'Câble de données', 'Dongle / récepteur', 'Piles', 'Housse', 'Boîte d’origine', 'Facture', 'Pilotes / CD']),
      _garantie,
    ],
  ),
  'Téléphones fixes': Schema(
    livraison: true,
    couleurs: true,
    titre: (s) => [_t(s, 'marque') != 'Autre marque' ? _t(s, 'marque') : '', _t(s, 'modele'), _t(s, 'typeFixe')]
        .where((x) => x.isNotEmpty)
        .join(' '),
    champs: [
      const Champ('typeFixe', 'Type d’appareil',
          req: true, options: ['Filaire', 'Sans fil (DECT)', 'Téléphone IP / VoIP', 'Standard (PABX)', 'Téléphone de bureau']),
      Champ('marque', 'Marque', req: true, options: _modFixe.keys.toList()),
      const Champ('modele', 'Modèle', dependDe: 'marque', table: _modFixe, req: true, libre: 'Autre modèle'),
      Champ('combines', 'Nombre de combinés',
          when: (s) => _t(s, 'typeFixe') == 'Sans fil (DECT)',
          options: const ['1', '2', '3', '4 et plus']),
      const Champ('fonctions', 'Fonctions', multi: true,
          options: ['Écran', 'Répondeur', 'Mains libres', 'Blocage d’appels', 'Grandes touches', 'Rétroéclairage']),
      const Champ('provenance', 'Provenance', req: true, varOK: true, options: ['Neuf scellé (sous carton)', 'Occasion Côte d’Ivoire', 'Occasion d’Europe']),
      const Champ('fournis', 'Fournis avec', multi: true, varOK: true,
          options: ['Boîte d’origine', 'Facture', 'Adaptateur secteur', 'Câble téléphonique', 'Notice']),
      const Champ('garantie', 'Sous garantie', type: TypeChamp.bascule),
    ],
  ),
  'Réparation & Dépannage': Schema(
    etat: false,
    service: true,
    couleurs: false,
    prixLabel: 'Tarif à partir de',
    sansCouleur:
        'Une réparation n’est pas un objet : elle n’a ni couleur ni état. Montrez votre atelier, votre établi, vos avant/après.',
    titre: (s) {
      final a = (s['appareilsRep'] is List) ? List<String>.from(s['appareilsRep'] as List) : <String>[];
      final p = (s['prestations'] is List) ? List<String>.from(s['prestations'] as List) : <String>[];
      if (a.isEmpty && p.isEmpty) return 'Service de réparation';
      final corps = [
        a.isNotEmpty ? a.take(2).join(' et ').toLowerCase() : '',
        p.isNotEmpty ? p.take(2).join(', ').toLowerCase() : ''
      ].where((x) => x.isNotEmpty).join(' — ');
      return 'Réparation $corps';
    },
    champs: [
      const Champ('appareilsRep', 'Appareils que vous réparez',
          multi: true, req: true,
          options: ['Téléphones', 'Tablettes', 'Ordinateurs portables', 'Ordinateurs de bureau', 'Téléviseurs', 'Consoles de jeu', 'Sono / audio', 'Imprimantes', 'Appareils photo'],
          h: 'C’est le premier filtre de l’acheteur : il cherche « réparation téléviseur Yopougon », pas « réparateur ».'),
      const Champ('prestations', 'Pannes que vous traitez', options: _prestations, multi: true, req: true),
      const Champ('marquesRep', 'Marques prises en charge',
          multi: true, req: true,
          options: ['Toutes marques', 'Apple', 'Samsung', 'Tecno', 'Infinix', 'Itel', 'Xiaomi', 'Oppo', 'Huawei', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'LG', 'Hisense', 'TCL', 'Sony', 'PlayStation', 'Xbox', 'Nintendo']),
      const Champ('delai', 'Délai habituel',
          options: ['30 minutes', '1 heure', 'Le jour même', '24 heures', '48 heures', 'Sur devis'], req: true),
      const Champ('garantieRep', 'Garantie sur la réparation',
          options: ['Aucune', '7 jours', '15 jours', '1 mois', '3 mois'], req: true,
          h: 'Une garantie, même de sept jours, vous distingue de la boutique du coin qui n’en donne aucune.'),
      const Champ('pieces', 'Pièces utilisées',
          req: true,
          options: ['Pièces d’origine', 'Pièces compatibles de bonne qualité', 'Selon le budget du client'],
          alerte: Alerte(
            bon: 'Pièces d’origine',
            ok: ['Pièces compatibles de bonne qualité'],
            texteBon: 'Le réparateur annonce des pièces d’origine. Demandez à voir l’emballage de la pièce avant la pose.',
            texteMauvais: 'Le réparateur adapte la pièce au budget. Demandez laquelle sera posée, et le prix de chacune, avant de laisser votre appareil.',
            textes: {
              'Pièces compatibles de bonne qualité': 'Le réparateur annonce des pièces compatibles, et le dit. C’est honnête, et c’est ce que font la plupart des ateliers — le prix doit s’en ressentir.'
            },
          ),
          h: 'C’est la vraie question du client qui laisse son appareil. Y répondre à l’avance vous distingue de l’atelier d’à côté.'),
      const Champ('atelier', 'Vous recevez en atelier', type: TypeChamp.bascule),
      const Champ('dom', 'Vous vous déplacez à domicile', type: TypeChamp.bascule),
      const Champ('devis', 'Devis gratuit', type: TypeChamp.bascule),
    ],
  ),
};
