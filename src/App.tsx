import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { authService } from './services/api'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DocumentsPage from './pages/DocumentsPage'
import FoldersPage from './pages/FoldersPage'
import WorkflowsPage from './pages/WorkflowsPage'
import AuditPage from './pages/AuditPage'
import UsersPage from './pages/UsersPage'
import GroupsPage from './pages/GroupsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, isAdmin } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (!isAdmin()) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const { token, setAuth, logout } = useAuthStore()
  const [loading, setLoading] = useState(true)

  // ── Recharger le profil au démarrage si token présent ──────────────────
  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const { data } = await authService.me()
        setAuth(data, token)
      } catch (err) {
        // Token expiré ou invalide
        logout()
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  // Afficher un écran de chargement pendant la vérification du token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={
        <PrivateRoute><Layout /></PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"  element={<DashboardPage />} />
        <Route path="documents"  element={<DocumentsPage />} />
        <Route path="folders"    element={<FoldersPage />} />
        <Route path="workflows"  element={<WorkflowsPage />} />
        <Route path="audit"      element={<AdminRoute><AuditPage /></AdminRoute>} />
        <Route path="users"      element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="groups"     element={<AdminRoute><GroupsPage /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}