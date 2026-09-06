import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useSwipeTabs } from './lib/useSwipeTabs'
import { useEffect, lazy, Suspense } from 'react'
import { BottomNav } from './components/BottomNav'
import { SigneDefs } from './components/Logo'
import { TopNav } from './components/TopNav'
import { Footer } from './components/Footer'
import { NewsletterPrompt } from './components/NewsletterPrompt'
import { FestiveOverlay } from './components/FestiveOverlay'
import { CookieConsent } from './components/CookieConsent'
import { NativeShell } from './components/NativeShell'
import { useAuth } from './store/AuthContext'
import { trackPageView } from './lib/track'
import { trackPage } from './lib/marketing'
import { Home } from './pages/Home'
import { Browse } from './pages/Browse'
import { ListingDetail } from './pages/ListingDetail'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
// AdminDashboard est la plus grosse page du dépôt et ne sert qu'au Patron.
// Importée statiquement, elle partait dans le paquet initial de CHAQUE visiteur.
// En chargement différé, elle ne se télécharge qu'à l'ouverture de /admin.
// (Même patron que PostAd ci-dessous ; le <Suspense> global est déjà en place.)

// « Publier une annonce » est chargée à la demande (lazy) : elle tire un gros
// module d'analyse d'image (nsfw, ~2,8 Mo) qui ne doit PAS peser sur l'accueil.
// Seuls les visiteurs qui publient le téléchargent.
const PostAd = lazy(() => import('./pages/PostAd').then((m) => ({ default: m.PostAd })))

// « Mon compte » aussi, malgré son trafic.
//
// Elle était gardée en statique pour rester instantanée — 366 vues sur 30 jours,
// c'est la troisième page du site. Mais elle fait 1 569 lignes, et la garder
// coûtait 13,9 Ko compressés à CHAQUE visiteur, y compris à celui qui ne verra
// jamais son compte parce qu'il n'en a pas. Mesuré par le bureau Performance le
// 2 août : paquet initial 221,08 → 207,21 Ko gzip.
// Le <Suspense> global couvre déjà l'attente, et le fichier reste en cache
// après la première ouverture : le prix n'est payé qu'une fois.
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })))

// Pages secondaires en chargement différé.
//
// Le trafic se concentre sur /, /explorer, /publier et /compte : ces quinze
// écrans-là étaient pourtant téléchargés par CHAQUE visiteur, y compris celui
// qui ne consulte que l'accueil. Mesuré par le bureau Performance le 27/07 :
// le paquet initial passe de 158,8 Ko à 128,1 Ko gzip, soit -30,7 Ko (-19,3 %).
// Sur un forfait data ivoirien, c'est une économie à chaque première visite ;
// dans l'application native, c'est aussi du JavaScript en moins à analyser au
// démarrage sur un téléphone d'entrée de gamme.
// Le <Suspense> global est déjà en place, ces pages ne sont jamais sur le
// chemin du premier rendu.
function L<K extends string>(name: K, load: () => Promise<Record<K, React.ComponentType>>) {
  return lazy(() => load().then((m) => ({ default: m[name] })))
}
const Favorites = L('Favorites', () => import('./pages/Favorites'))
const Donate = L('Donate', () => import('./pages/Donate'))
const Advertise = L('Advertise', () => import('./pages/Advertise'))
const AdDetail = L('AdDetail', () => import('./pages/AdDetail'))
const Assistance = L('Assistance', () => import('./pages/Assistance'))
const Welcome = L('Welcome', () => import('./pages/Welcome'))
const ForgotPassword = L('ForgotPassword', () => import('./pages/ForgotPassword'))
const ResetPassword = L('ResetPassword', () => import('./pages/ResetPassword'))
const Privacy = L('Privacy', () => import('./pages/Privacy'))
const DeleteAccount = L('DeleteAccount', () => import('./pages/DeleteAccount'))
const Terms = L('Terms', () => import('./pages/Terms'))
const Contact = L('Contact', () => import('./pages/Contact'))
const Messages = L('Messages', () => import('./pages/Messages'))
const Conversation = L('Conversation', () => import('./pages/Conversation'))
const SellerProfile = L('SellerProfile', () => import('./pages/SellerProfile'))
const About = L('About', () => import('./pages/About'))
const Faq = L('Faq', () => import('./pages/Faq'))
const EspacePro = L('EspacePro', () => import('./pages/EspacePro'))
const GuidePro = L('GuidePro', () => import('./pages/GuidePro'))
const Notifications = L('Notifications', () => import('./pages/Notifications'))
const SiteMap = L('SiteMap', () => import('./pages/SiteMap'))
const AdminDashboard = lazy(() =>
  import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
)

