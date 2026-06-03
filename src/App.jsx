import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import LeaderboardPage from './pages/LeaderboardPage'
import TippenPage from './pages/TippenPage'
import ProfilPage from './pages/ProfilPage'
import AdminPage from './pages/AdminPage'
import BonusTipsPage from './pages/BonusTipsPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <div className="text-brand-gold font-display text-2xl animate-pulse">WM 2026</div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} />
      <Route path="/tippen" element={<PrivateRoute><TippenPage /></PrivateRoute>} />
      <Route path="/profil" element={<PrivateRoute><ProfilPage /></PrivateRoute>} />
      <Route path="/bonus" element={<PrivateRoute><BonusTipsPage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
