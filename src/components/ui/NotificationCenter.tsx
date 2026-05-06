import { useEffect, useState, useRef } from 'react'
import { notificationService } from '../../services/api'

interface Notification {
  id: string
  data: {
    type:        string
    message:     string
    comment:     string | null
    document:    string
    workflow_id: number
    icon:        string
  }
  read_at: string | null
  created_at: string
}

export default function NotificationCenter() {
  const [open,          setOpen]          = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loading,       setLoading]       = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fermer si clic extérieur
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.document.addEventListener('mousedown', handleClick)
    return () => window.document.removeEventListener('mousedown', handleClick)
  }, [])

  // Charger le nombre non lu au démarrage + toutes les 30 secondes
  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnread = async () => {
    try {
      const { data } = await notificationService.unread()
      setUnreadCount(data.count)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const { data } = await notificationService.list()
      setNotifications(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = async () => {
    setOpen(prev => !prev)
    if (!open) await fetchAll()
  }

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAll = async () => {
    try {
      await notificationService.markAll()
      setNotifications(prev => prev.map(n => ({
        ...n,
        read_at: n.read_at || new Date().toISOString()
      })))
      setUnreadCount(0)
    } catch (err) {
      console.error(err)
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'approved':  return 'bg-green-50 border-green-200'
      case 'rejected':  return 'bg-red-50 border-red-200'
      case 'submitted': return 'bg-blue-50 border-blue-200'
      case 'cancelled': return 'bg-gray-50 border-gray-200'
      default:          return 'bg-white border-gray-100'
    }
  }

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (mins < 1)   return 'À l\'instant'
    if (mins < 60)  return `Il y a ${mins} min`
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${days}j`
  }

  return (
    <div className="relative" ref={ref}>

      {/* Bouton cloche */}
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau notifications */}
      {open && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-green-700 font-semibold hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🔔</div>
                <p className="text-sm text-gray-400">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read_at && handleMarkRead(notif.id)}
                  className={`px-5 py-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !notif.read_at ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icône */}
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-base flex-shrink-0 ${getBgColor(notif.data.type)}`}>
                      {notif.data.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Message */}
                      <p className={`text-sm ${!notif.read_at ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notif.data.message}
                      </p>

                      {/* Motif de rejet */}
                      {notif.data.comment && (
                        <div className="mt-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                          <p className="text-xs font-semibold text-red-700 mb-1">
                            Motif du rejet :
                          </p>
                          <p className="text-xs text-red-600 italic">
                            "{notif.data.comment}"
                          </p>
                        </div>
                      )}

                      {/* Temps + lu/non lu */}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-gray-400">
                          {getTimeAgo(notif.created_at)}
                        </span>
                        {!notif.read_at && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                {notifications.length} notification(s) au total
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}