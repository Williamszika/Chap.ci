import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, MessageCircle, ChevronDown } from 'lucide-react'
import { Newsletter } from '../components/Newsletter'

const CONTACT_EMAIL = 'contact@chap.ci'
const SUPPORT_EMAIL = 'support@chap.ci'

const SUBJECTS = [
  'Question générale',
  'Signaler un problème',
  'Aide & support (compte, paiement)',
  'Partenariat / presse',
  'Suggestion',
]

export function Contact() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('Signaler un problème')
  const [message, setMessage] = useState('')

  // Le formulaire compose un email vers contact@chap.ci (même mécanisme mailto
  // que les moyens de contact directs ci-dessous).
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const body = `Nom : ${name || '—'}\nEmail : ${email || '—'}\n\n${message}`
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="min-h-screen bg-white pb-16 md:mx-auto md:my-6 md:min-h-0 md:max-w-3xl md:rounded-3xl md:shadow-card lg:max-w-5xl">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-[#EFE6D7] bg-white/90 backdrop-blur-md px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-bold">Nous contacter</h1>
      </header>

      {/* Héro — dégradé chaud discret, titre + accroche centrés */}
      <div className="bg-gradient-to-b from-primary-50 to-white px-6 py-9 text-center md:py-12">
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Nous contacter
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-gray-500">
          Une question, un souci ? On gère ça pour vous.
        </p>
      </div>

      <div className="px-5 py-6 md:px-8 md:py-8">
        {/* Formulaire de contact */}
        <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-5 lg:max-w-3xl">
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

        {/* Moyens de contact directs */}
        <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 lg:max-w-3xl">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="rounded-2xl border border-[#EFE6D7] bg-white p-4 shadow-card transition active:scale-[0.99] hover:border-primary-300 hover:bg-primary-50/40"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Mail size={22} />
            </span>
            <span className="mt-3 block font-bold text-gray-900">Email</span>
            <span className="block truncate text-sm text-gray-500">{CONTACT_EMAIL}</span>
          </a>

          <div className="rounded-2xl border border-[#EFE6D7] bg-white p-4 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ivoire-green/10 text-ivoire-green">
              <MessageCircle size={22} />
            </span>
            <span className="mt-3 block font-bold text-gray-900">WhatsApp</span>
            <span className="block truncate text-sm text-gray-500">+225 07 •• •• ••</span>
          </div>
        </div>

        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-gray-500 lg:max-w-3xl">
          Un souci de compte, de paiement ou technique ? Écrivez à{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-primary-600">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>

        {/* Newsletter « Bons plans » (conservée) */}
        <div className="mx-auto mt-8 max-w-2xl lg:max-w-3xl">
          <Newsletter />
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Chap.ci — 100 % ivoirien 🇨🇮 · Réponse sous 24–48 h ouvrées.
        </p>
      </div>
    </div>
  )
}
