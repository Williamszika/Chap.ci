import { useState } from 'react'
import { Copy, Check, Phone, ShieldCheck } from 'lucide-react'
import { Sheet } from './Sheet'
import { mobileMoneyOperators, ussdLink } from '../data/mobileMoney'
import { priceLabel } from '../lib/format'
import type { Listing } from '../types'

/**
 * Feuille de paiement « Mobile Money » : l'acheteur envoie le montant au numéro
 * du vendeur depuis son propre opérateur (Orange, MTN, Moov, Wave).
 */
export function PaySheet({
  open,
  onClose,
  listing,
}: {
  open: boolean
  onClose: () => void
  listing: Listing
}) {
  const [copied, setCopied] = useState(false)
  const number = listing.sellerPhone
  const plain = number.replace(/\s/g, '')

  async function copy() {
    try {
      await navigator.clipboard.writeText(plain)
    } catch {
      /* presse-papier bloqué */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Sheet open={open} onClose={onClose} title="💳 Payer par Mobile Money">
      <div className="space-y-4">
        {/* Montant */}
        <div className="rounded-2xl bg-primary-50 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
            Montant à envoyer
          </p>
          <p className="mt-1 text-2xl font-black text-primary-600">
            {priceLabel(listing.price, listing.negotiable)}
          </p>
        </div>

        {/* Numéro du vendeur */}
        <div>
          <p className="mb-1.5 text-sm font-bold text-gray-800">Numéro du vendeur</p>
          <div className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2.5">
            <span className="font-mono text-[15px] font-semibold text-gray-800">{number}</span>
            <button
              onClick={copy}
              className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 active:scale-95"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-ivoire-green" /> Copié
                </>
              ) : (
                <>
                  <Copy size={14} /> Copier
                </>
              )}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            Envoyez le montant à ce numéro depuis votre application Mobile Money, ou composez le
            code de votre opérateur ci-dessous.
          </p>
        </div>

        {/* Opérateurs (composer USSD) */}
        <div>
          <p className="mb-2 text-sm font-bold text-gray-800">Payer depuis mon opérateur</p>
          <div className="grid grid-cols-2 gap-2">
            {mobileMoneyOperators.map((op) => (
              <a
                key={op.id}
                href={ussdLink(op.ussd)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 active:scale-95"
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm"
                  style={{ backgroundColor: op.color, color: '#fff' }}
                >
                  {op.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-gray-800">
                    {op.name}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Phone size={10} /> {op.ussd}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Sécurité */}
        <div className="rounded-2xl bg-amber-50 p-4">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-amber-800">
            <ShieldCheck size={16} /> Payez en toute sécurité
          </p>
          <ul className="ml-1 list-disc space-y-0.5 pl-4 text-xs text-amber-700">
            <li>Vérifiez le produit avant de payer, ou privilégiez le paiement à la livraison.</li>
            <li>Vérifiez le nom du bénéficiaire affiché par votre opérateur.</li>
            <li>Chap.ci ne vous demande jamais votre code secret / PIN.</li>
          </ul>
        </div>
      </div>
    </Sheet>
  )
}
