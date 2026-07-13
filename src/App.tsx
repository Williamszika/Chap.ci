import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { BottomNav } from './components/BottomNav'
import { LocationGate } from './components/LocationGate'
import { NewsletterPrompt } from './components/NewsletterPrompt'
import { useAuth } from './store/AuthContext'
import { Home } from './pages/Home'
import { Browse } from './pages/Browse'
import { ListingDetail } from './pages/ListingDetail'
import { PostAd } from './pages/PostAd'
import { Favorites } from './pages/Favorites'
import { Profile } from './pages/Profile'
import { Donate } from './pages/Donate'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { Privacy } from './pages/Privacy'
import { Terms } from './pages/Terms'
import { Contact } from './pages/Contact'
import { AdminDashboard } from './pages/AdminDashboard'
import { Messages } from './pages/Messages'
import { Conversation } from './pages/Conversation'
import { SellerProfile } from './pages/SellerProfile'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
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
    <div className="relative mx-auto flex min-h-screen max-w-app flex-col overflow-x-hidden bg-[#f4f5f7]">
      <ScrollToTop />
      <RecoveryGate />
      <main className="flex-1 pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explorer" element={<Browse />} />
          <Route path="/annonce/:id" element={<ListingDetail />} />
          <Route path="/publier" element={<PostAd />} />
          <Route path="/modifier/:id" element={<PostAd />} />
          <Route path="/favoris" element={<Favorites />} />
          <Route path="/compte" element={<Profile />} />
          <Route path="/don" element={<Donate />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
          <Route path="/nouveau-mot-de-passe" element={<ResetPassword />} />
          <Route path="/confidentialite" element={<Privacy />} />
          <Route path="/conditions" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/newsletter" element={<AdminDashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Conversation />} />
          <Route path="/vendeur/:id" element={<SellerProfile />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <BottomNav />
      <LocationGate />
      <NewsletterPrompt />
    </div>
  )
}
