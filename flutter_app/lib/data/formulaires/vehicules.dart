// =============================================================================
//  VÉHICULES — sept sous-catégories (port fidèle de src/data/sous/vehicules.dart).
//
//  Ce qui fait perdre de l'argent à un acheteur ivoirien, ce n'est pas la
//  couleur du siège : c'est le dossier administratif. Un véhicule dont la carte
//  grise n'est pas au nom du vendeur, ou qui porte une opposition (gage), ne
//  pourra jamais être immatriculé au nom de l'acheteur — l'argent est parti, la
//  voiture reste juridiquement à quelqu'un d'autre.
//
//   · Vente : carte grise originale, certificat de cession légalisé, CNI des
//     deux parties, visite technique valide, vignette, assurance, CSA.
//   · Le CSA (« non-gage ») atteste qu'aucune opposition ni gage ne bloque la
//     mutation. Un véhicule acheté à crédit non soldé ne peut pas être vendu.
//   · Import : limite d'âge 5 ans pour une voiture particulière.
//
//  Le bloc couleurs / variantes du site n'est pas encore porté ici.
// =============================================================================
import 'schema.dart';

String _t(Vals s, String cle) => (s[cle] ?? '').toString();

String _milliers(int n) {
  final neg = n < 0;
  final str = n.abs().toString();
  final buf = StringBuffer();
  for (int i = 0; i < str.length; i++) {
    if (i > 0 && (str.length - i) % 3 == 0) buf.write(' ');
    buf.write(str[i]);
  }
  return (neg ? '-' : '') + buf.toString();
}

/// « Ce kilométrage, c'est de combien par an ? » Un chiffre brut ne dit rien :
/// 145 000 km, c'est beaucoup sur une voiture de 2022 et peu sur une de 2005.
/// Un kilométrage anormalement BAS pour l'âge est le premier signe d'un
/// compteur trafiqué — le « ! » colore l'avertissement en rouge.
String _moyenneAnnuelle(String valeur, String annee, String unite, int parAn) {
  final v = int.tryParse(valeur.replaceAll(RegExp(r'\D'), '')) ?? 0;
  final a = int.tryParse(annee.replaceAll(RegExp(r'\D'), '')) ?? 0;
  if (v == 0 || a == 0) return '';
  final ans = (2026 - a) < 1 ? 1 : (2026 - a);
  final m = (v / ans).round();
  final fmt = _milliers(m);
  final base = 'Soit environ $fmt $unite par an sur $ans an${ans > 1 ? 's' : ''} — ';
  if (m < parAn * 0.5) {
    if (ans < 6) return '${base}c’est peu : un vrai argument de vente. Dites-le dans la description.';
    return '!${base}c’est très peu pour l’âge. Un acheteur y verra un compteur trafiqué : préparez le carnet d’entretien ou la facture qui le prouve.';
  }
  if (m < parAn * 1.35) return '${base}dans la moyenne.';
  if (m < parAn * 2.3) return '${base}usage soutenu, à mentionner dans la description.';
  return '${base}usage intensif. Précisez l’entretien : c’est ce qui rassurera.';
}

/// Motorisation branchée : électrique pur ou hybride rechargeable.
bool _elec(Vals s) => _t(s, 'carburant') == '100 % électrique' || _t(s, 'carburant') == 'Hybride rechargeable';

/// Le dossier administratif — commun aux véhicules immatriculés.
List<Champ> _dossier(String quoi) => [
      Champ('carteGrise', 'Carte grise',
          req: true,
          options: const ['À mon nom', 'Au nom d’un tiers (avec procuration)', 'Mutation en cours', 'Duplicata', 'Pas de carte grise'],
          alerte: Alerte(
            bon: 'À mon nom',
            texteBon: 'La carte grise est au nom du vendeur : la mutation peut se faire directement. Vérifiez que le nom correspond à sa pièce d’identité.',
            texteMauvais: 'La carte grise n’est pas au nom du vendeur. Exigez la procuration légalisée ou le dossier de mutation AVANT de payer — sans cela vous ne pourrez jamais immatriculer $quoi à votre nom.',
          ),
          h: 'Si la carte grise n’est pas à votre nom, l’acheteur exigera la procuration : préparez-la. C’est le premier point de blocage d’une vente.'),
      const Champ('csa', 'CSA (certificat de non-gage)',
          req: true,
          options: ['Je l’ai, à jour', 'Je peux le demander', 'Le véhicule est gagé (crédit en cours)', 'Je ne sais pas'],
          h: 'Le CSA, délivré par la DGTTC, atteste qu’aucune opposition ni gage ne bloque la mutation. Un véhicule acheté à crédit non soldé ne peut pas être vendu.'),
      const Champ('visite', 'Visite technique',
          req: true,
          options: ['Valide plus de 6 mois', 'Valide moins de 6 mois', 'Expirée', 'Véhicule neuf, non concerné']),
      const Champ('papiers', 'Autres pièces à jour',
          multi: true,
          options: ['Vignette', 'Assurance', 'Patente / transport', 'Certificat de cession prêt', 'Facture d’achat', 'Carnet d’entretien'],
          h: 'Le vendeur doit déclarer la cession à la DGTTC sous 15 jours : passé ce délai, les amendes du nouvel usage restent à son nom.'),
    ];

