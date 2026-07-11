import type { Listing } from '../types'
import { placeholderImage, emojiFor } from '../lib/placeholder'
import { coordsFor } from './coords'

const DAY = 24 * 60 * 60 * 1000

// Date de référence stable calculée à l'exécution (navigateur)
const now = Date.now()

interface Seed {
  title: string
  description: string
  price: number
  negotiable?: boolean
  categoryId: string
  subcategory?: string
  condition?: 'neuf' | 'occasion'
  regionId: string
  cityId: string
  commune?: string
  sellerName: string
  sellerPhone: string
  ageDays: number
  delivery?: boolean
  featured?: boolean
  emoji?: string
}

const seeds: Seed[] = [
  {
    title: 'Toyota Corolla 2015 essence, très propre',
    description:
      'Toyota Corolla 2015, boîte automatique, climatisation glacée, papiers à jour (carte grise + assurance). Kilométrage 98 000 km. Pneus neufs. Visible à Cocody Angré. Prix légèrement négociable.',
    price: 6500000,
    negotiable: true,
    categoryId: 'vehicules',
    subcategory: 'Voitures',
    condition: 'occasion',
    regionId: 'abidjan',
    cityId: 'abidjan-ville',
    commune: 'Cocody',
    sellerName: 'Konan Serge',
    sellerPhone: '+225 07 07 12 34 56',
    ageDays: 1,
    delivery: false,
    featured: true,
  },
  {
    title: 'Villa 4 pièces à louer — Riviera Palmeraie',
    description:
      'Belle villa basse 4 pièces avec cour, dans résidence sécurisée à la Riviera Palmeraie. 3 chambres, salon, cuisine équipée, 2 douches. Eau et électricité. Loyer mensuel, 3 mois de caution + 1 mois d’avance.',
    price: 350000,
    categoryId: 'immobilier',
    subcategory: 'Location',
    regionId: 'abidjan',
    cityId: 'abidjan-ville',
    commune: 'Cocody',
    sellerName: 'Agence Ivoire Habitat',
    sellerPhone: '+225 01 02 03 04 05',
    ageDays: 2,
    featured: true,
  },
  {
    title: 'iPhone 13 Pro 256 Go — comme neuf',
    description:
      'iPhone 13 Pro 256 Go, couleur graphite, batterie à 92%. Aucune rayure, toujours sous coque et verre trempé. Facture disponible. Débloqué tout opérateur (Orange, MTN, Moov).',
    price: 425000,
    negotiable: true,
    categoryId: 'telephones',
    subcategory: 'Smartphones',
    condition: 'occasion',
    regionId: 'abidjan',
    cityId: 'abidjan-ville',
    commune: 'Marcory',
    sellerName: 'Aya Fofana',
    sellerPhone: '+225 05 44 55 66 77',
    ageDays: 0,
    delivery: true,
    featured: true,
  },
  {
    title: 'Terrain 500 m² titré à Bingerville',
    description:
      'Terrain de 500 m² entièrement titré (ACD disponible) à Bingerville, quartier calme, viabilisé. Idéal pour construction de villa. Documents en règle, vente directe propriétaire.',
    price: 15000000,
    negotiable: true,
    categoryId: 'immobilier',
    subcategory: 'Terrains',
    regionId: 'abidjan',
    cityId: 'abidjan-ville',
    commune: 'Bingerville',
    sellerName: 'Kouassi Yao',
    sellerPhone: '+225 07 88 99 00 11',
    ageDays: 4,
  },
  {
    title: 'Réfrigérateur combiné Samsung 300L',
    description:
      'Réfrigérateur combiné Samsung 300 litres, no frost, très basse consommation. Utilisé 1 an, parfait état de marche. Livraison possible sur Abidjan.',
    price: 220000,
    negotiable: true,
    categoryId: 'maison',
    subcategory: 'Électroménager',
    condition: 'occasion',
    regionId: 'abidjan',
    cityId: 'abidjan-ville',
    commune: 'Yopougon',
    sellerName: 'Traoré Ibrahim',
    sellerPhone: '+225 05 11 22 33 44',
    ageDays: 3,
    delivery: true,
  },
  {
    title: 'MacBook Air M2 2023 — 8/256',
    description:
      'MacBook Air puce M2, 8 Go RAM, 256 Go SSD. Acheté en 2023, très peu servi. Idéal étudiants et professionnels. Chargeur d’origine inclus. Garantie 3 mois vendeur.',
    price: 650000,
    categoryId: 'electronique',
    subcategory: 'Ordinateurs',
    condition: 'occasion',
    regionId: 'abidjan',
    cityId: 'abidjan-ville',
    commune: 'Le Plateau',
    sellerName: 'Digital Store CI',
    sellerPhone: '+225 27 20 30 40 50',
    ageDays: 1,
    delivery: true,
  },
  {
    title: 'Yamaha DT 125 — moto tout-terrain',
    description:
      'Moto Yamaha DT 125, idéale pour la ville et la piste. Démarrage au quart de tour, entretien à jour. Deux casques offerts. À voir à Bouaké centre.',
    price: 950000,
    negotiable: true,
    categoryId: 'vehicules',
    subcategory: 'Motos & Scooters',
    condition: 'occasion',
    regionId: 'gbeke',
    cityId: 'bouake',
    sellerName: 'N’Guessan Franck',
    sellerPhone: '+225 07 65 43 21 09',
    ageDays: 5,
  },
  {
    title: 'Pagnes Woodin & Uniwax — lot de 6',
    description:
      'Lot de 6 pagnes authentiques Woodin et Uniwax (6 yards chacun), motifs variés. Parfait pour cérémonies et couture. Neufs, jamais portés.',
    price: 90000,
    negotiable: true,
    categoryId: 'mode',
    subcategory: 'Pagnes & Tissus',
    condition: 'neuf',
    regionId: 'abidjan',
    cityId: 'abidjan-ville',
    commune: 'Treichville',
    sellerName: 'Mariam Coulibaly',
    sellerPhone: '+225 05 98 76 54 32',
    ageDays: 2,
    delivery: true,
  },
  {
    title: 'Recherche commercial terrain (H/F) — Abidjan',
    description:
      'Entreprise de distribution recrute 5 commerciaux terrain sur Abidjan. Profil dynamique, sens du contact, expérience en vente appréciée. Fixe + commissions attractives. Envoyez votre CV.',
    price: 150000,
    categoryId: 'emploi',
    subcategory: 'Offres d’emploi',
    regionId: 'abidjan',
    cityId: 'abidjan-ville',
    commune: 'Adjamé',
    sellerName: 'RH Distrib Plus',
    sellerPhone: '+225 01 45 67 89 01',
    ageDays: 1,
  },
  {
    title: 'Cours de soutien maths & physique (lycée)',
    description:
      'Professeur expérimenté propose des cours de soutien en mathématiques et physique-chimie, niveaux 2nde à Terminale. À domicile sur Yamoussoukro ou en ligne. Résultats garantis.',
    price: 25000,
    negotiable: true,
    categoryId: 'services',
    subcategory: 'Cours & Formation',
    regionId: 'yamoussoukro',
    cityId: 'yamoussoukro-ville',
    sellerName: 'M. Bakayoko',
    sellerPhone: '+225 07 33 22 11 00',
    ageDays: 6,
  },
  {
    title: 'Sacs de cacao — récolte de la saison',
    description:
      'Cacao de qualité marchande, bien séché, récolte de la saison. Disponible en gros à Daloa. Prix au kilo négociable selon quantité. Contactez pour les grosses commandes.',
    price: 1500,
    negotiable: true,
    categoryId: 'agriculture',
    subcategory: 'Cacao & Café',
    regionId: 'haut-sassandra',
    cityId: 'daloa',
    sellerName: 'Coopérative CoopCacao',
    sellerPhone: '+225 05 66 77 88 99',
    ageDays: 3,
  },
  {
    title: 'Salon complet 7 places en cuir',
    description:
      'Salon en cuir véritable 7 places (3+2+1+1), couleur marron, très confortable. Bon état, structure solide. Idéal grand séjour. Enlèvement à San-Pédro.',
    price: 480000,
    negotiable: true,
    categoryId: 'maison',
    subcategory: 'Meubles',
    condition: 'occasion',
    regionId: 'san-pedro',
    cityId: 'san-pedro-ville',
    sellerName: 'Grace Ahou',
    sellerPhone: '+225 07 12 21 32 43',
    ageDays: 7,
  },
  {
    title: 'Samsung Galaxy A54 5G — neuf sous blister',
    description:
      'Samsung Galaxy A54 5G, 128 Go, neuf et scellé sous blister. Garantie constructeur. Couleurs disponibles : noir, blanc, violet. Livraison Abidjan et expédition intérieur.',
    price: 195000,
    categoryId: 'telephones',
    subcategory: 'Smartphones',
    condition: 'neuf',
    regionId: 'abidjan',
    cityId: 'abidjan-ville',
    commune: 'Koumassi',
    sellerName: 'Phone Market',
    sellerPhone: '+225 05 00 11 22 33',
    ageDays: 0,
    delivery: true,
  },
  {
    title: 'Groupe électrogène 5 kVA insonorisé',
    description:
      'Groupe électrogène 5 kVA insonorisé, démarrage électrique, très peu utilisé. Idéal maison ou petit commerce. Faible consommation. À voir à Korhogo.',
    price: 720000,
    negotiable: true,
    categoryId: 'materiel-pro',
    subcategory: 'Industrie',
    condition: 'occasion',
    regionId: 'poro',
    cityId: 'korhogo',
    sellerName: 'Silué Adama',
    sellerPhone: '+225 07 47 58 69 70',
    ageDays: 8,
  },
  {
    title: 'Poussette 3-en-1 + siège auto bébé',
    description:
      'Ensemble poussette 3-en-1 avec nacelle et siège auto, marque Chicco. Très bon état, propre et complet. Pliage facile. Idéal nouveau-né. Disponible à Grand-Bassam.',
    price: 85000,
    negotiable: true,
    categoryId: 'bebe',
    subcategory: 'Poussettes',
    condition: 'occasion',
    regionId: 'sud-comoe',
    cityId: 'grand-bassam',
    sellerName: 'Emmanuella K.',
    sellerPhone: '+225 05 34 45 56 67',
    ageDays: 4,
    delivery: true,
  },
  {
    title: 'Vélo VTT adulte 27,5 pouces',
    description:
      'VTT adulte 27,5 pouces, 21 vitesses Shimano, freins à disque. Très bon état, révisé. Idéal ville et loisir. Man, quartier Libreville.',
    price: 110000,
    negotiable: true,
    categoryId: 'loisirs',
    subcategory: 'Vélos',
    condition: 'occasion',
    regionId: 'tonkpi',
    cityId: 'man',
    sellerName: 'Gérard Zoro',
    sellerPhone: '+225 07 79 68 57 46',
    ageDays: 9,
  },
  {
    title: 'TV Smart LG 55 pouces 4K UHD',
    description:
      'Téléviseur Smart LG 55" 4K UHD, WebOS, Netflix/YouTube intégrés. Image impeccable, télécommande d’origine. Sous garantie magasin 6 mois. Livraison Abidjan gratuite.',
    price: 380000,
    categoryId: 'electronique',
    subcategory: 'TV & Écrans',
    condition: 'neuf',
    regionId: 'abidjan',
    cityId: 'abidjan-ville',
    commune: 'Cocody',
    sellerName: 'Électro Plus',
    sellerPhone: '+225 27 22 33 44 55',
    ageDays: 2,
    delivery: true,
    featured: true,
  },
  {
    title: 'Magasin / local commercial à louer — Adjamé',
    description:
      'Local commercial de 40 m² en bordure de voie passante à Adjamé, idéal boutique ou dépôt. Rideau métallique, compteur électrique dédié. Loyer mensuel, caution 3 mois.',
    price: 250000,
    categoryId: 'immobilier',
    subcategory: 'Bureaux & Commerces',
    regionId: 'abidjan',
    cityId: 'abidjan-ville',
    commune: 'Adjamé',
    sellerName: 'Diomandé Location',
    sellerPhone: '+225 01 77 88 99 00',
    ageDays: 5,
  },
  {
    title: 'Machine à coudre industrielle Juki',
    description:
      'Machine à coudre industrielle Juki, piqueuse plate, moteur silencieux. Parfaite pour atelier de couture. Entretenue, très fiable. Formation rapide possible.',
    price: 320000,
    negotiable: true,
    categoryId: 'services',
    subcategory: 'Couture',
    condition: 'occasion',
    regionId: 'gbeke',
    cityId: 'bouake',
    sellerName: 'Atelier Fatou Couture',
    sellerPhone: '+225 05 23 34 45 56',
    ageDays: 11,
  },
  {
    title: 'Lot de 100 poussins + provende',
    description:
      'Lot de 100 poussins d’un jour (poules pondeuses), vaccinés, avec sac de provende démarrage offert. Élevage suivi. Disponible à Abengourou, livraison possible zone Est.',
    price: 65000,
    negotiable: true,
    categoryId: 'agriculture',
    subcategory: 'Élevage',
    regionId: 'indenie-djuablin',
    cityId: 'abengourou',
    sellerName: 'Ferme Avicole Est',
    sellerPhone: '+225 07 90 81 72 63',
    ageDays: 6,
  },
  {
    title: 'PlayStation 5 + 2 manettes + 3 jeux',
    description:
      'Console PS5 édition standard avec lecteur, 2 manettes DualSense et 3 jeux (FIFA, GTA V, Spider-Man). Très bon état, boîte d’origine. À débattre légèrement.',
    price: 400000,
    negotiable: true,
    categoryId: 'electronique',
    subcategory: 'Jeux vidéo',
    condition: 'occasion',
    regionId: 'abidjan',
    cityId: 'abidjan-ville',
    commune: 'Cocody',
    sellerName: 'Yann G.',
    sellerPhone: '+225 05 67 78 89 90',
    ageDays: 1,
    delivery: true,
  },
  {
    title: 'Robe de mariée + accessoires',
    description:
      'Magnifique robe de mariée taille 38-40, portée une seule fois, nettoyée à sec. Voile et jupon inclus. Divo, à récupérer sur place ou envoi par gbaka/car.',
    price: 130000,
    negotiable: true,
    categoryId: 'mode',
    subcategory: 'Vêtements Femme',
    condition: 'occasion',
    regionId: 'loh-djiboua',
    cityId: 'divo',
    sellerName: 'Solange N.',
    sellerPhone: '+225 07 15 26 37 48',
    ageDays: 13,
  },
  {
    title: 'Congélateur bahut 200L — commerce',
    description:
      'Congélateur bahut 200 litres, idéal pour la vente de boissons, glaces ou poisson. Très bon froid, faible consommation. Séguéla, prix négociable pour achat rapide.',
    price: 175000,
    negotiable: true,
    categoryId: 'materiel-pro',
    subcategory: 'Restauration',
    condition: 'occasion',
    regionId: 'worodougou',
    cityId: 'seguela',
    sellerName: 'Ouattara Boutique',
    sellerPhone: '+225 05 82 73 64 55',
    ageDays: 10,
  },
  {
    title: 'Ordinateur de bureau HP + écran 22"',
    description:
      'Unité centrale HP Core i5, 8 Go RAM, 500 Go, avec écran 22 pouces, clavier et souris. Idéal bureautique et études. Windows installé. San-Pédro.',
    price: 185000,
    negotiable: true,
    categoryId: 'electronique',
    subcategory: 'Ordinateurs',
    condition: 'occasion',
    regionId: 'san-pedro',
    cityId: 'san-pedro-ville',
    sellerName: 'Cyber Océan',
    sellerPhone: '+225 27 34 45 56 67',
    ageDays: 7,
  },
]

export const seedListings: Listing[] = seeds.map((s, i) => {
  const emoji = s.emoji ?? emojiFor(s.categoryId, s.subcategory)
  const coords = coordsFor(s.cityId, s.commune)
  return {
    id: `seed-${i + 1}`,
    title: s.title,
    description: s.description,
    price: s.price,
    negotiable: s.negotiable ?? false,
    currency: 'FCFA',
    categoryId: s.categoryId,
    subcategory: s.subcategory,
    condition: s.condition ?? 'occasion',
    images: [
      placeholderImage(`${s.title}-a`, emoji, s.subcategory ?? ''),
      placeholderImage(`${s.title}-b`, emoji, ''),
    ],
    regionId: s.regionId,
    cityId: s.cityId,
    commune: s.commune,
    lat: coords?.lat,
    lng: coords?.lng,
    sellerName: s.sellerName,
    sellerPhone: s.sellerPhone,
    createdAt: now - s.ageDays * DAY,
    delivery: s.delivery ?? false,
    featured: s.featured ?? false,
  }
})
