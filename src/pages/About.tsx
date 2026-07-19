import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, MapPin, MessageSquare, Tag, Sparkles, HeartHandshake } from 'lucide-react'
import { Wordmark } from '../components/Logo'

// Bloc « valeurs » du mockup : 4 cartes emoji, punchy, juste sous le héro.
const values = [
  { e: '⚡', t: 'Chap-chap', d: 'Publier et vendre en quelques minutes, sans friction.' },
  { e: '🛡️', t: 'En confiance', d: 'Contacts masqués, avis vérifiés, comptes sécurisés.' },
  { e: '🇨🇮', t: '100 % ivoirien', d: 'Pensé pour la Côte d’Ivoire, ses villes et ses paiements.' },
  { e: '📱', t: 'Mobile Money', d: 'Orange, MTN, Wave, Moov — comme dans la vraie vie.' },
]

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
    <div className="pb-6">
      {/* Héro — dégradé crème chaud, titre display centré (mockup) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-100 to-cream-200 px-6 pb-12 pt-14 text-center md:-mx-6 md:pb-16 md:pt-20">
        <button
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-[#EFE6D7] bg-white/80 text-ink shadow-card backdrop-blur transition active:scale-95 md:hidden"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="mx-auto max-w-2xl font-display text-[34px] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl md:text-6xl">
          <Wordmark />, c’est nous 🧡
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-600 sm:text-lg">
          La marketplace 100 % ivoirienne qui connecte acheteurs et vendeurs, de Cocody à Korhogo. Vendre chap-chap, en confiance.
        </p>
      </section>

      <div className="px-4 sm:px-6">
        {/* Valeurs (mockup) — 2 colonnes sur mobile, 4 sur grand écran */}
        <section className="mt-1">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.t} className="card flex flex-col p-5">
                <div className="text-[26px] leading-none" aria-hidden>{v.e}</div>
                <p className="mt-4 font-display text-lg font-bold text-ink">{v.t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{v.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Notre mission */}
        <section className="mx-auto mt-12 max-w-3xl text-center">
          <h2 className="font-display text-xl font-bold text-ink">Notre mission</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
            Chap.ci connecte les Ivoiriens pour acheter et vendre plus facilement, où qu’ils soient.
            Notre objectif : une plateforme <b className="font-semibold text-ink">simple</b>, <b className="font-semibold text-ink">sûre</b> et <b className="font-semibold text-ink">rapide</b> — pensée pour nos réalités,
            nos villes, nos communes et nos moyens de paiement (Orange, MTN, Wave).
          </p>
        </section>

        {/* Pourquoi Chap.ci ? */}
        <section className="mx-auto mt-12 max-w-5xl">
          <h2 className="text-center font-display text-xl font-bold text-ink">Pourquoi Chap.ci ?</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {points.map((p) => (
              <div key={p.title} className="card p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-100 text-primary-600">{p.icon}</span>
                <p className="mt-3 font-display font-bold text-ink">{p.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comment ça marche ? */}
        <section className="mx-auto mt-12 max-w-4xl">
          <h2 className="text-center font-display text-xl font-bold text-ink">Comment ça marche ?</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3 md:gap-5">
            {steps.map((s) => (
              <div key={s.n} className="card flex items-start gap-3 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-b from-primary-500 to-primary-700 text-sm font-bold text-white shadow-[0_4px_10px_-4px_rgba(247,127,0,0.6)]">{s.n}</span>
                <div>
                  <p className="font-display font-semibold text-ink">{s.t}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-500">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mx-auto mt-12 flex max-w-xl flex-col gap-3 sm:flex-row">
          <Link to="/publier" className="btn-primary flex-1">Publier une annonce</Link>
          <Link to="/explorer" className="btn-outline flex-1">Explorer les annonces</Link>
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          Une question ? <Link to="/contact" className="font-semibold text-primary-600">Contactez-nous</Link>
        </p>
      </div>
    </div>
  )
}
