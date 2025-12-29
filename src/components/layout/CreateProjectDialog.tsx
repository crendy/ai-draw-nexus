import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import {ENGINES} from '@/constants'
import {ProjectRepository} from '@/services/projectRepository'
import {GroupRepository} from '@/services/groupRepository'
import type {EngineType, Group} from '@/types'

const ENGINE_TIPS: Record<EngineType, { title: string; features: string[] }> = {
  mermaid: {
    title: 'Mermaid',
    features: [
      '基于文本的图表生成，使用简洁的语法,适合快速绘制结构化图表',
      '支持流程图、时序图、甘特图、ER图等多种图表,可直接嵌入 Markdown',
    ],
  },
  excalidraw: {
    title: 'Excalidraw',
    features: [
      '风格精美的手绘风格的白板工具，界面简洁直观',
      '自由绘制，支持形状、箭头、文本等元素',
    ],
  },
  drawio: {
    title: 'Draw.io',
    features: [
      '专业级图表编辑器，功能丰富,内置大量模板和图形库',
      '支持 UML、网络拓扑、流程图等专业图表,适合绘制复杂、精细的技术文档图表',
    ],
  },
}

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('未命名')
  const [engine, setEngine] = useState<EngineType>('mermaid')
  const [groupId, setGroupId] = useState<string>('uncategorized')
  const [groups, setGroups] = useState<Group[]>([])
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (open) {
      loadGroups()
    }
  }, [open])

  const loadGroups = async () => {
    try {
      const data = await GroupRepository.getAll()
      setGroups(data)
    } catch (error) {
      console.error('Failed to load groups:', error)
    }
  }

  const handleCreate = async () => {
    if (!title.trim()) return

    setIsCreating(true)
    try {
      const project = await ProjectRepository.create({
        title: title.trim(),
        engineType: engine,
        groupId: groupId === 'uncategorized' ? undefined : groupId,
      })
      onOpenChange(false)
      setTitle('未命名')
      setGroupId('uncategorized')
      navigate(`/editor/${project.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTitle('未命名')
      setEngine('mermaid')
      setGroupId('uncategorized')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>新建项目</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="mb-2 block text-sm font-medium">项目名称</label>
            <Input
              placeholder="请输入项目名称"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">分组</label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder="选择分组" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">未分组</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">引擎</label>
            <div className="flex gap-2">
              {ENGINES.map((e) => (
                <button
                  key={e.value}
                  onClick={() => setEngine(e.value)}
                  className={`flex-1 rounded-xl border p-3 text-sm transition-colors ${
                    engine === e.value
                      ? 'border-primary bg-primary text-surface'
                      : 'border-border bg-surface text-primary hover:border-primary'
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          {/* Tips 区域 */}
          <div className="rounded-xl bg-muted/50 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <span>💡</span>
              <span>{ENGINE_TIPS[engine].title} 特点</span>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {ENGINE_TIPS[engine].features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            取消
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            className="rounded-full bg-primary text-surface hover:bg-primary/90"
          >
            {isCreating ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
