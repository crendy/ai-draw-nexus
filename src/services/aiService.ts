import type {ChatRequest, PayloadMessage} from '@/types'
import {quotaService} from './quotaService'

// API endpoint - can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * 获取请求头（包含访问密码）
 */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const password = quotaService.getAccessPassword()
  if (password) {
    headers['X-Access-Password'] = password
  }
  return headers
}

/**
 * 检查配额并在需要时消耗
 */
function checkAndConsumeQuota(response: Response): void {
  const quotaExempt = response.headers.get('X-Quota-Exempt')
  // 只有当不免除配额时才消耗
  if (quotaExempt !== 'true') {
    quotaService.consumeQuota()
  }
}

/**
 * 检查是否有足够配额（有密码时跳过检查）
 */
function ensureQuotaAvailable(): void {
  if (!quotaService.hasAccessPassword() && !quotaService.hasQuotaRemaining()) {
    throw new Error('今日配额已用完，请明天再试或设置访问密码')
  }
}

interface ParseUrlResponse {
  success: boolean
  data?: {
    title: string
    content: string
    excerpt: string
    siteName: string
    url: string
  }
  error?: string
}

/**
 * Parse SSE data line and extract content
 */
function parseSSELine(line: string): string | null {
  let data = line

  // Handle SSE format (data: prefix)
  if (line.startsWith('data: ')) {
    data = line.slice(6)
  }

  if (data === '[DONE]') return null

  try {
    const parsed = JSON.parse(data)
    // Handle OpenAI format
    if (parsed.choices?.[0]?.delta?.content) {
      return parsed.choices[0].delta.content
    }
    // Handle simple format
    if (parsed.content) {
      return parsed.content
    }
    // Handle text field
    if (parsed.text) {
      return parsed.text
    }
  } catch {
    // Not JSON, return raw data if it has content
    if (data.trim()) {
      return data
    }
  }
  return null
}

/**
 * AI Service for communicating with the backend
 */
export const aiService = {
  /**
   * Send chat messages to AI and get response (non-streaming)
   */
  async chat(messages: PayloadMessage[]): Promise<string> {
    const startTime = Date.now()
    const debug = (window as any)._ENV_?.DEBUG
    if (debug) {
      // Truncate messages if too large
      const msgStr = JSON.stringify({ messages });
      const logStr = msgStr.length > 200 ? msgStr.substring(0, 200) + '...' : msgStr;
      console.log('[AI Service] Request Start:', logStr)
    } else {
      console.log('[AI Service] Request Start')
    }

    try {
      ensureQuotaAvailable()

      const request: ChatRequest = { messages }

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`AI request failed: ${error}`)
      }

      checkAndConsumeQuota(response)

      const data = await response.json()
      const content = data.content || data.message || ''

      const duration = Date.now() - startTime
      if (debug) {
        // Truncate content if too large
        const contentStr = JSON.stringify({ content });
        const logStr = contentStr.length > 200 ? contentStr.substring(0, 200) + '...' : contentStr;
        console.log(`[AI Service] Request End. Duration: ${duration}ms`, logStr)
      } else {
        console.log(`[AI Service] Request End. Duration: ${duration}ms`)
      }

      return content
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[AI Service] Request Failed. Duration: ${duration}ms`, error)
      throw error
    }
  },

  /**
   * Stream chat response with SSE support
   * @param messages - The messages to send
   * @param onChunk - Callback for each content chunk
   * @param onComplete - Optional callback when streaming completes
   * @returns The full accumulated content
   */
  async streamChat(
    messages: PayloadMessage[],
    onChunk: (chunk: string, accumulated: string) => void,
    onComplete?: (content: string) => void
  ): Promise<string> {
    const startTime = Date.now()
    const debug = (window as any)._ENV_?.DEBUG
    if (debug) {
      // Truncate messages if too large
      const msgStr = JSON.stringify({ messages });
      const logStr = msgStr.length > 200 ? msgStr.substring(0, 200) + '...' : msgStr;
      console.log('[AI Service] Stream Request Start:', logStr)
    } else {
      console.log('[AI Service] Stream Request Start')
    }

    try {
      ensureQuotaAvailable()

      const request: ChatRequest = { messages, stream: true } as ChatRequest & { stream: boolean }

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`AI request failed: ${error}`)
      }

      // 流式请求成功后检查并消耗配额
      checkAndConsumeQuota(response)

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let fullContent = ''
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Process complete lines
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine) continue

            const content = parseSSELine(trimmedLine)
            if (content) {
              fullContent += content
              onChunk(content, fullContent)
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          const content = parseSSELine(buffer.trim())
          if (content) {
            fullContent += content
            onChunk(content, fullContent)
          }
        }
      } finally {
        reader.releaseLock()
      }

      const duration = Date.now() - startTime
      if (debug) {
        // Truncate content if too large
        const contentStr = JSON.stringify({ fullContent });
        const logStr = contentStr.length > 200 ? contentStr.substring(0, 200) + '...' : contentStr;
        console.log(`[AI Service] Stream Request End. Duration: ${duration}ms`, logStr)
      } else {
        console.log(`[AI Service] Stream Request End. Duration: ${duration}ms`)
      }

      onComplete?.(fullContent)
      return fullContent
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[AI Service] Stream Request Failed. Duration: ${duration}ms`, error)
      throw error
    }
  },

  /**
   * Parse URL content and convert to markdown
   */
  async parseUrl(url: string): Promise<ParseUrlResponse> {
    const response = await fetch(`${API_BASE_URL}/parse-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })

    const data: ParseUrlResponse = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || '解析URL失败')
    }

    return data
  },
}
