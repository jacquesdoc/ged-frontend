import { create } from 'zustand'

interface User {
  id: number
  name: string
  email: string
  roles: string[]
  permissions: string[]
}

interface AuthStore {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
  isAdmin: () => boolean
  isEditor: () => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: localStorage.getItem('ged_token'),

  setAuth: (user, token) => {
    localStorage.setItem('ged_token', token)
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('ged_token')
    set({ user: null, token: null })
  },

  isAdmin: () => get().user?.roles?.includes('admin') ?? false,
  isEditor: () => get().user?.roles?.includes('editor') ?? false,
}))