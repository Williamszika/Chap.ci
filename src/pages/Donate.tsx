import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Phone, Heart, ShieldCheck, ExternalLink, Gift } from 'lucide-react'
import {
  donationOperators,
  suggestedAmounts,
  donationCopy,
  type DonationOperator,
} from '../data/donation'
import { formatFCFA, formatPrice } from '../lib/format'

/** Encode un code USSD pour un lien tel: (# -> %23, * -> %2A) */
function ussdLink(code: string): string {
  return 'tel:' + code.replace(/#/g, '%23').replace(/\*/g, '%2A')
}

export function Donate() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState<number | null>(null)
  const [custom, setCustom] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const chosenAmount = amount ?? (custom ? Number(custom) : null)

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* le presse-papier peut être bloqué */
    }
    setCopied(id)
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800)
  }

  return (
    <div className="min-h-screen bg-[#FFF6EA] pb-10 md:mx-auto md:my-6 md:min-h-0 md:max-w-3xl md:overflow-hidden md:rounded-3xl md:bg-white md:shadow-card lg:max-w-5xl">
      {/* En-tête */}
      <header className="safe-top bg-gradient-to-b from-primary-500 to-primary-600 px-4 pb-6 pt-3 text-white">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-bold">{donationCopy.title}</h1>
        </div>
        <div className="mt-4 flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20">
            <Gift size={34} />
          </div>
          <p className="mt-3 max-w-xs text-sm text-white/90">{donationCopy.subtitle}</p>
        </div>
      </header>

      <div className="space-y-6 px-4 py-5 md:px-6">
        {/* Ordinateur / tablette : 2 colonnes (pourquoi + montant · opérateurs). Mobile : une colonne. */}
        <div className="space-y-6 md:grid md:grid-cols-2 md:items-start md:gap-5 md:space-y-0 lg:gap-6">
          {/* Colonne gauche : pourquoi + choix du montant */}
          <div className="space-y-6">
            {/* Pourquoi donner */}
            <section className="card p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
                <Heart size={16} className="text-red-500" /> Pourquoi faire un don ?
              </p>
              <ul className="space-y-1.5">
                {donationCopy.why.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check size={16} className="mt-0.5 shrink-0 text-ivoire-green" />
                    {w}
                  </li>
                ))}
              </ul>
            </section>

            {/* Montant suggéré */}
            <section>
              <p className="mb-2 text-sm font-bold text-gray-800">Choisissez un montant (facultatif)</p>
              <div className="grid grid-cols-3 gap-2">
                {suggestedAmounts.map((a) => (
                  <button
                    key={a}
                    onClick={() => {
                      setAmount(a)
                      setCustom('')
                    }}
                    className={`chip justify-center py-2.5 ${
                      amount === a ? 'border-primary-500 bg-primary-500 text-white' : ''
                    }`}
                  >
                    {formatPrice(a)}
                  </button>
                ))}
              </div>
              <input
                inputMode="numeric"
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value.replace(/\D/g, ''))
                  setAmount(null)
                }}
                placeholder="Autre montant (FCFA)"
                className="input mt-2"
              />
              {chosenAmount ? (
                <p className="mt-2 text-center text-sm text-gray-600">
                  Vous allez envoyer{' '}
                  <span className="tnum font-bold text-primary-600">{formatFCFA(chosenAmount)}</span>{' '}
                  via l’un des moyens ci-dessous.
                </p>
              ) : null}
            </section>
          </div>

          {/* Colonne droite : opérateurs */}
          <section className="space-y-3">
            <p className="text-sm font-bold text-gray-800">Envoyer par Mobile Money</p>
            {donationOperators.map((op) => (
              <OperatorCard
                key={op.id}
                op={op}
                amount={chosenAmount}
                copied={copied}
                onCopy={copy}
              />
            ))}
          </section>
        </div>

        {/* Transparence (pleine largeur) */}
        <section className="rounded-2xl bg-amber-50 p-4">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-amber-800">
            <ShieldCheck size={16} /> Sécurité & transparence
          </p>
          <p className="text-xs leading-relaxed text-amber-700">{donationCopy.transparency}</p>
        </section>

        <p className="pt-2 text-center text-sm font-semibold text-gray-700">
          {donationCopy.thankYou}
        </p>
      </div>
    </div>
  )
}

function OperatorCard({
  op,
  amount,
  copied,
  onCopy,
}: {
  op: DonationOperator
  amount: number | null
  copied: string | null
  onCopy: (text: string, id: string) => void
}) {
  const plainNumber = op.number.replace(/\s/g, '')
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: op.color + '18' }}>
        <span
          className="grid h-10 w-10 place-items-center rounded-full text-lg"
          style={{ backgroundColor: op.color, color: '#fff' }}
        >
          {op.emoji}
        </span>
        <div className="flex-1">
          <p className="font-bold text-gray-900">{op.name}</p>
          <p className="text-xs text-gray-500">{op.accountName}</p>
        </div>
      </div>

      <div className="px-4 py-3">
        {/* Numéro + copier */}
        <div className="flex items-center justify-between rounded-xl border border-[#E6DAC6] px-3 py-2.5">
          <span className="font-mono text-[15px] font-semibold tracking-tight text-gray-800">
            {op.number}
          </span>
          <button
            onClick={() => onCopy(plainNumber, op.id)}
            className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 active:scale-95"
          >
            {copied === op.id ? (
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

        <p className="mt-2 text-xs leading-relaxed text-gray-500">{op.howTo}</p>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {op.paymentLink ? (
            <a
              href={op.paymentLink}
              target="_blank"
              rel="noreferrer"
              className="btn-primary flex-1 py-2.5 text-sm"
              style={{ backgroundColor: op.color }}
            >
              <ExternalLink size={16} /> Payer avec {op.name}
            </a>
          ) : op.ussd ? (
            <a href={ussdLink(op.ussd)} className="btn-outline flex-1 py-2.5 text-sm">
              <Phone size={16} /> Composer {op.ussd}
            </a>
          ) : null}
        </div>
        {amount ? (
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Montant à saisir : {formatFCFA(amount)}
          </p>
        ) : null}
      </div>
    </div>
  )
}
