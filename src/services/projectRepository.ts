import {v4 as uuidv4} from 'uuid'
import type {EngineType, Project} from '@/types'
import {authService} from './authService'
import {useStorageModeStore} from '@/stores/storageModeStore'
import {db} from './db'

const API_BASE = '/api'

/**
 * Project Repository
 * Data access layer for project management (Supports both Local and Cloud storage)
 */
export const ProjectRepository = {
  /**
   * Create a new project
   */
  async create(data: {
    title: string
    engineType: EngineType
    thumbnail?: string
    groupId?: string
  }): Promise<Project> {
    const mode = useStorageModeStore.getState().mode
    const now = new Date()
    const project: Project = {
      id: uuidv4(),
      title: data.title,
      engineType: data.engineType,
      thumbnail: data.thumbnail || '',
      groupId: data.groupId,
      createdAt: now,
      updatedAt: now,
    }

    if (mode === 'local') {
      await db.projects.add(project)
      return project
    }

    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader()
      },
      body: JSON.stringify(project),
    })

    if (!response.ok) {
      throw new Error('Failed to create project')
    }

    return project
  },

  /**
   * Get project by ID
   */
  async getById(id: string): Promise<Project | undefined> {
    const mode = useStorageModeStore.getState().mode

    if (mode === 'local') {
      return await db.projects.get(id)
    }

    const response = await fetch(`${API_BASE}/projects/${id}`, {
      headers: authService.getAuthHeader()
    })
    if (response.status === 404) return undefined
    if (!response.ok) throw new Error('Failed to get project')

    const project = await response.json()
    // Convert date strings back to Date objects
    return {
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
    }
  },

  /**
   * Get all projects, sorted by updatedAt descending
   */
  async getAll(): Promise<Project[]> {
    const mode = useStorageModeStore.getState().mode

    if (mode === 'local') {
      const projects = await db.projects.orderBy('updatedAt').reverse().toArray()
      return projects
    }

    const response = await fetch(`${API_BASE}/projects`, {
      headers: authService.getAuthHeader()
    })
    if (!response.ok) throw new Error('Failed to get projects')

    const projects = await response.json()
    return projects.map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }))
  },

  /**
   * Update project
   */
  async update(
    id: string,
    data: Partial<Omit<Project, 'id' | 'createdAt'>>
  ): Promise<void> {
    const mode = useStorageModeStore.getState().mode

    if (mode === 'local') {
      await db.projects.update(id, {
        ...data,
        updatedAt: new Date(),
      })
      return
    }

    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeader()
      },
      body: JSON.stringify({
        ...data,
        updatedAt: new Date(),
      }),
    })

    if (!response.ok) throw new Error('Failed to update project')
  },

  /**
   * Delete project and its version history
   */
  async delete(id: string): Promise<void> {
    const mode = useStorageModeStore.getState().mode

    if (mode === 'local') {
      await db.transaction('rw', db.projects, db.versions, async () => {
        await db.projects.delete(id)
        await db.versions.where('projectId').equals(id).delete()
      })
      return
    }

    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
      headers: authService.getAuthHeader()
    })

    if (!response.ok) throw new Error('Failed to delete project')
  },

  /**
   * Search projects by title keyword
   */
  async search(keyword: string): Promise<Project[]> {
    // Fetch all and filter client-side for simplicity
    const projects = await this.getAll()
    const lowerKeyword = keyword.toLowerCase()
    return projects.filter((project) =>
      project.title.toLowerCase().includes(lowerKeyword)
    )
  },
}
