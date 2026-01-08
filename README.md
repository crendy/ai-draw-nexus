# AI Diagram Hub (智绘 AI)

**Online Demo**: https://ai-draw-nexus.aizhi.site

一个 AI 驱动的图表创作平台，用自然语言描述你想要的图表，AI 帮你生成。支持 Mermaid、Excalidraw 和 Draw.io 三大引擎。

基于 Cloudflare Pages 构建，前端 React + 后端 Pages Functions 一体化部署，数据本地存储，安全隐私。

## ✨ 核心亮点

### 🎨 三大绘图引擎
支持三种各具特色的绘图引擎，满足不同场景需求：
- **Mermaid** - 流程图、时序图、类图等，代码驱动，精确可控
- **Excalidraw** - 手绘风格图表，简洁美观，适合头脑风暴
- **Draw.io** - 专业图表编辑器，功能丰富，适合复杂图表

### 🚀 卓越的绘图体验
- **秒级响应** - 几乎所有绘图都能达到秒级响应，告别漫长等待
- **样式精美** - 特别优化了 Mermaid 的渲染样式，美观度大幅提升
- **智能编辑** - 基于现有图表进行后续编辑，AI 理解上下文
- **空间感知** - 更优秀的布局能力，箭头贯穿元素的情况大幅减少

### 📂 简约好用的项目管理
- 轻松管理所有图表项目
- 完整的版本历史，随时回退到任意版本
- **所有数据存储在本地** (IndexedDB)，无需担心隐私问题

### 🔗 多模态输入
不止于文字描述，还支持：
- **文档可视化** - 上传文档，自动生成可视化图表
- **图片复刻** - 上传图片，AI 识别并复刻图表
- **链接解析** - 输入链接，自动解析内容并生成图表

## 📸 界面截图

<img width="2324" height="1248" alt="image" src="https://github.com/user-attachments/assets/3f3ed9ca-9c4a-4782-888a-391c5ac8a17d" />
<img width="2324" height="1248" alt="image" src="https://github.com/user-attachments/assets/51f3ac22-ac35-4031-8b65-740c99164238" />
<img width="2324" height="1248" alt="image" src="https://github.com/user-attachments/assets/d21aa025-1785-47c8-b6b3-9e9a2f2b7a21" />

## 🛠️ 本地开发

### 1. 克隆项目并安装依赖

```bash
git clone https://github.com/stone-yu/ai-draw.git
cd ai-draw
pnpm install
```

### 2. 配置环境变量

在根目录下创建 `.dev.vars` 文件：

```env
AI_API_KEY=your-api-key
AI_BASE_URL=https://api.openai.com/v1
AI_PROVIDER=openai
AI_MODEL_ID=gpt-4o-mini
```

> 支持 OpenAI、Anthropic 及其他兼容 OpenAI 格式的服务

### 3. 启动开发服务器

```bash
# 同时启动前端和后端
pnpm run dev
# 访问 http://localhost:8787

# 或者分别启动：
pnpm run dev:frontend   # 仅 Vite (http://localhost:5173)
pnpm run dev:backend    # 仅 Wrangler Pages (http://localhost:8787)
```

**注意**：开发时建议访问 `http://localhost:8787`（wrangler 代理 vite），以确保后端 API 正常工作。

## ☁️ 部署 (Cloudflare Pages)

### 1. 构建

```bash
pnpm run build        # TypeScript 检查 + Vite 构建
```

### 2. 配置生产环境密钥

```bash
wrangler pages secret put AI_API_KEY
wrangler pages secret put AI_BASE_URL
wrangler pages secret put AI_PROVIDER
wrangler pages secret put AI_MODEL_ID
```

或在 Cloudflare Pages 控制台中配置环境变量。

### 3. 部署

```bash
pnpm run pages:deploy
```

## 🧩 技术栈

- **前端**：React 19 + Vite + TypeScript + Tailwind CSS
- **状态管理**：Zustand
- **本地存储**：Dexie.js (IndexedDB)
- **后端**：Cloudflare Pages Functions
- **图标库**：Lucide React

## 📄 开源协议

MIT
