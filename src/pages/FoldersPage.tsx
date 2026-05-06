import { useEffect, useState } from 'react'
import { folderService, groupService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import UploadModal from '../components/documents/UploadModal'

interface Folder {
  id: number
  name: string
  description: string
  color: string
  path: string
  documents_count?: number
  created_at: string
  creator?: { name: string }
  children?: Folder[]
  access_type?: string
  assigned_groups?: Array<{
    id: number
    name: string
    color: string
    permission: string
    status: string
  }>
}

interface AccessRequest {
  id: number
  folder_name: string
  folder_color: string
  user_name: string
  user_email: string
  reason: string
  created_at: string
}

export default function FoldersPage() {
  const [folders,          setFolders]          = useState<Folder[]>([])
  const [loading,          setLoading]          = useState(true)
  const [showModal,        setShowModal]        = useState(false)
  const [selected,         setSelected]         = useState<Folder | null>(null)
  const [selectedFolder,   setSelectedFolder]   = useState<Folder | null>(null)
  const [groups,           setGroups]           = useState<any[]>([])
  const [accessRequests,   setAccessRequests]   = useState<AccessRequest[]>([])
  const [showUpload,       setShowUpload]       = useState(false)

  // Formulaire dossier
  const [formName,    setFormName]    = useState('')
  const [formDesc,    setFormDesc]    = useState('')
  const [formColor,   setFormColor]   = useState('#2E7D32')
  const [formGroups,  setFormGroups]  = useState<number[]>([])
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  // Demande d'accès lecteur
  const [showAccessRequest, setShowAccessRequest] = useState<Folder | null>(null)
  const [accessReason,      setAccessReason]      = useState('')
  const [savingAccess,      setSavingAccess]      = useState(false)

  // Rejet accès
  const [showRejectAccess, setShowRejectAccess] = useState<AccessRequest | null>(null)
  const [rejectReason,     setRejectReason]     = useState('')

  const { isAdmin, isEditor } = useAuthStore()
  const isReader = !isAdmin() && !isEditor()

  const colors = [
    '#2E7D32', '#1565C0', '#6A1B9A',
    '#C62828', '#E65100', '#37474F',
    '#0277BD', '#558B2F', '#AD1457',
  ]

  const fetchAll = async () => {
    setLoading(true)
    try {
      const { data } = await folderService.list()
      setFolders(data)

      if (isAdmin()) {
        const reqRes = await folderService.accessRequests()
        setAccessRequests(reqRes.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const { data } = await groupService.list()
      setGroups(data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    fetchAll()
    if (!isReader) fetchGroups()
  }, [])

  const openCreate = () => {
    setSelected(null)
    setFormName('')
    setFormDesc('')
    setFormColor('#2E7D32')
    setFormGroups([])
    setError('')
    setShowModal(true)
  }

  const openEdit = async (folder: Folder) => {
    setSelected(folder)
    setFormName(folder.name)
    setFormDesc(folder.description || '')
    setFormColor(folder.color || '#2E7D32')
    setFormGroups(folder.assigned_groups?.map(g => g.id) || [])
    setError('')
    try {
      const { data } = await folderService.get(folder.id)
      setFormGroups(data.assigned_groups?.map((g: any) => g.id) || [])
    } catch (err) { console.error(err) }
    setShowModal(true)
  }

  const toggleGroup = (id: number) => {
    setFormGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) { setError('Le nom est obligatoire.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = { name: formName, description: formDesc, color: formColor, group_ids: formGroups }
      if (selected) {
        await folderService.update(selected.id, payload)
      } else {
        await folderService.create(payload)
      }
      setShowModal(false)
      fetchAll()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce dossier ?')) return
    try {
      await folderService.delete(id)
      fetchAll()
      if (selectedFolder?.id === id) setSelectedFolder(null)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.')
    }
  }

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showAccessRequest || !accessReason.trim()) return
    setSavingAccess(true)
    try {
      await folderService.requestAccess(showAccessRequest.id, accessReason)
      setShowAccessRequest(null)
      setAccessReason('')
      alert('Demande envoyée à l\'administrateur !')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.')
    } finally {
      setSavingAccess(false)
    }
  }

  const handleApproveAccess = async (id: number) => {
    try {
      await folderService.approveAccess(id)
      fetchAll()
    } catch (err) { console.error(err) }
  }

  const handleRejectAccess = async () => {
    if (!showRejectAccess || !rejectReason.trim()) return
    try {
      await folderService.rejectAccess(showRejectAccess.id, rejectReason)
      setShowRejectAccess(null)
      setRejectReason('')
      fetchAll()
    } catch (err) { console.error(err) }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dossiers</h1>
            <p className="text-sm text-gray-500">{folders.length} dossier(s)</p>
          </div>
          {!isReader && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition-colors">
              <span className="text-lg">+</span> Nouveau dossier
            </button>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-130px)]">

        {/* Sidebar dossiers */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-hidden">

          {/* Demandes d'accès — Admin */}
          {isAdmin() && accessRequests.length > 0 && (
            <div className="p-3 bg-amber-50 border-b border-amber-200">
              <p className="text-xs font-bold text-amber-800 mb-2">
                ⏳ {accessRequests.length} demande(s) d'accès
              </p>
              {accessRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-lg p-2 mb-2 border border-amber-100">
                  <p className="text-xs font-semibold text-gray-800">📁 {req.folder_name}</p>
                  <p className="text-xs text-gray-500">Par {req.user_name}</p>
                  <p className="text-xs text-gray-400 italic mb-2">"{req.reason}"</p>
                  <div className="flex gap-1">
                    <button onClick={() => handleApproveAccess(req.id)}
                      className="flex-1 py-1 bg-green-700 text-white text-xs rounded-lg font-semibold hover:bg-green-800">
                      ✓ Approuver
                    </button>
                    <button onClick={() => { setShowRejectAccess(req); setRejectReason('') }}
                      className="flex-1 py-1 bg-red-600 text-white text-xs rounded-lg font-semibold hover:bg-red-700">
                      ✕ Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Liste des dossiers */}
          <div className="flex-1 overflow-y-auto p-3">
            <div
              onClick={() => setSelectedFolder(null)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer mb-1 transition-colors ${
                !selectedFolder ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50'
              }`}
            >
              <span>🏠</span>
              <span className="text-sm font-semibold text-gray-700">Racine</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : folders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">Aucun dossier</p>
                {isReader && (
                  <p className="text-xs text-gray-400 mt-1">Demandez l'accès à un dossier</p>
                )}
              </div>
            ) : (
              folders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer mb-1 transition-colors border ${
                    selectedFolder?.id === folder.id
                      ? 'bg-green-50 border-green-200'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: folder.color + '20' }}>
                    📁
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{folder.name}</p>
                    <p className="text-xs text-gray-400">
                      {folder.documents_count ?? 0} doc(s)
                      {folder.access_type === 'group' && (
                        <span className="ml-1 text-blue-500">• Groupe</span>
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedFolder ? (
            <>
              {/* Header dossier sélectionné */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: selectedFolder.color + '20' }}>
                    📁
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedFolder.name}</h2>
                    {selectedFolder.description && (
                      <p className="text-sm text-gray-500 mt-1">{selectedFolder.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        📄 {selectedFolder.documents_count ?? 0} document(s)
                      </span>
                      {selectedFolder.access_type === 'group' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Accès via groupe
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  {/* Lecteur : demander accès */}
                  {isReader && selectedFolder.access_type !== 'group' && (
                    <button
                      onClick={() => { setShowAccessRequest(selectedFolder); setAccessReason('') }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      🔑 Demander l'accès
                    </button>
                  )}

                  {/* Admin/Éditeur : ajouter document */}
                  {!isReader && (
                    <button
                      onClick={() => setShowUpload(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition-colors"
                    >
                      📄 + Document
                    </button>
                  )}

                  {/* Admin/Éditeur : modifier et supprimer */}
                  {!isReader && (
                    <>
                      <button onClick={() => openEdit(selectedFolder)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                        ✏️ Modifier
                      </button>
                      <button onClick={() => handleDelete(selectedFolder.id)}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
                        🗑️ Supprimer
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Groupes assignés */}
              {selectedFolder.assigned_groups && selectedFolder.assigned_groups.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <p className="text-xs font-bold text-blue-800 mb-2">
                    🏢 Groupes ayant accès à ce dossier
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFolder.assigned_groups.map((g) => (
                      <span key={g.id}
                        className="text-xs px-3 py-1.5 rounded-full font-semibold"
                        style={{ background: g.color + '20', color: g.color }}>
                        🏢 {g.name} ({g.permission})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents du dossier */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  Documents
                </h3>
                {selectedFolder.documents_count === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <div className="text-4xl mb-3">📄</div>
                    <p className="text-gray-400 text-sm">Aucun document dans ce dossier</p>
                    {!isReader && (
                      <button onClick={() => setShowUpload(true)}
                        className="mt-4 px-6 py-2.5 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition-colors">
                        📄 Ajouter un document
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">
                      👉 Allez dans <strong>Documents</strong> et filtrez par ce dossier pour voir son contenu.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-gray-500 font-semibold text-lg">Sélectionnez un dossier</p>
              <p className="text-gray-400 text-sm mt-2">
                Choisissez un dossier dans la liste de gauche pour voir son contenu
              </p>
              {isReader && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl max-w-sm">
                  <p className="text-sm text-blue-700 font-semibold mb-1">
                    🔑 Accès en tant que Lecteur
                  </p>
                  <p className="text-xs text-blue-600">
                    Vous pouvez voir les dossiers auxquels vous avez accès.
                    Pour accéder à d'autres dossiers, sélectionnez-en un et cliquez sur "Demander l'accès".
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal création / édition dossier */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {selected ? 'Modifier le dossier' : 'Nouveau dossier'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Finances 2024"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                  rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((c) => (
                    <button key={c} type="button" onClick={() => setFormColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        formColor === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'
                      }`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: formColor + '20' }}>📁</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{formName || 'Nom du dossier'}</p>
                  <p className="text-xs text-gray-400">Aperçu</p>
                </div>
              </div>
              {!isReader && groups.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏢 Groupes ayant accès
                    <span className="text-xs text-gray-400 ml-1">(optionnel)</span>
                  </label>
                  <div className="space-y-2 max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-3">
                    {groups.map((g) => (
                      <label key={g.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 rounded-lg">
                        <input type="checkbox" checked={formGroups.includes(g.id)}
                          onChange={() => toggleGroup(g.id)} className="w-4 h-4 accent-green-700" />
                        <div className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: g.color + '30' }}>
                          <span className="text-xs">🏢</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{g.name}</p>
                          <p className="text-xs text-gray-400">{g.members_count ?? 0} membre(s)</p>
                        </div>
                        {formGroups.includes(g.id) && (
                          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Sélectionné
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
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

      {/* Modal demande d'accès — Lecteur */}
      {showAccessRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Demander l'accès</h2>
              <button onClick={() => setShowAccessRequest(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <form onSubmit={handleRequestAccess} className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: showAccessRequest.color + '20' }}>📁</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{showAccessRequest.name}</p>
                  <p className="text-xs text-blue-600">Accès en lecture</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700">
                  ⚠️ Votre demande sera envoyée à l'administrateur pour approbation.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif <span className="text-red-500">*</span>
                </label>
                <textarea value={accessReason} onChange={(e) => setAccessReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous avez besoin d'accéder à ce dossier..." rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-400 focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAccessRequest(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" disabled={savingAccess || !accessReason.trim()}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl text-sm transition-colors">
                  {savingAccess ? 'Envoi...' : 'Envoyer la demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal rejet accès — Admin */}
      {showRejectAccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Refuser l'accès</h2>
            <p className="text-sm text-gray-600 mb-4">
              Dossier : <strong>"{showRejectAccess.folder_name}"</strong><br/>
              Demandé par : <strong>{showRejectAccess.user_name}</strong>
            </p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motif du refus..." rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowRejectAccess(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={handleRejectAccess} disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold rounded-xl text-sm transition-colors">
                Refuser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal upload document dans le dossier */}
      {showUpload && selectedFolder && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); fetchAll() }}
          defaultFolderId={selectedFolder.id}
          defaultFolderName={selectedFolder.name}
        />
      )}
    </div>
  )
}