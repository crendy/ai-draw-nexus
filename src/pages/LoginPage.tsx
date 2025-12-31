import {useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {Button, Card, CardContent, CardFooter, CardHeader, CardTitle, Input} from '@/components/ui'
import {authService} from '@/services/authService'
import {useToast} from '@/hooks/useToast'
import {useSystemStore} from '@/stores/systemStore'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { error: showError } = useToast()
  const systemName = useSystemStore((state) => state.systemName)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return

    setLoading(true)
    try {
      await authService.login(username, password)
      navigate('/')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">登录 {systemName}</CardTitle>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">账号</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入你的账号"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">密码</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入你的密码"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : 'Login'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              还没有账号?{' '}
              <Link to="/register" className="text-primary hover:underline">
                注册账号
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

