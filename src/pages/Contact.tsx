import { useState, type FormEvent } from 'react'
import { User, Mail, ChevronDown } from 'lucide-react'

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

  // Le formulaire compose un email vers contact@chap.ci (mécanisme mailto).
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const body = `Nom : ${name || '—'}\nEmail : ${email || '—'}\n\n${message}`
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`
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
        {/* Formulaire de contact — pleine largeur (comme l'artifact) */}
        <form onSubmit={onSubmit} className="mx-auto max-w-5xl space-y-4">
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

          <button type="submit" className="btn-primary w-full py-3.5 text-[15px]">
            Envoyer le message
          </button>
        </form>

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
