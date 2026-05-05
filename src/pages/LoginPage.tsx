import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const navigate  = useNavigate()
  const setAuth   = useAuthStore((s) => s.setAuth)
  const [email,    setEmail]    = useState('admin@ged.ci')
  const [password, setPassword] = useState('Admin@2024!')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data } = await authService.login(email, password)
      setAuth(data.user, data.token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        'Erreur de connexion. Vérifiez vos identifiants.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GED Platform</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion Électronique de Documents</p>
          <p className="text-green-700 text-xs font-semibold mt-1">IVOPREST • Côte d'Ivoire</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none transition-colors text-sm"
              placeholder="votre@email.ci"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none transition-colors text-sm"
              placeholder="••••••••"
            />
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-700 hover:bg-green-800 disabled:bg-green-300 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Comptes de test */}
        <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
          <p className="text-xs font-semibold text-green-800 mb-2">
            Comptes de démonstration
          </p>
          {[
            { role: 'Admin',   email: 'admin@ged.ci',   password: 'Admin@2024!' },
            { role: 'Éditeur', email: 'editeur@ged.ci', password: 'Editor@2024!' },
            { role: 'Lecteur', email: 'lecteur@ged.ci', password: 'Reader@2024!' },
          ].map((c) => (
            <div
              key={c.role}
              onClick={() => { setEmail(c.email); setPassword(c.password) }}
              className="cursor-pointer text-xs text-green-700 hover:text-green-900 py-1"
            >
              <strong>{c.role} :</strong> {c.email}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}