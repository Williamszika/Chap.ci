import type { City, LocationFilter } from '../types'

/**
 * Les pays hors Côte d'Ivoire (07/09/2026).
 *
 * Le Patron : « permettre aux gens d'autres pays de créer leur compte, tu mets
 * leur ville et leur pays, dans la catégorie Autres pays ». Le modèle du site
 * est Région → Ville → Commune ; on n'y touche pas. Un pays est une « ville »
 * de la région `autres-pays`, et la ville réelle de la personne s'écrit en
 * clair dans `commune`. Ainsi les filtres, les libellés et les annonces
 * fonctionnent sans une colonne de plus : `locationLabel('autres-pays',
 * 'pays-sn', 'Dakar')` donne « Dakar, Sénégal ».
 *
 * MÊMES codes et MÊMES noms que `flutter_app/lib/data/pays.dart` — c'est sous
 * ces codes que les comptes s'enregistrent. Ne les renommez jamais.
 */
export interface Pays {
  /** Code ISO 3166-1 alpha-2, en majuscules. */
  code: string
  nom: string
  zone: string
}

export const REGION_AUTRES_PAYS = 'autres-pays'

export const ZONES = [
  'Afrique de l’Ouest', 'Afrique centrale', 'Afrique du Nord', 'Reste de l’Afrique',
  'Europe', 'Amériques', 'Asie & Moyen-Orient', 'Océanie', 'Autre',
] as const

const p = (code: string, nom: string, zone: (typeof ZONES)[number]): Pays => ({ code, nom, zone })

export const pays: Pays[] = [
  // Afrique de l'Ouest — les voisins d'abord, c'est là que vit la diaspora.
  p('SN', 'Sénégal', 'Afrique de l’Ouest'), p('ML', 'Mali', 'Afrique de l’Ouest'),
  p('BF', 'Burkina Faso', 'Afrique de l’Ouest'), p('GN', 'Guinée', 'Afrique de l’Ouest'),
  p('GH', 'Ghana', 'Afrique de l’Ouest'), p('TG', 'Togo', 'Afrique de l’Ouest'),
  p('BJ', 'Bénin', 'Afrique de l’Ouest'), p('NE', 'Niger', 'Afrique de l’Ouest'),
  p('NG', 'Nigeria', 'Afrique de l’Ouest'), p('LR', 'Liberia', 'Afrique de l’Ouest'),
  p('SL', 'Sierra Leone', 'Afrique de l’Ouest'), p('GM', 'Gambie', 'Afrique de l’Ouest'),
  p('GW', 'Guinée-Bissau', 'Afrique de l’Ouest'), p('CV', 'Cap-Vert', 'Afrique de l’Ouest'),
  p('MR', 'Mauritanie', 'Afrique de l’Ouest'),
  // Afrique centrale
  p('CM', 'Cameroun', 'Afrique centrale'), p('GA', 'Gabon', 'Afrique centrale'),
  p('CG', 'Congo', 'Afrique centrale'), p('CD', 'RD Congo', 'Afrique centrale'),
  p('TD', 'Tchad', 'Afrique centrale'), p('CF', 'Centrafrique', 'Afrique centrale'),
  p('GQ', 'Guinée équatoriale', 'Afrique centrale'), p('ST', 'São Tomé-et-Príncipe', 'Afrique centrale'),
  p('AO', 'Angola', 'Afrique centrale'), p('RW', 'Rwanda', 'Afrique centrale'),
  p('BI', 'Burundi', 'Afrique centrale'),
  // Afrique du Nord
  p('MA', 'Maroc', 'Afrique du Nord'), p('DZ', 'Algérie', 'Afrique du Nord'),
  p('TN', 'Tunisie', 'Afrique du Nord'), p('LY', 'Libye', 'Afrique du Nord'),
  p('EG', 'Égypte', 'Afrique du Nord'), p('SD', 'Soudan', 'Afrique du Nord'),
  // Reste de l'Afrique
  p('ZA', 'Afrique du Sud', 'Reste de l’Afrique'), p('KE', 'Kenya', 'Reste de l’Afrique'),
  p('ET', 'Éthiopie', 'Reste de l’Afrique'), p('TZ', 'Tanzanie', 'Reste de l’Afrique'),
  p('UG', 'Ouganda', 'Reste de l’Afrique'), p('MG', 'Madagascar', 'Reste de l’Afrique'),
  p('MZ', 'Mozambique', 'Reste de l’Afrique'), p('ZM', 'Zambie', 'Reste de l’Afrique'),
  p('ZW', 'Zimbabwe', 'Reste de l’Afrique'), p('BW', 'Botswana', 'Reste de l’Afrique'),
  p('NA', 'Namibie', 'Reste de l’Afrique'), p('DJ', 'Djibouti', 'Reste de l’Afrique'),
  p('ER', 'Érythrée', 'Reste de l’Afrique'), p('SO', 'Somalie', 'Reste de l’Afrique'),
  p('SS', 'Soudan du Sud', 'Reste de l’Afrique'), p('MW', 'Malawi', 'Reste de l’Afrique'),
  p('LS', 'Lesotho', 'Reste de l’Afrique'), p('SZ', 'Eswatini', 'Reste de l’Afrique'),
  p('KM', 'Comores', 'Reste de l’Afrique'), p('MU', 'Maurice', 'Reste de l’Afrique'),
  p('SC', 'Seychelles', 'Reste de l’Afrique'),
  // Europe
  p('FR', 'France', 'Europe'), p('BE', 'Belgique', 'Europe'), p('CH', 'Suisse', 'Europe'),
  p('DE', 'Allemagne', 'Europe'), p('IT', 'Italie', 'Europe'), p('ES', 'Espagne', 'Europe'),
  p('GB', 'Royaume-Uni', 'Europe'), p('NL', 'Pays-Bas', 'Europe'), p('PT', 'Portugal', 'Europe'),
  p('LU', 'Luxembourg', 'Europe'), p('AT', 'Autriche', 'Europe'), p('SE', 'Suède', 'Europe'),
  p('NO', 'Norvège', 'Europe'), p('DK', 'Danemark', 'Europe'), p('FI', 'Finlande', 'Europe'),
  p('IE', 'Irlande', 'Europe'), p('PL', 'Pologne', 'Europe'), p('CZ', 'Tchéquie', 'Europe'),
  p('GR', 'Grèce', 'Europe'), p('RO', 'Roumanie', 'Europe'), p('HU', 'Hongrie', 'Europe'),
  p('UA', 'Ukraine', 'Europe'), p('RU', 'Russie', 'Europe'), p('TR', 'Turquie', 'Europe'),
  // Amériques
  p('US', 'États-Unis', 'Amériques'), p('CA', 'Canada', 'Amériques'), p('BR', 'Brésil', 'Amériques'),
  p('MX', 'Mexique', 'Amériques'), p('AR', 'Argentine', 'Amériques'), p('CO', 'Colombie', 'Amériques'),
  p('CL', 'Chili', 'Amériques'), p('PE', 'Pérou', 'Amériques'), p('HT', 'Haïti', 'Amériques'),
  p('CU', 'Cuba', 'Amériques'), p('DO', 'République dominicaine', 'Amériques'),
  p('JM', 'Jamaïque', 'Amériques'), p('VE', 'Venezuela', 'Amériques'), p('GF', 'Guyane', 'Amériques'),
  // Asie & Moyen-Orient
  p('CN', 'Chine', 'Asie & Moyen-Orient'), p('IN', 'Inde', 'Asie & Moyen-Orient'),
  p('JP', 'Japon', 'Asie & Moyen-Orient'), p('KR', 'Corée du Sud', 'Asie & Moyen-Orient'),
  p('AE', 'Émirats arabes unis', 'Asie & Moyen-Orient'), p('SA', 'Arabie saoudite', 'Asie & Moyen-Orient'),
  p('QA', 'Qatar', 'Asie & Moyen-Orient'), p('KW', 'Koweït', 'Asie & Moyen-Orient'),
  p('OM', 'Oman', 'Asie & Moyen-Orient'), p('BH', 'Bahreïn', 'Asie & Moyen-Orient'),
  p('LB', 'Liban', 'Asie & Moyen-Orient'), p('JO', 'Jordanie', 'Asie & Moyen-Orient'),
  p('IL', 'Israël', 'Asie & Moyen-Orient'), p('IQ', 'Irak', 'Asie & Moyen-Orient'),
  p('IR', 'Iran', 'Asie & Moyen-Orient'), p('PK', 'Pakistan', 'Asie & Moyen-Orient'),
  p('BD', 'Bangladesh', 'Asie & Moyen-Orient'), p('ID', 'Indonésie', 'Asie & Moyen-Orient'),
  p('MY', 'Malaisie', 'Asie & Moyen-Orient'), p('TH', 'Thaïlande', 'Asie & Moyen-Orient'),
  p('VN', 'Vietnam', 'Asie & Moyen-Orient'), p('PH', 'Philippines', 'Asie & Moyen-Orient'),
  p('SG', 'Singapour', 'Asie & Moyen-Orient'),
  // Océanie
  p('AU', 'Australie', 'Océanie'), p('NZ', 'Nouvelle-Zélande', 'Océanie'),
  // Et tout le reste.
  p('ZZ', 'Autre pays', 'Autre'),
]

