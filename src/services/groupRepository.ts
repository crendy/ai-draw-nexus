import {v4 as uuidv4} from 'uuid'
import type {Group} from '@/types'

const API_BASE = '/api'

/**
 * Group Repository
 * Data access layer for group management (Server-side storage)
 */
export const GroupRepository = {
  /**
   * Create a new group
   */
  async create(name: string): Promise<Group> {
    const now = new Date()
    const group: Group = {
      id: uuidv4(),
      name,
      createdAt: now,
      updatedAt: now,
    }

    const response = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group),
    })

    if (!response.ok) {
      throw new Error('Failed to create group')
    }

    return group
  },

  /**
   * Get all groups, sorted by createdAt ascending
   */
  async getAll(): Promise<Group[]> {
    const response = await fetch(`${API_BASE}/groups`)
    if (!response.ok) throw new Error('Failed to get groups')

    const groups = await response.json()
    return groups.map((g: any) => ({
      ...g,
      createdAt: new Date(g.createdAt),
      updatedAt: new Date(g.updatedAt),
    }))
  },

  /**
   * Update group
   */
  async update(id: string, name: string): Promise<void> {
    const response = await fetch(`${API_BASE}/groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        updatedAt: new Date(),
      }),
    })

    if (!response.ok) throw new Error('Failed to update group')
  },

  /**
   * Delete group
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/groups/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete group')
  },
}

