// =============================================================================
//  Les pays hors Côte d'Ivoire (07/09/2026) — port fidèle de src/data/pays.ts.
//
//  Le Patron : « permettre aux gens d'autres pays de créer leur compte, tu mets
//  leur ville et leur pays, dans la catégorie Autres pays ». Le modèle de
//  l'application est Région → Ville → Commune ; on n'y touche pas. Un pays est
//  une « ville » de la région `autres-pays`, et la ville réelle de la personne
//  s'écrit en clair dans `commune`. Ainsi les libellés, les annonces et les
//  filtres fonctionnent sans une colonne de plus : locationLabel('autres-pays',
//  'pays-sn', 'Dakar') donne « Dakar, Sénégal ».
//
//  MÊMES codes et MÊMES noms que src/data/pays.ts — c'est sous ces codes que
//  les comptes s'enregistrent. Ne les renommez jamais.
// =============================================================================
library;

import 'locations.dart';

/// Un pays : code ISO 3166-1 alpha-2 en majuscules, nom français, zone.
class Pays {
  final String code;
  final String nom;
  final String zone;
  const Pays(this.code, this.nom, this.zone);
}

const String regionAutresPays = 'autres-pays';

const List<String> zones = [
  'Afrique de l’Ouest',
  'Afrique centrale',
  'Afrique du Nord',
  'Reste de l’Afrique',
  'Europe',
  'Amériques',
  'Asie & Moyen-Orient',
  'Océanie',
  'Autre',
];

