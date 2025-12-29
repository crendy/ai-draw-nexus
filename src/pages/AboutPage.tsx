import { AppSidebar, AppHeader } from '@/components/layout'
import { Github } from 'lucide-react'

export function AboutPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex flex-1 flex-col">
        <AppHeader />
        <div className="flex flex-1 items-start justify-center px-8 pt-12">
          <div className="w-full max-w-3xl space-y-8">
            {/* 开源信息 */}
            <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-primary">
                <Github className="h-5 w-5" />
                开源项目
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                本项目的代码已全部开源至{' '}
                <a
                  href="https://github.com/crendy/ai-draw-nexus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  liujuntao123/ai-draw-nexus
                </a>
                。
              </p>
            </section>

            {/* 联系作者 */}
            <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-primary">联系作者</h2>
              <p className="mb-4 text-sm leading-relaxed text-muted">
                如果你有任何的建议和想法，欢迎联系作者。
              </p>
              <div className="flex justify-center">
                {/*<img*/}
                {/*  src="/contact.png"*/}
                {/*  alt="联系作者"*/}
                {/*  className="max-w-xs rounded-lg border border-border"*/}
                {/*/>*/}
              </div>
            </section>

            {/* 赞助支持 */}
            <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-medium text-primary">赞助支持</h2>
              <p className="mb-4 text-sm leading-relaxed text-muted">
                如果你认为本项目对你有帮助，欢迎请作者喝奶茶。
              </p>
              <div className="flex justify-center">
                {/*<img*/}
                {/*  src="/donate.png"*/}
                {/*  alt="请作者喝奶茶"*/}
                {/*  className="max-w-xs rounded-lg border border-border"*/}
                {/*/>*/}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
