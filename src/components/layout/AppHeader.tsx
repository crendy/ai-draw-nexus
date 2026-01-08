import {ChevronDown, LogOut} from 'lucide-react'
import {Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui'
import {authService} from '@/services/authService'
import {useNavigate} from 'react-router-dom'
import {useAuthStore} from '@/stores/authStore'
import {useSystemStore} from '@/stores/systemStore'
import {ENGINES} from '@/constants'

export function AppHeader() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const defaultEngine = useSystemStore((state) => state.defaultEngine)
  const setDefaultEngine = useSystemStore((state) => state.setDefaultEngine)

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between px-8 py-4">
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 rounded-full border-border bg-surface">
              <span className="text-sm font-medium">
                {ENGINES.find(e => e.value === defaultEngine)?.label || 'Draw.io'}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {ENGINES.map((engine) => (
              <DropdownMenuItem
                key={engine.value}
                onClick={() => setDefaultEngine(engine.value)}
                className="flex flex-col items-start gap-1 py-2"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">{engine.label}</span>
                  {defaultEngine === engine.value && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {engine.description}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted">简体中文</span>
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{user.nickname || user.username}</span>
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
