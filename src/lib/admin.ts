// =============================================================================
//  Administration — tableau de bord (statistiques, annonces, utilisateurs,
//  commandes). Disponible avec le backend PHP auto-hébergé.
// =============================================================================
import type { Listing } from '../types'
import { isPhp } from './backend'
import * as php from './php'

const NOT_SUPPORTED = 'Le tableau de bord admin nécessite le backend auto-hébergé (PHP).'

export interface AdminStats {
  users: number
  listings: number
  conversations: number
  messages: number
  orders: number
  reviews: number
  newsletter: number
  ordersByStatus: Record<string, number>
  ordersValue: number
  recentListings: Listing[]
  recentUsers: { id: string; email: string; fullName: string; createdAt: number }[]
}

export interface AdminUser {
  id: string
  email: string
  fullName: string
  phone?: string | null
  commune?: string | null
  listings: number
  createdAt: number
}

export type AdminListing = Listing & { sellerEmail?: string | null }

export interface AdminOrder {
  id: string
  status: string
  buyerEmail?: string | null
  sellerEmail?: string | null
  createdAt: number
  items: { title: string; price: number; image?: string | null }[]
  total: number
}

export async function fetchAdminStats(): Promise<AdminStats> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminStats<AdminStats>()
}
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminUsers<AdminUser[]>()
}
export async function fetchAdminListings(): Promise<AdminListing[]> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminListings<AdminListing[]>()
}
export async function deleteAdminListing(id: string): Promise<void> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminDeleteListing(id)
}
export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  if (!isPhp) throw new Error(NOT_SUPPORTED)
  return php.phpAdminOrders<AdminOrder[]>()
}