const List<Pays> pays = [
  // Afrique de l'Ouest — les voisins d'abord, c'est là que vit la diaspora.
  Pays('SN', 'Sénégal', 'Afrique de l’Ouest'),
  Pays('ML', 'Mali', 'Afrique de l’Ouest'),
  Pays('BF', 'Burkina Faso', 'Afrique de l’Ouest'),
  Pays('GN', 'Guinée', 'Afrique de l’Ouest'),
  Pays('GH', 'Ghana', 'Afrique de l’Ouest'),
  Pays('TG', 'Togo', 'Afrique de l’Ouest'),
  Pays('BJ', 'Bénin', 'Afrique de l’Ouest'),
  Pays('NE', 'Niger', 'Afrique de l’Ouest'),
  Pays('NG', 'Nigeria', 'Afrique de l’Ouest'),
  Pays('LR', 'Liberia', 'Afrique de l’Ouest'),
  Pays('SL', 'Sierra Leone', 'Afrique de l’Ouest'),
  Pays('GM', 'Gambie', 'Afrique de l’Ouest'),
  Pays('GW', 'Guinée-Bissau', 'Afrique de l’Ouest'),
  Pays('CV', 'Cap-Vert', 'Afrique de l’Ouest'),
  Pays('MR', 'Mauritanie', 'Afrique de l’Ouest'),
  // Afrique centrale
  Pays('CM', 'Cameroun', 'Afrique centrale'),
  Pays('GA', 'Gabon', 'Afrique centrale'),
  Pays('CG', 'Congo', 'Afrique centrale'),
  Pays('CD', 'RD Congo', 'Afrique centrale'),
  Pays('TD', 'Tchad', 'Afrique centrale'),
  Pays('CF', 'Centrafrique', 'Afrique centrale'),
  Pays('GQ', 'Guinée équatoriale', 'Afrique centrale'),
  Pays('ST', 'São Tomé-et-Príncipe', 'Afrique centrale'),
  Pays('AO', 'Angola', 'Afrique centrale'),
  Pays('RW', 'Rwanda', 'Afrique centrale'),
  Pays('BI', 'Burundi', 'Afrique centrale'),
  // Afrique du Nord
  Pays('MA', 'Maroc', 'Afrique du Nord'),
  Pays('DZ', 'Algérie', 'Afrique du Nord'),
  Pays('TN', 'Tunisie', 'Afrique du Nord'),
  Pays('LY', 'Libye', 'Afrique du Nord'),
  Pays('EG', 'Égypte', 'Afrique du Nord'),
  Pays('SD', 'Soudan', 'Afrique du Nord'),
  // Reste de l'Afrique
  Pays('ZA', 'Afrique du Sud', 'Reste de l’Afrique'),
  Pays('KE', 'Kenya', 'Reste de l’Afrique'),
  Pays('ET', 'Éthiopie', 'Reste de l’Afrique'),
  Pays('TZ', 'Tanzanie', 'Reste de l’Afrique'),
  Pays('UG', 'Ouganda', 'Reste de l’Afrique'),
  Pays('MG', 'Madagascar', 'Reste de l’Afrique'),
  Pays('MZ', 'Mozambique', 'Reste de l’Afrique'),
  Pays('ZM', 'Zambie', 'Reste de l’Afrique'),
  Pays('ZW', 'Zimbabwe', 'Reste de l’Afrique'),
  Pays('BW', 'Botswana', 'Reste de l’Afrique'),
  Pays('NA', 'Namibie', 'Reste de l’Afrique'),
  Pays('DJ', 'Djibouti', 'Reste de l’Afrique'),
  Pays('ER', 'Érythrée', 'Reste de l’Afrique'),
  Pays('SO', 'Somalie', 'Reste de l’Afrique'),
  Pays('SS', 'Soudan du Sud', 'Reste de l’Afrique'),
  Pays('MW', 'Malawi', 'Reste de l’Afrique'),
  Pays('LS', 'Lesotho', 'Reste de l’Afrique'),
  Pays('SZ', 'Eswatini', 'Reste de l’Afrique'),
  Pays('KM', 'Comores', 'Reste de l’Afrique'),
  Pays('MU', 'Maurice', 'Reste de l’Afrique'),
  Pays('SC', 'Seychelles', 'Reste de l’Afrique'),
  // Europe
  Pays('FR', 'France', 'Europe'),
  Pays('BE', 'Belgique', 'Europe'),
  Pays('CH', 'Suisse', 'Europe'),
  Pays('DE', 'Allemagne', 'Europe'),
  Pays('IT', 'Italie', 'Europe'),
  Pays('ES', 'Espagne', 'Europe'),
  Pays('GB', 'Royaume-Uni', 'Europe'),
  Pays('NL', 'Pays-Bas', 'Europe'),
  Pays('PT', 'Portugal', 'Europe'),
  Pays('LU', 'Luxembourg', 'Europe'),
  Pays('AT', 'Autriche', 'Europe'),
  Pays('SE', 'Suède', 'Europe'),
  Pays('NO', 'Norvège', 'Europe'),
  Pays('DK', 'Danemark', 'Europe'),
  Pays('FI', 'Finlande', 'Europe'),
  Pays('IE', 'Irlande', 'Europe'),
  Pays('PL', 'Pologne', 'Europe'),
  Pays('CZ', 'Tchéquie', 'Europe'),
  Pays('GR', 'Grèce', 'Europe'),
  Pays('RO', 'Roumanie', 'Europe'),
  Pays('HU', 'Hongrie', 'Europe'),
  Pays('UA', 'Ukraine', 'Europe'),
  Pays('RU', 'Russie', 'Europe'),
  Pays('TR', 'Turquie', 'Europe'),
  // Amériques
  Pays('US', 'États-Unis', 'Amériques'),
  Pays('CA', 'Canada', 'Amériques'),
  Pays('BR', 'Brésil', 'Amériques'),
  Pays('MX', 'Mexique', 'Amériques'),
  Pays('AR', 'Argentine', 'Amériques'),
  Pays('CO', 'Colombie', 'Amériques'),
  Pays('CL', 'Chili', 'Amériques'),
  Pays('PE', 'Pérou', 'Amériques'),
  Pays('HT', 'Haïti', 'Amériques'),
  Pays('CU', 'Cuba', 'Amériques'),
  Pays('DO', 'République dominicaine', 'Amériques'),
  Pays('JM', 'Jamaïque', 'Amériques'),
  Pays('VE', 'Venezuela', 'Amériques'),
  Pays('GF', 'Guyane', 'Amériques'),
  // Asie & Moyen-Orient
  Pays('CN', 'Chine', 'Asie & Moyen-Orient'),
  Pays('IN', 'Inde', 'Asie & Moyen-Orient'),
  Pays('JP', 'Japon', 'Asie & Moyen-Orient'),
  Pays('KR', 'Corée du Sud', 'Asie & Moyen-Orient'),
  Pays('AE', 'Émirats arabes unis', 'Asie & Moyen-Orient'),
  Pays('SA', 'Arabie saoudite', 'Asie & Moyen-Orient'),
  Pays('QA', 'Qatar', 'Asie & Moyen-Orient'),
  Pays('KW', 'Koweït', 'Asie & Moyen-Orient'),
  Pays('OM', 'Oman', 'Asie & Moyen-Orient'),
  Pays('BH', 'Bahreïn', 'Asie & Moyen-Orient'),
  Pays('LB', 'Liban', 'Asie & Moyen-Orient'),
  Pays('JO', 'Jordanie', 'Asie & Moyen-Orient'),
  Pays('IL', 'Israël', 'Asie & Moyen-Orient'),
  Pays('IQ', 'Irak', 'Asie & Moyen-Orient'),
  Pays('IR', 'Iran', 'Asie & Moyen-Orient'),
  Pays('PK', 'Pakistan', 'Asie & Moyen-Orient'),
  Pays('BD', 'Bangladesh', 'Asie & Moyen-Orient'),
  Pays('ID', 'Indonésie', 'Asie & Moyen-Orient'),
  Pays('MY', 'Malaisie', 'Asie & Moyen-Orient'),
  Pays('TH', 'Thaïlande', 'Asie & Moyen-Orient'),
  Pays('VN', 'Vietnam', 'Asie & Moyen-Orient'),
  Pays('PH', 'Philippines', 'Asie & Moyen-Orient'),
  Pays('SG', 'Singapour', 'Asie & Moyen-Orient'),
  // Océanie
  Pays('AU', 'Australie', 'Océanie'),
  Pays('NZ', 'Nouvelle-Zélande', 'Océanie'),
  // Et tout le reste.
  Pays('ZZ', 'Autre pays', 'Autre'),
];

