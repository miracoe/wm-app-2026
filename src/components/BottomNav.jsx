import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Ranking', icon: '🏆' },
  { to: '/tippen', label: 'Tippen', icon: '⚽' },
  { to: '/bonus', label: 'Bonus', icon: '🎯' },
  { to: '/profil', label: 'Profil', icon: '👤' },
]

export default function BottomNav() {
  const { isAdmin } = useAuth()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-card border-t border-white/10 safe-bottom z-50">
      <div className="flex justify-around py-2">
        {navItems.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${isActive ? 'text-brand-gold' : 'text-white/50'}`
            }>
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-bold">{label}</span>
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${isActive ? 'text-brand-red' : 'text-white/30'}`
            }>
            <span className="text-2xl">⚙️</span>
            <span className="text-xs font-bold">Admin</span>
          </NavLink>
        )}
      </div>
    </nav>
  )
}
