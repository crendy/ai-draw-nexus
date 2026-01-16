import React from 'react'

export function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.trim().split('\n')
  const elements: React.ReactNode[] = []
  let currentList: React.ReactNode[] = []

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-5 space-y-1 text-sm mb-4">
          {currentList}
        </ul>
      )
      currentList = []
    }
  }

  const parseText = (text: string) => {
    // Support **bold** and `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-slate-800">{part.slice(1, -1)}</code>
      }
      return part
    })
  }

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    if (!trimmedLine) return

    if (trimmedLine.startsWith('#### ')) {
      flushList()
      elements.push(
        <h4 key={`h4-${index}`} className="font-medium text-slate-900 mb-2 mt-6">
          {parseText(trimmedLine.replace('#### ', ''))}
        </h4>
      )
    } else if (trimmedLine.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={`h3-${index}`} className="text-lg font-semibold text-slate-900 mb-3 mt-8">
          {parseText(trimmedLine.replace('### ', ''))}
        </h3>
      )
    } else if (trimmedLine.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={`h2-${index}`} className="text-xl font-bold text-slate-900 mb-4 mt-10 border-b border-slate-100 pb-2">
          {parseText(trimmedLine.replace('## ', ''))}
        </h2>
      )
    } else if (trimmedLine.startsWith('- ')) {
      currentList.push(
        <li key={`li-${index}`}>
          {parseText(trimmedLine.replace('- ', ''))}
        </li>
      )
    } else if (trimmedLine.startsWith('> ')) {
      flushList()
      elements.push(
        <blockquote key={`quote-${index}`} className="border-l-4 border-primary/20 pl-4 py-1 my-4 italic text-slate-600 bg-slate-50 rounded-r">
          {parseText(trimmedLine.replace('> ', ''))}
        </blockquote>
      )
    } else {
      flushList()
      elements.push(
        <p key={`p-${index}`} className="mb-4 leading-relaxed">
          {parseText(trimmedLine)}
        </p>
      )
    }
  })

  flushList()

  return <div className="text-slate-600">{elements}</div>
}

