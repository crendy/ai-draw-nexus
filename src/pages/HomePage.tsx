import {useEffect, useRef, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Link, MoveRight, Paperclip, Send, Sparkles, X} from 'lucide-react'
import {Button, Loading, Logo} from '@/components/ui'
import {AppHeader, AppSidebar, CreateProjectDialog} from '@/components/layout'
import {QUICK_ACTIONS} from '@/constants'
import {formatDate} from '@/lib/utils'
import type {Attachment, DocumentAttachment, ImageAttachment, Project, UrlAttachment} from '@/types'
import {ProjectRepository} from '@/services/projectRepository'
import {useChatStore} from '@/stores/chatStore'
import {useAuthStore} from '@/stores/authStore'
import {useSystemStore} from '@/stores/systemStore'
import {aiService} from '@/services/aiService'
import {useToast} from '@/hooks/useToast'
import {
  fileToBase64,
  parseDocument,
  SUPPORTED_DOCUMENT_EXTENSIONS,
  SUPPORTED_IMAGE_TYPES,
  validateDocumentFile,
  validateImageFile,
} from '@/lib/fileUtils'

export function HomePage() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const defaultEngine = useSystemStore((state) => state.defaultEngine)
  const setDefaultEngine = useSystemStore((state) => state.setDefaultEngine)
  const [isLoading, setIsLoading] = useState(false)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [urlAttachments, setUrlAttachments] = useState<UrlAttachment[]>([])
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInputValue, setUrlInputValue] = useState('')
  const [isParsingUrl, setIsParsingUrl] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const setInitialPrompt = useChatStore((state) => state.setInitialPrompt)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const systemName = useSystemStore((state) => state.systemName)
  const { error: showError } = useToast()

  // 新建项目弹窗状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    loadRecentProjects()
  }, [])

  // 点击外部关闭引擎选择下拉框
  // useEffect(() => {
  //   const handleClickOutside = () => setShowEngineDropdown(false)
  //   if (showEngineDropdown) {
  //     document.addEventListener('click', handleClickOutside)
  //     return () => document.removeEventListener('click', handleClickOutside)
  //   }
  // }, [showEngineDropdown])

  const loadRecentProjects = async () => {
    try {
      const projects = await ProjectRepository.getAll()
      setRecentProjects(projects.slice(0, 5))
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  const handleQuickStart = async () => {
    if (!prompt.trim()) return

    if (!isAuthenticated()) {
      navigate('/login')
      return
    }

    setIsLoading(true)
    try {
      const project = await ProjectRepository.create({
        title: `Untitled-${Date.now()}`,
        engineType: defaultEngine,
      })

      // 转换文件附件为 Attachment 类型
      const convertedAttachments: Attachment[] = []

      for (const file of attachments) {
        if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
          const dataUrl = await fileToBase64(file)
          const imageAtt: ImageAttachment = {
            type: 'image',
            dataUrl,
            fileName: file.name,
          }
          convertedAttachments.push(imageAtt)
        } else {
          const content = await parseDocument(file)
          const docAtt: DocumentAttachment = {
            type: 'document',
            content,
            fileName: file.name,
          }
          convertedAttachments.push(docAtt)
        }
      }

      // 添加 URL 附件
      convertedAttachments.push(...urlAttachments)

      // 传递 prompt 和附件
      const allAttachments = convertedAttachments.length > 0 ? convertedAttachments : null
      setInitialPrompt(prompt.trim(), allAttachments)
      navigate(`/editor/${project.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
      showError('创建项目失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuickStart()
    }
  }

  // 处理剪贴板粘贴
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    const filesToProcess: File[] = []

    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) {
          filesToProcess.push(file)
        }
      }
    }

    if (filesToProcess.length === 0) return

    e.preventDefault()

    for (const file of filesToProcess) {
      // 处理图片
      if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        const validation = validateImageFile(file)
        if (!validation.valid) {
          showError(validation.error!)
          continue
        }
        // 为粘贴的图片生成文件名
        const fileName = file.name || `pasted-image-${Date.now()}.png`
        const newFile = new File([file], fileName, { type: file.type })
        setAttachments(prev => [...prev, newFile])
      }
      // 处理文档
      else if (SUPPORTED_DOCUMENT_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext.replace('*', '')))) {
        const validation = validateDocumentFile(file)
        if (!validation.valid) {
          showError(validation.error!)
          continue
        }
        setAttachments(prev => [...prev, file])
      }
    }
  }

  const handleQuickAction = async (action: (typeof QUICK_ACTIONS)[0]) => {
    // setDefaultEngine(action.engine) // Don't switch engine
    setPrompt(action.prompt)
    // 自动聚焦到输入框
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const removeUrlAttachment = (index: number) => {
    setUrlAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleUrlSubmit = async () => {
    const url = urlInputValue.trim()
    if (!url) return

    setIsParsingUrl(true)
    try {
      const result = await aiService.parseUrl(url)
      if (result.data) {
        const urlAttachment: UrlAttachment = {
          type: 'url',
          content: result.data.content,
          url: result.data.url,
          title: result.data.title,
        }
        setUrlAttachments(prev => [...prev, urlAttachment])
        setUrlInputValue('')
        setShowUrlInput(false)
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : '链接解析失败')
      console.error(err)
    } finally {
      setIsParsingUrl(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Floating Sidebar Navigation */}
      <AppSidebar onCreateProject={() => setIsCreateDialogOpen(true)} />

      {/* Main Content */}
      <main className="flex flex-1 flex-col pl-[72px]">
        {/* Header */}
        <AppHeader />

        {/* Hero Section */}
        <div className="flex flex-1 flex-col items-center px-8 pt-12">


          {/* Logo & Slogan */}
          <div className="mb-12 flex flex-col items-center">
            <div className="mb-6 flex items-center gap-3 text-4xl font-bold text-primary sm:text-5xl">
              <span>AI Draw</span>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-surface shadow-sm">
                <Logo className="h-7 w-7" />
              </div>
              <span>一句话呈所想</span>
            </div>
            <p className="text-lg text-muted-foreground">与 AI 对话轻松绘图</p>
          </div>

          {/* Chat Input Box */}
          <div className="mb-6 w-full max-w-2xl">
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm transition-shadow focus-within:shadow-md">
              {/* 附件预览区域 */}
              {(attachments.length > 0 || urlAttachments.length > 0) && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div
                      key={`file-${index}`}
                      className="flex items-center gap-2 rounded-lg bg-background px-3 py-1.5 text-sm"
                    >
                      <Paperclip className="h-3 w-3 text-muted" />
                      <span className="max-w-[150px] truncate text-primary">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-muted hover:text-primary"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {urlAttachments.map((urlAtt, index) => (
                    <div
                      key={`url-${index}`}
                      className="flex items-center gap-2 rounded-lg bg-background px-3 py-1.5 text-sm"
                    >
                      <Link className="h-3 w-3 text-muted" />
                      <span className="max-w-[150px] truncate text-primary">
                        {urlAtt.title}
                      </span>
                      <button
                        onClick={() => removeUrlAttachment(index)}
                        className="text-muted hover:text-primary"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                ref={textareaRef}
                placeholder={`描述你想要绘制的图表，${systemName} 会帮你完成...（支持粘贴图片）`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                disabled={isLoading}
                className="min-h-[60px] w-full resize-none bg-transparent text-primary placeholder:text-muted focus:outline-none"
                rows={2}
              />

              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />

              {/* 底部工具栏 */}
              <div className="flex items-center justify-between border-t border-border pt-3 mt-2">
                <div className="flex items-center gap-3">
                  {/* 上传附件 */}
                  <button
                    onClick={handleAttachmentClick}
                    className="group relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-primary"
                    title="可上传文档一键转化为图表，或上传截图复刻图表"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span>上传附件</span>
                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-primary px-3 py-2 text-xs text-surface opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      可上传文档一键转化为图表，或上传截图复刻图表
                      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-primary"></div>
                    </div>
                  </button>

                  {/* 添加链接 */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      disabled={isParsingUrl}
                      className="group relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-primary disabled:opacity-50"
                      title="添加网页链接，AI将解析内容"
                    >
                      <Link className="h-4 w-4" />
                      <span>添加链接</span>
                      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-primary px-3 py-2 text-xs text-surface opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        添加网页链接，AI将解析内容生成图表
                        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-primary"></div>
                      </div>
                    </button>

                    {/* 链接输入弹出框 */}
                    {showUrlInput && (
                      <div className="absolute bottom-full left-0 mb-2 flex items-center gap-2 rounded-lg border border-border bg-surface p-2 shadow-lg">
                        <input
                          type="url"
                          placeholder="输入网址链接..."
                          value={urlInputValue}
                          onChange={(e) => setUrlInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleUrlSubmit()
                            } else if (e.key === 'Escape') {
                              setShowUrlInput(false)
                              setUrlInputValue('')
                            }
                          }}
                          disabled={isParsingUrl}
                          className="w-64 rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary disabled:opacity-50"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handleUrlSubmit}
                          disabled={!urlInputValue.trim() || isParsingUrl}
                          className="h-7 px-2"
                        >
                          <>{isParsingUrl ? <Loading size="sm" /> : <MoveRight className="h-4 w-4" />}</>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowUrlInput(false)
                            setUrlInputValue('')
                          }}
                          disabled={isParsingUrl}
                          className="h-7 px-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* 选择绘图引擎 - 已移至顶部导航栏 */}
                </div>

                {/* 发送按钮 */}
                <Button
                  onClick={handleQuickStart}
                  disabled={!prompt.trim() || isLoading}
                  className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-surface transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <>{isLoading ? (
                    <span>创建中...</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      <span>发送</span>
                    </div>
                  )}</>
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 w-full max-w-6xl">
            <div className="rounded-[32px] bg-surface p-6 shadow-sm border border-border/40 md:p-8">
              <div className="mb-6 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-medium text-primary">试试这些用例，快速开始</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {QUICK_ACTIONS.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    disabled={isLoading}
                    className="group relative flex h-36 flex-col justify-between rounded-2xl bg-background/80 p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:bg-surface hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] disabled:opacity-50 border border-transparent hover:border-border/50"
                  >
                    <p className="text-sm text-muted-foreground/80 line-clamp-3 leading-relaxed group-hover:text-muted-foreground">
                      {action.prompt}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        index % 3 === 0 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                        index % 3 === 1 ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                        'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                      }`}>
                        <action.icon className="h-3.5 w-3.5" />
                        <span>{action.label}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Projects Section */}
          <div className="w-full max-w-6xl pb-12">
            <div className="rounded-[32px] bg-surface p-6 shadow-sm border border-border/40 md:p-8">
              <div className="mb-6 flex items-center justify-between px-1">
                <h2 className="text-lg font-medium text-primary">最近项目</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {/* Recent Projects */}
                {recentProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => navigate(`/editor/${project.id}`)}
                    className="group relative flex flex-col overflow-hidden rounded-2xl bg-background/80 transition-all duration-300 hover:-translate-y-1 hover:bg-surface hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-transparent hover:border-border/50"
                  >
                    <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="rounded-md bg-surface/90 px-2 py-1 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                        更新于 {formatDate(project.updatedAt)}
                      </div>
                    </div>
                    <div className="flex h-24 items-center justify-center bg-background/50 p-6 border-b border-dashed border-border/60">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.title}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Logo className="h-8 w-8 text-muted/50 group-hover:text-primary/50 transition-colors" />
                      )}
                    </div>
                    <div className="p-4 text-left w-full bg-white">
                      <div className="mb-1.5 flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-primary/90 group-hover:text-primary pl-1">
                          {project.title === `Untitled-${project.id}`
                            ? '未命名'
                            : project.title}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                          project.engineType === 'excalidraw'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            : project.engineType === 'drawio'
                              ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                        }`}>
                          {project.engineType.toUpperCase()}
                        </span>
                        <p className="text-[10px] text-muted-foreground/60 ml-auto">
                          创建于 {formatDate(project.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  )
}
