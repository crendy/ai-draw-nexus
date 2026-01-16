import {DocLayout} from '@/components/layout/DocLayout'
import {Github, MessageSquare} from 'lucide-react'
import {SimpleMarkdown} from '@/components/ui/SimpleMarkdown'
import {Button} from '@/components/ui'

const FAQ_DATA = [
  {
    question: '本地模式的数据安全吗？',
    answer: `
非常安全。在本地模式下，您的所有数据都存储在浏览器的 **IndexedDB** 中，不会上传到任何服务器。
    `
  }
]

export function FeedbackPage() {
  return (
    <DocLayout title="问题反馈">
      <div className="space-y-8 text-slate-600">
        <p className="text-lg leading-relaxed">
          您的反馈对我们非常重要。如果您在使用过程中遇到任何问题，或者有任何功能建议，欢迎通过以下方式联系我们。
        </p>

        <div className="grid gap-6 md:grid-cols-2 mt-8">

          {/* Online Contact */}
          <div className="p-6 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-green-600"/>
              </div>
              <h3 className="font-semibold text-slate-900">在线联系</h3>
            </div>
            <div className="flex justify-center mt-2 mb-4">
              <img src="/contact.png" alt="联系作者"
                   className="w-32 h-32 object-contain rounded-lg border border-slate-100"/>
            </div>
            <p className="text-sm text-slate-500 text-center">联系作者进群，在线反馈问题。</p>
          </div>

          {/* Github Issues */}
          <div className="p-6 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Github className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="font-semibold text-slate-900">Github Issues</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4 flex-1">提交 Bug 或功能请求。</p>
            <div className="flex justify-end mt-auto">
              <Button asChild size="sm">
                <a href="https://github.com/stone-yu/ai-draw/issues" target="_blank" rel="noopener noreferrer">
                  提交 Issue
                </a>
              </Button>
            </div>
          </div>

        </div>

        <div className="mt-12 p-6 bg-slate-50 rounded-xl border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">常见问题</h3>
          <div className="space-y-4">
            {FAQ_DATA.map((item, index) => (
              <div key={index}>
                <details className="group">
                  <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-slate-900">
                    <span>{item.question}</span>
                    <span className="transition group-open:rotate-180">
                      <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                  </summary>
                  <div className="mt-3 group-open:animate-fadeIn text-sm leading-relaxed">
                    <SimpleMarkdown content={item.answer} />
                  </div>
                </details>
                {index < FAQ_DATA.length - 1 && <div className="h-px bg-slate-200 my-4"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DocLayout>
  )
}

