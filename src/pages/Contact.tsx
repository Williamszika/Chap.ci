import { useState, type FormEvent } from 'react'
import { User, Mail, ChevronDown, Loader2, CheckCircle2 } from 'lucide-react'
import { phpContact } from '../lib/php'

const CONTACT_EMAIL = 'contact@chap.ci'

const SUBJECTS = [
  'Question générale',
  'Signaler un problème',
  'Aide & support (compte, paiement)',
  'Partenariat / presse',
  'Suggestion',
]

export function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('Signaler un problème')
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('') // pot de miel anti-robot (doit rester vide)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // Envoi RÉEL : le message part côté serveur vers contact@chap.ci (et une copie
  // est conservée en base). Plus de simple « mailto » qui dépendait de l'appli mail.
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!message.trim()) return setError('Veuillez écrire votre message.')
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError('Adresse email invalide.')
    setBusy(true)
    try {
      await phpContact({ name: name.trim(), email: email.trim(), subject, message: message.trim(), company })
      setSent(true)
      setName('')
      setEmail('')
      setMessage('')
    } catch {
      // Repli : proposer l'email direct si l'envoi serveur échoue.
      setError('Envoi impossible pour le moment. Vous pouvez aussi écrire directement à contact@chap.ci.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Héro « info-hero » de l'artifact — dégradé orange doux, titre centré */}
      <section className="bg-[linear-gradient(160deg,#FFF6EC,#FFFDF9)] px-5 py-9 text-center md:-mx-6 md:py-12">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink md:text-[34px]">
          Nous contacter
        </h1>
        <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-relaxed text-[#57534E] md:mt-3">
          Une question, un souci ? On gère ça pour vous.
        </p>
      </section>

      <div className="px-4 py-8 md:px-6 md:py-10">
        {sent ? (
          /* Confirmation après envoi réussi */
          <div className="mx-auto max-w-5xl rounded-2xl border border-ivoire-green/30 bg-ivoire-green/5 p-8 text-center">
            <CheckCircle2 className="mx-auto text-ivoire-green" size={44} />
            <p className="mt-3 font-display text-lg font-bold text-ink">Message envoyé&nbsp;!</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">
              Merci, nous avons bien reçu votre message. Notre équipe revient vers vous rapidement.
            </p>
            <button onClick={() => setSent(false)} className="btn-outline mt-5">
              Envoyer un autre message
            </button>
          </div>
        ) : (
          /* Formulaire de contact — pleine largeur (comme l'artifact) */
          <form onSubmit={onSubmit} className="mx-auto max-w-5xl space-y-4">
            {/* Pot de miel anti-robot : champ caché hors écran, ignoré des humains */}
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            <div>
              <label htmlFor="c-name" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Votre nom
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-accent-sky"
                />
                <input
                  id="c-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aya Koffi"
                  autoComplete="name"
                  className="input pl-11"
                />
              </div>
            </div>

            <div>
              <label htmlFor="c-email" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-accent-sky"
                />
                <input
                  id="c-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aya.koffi@email.ci"
                  autoComplete="email"
                  className="input pl-11"
                />
              </div>
            </div>

            <div>
              <label htmlFor="c-subject" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Sujet
              </label>
              <div className="relative">
                <select
                  id="c-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input appearance-none pr-11"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="c-message" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Message
              </label>
              <textarea
                id="c-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Bonjour, je voudrais…"
                className="input min-h-[130px] resize-y leading-relaxed"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3.5 text-[15px]">
              {busy ? <Loader2 size={20} className="animate-spin" /> : 'Envoyer le message'}
            </button>
          </form>
        )}

        {/* Moyens de contact directs — cartes « val » de l'artifact */}
        <div className="mx-auto mt-5 grid max-w-5xl grid-cols-2 gap-3">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="rounded-[14px] border border-[#EFE6D7] bg-white p-4 shadow-[0_1px_3px_rgba(60,40,10,0.09),0_1px_2px_rgba(60,40,10,0.05)] transition active:scale-[0.99] hover:border-primary-300 hover:bg-primary-50/40"
          >
            <div className="text-[26px] leading-none" aria-hidden>✉️</div>
            <p className="mt-2 font-display text-sm font-bold text-ink">Email</p>
            <p className="mt-1 truncate text-[13px] text-gray-500">{CONTACT_EMAIL}</p>
          </a>

          <div className="rounded-[14px] border border-[#EFE6D7] bg-white p-4 shadow-[0_1px_3px_rgba(60,40,10,0.09),0_1px_2px_rgba(60,40,10,0.05)]">
            <div className="text-[26px] leading-none" aria-hidden>🟢</div>
            <p className="mt-2 font-display text-sm font-bold text-ink">WhatsApp</p>
            <p className="mt-1 truncate text-[13px] text-gray-500">+225 07 •• •• ••</p>
          </div>
        </div>
      </div>
    </div>
  )
}
