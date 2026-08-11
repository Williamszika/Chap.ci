// =============================================================================
//  Coordonnées GPS approximatives des villes et communes de Côte d'Ivoire —
//  port fidèle de src/data/coords.ts.
//
//  Servent de position par défaut d'une annonce quand le vendeur n'active pas
//  son GPS, afin de calculer une distance indicative sur la fiche.
// =============================================================================
library;

/// Un point GPS.
class Coords {
  final double lat;
  final double lng;
  const Coords(this.lat, this.lng);
}

/// Communes du District Autonome d'Abidjan.
const Map<String, Coords> communeCoords = {
  'Abobo': Coords(5.4165, -4.0159),
  'Adjamé': Coords(5.3646, -4.0227),
  'Anyama': Coords(5.4949, -4.0517),
  'Attécoubé': Coords(5.3333, -4.0333),
  'Bingerville': Coords(5.3556, -3.8869),
  'Cocody': Coords(5.3599, -3.9877),
  'Koumassi': Coords(5.2953, -3.9469),
  'Marcory': Coords(5.3, -3.9833),
  'Le Plateau': Coords(5.3242, -4.0189),
  'Port-Bouët': Coords(5.2558, -3.9269),
  'Songon': Coords(5.2917, -4.2528),
  'Treichville': Coords(5.2917, -4.0083),
  'Yopougon': Coords(5.3456, -4.0708),
};

/// Villes (par identifiant de ville).
const Map<String, Coords> cityCoords = {
  'abidjan-ville': Coords(5.3599, -4.0083),
  'yamoussoukro-ville': Coords(6.8276, -5.2893),
  'bouake': Coords(7.6939, -5.0303),
  'daloa': Coords(6.8776, -6.4502),
  'san-pedro-ville': Coords(4.7485, -6.6363),
  'korhogo': Coords(9.4578, -5.6294),
  'man': Coords(7.4125, -7.5538),
  'gagnoa': Coords(6.1319, -5.9506),
  'divo': Coords(5.8397, -5.3572),
  'abengourou': Coords(6.7297, -3.4964),
  'grand-bassam': Coords(5.2118, -3.7386),
  'bonoua': Coords(5.2725, -3.5964),
  'aboisso': Coords(5.4676, -3.2072),
  'agboville': Coords(5.9282, -4.2131),
  'dabou': Coords(5.3256, -4.3767),
  'adzope': Coords(6.1069, -3.8619),
  'seguela': Coords(7.9611, -6.6731),
  'odienne': Coords(9.5, -7.5667),
  'bondoukou': Coords(8.0402, -2.8),
  'ferkessedougou': Coords(9.5928, -5.1944),
  'soubre': Coords(5.7836, -6.5936),
  'toumodi': Coords(6.5528, -5.0189),
  'katiola': Coords(8.1333, -5.1),
  'bouafle': Coords(6.99, -5.7444),
  'issia': Coords(6.4922, -6.5872),
  'duekoue': Coords(6.7419, -7.3436),
  'guiglo': Coords(6.5439, -7.4869),
  'daoukro': Coords(7.0586, -3.9631),
  'dimbokro': Coords(6.6486, -4.7061),
  'boundiali': Coords(9.5217, -6.4869),
  'mankono': Coords(8.0586, -6.1897),
  'touba': Coords(8.2833, -7.6833),
  'bouna': Coords(9.2667, -3.0),
  'tabou': Coords(4.4231, -7.3528),
  'danane': Coords(7.2597, -8.155),
  'sinfra': Coords(6.6197, -5.9161),
  'lakota': Coords(5.8481, -5.6786),
  'bongouanou': Coords(6.6511, -4.2039),
  'minignan': Coords(10.0, -7.7333),
  'grand-lahou': Coords(5.1386, -5.0203),
  'sassandra': Coords(4.9503, -6.0836),
  'fresco': Coords(5.0939, -5.5658),
  'meagui': Coords(5.8833, -6.5333),
};

/// Les coordonnées approximatives d'une commune, sinon d'une ville, sinon null.
Coords? coordsFor(String? cityId, [String? commune]) {
  if (commune != null && communeCoords.containsKey(commune)) {
    return communeCoords[commune];
  }
  if (cityId != null && cityCoords.containsKey(cityId)) {
    return cityCoords[cityId];
  }
  return null;
}
