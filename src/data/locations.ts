import type { Region, City } from '../types'

/**
 * Découpage administratif de la Côte d'Ivoire.
 *
 * Le pays compte 14 districts (dont 2 districts autonomes : Abidjan et
 * Yamoussoukro), 31 régions et de nombreuses communes.
 *
 * Modèle utilisé dans Chap.ci :
 *   District (champ `district`) → Région → Ville → Commune
 *
 * Les 2 districts autonomes sont traités comme des régions pour la recherche.
 */

export const regions: Region[] = [
  // — Districts autonomes —
  { id: 'abidjan', name: 'Abidjan', district: 'District Autonome d’Abidjan', chefLieu: 'Abidjan' },
  { id: 'yamoussoukro', name: 'Yamoussoukro', district: 'District Autonome de Yamoussoukro', chefLieu: 'Yamoussoukro' },

  // — District du Bas-Sassandra —
  { id: 'gbokle', name: 'Gbôklé', district: 'Bas-Sassandra', chefLieu: 'Sassandra' },
  { id: 'nawa', name: 'Nawa', district: 'Bas-Sassandra', chefLieu: 'Soubré' },
  { id: 'san-pedro', name: 'San-Pédro', district: 'Bas-Sassandra', chefLieu: 'San-Pédro' },

  // — District de la Comoé —
  { id: 'indenie-djuablin', name: 'Indénié-Djuablin', district: 'Comoé', chefLieu: 'Abengourou' },
  { id: 'sud-comoe', name: 'Sud-Comoé', district: 'Comoé', chefLieu: 'Aboisso' },

  // — District du Denguélé —
  { id: 'folon', name: 'Folon', district: 'Denguélé', chefLieu: 'Minignan' },
  { id: 'kabadougou', name: 'Kabadougou', district: 'Denguélé', chefLieu: 'Odienné' },

  // — District du Gôh-Djiboua —
  { id: 'goh', name: 'Gôh', district: 'Gôh-Djiboua', chefLieu: 'Gagnoa' },
  { id: 'loh-djiboua', name: 'Lôh-Djiboua', district: 'Gôh-Djiboua', chefLieu: 'Divo' },

  // — District des Lacs —
  { id: 'belier', name: 'Bélier', district: 'Lacs', chefLieu: 'Toumodi' },
  { id: 'iffou', name: 'Iffou', district: 'Lacs', chefLieu: 'Daoukro' },
  { id: 'moronou', name: 'Moronou', district: 'Lacs', chefLieu: 'Bongouanou' },
  { id: 'nzi', name: 'N’Zi', district: 'Lacs', chefLieu: 'Dimbokro' },

  // — District des Lagunes —
  { id: 'agneby-tiassa', name: 'Agnéby-Tiassa', district: 'Lagunes', chefLieu: 'Agboville' },
  { id: 'grands-ponts', name: 'Grands-Ponts', district: 'Lagunes', chefLieu: 'Dabou' },
  { id: 'la-me', name: 'La Mé', district: 'Lagunes', chefLieu: 'Adzopé' },

  // — District des Montagnes —
  { id: 'cavally', name: 'Cavally', district: 'Montagnes', chefLieu: 'Guiglo' },
  { id: 'guemon', name: 'Guémon', district: 'Montagnes', chefLieu: 'Duékoué' },
  { id: 'tonkpi', name: 'Tonkpi', district: 'Montagnes', chefLieu: 'Man' },

  // — District du Sassandra-Marahoué —
  { id: 'haut-sassandra', name: 'Haut-Sassandra', district: 'Sassandra-Marahoué', chefLieu: 'Daloa' },
  { id: 'marahoue', name: 'Marahoué', district: 'Sassandra-Marahoué', chefLieu: 'Bouaflé' },

  // — District des Savanes —
  { id: 'bagoue', name: 'Bagoué', district: 'Savanes', chefLieu: 'Boundiali' },
  { id: 'poro', name: 'Poro', district: 'Savanes', chefLieu: 'Korhogo' },
  { id: 'tchologo', name: 'Tchologo', district: 'Savanes', chefLieu: 'Ferkessédougou' },

  // — District de la Vallée du Bandama —
  { id: 'gbeke', name: 'Gbêkê', district: 'Vallée du Bandama', chefLieu: 'Bouaké' },
  { id: 'hambol', name: 'Hambol', district: 'Vallée du Bandama', chefLieu: 'Katiola' },

  // — District du Woroba —
  { id: 'bafing', name: 'Bafing', district: 'Woroba', chefLieu: 'Touba' },
  { id: 'bere', name: 'Béré', district: 'Woroba', chefLieu: 'Mankono' },
  { id: 'worodougou', name: 'Worodougou', district: 'Woroba', chefLieu: 'Séguéla' },

  // — District du Zanzan —
  { id: 'bounkani', name: 'Bounkani', district: 'Zanzan', chefLieu: 'Bouna' },
  { id: 'gontougo', name: 'Gontougo', district: 'Zanzan', chefLieu: 'Bondoukou' },
]

