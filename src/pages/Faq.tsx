import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Search, HelpCircle, MessageSquare } from 'lucide-react'

type QA = { q: string; a: React.ReactNode }
type Section = { title: string; icon: string; items: QA[] }

const sections: Section[] = [
  {
    title: 'Général',
    icon: '👋',
    items: [
      {
        q: 'C’est quoi Chap.ci ?',
        a: 'Chap.ci est le site de petites annonces 100 % ivoirien. Vous y achetez et vendez chap-chap (rapidement) partout en Côte d’Ivoire : voitures, téléphones, immobilier, mode, alimentation, services et bien plus.',
      },
      {
        q: 'Est-ce que c’est gratuit ?',
        a: 'Oui, l’inscription, la publication d’annonces et la messagerie sont entièrement gratuites. Vous pouvez soutenir la plateforme par un don Mobile Money si vous le souhaitez, mais rien n’est obligatoire.',
      },
      {
        q: 'Dois-je installer une application ?',
        a: (
          <>
            Non. Chap.ci fonctionne dans votre navigateur, sur téléphone, tablette et ordinateur. Vous pouvez
            aussi l’ajouter à votre écran d’accueil pour l’utiliser comme une application :{' '}
            <b>iPhone</b> (Safari → Partager → « Sur l’écran d’accueil ») ou <b>Android</b> (Chrome → menu ⋮ →
            « Installer l’application »).
          </>
        ),
      },
      {
        q: 'Dans quelles villes fonctionne Chap.ci ?',
        a: 'Partout en Côte d’Ivoire. Vous pouvez filtrer les annonces par district, région, ville et commune — d’Abidjan à Bouaké, San-Pédro, Yamoussoukro, Korhogo…',
      },
    ],
  },
  {
    title: 'Mon compte',
    icon: '🔐',
    items: [
      {
        q: 'Comment créer un compte ?',
        a: (
          <>
            Cliquez sur <b>Connexion / Créer un compte</b>, puis inscrivez-vous par email, par téléphone, ou avec
            Google/Apple. C’est gratuit et immédiat.
          </>
        ),
      },
      {
        q: 'J’ai oublié mon mot de passe, que faire ?',
        a: (
          <>
            Sur la page de connexion, cliquez sur <b>« Mot de passe oublié ? »</b> et suivez les instructions
            reçues par email pour en choisir un nouveau.
          </>
        ),
      },
      {
        q: 'Comment supprimer mon compte ?',
        a: (
          <>
            Allez dans <b>Compte → Paramètres → Supprimer mon compte</b>. Une confirmation par mot de passe est
            demandée. La suppression est définitive : vos annonces et données sont effacées.
          </>
        ),
      },
      {
        q: 'Comment protéger mon compte ?',
        a: (
          <>
            Activez la <b>double authentification (2FA)</b> depuis <b>Compte → Paramètres</b>, et ne partagez
            jamais votre mot de passe. Chap.ci ne vous demandera jamais votre mot de passe par message.
          </>
        ),
      },
    ],
  },
  {
    title: 'Acheter',
    icon: '🛍️',
    items: [
      {
        q: 'Comment contacter un vendeur ?',
        a: (
          <>
            Ouvrez l’annonce et cliquez sur <b>« Contacter le vendeur »</b>. Vous discutez via la messagerie
            intégrée, sans divulguer votre numéro de téléphone.
          </>
        ),
      },
      {
        q: 'Puis-je négocier le prix ?',
        a: 'Oui, si l’annonce indique « négociable ». Proposez votre prix poliment dans la messagerie. Restez courtois : un bon échange conclut souvent une bonne affaire.',
      },
      {
        q: 'Comment payer en toute sécurité ?',
        a: (
          <>
            Privilégiez le <b>paiement à la livraison</b> ou la remise en main propre dans un lieu public.
            Vérifiez toujours l’article <b>avant</b> de payer. Évitez d’envoyer de l’argent à l’avance à une
            personne que vous ne connaissez pas.
          </>
        ),
      },
      {
        q: 'Comment confirmer un achat et laisser un avis ?',
        a: (
          <>
            Comme la transaction se fait de la main à la main (Mobile Money, espèces…), c’est vous qui la
            confirmez. Dans la <b>conversation</b> avec le vendeur : cliquez sur <b>« J’ai acheté »</b>, puis
            <b> « Bien reçu »</b> une fois l’article en main. Vous pouvez alors <b>noter le vendeur</b> ⭐.
            Le vendeur, de son côté, peut vous noter en tant qu’acheteur. Si vous oubliez, on vous envoie un
            petit rappel par email.
          </>
        ),
      },
      {
        q: 'Comment enregistrer une recherche pour être prévenu ?',
        a: (
          <>
            Dans l’explorateur, réglez vos filtres puis cliquez sur <b>« Créer une alerte »</b>. Vous recevrez un
            email dès qu’une nouvelle annonce correspond. Retrouvez vos alertes dans <b>Compte → Paramètres →
            Mes alertes</b>.
          </>
        ),
      },
    ],
  },
  {
    title: 'Vendre',
    icon: '🏷️',
    items: [
      {
        q: 'Comment publier une annonce ?',
        a: (
          <>
            Cliquez sur <b>Publier</b>, ajoutez des photos, choisissez la catégorie, remplissez le titre, le prix
            et la description, puis publiez. Le formulaire s’adapte à la catégorie (marque, année, surface…) pour
            des annonces plus précises.
          </>
        ),
      },
      {
        q: 'Combien de photos puis-je ajouter et comment les réussir ?',
        a: 'Ajoutez plusieurs photos nettes, en pleine lumière, sous différents angles. Une bonne première photo attire beaucoup plus d’acheteurs. Les images sont automatiquement optimisées lors de l’envoi.',
      },
      {
        q: 'Comment modifier, masquer ou supprimer mon annonce ?',
        a: (
          <>
            Depuis <b>Compte → Mes annonces</b>, chaque annonce peut être <b>modifiée</b>, <b>masquée</b> (mise
            en pause sans la supprimer) puis <b>ré-affichée</b>, ou <b>supprimée</b> définitivement.
          </>
        ),
      },
      {
        q: 'Comment vendre plus vite ?',
        a: 'Mettez un prix juste, une description honnête et complète, de bonnes photos, et répondez vite aux messages. Un vendeur réactif et bien noté inspire confiance et conclut plus rapidement.',
      },
    ],
  },
  {
    title: 'Sécurité & confiance',
    icon: '🛡️',
    items: [
      {
        q: 'Comment éviter les arnaques ?',
        a: (
          <>
            Ne payez jamais à l’avance une personne inconnue, méfiez-vous des prix anormalement bas, rencontrez
            en <b>lieu public</b>, vérifiez l’article avant de payer, et gardez vos échanges <b>dans la
            messagerie</b> Chap.ci. En cas de doute, n’allez pas plus loin.
          </>
        ),
      },
      {
        q: 'Comment signaler une annonce ou un utilisateur suspect ?',
        a: (
          <>
            Sur chaque annonce, utilisez le bouton <b>« Signaler »</b> et indiquez le motif. Notre équipe de
            modération examine les signalements. Une annonce trop signalée est automatiquement masquée en
            attendant vérification.
          </>
        ),
      },
      {
        q: 'À quoi servent les avis ?',
        a: 'Après une transaction, l’acheteur peut laisser un avis au vendeur. Les avis vérifiés aident toute la communauté à acheter en confiance. Un bon historique d’avis valorise votre profil vendeur.',
      },
    ],
  },
  {
    title: 'Paiement & don',
    icon: '💚',
    items: [
      {
        q: 'Quels moyens de paiement sont acceptés ?',
        a: 'Les paiements se font directement entre acheteur et vendeur, généralement par Mobile Money (Orange Money, MTN MoMo, Wave), en espèces à la livraison, ou en main propre. Chap.ci ne prélève rien sur vos ventes.',
      },
      {
        q: 'Comment soutenir Chap.ci ?',
        a: (
          <>
            Chap.ci est gratuit et indépendant. Vous pouvez nous soutenir par un don Mobile Money depuis la page{' '}
            <Link to="/don" className="font-semibold text-primary-600 underline">
              Faire un don
            </Link>
            . Merci à celles et ceux qui aident la plateforme à grandir 🇨🇮
          </>
        ),
      },
    ],
  },
]