const _modAuto = {
  'Toyota': ['Corolla', 'Yaris', 'RAV4', 'Hilux', 'Avensis', 'Camry', 'Land Cruiser', 'Land Cruiser Prado', 'Carina', 'Starlet', 'Vitz', 'Probox', 'Hiace', 'Coaster', 'Fortuner', 'Highlander', 'C-HR', 'Corolla Cross', 'Auris', 'Verso', 'Rush', 'Aygo', 'Prius (hybride)', 'bZ4X (électrique)', 'Yaris Cross'],
  'Hyundai': ['Tucson', 'Accent', 'Elantra', 'Santa Fe', 'i10', 'Grand i10', 'i20', 'Creta', 'Sonata', 'Getz', 'H1', 'Starex', 'Kona Electric', 'Ioniq 5', 'Ioniq 6'],
  'Kia': ['Rio', 'Picanto', 'Sportage', 'Cerato', 'Sorento', 'Optima', 'Soul', 'Carens', 'Seltos', 'K2700', 'Niro EV', 'EV6', 'EV9', 'Soul EV'],
  'Nissan': ['Micra', 'Sunny', 'Almera', 'Qashqai', 'X-Trail', 'Note', 'Juke', 'Patrol', 'Navara', 'Pathfinder', 'Sentra', 'Leaf (électrique)', 'Ariya'],
  'Peugeot': ['206', '207', '208', '301', '307', '308', '405', '406', 'Partner', '2008', '3008', '508', 'Boxer', 'e-208', 'e-2008', 'e-308'],
  'Suzuki': ['Swift', 'Alto', 'Vitara', 'Grand Vitara', 'Jimny', 'Baleno', 'Ertiga', 'Celerio'],
  'Mercedes-Benz': ['Classe C', 'Classe E', 'Classe A', 'Classe S', 'ML', 'GLC', 'GLE', 'Sprinter', 'Vito', 'Classe B', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS'],
  'Renault': ['Clio', 'Logan', 'Sandero', 'Duster', 'Mégane', 'Kangoo', 'Captur', 'Trafic', 'Symbol', 'Zoe (électrique)', 'Mégane E-Tech', 'Kangoo E-Tech'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Fit', 'HR-V', 'Pilot', 'City'],
  'Mitsubishi': ['Pajero', 'L200', 'Outlander', 'Lancer', 'ASX', 'Canter', 'Montero'],
  'Volkswagen': ['Golf', 'Polo', 'Passat', 'Tiguan', 'Jetta', 'Touareg', 'Transporter', 'Amarok', 'ID.3', 'ID.4', 'ID.6'],
  'Ford': ['Focus', 'Fiesta', 'Ranger', 'Escape', 'Explorer', 'EcoSport', 'Transit'],
  'BMW': ['Série 3', 'Série 5', 'Série 1', 'X1', 'X3', 'X5', 'Série 7', 'X6', 'i3', 'i4', 'iX3', 'iX'],
  'Land Rover': ['Range Rover', 'Range Rover Sport', 'Evoque', 'Discovery', 'Freelander', 'Defender'],
  'Mazda': ['3', '6', 'Demio', 'CX-5', 'CX-3', 'BT-50'],
  'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'e-tron', 'Q4 e-tron'],
  'Isuzu': ['D-Max', 'Trooper', 'NKR', 'NPR'],
  'Chevrolet': ['Aveo', 'Spark', 'Cruze', 'Captiva', 'Optra'],
  'Opel': ['Corsa', 'Astra', 'Zafira', 'Vectra'],
  'Citroën': ['C3', 'C4', 'C-Elysée', 'Berlingo', 'Jumper'],
  'Dacia': ['Logan', 'Sandero', 'Duster', 'Lodgy', 'Spring (électrique)', 'Jogger'],
  'Lexus': ['RX', 'LX', 'GX', 'IS', 'ES'],
  'Jeep': ['Grand Cherokee', 'Cherokee', 'Compass', 'Wrangler'],
  'Chery': ['Tiggo 2', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8', 'QQ', 'eQ (électrique)', 'Omoda 5', 'Omoda E5'],
  'BYD': ['Atto 3', 'Dolphin', 'Seal', 'Seagull', 'Song Plus', 'Yuan Plus', 'Han', 'Tang', 'Qin Plus'],
  'MG': ['MG4', 'MG5', 'MG3', 'ZS', 'ZS EV', 'HS', 'Marvel R'],
  'Tesla': ['Model Y', 'Model 3', 'Model S', 'Model X'],
  'Zeekr': ['7X', '001', 'X'],
  'Ora (Great Wall)': ['03 (Funky Cat)', '07'],
  'Wuling': ['Mini EV', 'Bingo', 'Air EV'],
  'Neta': ['V', 'U', 'X'],
  'Leapmotor': ['T03', 'C10', 'C11'],
  'Geely': ['Coolray', 'Emgrand', 'Okavango', 'Geometry C'],
  'Haval': ['Jolion', 'H6', 'Dargo'],
  'JAC': ['S3', 'S4', 'e-JS4', 'T8'],
  'Seat': ['Ibiza', 'Leon', 'Ateca'],
  'Skoda': ['Fabia', 'Octavia', 'Kodiaq', 'Enyaq'],
  'Fiat': ['Punto', '500', 'Doblo', 'Tipo'],
  'Daihatsu': ['Terios', 'Sirion', 'Gran Max'],
  'Subaru': ['Forester', 'Outback', 'Impreza'],
  'Volvo': ['XC40', 'XC60', 'XC90', 'S60'],
  'Ssangyong': ['Korando', 'Tivoli', 'Rexton'],
  'Autre marque': <String>[],
};

const _modMoto = {
  'Haojue': ['HJ125', 'HJ150', 'Lindy 125', 'DK150', 'TR150', 'KA150'],
  'Apsonic': ['AP125', 'AP150', 'AP200', 'Kingman', 'Tricycle AP200'],
  'Sanili': ['SL125', 'SL150', 'SL200'],
  'Sanya': ['SY125', 'SY150', 'SY110'],
  'TVS': ['Star HLX 125', 'Star HLX 150', 'Apache 160', 'King (tricycle)'],
  'Bajaj': ['Boxer 100', 'Boxer 150', 'CT100', 'Pulsar 150', 'RE (tricycle)'],
  'Yamaha': ['Crux', 'YBR 125', 'Crypton', 'DT 125', 'Mio'],
  'Honda': ['CG 125', 'CB 125', 'Ace 110', 'XR 125', 'Dio'],
  'Suzuki': ['GN125', 'GS150', 'Address'],
  'Kaisar': ['KS125', 'KS150'],
  'KTM': ['Duke 125', 'Duke 200'],
  'Royal Enfield': ['Classic 350', 'Hunter 350'],
  'Autre marque': <String>[],
};

const _modCamion = {
  'Mercedes-Benz': ['Actros', 'Atego', 'Axor', 'Sprinter', 'Unimog', 'Vario'],
  'Isuzu': ['NKR', 'NPR', 'NQR', 'FVR', 'FRR', 'D-Max'],
  'Mitsubishi Fuso': ['Canter', 'Fighter', 'Super Great'],
  'Hino': ['300', '500', '700'],
  'Toyota': ['Dyna', 'Hiace', 'Coaster', 'Land Cruiser pick-up'],
  'Renault Trucks': ['Midlum', 'Premium', 'Kerax', 'Master'],
  'Sinotruk / Howo': ['Howo 371', 'Howo 336', 'Howo benne'],
  'MAN': ['TGA', 'TGS', 'TGX', 'TGL'],
  'Iveco': ['Daily', 'Eurocargo', 'Stralis', 'Trakker'],
  'Scania': ['R420', 'R440', 'P340'],
  'Volvo': ['FH', 'FM', 'FMX'],
  'DAF': ['XF', 'CF', 'LF'],
  'Foton': ['Aumark', 'Ollin'],
  'Dongfeng': ['Captain', 'Duolika'],
  'JAC': ['N56', 'X200'],
  'Autre marque': <String>[],
};

const _typesCamion = ['Benne', 'Fourgon', 'Plateau', 'Citerne', 'Frigorifique', 'Porte-conteneur', 'Tracteur routier', 'Grue / plateau grue', 'Malaxeur (toupie)', 'Pick-up', 'Minibus', 'Autocar', 'Ambulance', 'Dépanneuse', 'Autre'];

const _typesPiece = [
  'Pneus', 'Batterie', 'Jantes', 'Plaquettes / disques de frein', 'Amortisseurs', 'Embrayage',
  'Alternateur', 'Démarreur', 'Radiateur', 'Filtres', 'Huile / lubrifiant', 'Phares / optiques',
  'Pare-brise / vitres', 'Rétroviseur', 'Pare-chocs', 'Capot / aile', 'Moteur complet', 'Boîte de vitesse',
  'Turbo', 'Injecteurs', 'Courroie de distribution', 'Autoradio', 'Sièges / sellerie', 'Climatisation',
  'Échappement', 'Direction / crémaillère', 'Autre pièce'
];

const _typesBateau = ['Pirogue', 'Barque', 'Hors-bord', 'Semi-rigide', 'Vedette', 'Yacht', 'Jet-ski', 'Chalutier', 'Bateau de pêche', 'Autre'];

const _anneesAuto = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010', '2009', '2008', '2007', '2006', '2005', '2004 et avant'];

final Map<String, Schema> vehicules = {
  'Voitures': Schema(
    livraison: false,
    titre: (s) => [_t(s, 'marque') != 'Autre marque' ? _t(s, 'marque') : '', _t(s, 'modele'), _t(s, 'annee')]
        .where((x) => x.isNotEmpty)
        .join(' '),
    champs: [
      Champ('marque', 'Marque', options: _modAuto.keys.toList(), req: true),
      const Champ('modele', 'Modèle',
          dependDe: 'marque', table: _modAuto, req: true, libre: 'Autre modèle',
          h: 'Le modèle exact fait trouver votre annonce : c’est lui que les acheteurs tapent.'),
      const Champ('annee', 'Année de première mise en circulation', req: true, options: _anneesAuto),
      Champ('km', 'Kilométrage au compteur',
          type: TypeChamp.nombre, ph: 'Ex : 120000', req: true, unite: 'km',
          h: (s) {
            final m = _moyenneAnnuelle(_t(s, 'km'), _t(s, 'annee'), 'km', 15000);
            return m.isNotEmpty ? m : 'Indiquez le chiffre exact lu au compteur. Le formulaire vous dira s’il est cohérent avec l’âge du véhicule.';
          }),
      const Champ('kmFiable', 'Ce kilométrage est',
          req: true,
          options: ['Réel, d’origine', 'Compteur remplacé', 'Non garanti — je ne sais pas'],
          h: 'Le dire vous protège autant que l’acheteur : un vice caché se retourne contre le vendeur.'),
      const Champ('carburant', 'Motorisation',
          req: true, options: ['Essence', 'Diesel', 'Hybride', 'Hybride rechargeable', '100 % électrique', 'GPL', 'Flex-fuel']),
      const Champ('autonomie', 'Autonomie annoncée',
          type: TypeChamp.nombre, unite: 'km', ph: 'Ex : 350', req: true,
          h: 'L’autonomie réelle en ville d’Abidjan, climatisation allumée, est toujours inférieure à l’annonce du constructeur. Donnez le chiffre du constructeur, l’acheteur fera la part des choses.',
          when: _elec),
      const Champ('batterieKwh', 'Capacité de la batterie',
          options: ['Moins de 20 kWh', '20 à 40 kWh', '40 à 60 kWh', '60 à 80 kWh', 'Plus de 80 kWh'],
          when: _elec),
      const Champ('santeBat', 'Santé de la batterie (SoH)',
          req: true,
          options: ['Neuve — 100 %', 'Plus de 90 %', '80 à 90 %', '70 à 80 %', 'Moins de 70 %', 'Batterie remplacée', 'Je ne sais pas'],
          alerte: Alerte(
            bon: 'Plus de 90 %',
            texteBon: 'Le vendeur déclare une batterie en bon état. Faites-la contrôler : sur une électrique d’occasion, la batterie EST la valeur du véhicule.',
            texteMauvais: 'Sur une voiture électrique, la batterie représente une grande part du prix. Exigez un rapport de santé (SoH) avant de payer — son remplacement se chiffre en millions.',
          ),
          h: 'Le SoH s’affiche dans le menu du véhicule ou se lit avec un boîtier de diagnostic. C’est le chiffre que tout acheteur averti demandera.',
          when: _elec),
      const Champ('charge', 'Recharge possible',
          multi: true,
          options: ['Prise domestique 220 V', 'Borne murale (wallbox)', 'Charge rapide DC', 'Charge triphasée 380 V'],
          h: 'La CIE distribue du 220 V monophasé chez les particuliers : une recharge à la maison est lente. Les bornes rapides d’Abidjan et Yamoussoukro font 20 à 80 % en moins de 30 minutes.',
          when: _elec),
      const Champ('cables', 'Câbles fournis',
          multi: true,
          options: ['Câble domestique', 'Câble Type 2', 'Adaptateur', 'Aucun'],
          when: _elec),
      Champ('boite', 'Boîte de vitesse',
          options: const ['Manuelle', 'Automatique'], req: true,
          when: (s) => _t(s, 'carburant') != '100 % électrique'),
      Champ('cv', 'Puissance fiscale',
          options: const ['4 CV et moins', '5 CV', '6 CV', '7 CV', '8 CV', '9 CV', '10 CV', '11 CV', '12 CV', '13 CV et plus'],
          h: 'Figure sur la carte grise. Elle détermine la vignette — et au-delà de 13 CV, les droits d’accise à l’import.',
          when: (s) => _t(s, 'carburant') != '100 % électrique'),
      const Champ('carrosserie', 'Type de carrosserie',
          req: true,
          options: [
            'Berline', 'Citadine', '4x4 / SUV', 'Break', 'Monospace', 'Pick-up', 'Coupé', 'Cabriolet', 'Utilitaire / fourgonnette',
            'Minibus', 'Limousine', 'Voiture de collection', 'Véhicule sans permis', 'Buggy', 'Corbillard', 'Ambulance', 'Taxi (véhicule)'
          ]),
      const Champ('places', 'Places', options: ['2', '4', '5', '7', '9 et plus']),
      const Champ('provenance', 'Provenance',
          req: true,
          options: ['Neuve, concession Côte d’Ivoire', 'Occasion Côte d’Ivoire', 'Importée d’Europe', 'Importée du Japon', 'Importée de Dubaï', 'Importée des États-Unis'],
          h: 'Une voiture particulière ne peut être importée que si elle a moins de 5 ans à la première mise en circulation.'),
      const Champ('sinistre', 'Historique d’accident',
          req: true,
          options: ['Jamais accidentée', 'Choc léger réparé', 'Choc important réparé', 'Accidentée, à réparer'],
          h: 'L’« arnaque à l’épave » — un véhicule pour la casse remis en état de paraître — se découvre toujours. Autant le dire.'),
      const Champ('equipements', 'Équipements',
          multi: true,
          options: ['Climatisation', 'Direction assistée', 'Vitres électriques', 'Caméra de recul', 'Écran tactile', 'GPS', 'Sièges cuir', 'Toit ouvrant', 'Jantes alliage', 'Régulateur', 'ABS', 'Airbags', 'Radar de recul', 'Démarrage sans clé', 'Apple CarPlay / Android Auto', 'Sièges chauffants']),
      const Champ('entretien', 'Dernier entretien', options: ['Moins de 3 mois', '3 à 6 mois', '6 à 12 mois', 'Plus d’un an', 'Je ne sais pas']),
      ..._dossier('la voiture'),
    ],
  ),
  'Motos & Scooters': Schema(
    livraison: false,
    titre: (s) => [_t(s, 'marque') != 'Autre marque' ? _t(s, 'marque') : '', _t(s, 'modele'), _t(s, 'cylindree')]
        .where((x) => x.isNotEmpty)
        .join(' '),
    champs: [
      const Champ('typeMoto', 'Type',
          req: true,
          options: ['Moto', 'Scooter', 'Tricycle (« taxi-moto »)', 'Moto-cross', 'Vélomoteur', 'Moto électrique', 'Scooter électrique', 'Quad', 'Karting', 'Vélo électrique', 'Trottinette électrique']),
      Champ('marque', 'Marque', options: _modMoto.keys.toList(), req: true),
      const Champ('modele', 'Modèle', dependDe: 'marque', table: _modMoto, req: true, libre: 'Autre modèle'),
      Champ('cylindree', 'Cylindrée',
          req: true,
          options: const ['50 cm³', '100 cm³', '110 cm³', '125 cm³', '150 cm³', '200 cm³', '250 cm³', '400 cm³ et plus', 'Électrique'],
          when: (s) => !RegExp('électrique', caseSensitive: false).hasMatch(_t(s, 'typeMoto'))),
      Champ('autonomieMoto', 'Autonomie annoncée',
          type: TypeChamp.nombre, unite: 'km', ph: 'Ex : 80', req: true,
          when: (s) => RegExp('électrique', caseSensitive: false).hasMatch(_t(s, 'typeMoto'))),
      Champ('batterieMoto', 'Batterie',
          options: const ['Amovible', 'Fixe', 'Deux batteries'],
          h: 'Une batterie amovible se recharge à l’étage, sans rallonge dans la cour. C’est un argument de vente.',
          when: (s) => RegExp('électrique', caseSensitive: false).hasMatch(_t(s, 'typeMoto'))),
      const Champ('annee', 'Année', req: true, options: ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015 et avant']),
      Champ('km', 'Kilométrage au compteur',
          type: TypeChamp.nombre, ph: 'Ex : 15000', req: true, unite: 'km',
          h: (s) {
            final m = _moyenneAnnuelle(_t(s, 'km'), _t(s, 'annee'), 'km', 12000);
            return m.isNotEmpty ? m : 'Le chiffre exact lu au compteur. Une moto de taxi fait bien plus qu’une moto personnelle.';
          }),
      const Champ('demarrage', 'Démarrage', options: ['Électrique', 'Kick', 'Les deux']),
      const Champ('provenance', 'Provenance', req: true, options: ['Neuve, concession', 'Occasion Côte d’Ivoire', 'Importée']),
      const Champ('sinistre', 'Historique d’accident', req: true, options: ['Jamais accidentée', 'Choc léger réparé', 'Choc important réparé', 'Accidentée, à réparer']),
      const Champ('usage', 'Usage', options: ['Personnel', 'Taxi-moto', 'Livraison', 'Peu servi']),
      const Champ('equipements', 'Fournis avec', multi: true, options: ['Casque', 'Deux casques', 'Antivol', 'Top-case', 'Housse', 'Jeu d’outils']),
      ..._dossier('la moto'),
    ],
  ),
  'Camions & Utilitaires': Schema(
    livraison: false,
    titre: (s) => [_t(s, 'marque') != 'Autre marque' ? _t(s, 'marque') : '', _t(s, 'modele'), _t(s, 'typeCamion')]
        .where((x) => x.isNotEmpty)
        .join(' '),
    champs: [
      const Champ('typeCamion', 'Type de véhicule', options: _typesCamion, req: true),
      Champ('marque', 'Marque', options: _modCamion.keys.toList(), req: true),
      const Champ('modele', 'Modèle', dependDe: 'marque', table: _modCamion, req: true, libre: 'Autre modèle'),
      const Champ('annee', 'Année', req: true, options: ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010 et avant']),
      const Champ('charge', 'Charge utile', req: true, options: ['Moins de 1 t', '1 à 3 t', '3 à 5 t', '5 à 10 t', '10 à 20 t', 'Plus de 20 t']),
      const Champ('essieux', 'Configuration', options: ['4x2', '4x4', '6x2', '6x4', '8x4', 'Semi-remorque']),
      Champ('km', 'Kilométrage au compteur',
          type: TypeChamp.nombre, ph: 'Ex : 250000', req: true, unite: 'km',
          h: (s) {
            final m = _moyenneAnnuelle(_t(s, 'km'), _t(s, 'annee'), 'km', 40000);
            return m.isNotEmpty ? m : 'Le chiffre exact lu au compteur. Sur un poids lourd, un acheteur compare toujours au nombre d’années.';
          }),
      const Champ('carburant', 'Carburant', options: ['Diesel', 'Essence'], req: true),
      const Champ('provenance', 'Provenance', req: true, options: ['Neuf, concession', 'Occasion Côte d’Ivoire', 'Importé d’Europe', 'Importé du Japon', 'Importé de Dubaï']),
      const Champ('sinistre', 'État mécanique', req: true, options: ['Roulant, bon état', 'Roulant, entretien à prévoir', 'En panne', 'Pour pièces']),
      const Champ('usage', 'Usage précédent', options: ['Transport de marchandises', 'BTP / carrière', 'Transport de personnes', 'Agricole', 'Peu servi']),
      ..._dossier('le véhicule'),
    ],
  ),
  'Engins & Agricoles': Schema(
    livraison: false,
    titre: (s) => [_t(s, 'typeEngin'), _t(s, 'marqueEngin'), _t(s, 'anneeEngin')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeEngin', 'Type d’engin',
          req: true,
          options: [
            'Tracteur agricole', 'Pelleteuse / excavatrice', 'Chargeuse', 'Bulldozer', 'Niveleuse', 'Compacteur / rouleau',
            'Chariot élévateur', 'Nacelle', 'Bétonnière', 'Motoculteur', 'Moissonneuse', 'Groupe électrogène',
            'Remorque', 'Semi-remorque', 'Citerne remorquée', 'Karting / quad utilitaire', 'Autre engin'
          ]),
      const Champ('marqueEngin', 'Marque',
          req: true,
          options: [
            'John Deere', 'Massey Ferguson', 'New Holland', 'Caterpillar', 'Komatsu', 'JCB', 'Hitachi', 'Kubota',
            'Sonalika', 'Mahindra', 'Doosan', 'Liebherr', 'Hyundai', 'SDLG', 'XCMG', 'Toyota (chariot)', 'Autre marque'
          ]),
      const Champ('modeleEngin', 'Modèle', ph: 'Ex : 5075E, 320D, 3CX'),
      const Champ('anneeEngin', 'Année', options: ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010 et avant']),
      Champ('heures', 'Heures de fonctionnement',
          type: TypeChamp.nombre, unite: 'h', ph: 'Ex : 4500', req: true,
          h: (s) {
            final m = _moyenneAnnuelle(_t(s, 'heures'), _t(s, 'anneeEngin'), 'heures', 800);
            return m.isNotEmpty ? m : 'Sur un engin, l’heure compte plus que le kilomètre. C’est le premier chiffre que demande un acheteur professionnel.';
          }),
      Champ('kmEngin', 'Kilométrage au compteur',
          type: TypeChamp.nombre, unite: 'km', ph: 'Ex : 60000',
          h: (s) {
            final m = _moyenneAnnuelle(_t(s, 'kmEngin'), _t(s, 'anneeEngin'), 'km', 10000);
            return m.isNotEmpty ? m : 'Si l’engin roule sur route (tracteur, chariot, remorque). Laissez vide pour un engin qui ne se déplace pas seul.';
          }),
      const Champ('puissanceEngin', 'Puissance', options: ['Moins de 50 ch', '50 à 100 ch', '100 à 150 ch', '150 à 250 ch', 'Plus de 250 ch']),
      const Champ('etatEngin', 'État de marche', req: true, options: ['En état de marche', 'Entretien à prévoir', 'En panne', 'Pour pièces']),
      const Champ('provenanceEngin', 'Provenance', req: true, options: ['Neuf, concessionnaire', 'Occasion Côte d’Ivoire', 'Importé d’Europe', 'Importé du Japon', 'Importé de Chine']),
      const Champ('papiersEngin', 'Documents',
          multi: true, req: true,
          options: ['Facture d’achat', 'Carte grise (si immatriculé)', 'Carnet d’entretien', 'Manuel d’utilisation', 'Aucun'],
          h: 'Un engin non immatriculé se vend sur facture. Sans aucun papier, l’acheteur ne peut ni l’assurer ni le revendre.'),
      const Champ('accessoiresEngin', 'Équipements fournis', multi: true, options: ['Godet', 'Fourches', 'Charrue', 'Remorque', 'Lame', 'Marteau hydraulique', 'Jeu de pièces']),
    ],
  ),
  'Pièces & Accessoires': Schema(
    livraison: true,
    titre: (s) => [_t(s, 'typePiece'), _t(s, 'compatible')].where((x) => x.isNotEmpty).join(' — '),
    champs: [
      const Champ('typePiece', 'Type de pièce', options: _typesPiece, req: true),
      const Champ('compatible', 'Compatible avec',
          req: true, ph: 'Ex : Toyota Corolla 2010-2015, universel',
          h: 'La première question de l’acheteur. Une pièce « universelle » qui ne l’est pas fait un retour et un litige.'),
      const Champ('etatPiece', 'État de la pièce',
          req: true,
          options: ['Neuve, d’origine (OEM)', 'Neuve, adaptable', 'Occasion, bon état', 'Reconditionnée', 'Pour pièces'],
          h: '« Adaptable » n’est pas « d’origine ». Le préciser évite la moitié des disputes.'),
      const Champ('reference', 'Référence constructeur', ph: 'Ex : 90915-YZZD4 (facultatif)',
          h: 'La référence exacte rassure et fait remonter votre annonce dans la recherche.'),
      const Champ('quantite', 'Quantité disponible', type: TypeChamp.nombre, ph: 'Ex : 4'),
      const Champ('garantiePiece', 'Garantie', options: ['Aucune', '7 jours', '1 mois', '3 mois', '6 mois', '1 an']),
    ],
  ),
  'Bateaux': Schema(
    livraison: false,
    titre: (s) => [_t(s, 'typeBateau'), _t(s, 'longueur'), _t(s, 'annee')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeBateau', 'Type', options: _typesBateau, req: true),
      const Champ('longueur', 'Longueur', options: ['Moins de 4 m', '4 à 6 m', '6 à 8 m', '8 à 12 m', '12 à 18 m', 'Plus de 18 m'], req: true),
      const Champ('coque', 'Coque', options: ['Bois', 'Fibre de verre', 'Aluminium', 'Acier', 'Pneumatique'], req: true),
      const Champ('moteurBat', 'Motorisation', options: ['Sans moteur', 'Hors-bord', 'In-board', 'Deux moteurs'], req: true),
      Champ('puissanceBat', 'Puissance moteur',
          options: const ['Moins de 15 ch', '15 à 40 ch', '40 à 100 ch', '100 à 200 ch', 'Plus de 200 ch'],
          when: (s) => _t(s, 'moteurBat').isNotEmpty && _t(s, 'moteurBat') != 'Sans moteur'),
      const Champ('annee', 'Année', req: true, options: ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015 et avant']),
      Champ('heuresBat', 'Heures moteur',
          type: TypeChamp.nombre, unite: 'h', ph: 'Ex : 900',
          h: (s) {
            final m = _moyenneAnnuelle(_t(s, 'heuresBat'), _t(s, 'annee'), 'heures', 150);
            return m.isNotEmpty ? m : 'L’équivalent du kilométrage pour un bateau. C’est ce qui dit l’usure réelle du moteur.';
          },
          when: (s) => _t(s, 'moteurBat').isNotEmpty && _t(s, 'moteurBat') != 'Sans moteur'),
      const Champ('immat', 'Immatriculation / titre de navigation',
          req: true,
          options: ['En règle, à mon nom', 'En règle, à un autre nom', 'Non immatriculé', 'Je ne sais pas'],
          alerte: Alerte(
            bon: 'En règle, à mon nom',
            texteBon: 'Le titre de navigation est au nom du vendeur : le transfert est possible.',
            texteMauvais: 'Le titre n’est pas au nom du vendeur, ou n’existe pas. Vérifiez auprès des Affaires maritimes avant de payer.',
          )),
      const Champ('equipBat', 'Équipements', multi: true, options: ['Gilets de sauvetage', 'GPS / sondeur', 'Remorque', 'Bâche', 'Ancre', 'Réservoir supplémentaire', 'Filets de pêche']),
    ],
  ),
  'Location': Schema(
    etat: false,
    prixLabel: 'Tarif par jour',
    titre: (s) {
      final t = [_t(s, 'typeLoc'), _t(s, 'marqueLoc')].where((x) => x.isNotEmpty).join(' ');
      return t.isNotEmpty ? 'Location $t' : 'Location de véhicule';
    },
    champs: [
      const Champ('typeLoc', 'Type de véhicule',
          req: true,
          options: ['Berline', 'Citadine', '4x4 / SUV', 'Minibus', 'Bus', 'Camion', 'Utilitaire', 'Moto', 'Voiture avec chauffeur', 'Véhicule de mariage']),
      Champ('marqueLoc', 'Marque', options: _modAuto.keys.toList()),
      const Champ('chauffeur', 'Avec chauffeur', req: true, options: ['Avec chauffeur', 'Sans chauffeur', 'Au choix du client']),
      const Champ('duree', 'Durées proposées', multi: true, req: true, options: ['À l’heure', 'À la journée', 'Au week-end', 'À la semaine', 'Au mois', 'Longue durée']),
      const Champ('kmInclus', 'Kilométrage inclus', options: ['Illimité', '100 km/jour', '200 km/jour', '300 km/jour', 'Sur devis']),
      const Champ('caution', 'Caution demandée', type: TypeChamp.nombre, ph: 'Ex : 200000', unite: 'FCFA',
          h: 'L’annoncer évite la mauvaise surprise au comptoir — et les avis fâchés qui suivent.'),
      const Champ('carburantLoc', 'Carburant', options: ['À la charge du client', 'Plein à plein', 'Inclus']),
      const Champ('zone', 'Zone couverte', ph: 'Ex : Abidjan et intérieur du pays'),
      const Champ('exigences', 'Conditions', multi: true, options: ['Permis depuis 2 ans', 'Pièce d’identité', 'Âge minimum 25 ans', 'Contrat signé', 'Paiement d’avance']),
      const Champ('assuranceLoc', 'Assurance',
          req: true,
          options: ['Tous risques incluse', 'Au tiers incluse', 'À la charge du client'],
          alerte: Alerte(
            bon: 'Tous risques incluse',
            texteBon: 'Le loueur déclare une assurance tous risques incluse. Demandez l’attestation avant de partir.',
            texteMauvais: 'Vérifiez précisément ce que couvre l’assurance : en cas d’accident, la différence se chiffre en millions.',
          )),
    ],
  ),
};
