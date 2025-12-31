import {LogOut, Sparkles} from 'lucide-react'
import {Button} from '@/components/ui'
import {authService} from '@/services/authService'
import {useNavigate} from 'react-router-dom'
import {useAuthStore} from '@/stores/authStore'
import {useSystemStore} from '@/stores/systemStore'

export function AppHeader() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const systemName = useSystemStore((state) => state.systemName)

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between px-8 py-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-4 w-4 text-surface" />
        </div>
        <span className="text-lg font-semibold text-primary">{systemName}</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted">简体中文</span>
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{user.username}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              title="退出登录"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>退出</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
