import {ChevronDown, LogOut} from 'lucide-react'
import {Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui'
import {NotificationBar} from '@/components/ui/NotificationBar'
import {authService} from '@/services/authService'
import {useNavigate} from 'react-router-dom'
import {useAuthStore} from '@/stores/authStore'
import {useSystemStore} from '@/stores/systemStore'
import {ENGINES} from '@/constants'
import {useEffect} from 'react'

export function AppHeader() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const defaultEngine = useSystemStore((state) => state.defaultEngine)
  const setDefaultEngine = useSystemStore((state) => state.setDefaultEngine)
  const notifications = useSystemStore((state) => state.notifications)
  const setNotifications = useSystemStore((state) => state.setNotifications)

  useEffect(() => {
    const loadSystemSettings = async () => {
      try {
        const settings = await authService.getSystemSettings()
        if (settings.notifications) {
          setNotifications(settings.notifications)
        }
      } catch (error) {
        console.error('Failed to load system settings:', error)
      }
    }
    loadSystemSettings()
  }, [])

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  return (
    <header className="relative flex items-center justify-between px-8 py-4">
      <div className="flex items-center gap-4 z-10">
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

      {/* Notification Bar */}
      <div className="flex-1 mx-4 min-w-0 max-w-2xl flex justify-center">
        <NotificationBar
          message={notifications.homepage}
          className="rounded-md border-none bg-yellow-50/80 h-8 w-[70%]"
        />
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
