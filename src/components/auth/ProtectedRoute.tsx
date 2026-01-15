import {Navigate, Outlet} from 'react-router-dom'
import {useAuthStore} from '@/stores/authStore'
import {useStorageModeStore} from '@/stores/storageModeStore'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  const storageMode = useStorageModeStore((state) => state.mode)

  if (storageMode === 'cloud' && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

