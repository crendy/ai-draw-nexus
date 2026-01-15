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

export const QUICK_ACTION_ROWS = [
  [
    {
      label: '业务流程图',
      icon: GitBranch,
      engine: 'drawio' as EngineType,
      prompt: '创建一个用户登录流程图，使用动画线条',
      image: ''
    },
    {
      label: '系统架构图',
      icon: Network,
      engine: 'drawio' as EngineType,
      prompt: '绘制一个商品系统架构图',
      image: ''
    },
    {
      label: '数据库ER图',
      icon: Database,
      engine: 'drawio' as EngineType,
      prompt: '绘制一个配送系统ER图',
      image: ''
    },
  ],
  [
    {
      label: '复刻流程图',
      icon: DiamondPercent,
      engine: 'mermaid' as EngineType,
      prompt: '复刻这个流程图',
      image: '/quick-start-example-1.png'
    },
    {
      label: '复刻流程图',
      icon: DiamondPercent,
      engine: 'mermaid' as EngineType,
      prompt: '修改此图为mermaind风格',
      image: '/quick-start-example-1.png'
    },
    {
      label: '复刻流程图',
      icon: DiamondPercent,
      engine: 'mermaid' as EngineType,
      prompt: '修改此图为手绘风格',
      image: '/quick-start-example-1.png'
    },
  ],
  [
    {
      label: '任意图形',
      icon: DiamondPercent,
      engine: 'mermaid' as EngineType,
      prompt: '画一只猫在敲代码',
      image: ''
    },
    {
      label: '任意图形',
      icon: DiamondPercent,
      engine: 'mermaid' as EngineType,
      prompt: '画一个ide终端',
      image: ''
    },
    {
      label: '思维导图',
      icon: DiamondPercent,
      engine: 'mermaid' as EngineType,
      prompt: '绘制一个思维导图',
      image: ''
    },
  ]
]

export const QUICK_ACTIONS = QUICK_ACTION_ROWS.flat()
