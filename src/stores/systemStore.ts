import {create} from 'zustand'
import type {EngineType} from '@/types'

interface SystemState {
  systemName: string
  showAbout: boolean
  sidebarCollapsed: boolean
  defaultEngine: EngineType
  setSystemName: (name: string) => void
  setShowAbout: (show: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setDefaultEngine: (engine: EngineType) => void
}

export const useSystemStore = create<SystemState>((set) => ({
  systemName: (window as any)._ENV_?.SYSTEM_NAME || '智绘(AI Draw)',
  showAbout: (window as any)._ENV_?.SHOW_ABOUT !== false, // Default to true if not set
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  defaultEngine: (localStorage.getItem('defaultEngine') as EngineType) || (window as any)._ENV_?.DEFAULT_ENGINE || 'drawio',
  setSystemName: (name) => set({ systemName: name }),
  setShowAbout: (show) => set({ showAbout: show }),
  setSidebarCollapsed: (collapsed) => {
    localStorage.setItem('sidebarCollapsed', String(collapsed))
    set({ sidebarCollapsed: collapsed })
  },
  setDefaultEngine: (engine) => {
    localStorage.setItem('defaultEngine', engine)
    set({ defaultEngine: engine })
  },
}))