/** « pays-sn » — l'identifiant de « ville » sous lequel un pays s'enregistre. */
export const idPays = (code: string): string => `pays-${code.toLowerCase()}`
/** « pays-sn » → « SN » ; autre chose → undefined. */
export const codePays = (cityId?: string | null): string | undefined =>
  cityId && cityId.startsWith('pays-') ? cityId.slice(5).toUpperCase() : undefined
export const paysParCode = (code?: string | null): Pays | undefined =>
  pays.find((x) => x.code === (code || '').toUpperCase())
export const paysParId = (cityId?: string | null): Pays | undefined => paysParCode(codePays(cityId))
export const estAutresPays = (regionId?: string | null): boolean => regionId === REGION_AUTRES_PAYS

/** Les pays, tels que `locations.ts` les range parmi les villes. */
export const paysCommeVilles = (): City[] =>
  pays.map((x) => ({ id: idPays(x.code), name: x.nom, regionId: REGION_AUTRES_PAYS }))

/** Le drapeau du pays en emoji — « 🇸🇳 » pour SN, un globe pour l'inconnu. */
export function drapeau(code?: string | null): string {
  const c = (code || '').toUpperCase()
  if (!/^[A-Z]{2}$/.test(c) || c === 'ZZ') return '🌍'
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65))
}

/**
 * Un lieu hors Côte d'Ivoire à partir de ce que la géolocalisation a dit —
 * le code du pays et le nom de la ville. Null en Côte d'Ivoire ou sans pays.
 */
export function lieuHorsCi(code?: string | null, ville?: string | null): LocationFilter | null {
  const c = (code || '').toUpperCase()
  if (!c || c === 'CI') return null
  const connu = paysParCode(c) ? c : 'ZZ'
  return { regionId: REGION_AUTRES_PAYS, cityId: idPays(connu), commune: (ville || '').trim() || undefined }
}
