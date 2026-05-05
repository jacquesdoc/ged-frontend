import { useEffect, useState } from 'react'
import { documentService, tagService } from '../services/api'
import UploadModal from '../components/documents/UploadModal'

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

const getIcon = (mime: string, ext: string): string => {
  if (mime?.includes('pdf'))         return '📄'
  if (mime?.startsWith('image/'))    return '🖼️'
  if (mime?.includes('word'))        return '📝'
  if (mime?.includes('excel') || mime?.includes('spreadsheet')) return '📊'
  return '📁'
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [status,    setStatus]    = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [total,     setTotal]     = useState(0)

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

  useEffect(() => {
    fetchDocuments()
  }, [search, status])

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce document ?')) return
    try {
      await documentService.delete(id)
      fetchDocuments()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      const { data } = await documentService.download(doc.id)
      const url  = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', doc.name)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error(err)
    }
  }

  const handleArchive = async (id: number) => {
    try {
      await documentService.archive(id)
      fetchDocuments()
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

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Recherche */}
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

          {/* Filtre statut */}
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

          {/* Bouton rafraîchir */}
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
            <p className="text-gray-400 text-sm mt-1">
              Cliquez sur "Nouveau document" pour commencer
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Taille</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Version</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Auteur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {documents.map((doc) => {
                  const sc = statusConfig[doc.status] || statusConfig.draft
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getIcon(doc.mime_type, doc.extension)}</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                            {doc.folder && (
                              <p className="text-xs text-gray-400">📁 {doc.folder.name}</p>
                            )}
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {doc.tags.map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{ background: tag.color + '20', color: tag.color }}
                                  >
                                    {tag.name}
                                  </span>
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
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatSize(doc.file_size)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        v{doc.version}
                      </td>
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
                          {/* Télécharger */}
                          <button
                            onClick={() => handleDownload(doc)}
                            title="Télécharger"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            ⬇️
                          </button>
                          {/* Archiver */}
                          {!doc.is_archived && (
                            <button
                              onClick={() => handleArchive(doc.id)}
                              title="Archiver"
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              🗄️
                            </button>
                          )}
                          {/* Supprimer */}
                          <button
                            onClick={() => handleDelete(doc.id)}
                            title="Supprimer"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            🗑️
                          </button>
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
    </div>
  )
}