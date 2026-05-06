import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/api'
import NotificationCenter from '../ui/NotificationCenter'

export default function Header() {
  const navigate        = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try { await authService.logout() } catch {}
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <NotificationCenter />
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.roles?.[0]}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
        >
          🚪 Déconnexion
        </button>
      </div>
    </header>
  )
}