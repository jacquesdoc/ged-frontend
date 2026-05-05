import { useEffect, useState } from 'react'
import { workflowService, documentService, userService } from '../services/api'

interface Workflow {
  id: number
  type: string
  status: string
  current_step: number
  steps: any[]
  notes: string
  due_date: string
  created_at: string
  document?: { id: number; name: string }
  requester?: { name: string }
  approvals?: Array<{
    id: number
    step: number
    status: string
    comment: string
    acted_at: string
    approver?: { name: string }
  }>
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  pending:   { label: 'En attente',  classes: 'bg-gray-100 text-gray-700' },
  in_review: { label: 'En révision', classes: 'bg-amber-100 text-amber-700' },
  approved:  { label: 'Approuvé',    classes: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejeté',      classes: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Annulé',      classes: 'bg-gray-100 text-gray-500' },
}

const typeLabels: Record<string, string> = {
  validation:  'Validation',
  approval:    'Approbation',
  review:      'Révision',
  publication: 'Publication',
}

export default function WorkflowsPage() {
  const [workflows,  setWorkflows]  = useState<Workflow[]>([])
  const [pending,    setPending]    = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [showDetail, setShowDetail] = useState<Workflow | null>(null)
  const [documents,  setDocuments]  = useState<any[]>([])
  const [users,      setUsers]      = useState<any[]>([])

  // Formulaire création
  const [docId,       setDocId]       = useState('')
  const [type,        setType]        = useState('approval')
  const [approverIds, setApproverIds] = useState<number[]>([])
  const [notes,       setNotes]       = useState('')
  const [dueDate,     setDueDate]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  // Rejet
  const [showReject,    setShowReject]    = useState<number | null>(null)
  const [rejectComment, setRejectComment] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [wfRes, pendRes] = await Promise.all([
        workflowService.list(),
        workflowService.pendingApprovals(),
      ])
      setWorkflows(wfRes.data.data)
      setPending(pendRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchFormData = async () => {
    try {
      const [docsRes, usersRes] = await Promise.all([
        documentService.list({ per_page: 100 }),
        userService ? userService.list() : Promise.resolve({ data: [] }),
      ])
      setDocuments(docsRes.data.data || [])
      setUsers(usersRes.data.data || usersRes.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const openCreate = async () => {
    setDocId('')
    setType('approval')
    setApproverIds([])
    setNotes('')
    setDueDate('')
    setError('')
    setShowModal(true)
    await fetchFormData()
  }

  const toggleApprover = (id: number) => {
    setApproverIds(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docId)               { setError('Sélectionnez un document.'); return }
    if (approverIds.length === 0) { setError('Ajoutez au moins un approbateur.'); return }

    setSaving(true)
    setError('')
    try {
      await workflowService.create({
        document_id:   parseInt(docId),
        type,
        approver_ids:  approverIds,
        notes,
        due_date:      dueDate || undefined,
      })
      setShowModal(false)
      fetchAll()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await workflowService.approve(id)
      fetchAll()
    } catch (err) { console.error(err) }
  }

  const handleReject = async () => {
    if (!showReject || !rejectComment.trim()) return
    try {
      await workflowService.reject(showReject, rejectComment)
      setShowReject(null)
      setRejectComment('')
      fetchAll()
    } catch (err) { console.error(err) }
  }

  const handleCancel = async (id: number) => {
    if (!confirm('Annuler ce workflow ?')) return
    try {
      await workflowService.cancel(id)
      fetchAll()
    } catch (err) { console.error(err) }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Workflows</h1>
            <p className="text-sm text-gray-500">Circuits de validation et d'approbation</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition-colors"
          >
            <span className="text-lg">+</span> Nouveau workflow
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Approbations en attente */}
        {pending.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">⏳</span>
              <h2 className="font-bold text-amber-800">
                {pending.length} approbation(s) en attente pour vous
              </h2>
            </div>
            <div className="space-y-2">
              {pending.map((a) => (
                <div key={a.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-amber-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {a.workflow?.document?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Demandé par {a.workflow?.requester?.name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(a.workflow_id)}
                      className="px-3 py-1.5 bg-green-700 text-white text-xs font-semibold rounded-lg hover:bg-green-800 transition-colors"
                    >
                      ✓ Approuver
                    </button>
                    <button
                      onClick={() => { setShowReject(a.workflow_id); setRejectComment('') }}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                    >
                      ✕ Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liste des workflows */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔄</div>
            <p className="text-gray-500 font-medium">Aucun workflow</p>
            <p className="text-gray-400 text-sm mt-1">
              Créez un workflow pour valider vos documents
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Document</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Progression</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Demandeur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Échéance</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {workflows.map((wf) => {
                  const sc  = statusConfig[wf.status] || statusConfig.pending
                  const pct = wf.steps?.length > 0
                    ? Math.round((wf.current_step / wf.steps.length) * 100)
                    : 0

                  return (
                    <tr key={wf.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>📄</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {wf.document?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                          {typeLabels[wf.type] || wf.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 w-32">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-600 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {wf.current_step}/{wf.steps?.length}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.classes}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                            {wf.requester?.name?.[0] ?? '?'}
                          </div>
                          <span className="text-sm text-gray-600">{wf.requester?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {wf.due_date
                          ? new Date(wf.due_date).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setShowDetail(wf)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Détails"
                          >
                            👁️
                          </button>
                          {wf.status === 'in_review' && (
                            <button
                              onClick={() => handleCancel(wf.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Annuler"
                            >
                              🚫
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

      {/* Modal création workflow */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Nouveau workflow</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">

              {/* Document */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document <span className="text-red-500">*</span>
                </label>
                <select
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none bg-white"
                >
                  <option value="">Sélectionner un document...</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                        {d.name ?? 'Document sans nom'}
                    </option>
                    ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de workflow
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none bg-white"
                >
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Approbateurs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approbateurs <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400 ml-1">(dans l'ordre de validation)</span>
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3">
                  {users.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">
                      Chargement des utilisateurs...
                    </p>
                  ) : (
                    users.map((u) => (
                    <label key={u.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1 rounded-lg">
                        <input
                        type="checkbox"
                        checked={approverIds.includes(u.id)}
                        onChange={() => toggleApprover(u.id)}
                        className="w-4 h-4 accent-green-700"
                        />
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                        {u.name ? u.name[0] : '?'}
                        </div>
                        <div>
                        <p className="text-sm font-medium text-gray-800">
                            {u.name ?? 'Utilisateur'}
                        </p>
                        <p className="text-xs text-gray-400">
                            {u.email ?? ''}
                        </p>
                        </div>
                        {approverIds.includes(u.id) && (
                        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                            Étape {approverIds.indexOf(u.id) + 1}
                        </span>
                        )}
                    </label>
                    ))
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instructions pour les approbateurs..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none resize-none"
                />
              </div>

              {/* Date limite */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date limite
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  {saving ? 'Création...' : 'Créer le workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal rejet */}
      {showReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Motif du rejet</h2>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Expliquez pourquoi vous rejetez ce document..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowReject(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectComment.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}