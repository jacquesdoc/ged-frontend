import { useEffect, useState, useRef } from 'react'
import { profileService } from '../services/api'
import { useAuthStore } from '../store/authStore'

interface ProfileData {
  user: {
    id: number
    name: string
    email: string
    avatar: string | null
    avatar_url: string
    department: string | null
    position: string | null
    last_login_at: string | null
    roles: string[]
    storage_used: number
    storage_quota: number
    storage_used_percent: number
    formatted_storage_used: string
    formatted_storage_quota: string
    email_notifications: boolean
    created_at: string
  }
  stats: {
    documents_created: number
    documents_approved: number
    documents_rejected: number
    workflows_submitted: number
    workflows_approved: number
  }
  activity: Array<{
    description: string
    created_at: string
    log_name: string
  }>
  sessions: Array<{
    id: number
    name: string
    last_used_at: string | null
    created_at: string
    is_current: boolean
  }>
}

export default function ProfilePage() {
  const [data,        setData]        = useState<ProfileData | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [activeTab,   setActiveTab]   = useState('info')
  const { setAuth, token } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)

  // Formulaire infos
  const [formName,    setFormName]    = useState('')
  const [formEmail,   setFormEmail]   = useState('')
  const [formDept,    setFormDept]    = useState('')
  const [formPos,     setFormPos]     = useState('')
  const [savingInfo,  setSavingInfo]  = useState(false)
  const [infoMsg,     setInfoMsg]     = useState('')
  const [infoError,   setInfoError]   = useState('')

  // Formulaire mot de passe
  const [curPwd,      setCurPwd]      = useState('')
  const [newPwd,      setNewPwd]      = useState('')
  const [confPwd,     setConfPwd]     = useState('')
  const [savingPwd,   setSavingPwd]   = useState(false)
  const [pwdMsg,      setPwdMsg]      = useState('')
  const [pwdError,    setPwdError]    = useState('')

  // Notifications
  const [emailNotif,  setEmailNotif]  = useState(true)
  const [savingNotif, setSavingNotif] = useState(false)
  const [notifMsg,    setNotifMsg]    = useState('')

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const { data: res } = await profileService.get()
      setData(res)
      setFormName(res.user.name)
      setFormEmail(res.user.email)
      setFormDept(res.user.department || '')
      setFormPos(res.user.position || '')
      setEmailNotif(res.user.email_notifications)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfile() }, [])

  // ── Upload avatar ───────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { data: res } = await profileService.uploadAvatar(file)
      setData(prev => prev ? {
        ...prev,
        user: { ...prev.user, avatar_url: res.avatar_url }
      } : prev)
      // Mettre à jour le store
      if (data) {
        setAuth({ ...data.user, avatar_url: res.avatar_url } as any, token!)
      }
    } catch (err) { console.error(err) }
  }

  // ── Sauvegarder infos ───────────────────────────────────────────────────
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingInfo(true)
    setInfoMsg('')
    setInfoError('')
    try {
      const { data: res } = await profileService.update({
        name: formName, email: formEmail,
        department: formDept, position: formPos,
      })
      setData(prev => prev ? { ...prev, user: res.user } : prev)
      setAuth(res.user as any, token!)
      setInfoMsg('Profil mis à jour avec succès !')
    } catch (err: any) {
      const errors = err.response?.data?.errors
      if (errors) {
        setInfoError(Object.values(errors).flat().join(' '))
      } else {
        setInfoError(err.response?.data?.message || 'Erreur.')
      }
    } finally {
      setSavingInfo(false)
    }
  }

  // ── Changer mot de passe ────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPwd !== confPwd) { setPwdError('Les mots de passe ne correspondent pas.'); return }
    setSavingPwd(true)
    setPwdMsg('')
    setPwdError('')
    try {
      const { data: res } = await profileService.changePassword({
        current_password:      curPwd,
        password:              newPwd,
        password_confirmation: confPwd,
      })
      setPwdMsg(res.message)
      setCurPwd('')
      setNewPwd('')
      setConfPwd('')
      fetchProfile()
    } catch (err: any) {
      const errors = err.response?.data?.errors
      if (errors) {
        setPwdError(Object.values(errors).flat().join(' '))
      } else {
        setPwdError(err.response?.data?.message || 'Erreur.')
      }
    } finally {
      setSavingPwd(false)
    }
  }

  // ── Préférences notifications ───────────────────────────────────────────
  const handleSaveNotif = async () => {
    setSavingNotif(true)
    setNotifMsg('')
    try {
      await profileService.updateNotifications({ email_notifications: emailNotif })
      setNotifMsg('Préférences sauvegardées !')
    } catch (err) { console.error(err) }
    finally { setSavingNotif(false) }
  }

  // ── Révoquer session ────────────────────────────────────────────────────
  const handleRevokeSession = async (id: number) => {
    if (!window.confirm('Révoquer cette session ?')) return
    try {
      await profileService.revokeSession(id)
      fetchProfile()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.')
    }
  }

  const handleRevokeAll = async () => {
    if (!window.confirm('Révoquer toutes les autres sessions ?')) return
    try {
      await profileService.revokeAllSessions()
      fetchProfile()
    } catch (err) { console.error(err) }
  }

  const tabs = [
    { id: 'info',     icon: '👤', label: 'Informations' },
    { id: 'security', icon: '🔒', label: 'Sécurité' },
    { id: 'stats',    icon: '📊', label: 'Statistiques' },
    { id: 'activity', icon: '🕐', label: 'Activité' },
    { id: 'notif',    icon: '🔔', label: 'Notifications' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!data) return null

  const { user, stats, activity, sessions } = data

  return (
    <div className="min-h-screen bg-gray-50">

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
            ← Retour
            </button>
            <div>
            <h1 className="text-xl font-bold text-gray-900">Mon profil</h1>
            <p className="text-sm text-gray-500">Gérez vos informations personnelles et vos préférences</p>
            </div>
        </div>
        </div>

      <div className="max-w-4xl mx-auto px-6 py-6">

        {/* Carte profil principal */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-green-100">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-green-700 text-3xl font-bold">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center text-sm hover:bg-green-800 transition-colors shadow"
                title="Changer la photo"
              >
                📷
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={handleAvatarChange} />
            </div>

            {/* Infos principales */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold capitalize">
                  {user.roles?.[0]}
                </span>
                {user.department && (
                  <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
                    🏢 {user.department}
                  </span>
                )}
                {user.position && (
                  <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
                    💼 {user.position}
                  </span>
                )}
              </div>
              {user.last_login_at && (
                <p className="text-xs text-gray-400 mt-2">
                  Dernière connexion : {new Date(user.last_login_at).toLocaleString('fr-FR')}
                </p>
              )}
            </div>

            {/* Stockage */}
            <div className="flex-shrink-0 w-40">
              <div className="text-xs text-gray-500 mb-1 flex justify-between">
                <span>Stockage</span>
                <span>{user.storage_used_percent}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    user.storage_used_percent > 80 ? 'bg-red-500' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(user.storage_used_percent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {user.formatted_storage_used} / {user.formatted_storage_quota}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 flex-wrap">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-white text-green-700 shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Informations ────────────────────────────────────────────── */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-5">
              Informations personnelles
            </h3>
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input type="email" value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Département
                  </label>
                  <input type="text" value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    placeholder="Ex: Ressources Humaines"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poste / Fonction
                  </label>
                  <input type="text" value={formPos}
                    onChange={(e) => setFormPos(e.target.value)}
                    placeholder="Ex: Chef de projet"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none" />
                </div>
              </div>

              {infoMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
                  ✅ {infoMsg}
                </div>
              )}
              {infoError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {infoError}
                </div>
              )}

              <div className="flex justify-end">
                <button type="submit" disabled={savingInfo}
                  className="px-6 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold rounded-xl text-sm transition-colors">
                  {savingInfo ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Tab Sécurité ─────────────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="space-y-6">

            {/* Changer mot de passe */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-900 mb-5">
                🔑 Changer le mot de passe
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe actuel <span className="text-red-500">*</span>
                  </label>
                  <input type="password" value={curPwd}
                    onChange={(e) => setCurPwd(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau mot de passe <span className="text-red-500">*</span>
                  </label>
                  <input type="password" value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer <span className="text-red-500">*</span>
                  </label>
                  <input type="password" value={confPwd}
                    onChange={(e) => setConfPwd(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none" />
                </div>

                {pwdMsg && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
                    ✅ {pwdMsg}
                  </div>
                )}
                {pwdError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                    {pwdError}
                  </div>
                )}

                <button type="submit" disabled={savingPwd}
                  className="px-6 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold rounded-xl text-sm transition-colors">
                  {savingPwd ? 'Modification...' : 'Changer le mot de passe'}
                </button>
              </form>
            </div>

            {/* Sessions actives */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-gray-900">
                  💻 Sessions actives ({sessions.length})
                </h3>
                {sessions.filter(s => !s.is_current).length > 0 && (
                  <button onClick={handleRevokeAll}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-semibold transition-colors">
                    Révoquer tout
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      session.is_current
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">💻</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800">
                            {session.name}
                          </p>
                          {session.is_current && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                              Session actuelle
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          Créée le {new Date(session.created_at).toLocaleDateString('fr-FR')}
                          {session.last_used_at && (
                            <> · Dernière utilisation {new Date(session.last_used_at).toLocaleString('fr-FR')}</>
                          )}
                        </p>
                      </div>
                    </div>
                    {!session.is_current && (
                      <button onClick={() => handleRevokeSession(session.id)}
                        className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold">
                        Révoquer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Statistiques ─────────────────────────────────────────────── */}
        {activeTab === 'stats' && (
          <div className="space-y-6">

            {/* Cartes stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Documents créés',     value: stats.documents_created,   icon: '📄', color: 'text-blue-700',   bg: 'bg-blue-50' },
                { label: 'Documents approuvés', value: stats.documents_approved,  icon: '✅', color: 'text-green-700',  bg: 'bg-green-50' },
                { label: 'Documents rejetés',   value: stats.documents_rejected,  icon: '❌', color: 'text-red-700',    bg: 'bg-red-50' },
                { label: 'Workflows soumis',    value: stats.workflows_submitted, icon: '🔄', color: 'text-purple-700', bg: 'bg-purple-50' },
                { label: 'Workflows approuvés', value: stats.workflows_approved,  icon: '🎯', color: 'text-amber-700',  bg: 'bg-amber-50' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-2xl p-5`}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Stockage détaillé */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">💾 Stockage utilisé</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{user.formatted_storage_used} utilisés</span>
                <span className="text-sm text-gray-600">{user.formatted_storage_quota} total</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    user.storage_used_percent > 80 ? 'bg-red-500' :
                    user.storage_used_percent > 60 ? 'bg-amber-500' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(user.storage_used_percent, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                {user.storage_used_percent}% du quota utilisé
              </p>
            </div>

            {/* Infos compte */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">ℹ️ Informations du compte</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Membre depuis</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(user.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Dernière connexion</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleString('fr-FR')
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Activité ─────────────────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-5">
              🕐 Activité récente
            </h3>
            {activity.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-400 text-sm">Aucune activité enregistrée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold flex-shrink-0">
                      {user.name?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{a.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {new Date(a.created_at).toLocaleString('fr-FR')}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full capitalize">
                          {a.log_name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab Notifications ────────────────────────────────────────────── */}
        {activeTab === 'notif' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-5">
              🔔 Préférences de notification
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Notifications par email
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Recevoir des emails pour les workflows, approbations et rejets
                  </p>
                </div>
                <button
                  onClick={() => setEmailNotif(!emailNotif)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    emailNotif ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    emailNotif ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {notifMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
                  ✅ {notifMsg}
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={handleSaveNotif} disabled={savingNotif}
                  className="px-6 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold rounded-xl text-sm transition-colors">
                  {savingNotif ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}