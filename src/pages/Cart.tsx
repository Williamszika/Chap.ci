import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, ShoppingBag, LogIn, Store } from 'lucide-react'
import { useCart } from '../store/CartContext'
import { useAuth } from '../store/AuthContext'
import { placeOrders } from '../lib/checkout'
import { priceLabel, formatPrice } from '../lib/format'

export function Cart() {
  const navigate = useNavigate()
  const { items, bySeller, total, remove, clear } = useCart()
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)

  async function checkout() {
    if (!user) {
      navigate('/connexion')
      return
    }
    setBusy(true)
    try {
      const n = await placeOrders(user.id, bySeller)
      clear()
      alert(
        `✅ Demande envoyée à ${n} vendeur${n > 1 ? 's' : ''} !\nRetrouvez vos échanges dans « Messages ».`,
      )
      navigate('/messages')
    } catch {
      alert('Échec de l’envoi. Vérifiez votre connexion et réessayez.')
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-28">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">Mon panier</h1>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-primary-50">
            <ShoppingBag size={36} className="text-primary-500" />
          </div>
          <p className="text-lg font-bold text-gray-800">Votre panier est vide</p>
          <p className="max-w-xs text-sm text-gray-500">
            Ajoutez des articles au panier, puis envoyez vos demandes d’achat aux vendeurs.
          </p>
          <Link to="/explorer" className="btn-primary mt-2">
            Explorer les annonces
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4 px-4 py-4">
            {bySeller.map((g) => (
              <div key={g.sellerId} className="card overflow-hidden">
                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
                  <Store size={16} className="text-primary-500" />
                  <Link to={`/vendeur/${g.sellerId}`} className="text-sm font-bold text-gray-900">
                    {g.sellerName}
                  </Link>
                  <span className="ml-auto text-xs text-gray-400">
                    {g.items.length} article{g.items.length > 1 ? 's' : ''}
                  </span>
                </div>
                {g.items.map((it) => (
                  <div key={it.listingId} className="flex items-center gap-3 px-3 py-2.5">
                    <Link to={`/annonce/${it.listingId}`} className="flex flex-1 items-center gap-3">
                      {it.image && (
                        <img src={it.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">{it.title}</p>
                        <p className="text-sm font-bold text-primary-600">{priceLabel(it.price)}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => remove(it.listingId)}
                      className="grid h-9 w-9 place-items-center rounded-full text-red-500 hover:bg-red-50"
                      aria-label="Retirer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <div className="flex justify-between border-t border-gray-100 px-4 py-2 text-sm">
                  <span className="text-gray-500">Sous-total</span>
                  <span className="font-bold text-gray-800">{formatPrice(g.total)} FCFA</span>
                </div>
              </div>
            ))}

            <p className="px-1 text-xs text-gray-400">
              Une demande d’achat sera envoyée à chaque vendeur avec la liste de ses articles. Vous
              négociez ensuite directement via la messagerie du site.
            </p>
          </div>

          {/* Barre total + action */}
          <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app border-t border-gray-100 bg-white px-4 py-3 shadow-nav safe-bottom">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Total ({items.length} article{items.length > 1 ? 's' : ''})
              </span>
              <span className="text-lg font-black text-primary-600">{formatPrice(total)} FCFA</span>
            </div>
            {user ? (
              <button onClick={checkout} disabled={busy} className="btn-primary w-full py-3.5 text-base">
                <ShoppingBag size={20} /> {busy ? 'Envoi…' : 'Envoyer les demandes d’achat'}
              </button>
            ) : (
              <button onClick={() => navigate('/connexion')} className="btn-primary w-full py-3.5 text-base">
                <LogIn size={20} /> Se connecter pour acheter
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
