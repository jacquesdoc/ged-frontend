import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Accept: 'application/json' },
})

// Injecter le token automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ged_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Rediriger si non authentifié
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ged_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────────────
export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () =>
    api.post('/auth/logout'),
  me: () =>
    api.get('/auth/me'),
}

// ── Documents ─────────────────────────────────────────────────────────────
export const documentService = {
  list:     (params?: object) => api.get('/documents', { params }),
  get:      (id: number)      => api.get(`/documents/${id}`),
  create:   (data: FormData)  => api.post('/documents', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update:   (id: number, data: object) => api.put(`/documents/${id}`, data),
  delete:   (id: number)      => api.delete(`/documents/${id}`),
  download: (id: number)      =>
    api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  archive:  (id: number)      => api.post(`/documents/${id}/archive`),
  restore:  (id: number)      => api.post(`/documents/${id}/restore`),
  addComment: (id: number, content: string) =>
    api.post(`/documents/${id}/comments`, { content }),
}

// ── Dossiers ──────────────────────────────────────────────────────────────
export const folderService = {
  list:   (params?: object) => api.get('/folders', { params }),
  tree:   ()                => api.get('/folders/tree/all'),
  get:    (id: number)      => api.get(`/folders/${id}`),
  create: (data: object)    => api.post('/folders', data),
  update: (id: number, data: object) => api.put(`/folders/${id}`, data),
  delete: (id: number)      => api.delete(`/folders/${id}`),
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export const dashboardService = {
  stats: () => api.get('/dashboard/stats'),
}

// ── Tags ──────────────────────────────────────────────────────────────────
export const tagService = {
  list:   ()             => api.get('/tags'),
  create: (data: object) => api.post('/tags', data),
  delete: (id: number)   => api.delete(`/tags/${id}`),
}

// ── Workflows ─────────────────────────────────────────────────────────────
export const workflowService = {
  list:             (params?: object) => api.get('/workflows', { params }),
  get:              (id: number)      => api.get(`/workflows/${id}`),
  create:           (data: object)    => api.post('/workflows', data),
  approve:          (id: number, comment?: string) =>
    api.post(`/workflows/${id}/approve`, { comment }),
  reject:           (id: number, comment: string) =>
    api.post(`/workflows/${id}/reject`, { comment }),
  cancel:           (id: number)      => api.post(`/workflows/${id}/cancel`),
  pendingApprovals: ()                => api.get('/pending-approvals'),
}

// ── Utilisateurs ──────────────────────────────────────────────────────────
export const userService = {
  list: () => api.get('/users'),
}