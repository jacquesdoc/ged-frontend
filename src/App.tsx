import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
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

        {/* Routes admin seulement */}
        <Route path="audit"  element={<AdminRoute><AuditPage /></AdminRoute>} />
        <Route path="users"  element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="groups" element={<AdminRoute><GroupsPage /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}