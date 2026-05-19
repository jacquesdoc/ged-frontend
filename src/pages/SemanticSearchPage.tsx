import { useState, useEffect } from 'react'
import { semanticSearchService } from '../services/api'

interface SearchResult {
  id:               number
  name:             string
  description:      string
  status:           string
  mime_type:        string
  file_size:        number
  created_at:       string
  creator:          string
  folder:           string
  tags:             Array<{ id: number; name: string; color: string }>
  ocr_status:       string
  relevance_score:  number
  relevance_reason: string
}

interface IndexStatus {
  total:          number
  indexed:        number
  not_indexed:    number
  index_coverage: number
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  draft:     { label: 'Brouillon',   classes: 'bg-gray-100 text-gray-600' },
  review:    { label: 'En revision', classes: 'bg-amber-100 text-amber-700' },
  approved:  { label: 'Approuve',    classes: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejete',      classes: 'bg-red-100 text-red-700' },
  published: { label: 'Publie',      classes: 'bg-blue-100 text-blue-700' },
}

const formatSize = (bytes: number): string => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

export default function SemanticSearchPage() {
  const [query,          setQuery]          = useState('')
  const [results,        setResults]        = useState<SearchResult[]>([])
  const [interpretation, setInterpretation] = useState('')
  const [loading,        setLoading]        = useState(false)
  const [searched,       setSearched]       = useState(false)
  const [error,          setError]          = useState('')
  const [indexStatus,    setIndexStatus]    = useState<IndexStatus | null>(null)

  const examples = [
    'Documents financiers en attente',
    'Contrats recents',
    'Rapports approuves cette annee',
    'Documents lies aux ressources humaines',
    'Factures non validees',
  ]

  useEffect(() => {
    semanticSearchService.indexStatus()
      .then(({ data }) => setIndexStatus(data))
      .catch(console.error)
  }, [])

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim() || loading) return

    setLoading(true)
    setError('')
    setResults([])
    setInterpretation('')
    setSearched(false)

    try {
      const { data } = await semanticSearchService.search(query.trim())
      setResults(data.results || [])
      setInterpretation(data.interpretation || '')
      setSearched(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la recherche.')
    } finally {
      setLoading(false)
    }
  }