/** Glissement gauche/droite entre les onglets — application téléphone seulement. */
function SwipeTabs() {
  useSwipeTabs()
  return null
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    trackPageView(pathname) // suivi anonyme des visites (analytics maison)
    trackPage(pathname) // pixels marketing (Meta/TikTok/Google)
  }, [pathname])
  return null
}

/** Redirige vers le formulaire de nouveau mot de passe après un lien de récupération. */
function RecoveryGate() {
  const { recovery } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => {
    if (recovery && pathname !== '/nouveau-mot-de-passe') {
      navigate('/nouveau-mot-de-passe', { replace: true })
    }
  }, [recovery, pathname, navigate])
  return null
}

export default function App() {
  return (
    <div className="min-h-screen bg-cream-200">
      {/* Le dessin du signe, posé UNE FOIS pour toute l'application : chaque
          logo n'en est ensuite qu'une référence. Voir Logo.tsx — la couronne
          compte soixante-huit feuilles, les répéter coûterait au défilement
          sur les téléphones d'entrée de gamme. */}
      <SigneDefs />
      <ScrollToTop />
      <RecoveryGate />
      <SwipeTabs />
      <TopNav />
      <div className="relative mx-auto flex min-h-screen max-w-app flex-col overflow-x-clip bg-cream-200 md:max-w-[1280px] md:bg-transparent md:px-6 md:shadow-none">
        {/* `min-h-[100svh]` sur le contenu lui-même : tant qu'une page charge,
            le pied de page se tenait dans le premier écran, puis descendait de
            deux mille pixels quand le contenu arrivait — un décalage de 0,5 à
            0,65 mesuré sur Vendeur, Aide, Mon compte, Messages (06/09/2026).
            Le pied de page part maintenant sous le pli, et y reste. */}
        <main className="flex-1 min-h-[100svh] pb-20 md:pb-10 md:pt-4">
          <Suspense fallback={<div className="py-20 text-center text-gray-400">Chargement…</div>}>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explorer" element={<Browse />} />
          <Route path="/annonce/:id" element={<ListingDetail />} />
          <Route path="/publier" element={<PostAd />} />
          <Route path="/pro" element={<EspacePro />} />
          {/* Le guide qu'ouvre la notification de nouveauté. Publique : on peut
              le lire avant d'avoir un compte. */}
          <Route path="/guide/pro" element={<GuidePro />} />
          <Route path="/modifier/:id" element={<PostAd />} />
          <Route path="/favoris" element={<Favorites />} />
          <Route path="/compte" element={<Profile />} />
          <Route path="/don" element={<Donate />} />
          <Route path="/publicite" element={<Advertise />} />
          <Route path="/pub/:id" element={<AdDetail />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/bienvenue" element={<Welcome />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
          <Route path="/nouveau-mot-de-passe" element={<ResetPassword />} />
          <Route path="/confidentialite" element={<Privacy />} />
          {/* Publique et sans connexion : exigence Google Play pour la suppression
              de compte. URL à déclarer : https://chap.ci/#/suppression-compte */}
          <Route path="/suppression-compte" element={<DeleteAccount />} />
          <Route path="/conditions" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/a-propos" element={<About />} />
          {/* Plan du site : reprend tous les liens du pied de page, qui se
              réduit à un seul lien sur téléphone et tablette. */}
          <Route path="/plan-du-site" element={<SiteMap />} />
          <Route path="/aide" element={<Faq />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/newsletter" element={<AdminDashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Conversation />} />
          <Route path="/vendeur/:id" element={<SellerProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          {/* La messagerie de l'équipe. Un seul écran pour les trois usages :
              un membre écrit à l'équipe, l'équipe répond, les modérateurs se
              parlent entre eux. Le serveur décide de ce que chacun voit. */}
          <Route path="/assistance" element={<Assistance />} />
          <Route path="/assistance/:id" element={<Assistance />} />
          <Route path="*" element={<Home />} />
          </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
      <BottomNav />
      <NativeShell />
      {/* Plus de rideau « Activer votre position » à l'arrivée (06/09/2026).
          Il recouvrait la première page de chaque visiteur — y compris une
          fiche ouverte depuis WhatsApp, où la bannière cookies venait par-dessus.
          La position se demande là où elle sert : la puce de lieu de l'accueil,
          « Près de moi » dans Explorer, le formulaire de publication. */}
      <NewsletterPrompt />
      {/* Consentement cookies : gouverne les pixels tiers (Meta/TikTok/Google). */}
      <CookieConsent />
      {/* Ambiance festive sur tout le site (fête de l'indépendance 🇨🇮) */}
      <FestiveOverlay />
    </div>
  )
}
