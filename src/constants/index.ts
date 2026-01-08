import {
  CassetteTape,
  Database,
  FolderOpen,
  GitBranch,
  Home,
  Network,
  Settings,
  ShoppingCart,
  Users,
  Workflow
} from 'lucide-react'
import type {EngineType} from '@/types'

export const ENGINES: { value: EngineType; label: string; description: string }[] = [
  { value: 'mermaid', label: 'Mermaid', description: '基于文本的图表生成，适合快速绘制结构化图表' },
  { value: 'excalidraw', label: 'Excalidraw', description: '手绘风格白板工具，自由绘制，界面简洁直观' },
  { value: 'drawio', label: 'Draw.io', description: '专业级图表编辑器，功能丰富，适合复杂技术文档' },
]

export const NAV_ITEMS = [
  { icon: Home, label: '系统首页', path: '/' },
  { icon: FolderOpen, label: '项目管理', path: '/projects' },
  { icon: Settings, label: '系统设置', path: '/profile' },
  // { icon: CassetteTape, label: '关于我们', path: '/about' },
]

export const QUICK_ACTIONS = [
  {
    label: '业务流程图',
    icon: GitBranch,
    engine: 'mermaid' as EngineType,
    prompt: '请帮我绘制一个用户登录流程图，包含输入账号密码、验证、登录成功/失败等步骤'
  },
  {
    label: '系统架构图',
    icon: Network,
    engine: 'drawio' as EngineType,
    prompt: '请帮我绘制一个电商系统架构图，包含前端、后端、数据库、缓存、消息队列等组件'
  },
  {
    label: '数据库ER图',
    icon: Database,
    engine: 'mermaid' as EngineType,
    prompt: '请帮我绘制一个用户订单系统的ER图，包含用户表、订单表、商品表及其关系'
  },
]
