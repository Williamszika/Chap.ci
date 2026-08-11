/// Les 13 communes du District Autonome d'Abidjan — reprises de
/// `src/data/locations.ts`. La plupart des annonces viennent d'Abidjan ; la
/// version 1 de « Publier » se concentre donc sur ces communes. Le reste du
/// pays (régions / villes) viendra dans une version suivante.
library;

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

/// Identifiants de localisation envoyés au serveur pour une commune d'Abidjan.
const String regionAbidjan = 'abidjan';
const String cityAbidjan = 'abidjan-ville';
