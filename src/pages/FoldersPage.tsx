import { useEffect, useState } from 'react'
import { folderService } from '../services/api'

interface Folder {
  id: number
  name: string
  description: string
  color: string
  path: string
  documents_count: number
  created_at: string
  creator?: { name: string }
  children?: Folder[]
}

export default function FoldersPage() {
  const [folders,     setFolders]     = useState<Folder[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [selected,    setSelected]    = useState<Folder | null>(null)
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [color,       setColor]       = useState('#2E7D32')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  const fetchFolders = async () => {
    setLoading(true)
    try {
      const { data } = await folderService.list()
      setFolders(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFolders() }, [])

  const openCreate = () => {
    setName('')
    setDescription('')
    setColor('#2E7D32')
    setError('')
    setSelected(null)
    setShowModal(true)
  }

  const openEdit = (folder: Folder) => {
    setName(folder.name)
    setDescription(folder.description || '')
    setColor(folder.color || '#2E7D32')
    setError('')
    setSelected(folder)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Le nom est obligatoire.'); return }

    setSaving(true)
    setError('')

    try {
      if (selected) {
        await folderService.update(selected.id, { name, description, color })
      } else {
        await folderService.create({ name, description, color })
      }
      setShowModal(false)
      fetchFolders()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce dossier ?')) return
    try {
      await folderService.delete(id)
      fetchFolders()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.')
    }
  }

  const colors = [
    '#2E7D32', '#1565C0', '#6A1B9A',
    '#C62828', '#E65100', '#37474F',
    '#0277BD', '#558B2F', '#AD1457',
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dossiers</h1>
            <p className="text-sm text-gray-500">{folders.length} dossier(s)</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition-colors"
          >
            <span className="text-lg">+</span> Nouveau dossier
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : folders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-gray-500 font-medium">Aucun dossier</p>
            <p className="text-gray-400 text-sm mt-1">
              Créez votre premier dossier pour organiser vos documents
            </p>
            <button
              onClick={openCreate}
              className="mt-4 px-6 py-2.5 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition-colors"
            >
              Créer un dossier
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                {/* Icône dossier */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: folder.color + '20' }}
                  >
                    📁
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(folder)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(folder.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Infos */}
                <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">
                  {folder.name}
                </h3>
                {folder.description && (
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                    {folder.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    📄 {folder.documents_count ?? 0} document(s)
                  </span>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: folder.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal création / édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {selected ? 'Modifier le dossier' : 'Nouveau dossier'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du dossier <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Finances 2024"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description optionnelle..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none resize-none"
                />
              </div>

              {/* Couleur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Aperçu */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: color + '20' }}
                >
                  📁
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {name || 'Nom du dossier'}
                  </p>
                  <p className="text-xs text-gray-400">Aperçu</p>
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  {saving ? 'Enregistrement...' : selected ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}