import { useEffect, useState } from 'react'
import { documentService, deletionService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import UploadModal from '../components/documents/UploadModal'
import PreviewModal from '../components/documents/PreviewModal'

interface Document {
  id: number
  name: string
  description: string
  file_size: number
  mime_type: string
  extension: string
  status: string
  version: number
  is_locked: boolean
  is_archived: boolean
  created_at: string
  creator?: { name: string }
  folder?: { name: string }
  tags?: Array<{ id: number; name: string; color: string }>
}

interface DeletionRequest {
  id: number
  document_id: number
  status: string
  reason: string
  admin_comment: string | null
  created_at: string
  reviewer?: { name: string }
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  draft:     { label: 'Brouillon',   classes: 'bg-gray-100 text-gray-700' },
  review:    { label: 'En révision', classes: 'bg-amber-100 text-amber-700' },
  approved:  { label: 'Approuvé',    classes: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejeté',      classes: 'bg-red-100 text-red-700' },
  published: { label: 'Publié',      classes: 'bg-blue-100 text-blue-700' },
  archived:  { label: 'Archivé',     classes: 'bg-purple-100 text-purple-700' },
}

const formatSize = (bytes: number): string => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

const getIcon = (mime: string): string => {
  if (mime?.includes('pdf'))         return '📄'
  if (mime?.startsWith('image/'))    return '🖼️'
  if (mime?.includes('word'))        return '📝'
  if (mime?.includes('excel') || mime?.includes('spreadsheet')) return '📊'
  return '📁'
}

export default function DocumentsPage() {
  const [documents,   setDocuments]   = useState<Document[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [status,      setStatus]      = useState('')
  const [showUpload,  setShowUpload]  = useState(false)
  const [total,       setTotal]       = useState(0)
  const [previewDoc,  setPreviewDoc]  = useState<Document | null>(null)

  // Demande de suppression
  const [showDeleteRequest, setShowDeleteRequest] = useState<Document | null>(null)
  const [deleteReason,      setDeleteReason]      = useState('')
  const [deleteSaving,      setDeleteSaving]      = useState(false)
  const [deleteError,       setDeleteError]       = useState('')
  const [myRequests,        setMyRequests]        = useState<DeletionRequest[]>([])

  // Admin — demandes en attente
  const [pendingDeletions,   setPendingDeletions]   = useState<any[]>([])
  const [showAdminDelete,    setShowAdminDelete]    = useState<any | null>(null)
  const [adminComment,       setAdminComment]       = useState('')
  const [showRejectDelete,   setShowRejectDelete]   = useState<any | null>(null)
  const [rejectComment,      setRejectComment]      = useState('')

  const { isAdmin, isEditor, user } = useAuthStore()
  const isReader = !isAdmin() && !isEditor()

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (status) params.status = status
      const { data } = await documentService.list(params)
      setDocuments(data.data)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyRequests = async () => {
    if (!isReader) return
    try {
      const { data } = await deletionService.myRequests()
      setMyRequests(data)
    } catch (err) { console.error(err) }
  }

  const fetchPendingDeletions = async () => {
    if (!isAdmin()) return
    try {
      const { data } = await deletionService.pending()
      setPendingDeletions(data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    fetchDocuments()
    fetchMyRequests()
    fetchPendingDeletions()
  }, [search, status])

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce document ?')) return
    try {
      await documentService.delete(id)
      fetchDocuments()
    } catch (err) { console.error(err) }
  }

  const handleDownload = async (doc: Document) => {
    try {
      const { data } = await documentService.download(doc.id)
      const url  = window.URL.createObjectURL(new Blob([data]))
      const link = window.document.createElement('a')
      link.href  = url
      link.setAttribute('download', doc.name)
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) { console.error(err) }
  }

  const handleArchive = async (id: number) => {
    if (!window.confirm('Archiver ce document ?')) return
    try {
      await documentService.archive(id)
      fetchDocuments()
    } catch (err) { console.error(err) }
  }

  // ── Lecteur : soumettre demande de suppression ──────────────────────────
  const handleSubmitDeleteRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showDeleteRequest) return
    if (!deleteReason.trim() || deleteReason.length < 10) {
      setDeleteError('Le motif doit contenir au moins 10 caractères.')
      return
    }
    setDeleteSaving(true)
    setDeleteError('')
    try {
      await deletionService.create({
        document_id: showDeleteRequest.id,
        reason:      deleteReason,
      })
      setShowDeleteRequest(null)
      setDeleteReason('')
      fetchMyRequests()
      alert('Demande envoyée à l\'administrateur !')
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Erreur lors de l\'envoi.')
    } finally {
      setDeleteSaving(false)
    }
  }

  // ── Admin : approuver suppression ───────────────────────────────────────
  const handleApproveDelete = async () => {
    if (!showAdminDelete) return
    try {
      await deletionService.approve(showAdminDelete.id, { admin_comment: adminComment })
      setShowAdminDelete(null)
      setAdminComment('')
      fetchDocuments()
      fetchPendingDeletions()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.')
    }
  }

  // ── Admin : rejeter suppression ─────────────────────────────────────────
  const handleRejectDelete = async () => {
    if (!showRejectDelete || !rejectComment.trim()) return
    try {
      await deletionService.reject(showRejectDelete.id, rejectComment)
      setShowRejectDelete(null)
      setRejectComment('')
      fetchPendingDeletions()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur.')
    }
  }

  // Vérifie si le lecteur a déjà une demande en attente pour ce doc
  const hasPendingRequest = (docId: number) =>
    myRequests.some(r => r.document_id === docId && r.status === 'pending')

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Documents</h1>
            <p className="text-sm text-gray-500">{total} document(s) au total</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition-colors"
          >
            <span className="text-lg">+</span> Nouveau document
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Demandes de suppression en attente — Admin uniquement */}
        {isAdmin() && pendingDeletions.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🗑️</span>
              <h2 className="font-bold text-red-800">
                {pendingDeletions.length} demande(s) de suppression en attente
              </h2>
            </div>
            <div className="space-y-2">
              {pendingDeletions.map((req) => (
                <div key={req.id} className="bg-white rounded-xl p-3 border border-red-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        📄 {req.document?.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Demandé par <strong>{req.requester?.name}</strong> —{' '}
                        {new Date(req.created_at).toLocaleDateString('fr-FR')}
                      </p>
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Motif :</p>
                        <p className="text-xs text-gray-700 italic">"{req.reason}"</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {/* Voir le document */}
                      <button
                        onClick={() => setPreviewDoc(req.document)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        👁️ Voir
                      </button>
                      {/* Approuver */}
                      <button
                        onClick={() => { setShowAdminDelete(req); setAdminComment('') }}
                        className="px-3 py-1.5 bg-green-700 text-white text-xs font-semibold rounded-lg hover:bg-green-800 transition-colors"
                      >
                        ✓ Approuver
                      </button>
                      {/* Rejeter */}
                      <button
                        onClick={() => { setShowRejectDelete(req); setRejectComment('') }}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                      >
                        ✕ Refuser
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mes demandes de suppression — Lecteur */}
        {isReader && myRequests.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📋</span>
              <h2 className="font-bold text-amber-800">Mes demandes de suppression</h2>
            </div>
            <div className="space-y-2">
              {myRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-xl p-3 border border-amber-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      📄 {(req as any).document?.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(req.created_at).toLocaleDateString('fr-FR')}
                    </p>
                    {req.admin_comment && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        💬 "{req.admin_comment}"
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    req.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
                    req.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {req.status === 'pending'  ? '⏳ En attente' :
                     req.status === 'approved' ? '✅ Approuvée' :
                     '❌ Refusée'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none bg-white"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(statusConfig).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <button
            onClick={fetchDocuments}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            🔄 Rafraîchir
          </button>
        </div>

        {/* Tableau */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-gray-500 font-medium">Aucun document trouvé</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Taille</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Version</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Auteur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {documents.map((doc) => {
                  const sc = statusConfig[doc.status] || statusConfig.draft
                  const pendingReq = hasPendingRequest(doc.id)

                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getIcon(doc.mime_type)}</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                            {doc.folder && (
                              <p className="text-xs text-gray-400">📁 {doc.folder.name}</p>
                            )}
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {doc.tags.map((tag) => (
                                  <span key={tag.id}
                                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{ background: tag.color + '20', color: tag.color }}
                                  >{tag.name}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.classes}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatSize(doc.file_size)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">v{doc.version}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                            {doc.creator?.name?.[0] ?? '?'}
                          </div>
                          <span className="text-sm text-gray-600">{doc.creator?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Prévisualiser */}
                          <button onClick={() => setPreviewDoc(doc)} title="Prévisualiser"
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            👁️
                          </button>
                          {/* Télécharger */}
                          <button onClick={() => handleDownload(doc)} title="Télécharger"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            ⬇️
                          </button>
                          {/* Archiver — admin et éditeur */}
                          {!doc.is_archived && !isReader && (
                            <button onClick={() => handleArchive(doc.id)} title="Archiver"
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                              🗄️
                            </button>
                          )}
                          {/* Supprimer — admin et éditeur */}
                          {(isAdmin() || isEditor()) && (
                            <button onClick={() => handleDelete(doc.id)} title="Supprimer"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              🗑️
                            </button>
                          )}
                          {/* Demande de suppression — lecteur */}
                          {isReader && (
                            <button
                              onClick={() => {
                                if (pendingReq) return
                                setShowDeleteRequest(doc)
                                setDeleteReason('')
                                setDeleteError('')
                              }}
                              title={pendingReq ? 'Demande déjà envoyée' : 'Demander la suppression'}
                              disabled={pendingReq}
                              className={`p-1.5 rounded-lg transition-colors ${
                                pendingReq
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                            >
                              🗑️
                            </button>
                          )}
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

      {/* Modal Upload */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); fetchDocuments() }}
        />
      )}

      {/* Modal Prévisualisation */}
      {previewDoc && (
        <PreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Modal demande de suppression — Lecteur */}
      {showDeleteRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Demander la suppression</h2>
              <button onClick={() => setShowDeleteRequest(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmitDeleteRequest} className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-2xl">{getIcon(showDeleteRequest.mime_type)}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{showDeleteRequest.name}</p>
                  <p className="text-xs text-gray-400">{formatSize(showDeleteRequest.file_size)}</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-semibold">
                  ⚠️ Cette demande sera envoyée à l'administrateur pour approbation. Vous serez notifié de la décision.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif de la suppression <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Expliquez pourquoi ce document doit être supprimé (min. 10 caractères)..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{deleteReason.length} caractère(s)</p>
              </div>

              {deleteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowDeleteRequest(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" disabled={deleteSaving}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold rounded-xl text-sm transition-colors">
                  {deleteSaving ? 'Envoi...' : 'Envoyer la demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal approbation suppression — Admin */}
      {showAdminDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Approuver la suppression</h2>
              <button onClick={() => setShowAdminDelete(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Action irréversible</p>
                <p className="text-sm text-red-800">
                  Le document <strong>"{showAdminDelete.document?.name}"</strong> sera définitivement supprimé.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">Motif du demandeur :</p>
                <p className="text-sm text-gray-700 italic">"{showAdminDelete.reason}"</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Commentaire pour l'utilisateur..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAdminDelete(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Annuler
                </button>
                <button onClick={handleApproveDelete}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors">
                  ✓ Confirmer la suppression
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal rejet suppression — Admin */}
      {showRejectDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Refuser la suppression</h2>
            <p className="text-sm text-gray-600 mb-4">
              Document : <strong>"{showRejectDelete.document?.name}"</strong>
            </p>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Expliquez pourquoi vous refusez cette suppression..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowRejectDelete(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={handleRejectDelete} disabled={!rejectComment.trim()}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold rounded-xl text-sm transition-colors">
                ✕ Refuser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}