  const handleExample = (example: string) => {
    setQuery(example)
    setLoading(true)
    setSearched(false)
    setResults([])
    semanticSearchService.search(example)
      .then(({ data }) => {
        setResults(data.results || [])
        setInterpretation(data.interpretation || '')
        setSearched(true)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: '#F0F7F3', color: '#1A6B3C', border: '#C8E6D4' }
    if (score >= 60) return { bg: '#FFF8E7', color: '#B06000', border: '#FFE0A0' }
    return { bg: '#F5F6F8', color: '#5A7A90', border: '#E0E5EA' }
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Tres pertinent'
    if (score >= 60) return 'Pertinent'
    return 'Peu pertinent'
  }

  return (
    <div className="min-h-screen" style={{ background: '#F4F6F5' }}>

      {/* Header */}
      <div className="bg-white px-6 py-4" style={{ borderBottom: '1px solid #E2E8E4' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-bold" style={{ color: '#0F2318' }}>
            Recherche semantique
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#6A9A7C' }}>
            Recherchez par sens et contexte — pas seulement par mots-cles exacts
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">

        {/* Statut indexation */}
        {indexStatus && (
          <div className="bg-white rounded-2xl p-5 mb-6"
            style={{ border: '1px solid #D8EEE0' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: '#0F2318' }}>
                Couverture d'indexation OCR
              </p>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: indexStatus.index_coverage >= 80
                    ? '#E8F5EE' : indexStatus.index_coverage >= 50
                    ? '#FFF3E0' : '#FDEEEE',
                  color: indexStatus.index_coverage >= 80
                    ? '#1A6B3C' : indexStatus.index_coverage >= 50
                    ? '#B06000' : '#B02020',
                }}
              >
                {indexStatus.index_coverage}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-4"
              style={{ background: '#E8F0EA' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width:      `${indexStatus.index_coverage}%`,
                  background: indexStatus.index_coverage >= 80
                    ? '#2A7A4C' : indexStatus.index_coverage >= 50
                    ? '#E0A020' : '#C03020',
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl p-3" style={{ background: '#F4F7F5' }}>
                <p className="text-xl font-bold" style={{ color: '#0F2318' }}>
                  {indexStatus.total}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6A9A7C' }}>
                  Total documents
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: '#F0F7F3' }}>
                <p className="text-xl font-bold" style={{ color: '#1A6B3C' }}>
                  {indexStatus.indexed}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6A9A7C' }}>
                  Indexes (OCR)
                </p>
              </div>
              <div className="rounded-xl p-3" style={{ background: '#FFF8E7' }}>
                <p className="text-xl font-bold" style={{ color: '#B06000' }}>
                  {indexStatus.not_indexed}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6A9A7C' }}>
                  Non indexes
                </p>
              </div>
            </div>
            {indexStatus.not_indexed > 0 && (
              <div className="mt-3 p-3 rounded-xl"
                style={{ background: '#FFF8E7', border: '1px solid #FFE0A0' }}>
                <p className="text-xs" style={{ color: '#8A6000' }}>
                  <span className="font-semibold">Conseil :</span>{' '}
                  {indexStatus.not_indexed} document(s) non indexes.
                  Uploadez des fichiers supportes et lancez l'OCR pour ameliorer les resultats.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Barre de recherche */}
        <div className="bg-white rounded-2xl p-6 mb-6"
          style={{ border: '1px solid #D8EEE0', boxShadow: '0 2px 8px rgba(15,35,24,0.06)' }}>
          <form onSubmit={handleSearch}>
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: documents financiers non valides, contrats recents..."
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background:  '#F4F7F5',
                  border:      '1px solid #D0DDD4',
                  color:       '#0F2318',
                }}
                onFocus={e => e.target.style.borderColor = '#2A7A4C'}
                onBlur={e  => e.target.style.borderColor = '#D0DDD4'}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 flex-shrink-0 text-white disabled:opacity-40"
                style={{ background: '#1A4A2C' }}
                onMouseEnter={e => !loading && (e.currentTarget.style.background = '#0F3520')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1A4A2C')}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyse...
                  </>
                ) : 'Rechercher'}
              </button>
            </div>
          </form>

          <div className="mt-4 p-3 rounded-xl"
            style={{ background: '#F0F7F3', border: '1px solid #C8E6D4' }}>
            <p className="text-xs" style={{ color: '#1A5A2C' }}>
              <span className="font-semibold">Recherche semantique IA :</span>{' '}
              Contrairement a la recherche classique, cette fonctionnalite comprend
              le sens de votre requete. L'IA trouve les documents pertinents meme
              si les mots exacts ne correspondent pas.
            </p>
          </div>

          {!searched && (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: '#2A6A3C' }}>
                Exemples
              </p>
              <div className="flex flex-wrap gap-2">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => handleExample(ex)}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all font-medium disabled:opacity-50"
                    style={{ background: '#F0F7F3', color: '#1A5A2C', border: '1px solid #C8E6D4' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background  = '#E0F0E8'
                      e.currentTarget.style.borderColor = '#4A9E6A'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background  = '#F0F7F3'
                      e.currentTarget.style.borderColor = '#C8E6D4'
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="px-4 py-3 rounded-xl mb-6 text-sm"
            style={{ background: '#FDEEEE', border: '1px solid #F0C0C0', color: '#B02020' }}>
            {error}
          </div>
        )}

        {/* Chargement */}
        {loading && (
          <div className="text-center py-16 bg-white rounded-2xl"
            style={{ border: '1px solid #D8EEE0' }}>
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: '#2A7A4C', borderTopColor: 'transparent' }}></div>
            <p className="font-semibold" style={{ color: '#0F2318' }}>
              Analyse semantique en cours...
            </p>
            <p className="text-sm mt-1" style={{ color: '#6A9A7C' }}>
              LLaMA3 analyse vos documents
            </p>
          </div>
        )}

