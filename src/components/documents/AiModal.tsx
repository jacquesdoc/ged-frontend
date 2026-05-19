import { useState } from 'react'
import { aiService } from '../../services/api'

interface Props {
  document: {
    id: number
    name: string
    ocr_text?: string
    ocr_status?: string
    metadata?: any
  }
  onClose: () => void
}

export default function AiModal({ document, onClose }: Props) {
  const [activeTab,   setActiveTab]   = useState('analyze')
  const [loading,     setLoading]     = useState(false)
  const [result,      setResult]      = useState<any>(null)
  const [error,       setError]       = useState('')
  const [question,    setQuestion]    = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{q: string; a: string}>>([])
  const [chatLoading, setChatLoading] = useState(false)

  const hasOcr = document.ocr_status === 'done' && document.ocr_text

  const handleAnalyze = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await aiService.analyze(document.id)
      setResult(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'analyse.')
    } finally {
      setLoading(false)
    }
  }

  const handleSummarize = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await aiService.summarize(document.id)
      setResult({ summary: data.summary })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur.')
    } finally {
      setLoading(false)
    }
  }

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return
    setChatLoading(true)
    const q = question
    setQuestion('')
    try {
      const { data } = await aiService.chat(document.id, q)
      setChatHistory(prev => [...prev, { q, a: data.answer }])
    } catch (err: any) {
      setChatHistory(prev => [...prev, {
        q,
        a: 'Erreur : ' + (err.response?.data?.message || 'Service IA indisponible.')
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const tabs = [
    { id: 'analyze', label: 'Analyse complete' },
    { id: 'summary', label: 'Resume' },
    { id: 'chat',    label: 'Chat IA' },
  ]

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xs font-bold">IA</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Assistant IA</h2>
              <p className="text-xs text-gray-400 truncate max-w-xs">{document.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
              Groq LLaMA3
            </span>
            <button onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold">
              X
            </button>
          </div>
        </div>

        {/* Avertissement OCR */}
        {!hasOcr && (
          <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex-shrink-0">
            <p className="text-sm font-semibold text-amber-800 mb-1">OCR requis</p>
            <p className="text-xs text-amber-700">
              Ce document n'a pas encore ete analyse par l'OCR.
              Lancez d'abord l'OCR pour utiliser l'IA.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mx-6 mt-4 bg-gray-100 p-1 rounded-xl flex-shrink-0">
          {tabs.map(tab => (
            <button key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResult(null); setError('') }}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-purple-700 shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Tab Analyse */}
          {activeTab === 'analyze' && (
            <div className="space-y-4">
              {!result && !loading && (
                <div className="text-center py-6">
                  <p className="text-gray-600 font-semibold mb-2">Analyse IA complete</p>
                  <p className="text-gray-400 text-sm mb-6">
                    Resume, classification et extraction de metadonnees
                  </p>
                  <button onClick={handleAnalyze} disabled={!hasOcr}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl">
                    Lancer l'analyse IA
                  </button>
                </div>
              )}

              {loading && (
                <div className="text-center py-10">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-purple-700 font-semibold">Analyse en cours...</p>
                  <p className="text-gray-400 text-sm mt-1">LLaMA3 analyse votre document</p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700">{error}</p>
                  <button onClick={handleAnalyze}
                    className="mt-2 px-4 py-2 bg-red-600 text-white text-xs rounded-lg">
                    Reessayer
                  </button>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {result.summary && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <p className="text-xs font-bold text-purple-700 mb-2 uppercase">Resume</p>
                      <p className="text-sm text-gray-800 leading-relaxed">{result.summary}</p>
                    </div>
                  )}

                  {result.classify && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs font-bold text-blue-700 mb-3 uppercase">Classification</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Type</p>
                          <p className="text-sm font-bold text-blue-700">
                            {result.classify.type || '-'}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Priorite</p>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            result.classify.priority === 'haute'   ? 'bg-red-100 text-red-700' :
                            result.classify.priority === 'moyenne' ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {result.classify.priority || 'basse'}
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Langue</p>
                          <p className="text-sm font-semibold text-gray-700">
                            {result.classify.language || '-'}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Tags suggeres</p>
                          <div className="flex flex-wrap gap-1">
                            {result.classify.tags?.map((tag: string, i: number) => (
                              <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.metadata && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-xs font-bold text-green-700 mb-3 uppercase">Metadonnees extraites</p>
                      <div className="space-y-2">
                        {Object.entries(result.metadata).map(([key, value]) =>
                          value ? (
                            <div key={key} className="flex items-start gap-3 bg-white rounded-lg p-2">
                              <span className="text-xs font-semibold text-gray-500 capitalize w-24 flex-shrink-0">
                                {key}
                              </span>
                              <span className="text-xs text-gray-800">{value as string}</span>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  <button onClick={() => setResult(null)}
                    className="w-full py-2 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-50">
                    Relancer l'analyse
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab Resume */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {!result && !loading && (
                <div className="text-center py-6">
                  <p className="text-gray-600 font-semibold mb-2">Resume automatique</p>
                  <p className="text-gray-400 text-sm mb-6">
                    L'IA genere un resume en 3-4 phrases
                  </p>
                  <button onClick={handleSummarize} disabled={!hasOcr}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl">
                    Generer le resume
                  </button>
                </div>
              )}

              {loading && (
                <div className="text-center py-10">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-purple-700 font-semibold">Generation en cours...</p>
                </div>
              )}

              {result?.summary && (
                <div className="space-y-3">
                  <div className="p-5 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
                    <p className="text-xs font-bold text-purple-700 uppercase mb-3">
                      Resume IA — LLaMA3
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed">{result.summary}</p>
                  </div>
                  <button onClick={() => setResult(null)}
                    className="w-full py-2 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-50">
                    Regenerer
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab Chat */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full space-y-3">
              {!hasOcr && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700">OCR requis pour le chat.</p>
                </div>
              )}

              {chatHistory.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Suggestions de questions
                  </p>
                  {[
                    "Quel est le sujet principal de ce document ?",
                    "Quelles sont les informations importantes ?",
                    "Quel est le montant mentionne ?",
                    "Qui sont les parties impliquees ?",
                  ].map((suggestion) => (
                    <button key={suggestion}
                      onClick={() => setQuestion(suggestion)}
                      disabled={!hasOcr}
                      className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 rounded-xl text-xs text-gray-600 hover:text-purple-700 transition-colors disabled:opacity-50">
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {chatHistory.length > 0 && (
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-end">
                        <div className="bg-purple-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-xs">
                          <p className="text-sm">{msg.q}</p>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm max-w-sm">
                          <p className="text-xs font-semibold text-purple-700 mb-1">Assistant IA</p>
                          <p className="text-sm text-gray-800 leading-relaxed">{msg.a}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleChat} className="flex gap-2 flex-shrink-0">
                <input type="text" value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={hasOcr ? "Posez une question..." : "OCR requis..."}
                  disabled={!hasOcr || chatLoading}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-purple-500 focus:outline-none disabled:bg-gray-50" />
                <button type="submit"
                  disabled={!hasOcr || chatLoading || !question.trim()}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold rounded-xl text-sm">
                  {chatLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : 'Envoyer'}
                </button>
              </form>
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