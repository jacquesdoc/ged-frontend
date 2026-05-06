import { useEffect, useState } from 'react'
import { userService } from '../services/api'

interface User {
  id: number
  name: string
  email: string
  created_at: string
  roles: Array<{ name: string }>
}

const roleConfig: Record<string, { label: string; classes: string }> = {
  admin:  { label: 'Administrateur', classes: 'bg-purple-100 text-purple-700' },
  editor: { label: 'Éditeur',        classes: 'bg-green-100 text-green-700' },
  reader: { label: 'Lecteur',        classes: 'bg-blue-100 text-blue-700' },
}

export default function UsersPage() {
  const [users,     setUsers]     = useState<User[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [total,     setTotal]     = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [selected,  setSelected]  = useState<User | null>(null)
  const [showPwd,   setShowPwd]   = useState<User | null>(null)

  // Formulaire création / édition
  const [formName,    setFormName]    = useState('')
  const [formEmail,   setFormEmail]   = useState('')
  const [formRole,    setFormRole]    = useState('editor')
  const [formPwd,     setFormPwd]     = useState('')
  const [formPwdConf, setFormPwdConf] = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  // Formulaire mot de passe
  const [newPwd,     setNewPwd]     = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPwd,  setSavingPwd]  = useState(false)
  const [errorPwd,   setErrorPwd]   = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      const { data } = await userService.list(params)
      setUsers(data.data)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [search])

  const openCreate = () => {
    setSelected(null)
    setFormName('')
    setFormEmail('')
    setFormRole('editor')
    setFormPwd('')
    setFormPwdConf('')
    setError('')
    setShowModal(true)
  }

  const openEdit = (user: User) => {
    setSelected(user)
    setFormName(user.name)
    setFormEmail(user.email)
    setFormRole(user.roles?.[0]?.name || 'editor')
    setFormPwd('')
    setFormPwdConf('')
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formName.trim()) {
      setError('Le nom est obligatoire.')
      return
    }

    if (!selected && !formPwd.trim()) {
      setError('Le mot de passe est obligatoire.')
      return
    }

    if (formPwd && formPwd !== formPwdConf) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (selected) {
        await userService.update(selected.id, {
          name:  formName,
          email: formEmail,
          role:  formRole,
        })
      } else {
        await userService.create({
          name:                  formName,
          email:                 formEmail,
          role:                  formRole,
          password:              formPwd,
          password_confirmation: formPwdConf,
        })
      }
      setShowModal(false)
      fetchUsers()
    } catch (err: any) {
      const errors = err.response?.data?.errors
      if (errors) {
        const first = Object.values(errors)[0] as string[]
        setError(first[0])
      } else {
        setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Supprimer l'utilisateur ${user.name} ?`)) return
    try {
      await userService.delete(user.id)
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPwd !== confirmPwd) {
      setErrorPwd('Les mots de passe ne correspondent pas.')
      return
    }
    setSavingPwd(true)
    setErrorPwd('')
    try {
      await userService.changePassword(showPwd!.id, {
        password:              newPwd,
        password_confirmation: confirmPwd,
      })
      setShowPwd(null)
      setNewPwd('')
      setConfirmPwd('')
    } catch (err: any) {
      setErrorPwd(err.response?.data?.message || 'Erreur.')
    } finally {
      setSavingPwd(false)
    }
  }

  const handleToggleStatus = async (user: User) => {
    if (!window.confirm(`Révoquer toutes les sessions de ${user.name} ?`)) return
    try {
      await userService.toggleStatus(user.id)
      alert('Sessions révoquées avec succès.')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Utilisateurs</h1>
            <p className="text-sm text-gray-500">{total} utilisateur(s)</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition-colors"
          >
            <span className="text-lg">+</span> Nouvel utilisateur
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Recherche */}
        <div className="relative max-w-sm mb-6">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none"
          />
        </div>

        {/* Tableau */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-500 font-medium">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rôle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date création</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => {
                  const roleName = user.roles?.[0]?.name || 'reader'
                  const rc = roleConfig[roleName] || roleConfig.reader
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                            {user.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rc.classes}`}>
                          {rc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(user)}
                            title="Modifier"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >✏️</button>
                          <button
                            onClick={() => { setShowPwd(user); setNewPwd(''); setConfirmPwd(''); setErrorPwd('') }}
                            title="Changer le mot de passe"
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >🔑</button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            title="Révoquer les sessions"
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          >🔒</button>
                          <button
                            onClick={() => handleDelete(user)}
                            title="Supprimer"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal création / édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {selected ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Jean Kouassi"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="jean@entreprise.ci"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none bg-white"
                >
                  <option value="admin">Administrateur</option>
                  <option value="editor">Éditeur</option>
                  <option value="reader">Lecteur</option>
                </select>
              </div>

              {/* Mot de passe uniquement à la création */}
              {!selected && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formPwd}
                      onChange={(e) => setFormPwd(e.target.value)}
                      placeholder="Minimum 8 caractères"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmer le mot de passe <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formPwdConf}
                      onChange={(e) => setFormPwdConf(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  {saving ? 'Enregistrement...' : selected ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal changement mot de passe */}
      {showPwd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Changer le mot de passe</h2>
              <button onClick={() => setShowPwd(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                  {showPwd.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{showPwd.name}</p>
                  <p className="text-xs text-gray-400">{showPwd.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none"
                />
              </div>

              {errorPwd && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {errorPwd}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPwd(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingPwd}
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  {savingPwd ? 'Modification...' : 'Changer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}