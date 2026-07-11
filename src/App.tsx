import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { BottomNav } from './components/BottomNav'
import { Home } from './pages/Home'
import { Browse } from './pages/Browse'
import { ListingDetail } from './pages/ListingDetail'
import { PostAd } from './pages/PostAd'
import { Favorites } from './pages/Favorites'
import { Profile } from './pages/Profile'
import { Donate } from './pages/Donate'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
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

export default function App() {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-app flex-col overflow-x-hidden bg-[#f4f5f7]">
      <ScrollToTop />
      <main className="flex-1 pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explorer" element={<Browse />} />
          <Route path="/annonce/:id" element={<ListingDetail />} />
          <Route path="/publier" element={<PostAd />} />
          <Route path="/favoris" element={<Favorites />} />
          <Route path="/compte" element={<Profile />} />
          <Route path="/don" element={<Donate />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Conversation />} />
          <Route path="/vendeur/:id" element={<SellerProfile />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
