import { useEffect, useState } from 'react'
import { auditService } from '../services/api'

interface Log {
  id: number
  description: string
  log_name: string
  created_at: string
  causer?: { name: string }
  properties?: any
}

interface Stats {
  total: number
  today: number
  this_week: number
  by_module: Array<{ log_name: string; count: number }>
  by_user: Array<{ count: number; causer?: { name: string } }>
}

const moduleColors: Record<string, string> = {
  document: 'bg-blue-100 text-blue-700',
  folder:   'bg-purple-100 text-purple-700',
  workflow: 'bg-amber-100 text-amber-700',
  auth:     'bg-green-100 text-green-700',
  default:  'bg-gray-100 text-gray-700',
}

export default function AuditPage() {
  const [logs,    setLogs]    = useState<Log[]>([])
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [module,  setModule]  = useState('')
  const [dateFrom,setDateFrom]= useState('')
  const [dateTo,  setDateTo]  = useState('')
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [lastPage,setLastPage]= useState(1)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params: any = { page, per_page: 25 }
      if (search)   params.search   = search
      if (module)   params.log_name = module
      if (dateFrom) params.date_from = dateFrom
      if (dateTo)   params.date_to   = dateTo

      const { data } = await auditService.list(params)
      setLogs(data.data)
      setTotal(data.total)
      setLastPage(data.last_page)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data } = await auditService.stats()
      setStats(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [search, module, dateFrom, dateTo, page])

const handleExport = async () => {
  try {
    const params: any = {}
    if (search)   params.search   = search
    if (module)   params.log_name = module
    if (dateFrom) params.date_from = dateFrom
    if (dateTo)   params.date_to   = dateTo

    const { data } = await auditService.export(params)
    const url  = window.URL.createObjectURL(
      new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    )
    const link = document.createElement('a')
    link.href  = url
    link.setAttribute(
      'download',
      `journal-audit-${new Date().toISOString().split('T')[0]}.xlsx`
    )
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error(err)
    alert('Erreur lors de l\'export Excel.')
  }
}

  const getModuleClass = (logName: string) => {
    return moduleColors[logName] || moduleColors.default
  }

  const getActionIcon = (description: string) => {
    if (description.includes('créé'))      return '✅'
    if (description.includes('modifié'))   return '✏️'
    if (description.includes('supprimé'))  return '🗑️'
    if (description.includes('téléchargé'))return '⬇️'
    if (description.includes('archivé'))   return '🗄️'
    if (description.includes('approuvé'))  return '👍'
    if (description.includes('rejeté'))    return '👎'
    if (description.includes('Connexion')) return '🔑'
    return '📋'
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Journal d'audit</h1>
            <p className="text-sm text-gray-500">{total} action(s) enregistrée(s)</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ⬇️ Exporter Excel
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total actions',    value: stats.total,     icon: '📋', color: 'text-gray-900' },
              { label: 'Aujourd\'hui',     value: stats.today,     icon: '📅', color: 'text-blue-700' },
              { label: 'Cette semaine',    value: stats.this_week, icon: '📆', color: 'text-green-700' },
              { label: 'Modules actifs',   value: stats.by_module?.length ?? 0, icon: '🔧', color: 'text-purple-700' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{s.icon}</span>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Recherche */}
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Rechercher une action..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none"
            />
          </div>

          {/* Filtre module */}
          <select
            value={module}
            onChange={(e) => { setModule(e.target.value); setPage(1) }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none bg-white"
          >
            <option value="">Tous les modules</option>
            <option value="document">Documents</option>
            <option value="folder">Dossiers</option>
            <option value="workflow">Workflows</option>
            <option value="auth">Authentification</option>
          </select>

          {/* Date début */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none"
          />

          {/* Date fin */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none"
          />

          {/* Réinitialiser */}
          {(search || module || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearch('')
                setModule('')
                setDateFrom('')
                setDateTo('')
                setPage(1)
              }}
              className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm hover:bg-red-50 transition-colors"
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>

        {/* Tableau */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛡️</div>
            <p className="text-gray-500 font-medium">Aucune action trouvée</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date / Heure</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Module</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(log.created_at).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(log.created_at).toLocaleTimeString('fr-FR')}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold flex-shrink-0">
                            {log.causer?.name?.[0] ?? 'S'}
                          </div>
                          <span className="text-sm font-medium text-gray-800">
                            {log.causer?.name ?? 'Système'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{getActionIcon(log.description)}</span>
                          <span className="text-sm text-gray-700">{log.description}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${getModuleClass(log.log_name)}`}>
                          {log.log_name ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← Précédent
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} / {lastPage}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                  disabled={page === lastPage}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}