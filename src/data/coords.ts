// Coordonnées GPS approximatives des villes et communes de Côte d'Ivoire.
// Utilisées comme position par défaut d'une annonce quand le vendeur n'active
// pas son GPS, afin de calculer une distance indicative.

export interface Coords {
  lat: number
  lng: number
}

// Communes du District Autonome d'Abidjan
export const communeCoords: Record<string, Coords> = {
  Abobo: { lat: 5.4165, lng: -4.0159 },
  Adjamé: { lat: 5.3646, lng: -4.0227 },
  Anyama: { lat: 5.4949, lng: -4.0517 },
  Attécoubé: { lat: 5.3333, lng: -4.0333 },
  Bingerville: { lat: 5.3556, lng: -3.8869 },
  Cocody: { lat: 5.3599, lng: -3.9877 },
  Koumassi: { lat: 5.2953, lng: -3.9469 },
  Marcory: { lat: 5.3, lng: -3.9833 },
  'Le Plateau': { lat: 5.3242, lng: -4.0189 },
  'Port-Bouët': { lat: 5.2558, lng: -3.9269 },
  Songon: { lat: 5.2917, lng: -4.2528 },
  Treichville: { lat: 5.2917, lng: -4.0083 },
  Yopougon: { lat: 5.3456, lng: -4.0708 },
}

// Villes (par id de ville)
export const cityCoords: Record<string, Coords> = {
  'abidjan-ville': { lat: 5.3599, lng: -4.0083 },
  'yamoussoukro-ville': { lat: 6.8276, lng: -5.2893 },
  bouake: { lat: 7.6939, lng: -5.0303 },
  daloa: { lat: 6.8776, lng: -6.4502 },
  'san-pedro-ville': { lat: 4.7485, lng: -6.6363 },
  korhogo: { lat: 9.4578, lng: -5.6294 },
  man: { lat: 7.4125, lng: -7.5538 },
  gagnoa: { lat: 6.1319, lng: -5.9506 },
  divo: { lat: 5.8397, lng: -5.3572 },
  abengourou: { lat: 6.7297, lng: -3.4964 },
  'grand-bassam': { lat: 5.2118, lng: -3.7386 },
  bonoua: { lat: 5.2725, lng: -3.5964 },
  aboisso: { lat: 5.4676, lng: -3.2072 },
  agboville: { lat: 5.9282, lng: -4.2131 },
  dabou: { lat: 5.3256, lng: -4.3767 },
  adzope: { lat: 6.1069, lng: -3.8619 },
  seguela: { lat: 7.9611, lng: -6.6731 },
  odienne: { lat: 9.5, lng: -7.5667 },
  bondoukou: { lat: 8.0402, lng: -2.8, },
  ferkessedougou: { lat: 9.5928, lng: -5.1944 },
  soubre: { lat: 5.7836, lng: -6.5936 },
  toumodi: { lat: 6.5528, lng: -5.0189 },
  katiola: { lat: 8.1333, lng: -5.1},
  bouafle: { lat: 6.99, lng: -5.7444 },
  issia: { lat: 6.4922, lng: -6.5872 },
  duekoue: { lat: 6.7419, lng: -7.3436 },
  guiglo: { lat: 6.5439, lng: -7.4869 },
  daoukro: { lat: 7.0586, lng: -3.9631 },
  dimbokro: { lat: 6.6486, lng: -4.7061 },
  boundiali: { lat: 9.5217, lng: -6.4869 },
  mankono: { lat: 8.0586, lng: -6.1897 },
  touba: { lat: 8.2833, lng: -7.6833 },
  bouna: { lat: 9.2667, lng: -3.0 },
  tabou: { lat: 4.4231, lng: -7.3528 },
  danane: { lat: 7.2597, lng: -8.155 },
  sinfra: { lat: 6.6197, lng: -5.9161 },
  lakota: { lat: 5.8481, lng: -5.6786 },
  bongouanou: { lat: 6.6511, lng: -4.2039 },
  minignan: { lat: 10.0, lng: -7.7333 },
  'grand-lahou': { lat: 5.1386, lng: -5.0203 },
  sassandra: { lat: 4.9503, lng: -6.0836 },
  fresco: { lat: 5.0939, lng: -5.5658 },
  meagui: { lat: 5.8833, lng: -6.5333 },
}

/** Retourne les coordonnées approximatives d'une commune, sinon d'une ville. */
export function coordsFor(cityId?: string, commune?: string): Coords | undefined {
  if (commune && communeCoords[commune]) return communeCoords[commune]
  if (cityId && cityCoords[cityId]) return cityCoords[cityId]
  return undefined
}
