import {useEffect, useRef, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {Check, ChevronRight, Code, Download, FileText, History, Image, Pencil, Save, X} from 'lucide-react'
import {Button, Input, Loading} from '@/components/ui'
import {AppSidebar} from '@/components/layout'
import {ChatPanel} from '@/features/chat/ChatPanel'
import {CanvasArea, type CanvasAreaRef} from '@/features/editor/CanvasArea'
import {VersionPanel} from '@/features/editor/VersionPanel'
import {useEditorStore} from '@/stores/editorStore'
import {useChatStore} from '@/stores/chatStore'
import {ProjectRepository} from '@/services/projectRepository'
import {VersionRepository} from '@/services/versionRepository'
import {generateThumbnail} from '@/lib/thumbnail'
import {useToast} from '@/hooks/useToast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,} from '@/components/ui/Tooltip'

export function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false)
  const [isChatPanelCollapsed, setIsChatPanelCollapsed] = useState(() => {
    return localStorage.getItem('ai-draw-nexus.chatPanelCollapsed') === 'true'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<CanvasAreaRef>(null)
  const { success } = useToast()

  const { currentProject, currentContent, hasUnsavedChanges, setProject, setContentFromVersion, markAsSaved, reset: resetEditor } = useEditorStore()
  const { clearMessages } = useChatStore()

  useEffect(() => {
    localStorage.setItem('ai-draw-nexus.chatPanelCollapsed', String(isChatPanelCollapsed))
  }, [isChatPanelCollapsed])

  // Load project on mount
  useEffect(() => {
    if (!projectId) {
      navigate('/projects')
      return
    }

    loadProject(projectId)
  }, [projectId])

  const loadProject = async (id: string) => {
    setIsLoading(true)
    // Clear previous project data before loading new one
    resetEditor()
    clearMessages()
    try {
      const project = await ProjectRepository.getById(id)
      if (!project) {
        navigate('/projects')
        return
      }

      setProject(project)
      setEditedTitle(project.title)

      // Load latest version content
      const latestVersion = await VersionRepository.getLatest(id)
      if (latestVersion) {
        setContentFromVersion(latestVersion.content)
      }
    } catch (error) {
      console.error('Failed to load project:', error)
      navigate('/projects')
    } finally {
      setIsLoading(false)
    }
  }

  // Focus title input when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  const handleNewProject = () => {
    navigate('/projects', { state: { openCreateDialog: true } })
  }

  const handleStartEditTitle = () => {
    if (currentProject) {
      setEditedTitle(currentProject.title)
      setIsEditingTitle(true)
    }
  }

  const handleSaveTitle = async () => {
    if (!currentProject || !editedTitle.trim()) return

    try {
      await ProjectRepository.update(currentProject.id, { title: editedTitle.trim() })
      setProject({ ...currentProject, title: editedTitle.trim() })
      setIsEditingTitle(false)
      success('Title updated')
    } catch (error) {
      console.error('Failed to update title:', error)
    }
  }

  const handleCancelEditTitle = () => {
    if (currentProject) {
      setEditedTitle(currentProject.title)
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      handleCancelEditTitle()
    }
  }

  const handleSaveVersion = async () => {
    if (!currentProject?.id || !currentContent) return

    try {
      await VersionRepository.create({
        projectId: currentProject.id,
        content: currentContent,
        changeSummary: '人工调整',
      })
      markAsSaved()

      // Update thumbnail for drawio using native export
      if (currentProject.engineType === 'drawio' && canvasRef.current) {
        try {
          const thumbnail = await canvasRef.current.getThumbnail()
          if (thumbnail) {
            await ProjectRepository.update(currentProject.id, { thumbnail })
          }
        } catch (err) {
          console.error('Failed to generate thumbnail:', err)
        }
      }

      success('版本已保存')
    } catch (error) {
      console.error('Failed to save version:', error)
    }
  }

  // Generate thumbnail when canvas is ready (for projects without thumbnail, e.g., imported projects)
  const handleCanvasReady = async () => {
    if (!currentProject || !currentContent) return
    // Skip if project already has a thumbnail
    if (currentProject.thumbnail) return

    try {
      let thumbnail = ''
      if (currentProject.engineType === 'drawio' && canvasRef.current) {
        thumbnail = await canvasRef.current.getThumbnail()
      } else {
        thumbnail = await generateThumbnail(currentContent, currentProject.engineType)
      }

      if (thumbnail) {
        await ProjectRepository.update(currentProject.id, { thumbnail })
        setProject({ ...currentProject, thumbnail })
      }
    } catch (err) {
      console.error('Failed to generate thumbnail on ready:', err)
    }
  }

  if (isLoading || !currentProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loading size="lg" />
      </div>
    )
  }

  return (
    <TooltipProvider>
    <div className="flex h-screen flex-col bg-background pl-[72px]">
      <AppSidebar onCreateProject={handleNewProject} />
      {/* Toolbar */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
        <div className="flex items-center gap-4">
          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={titleInputRef}
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  className="h-8 w-48"
                />
                <Button variant="ghost" size="icon" onClick={handleSaveTitle}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCancelEditTitle}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    currentProject.engineType === 'excalidraw'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                  }`}>
                  {currentProject.engineType.toUpperCase()}
                </span>
                <h1 className="font-medium text-primary">{currentProject.title}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleStartEditTitle}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <Download className="h-4 w-4" />
                    <span className="text-xs">导出</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>导出图表</TooltipContent>
            </Tooltip>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup>
                <DropdownMenuRadioItem className='pl-2' value="svg" onClick={() => canvasRef.current?.exportAsSvg()}>
                  <Code className="mr-2 h-4 w-4" />
                  导出为 SVG
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem className='pl-2' value="png" onClick={() => canvasRef.current?.exportAsPng()}>
                  <Image className="mr-2 h-4 w-4" />
                  导出为 PNG
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem className='pl-2' value="source" onClick={() => canvasRef.current?.exportAsSource()}>
                  <FileText className="mr-2 h-4 w-4" />
                  导出原文件
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Source Code button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => canvasRef.current?.toggleSourceCode()}
                className="gap-1.5"
              >
                <Code className="h-4 w-4" />
                <span className="text-xs">源码</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>查看源码</TooltipContent>
          </Tooltip>

          <div className="mx-1 h-4 w-px bg-border" />

          <Button
            variant={hasUnsavedChanges ? "default" : "ghost"}
            size="sm"
            onClick={handleSaveVersion}
            disabled={!hasUnsavedChanges}
          >
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVersionPanelOpen(!isVersionPanelOpen)}
          >
            <History className="mr-2 h-4 w-4" />
            历史版本
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat Panel */}
        <div className={`flex-shrink-0 border-r border-border transition-all ${isChatPanelCollapsed ? 'w-10' : 'w-80'}`}>
          <div className={isChatPanelCollapsed ? 'hidden' : 'h-full'}>
            <ChatPanel onCollapse={() => setIsChatPanelCollapsed(true)} />
          </div>
          {isChatPanelCollapsed && (
            <div className="flex h-full flex-col items-center bg-surface py-2">
              <Button
                variant="ghost"
                size="icon"
                title="展开对话面板"
                onClick={() => setIsChatPanelCollapsed(false)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Center: Canvas */}
        <div className="relative flex-1">
          <CanvasArea ref={canvasRef} onReady={handleCanvasReady} />
          {/* Version Panel (floating) */}
          {isVersionPanelOpen && (
            <VersionPanel onClose={() => setIsVersionPanelOpen(false)} />
          )}
        </div>
      </div>
    </div>
    </TooltipProvider>
  )
}
