import {useLocation, useNavigate} from 'react-router-dom'
import {ChevronLeft, ChevronRight, Github, LogOut, Plus, User} from 'lucide-react'
import {NAV_ITEMS} from '@/constants'
import {useSystemStore} from '@/stores/systemStore'
import {useAuthStore} from '@/stores/authStore'
import {authService} from '@/services/authService'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Logo} from '@/components/ui'

interface AppSidebarProps {
  onCreateProject?: () => void
}

export function AppSidebar({ onCreateProject }: AppSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const showAbout = useSystemStore((state) => state.showAbout)
  const isCollapsed = useSystemStore((state) => state.sidebarCollapsed)
  const setSidebarCollapsed = useSystemStore((state) => state.setSidebarCollapsed)
  const user = useAuthStore((state) => state.user)

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[72px] flex-col items-center border-r border-border bg-surface py-4 transition-all duration-300">
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-surface shadow-sm transition-transform hover:scale-105 active:scale-95"
        title="返回首页"
      >
        <Logo className="h-6 w-6" />
      </button>

      {/* New Project Button */}
      {onCreateProject && (
        <button
          onClick={onCreateProject}
          className="group mb-6 flex flex-col items-center justify-center gap-1"
          title="新建文件"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-border bg-background transition-all group-hover:border-primary group-hover:text-primary">
            <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
          </div>
          {!isCollapsed && <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary">新建</span>}
        </button>
      )}

      {/* Navigation Items */}
      <nav className="flex flex-1 flex-col items-center gap-4 w-full px-2">
        {NAV_ITEMS.map((item, index) => {
          if (item.path === '/about' && !showAbout) return null
          // @ts-ignore
          if (item.adminOnly && user?.role !== 'admin') return null

          const isActive = location.pathname === item.path

          return (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`group flex w-full flex-col items-center justify-center gap-1 rounded-xl py-2 transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-primary'
              }`}
              title={item.label}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
              {!isCollapsed && (
                <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto flex flex-col items-center gap-4 w-full px-2 pb-2">
        {/* GitHub Link */}
        <a
          href="https://github.com/stone-yu/ai-draw"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-primary"
          title="GitHub 开源仓库"
        >
          <Github className="h-5 w-5" />
        </a>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!isCollapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-primary"
          title={isCollapsed ? "展开菜单" : "折叠菜单"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* User Avatar & Actions */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-muted/50 focus:outline-none">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary ring-2 ring-background transition-shadow hover:ring-primary/20">
                  {(user.nickname || user.username).slice(0, 2).toUpperCase()}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="w-56 ml-2">
              <div className="flex items-center gap-2 p-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {(user.nickname || user.username).slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium">{user.nickname || user.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </div>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>个人信息</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  )
}
