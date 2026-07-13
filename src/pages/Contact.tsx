import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, LifeBuoy, MessageSquare } from 'lucide-react'
import { Mark, Wordmark } from '../components/Logo'
import { Newsletter } from '../components/Newsletter'

const CONTACT_EMAIL = 'contact@chap.ci'
const SUPPORT_EMAIL = 'support@chap.ci'

export function Contact() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white pb-16">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-bold">Nous contacter</h1>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-6">
        <div className="mb-6 flex flex-col items-center text-center">
          <Mark size={48} />
          <Wordmark className="mt-2 text-xl text-ink" />
          <p className="mt-2 text-sm text-gray-500">
            Une question, un souci, une suggestion ? Nous sommes là pour vous aider.
          </p>
        </div>

        <div className="space-y-3">
          <ContactCard
            icon={<Mail size={22} />}
            title="Contact général"
            desc="Questions, partenariats, presse…"
            email={CONTACT_EMAIL}
          />
          <ContactCard
            icon={<LifeBuoy size={22} />}
            title="Aide & support"
            desc="Problème sur une annonce, un compte, un paiement…"
            email={SUPPORT_EMAIL}
          />
        </div>

        <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
          <p className="flex items-center gap-2 font-semibold text-gray-800">
            <MessageSquare size={16} /> Astuce
          </p>
          <p className="mt-1">
            Pour discuter d’une annonce précise, utilisez le bouton{' '}
            <b>« Contacter le vendeur »</b> sur la page de l’annonce : votre échange reste au même
            endroit dans <b>Messages</b>.
          </p>
        </div>

        <div className="mt-8">
          <Newsletter />
        </div>

        <p className="mt-8 text-center text-xs text-gray-400">
          Chap.ci — 100 % ivoirien 🇨🇮 · Réponse sous 24–48 h ouvrées.
        </p>
      </div>
    </div>
  )
}

function ContactCard({
  icon,
  title,
  desc,
  email,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  email: string
}) {
  return (
    <a
      href={`mailto:${email}`}
      className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition active:scale-[0.99] hover:border-primary-300 hover:bg-primary-50/40"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-gray-900">{title}</span>
        <span className="block text-sm text-gray-500">{desc}</span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-primary-600">{email}</span>
      </span>
    </a>
  )
}
