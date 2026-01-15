import {create} from 'zustand'
import {persist} from 'zustand/middleware'

export type StorageMode = 'local' | 'cloud'

interface StorageModeState {
  mode: StorageMode
  setMode: (mode: StorageMode) => void
}

export const useStorageModeStore = create<StorageModeState>()(
  persist(
    (set) => ({
      mode: 'local', // Default to local mode
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'storage-mode',
    }
  )
)

