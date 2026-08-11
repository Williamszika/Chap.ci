// =============================================================================
//  Le découpage administratif de la Côte d'Ivoire — port fidèle de
//  src/data/locations.ts.
//
//  Le pays compte 14 districts (dont 2 districts autonomes : Abidjan et
//  Yamoussoukro), 31 régions et de nombreuses communes.
//
//  Modèle utilisé dans Chap.ci :
//      District (champ `district`) → Région → Ville → Commune
//
//  Seule Abidjan (ville) porte des communes ; ailleurs, la ville suffit.
//  Les identifiants (`id`) sont ceux du site : c'est sous eux que les annonces
//  sont enregistrées. Ne les renommez jamais.
// =============================================================================
library;

/// Une région (ou district autonome traité comme région).
class Region {
  final String id;
  final String name;
  final String district;
  final String chefLieu;
  const Region(this.id, this.name, this.district, this.chefLieu);
}

/// Une ville. `communes` n'est renseigné que pour Abidjan.
class City {
  final String id;
  final String name;
  final String regionId;
  final List<String>? communes;
  const City(this.id, this.name, this.regionId, {this.communes});
}

/// Le résultat d'un choix de lieu : région / ville / commune (tout facultatif).
class Lieu {
  final String? regionId;
  final String? cityId;
  final String? commune;
  const Lieu({this.regionId, this.cityId, this.commune});

  bool get estVide => regionId == null && cityId == null && commune == null;
}

const List<Region> regions = [
  // — Districts autonomes —
  Region('abidjan', 'Abidjan', 'District Autonome d’Abidjan', 'Abidjan'),
  Region('yamoussoukro', 'Yamoussoukro', 'District Autonome de Yamoussoukro', 'Yamoussoukro'),

  // — District du Bas-Sassandra —
  Region('gbokle', 'Gbôklé', 'Bas-Sassandra', 'Sassandra'),
  Region('nawa', 'Nawa', 'Bas-Sassandra', 'Soubré'),
  Region('san-pedro', 'San-Pédro', 'Bas-Sassandra', 'San-Pédro'),

  // — District de la Comoé —
  Region('indenie-djuablin', 'Indénié-Djuablin', 'Comoé', 'Abengourou'),
  Region('sud-comoe', 'Sud-Comoé', 'Comoé', 'Aboisso'),

  // — District du Denguélé —
  Region('folon', 'Folon', 'Denguélé', 'Minignan'),
  Region('kabadougou', 'Kabadougou', 'Denguélé', 'Odienné'),

  // — District du Gôh-Djiboua —
  Region('goh', 'Gôh', 'Gôh-Djiboua', 'Gagnoa'),
  Region('loh-djiboua', 'Lôh-Djiboua', 'Gôh-Djiboua', 'Divo'),

  // — District des Lacs —
  Region('belier', 'Bélier', 'Lacs', 'Toumodi'),
  Region('iffou', 'Iffou', 'Lacs', 'Daoukro'),
  Region('moronou', 'Moronou', 'Lacs', 'Bongouanou'),
  Region('nzi', 'N’Zi', 'Lacs', 'Dimbokro'),

  // — District des Lagunes —
  Region('agneby-tiassa', 'Agnéby-Tiassa', 'Lagunes', 'Agboville'),
  Region('grands-ponts', 'Grands-Ponts', 'Lagunes', 'Dabou'),
  Region('la-me', 'La Mé', 'Lagunes', 'Adzopé'),

  // — District des Montagnes —
  Region('cavally', 'Cavally', 'Montagnes', 'Guiglo'),
  Region('guemon', 'Guémon', 'Montagnes', 'Duékoué'),
  Region('tonkpi', 'Tonkpi', 'Montagnes', 'Man'),

  // — District du Sassandra-Marahoué —
  Region('haut-sassandra', 'Haut-Sassandra', 'Sassandra-Marahoué', 'Daloa'),
  Region('marahoue', 'Marahoué', 'Sassandra-Marahoué', 'Bouaflé'),

  // — District des Savanes —
  Region('bagoue', 'Bagoué', 'Savanes', 'Boundiali'),
  Region('poro', 'Poro', 'Savanes', 'Korhogo'),
  Region('tchologo', 'Tchologo', 'Savanes', 'Ferkessédougou'),

  // — District de la Vallée du Bandama —
  Region('gbeke', 'Gbêkê', 'Vallée du Bandama', 'Bouaké'),
  Region('hambol', 'Hambol', 'Vallée du Bandama', 'Katiola'),

  // — District du Woroba —
  Region('bafing', 'Bafing', 'Woroba', 'Touba'),
  Region('bere', 'Béré', 'Woroba', 'Mankono'),
  Region('worodougou', 'Worodougou', 'Woroba', 'Séguéla'),

  // — District du Zanzan —
  Region('bounkani', 'Bounkani', 'Zanzan', 'Bouna'),
  Region('gontougo', 'Gontougo', 'Zanzan', 'Bondoukou'),
];

/// Les 13 communes du District Autonome d'Abidjan.
const List<String> communesAbidjan = [
  'Abobo',
  'Adjamé',
  'Anyama',
  'Attécoubé',
  'Bingerville',
  'Cocody',
  'Koumassi',
  'Marcory',
  'Le Plateau',
  'Port-Bouët',
  'Songon',
  'Treichville',
  'Yopougon',
];

