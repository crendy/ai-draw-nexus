import {v4 as uuidv4} from 'uuid'
import type {VersionHistory} from '@/types'
import {authService} from './authService'
import {useStorageModeStore} from '@/stores/storageModeStore'
import {db} from './db'

const API_BASE = '/api'

/**
 * Version History Repository
 * Data access layer for version history management (Supports both Local and Cloud storage)
 */
export const VersionRepository = {
  /**
   * Create a new version
   */
  async create(data: {
    projectId: string
    content: string
    changeSummary: string
  }): Promise<VersionHistory> {
    const mode = useStorageModeStore.getState().mode
    const version: VersionHistory = {
      id: uuidv4(),
      projectId: data.projectId,
      content: data.content,
      changeSummary: data.changeSummary,
      timestamp: new Date(),
    }

    if (mode === 'local') {
      await db.versions.add(version)
      return version
    }

    const response = await fetch(`${API_BASE}/projects/${data.projectId}/versions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader()
      },
      body: JSON.stringify(version),
    })

    if (!response.ok) {
      throw new Error('Failed to create version')
    }

    return version
  },

  /**
   * Get all versions for a project, sorted by timestamp descending
   */
  async getByProjectId(projectId: string): Promise<VersionHistory[]> {
    const mode = useStorageModeStore.getState().mode

    if (mode === 'local') {
      return await db.versions
        .where('projectId')
        .equals(projectId)
        .reverse()
        .sortBy('timestamp')
    }

    const response = await fetch(`${API_BASE}/projects/${projectId}/versions`, {
      headers: authService.getAuthHeader()
    })
    if (!response.ok) return []

    const versions = await response.json()
    return versions.map((v: any) => ({
      ...v,
      timestamp: new Date(v.timestamp),
    }))
  },

  /**
   * Get the latest version for a project
   */
  async getLatest(projectId: string): Promise<VersionHistory | undefined> {
    const mode = useStorageModeStore.getState().mode

    if (mode === 'local') {
      const versions = await db.versions
        .where('projectId')
        .equals(projectId)
        .reverse()
        .sortBy('timestamp')
      return versions[0]
    }

    const response = await fetch(`${API_BASE}/projects/${projectId}/versions/latest`, {
      headers: authService.getAuthHeader()
    })
    if (response.status === 404) return undefined
    if (!response.ok) throw new Error('Failed to get latest version')

    const version = await response.json()
    return {
      ...version,
      timestamp: new Date(version.timestamp),
    }
  },

  /**
   * Get version by ID
   */
  async getById(id: string): Promise<VersionHistory | undefined> {
    const mode = useStorageModeStore.getState().mode

    if (mode === 'local') {
      return await db.versions.get(id)
    }

    // Not implemented efficiently in server mode
    console.warn('VersionRepository.getById is not fully supported in server mode')
    return undefined
  },

  /**
   * Delete a specific version
   */
  async delete(id: string): Promise<void> {
    const mode = useStorageModeStore.getState().mode

    if (mode === 'local') {
      await db.versions.delete(id)
      return
    }

    console.warn('VersionRepository.delete is not supported in server mode')
  },

  /**
   * Delete all versions for a project
   */
  async deleteByProjectId(projectId: string): Promise<void> {
    const mode = useStorageModeStore.getState().mode

    if (mode === 'local') {
      await db.versions.where('projectId').equals(projectId).delete()
      return
    }

    const response = await fetch(`${API_BASE}/projects/${projectId}/versions`, {
      method: 'DELETE',
      headers: authService.getAuthHeader()
    })
    if (!response.ok) throw new Error('Failed to delete versions')
  },

  /**
   * Update the latest version's content for a project
   */
  async updateLatest(projectId: string, content: string): Promise<void> {
    const mode = useStorageModeStore.getState().mode

    if (mode === 'local') {
      const latest = await this.getLatest(projectId)
      if (latest) {
        await db.versions.update(latest.id, { content })
      }
      return
    }

    const response = await fetch(`${API_BASE}/projects/${projectId}/versions/latest`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader()
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) throw new Error('Failed to update latest version')
  },
}
