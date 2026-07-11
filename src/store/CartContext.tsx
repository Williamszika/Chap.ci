import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import type { CartItem, Listing } from '../types'

const LS_CART = 'chapci.cart.v1'

interface CartState {
  items: CartItem[]
  count: number
  add: (listing: Listing) => void
  remove: (listingId: string) => void
  clear: () => void
  has: (listingId: string) => boolean
  /** Regroupe les articles par vendeur */
  bySeller: { sellerId: string; sellerName: string; items: CartItem[]; total: number }[]
  total: number
}

const CartContext = createContext<CartState | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(LS_CART)
      return raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(LS_CART, JSON.stringify(items))
  }, [items])

  const add = useCallback((l: Listing) => {
    if (!l.sellerId) return
    setItems((prev) =>
      prev.some((i) => i.listingId === l.id)
        ? prev
        : [
            ...prev,
            {
              listingId: l.id,
              title: l.title,
              price: l.price,
              image: l.images[0],
              sellerId: l.sellerId!,
              sellerName: l.sellerName,
            },
          ],
    )
  }, [])

  const remove = useCallback((listingId: string) => {
    setItems((prev) => prev.filter((i) => i.listingId !== listingId))
  }, [])

  const clear = useCallback(() => setItems([]), [])
  const has = useCallback((listingId: string) => items.some((i) => i.listingId === listingId), [items])

  const bySeller = useMemo(() => {
    const map = new Map<string, { sellerId: string; sellerName: string; items: CartItem[]; total: number }>()
    for (const it of items) {
      const g = map.get(it.sellerId) ?? {
        sellerId: it.sellerId,
        sellerName: it.sellerName,
        items: [],
        total: 0,
      }
      g.items.push(it)
      g.total += it.price
      map.set(it.sellerId, g)
    }
    return [...map.values()]
  }, [items])

  const total = useMemo(() => items.reduce((s, i) => s + i.price, 0), [items])

  return (
    <CartContext.Provider value={{ items, count: items.length, add, remove, clear, has, bySeller, total }}>
      {children}
    </CartContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartState {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart doit être utilisé dans <CartProvider>')
  return ctx
}
