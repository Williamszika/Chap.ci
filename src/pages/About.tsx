import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, MapPin, MessageSquare, Tag, Sparkles, HeartHandshake } from 'lucide-react'
import { Mark, Wordmark } from '../components/Logo'

const points = [
  { icon: <MapPin size={20} />, title: '100 % ivoirien 🇨🇮', text: 'Pensé pour la Côte d’Ivoire : recherche par district, région, ville et commune, d’Abidjan à San-Pédro.' },
  { icon: <Tag size={20} />, title: 'Acheter & vendre chap-chap', text: 'Publiez une annonce en 2 minutes avec photos. Voitures, téléphones, immobilier, mode, alimentation…' },
  { icon: <MessageSquare size={20} />, title: 'Messagerie intégrée', text: 'Discutez en toute sécurité avec les vendeurs, sans divulguer votre numéro.' },
  { icon: <ShieldCheck size={20} />, title: 'Confiance & sécurité', text: 'Avis vérifiés, signalement des abus et modération active pour des échanges sereins.' },
  { icon: <Sparkles size={20} />, title: 'Suggestions intelligentes', text: 'Des recommandations personnalisées selon ce qui vous intéresse, par email.' },
  { icon: <HeartHandshake size={20} />, title: 'Proche de vous', text: 'Payez à la livraison, rencontrez en lieu public, soutenez la plateforme par Mobile Money.' },
]

const steps = [
  { n: 1, t: 'Créez votre compte', d: 'Gratuit, en quelques secondes.' },
  { n: 2, t: 'Publiez ou explorez', d: 'Mettez une annonce en ligne, ou trouvez la bonne affaire près de chez vous.' },
  { n: 3, t: 'Échangez et concluez', d: 'Contactez le vendeur, convenez d’un prix, finalisez en toute confiance.' },
]

export function About() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white pb-16 md:mx-auto md:my-6 md:min-h-0 md:max-w-3xl md:rounded-3xl md:shadow-card md:overflow-hidden">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-bold">À propos de Chap.ci</h1>
      </header>

      {/* Héro */}
      <div className="bg-gradient-to-b from-primary-500 to-primary-600 px-6 py-10 text-center text-white">
        <Mark size={56} variant="white" />
        <Wordmark className="mt-3 block text-3xl" ci="text-white/80" />
        <p className="mt-3 text-lg font-semibold">Le site de petites annonces 100 % ivoirien</p>
        <p className="mx-auto mt-1 max-w-md text-white/85">
          Achetez et vendez <b>chap-chap</b> partout en Côte d’Ivoire, en toute simplicité et en toute confiance.
        </p>
      </div>

      <div className="px-5 py-7">
        {/* Notre mission */}
        <section>
          <h2 className="text-base font-bold text-gray-900">Notre mission</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
            Chap.ci connecte les Ivoiriens pour acheter et vendre plus facilement, où qu’ils soient.
            Notre objectif : une plateforme <b>simple</b>, <b>sûre</b> et <b>rapide</b> — pensée pour nos réalités,
            nos villes, nos communes et nos moyens de paiement (Orange, MTN, Wave).
          </p>
        </section>

        {/* Points forts */}
        <section className="mt-7">
          <h2 className="text-base font-bold text-gray-900">Pourquoi Chap.ci ?</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {points.map((p) => (
              <div key={p.title} className="rounded-2xl border border-gray-100 p-4 shadow-card">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-100 text-primary-600">{p.icon}</span>
                <p className="mt-2 font-bold text-gray-800">{p.title}</p>
                <p className="mt-0.5 text-sm text-gray-500">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="mt-7">
          <h2 className="text-base font-bold text-gray-900">Comment ça marche ?</h2>
          <div className="mt-3 space-y-3">
            {steps.map((s) => (
              <div key={s.n} className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-500 text-sm font-bold text-white">{s.n}</span>
                <div>
                  <p className="font-semibold text-gray-800">{s.t}</p>
                  <p className="text-sm text-gray-500">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/publier" className="btn-primary flex-1 py-3">Publier une annonce</Link>
          <Link to="/explorer" className="btn-outline flex-1 py-3">Explorer les annonces</Link>
        </div>
        <p className="mt-6 text-center text-sm text-gray-400">
          Une question ? <Link to="/contact" className="font-semibold text-primary-600">Contactez-nous</Link>
        </p>
      </div>
    </div>
  )
}
