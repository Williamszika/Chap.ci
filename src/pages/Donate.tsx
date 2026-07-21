import { useState } from 'react'
import { Copy, Check, Phone, ShieldCheck } from 'lucide-react'
import { donationOperators, suggestedAmounts, donationCopy } from '../data/donation'
import { formatFCFA, formatPrice } from '../lib/format'
import { PayLogo } from '../components/PayLogo'

/** Encode un code USSD pour un lien tel: (# -> %23, * -> %2A) */
function ussdLink(code: string): string {
  return 'tel:' + code.replace(/#/g, '%23').replace(/\*/g, '%2A')
}

export function Donate() {
  // « 2 500 » sélectionné par défaut, comme l'artifact.
  const [amount, setAmount] = useState<number | null>(2500)
  const [isCustom, setIsCustom] = useState(false)
  const [custom, setCustom] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [method, setMethod] = useState(donationOperators[0].id)

  const chosenAmount = isCustom ? (custom ? Number(custom) : null) : amount
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
    <div className="min-h-screen pb-16">
      <div className="mx-auto w-full max-w-5xl px-4 pt-5 md:px-6 md:pt-7">
        {/* En-tête centré de l'artifact : 🧡 + titre + accroche */}
        <header className="flex flex-col items-center text-center">
          <div className="text-[40px] leading-none" aria-hidden>🧡</div>
          <h1 className="mt-2 font-display text-[22px] font-extrabold text-ink md:text-[26px]">
            {donationCopy.title}
          </h1>
          <p className="mt-1 max-w-md text-[13px] text-gray-500 md:text-sm">{donationCopy.subtitle}</p>
        </header>

        <div className="mt-7 space-y-6">
          {/* Montant — grille 3 colonnes de l'artifact, « Autre » en tuile */}
          <section>
            <p className="mb-2 text-sm font-semibold text-gray-700">Montant</p>
            <div className="grid grid-cols-3 gap-2.5">
              {suggestedAmounts.map((a) => {
                const active = !isCustom && amount === a
                return (
                  <button
                    key={a}
                    onClick={() => {
                      setAmount(a)
                      setIsCustom(false)
                      setCustom('')
                    }}
                    aria-pressed={active}
                    className={`rounded-xl border-[1.5px] py-3.5 text-center font-display text-[15px] font-extrabold transition ${
                      active
                        ? 'border-primary-500 bg-[#FFF6EC] text-primary-700'
                        : 'border-[#E6DAC6] bg-white text-ink hover:bg-[#FFFBF4]'
                    }`}
                  >
                    {formatPrice(a)}
                  </button>
                )
              })}
              <button
                onClick={() => setIsCustom(true)}
                aria-pressed={isCustom}
                className={`rounded-xl border-[1.5px] py-3.5 text-center font-display text-[15px] font-extrabold transition ${
                  isCustom
                    ? 'border-primary-500 bg-[#FFF6EC] text-primary-700'
                    : 'border-[#E6DAC6] bg-white text-ink hover:bg-[#FFFBF4]'
                }`}
              >
                Autre
              </button>
            </div>
            {isCustom && (
              <input
                inputMode="numeric"
                autoFocus
                value={custom}
                onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))}
                placeholder="Votre montant (FCFA)"
                className="input mt-2.5"
              />
            )}
            {chosenAmount ? (
              <p className="mt-2 text-center text-sm text-gray-500">
                Vous allez faire un don de{' '}
                <span className="tnum font-bold text-primary-600">{formatFCFA(chosenAmount)}</span>.
              </p>
            ) : null}
          </section>

          {/* Moyen de paiement — 4 tuiles compactes de l'artifact */}
          <section>
            <p className="mb-2 text-sm font-semibold text-gray-700">Moyen de paiement</p>
            <div className="grid grid-cols-2 gap-2.5">
              {donationOperators.map((o) => {
                const active = o.id === method
                return (
                  <button
                    key={o.id}
                    onClick={() => setMethod(o.id)}
                    aria-pressed={active}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-3 transition ${
                      active
                        ? 'border-primary-500 bg-[#FFF6EC]'
                        : 'border-[#E6DAC6] bg-white hover:bg-[#FFFBF4]'
                    }`}
                  >
                    <PayLogo id={o.id} className="h-6 w-6" />
                    <span className="text-[13px] font-extrabold text-gray-700">{o.name}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Numéro Mobile Money (numéro Chap.ci à créditer) */}
          <section>
            <p className="mb-2 text-sm font-semibold text-gray-700">Numéro Mobile Money</p>
            <div className="flex items-center gap-3 rounded-xl border border-[#E6DAC6] bg-white px-4 py-3.5">
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

          {/* Pourquoi faire un don / Sécurité — côte à côte sur grand écran */}
          <div className="grid gap-3 lg:grid-cols-2">
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

            <section className="card p-5">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-gray-900">
                <ShieldCheck size={18} className="text-primary-500" /> Sécurité &amp; transparence
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{donationCopy.transparency}</p>
            </section>
          </div>

          {/* Remerciement */}
          <p className="pt-1 text-center font-display text-base font-semibold text-primary-600">
            {donationCopy.thankYou}
          </p>
        </div>
      </div>
    </div>
  )
}
