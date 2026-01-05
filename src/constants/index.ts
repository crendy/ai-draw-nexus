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
  { icon: CassetteTape, label: '关于我们', path: '/about' },
]

export const QUICK_ACTIONS = [
  {
    label: '绘制用户登录流程图',
    icon: GitBranch,
    engine: 'mermaid' as EngineType,
    prompt: '请帮我绘制一个用户登录流程图，包含输入账号密码、验证、登录成功/失败等步骤'
  },
  {
    label: '绘制电商系统架构图',
    icon: ShoppingCart,
    engine: 'drawio' as EngineType,
    prompt: '请帮我绘制一个电商系统架构图，包含前端、后端、数据库、缓存、消息队列等组件'
  },
  {
    label: '绘制Git工作流程图',
    icon: Network,
    engine: 'mermaid' as EngineType,
    prompt: '请帮我绘制一个Git分支工作流程图，展示feature分支、develop分支、master分支的合并流程'
  },
  {
    label: '绘制微服务架构图',
    icon: Workflow,
    engine: 'excalidraw' as EngineType,
    prompt: '请帮我绘制一个微服务架构图，包含API网关、多个服务、服务注册中心、配置中心等'
  },
  {
    label: '绘制数据库ER图',
    icon: Database,
    engine: 'mermaid' as EngineType,
    prompt: '请帮我绘制一个用户订单系统的ER图，包含用户表、订单表、商品表及其关系'
  },
  {
    label: '绘制组织架构图',
    icon: Users,
    engine: 'drawio' as EngineType,
    prompt: '请帮我绘制一个公司组织架构图，包含CEO、各部门经理、团队成员的层级关系'
  },
]
