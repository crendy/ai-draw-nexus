# AI DRAW
<div align="center">
** AI Draw [![111](https://github.com/user-attachments/assets/afbc4c80-53ee-4fdd-93cd-b0710408eb8c)] 一句话呈所想 **
</div>
**Online**: https://ai-draw-nexus.aizhi.site

一个 AI 驱动的图表创作平台，用自然语言描述你想要的图表，AI 帮你生成。

基于 Cloudflare Pages 构建，前端 React + 后端 Pages Functions 一体化部署。

## 界面截图

<img width="2324" height="1248" alt="image" src="https://github.com/user-attachments/assets/3f3ed9ca-9c4a-4782-888a-391c5ac8a17d" />
<img width="2324" height="1248" alt="image" src="https://github.com/user-attachments/assets/51f3ac22-ac35-4031-8b65-740c99164238" />
<img width="2324" height="1248" alt="image" src="https://github.com/user-attachments/assets/d21aa025-1785-47c8-b6b3-9e9a2f2b7a21" />


## 核心亮点

### 三大绘图引擎

支持三种各具特色的绘图引擎，满足不同场景需求：

- **Mermaid** - 流程图、时序图、类图等，代码驱动，精确可控
- **Excalidraw** - 手绘风格图表，简洁美观，适合头脑风暴
- **Draw.io** - 专业图表编辑器，功能丰富，适合复杂图表

### 简约好用的项目管理

- 轻松管理所有图表项目
- 完整的版本历史，随时回退到任意版本
- **所有数据存储在本地**，无需担心隐私问题

### 卓越的绘图体验

- **秒级响应** - 几乎所有绘图都能达到秒级响应，告别漫长等待
- **样式精美** - 特别优化了 Mermaid 的渲染样式，美观度大幅提升
- **智能编辑** - 基于现有图表进行后续编辑，AI 理解上下文
- **空间感知** - 更优秀的布局能力，箭头贯穿元素的情况大幅减少

### 多模态输入

不止于文字描述，还支持：

- **文档可视化** - 上传文档，自动生成可视化图表
- **图片复刻** - 上传图片，AI 识别并复刻图表
- **链接解析** - 输入链接，自动解析内容并生成图表

## 快速开始

### 方式一：首页快速生成

1. 打开首页
2. 选择绘图引擎（Mermaid / Excalidraw / Draw.io）
3. 输入图表描述，例如："画一个用户登录流程图"
4. 点击生成，AI 自动创建项目并生成图表

### 方式二：项目管理

1. 进入项目列表页
2. 点击"新建项目"
3. 选择引擎并命名
4. 在编辑器中通过对话描述你的需求

## 使用技巧

### AI 对话生成

在编辑器右侧的对话面板中，你可以：

- 描述新图表："画一个电商下单流程图"
- 修改现有图表："把支付节点改成红色"
- 添加元素："增加一个库存检查的步骤"

### 手动编辑

- **Excalidraw** - 直接在画布上拖拽、绘制
- **Draw.io** - 使用专业的图表编辑工具
- **Mermaid** - 可直接编辑代码

### 版本管理

- 点击工具栏的"历史记录"按钮
- 查看所有历史版本
- 点击任意版本预览
- 点击"恢复"回退到该版本

## 本地开发

### 1. 克隆项目并安装依赖

```bash
git clone https://github.com/liujuntao123/smart-ai-draw
cd smart-ai-draw
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

**注意**：开发时访问 `http://localhost:8787`（wrangler 代理 vite）。

## Cloudflare Pages 部署

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

### 支持的 AI 服务

| 服务商 | AI_PROVIDER | AI_BASE_URL | 推荐模型 |
|--------|-------------|-------------|----------|
| OpenAI | openai | https://api.openai.com/v1 | gpt-5 |
| Anthropic | anthropic | https://api.anthropic.com/v1 | claude-sonnet-4-5 |
| 其他兼容服务 | openai | 自定义 URL | - |

## 技术栈

- 前端：React 19 + Vite + TypeScript + Tailwind CSS
- 状态管理：Zustand
- 本地存储：Dexie.js (IndexedDB)
- 后端：Cloudflare Pages Functions

## 开源协议

MIT
