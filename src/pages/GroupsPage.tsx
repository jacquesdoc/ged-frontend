import { useEffect, useState } from 'react'
import { groupService, userService, folderService } from '../services/api'

interface Group {
  id: number
  name: string
  description: string
  color: string
  members_count: number
  members?: Array<{ id: number; name: string; email: string }>
}

export default function GroupsPage() {
  const [groups,      setGroups]      = useState<Group[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [selected,    setSelected]    = useState<Group | null>(null)
  const [users,       setUsers]       = useState<any[]>([])
  const [folders,     setFolders]     = useState<any[]>([])
  const [pending,     setPending]     = useState<any[]>([])

  // Formulaire
  const [formName,    setFormName]    = useState('')
  const [formDesc,    setFormDesc]    = useState('')
  const [formColor,   setFormColor]   = useState('#2E7D32')
  const [formUsers,   setFormUsers]   = useState<number[]>([])
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  // Modal accès dossier
  const [showAccess,  setShowAccess]  = useState<Group | null>(null)
  const [folderId,    setFolderId]    = useState('')
  const [permission,  setPermission]  = useState('view')

  const colors = ['#2E7D32','#1565C0','#6A1B9A','#C62828','#E65100','#37474F']

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [grpRes, pendRes] = await Promise.all([
        groupService.list(),
        groupService.pendingAccess(),
      ])
      setGroups(grpRes.data)
      setPending(pendRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = async () => {
    setSelected(null)
    setFormName(''); setFormDesc('')
    setFormColor('#2E7D32'); setFormUsers([])
    setError('')
    setShowModal(true)
    const { data } = await userService.list()
    setUsers(data.data || data)
  }

  const openEdit = async (group: Group) => {
    setSelected(group)
    setFormName(group.name)
    setFormDesc(group.description || '')
    setFormColor(group.color || '#2E7D32')
    setFormUsers(group.members?.map(m => m.id) || [])
    setError('')
    setShowModal(true)
    const { data } = await userService.list()
    setUsers(data.data || data)
  }

  const toggleUser = (id: number) => {
    setFormUsers(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) { setError('Le nom est obligatoire.'); return }
    setSaving(true); setError('')
    try {
      const data = {
        name: formName, description: formDesc,
        color: formColor, user_ids: formUsers,
      }
      if (selected) {
        await groupService.update(selected.id, data)
      } else {
        await groupService.create(data)
      }
      setShowModal(false)
      fetchAll()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce groupe ?')) return
    try { await groupService.delete(id); fetchAll() }
    catch (err: any) { alert(err.response?.data?.message || 'Erreur.') }
  }

  const openAccess = async (group: Group) => {
    setShowAccess(group)
    setFolderId(''); setPermission('view')
    const { data } = await folderService.list()
    setFolders(data)
  }

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folderId) return
    try {
      await groupService.grantFolderAccess(showAccess!.id, {
        folder_id: parseInt(folderId),
        permission,
      })
      setShowAccess(null)
      fetchAll()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.')
    }
  }

  const handleApprove = async (groupId: number, folderId: number) => {
    try {
      await groupService.approveAccess(groupId, folderId)
      fetchAll()
    } catch (err) { console.error(err) }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Groupes d'utilisateurs</h1>
            <p className="text-sm text-gray-500">{groups.length} groupe(s)</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition-colors"
          >
            <span className="text-lg">+</span> Nouveau groupe
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Demandes d'accès en attente */}
        {pending.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">⏳</span>
              <h2 className="font-bold text-amber-800">
                {pending.length} demande(s) d'accès en attente
              </h2>
            </div>
            <div className="space-y-2">
              {pending.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-amber-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Groupe <strong>{p.group_name}</strong> → Dossier <strong>{p.folder_name}</strong>
                    </p>
                    <p className="text-xs text-gray-400">Permission : {p.permission}</p>
                  </div>
                  <button
                    onClick={() => handleApprove(p.user_group_id, p.folder_id)}
                    className="px-3 py-1.5 bg-green-700 text-white text-xs font-semibold rounded-lg hover:bg-green-800"
                  >
                    ✓ Approuver
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liste des groupes */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-gray-500 font-medium">Aucun groupe</p>
            <p className="text-gray-400 text-sm mt-1">Créez des groupes pour gérer les accès aux dossiers</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div key={group.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: group.color + '20' }}
                    >
                      🏢
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{group.name}</h3>
                      {group.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{group.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(group)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >✏️</button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >🗑️</button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    👥 {group.members_count ?? 0} membre(s)
                  </span>
                  <button
                    onClick={() => openAccess(group)}
                    className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-semibold transition-colors"
                  >
                    📁 Accès dossiers
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal création / édition groupe */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {selected ? 'Modifier le groupe' : 'Nouveau groupe'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du groupe <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Groupe Finance"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c} type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${formColor === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membres
                </label>
                <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3">
                  {users.map((u) => (
                    <label key={u.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 rounded-lg">
                      <input
                        type="checkbox"
                        checked={formUsers.includes(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="w-4 h-4 accent-green-700"
                      />
                      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                        {u.name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold rounded-xl text-sm transition-colors">
                  {saving ? 'Enregistrement...' : selected ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal accès dossier */}
      {showAccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Accès dossier — {showAccess.name}
              </h2>
              <button onClick={() => setShowAccess(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <form onSubmit={handleGrantAccess} className="p-6 space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dossier <span className="text-red-500">*</span>
                </label>
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none bg-white"
                >
                  <option value="">Sélectionner un dossier...</option>
                  {folders.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permission</label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none bg-white"
                >
                  <option value="view">Lecture seule</option>
                  <option value="edit">Lecture et écriture</option>
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700">
                  ⚠️ Si vous n'êtes pas administrateur, cette demande sera soumise pour validation.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAccess(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl text-sm transition-colors">
                  Accorder l'accès
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}