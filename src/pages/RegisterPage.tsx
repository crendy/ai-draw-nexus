import {useEffect, useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {Button, Card, CardContent, CardFooter, CardHeader, CardTitle, Input} from '@/components/ui'
import {authService} from '@/services/authService'
import {useToast} from '@/hooks/useToast'

export function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { error: showError, success: showSuccess } = useToast()

  useEffect(() => {
    const checkSettings = async () => {
      try {
        const settings = await authService.getSystemSettings()
        if (settings.system?.allowRegister === false) {
          showError('管理员已关闭注册功能，请联系管理员')
          navigate('/login')
        }
      } catch (e) {
        console.error(e)
      }
    }
    checkSettings()
  }, [navigate, showError])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return

    if (password !== confirmPassword) {
      showError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await authService.register(username, password)
      showSuccess('Registration successful! Please login.')
      navigate('/login')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">注册账号</CardTitle>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">用户名</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入账号"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">密码</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">确认密码</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Register' : '注册'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              已有账号?{' '}
              <Link to="/login" className="text-primary hover:underline">
                登录
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

