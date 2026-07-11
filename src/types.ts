// Types partagés de l'application Chap.ci

export interface Region {
  id: string
  name: string
  district: string
  chefLieu: string
}

export interface City {
  id: string
  name: string
  regionId: string
  /** Communes (surtout pour Abidjan et les grandes villes) */
  communes?: string[]
}

export interface Category {
  id: string
  name: string
  icon: string // nom d'icône lucide-react
  color: string // classe tailwind de fond
  subcategories: string[]
}

export interface Listing {
  id: string
  title: string
  description: string
  price: number
  /** true = prix négociable / à débattre */
  negotiable: boolean
  currency: 'FCFA'
  categoryId: string
  subcategory?: string
  condition: 'neuf' | 'occasion'
  images: string[] // data-URI ou URL
  regionId: string
  cityId: string
  commune?: string
  sellerName: string
  sellerPhone: string
  createdAt: number // timestamp ms
  delivery: boolean
  /** annonce mise en avant */
  featured?: boolean
}

export interface LocationFilter {
  regionId?: string
  cityId?: string
  commune?: string
}