/** Les 13 communes du District Autonome d'Abidjan */
export const communesAbidjan = [
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
]

export const cities: City[] = [
  { id: 'abidjan-ville', name: 'Abidjan', regionId: 'abidjan', communes: communesAbidjan },
  { id: 'yamoussoukro-ville', name: 'Yamoussoukro', regionId: 'yamoussoukro' },

  { id: 'sassandra', name: 'Sassandra', regionId: 'gbokle' },
  { id: 'fresco', name: 'Fresco', regionId: 'gbokle' },
  { id: 'soubre', name: 'Soubré', regionId: 'nawa' },
  { id: 'meagui', name: 'Méagui', regionId: 'nawa' },
  { id: 'san-pedro-ville', name: 'San-Pédro', regionId: 'san-pedro' },
  { id: 'tabou', name: 'Tabou', regionId: 'san-pedro' },

  { id: 'abengourou', name: 'Abengourou', regionId: 'indenie-djuablin' },
  { id: 'aboisso', name: 'Aboisso', regionId: 'sud-comoe' },
  { id: 'grand-bassam', name: 'Grand-Bassam', regionId: 'sud-comoe' },
  { id: 'bonoua', name: 'Bonoua', regionId: 'sud-comoe' },

  { id: 'minignan', name: 'Minignan', regionId: 'folon' },
  { id: 'odienne', name: 'Odienné', regionId: 'kabadougou' },

  { id: 'gagnoa', name: 'Gagnoa', regionId: 'goh' },
  { id: 'divo', name: 'Divo', regionId: 'loh-djiboua' },
  { id: 'lakota', name: 'Lakota', regionId: 'loh-djiboua' },

  { id: 'toumodi', name: 'Toumodi', regionId: 'belier' },
  { id: 'daoukro', name: 'Daoukro', regionId: 'iffou' },
  { id: 'bongouanou', name: 'Bongouanou', regionId: 'moronou' },
  { id: 'dimbokro', name: 'Dimbokro', regionId: 'nzi' },

  { id: 'agboville', name: 'Agboville', regionId: 'agneby-tiassa' },
  { id: 'dabou', name: 'Dabou', regionId: 'grands-ponts' },
  { id: 'grand-lahou', name: 'Grand-Lahou', regionId: 'grands-ponts' },
  { id: 'adzope', name: 'Adzopé', regionId: 'la-me' },

  { id: 'guiglo', name: 'Guiglo', regionId: 'cavally' },
  { id: 'duekoue', name: 'Duékoué', regionId: 'guemon' },
  { id: 'man', name: 'Man', regionId: 'tonkpi' },
  { id: 'danane', name: 'Danané', regionId: 'tonkpi' },

  { id: 'daloa', name: 'Daloa', regionId: 'haut-sassandra' },
  { id: 'issia', name: 'Issia', regionId: 'haut-sassandra' },
  { id: 'bouafle', name: 'Bouaflé', regionId: 'marahoue' },
  { id: 'sinfra', name: 'Sinfra', regionId: 'marahoue' },

  { id: 'boundiali', name: 'Boundiali', regionId: 'bagoue' },
  { id: 'korhogo', name: 'Korhogo', regionId: 'poro' },
  { id: 'ferkessedougou', name: 'Ferkessédougou', regionId: 'tchologo' },

  { id: 'bouake', name: 'Bouaké', regionId: 'gbeke' },
  { id: 'katiola', name: 'Katiola', regionId: 'hambol' },

  { id: 'touba', name: 'Touba', regionId: 'bafing' },
  { id: 'mankono', name: 'Mankono', regionId: 'bere' },
  { id: 'seguela', name: 'Séguéla', regionId: 'worodougou' },

  { id: 'bouna', name: 'Bouna', regionId: 'bounkani' },
  { id: 'bondoukou', name: 'Bondoukou', regionId: 'gontougo' },
]

// Helpers ------------------------------------------------------------------

export const regionById = (id?: string) => regions.find((r) => r.id === id)
export const cityById = (id?: string) => cities.find((c) => c.id === id)
export const citiesByRegion = (regionId?: string) =>
  cities.filter((c) => c.regionId === regionId)

export function locationLabel(regionId?: string, cityId?: string, commune?: string): string {
  const city = cityById(cityId)
  const region = regionById(regionId)
  const parts: string[] = []
  if (commune) parts.push(commune)
  if (city) parts.push(city.name)
  if (region && (!city || region.name !== city.name)) parts.push(region.name)
  return parts.length ? parts.join(', ') : 'Toute la Côte d’Ivoire'
}

/** Districts uniques, pour les regroupements dans le sélecteur de lieu */
export const districts = Array.from(new Set(regions.map((r) => r.district)))
