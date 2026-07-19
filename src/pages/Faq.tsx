import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Plus, Minus, MessageSquare } from 'lucide-react'

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
        q: 'Comment se passe la livraison ?',
        a: (
          <>
            La livraison est convenue <b>directement entre vous et le vendeur</b> dans la messagerie :
            remise en main propre (idéalement dans un lieu public et fréquenté) ou livraison si le vendeur
            l’a indiquée sur l’annonce (badge <b>« Livraison »</b>). Convenez à l’avance du <b>lieu</b>, de
            l’<b>heure</b> et des éventuels <b>frais de livraison</b>. Chap.ci n’assure pas le transport et
            n’est pas partie à la transaction : privilégiez le paiement au moment de la remise.
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
        q: 'Que faire en cas de litige avec un acheteur ou un vendeur ?',
        a: (
          <>
            Gardez d’abord votre calme et tout l’échange <b>dans la messagerie</b> Chap.ci (il sert de preuve).
            Essayez de trouver un accord à l’amiable. Si la personne ne respecte pas ses engagements,
            <b> signalez</b> l’annonce ou le profil, et écrivez-nous à <b>contact@chap.ci</b> en joignant les
            détails. Chap.ci est un <b>intermédiaire technique</b> et n’est pas partie à la transaction : nous
            ne pouvons pas rembourser, mais nous pouvons <b>sanctionner</b> un membre de mauvaise foi. En cas
            d’escroquerie avérée, déposez plainte auprès de la <b>PLCC</b> (Plateforme de Lutte Contre la
            Cybercriminalité).
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
    <div className={`card overflow-hidden transition-shadow ${open ? 'shadow-card-lg' : ''}`}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-6"
        aria-expanded={open}
      >
        <span className="font-display text-[15px] font-bold text-ink md:text-base">{qa.q}</span>
        <span className={`shrink-0 transition-colors ${open ? 'text-primary-500' : 'text-gray-400'}`}>
          {open ? <Minus size={18} /> : <Plus size={18} />}
        </span>
      </button>
      {open && (
        <p className="px-5 pb-5 text-[14px] leading-relaxed text-gray-600 md:px-6">{qa.a}</p>
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
    <div className="min-h-screen pb-16">
      <header className="safe-top sticky top-0 z-30 flex items-center gap-3 border-b border-[#EFE6D7] bg-white/90 px-3 py-3 backdrop-blur-md">
        <button onClick={() => navigate(-1)} aria-label="Retour" className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-lg font-bold">Aide & FAQ</h1>
      </header>

      {/* Héro — fond crème chaleureux, grand titre d'affichage */}
      <div className="bg-gradient-to-b from-primary-50 via-cream-100 to-transparent px-6 pb-10 pt-10 text-center md:pb-14 md:pt-14">
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl md:text-5xl">
          Questions fréquentes
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-gray-600 md:text-lg">
          Tout ce qu’il faut savoir pour acheter et vendre sereinement.
        </p>
        <div className="mx-auto mt-6 flex max-w-lg items-center gap-2 rounded-xl border border-[#E6DAC6] bg-white px-4 py-3 shadow-card">
          <Search size={18} className="shrink-0 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une question…"
            className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="px-4 py-8 md:px-6 md:py-10">
        {filtered.length === 0 ? (
          <div className="mx-auto max-w-md py-14 text-center">
            <p className="text-4xl">🔎</p>
            <p className="mt-3 font-display font-bold text-ink">Aucune réponse trouvée</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500">
              Essayez d’autres mots, ou contactez-nous directement — on vous répond vite.
            </p>
          </div>
        ) : (
          // Une seule colonne large (mobile → ordinateur), rubriques empilées.
          <div className="mx-auto w-full max-w-3xl space-y-10 md:max-w-5xl lg:max-w-6xl">
            {filtered.map((section, si) => (
              <section key={section.title}>
                <h3 className="mb-3 flex items-center gap-2 px-1 font-display text-sm font-bold uppercase tracking-wide text-gray-500">
                  <span className="text-base">{section.icon}</span> {section.title}
                </h3>
                <div className="space-y-3">
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
        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-primary-100 bg-primary-50 p-6 text-center md:max-w-5xl lg:max-w-6xl">
          <p className="font-display text-lg font-bold text-primary-900">Vous n’avez pas trouvé votre réponse ?</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-primary-800/80">
            Notre équipe est là pour vous aider. Écrivez-nous, on revient vers vous rapidement.
          </p>
          <Link to="/contact" className="btn-primary mt-4 inline-flex">
            <MessageSquare size={18} /> Nous contacter
          </Link>
        </div>
      </div>
    </div>
  )
}
