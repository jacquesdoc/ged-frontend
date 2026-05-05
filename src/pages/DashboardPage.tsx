import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardService } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function DashboardPage() {
  const navigate  = useNavigate()
  const { user, logout } = useAuthStore()
  const [stats,   setStats]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.stats()
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-700 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">GED Platform</h1>
            <p className="text-xs text-green-700 font-semibold">IVOPREST</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.roles?.[0]}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Tableau de bord</h2>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { label: 'Total documents', value: stats?.documents?.total ?? 0,    color: 'bg-blue-50 text-blue-700' },
            { label: 'En révision',     value: stats?.documents?.review ?? 0,   color: 'bg-amber-50 text-amber-700' },
            { label: 'Approuvés',       value: stats?.documents?.approved ?? 0, color: 'bg-green-50 text-green-700' },
            { label: 'Dossiers',        value: stats?.folders ?? 0,             color: 'bg-purple-50 text-purple-700' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className={`text-3xl font-bold ${card.color.split(' ')[1]}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Activité récente</h3>
          {stats?.recent_activity?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_activity.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-bold">
                    {a.user?.[0] ?? 'S'}
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{a.user}</span> — {a.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(a.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              Aucune activité pour le moment
            </p>
          )}
        </div>
      </main>
    </div>
  )
}