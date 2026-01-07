import {useEffect, useState} from 'react'
import {AppSidebar, CreateProjectDialog} from '@/components/layout'
import {Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input} from '@/components/ui'
import {quotaService} from '@/services/quotaService'
import {authService} from '@/services/authService'
import {useToast} from '@/hooks/useToast'
import {Eye, EyeOff, KeyRound, MessageCircle, Server, Settings, Sparkles, Trash2, User, Users} from 'lucide-react'
import {Link} from 'react-router-dom'
import {useAuthStore} from '@/stores/authStore'
import {useSystemStore} from '@/stores/systemStore'
import {ENGINES} from '@/constants'
import type {EngineType} from '@/types'

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [quotaUsed, setQuotaUsed] = useState(0)
  const [quotaTotal, setQuotaTotal] = useState(10)
  const { success, error: showError } = useToast()
  const user = useAuthStore((state) => state.user)
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false)
  const [configUpdateTrigger, setConfigUpdateTrigger] = useState(0)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    // 加载配额信息
    setQuotaUsed(quotaService.getUsedCount())
    setQuotaTotal(quotaService.getDailyQuota())
    // 加载已保存的密码
    setPassword(quotaService.getAccessPassword())
  }, [])

  const handlePasswordChange = async (current: string, newPass: string) => {
    try {
      await authService.changePassword(current, newPass)
      success('密码修改成功')
    } catch (err) {
      showError(err instanceof Error ? err.message : '密码修改失败')
    }
  }

  const quotaPercentage = Math.min(100, (quotaUsed / quotaTotal) * 100)
  const hasPassword = quotaService.hasAccessPassword()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar onCreateProject={() => setIsCreateDialogOpen(true)} />
      <main className="flex flex-1 flex-col pl-[72px] h-full">
        <div className="flex flex-1 w-full bg-background overflow-hidden">
            <div className="flex h-full w-full">
              {/* 左侧 Tab */}
              <div className="w-48 border-r border-border bg-surface/50 p-4 overflow-y-auto">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-primary text-surface'
                        : 'text-muted hover:bg-background hover:text-primary'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>个人信息</span>
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => setActiveTab('users')}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        activeTab === 'users'
                          ? 'bg-primary text-surface'
                          : 'text-muted hover:bg-background hover:text-primary'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      <span>用户管理</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      activeTab === 'settings'
                        ? 'bg-primary text-surface'
                        : 'text-muted hover:bg-background hover:text-primary'
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>用户LLM模型</span>
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => setActiveTab('global-llm')}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        activeTab === 'global-llm'
                          ? 'bg-primary text-surface'
                          : 'text-muted hover:bg-background hover:text-primary'
                      }`}
                    >
                      <Server className="h-4 w-4" />
                      <span>全局LLM模型</span>
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => setActiveTab('system-settings')}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        activeTab === 'system-settings'
                          ? 'bg-primary text-surface'
                          : 'text-muted hover:bg-background hover:text-primary'
                      }`}
                    >
                      <Settings className="h-4 w-4" />
                      <span>系统设置</span>
                    </button>
                  )}
                </nav>
              </div>

              {/* 右侧内容区 */}
              <div className="flex-1 bg-surface p-6 overflow-y-auto">
                {activeTab === 'profile' && (
                  <>
                    <h2 className="mb-6 text-lg font-medium text-primary">用户信息</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-medium text-muted">用户名</label>
                        <div className="mt-1 text-lg font-medium text-primary">{user?.username}</div>
                      </div>
                      <div>
                        <Button onClick={() => setIsChangePasswordDialogOpen(true)}>
                          修改登录密码
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'users' && user?.role === 'admin' && (
                  <>
                    <h2 className="mb-6 text-lg font-medium text-primary">用户管理</h2>
                    <UserManagement />
                  </>
                )}

                {activeTab === 'settings' && (
                  <>
                    <h2 className="mb-6 text-lg font-medium text-primary">用户LLM模型设置</h2>

                    {/* 每日配额 */}
                    <QuotaSection
                      quotaUsed={quotaUsed}
                      quotaTotal={quotaTotal}
                      quotaPercentage={quotaPercentage}
                      hasPassword={hasPassword}
                      refreshTrigger={configUpdateTrigger}
                    />

                    {/* 分隔线 */}
                    <div className="my-6 border-t border-border" />

                    {/* 访问密码 */}
                    <UserAIConfigSection
                      password={password}
                      setPassword={setPassword}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                      onConfigSaved={() => setConfigUpdateTrigger(prev => prev + 1)}
                    />
                  </>
                )}

                {activeTab === 'global-llm' && user?.role === 'admin' && (
                  <>
                    <h2 className="mb-6 text-lg font-medium text-primary">全局 LLM 配置</h2>
                    <GlobalLLMConfig />
                  </>
                )}

                {activeTab === 'system-settings' && user?.role === 'admin' && (
                  <>
                    <h2 className="mb-6 text-lg font-medium text-primary">系统设置</h2>
                    <SystemSettingsConfig />
                  </>
                )}
              </div>
            </div>
        </div>
      </main>

      {/* 修改密码弹窗 */}
      <ChangePasswordDialog
        open={isChangePasswordDialogOpen}
        onOpenChange={setIsChangePasswordDialogOpen}
        onSave={handlePasswordChange}
      />

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  )
}

