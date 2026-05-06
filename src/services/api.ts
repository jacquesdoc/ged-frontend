import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Accept: 'application/json' },
})
console.log('API URL:', import.meta.env.VITE_API_URL)

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
  preview:  (id: number)      =>
    `${import.meta.env.VITE_API_URL}/documents/${id}/preview`,
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
  myFolders: () => api.get('/my-folders'),
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
  delete: (id: number) => api.delete(`/workflows/${id}`),
}

// ── Utilisateurs ──────────────────────────────────────────────────────────
export const userService = {
  list: (params?: object) =>
    api.get('/users', { params }),
  get: (id: number) =>
    api.get(`/users/${id}`),
  create: (data: object) =>
    api.post('/users', data),
  update: (id: number, data: object) =>
    api.put(`/users/${id}`, data),
  delete: (id: number) =>
    api.delete(`/users/${id}`),
  changePassword: (id: number, data: object) =>
    api.put(`/users/${id}/password`, data),
  toggleStatus: (id: number) =>
    api.post(`/users/${id}/toggle-status`),
}

// ── Audit ─────────────────────────────────────────────────────────────────
export const auditService = {
  list:   (params?: object) => api.get('/audit', { params }),
  export: (params?: object) => api.get('/audit/export', { params, responseType: 'blob' }),
  stats:  ()                => api.get('/audit/stats'),
}

// ── Groupes ───────────────────────────────────────────────────────────────
export const groupService = {
  list:               ()                    => api.get('/user-groups'),
  create:             (data: object)        => api.post('/user-groups', data),
  update:             (id: number, data: object) => api.put(`/user-groups/${id}`, data),
  delete:             (id: number)          => api.delete(`/user-groups/${id}`),
  grantFolderAccess:  (id: number, data: object) =>
    api.post(`/user-groups/${id}/folder-access`, data),
  pendingAccess:      ()                    => api.get('/pending-folder-access'),
  approveAccess:      (groupId: number, folderId: number) =>
    api.put(`/user-groups/${groupId}/folder-access/${folderId}/approve`),
}

// ── Notifications ─────────────────────────────────────────────────────────
export const notificationService = {
  list:    ()           => api.get('/notifications'),
  unread:  ()           => api.get('/notifications/unread'),
  markRead:(id: string) => api.post(`/notifications/${id}/read`),
  markAll: ()           => api.post('/notifications/read-all'),
}

// ── Demandes de suppression ───────────────────────────────────────────────
export const deletionService = {
  list:       ()                    => api.get('/deletion-requests'),
  pending:    ()                    => api.get('/deletion-requests/pending'),
  create:     (data: object)        => api.post('/deletion-requests', data),
  approve:    (id: number, data?: object) =>
    api.post(`/deletion-requests/${id}/approve`, data || {}),
  reject:     (id: number, comment: string) =>
    api.post(`/deletion-requests/${id}/reject`, { admin_comment: comment }),
  myRequests: ()                    => api.get('/my-deletion-requests'),
}

// ── Profil ────────────────────────────────────────────────────────────────
export const profileService = {
  get:                ()                    => api.get('/profile'),
  update:             (data: object)        => api.put('/profile', data),
  uploadAvatar:       (file: File)          => {
    const fd = new FormData()
    fd.append('avatar', file)
    return api.post('/profile/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  changePassword:     (data: object)        => api.put('/profile/password', data),
  updateNotifications:(data: object)        => api.put('/profile/notifications', data),
  revokeSession:      (id: number)          => api.delete(`/profile/sessions/${id}`),
  revokeAllSessions:  ()                    => api.delete('/profile/sessions'),
}