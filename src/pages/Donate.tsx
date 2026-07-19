import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Phone, Heart, ShieldCheck } from 'lucide-react'
import { donationOperators, suggestedAmounts, donationCopy } from '../data/donation'
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
  const [method, setMethod] = useState(donationOperators[0].id)

  const chosenAmount = amount ?? (custom ? Number(custom) : null)
  const op = donationOperators.find((o) => o.id === method) ?? donationOperators[0]
  const plainNumber = op.number.replace(/\s/g, '')
  const donateLabel = `Faire un don${chosenAmount ? ` de ${formatFCFA(chosenAmount)}` : ''}`

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
    <div className="min-h-screen bg-[#FFF6EA] pb-16">
      <div className="mx-auto w-full max-w-xl px-4 pt-4 sm:pt-6 md:max-w-3xl md:px-6 lg:max-w-6xl lg:px-8 lg:pt-8">
        {/* Retour */}
        <button
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-black/5"
        >
          <ArrowLeft size={20} />
        </button>

        {/* En-tête / héros */}
        <header className="flex flex-col items-center text-center">
          <Heart size={44} strokeWidth={1.5} className="fill-primary-500 text-primary-500" />
          <h1 className="mt-3 font-display text-3xl font-extrabold text-gray-900">
            {donationCopy.title}
          </h1>
          <p className="mt-2 max-w-md text-[15px] text-gray-500">{donationCopy.subtitle}</p>
        </header>

        {/* Formulaire de don */}
        <div className="mx-auto mt-8 max-w-2xl space-y-7 lg:max-w-none">
          {/* Montant */}
          <section>
            <p className="mb-3 text-sm font-bold text-gray-800">Montant</p>
            <div className="grid grid-cols-3 gap-3">
              {suggestedAmounts.map((a) => {
                const active = amount === a
                return (
                  <button
                    key={a}
                    onClick={() => {
                      setAmount(a)
                      setCustom('')
                    }}
                    aria-pressed={active}
                    className={`rounded-2xl border py-4 text-center font-display text-lg font-bold transition ${
                      active
                        ? 'border-primary-500 bg-primary-50 text-primary-600'
                        : 'border-[#EFE6D7] bg-white text-gray-900 hover:bg-[#FFFBF4]'
                    }`}
                  >
                    {formatPrice(a)}
                  </button>
                )
              })}
            </div>
            <input
              inputMode="numeric"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value.replace(/\D/g, ''))
                setAmount(null)
              }}
              placeholder="Autre montant (FCFA)"
              className="input mt-3"
            />
            {chosenAmount ? (
              <p className="mt-2 text-center text-sm text-gray-500">
                Vous allez faire un don de{' '}
                <span className="tnum font-bold text-primary-600">{formatFCFA(chosenAmount)}</span>.
              </p>
            ) : null}
          </section>

          {/* Moyen de paiement */}
          <section>
            <p className="mb-3 text-sm font-bold text-gray-800">Moyen de paiement</p>
            <div className="grid grid-cols-4 gap-3">
              {donationOperators.map((o) => {
                const active = o.id === method
                return (
                  <button
                    key={o.id}
                    onClick={() => setMethod(o.id)}
                    aria-pressed={active}
                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl border px-1 py-4 transition ${
                      active
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-[#EFE6D7] bg-white hover:bg-[#FFFBF4]'
                    }`}
                  >
                    <span
                      className={
                        o.id === 'moov'
                          ? 'h-6 w-6 rotate-45 rounded-[4px]'
                          : 'h-8 w-8 rounded-full'
                      }
                      style={{ backgroundColor: o.color }}
                    />
                    <span className="text-sm font-semibold text-gray-800">
                      {o.name.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Numéro Mobile Money (numéro Chap.ci à créditer) */}
          <section>
            <p className="mb-3 text-sm font-bold text-gray-800">Numéro Mobile Money</p>
            <div className="flex items-center gap-3 rounded-2xl border border-[#E6DAC6] bg-white px-4 py-3.5">
              <Phone size={18} className="shrink-0 text-gray-400" />
              <span className="flex-1 font-mono text-[15px] font-semibold tracking-tight text-gray-800">
                {op.number}
              </span>
              <button
                onClick={() => copy(plainNumber, op.id)}
                className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition active:scale-95"
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
          </section>

          {/* Bouton principal : action de l'opérateur sélectionné */}
          {op.paymentLink ? (
            <a
              href={op.paymentLink}
              target="_blank"
              rel="noreferrer"
              className="btn-primary w-full py-4 text-base"
            >
              {donateLabel}
            </a>
          ) : op.ussd ? (
            <a href={ussdLink(op.ussd)} className="btn-primary w-full py-4 text-base">
              {donateLabel}
            </a>
          ) : (
            <button type="button" className="btn-primary w-full py-4 text-base">
              {donateLabel}
            </button>
          )}

          <p className="text-center text-xs text-gray-400">
            Paiement sécurisé · reçu envoyé par SMS
          </p>

          {/* Pourquoi faire un don */}
          <section className="card p-5">
            <h2 className="font-display text-base font-bold text-gray-900">Pourquoi faire un don ?</h2>
            <ul className="mt-3 space-y-2.5">
              {donationCopy.why.map((w) => (
                <li key={w} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <Check size={18} className="mt-0.5 shrink-0 text-ivoire-green" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Sécurité & transparence */}
          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-gray-900">
              <ShieldCheck size={18} className="text-primary-500" /> Sécurité &amp; transparence
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{donationCopy.transparency}</p>
          </section>

          {/* Remerciement */}
          <p className="pt-1 text-center font-display text-base font-semibold text-primary-600">
            {donationCopy.thankYou}
          </p>
        </div>
      </div>
    </div>
  )
}
