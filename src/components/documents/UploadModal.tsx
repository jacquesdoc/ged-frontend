import { useState, useRef } from 'react'
import { documentService } from '../../services/api'

interface Props {
  onClose:   () => void
  onSuccess: () => void
}

export default function UploadModal({ onClose, onSuccess }: Props) {
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [file,        setFile]        = useState<File | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [dragOver,    setDragOver]    = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    if (!name) setName(f.name.replace(/\.[^/.]+$/, ''))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Le nom est obligatoire.'); return }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('name', name)
      if (description) formData.append('description', description)
      if (file) formData.append('file', file)

      await documentService.create(formData)
      onSuccess()
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Erreur lors de la création du document.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Nouveau document</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >✕</button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Zone de dépôt */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <div>
                <div className="text-4xl mb-2">📄</div>
                <p className="text-sm font-semibold text-green-700">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">☁️</div>
                <p className="text-sm font-semibold text-gray-600">
                  Glissez-déposez un fichier ici
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  ou cliquez pour parcourir — Max 50 MB
                </p>
              </div>
            )}
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du document <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Rapport annuel 2024"
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
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none resize-none"
            />
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
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              {loading ? 'Enregistrement...' : 'Créer le document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}