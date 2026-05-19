import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/api'

export default function Sidebar() {
  const navigate               = useNavigate()
  const { user, logout, isAdmin } = useAuthStore()

  const handleLogout = async () => {
    try { await authService.logout() } catch {}
    logout()
    navigate('/login')
  }

  const sections = [
    {
      label: 'Principal',
      items: [
        { path: '/dashboard', label: 'Tableau de bord', show: true },
        { path: '/documents', label: 'Documents',        show: true },
        { path: '/folders',   label: 'Dossiers',         show: true },
        { path: '/workflows', label: 'Workflows',         show: true },
      ]
    },
    {
      label: 'Recherche & IA',
      items: [
        { path: '/chat-search', label: 'Recherche IA', show: true },
        //{ path: '/chat-search',    label: 'Recherche IA',        show: true },
        { path: '/semantic-search',label: 'Recherche semantique', show: true },
      ]
    },
    {
      label: 'Administration',
      items: [
        { path: '/users',   label: 'Utilisateurs',    show: isAdmin() },
        { path: '/groups',  label: 'Groupes',          show: isAdmin() },
        { path: '/audit',   label: 'Journal d\'audit', show: isAdmin() },
      ]
    },
    {
      label: 'Compte',
      items: [
        { path: '/profile', label: 'Mon profil', show: true },
      ]
    },
  ]

    return (
    <aside className="w-60 bg-green-950 flex flex-col h-screen flex-shrink-0">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-green-900">
        <p className="text-white font-bold text-sm tracking-wide">GED Platform</p>
        <p className="text-green-400 text-xs font-semibold mt-0.5">IVOPREST</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {sections.map((section) => {
          const visibleItems = section.items.filter(item => item.show)
          if (visibleItems.length === 0) return null
          return (
            <div key={section.label}>
              {/* Label section */}
              <p className="text-xs font-bold uppercase tracking-widest px-3 mb-1.5"
                style={{ color: '#2A5A3C' }}>
                {section.label}
              </p>
              {/* Items */}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-green-700 text-white'
                          : 'text-green-300 hover:bg-green-900 hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Utilisateur connecté */}
      <div className="px-4 py-4 border-t border-green-900">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-green-400 text-xs capitalize">{user?.roles?.[0]}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-red-400 border border-red-900 rounded-xl hover:bg-red-950 transition-colors">
          Deconnexion
        </button>
      </div>
    </aside>
  )
}