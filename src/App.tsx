import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { BottomNav } from './components/BottomNav'
import { TopNav } from './components/TopNav'
import { Footer } from './components/Footer'
import { LocationGate } from './components/LocationGate'
import { NewsletterPrompt } from './components/NewsletterPrompt'
import { FestiveOverlay } from './components/FestiveOverlay'
import { NativeShell } from './components/NativeShell'
import { useAuth } from './store/AuthContext'
import { trackPageView } from './lib/track'
import { Home } from './pages/Home'
import { Browse } from './pages/Browse'
import { ListingDetail } from './pages/ListingDetail'
import { Favorites } from './pages/Favorites'
import { Profile } from './pages/Profile'
import { Donate } from './pages/Donate'
import { Advertise } from './pages/Advertise'
import { AdDetail } from './pages/AdDetail'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Welcome } from './pages/Welcome'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { Privacy } from './pages/Privacy'
import { Terms } from './pages/Terms'
import { Contact } from './pages/Contact'
import { AdminDashboard } from './pages/AdminDashboard'
import { Messages } from './pages/Messages'
import { Conversation } from './pages/Conversation'
import { SellerProfile } from './pages/SellerProfile'
import { About } from './pages/About'
import { Faq } from './pages/Faq'
import { Notifications } from './pages/Notifications'

// « Publier une annonce » est chargée à la demande (lazy) : elle tire un gros
// module d'analyse d'image (nsfw, ~2,8 Mo) qui ne doit PAS peser sur l'accueil.
// Seuls les visiteurs qui publient le téléchargent.
const PostAd = lazy(() => import('./pages/PostAd').then((m) => ({ default: m.PostAd })))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    trackPageView(pathname) // suivi anonyme des visites
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
      <ScrollToTop />
      <RecoveryGate />
      <TopNav />
      <div className="relative mx-auto flex min-h-screen max-w-app flex-col overflow-x-clip bg-cream-200 md:max-w-[1280px] md:bg-transparent md:px-6 md:shadow-none">
        <main className="flex-1 pb-20 md:pb-10 md:pt-4">
          <Suspense fallback={<div className="py-20 text-center text-gray-400">Chargement…</div>}>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explorer" element={<Browse />} />
          <Route path="/annonce/:id" element={<ListingDetail />} />
          <Route path="/publier" element={<PostAd />} />
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
          <Route path="/conditions" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="/aide" element={<Faq />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/newsletter" element={<AdminDashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Conversation />} />
          <Route path="/vendeur/:id" element={<SellerProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<Home />} />
          </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
      <BottomNav />
      <NativeShell />
      <LocationGate />
      <NewsletterPrompt />
      {/* Ambiance festive sur tout le site (fête de l'indépendance 🇨🇮) */}
      <FestiveOverlay />
    </div>
  )
}
