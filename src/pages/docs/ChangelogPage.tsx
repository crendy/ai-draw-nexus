import {DocLayout} from '@/components/layout/DocLayout'
import {SimpleMarkdown} from '@/components/ui/SimpleMarkdown'

interface ChangelogItem {
  version: string
  date: string
  isLatest?: boolean
  content: string
}

const CHANGELOG_DATA: ChangelogItem[] = [
  {
    version: 'v1.0.1',
    date: '2025-01-16',
    isLatest: true,
    content: `
#### ✨ 核心功能
- 集成 **Mermaid**, **Excalidraw**, **Draw.io** 三大主流绘图引擎。
- 支持自然语言对话生成图表，所想即所得。
- 支持多轮对话修改，精准控制图表细节。

#### 🛠 基础能力
- 支持本地存储模式，保护隐私，无需登录即可使用。
- 支持云端同步模式，多端协作（需登录）。
- 完善的文件管理系统，支持文件夹、搜索、排序。
- 历史版本管理，支持随时回滚。
    `
  },
  {
    version: 'v1.0.0',
    date: '2024-01-16',
    isLatest: false,
    content: `
AI Draw 正式发布！带来全新的智能绘图体验。

#### ✨ 核心功能
- 集成 **Mermaid**, **Excalidraw**, **Draw.io** 三大主流绘图引擎。
- 支持自然语言对话生成图表，所想即所得。
- 支持多轮对话修改，精准控制图表细节。

#### 🛠 基础能力
- 支持本地存储模式，保护隐私，无需登录即可使用。
- 支持云端同步模式，多端协作（需登录）。
- 完善的文件管理系统，支持文件夹、搜索、排序。
- 历史版本管理，支持随时回滚。
    `
  }
]

export function ChangelogPage() {
  return (
    <DocLayout title="更新日志">
      <div className="space-y-12">
        {CHANGELOG_DATA.map((item) => (
          <div key={item.version} className="relative pl-8 border-l border-slate-200">
            <div className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white ${
              item.isLatest ? 'bg-primary ring-4 ring-primary/10' : 'bg-slate-300'
            }`}></div>
            <div className="mb-2 flex items-center gap-3">
              <span className="text-lg font-bold text-slate-900">{item.version}</span>
              {item.isLatest && (
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">Latest</span>
              )}
              <span className="text-sm text-slate-500">{item.date}</span>
            </div>
            <SimpleMarkdown content={item.content} />
          </div>
        ))}
      </div>
    </DocLayout>
  )
}

