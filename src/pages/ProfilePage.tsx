import {useEffect, useState} from 'react'
import {AppHeader, AppSidebar} from '@/components/layout'
import {Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input} from '@/components/ui'
import {quotaService} from '@/services/quotaService'
import {authService} from '@/services/authService'
import {useToast} from '@/hooks/useToast'
import {Eye, EyeOff, MessageCircle, Settings, User} from 'lucide-react'
import {Link} from 'react-router-dom'
import {useAuthStore} from '@/stores/authStore'

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [quotaUsed, setQuotaUsed] = useState(0)
  const [quotaTotal, setQuotaTotal] = useState(10)
  const { success, error: showError } = useToast()
  const user = useAuthStore((state) => state.user)
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false)

  useEffect(() => {
    // 加载配额信息
    setQuotaUsed(quotaService.getUsedCount())
    setQuotaTotal(quotaService.getDailyQuota())
    // 加载已保存的密码
    setPassword(quotaService.getAccessPassword())
  }, [])

  const handleSavePassword = () => {
    if (!password.trim()) {
      showError('请输入访问密码')
      return
    }
    quotaService.setAccessPassword(password.trim())
    success('访问密码已保存')
  }

  const handleResetPassword = () => {
    quotaService.clearAccessPassword()
    setPassword('')
    success('访问密码已清除')
  }

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
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex flex-1 flex-col">
        <AppHeader />
        <div className="flex flex-1 items-start justify-center px-8 pt-12">
          <div className="w-full max-w-3xl rounded-xl border border-border bg-surface shadow-sm">
            <div className="flex min-h-[500px]">
              {/* 左侧 Tab */}
              <div className="w-48 border-r border-border p-4">
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
                    <span>用户信息</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      activeTab === 'settings'
                        ? 'bg-primary text-surface'
                        : 'text-muted hover:bg-background hover:text-primary'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>AI服务设置</span>
                  </button>
                </nav>
              </div>

              {/* 右侧内容区 */}
              <div className="flex-1 p-6">
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

                {activeTab === 'settings' && (
                  <>
                    <h2 className="mb-6 text-lg font-medium text-primary">AI服务设置</h2>

                    {/* 每日配额 */}
                    <QuotaSection
                      quotaUsed={quotaUsed}
                      quotaTotal={quotaTotal}
                      quotaPercentage={quotaPercentage}
                      hasPassword={hasPassword}
                    />

                    {/* 分隔线 */}
                    <div className="my-6 border-t border-border" />

                    {/* 访问密码 */}
                    <PasswordSection
                      password={password}
                      setPassword={setPassword}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                      onSave={handleSavePassword}
                      onReset={handleResetPassword}
                    />
                  </>
                )}
              </div>
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
    </div>
  )
}

interface QuotaSectionProps {
  quotaUsed: number
  quotaTotal: number
  quotaPercentage: number
  hasPassword: boolean
}

function QuotaSection({ quotaUsed, quotaTotal, quotaPercentage, hasPassword }: QuotaSectionProps) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-primary">每日配额</h3>
      <div className="space-y-3">
        {/* 进度条 */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${quotaPercentage}%` }}
          />
        </div>
        {/* 配额信息 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            已使用 <span className="font-medium text-primary">{quotaUsed}</span> / {quotaTotal} 次
          </span>
          {hasPassword && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
              无限制
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface PasswordSectionProps {
  password: string
  setPassword: (value: string) => void
  showPassword: boolean
  setShowPassword: (value: boolean) => void
  onSave: () => void
  onReset: () => void
}

function PasswordSection({
  password,
  setPassword,
  showPassword,
  setShowPassword,
  onSave,
  onReset,
}: PasswordSectionProps) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-primary">访问密码</h3>
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
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave}>
            保存
          </Button>
          <Button size="sm" variant="outline" onClick={onReset}>
            重置
          </Button>
        </div>
      </div>
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