        {/* Interpretation */}
        {interpretation && !loading && (
          <div className="rounded-2xl p-4 mb-4"
            style={{ background: '#F0F7F3', border: '1px solid #C8E6D4' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-1"
              style={{ color: '#1A6B3C' }}>
              Interpretation de l'IA
            </p>
            <p className="text-sm" style={{ color: '#1A3A2C' }}>{interpretation}</p>
          </div>
        )}

        {/* Résultats */}
        {searched && !loading && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ color: '#0F2318' }}>
                {results.length > 0
                  ? `${results.length} document(s) trouve(s) pour "${query}"`
                  : `Aucun document trouve pour "${query}"`
                }
              </p>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl"
                style={{ border: '1px solid #D8EEE0' }}>
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: '#F0F7F3' }}>
                  <span className="text-lg font-bold" style={{ color: '#2A7A4C' }}>?</span>
                </div>
                <p className="font-semibold text-lg mb-2" style={{ color: '#0F2318' }}>
                  Aucun resultat semantique
                </p>
                <p className="text-sm max-w-sm mx-auto" style={{ color: '#6A9A7C' }}>
                  Essayez avec d'autres termes ou indexez plus de documents via l'OCR.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((doc, index) => {
                  const sc    = statusConfig[doc.status] || statusConfig.draft
                  const score = getScoreColor(doc.relevance_score)
                  return (
                    <div key={doc.id} className="bg-white rounded-2xl p-5 transition-shadow hover:shadow-md"
                      style={{ border: '1px solid #D8EEE0' }}>
                      <div className="flex items-start gap-4">

                        {/* Rang */}
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: '#0F2318' }}>
                          <span className="text-xs font-bold" style={{ color: '#7ABA8E' }}>
                            {index + 1}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h3 className="text-sm font-bold" style={{ color: '#0F2318' }}>
                                {doc.name}
                              </h3>
                              <p className="text-xs mt-0.5" style={{ color: '#6A9A7C' }}>
                                {doc.folder} · {doc.creator} ·{' '}
                                {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                {doc.file_size > 0 && ` · ${formatSize(doc.file_size)}`}
                              </p>
                            </div>

                            {/* Score */}
                            <div
                              className="flex-shrink-0 text-center px-3 py-1.5 rounded-xl"
                              style={{
                                background: score.bg,
                                color:      score.color,
                                border:     `1px solid ${score.border}`,
                              }}
                            >
                              <p className="text-sm font-bold">{doc.relevance_score}%</p>
                              <p className="text-xs">{getScoreLabel(doc.relevance_score)}</p>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.classes}`}>
                              {sc.label}
                            </span>
                            {doc.ocr_status === 'done' && (
                              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                                style={{ background: '#F0F7F3', color: '#1A6B3C' }}>
                                OCR indexe
                              </span>
                            )}
                            {doc.tags?.map((tag) => (
                              <span key={tag.id}
                                className="text-xs px-2.5 py-1 rounded-full font-medium"
                                style={{ background: tag.color + '20', color: tag.color }}>
                                {tag.name}
                              </span>
                            ))}
                          </div>

                          {/* Raison */}
                          <div className="px-3 py-2 rounded-xl"
                            style={{ background: '#F4F7F5', border: '1px solid #D8EEE0' }}>
                            <p className="text-xs" style={{ color: '#3A5A4A' }}>
                              <span className="font-semibold">Pourquoi ce document : </span>
                              {doc.relevance_reason}
                            </p>
                          </div>

                          {doc.description && (
                            <p className="text-xs mt-2 italic" style={{ color: '#6A9A7C' }}>
                              "{doc.description}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Etat initial */}
        {!searched && !loading && (
          <div className="text-center py-16 bg-white rounded-2xl"
            style={{ border: '1px solid #D8EEE0' }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: '#0F2318' }}>
              <span className="text-sm font-bold" style={{ color: '#7ABA8E' }}>IA</span>
            </div>
            <p className="font-semibold text-lg mb-2" style={{ color: '#0F2318' }}>
              Recherche semantique intelligente
            </p>
            <p className="text-sm max-w-sm mx-auto" style={{ color: '#6A9A7C' }}>
              Posez une question naturelle et l'IA trouvera les documents
              les plus pertinents dans votre GED.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}