/// « pays-sn » — l'identifiant de « ville » sous lequel un pays s'enregistre.
String idPays(String code) => 'pays-${code.toLowerCase()}';

/// « pays-sn » → « SN » ; autre chose → null.
String? codePays(String? cityId) => cityId != null && cityId.startsWith('pays-')
    ? cityId.substring(5).toUpperCase()
    : null;

Pays? paysParCode(String? code) {
  final c = (code ?? '').toUpperCase();
  for (final p in pays) {
    if (p.code == c) return p;
  }
  return null;
}

Pays? paysParId(String? cityId) => paysParCode(codePays(cityId));

bool estAutresPays(String? regionId) => regionId == regionAutresPays;

/// Les pays, tels que locations.dart les range parmi les villes.
List<City> paysCommeVilles() =>
    [for (final p in pays) City(idPays(p.code), p.nom, regionAutresPays)];

/// Le drapeau du pays en emoji — « 🇸🇳 » pour SN, un globe pour l'inconnu.
String drapeau(String? code) {
  final c = (code ?? '').toUpperCase();
  if (!RegExp(r'^[A-Z]{2}$').hasMatch(c) || c == 'ZZ') return '🌍';
  return String.fromCharCodes(
      [for (final u in c.codeUnits) 0x1F1E6 + u - 0x41]);
}

/// Un lieu hors Côte d'Ivoire à partir de ce que la géolocalisation a dit —
/// le code du pays et le nom de la ville. Null en Côte d'Ivoire ou sans pays.
Lieu? lieuHorsCi(String? code, String? ville) {
  final c = (code ?? '').toUpperCase();
  if (c.isEmpty || c == 'CI') return null;
  final connu = paysParCode(c) != null ? c : 'ZZ';
  final v = (ville ?? '').trim();
  return Lieu(
      regionId: regionAutresPays,
      cityId: idPays(connu),
      commune: v.isEmpty ? null : v);
}
