import {useAuthStore} from '@/stores/authStore'
import type {EngineType} from '@/types'

const API_BASE = '/api/auth'

export interface SystemSettings {
  ai?: {
    provider?: string
    baseUrl?: string
    apiKey?: string
    modelId?: string
  }
  system?: {
    name?: string
    showAbout?: boolean
    defaultEngine?: EngineType
    defaultModelPrompt?: string
  }
}

export interface ExampleProject {
  id: string
  title: string
  engineType: EngineType
  content: string
  thumbnail: string
  createdAt: string
  updatedAt: string
}

export const authService = {
  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    useAuthStore.getState().setAuth(data.user, data.token)
    return data
  },

  async register(username: string, password: string) {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Registration failed')
    }

    return await response.json()
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await fetch(`${API_BASE}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to change password')
    }

    return await response.json()
  },

  logout() {
    useAuthStore.getState().logout()
  },

  getAuthHeader(): Record<string, string> {
    const token = useAuthStore.getState().token
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  },

  async getUsers() {
    const response = await fetch('/api/admin/users', {
      headers: this.getAuthHeader()
    })
    if (!response.ok) throw new Error('Failed to fetch users')
    return await response.json()
  },

  async updateUserRole(userId: string, role: 'user' | 'admin') {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify({ role })
    })
    if (!response.ok) throw new Error('Failed to update user role')
    return await response.json()
  },

  async deleteUser(userId: string) {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete user')
    }
  },

  async getSystemSettings(): Promise<SystemSettings> {
    const response = await fetch('/api/admin/settings', {
      headers: this.getAuthHeader()
    })
    if (!response.ok) throw new Error('Failed to fetch settings')
    return await response.json()
  },

  async updateSystemSettings(settings: SystemSettings) {
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify(settings)
    })
    if (!response.ok) throw new Error('Failed to update settings')
    return await response.json()
  },

  async getUserProfile() {
    const response = await fetch('/api/auth/profile', {
      headers: this.getAuthHeader()
    })
    if (!response.ok) throw new Error('Failed to fetch profile')
    return await response.json()
  },

  async updateUserNickname(nickname: string) {
    const response = await fetch('/api/auth/profile/nickname', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify({ nickname })
    })
    if (!response.ok) throw new Error('Failed to update nickname')
    const data = await response.json()

    // Update local store
    const currentUser = useAuthStore.getState().user
    const token = useAuthStore.getState().token
    if (currentUser && token) {
      useAuthStore.getState().setAuth({ ...currentUser, nickname: data.nickname }, token)
    }

    return data
  },

  async updateUserAIConfig(config: any) {
    const response = await fetch('/api/auth/profile/ai-config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify(config)
    })
    if (!response.ok) throw new Error('Failed to update AI config')
    return await response.json()
  },

  async adminUpdateUserAIConfig(userId: string, config: any) {
    const response = await fetch(`/api/admin/users/${userId}/ai-config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify(config)
    })
    if (!response.ok) throw new Error('Failed to update user AI config')
    return await response.json()
  },

  async adminResetUserPassword(userId: string, password: string) {
    const response = await fetch(`/api/admin/users/${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify({ password })
    })
    if (!response.ok) throw new Error('Failed to reset password')
    return await response.json()
  },

  async adminUpdateUserAccessPassword(userId: string, accessPassword: string) {
    const response = await fetch(`/api/admin/users/${userId}/access-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify({ accessPassword })
    })
    if (!response.ok) throw new Error('Failed to update access password')
    return await response.json()
  },

  async validateAccessPassword(password: string) {
    const response = await fetch('/api/auth/validate-access-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify({ password })
    })
    if (!response.ok) throw new Error('Failed to validate password')
    return await response.json()
  },

  async getExampleProjects(): Promise<ExampleProject[]> {
    const response = await fetch('/api/admin/example-projects', {
      headers: this.getAuthHeader()
    })
    if (!response.ok) throw new Error('Failed to fetch example projects')
    return await response.json()
  },

  async getExampleProject(id: string): Promise<ExampleProject> {
    const response = await fetch(`/api/admin/example-projects/${id}`, {
      headers: this.getAuthHeader()
    })
    if (!response.ok) throw new Error('Failed to fetch example project')
    return await response.json()
  },

  async createExampleProject(project: Partial<ExampleProject>) {
    const response = await fetch('/api/admin/example-projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify(project)
    })
    if (!response.ok) throw new Error('Failed to create example project')
    return await response.json()
  },

  async updateExampleProject(id: string, project: Partial<ExampleProject>) {
    const response = await fetch(`/api/admin/example-projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify(project)
    })
    if (!response.ok) throw new Error('Failed to update example project')
    return await response.json()
  },

  async reorderExampleProjects(ids: string[]) {
    const response = await fetch('/api/admin/example-projects/reorder', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify({ ids })
    })
    if (!response.ok) throw new Error('Failed to reorder example projects')
    return await response.json()
  },

  async deleteExampleProject(id: string) {
    const response = await fetch(`/api/admin/example-projects/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    })
    if (!response.ok) throw new Error('Failed to delete example project')
  },

  async validateAIConfig(config: any) {
    const response = await fetch('/api/auth/validate-ai-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader()
      },
      body: JSON.stringify(config)
    })
    if (!response.ok) throw new Error('Failed to validate AI config')
    return await response.json()
  }
}

