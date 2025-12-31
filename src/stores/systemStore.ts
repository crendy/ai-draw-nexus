import {create} from 'zustand'

interface SystemState {
  systemName: string
  showAbout: boolean
  setSystemName: (name: string) => void
  setShowAbout: (show: boolean) => void
}

export const useSystemStore = create<SystemState>((set) => ({
  systemName: (window as any)._ENV_?.SYSTEM_NAME || 'AI Draw Nexus',
  showAbout: (window as any)._ENV_?.SHOW_ABOUT !== false, // Default to true if not set
  setSystemName: (name) => set({ systemName: name }),
  setShowAbout: (show) => set({ showAbout: show }),
}))