const List<City> cities = [
  City('abidjan-ville', 'Abidjan', 'abidjan', communes: communesAbidjan),
  City('yamoussoukro-ville', 'Yamoussoukro', 'yamoussoukro'),

  City('sassandra', 'Sassandra', 'gbokle'),
  City('fresco', 'Fresco', 'gbokle'),
  City('soubre', 'Soubré', 'nawa'),
  City('meagui', 'Méagui', 'nawa'),
  City('san-pedro-ville', 'San-Pédro', 'san-pedro'),
  City('tabou', 'Tabou', 'san-pedro'),

  City('abengourou', 'Abengourou', 'indenie-djuablin'),
  City('aboisso', 'Aboisso', 'sud-comoe'),
  City('grand-bassam', 'Grand-Bassam', 'sud-comoe'),
  City('bonoua', 'Bonoua', 'sud-comoe'),

  City('minignan', 'Minignan', 'folon'),
  City('odienne', 'Odienné', 'kabadougou'),

  City('gagnoa', 'Gagnoa', 'goh'),
  City('divo', 'Divo', 'loh-djiboua'),
  City('lakota', 'Lakota', 'loh-djiboua'),

  City('toumodi', 'Toumodi', 'belier'),
  City('daoukro', 'Daoukro', 'iffou'),
  City('bongouanou', 'Bongouanou', 'moronou'),
  City('dimbokro', 'Dimbokro', 'nzi'),

  City('agboville', 'Agboville', 'agneby-tiassa'),
  City('dabou', 'Dabou', 'grands-ponts'),
  City('grand-lahou', 'Grand-Lahou', 'grands-ponts'),
  City('adzope', 'Adzopé', 'la-me'),

  City('guiglo', 'Guiglo', 'cavally'),
  City('duekoue', 'Duékoué', 'guemon'),
  City('man', 'Man', 'tonkpi'),
  City('danane', 'Danané', 'tonkpi'),

  City('daloa', 'Daloa', 'haut-sassandra'),
  City('issia', 'Issia', 'haut-sassandra'),
  City('bouafle', 'Bouaflé', 'marahoue'),
  City('sinfra', 'Sinfra', 'marahoue'),

  City('boundiali', 'Boundiali', 'bagoue'),
  City('korhogo', 'Korhogo', 'poro'),
  City('ferkessedougou', 'Ferkessédougou', 'tchologo'),

  City('bouake', 'Bouaké', 'gbeke'),
  City('katiola', 'Katiola', 'hambol'),

  City('touba', 'Touba', 'bafing'),
  City('mankono', 'Mankono', 'bere'),
  City('seguela', 'Séguéla', 'worodougou'),

  City('bouna', 'Bouna', 'bounkani'),
  City('bondoukou', 'Bondoukou', 'gontougo'),
];

// Helpers --------------------------------------------------------------------

Region? regionById(String? id) {
  for (final r in regions) {
    if (r.id == id) return r;
  }
  return null;
}

City? cityById(String? id) {
  for (final c in cities) {
    if (c.id == id) return c;
  }
  return null;
}

List<City> citiesByRegion(String? regionId) =>
    cities.where((c) => c.regionId == regionId).toList();

/// Un libellé lisible : « Commune, Ville, Région ».
String locationLabel(String? regionId, String? cityId, [String? commune]) {
  final city = cityById(cityId);
  final region = regionById(regionId);
  final parts = <String>[];
  if (commune != null && commune.isNotEmpty) parts.add(commune);
  if (city != null) parts.add(city.name);
  if (region != null && (city == null || region.name != city.name)) {
    parts.add(region.name);
  }
  return parts.isNotEmpty ? parts.join(', ') : 'Toute la Côte d’Ivoire';
}

/// Les districts, dans l'ordre d'apparition, pour regrouper le sélecteur.
final List<String> districts = () {
  final vus = <String>{};
  final ordre = <String>[];
  for (final r in regions) {
    if (vus.add(r.district)) ordre.add(r.district);
  }
  return ordre;
}();

String _norm(String? s) {
  if (s == null) return '';
  final minuscule = s.toLowerCase();
  // Retrait des accents : on décompose puis on enlève les diacritiques.
  const avec = 'àáâãäçèéêëìíîïñòóôõöùúûüýÿ';
  const sans = 'aaaaacaaaaiiiinoooooquuuuyy';
  final b = StringBuffer();
  for (final ch in minuscule.split('')) {
    final i = avec.indexOf(ch);
    b.write(i >= 0 ? sans[i] : ch);
  }
  return b.toString().trim();
}

bool _match(String a, String b) {
  if (a.isEmpty || b.isEmpty) return false;
  if (a == b) return true;
  // Correspondance partielle seulement pour les noms assez longs.
  final court = a.length <= b.length ? a : b;
  final long = a.length <= b.length ? b : a;
  return court.length >= 4 && long.contains(court);
}

/// Fait correspondre un ou plusieurs noms détectés (quartier, ville…) à la
/// localisation ivoirienne la plus proche : région / ville / commune.
Lieu? resolveLocationByName(List<String?> names) {
  final candidats = names.map(_norm).where((s) => s.isNotEmpty).toList();
  // 1) Commune du District d'Abidjan ?
  for (final c in candidats) {
    for (final com in communesAbidjan) {
      if (_match(_norm(com), c)) {
        return Lieu(regionId: 'abidjan', cityId: 'abidjan-ville', commune: com);
      }
    }
  }
  // 2) Ville connue ?
  for (final c in candidats) {
    for (final v in cities) {
      if (_match(_norm(v.name), c)) {
        return Lieu(regionId: v.regionId, cityId: v.id);
      }
    }
  }
  return null;
}
