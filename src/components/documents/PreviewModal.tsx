import { useEffect, useState } from 'react'

interface Props {
  document: {
    id: number
    name: string
    mime_type: string
    extension: string
  }
  onClose: () => void
}

export default function PreviewModal({ document, onClose }: Props) {
  const [, setUrl] = useState('')
  const token = localStorage.getItem('ged_token')

  useEffect(() => {
    const previewUrl = `${import.meta.env.VITE_API_URL}/documents/${document.id}/preview?token=${token}`
    setUrl(previewUrl)
  }, [document.id])

  const isImage    = document.mime_type?.startsWith('image/')
  const isPdf      = document.mime_type === 'application/pdf'
  const isText     = document.mime_type?.startsWith('text/')
  const canPreview = isImage || isPdf || isText

  const previewUrl = `${import.meta.env.VITE_API_URL}/documents/${document.id}/preview`

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {isImage ? '🖼️' : isPdf ? '📄' : '📁'}
            </span>
            <div>
              <h2 className="text-base font-bold text-gray-900 truncate max-w-xl">
                {document.name}
              </h2>
              <p className="text-xs text-gray-400">{document.mime_type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-hidden p-4">
          {canPreview ? (
            <>
              {isImage && (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
                  <img
                    src={previewUrl}
                    alt={document.name}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onError={(e) => {
                      e.currentTarget.alt = 'Impossible de charger l\'image'
                    }}
                  />
                </div>
              )}

              {isPdf && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full rounded-xl border border-gray-200"
                  title={document.name}
                />
              )}

              {isText && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full rounded-xl border border-gray-200 bg-white"
                  title={document.name}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-gray-600 font-semibold mb-2">
                Prévisualisation non disponible
              </p>
              <p className="text-gray-400 text-sm mb-6">
                Ce type de fichier ({document.extension}) ne peut pas être prévisualisé
              </p>
              <a href={`${import.meta.env.VITE_API_URL}/documents/${document.id}/download`}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition-colors"
            >
                ⬇️ Télécharger le fichier
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}