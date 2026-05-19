import { useEffect, useState } from 'react'
import { ocrService } from '../../services/api'

interface Props {
  document: {
    id: number
    name: string
    mime_type: string
    ocr_status?: string
    ocr_text?: string
    ocr_confidence?: number
  }
  onClose: () => void
}

export default function OcrModal({ document, onClose }: Props) {
  const [loading,    setLoading]    = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result,     setResult]     = useState<any>(null)
  const [error,      setError]      = useState('')
  const [copied,     setCopied]     = useState(false)

  const supportedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/bmp',
    'image/tiff', 'image/webp', 'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
  ]
  const isSupported = supportedTypes.includes(document.mime_type)

  useEffect(() => {
    if (document.ocr_status === 'done') {
      setLoading(true)
      ocrService.getText(document.id)
        .then(({ data }) => setResult(data))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [document.id])

  const handleProcess = async () => {
    setProcessing(true)
    setError('')
    try {
      const { data } = await ocrService.process(document.id)
      setResult(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du traitement OCR.')
    } finally {
      setProcessing(false)
    }
  }

  const handleCopy = () => {
    const text = result?.text || result?.ocr_text
    if (text) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const text       = result?.text || result?.ocr_text || ''
  const confidence = result?.confidence || result?.ocr_confidence || 0

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">OCR — Extraction de texte</h2>
            <p className="text-xs text-gray-400 truncate max-w-xs">{document.name}</p>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
            X
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Infos document */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-800">{document.name}</p>
              <p className="text-xs text-gray-400">{document.mime_type}</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              document.ocr_status === 'done'
                ? 'bg-green-100 text-green-700'
                : document.ocr_status === 'processing'
                ? 'bg-amber-100 text-amber-700'
                : document.ocr_status === 'failed'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {document.ocr_status === 'done'       ? 'Traite'
               : document.ocr_status === 'processing' ? 'En cours'
               : document.ocr_status === 'failed'     ? 'Echec'
               : 'En attente'}
            </span>
          </div>

          {/* Non supporté */}
          {!isSupported && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-semibold text-amber-800 mb-1">
                Format non supporte pour l'OCR
              </p>
              <p className="text-xs text-amber-700">
                Formats acceptes : JPG, PNG, PDF, DOCX, PPTX
              </p>
            </div>
          )}

          {/* Bouton lancer OCR */}
          {isSupported && !result && !loading && (
            <div className="text-center py-6">
              <p className="text-gray-600 font-semibold mb-2">
                Extraire le texte de ce document
              </p>
              <p className="text-gray-400 text-sm mb-6">
                L'OCR va analyser le document et extraire tout le texte
              </p>
              <button onClick={handleProcess} disabled={processing}
                className="px-8 py-3 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold rounded-xl transition-colors">
                {processing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyse en cours...
                  </span>
                ) : 'Lancer l\'OCR'}
              </button>
            </div>
          )}

          {/* Chargement */}
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-3 border-green-700 border-t-transparent rounded-full animate-spin mr-3"></div>
              <span className="text-sm text-gray-500">Chargement...</span>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-semibold text-red-700 mb-1">Erreur</p>
              <p className="text-sm text-red-600">{error}</p>
              <button onClick={handleProcess}
                className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
                Reessayer
              </button>
            </div>
          )}

          {/* Résultats */}
          {result && text && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-green-700">
                    {result.word_count || text.split(' ').length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Mots</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-blue-700">
                    {result.char_count || text.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Caracteres</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-purple-700">{confidence}%</p>
                  <p className="text-xs text-gray-500 mt-1">Confiance</p>
                </div>
              </div>

              {/* Barre de confiance */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Qualite de l'extraction</span>
                  <span className={`font-semibold ${
                    confidence >= 80 ? 'text-green-600' :
                    confidence >= 60 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {confidence >= 80 ? 'Excellente' :
                     confidence >= 60 ? 'Bonne' : 'Faible'}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${
                    confidence >= 80 ? 'bg-green-500' :
                    confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`} style={{ width: `${confidence}%` }} />
                </div>
              </div>

              {/* Texte extrait */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-gray-900">Texte extrait</p>
                  <div className="flex gap-2">
                    <button onClick={handleCopy}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {copied ? 'Copie !' : 'Copier'}
                    </button>
                    {isSupported && (
                      <button onClick={handleProcess} disabled={processing}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 text-green-700 hover:bg-green-200">
                        Relancer
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {text}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Résultat vide */}
          {result && !text && (
            <div className="text-center py-8 bg-amber-50 rounded-xl">
              <p className="text-amber-700 font-semibold">Aucun texte detecte</p>
              <p className="text-amber-600 text-sm mt-1">
                Le document ne contient peut-etre pas de texte lisible
              </p>
              <button onClick={handleProcess}
                className="mt-4 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700">
                Reessayer
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose}
            className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}