function Item({ qa, open, onToggle }: { qa: QA; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="text-[15px] font-semibold text-gray-800">{qa.q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="pb-4 pr-6 text-[14px] leading-relaxed text-gray-600">{qa.a}</p>
      )}
    </div>
  )
}

export function Faq() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  // Clé d'ouverture = "sectionIndex:itemIndex". La 1re question est ouverte par défaut.
  const [openKey, setOpenKey] = useState<string | null>('0:0')

  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

  const filtered = useMemo(() => {
    const nq = norm(query.trim())
    if (!nq) return sections
    return sections
      .map((s) => ({
        ...s,
        items: s.items.filter((it) => norm(it.q).includes(nq) || norm(String(it.a)).includes(nq)),
      }))
      .filter((s) => s.items.length > 0)
  }, [query])

  return (
    <div className="min-h-screen bg-white pb-16 md:mx-auto md:my-6 md:min-h-0 md:max-w-3xl md:overflow-hidden md:rounded-3xl md:shadow-card lg:max-w-5xl xl:max-w-6xl">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-3">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-bold">Aide & FAQ</h1>
      </header>

      {/* Héro */}
      <div className="bg-gradient-to-b from-primary-500 to-primary-600 px-6 py-8 text-center text-white">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/20">
          <HelpCircle size={30} />
        </span>
        <h2 className="mt-3 font-display text-2xl font-extrabold">Comment pouvons-nous vous aider ?</h2>
        <p className="mx-auto mt-1 max-w-md text-white/85">
          Trouvez rapidement une réponse à vos questions sur l’achat, la vente et la sécurité sur Chap.ci.
        </p>
        <div className="mx-auto mt-4 flex max-w-md items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm">
          <Search size={18} className="text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une question…"
            className="w-full bg-transparent text-[15px] text-gray-800 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="px-4 py-6 md:px-6">
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-4xl">🔎</p>
            <p className="mt-2 font-semibold text-gray-700">Aucune réponse trouvée</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500">
              Essayez d’autres mots, ou contactez-nous directement — on vous répond vite.
            </p>
          </div>
        ) : (
          // Ordinateur / tablette : rubriques réparties sur 2 colonnes (masonry).
          <div className="md:columns-2 md:gap-5 lg:gap-6 md:[&>*]:break-inside-avoid">
            {filtered.map((section, si) => (
              <section key={section.title} className="mb-5">
                <h3 className="mb-1 flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-wide text-gray-500">
                  <span>{section.icon}</span> {section.title}
                </h3>
                <div className="rounded-2xl bg-gray-50/70 px-4">
                  {section.items.map((qa, ii) => {
                    const key = `${si}:${ii}`
                    return (
                      <Item
                        key={key}
                        qa={qa}
                        open={openKey === key}
                        onToggle={() => setOpenKey(openKey === key ? null : key)}
                      />
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Bloc contact */}
        <div className="mt-4 rounded-2xl border border-primary-100 bg-primary-50 p-5 text-center md:mx-auto md:mt-6 md:max-w-2xl">
          <p className="font-bold text-primary-900">Vous n’avez pas trouvé votre réponse ?</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-primary-800/80">
            Notre équipe est là pour vous aider. Écrivez-nous, on revient vers vous rapidement.
          </p>
          <Link to="/contact" className="btn-primary mt-3 inline-flex">
            <MessageSquare size={18} /> Nous contacter
          </Link>
        </div>
      </div>
    </div>
  )
}
