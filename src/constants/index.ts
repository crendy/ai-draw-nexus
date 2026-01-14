import {Database, DiamondPercent, FolderOpen, GitBranch, Home, LayoutDashboard, Network, Settings} from 'lucide-react'
import type {EngineType} from '@/types'

export const ENGINES: { value: EngineType; label: string; description: string }[] = [
  { value: 'mermaid', label: 'Mermaid', description: '基于文本的图表生成，适合快速绘制结构化图表' },
  { value: 'excalidraw', label: 'Excalidraw', description: '手绘风格白板工具，自由绘制，界面简洁直观' },
  { value: 'drawio', label: 'Draw.io', description: '专业级图表编辑器，功能丰富，适合复杂技术文档' },
]

export const NAV_ITEMS = [
  { icon: Home, label: '系统首页', path: '/' },
  { icon: FolderOpen, label: '文件管理', path: '/projects' },
  { icon: Settings, label: '个人设置', path: '/profile' },
  { icon: LayoutDashboard, label: '管理后台', path: '/admin', adminOnly: true },
  // { icon: CassetteTape, label: '关于我们', path: '/about' },
]

export const QUICK_ACTIONS = [
  {
    label: '业务流程图',
    icon: GitBranch,
    engine: 'mermaid' as EngineType,
    prompt: '帮我创建一个用户登录流程图'
  },
  {
    label: '系统架构图',
    icon: Network,
    engine: 'drawio' as EngineType,
    prompt: '帮我创建一个商品系统架构图'
  },
  {
    label: '数据库ER图',
    icon: Database,
    engine: 'mermaid' as EngineType,
    prompt: '帮我创建一个配送系统ER图'
  },
  {
    label: '任意图形',
    icon: DiamondPercent,
    engine: 'mermaid' as EngineType,
    prompt: '帮我画一只坐着的猫'
  },
]
