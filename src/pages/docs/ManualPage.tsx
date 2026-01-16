import {DocLayout} from '@/components/layout/DocLayout'
import {SimpleMarkdown} from '@/components/ui/SimpleMarkdown'

const MANUAL_DATA = `
## 欢迎使用 AI Draw

AI Draw 是一个智能绘图平台，通过自然语言对话形式，即可快速生成流程图、时序图、架构图等各类图表。无需复杂的拖拽操作，让创意即刻呈现。

## 快速开始

### 1. 选择绘图引擎
在首页顶部选择适合的绘图引擎：
- **Mermaid**: 适合快速生成结构化图表，如流程图、时序图。
- **Excalidraw**: 手绘风格白板，适合头脑风暴和草图绘制。
- **Draw.io**: 专业级图表编辑，适合复杂的工程图和架构图。

### 2. 描述你的需求
在输入框中用自然语言描述你想画的图。例如：
> "画一个用户登录注册的流程图，包含忘记密码的流程"

### 3. AI 生成与编辑
点击发送后，AI 将自动生成图表。你可以：
- 在右侧画布预览生成的图表。
- 继续对话修改图表细节。
- 手动调整图表元素。
- 导出为 PNG, SVG 或源文件。

## 进阶功能

- **文件管理**: 支持创建多个项目，自动保存历史版本，随时回溯。
- **多模式**: 支持本地存储模式（数据仅保存在浏览器）和云端同步模式。
- **导入导出**: 支持导入现有文件进行编辑，支持导出多种格式。
`

export function ManualPage() {
  return (
    <DocLayout title="使用手册">
      <SimpleMarkdown content={MANUAL_DATA} />
    </DocLayout>
  )
}

