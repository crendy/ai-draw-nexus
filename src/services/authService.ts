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
  }
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

