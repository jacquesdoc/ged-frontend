import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/api'

export default function Sidebar() {
  const navigate              = useNavigate()
  const { user, logout, isAdmin } = useAuthStore()

  const handleLogout = async () => {
    try { await authService.logout() } catch {}
    logout()
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard',  icon: '🏠', label: 'Tableau de bord',   show: true },
    { path: '/documents',  icon: '📄', label: 'Documents',          show: true },
    { path: '/folders',    icon: '📁', label: 'Dossiers',           show: true },
    { path: '/workflows',  icon: '🔄', label: 'Workflows',          show: true },
    { path: '/audit',      icon: '🛡️', label: 'Journal d\'audit',  show: isAdmin() },
    { path: '/users',      icon: '👥', label: 'Utilisateurs',       show: isAdmin() },
    { path: '/groups',     icon: '🏢', label: 'Groupes',            show: isAdmin() },
  ]

  return (
    <aside className="w-60 bg-green-950 flex flex-col h-screen flex-shrink-0">

      {/* Logo */}
      <div className="px-5 py-6 border-b border-green-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center text-white text-lg">
            📁
          </div>
          <div>
            <p className="text-white font-bold text-sm">GED Platform</p>
            <p className="text-green-400 text-xs font-semibold">IVOPREST</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.filter(item => item.show).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-700 text-white'
                  : 'text-green-300 hover:bg-green-900 hover:text-white'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Utilisateur connecté */}
      <div className="px-4 py-4 border-t border-green-900">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0] ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-green-400 text-xs capitalize">{user?.roles?.[0]}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-red-400 border border-red-900 rounded-xl hover:bg-red-950 transition-colors"
        >
          🚪 Déconnexion
        </button>
      </div>
    </aside>
  )
}