interface QuotaSectionProps {
  quotaUsed: number
  quotaTotal: number
  quotaPercentage: number
  hasPassword: boolean
  refreshTrigger?: number
}

function QuotaSection({ quotaUsed, quotaTotal, quotaPercentage, hasPassword, refreshTrigger }: QuotaSectionProps) {
  const [isUnlimited, setIsUnlimited] = useState(false)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    checkUnlimited()
  }, [hasPassword, user, refreshTrigger])

  const checkUnlimited = async () => {
    // If has password, it's unlimited
    if (hasPassword) {
      setIsUnlimited(true)
      return
    }

    // If user has custom AI config, it's unlimited
    try {
      const profile = await authService.getUserProfile()
      if (profile.aiConfig && profile.aiConfig.useCustom) {
        setIsUnlimited(true)
        return
      }
    } catch (err) {
      // Ignore
    }

    setIsUnlimited(false)
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-primary">每日配额</h3>
      <div className="space-y-3">
        {/* 进度条 */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: isUnlimited ? '0%' : `${quotaPercentage}%` }}
          />
        </div>
        {/* 配额信息 */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">
            {isUnlimited ? (
              <span>已使用 <span className="font-medium text-primary">{quotaUsed}</span> 次</span>
            ) : (
              <span>已使用 <span className="font-medium text-primary">{quotaUsed}</span> / {quotaTotal} 次</span>
            )}
          </span>
          {isUnlimited && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
              无限制
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface UserAIConfigSectionProps {
  password: string
  setPassword: (value: string) => void
  showPassword: boolean
  setShowPassword: (value: boolean) => void
  onConfigSaved?: () => void
}

function UserAIConfigSection({
  password,
  setPassword,
  showPassword,
  setShowPassword,
  onConfigSaved,
}: UserAIConfigSectionProps) {
  const [mode, setMode] = useState<'password' | 'custom'>('password')
  const [provider, setProvider] = useState('openai')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [modelId, setModelId] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadUserConfig()
  }, [])

  const loadUserConfig = async () => {
    try {
      const profile = await authService.getUserProfile()
      if (profile.aiConfig) {
        setMode(profile.aiConfig.useCustom ? 'custom' : 'password')
        setProvider(profile.aiConfig.provider || 'openai')
        setBaseUrl(profile.aiConfig.baseUrl || '')
        setApiKey(profile.aiConfig.apiKey || '')
        setModelId(profile.aiConfig.modelId || '')
      }
    } catch (err) {
      // Ignore error if profile load fails
    }
  }

  const handleSaveConfig = async () => {
    setLoading(true)
    try {
      if (mode === 'password') {
        // Validate password if provided
        if (password.trim()) {
          const result = await authService.validateAccessPassword(password.trim())
          if (!result.valid) {
            showError(result.error || '访问密码错误')
            setLoading(false)
            return
          }
          quotaService.setAccessPassword(password.trim())
        } else {
          // If empty, clear password
          quotaService.clearAccessPassword()
        }

        // Update user config to use system default
        await authService.updateUserAIConfig({
          useCustom: false,
          // Preserve existing custom config
          provider,
          baseUrl,
          apiKey,
          modelId
        })
        success('配置已保存')
        onConfigSaved?.()
      } else {
        // Validate custom config
        if (!baseUrl || !apiKey || !modelId) {
          showError('请填写完整的配置信息')
          setLoading(false)
          return
        }

        const validation = await authService.validateAIConfig({
          provider,
          baseUrl,
          apiKey,
          modelId
        })

        if (!validation.valid) {
          showError(validation.error || '配置验证失败，请检查参数')
          setLoading(false)
          return
        }

        // Save custom config
        await authService.updateUserAIConfig({
          useCustom: true,
          provider,
          baseUrl,
          apiKey,
          modelId
        })
        success('配置已保存')
        onConfigSaved?.()
      }
    } catch (err) {
      showError('保存配置失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-primary">配置模式</h3>
      <div className="mb-6 flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="ai-mode"
            checked={mode === 'password'}
            onChange={() => setMode('password')}
            className="h-4 w-4 text-primary"
          />
          <span className="text-sm">使用系统默认（访问密码）</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="ai-mode"
            checked={mode === 'custom'}
            onChange={() => setMode('custom')}
            className="h-4 w-4 text-primary"
          />
          <span className="text-sm">自定义模型</span>
        </label>
      </div>

      {mode === 'password' ? (
        <div className="space-y-3">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入访问密码"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted">
            输入正确的访问密码后，可无限制使用 AI 功能，不消耗每日配额。
          </p>
          <Link
            to="/about"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <MessageCircle className="h-3 w-3" />
            <span>进群可获得访问密码</span>
          </Link>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleSaveConfig} disabled={loading}>
              {loading ? '保存中...' : '保存配置'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted">API类型</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="openai">OpenAI</option>
              <option value="azure">Azure OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="custom">Custom (OpenAI Compatible)</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-muted">API地址</label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-muted">API Key</label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-muted">模型 ID</label>
            <Input
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="gpt-3.5-turbo"
              className="rounded-xl"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleSaveConfig} disabled={loading}>
              {loading ? '保存中...' : '保存配置'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (current: string, newPass: string) => Promise<void>
}

function ChangePasswordDialog({ open, onOpenChange, onSave }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const { error: showError } = useToast()

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowCurrent(false)
      setShowNew(false)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError('请填写所有字段')
      return
    }

    if (newPassword !== confirmPassword) {
      showError('两次输入的新密码不一致')
      return
    }

    if (newPassword.length < 6) {
      showError('新密码长度不能少于6位')
      return
    }

    setLoading(true)
    try {
      await onSave(currentPassword, newPassword)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>修改登录密码</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <Input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="当前密码"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新密码"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="确认新密码"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="rounded-full">
            {loading ? '保存中...' : '确认修改'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AppUser {
  id: string
  username: string
  role?: string
  hasAccessPassword?: boolean
  aiConfig?: {
    useCustom?: boolean
    provider?: string
    baseUrl?: string
    apiKey?: string
    modelId?: string
  }
}

function UserManagement() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const { success, error: showError } = useToast()
  const currentUser = useAuthStore((state) => state.user)
  const [selectedUserForConfig, setSelectedUserForConfig] = useState<AppUser | null>(null)
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<AppUser | null>(null)
  const [selectedUserForAccessPassword, setSelectedUserForAccessPassword] = useState<AppUser | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await authService.getUsers()
      setUsers(data)
    } catch (err) {
      showError('加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await authService.updateUserRole(userId, newRole)
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      success('角色更新成功')
    } catch (err) {
      showError('角色更新失败')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除该用户吗？此操作不可恢复。')) return

    try {
      await authService.deleteUser(userId)
      setUsers(users.filter(u => u.id !== userId))
      success('用户已删除')
    } catch (err) {
      showError('删除用户失败')
    }
  }

  const handleConfigSave = async (userId: string, config: any) => {
    try {
      await authService.adminUpdateUserAIConfig(userId, config)
      setUsers(users.map(u => u.id === userId ? { ...u, aiConfig: config } : u))
      success('用户配置已更新')
      setSelectedUserForConfig(null)
    } catch (err) {
      showError('更新配置失败')
    }
  }

  const handlePasswordReset = async (userId: string, password: string) => {
    try {
      await authService.adminResetUserPassword(userId, password)
      success('密码重置成功')
      setSelectedUserForPassword(null)
    } catch (err) {
      showError('密码重置失败')
    }
  }

  const handleAccessPasswordSave = async (userId: string, password: string) => {
    try {
      await authService.adminUpdateUserAccessPassword(userId, password)
      setUsers(users.map(u => u.id === userId ? { ...u, hasAccessPassword: !!password } : u))
      success('访问密码已更新')
      setSelectedUserForAccessPassword(null)
    } catch (err) {
      showError('更新访问密码失败')
    }
  }

  if (loading) return <div>加载中...</div>

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-4">
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">
                    {user.username}
                    {user.id === currentUser?.id && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                        登录用户
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted">ID: {user.id}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">角色:</span>
                  <select
                    value={user.role || 'user'}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                    disabled={user.id === currentUser?.id}
                    className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setSelectedUserForConfig(user)}
                  >
                    LLM设置
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 px-2 text-xs ${user.hasAccessPassword ? "text-primary border-primary/30 bg-primary/5" : "text-muted-foreground"}`}
                    onClick={() => setSelectedUserForAccessPassword(user)}
                  >
                    {user.hasAccessPassword ? "修改访问密码" : "设置访问密码"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="重置密码"
                    onClick={() => setSelectedUserForPassword(user)}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.id === currentUser?.id}
                    title={user.id === currentUser?.id ? '不能删除自己' : '删除用户'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedUserForConfig && (
        <AdminUserAIConfigDialog
          open={!!selectedUserForConfig}
          onOpenChange={(open) => !open && setSelectedUserForConfig(null)}
          user={selectedUserForConfig}
          onSave={handleConfigSave}
        />
      )}

      {selectedUserForPassword && (
        <AdminResetPasswordDialog
          open={!!selectedUserForPassword}
          onOpenChange={(open) => !open && setSelectedUserForPassword(null)}
          user={selectedUserForPassword}
          onSave={handlePasswordReset}
        />
      )}

      {selectedUserForAccessPassword && (
        <AdminAccessPasswordDialog
          open={!!selectedUserForAccessPassword}
          onOpenChange={(open) => !open && setSelectedUserForAccessPassword(null)}
          user={selectedUserForAccessPassword}
          onSave={handleAccessPasswordSave}
        />
      )}
    </div>
  )
}

interface AdminUserAIConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AppUser
  onSave: (userId: string, config: any) => Promise<void>
}

function AdminUserAIConfigDialog({ open, onOpenChange, user, onSave }: AdminUserAIConfigDialogProps) {
  const [mode, setMode] = useState<'password' | 'custom'>('password')
  const [provider, setProvider] = useState('openai')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [modelId, setModelId] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && user.aiConfig) {
      setMode(user.aiConfig.useCustom ? 'custom' : 'password')
      setProvider(user.aiConfig.provider || 'openai')
      setBaseUrl(user.aiConfig.baseUrl || '')
      setApiKey(user.aiConfig.apiKey || '')
      setModelId(user.aiConfig.modelId || '')
    } else {
      // Reset to defaults
      setMode('password')
      setProvider('openai')
      setBaseUrl('')
      setApiKey('')
      setModelId('')
    }
  }, [open, user])

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave(user.id, {
        useCustom: mode === 'custom',
        provider,
        baseUrl,
        apiKey,
        modelId
      })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>用户 LLM 配置 - {user.username}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-6 flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="admin-ai-mode"
                checked={mode === 'password'}
                onChange={() => setMode('password')}
                className="h-4 w-4 text-primary"
              />
              <span className="text-sm">使用系统默认</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="admin-ai-mode"
                checked={mode === 'custom'}
                onChange={() => setMode('custom')}
                className="h-4 w-4 text-primary"
              />
              <span className="text-sm">自定义模型</span>
            </label>
          </div>

          {mode === 'custom' && (
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted">API类型</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="openai">OpenAI</option>
                  <option value="azure">Azure OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="custom">Custom (OpenAI Compatible)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted">API地址</label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted">API Key</label>
                <div className="relative">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted">模型 ID</label>
                <Input
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="gpt-3.5-turbo"
                  className="rounded-xl"
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading} className="rounded-full">
            {loading ? '保存中...' : '保存配置'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AdminResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AppUser
  onSave: (userId: string, password: string) => Promise<void>
}

function AdminResetPasswordDialog({ open, onOpenChange, user, onSave }: AdminResetPasswordDialogProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { error: showError } = useToast()

  useEffect(() => {
    if (!open) setPassword('')
  }, [open])

  const handleSave = async () => {
    if (password.length < 6) {
      showError('密码长度不能少于6位')
      return
    }
    setLoading(true)
    try {
      await onSave(user.id, password)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>重置密码 - {user.username}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入新密码"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            重置后，用户需要使用新密码登录。
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading} className="rounded-full">
            {loading ? '重置中...' : '确认重置'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AdminAccessPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AppUser
  onSave: (userId: string, accessPassword: string) => Promise<void>
}

function AdminAccessPasswordDialog({ open, onOpenChange, user, onSave }: AdminAccessPasswordDialogProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { error: showError } = useToast()

  useEffect(() => {
    if (!open) setPassword('')
  }, [open])

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave(user.id, password)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>设置访问密码 - {user.username}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入访问密码（留空则清除）"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            设置后，用户需在 AI 设置中输入此密码以使用系统默认模型。
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading} className="rounded-full">
            {loading ? '保存中...' : '确认保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GlobalLLMConfig() {
  const [provider, setProvider] = useState('openai')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [modelId, setModelId] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const settings = await authService.getSystemSettings()
      if (settings.ai) {
        setProvider(settings.ai.provider || 'openai')
        setBaseUrl(settings.ai.baseUrl || '')
        setApiKey(settings.ai.apiKey || '')
        setModelId(settings.ai.modelId || '')
      }
    } catch (err) {
      showError('加载配置失败')
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await authService.updateSystemSettings({
        ai: {
          provider,
          baseUrl,
          apiKey,
          modelId
        }
      })
      success('配置已保存')
    } catch (err) {
      showError('保存配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('确定要重置配置吗？这将清除所有自定义设置。')) return
    setLoading(true)
    try {
      await authService.updateSystemSettings({
        ai: {}
      })
      setProvider('openai')
      setBaseUrl('')
      setApiKey('')
      setModelId('')
      success('配置已重置')
    } catch (err) {
      showError('重置配置失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-muted">API类型</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="openai">OpenAI</option>
            <option value="azure">Azure OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="custom">Custom (OpenAI Compatible)</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-muted">API地址</label>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            className="rounded-xl"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-muted">API Key</label>
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="rounded-xl pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-muted">模型 ID</label>
          <Input
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            placeholder="gpt-3.5-turbo"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        <p>配置全局 LLM API 后，所有用户默认都使用此配置，每日有10次限额。</p>

      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={loading} className="rounded-full">
          {loading ? '保存中...' : '保存'}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={loading} className="rounded-full">
          重置
        </Button>
      </div>
    </div>
  )
}

function SystemSettingsConfig() {
  const [systemName, setSystemName] = useState('')
  const [showAbout, setShowAbout] = useState(true)
  const [defaultEngine, setDefaultEngine] = useState<EngineType>('drawio')
  const [loading, setLoading] = useState(false)
  const { success, error: showError } = useToast()
  const setGlobalSystemName = useSystemStore((state) => state.setSystemName)
  const setGlobalShowAbout = useSystemStore((state) => state.setShowAbout)
  const setGlobalDefaultEngine = useSystemStore((state) => state.setDefaultEngine)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const settings = await authService.getSystemSettings()
      if (settings.system) {
        setSystemName(settings.system.name || '智绘 AI')
        setShowAbout(settings.system.showAbout !== false)
        setDefaultEngine(settings.system.defaultEngine || 'drawio')
      } else {
        setSystemName('智绘(AI Draw)')
        setShowAbout(true)
        setDefaultEngine('drawio')
      }
    } catch (err) {
      showError('加载配置失败')
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await authService.updateSystemSettings({
        system: {
          name: systemName,
          showAbout,
          defaultEngine
        }
      })
      setGlobalSystemName(systemName)
      setGlobalShowAbout(showAbout)
      setGlobalDefaultEngine(defaultEngine)
      document.title = systemName
      success('配置已保存')
    } catch (err) {
      showError('保存配置失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-muted">系统名称</label>
          <Input
            value={systemName}
            onChange={(e) => setSystemName(e.target.value)}
            placeholder="智绘 AI"
            className="rounded-xl"
          />
          <p className="mt-2 text-xs text-muted">
            设置系统的显示名称，将显示在浏览器标题、登录页和首页等位置。
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-muted">默认绘图引擎</label>
          <select
            value={defaultEngine}
            onChange={(e) => setDefaultEngine(e.target.value as EngineType)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            {ENGINES.map((engine) => (
              <option key={engine.value} value={engine.value}>
                {engine.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-muted">
            设置系统默认的绘图引擎，新用户或重置后将使用此引擎。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showAbout"
            checked={showAbout}
            onChange={(e) => setShowAbout(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="showAbout" className="text-sm font-medium text-muted cursor-pointer">
            显示"关于"菜单
          </label>
        </div>
      </div>
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={loading} className="rounded-full">
          {loading ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  )
}
