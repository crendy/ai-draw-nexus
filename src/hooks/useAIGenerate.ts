import { useChatStore } from '@/stores/chatStore'
import { useEditorStore } from '@/stores/editorStore'
import { usePayloadStore } from '@/stores/payloadStore'
import { VersionRepository } from '@/services/versionRepository'
import { ProjectRepository } from '@/services/projectRepository'
import {
  SYSTEM_PROMPTS,
  buildInitialPrompt,
  buildEditPrompt,
  extractCode,
} from '@/lib/promptBuilder'
import { generateThumbnail } from '@/lib/thumbnail'
import { aiService } from '@/services/aiService'
import { validateContent } from '@/lib/validators'
import { useToast } from '@/hooks/useToast'
import type { PayloadMessage, EngineType, Attachment, ContentPart } from '@/types'

// Enable streaming by default, can be configured
const USE_STREAMING = true

// Maximum retry attempts for Mermaid auto-fix
const MAX_MERMAID_FIX_ATTEMPTS = 3

/**
 * Build multimodal content from text, attachments, and optional current thumbnail
 * @param text - The text content
 * @param attachments - Optional user attachments (images or documents)
 * @param currentThumbnail - Optional current diagram thumbnail for context
 */
function buildMultimodalContent(
  text: string,
  attachments?: Attachment[],
  currentThumbnail?: string
): string | ContentPart[] {
  const hasAttachments = attachments && attachments.length > 0
  const hasThumbnail = currentThumbnail && currentThumbnail.trim() !== ''

  if (!hasAttachments && !hasThumbnail) {
    return text
  }

  const parts: ContentPart[] = []

  // Add current thumbnail first for context (if available)
  if (hasThumbnail) {
    parts.push({
      type: 'image_url',
      image_url: { url: currentThumbnail },
    })
  }

  // Add text content
  if (text) {
    parts.push({ type: 'text', text })
  }

  // Add user attachments
  if (hasAttachments) {
    for (const attachment of attachments) {
      if (attachment.type === 'image') {
        parts.push({
          type: 'image_url',
          image_url: { url: attachment.dataUrl },
        })
      } else if (attachment.type === 'document') {
        // For documents, append the extracted text content
        parts.push({
          type: 'text',
          text: `\n\n[Document: ${attachment.fileName}]\n${attachment.content}`,
        })
      } else if (attachment.type === 'url') {
        // For URLs, append the extracted markdown content
        parts.push({
          type: 'text',
          text: `\n\n[URL: ${attachment.title}]\n${attachment.content}`,
        })
      }
    }
  }

  return parts
}

export function useAIGenerate() {
  const {
    addMessage,
    updateMessage,
    setStreaming,
  } = useChatStore()

  const {
    currentProject,
    currentContent,
    setContentFromVersion,
    setLoading,
    thumbnailGetter,
    setProject,
  } = useEditorStore()

  const { setMessages } = usePayloadStore()
  const { success, error: showError } = useToast()

  /**
   * Generate diagram using AI with streaming support
   * @param userInput - User's description or modification request
   * @param isInitial - Whether this is initial generation (empty canvas)
   * @param attachments - Optional attachments (images or documents)
   */
  const generate = async (
    userInput: string,
    isInitial: boolean,
    attachments?: Attachment[]
  ) => {
    if (!currentProject) return

    const engineType = currentProject.engineType
    const systemPrompt = SYSTEM_PROMPTS[engineType]

    // Add user message to UI (with attachments)
    addMessage({
      role: 'user',
      content: userInput,
      status: 'complete',
      attachments,
    })

    // Add assistant message placeholder
    const assistantMsgId = addMessage({
      role: 'assistant',
      content: '',
      status: 'streaming',
    })

    setStreaming(true)
    setLoading(true)
    const startTime = Date.now()

    try {
      let finalCode: string

      if (isInitial) {
        // 暂时全都使用一步生成
        const useTwoPhase = false

        if (useTwoPhase) {
          finalCode = await twoPhaseGeneration(
            userInput,
            engineType,
            systemPrompt,
            assistantMsgId,
            attachments
          )
        } else {
          finalCode = await singlePhaseInitialGeneration(
            userInput,
            engineType,
            systemPrompt,
            assistantMsgId,
            attachments
          )
        }
      } else {
        // Single-phase for edits - pass current thumbnail for context
        finalCode = await singlePhaseGeneration(
          userInput,
          currentContent,
          engineType,
          systemPrompt,
          assistantMsgId,
          attachments,
          currentProject.thumbnail
        )
      }

      // Validate the generated content with auto-fix for Mermaid
      console.log('finalCode', finalCode)
      let validatedCode = finalCode
      let validation = await validateContent(validatedCode, engineType)

      // Auto-fix mechanism for Mermaid engine
      if (!validation.valid && engineType === 'mermaid') {
        validatedCode = await attemptMermaidAutoFix(
          validatedCode,
          validation.error || 'Unknown error',
          systemPrompt,
          assistantMsgId
        )
        // Re-validate after fix attempts
        validation = await validateContent(validatedCode, engineType)
      }

      if (!validation.valid) {
        throw new Error(`Invalid ${engineType} output: ${validation.error}`)
      }

      // Use the validated (possibly fixed) code
      finalCode = validatedCode

      // Update content (AI generation auto-saves, so mark as saved)
      setContentFromVersion(finalCode)

      // Update assistant message
      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      updateMessage(assistantMsgId, {
        content: `Diagram generated successfully. (${duration}s)`,
        status: 'complete',
      })

      // Save version
      await VersionRepository.create({
        projectId: currentProject.id,
        content: finalCode,
        changeSummary: isInitial ? '初始生成' : 'AI 修改',
      })

      // Generate and save thumbnail
      // For drawio, use the registered thumbnailGetter from CanvasArea for accurate rendering
      try {
        let thumbnail: string = ''
        if (engineType === 'drawio') {
          // For drawio, wait a bit for the editor to be ready after content update
          // Then retry getting thumbnail with delay
          const getThumbnailWithRetry = async (maxRetries = 3, delay = 500): Promise<string> => {
            for (let i = 0; i < maxRetries; i++) {
              // Wait for editor to process the new content
              await new Promise(resolve => setTimeout(resolve, delay))
              // Get fresh thumbnailGetter from store
              const getter = useEditorStore.getState().thumbnailGetter
              if (getter) {
                const result = await getter()
                if (result) return result
              }
            }
            return ''
          }
          thumbnail = await getThumbnailWithRetry()
        } else {
          // Use fallback method for other engines
          thumbnail = await generateThumbnail(finalCode, engineType)
        }
        if (thumbnail) {
          await ProjectRepository.update(currentProject.id, { thumbnail })
          // Update currentProject in store so thumbnail is visible immediately
          setProject({ ...currentProject, thumbnail })
        }
      } catch (err) {
        console.error('Failed to generate thumbnail:', err)
      }

      // Update project timestamp
      await ProjectRepository.update(currentProject.id, {})

      success('Diagram generated successfully')

    } catch (error) {
      console.error('AI generation failed:', error)
      updateMessage(assistantMsgId, {
        content: `Error: ${error instanceof Error ? error.message : 'Generation failed'}`,
        status: 'error',
      })
      showError(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      setStreaming(false)
      setLoading(false)
    }
  }

  /**
   * Retry the last AI request using the current payload context
   * @param assistantMessageId - Optional existing assistant message to update in-place
   */
  const retryLast = async (assistantMessageId?: string) => {
    if (!currentProject) return

    const payloadMessages = usePayloadStore.getState().messages
    if (!payloadMessages || payloadMessages.length === 0) {
      showError('没有可重新发送的上下文')
      return
    }

    const engineType = currentProject.engineType
    const systemPrompt = SYSTEM_PROMPTS[engineType]

    const assistantMsgId =
      assistantMessageId ??
      addMessage({
        role: 'assistant',
        content: '',
        status: 'streaming',
      })

    updateMessage(assistantMsgId, {
      content: 'Retrying...',
      status: 'streaming',
    })

    setStreaming(true)
    setLoading(true)
    const startTime = Date.now()

    try {
      // Ensure payload panel stays in-sync with what we resend
      setMessages(payloadMessages)

      let response: string
      if (USE_STREAMING) {
        response = await aiService.streamChat(
          payloadMessages,
          (_chunk, accumulated) => {
            updateMessage(assistantMsgId, {
              content: `Retrying...\n\n${accumulated}`,
            })
          }
        )
      } else {
        response = await aiService.chat(payloadMessages)
      }

      let finalCode = extractCode(response, engineType)

      // Validate the generated content with auto-fix for Mermaid
      let validatedCode = finalCode
      let validation = await validateContent(validatedCode, engineType)
      if (!validation.valid && engineType === 'mermaid') {
        validatedCode = await attemptMermaidAutoFix(
          validatedCode,
          validation.error || 'Unknown error',
          systemPrompt,
          assistantMsgId
        )
        validation = await validateContent(validatedCode, engineType)
      }

      if (!validation.valid) {
        throw new Error(`Invalid ${engineType} output: ${validation.error}`)
      }

      finalCode = validatedCode

      setContentFromVersion(finalCode)

      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      updateMessage(assistantMsgId, {
        content: `Diagram generated successfully. (${duration}s)`,
        status: 'complete',
      })

      await VersionRepository.create({
        projectId: currentProject.id,
        content: finalCode,
        changeSummary: 'AI 重试',
      })

      try {
        let thumbnail: string = ''
        if (engineType === 'drawio') {
          const getThumbnailWithRetry = async (maxRetries = 3, delay = 500): Promise<string> => {
            for (let i = 0; i < maxRetries; i++) {
              await new Promise(resolve => setTimeout(resolve, delay))
              const getter = useEditorStore.getState().thumbnailGetter
              if (getter) {
                const result = await getter()
                if (result) return result
              }
            }
            return ''
          }
          thumbnail = await getThumbnailWithRetry()
        } else {
          thumbnail = await generateThumbnail(finalCode, engineType)
        }

        if (thumbnail) {
          await ProjectRepository.update(currentProject.id, { thumbnail })
          setProject({ ...currentProject, thumbnail })
        }
      } catch (err) {
        console.error('Failed to generate thumbnail:', err)
      }

      await ProjectRepository.update(currentProject.id, {})
      success('Diagram generated successfully')

    } catch (error) {
      console.error('AI retry failed:', error)
      updateMessage(assistantMsgId, {
        content: `Error: ${error instanceof Error ? error.message : 'Retry failed'}`,
        status: 'error',
      })
      showError(error instanceof Error ? error.message : 'Retry failed')
    } finally {
      setStreaming(false)
      setLoading(false)
    }
  }

  /**
   * Two-phase generation for initial creation (drawio/excalidraw)
   */
  const twoPhaseGeneration = async (
    userInput: string,
    engineType: EngineType,
    systemPrompt: string,
    assistantMsgId: string,
    attachments?: Attachment[]
  ): Promise<string> => {
    // Phase 1: Generate elements
    updateMessage(assistantMsgId, {
      content: 'Phase 1/2: Generating elements...',
      status: 'streaming',
    })

    const phase1Prompt = buildInitialPrompt(userInput, true, 'elements')
    const phase1Content = buildMultimodalContent(phase1Prompt, attachments)

    const phase1Messages: PayloadMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: phase1Content },
    ]

    setMessages(phase1Messages)

    let elements: string
    if (USE_STREAMING) {
      const response = await aiService.streamChat(
        phase1Messages,
        (_chunk, accumulated) => {
          updateMessage(assistantMsgId, {
            content: `Phase 1/2: Generating elements...\n\n${accumulated}`,
          })
        }
      )
      elements = extractCode(response, engineType)
    } else {
      const response = await aiService.chat(phase1Messages)
      elements = extractCode(response, engineType)
    }

    // Phase 2: Generate links/connections
    updateMessage(assistantMsgId, {
      content: 'Phase 2/2: Generating connections...',
      status: 'streaming',
    })

    // Generate thumbnail from phase 1 elements for context
    let phase1Thumbnail: string | undefined
    try {
      phase1Thumbnail = await generateThumbnail(elements, engineType)
    } catch (err) {
      console.error('Failed to generate phase 1 thumbnail:', err)
    }

    const phase2Prompt = buildInitialPrompt(userInput, true, 'links', elements)
    const phase2Content = buildMultimodalContent(phase2Prompt, attachments, phase1Thumbnail)
    const phase2Messages: PayloadMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: phase1Content },
      { role: 'assistant', content: elements },
      { role: 'user', content: phase2Content },
    ]

    setMessages(phase2Messages)

    if (USE_STREAMING) {
      const response = await aiService.streamChat(
        phase2Messages,
        (_chunk, accumulated) => {
          updateMessage(assistantMsgId, {
            content: `Phase 2/2: Generating connections...\n\n${accumulated}`,
          })
        }
      )
      return extractCode(response, engineType)
    } else {
      const response = await aiService.chat(phase2Messages)
      return extractCode(response, engineType)
    }
  }

  /**
   * Single-phase generation for initial creation (mermaid)
   */
  const singlePhaseInitialGeneration = async (
    userInput: string,
    engineType: EngineType,
    systemPrompt: string,
    assistantMsgId: string,
    attachments?: Attachment[]
  ): Promise<string> => {
    updateMessage(assistantMsgId, {
      content: 'Generating diagram...',
      status: 'streaming',
    })

    const prompt = buildInitialPrompt(userInput, false)
    const content = buildMultimodalContent(prompt, attachments)

    const messages: PayloadMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: content },
    ]

    setMessages(messages)

    if (USE_STREAMING) {
      const response = await aiService.streamChat(
        messages,
        (_chunk, accumulated) => {
          updateMessage(assistantMsgId, {
            content: `Generating diagram...\n\n${accumulated}`,
          })
        }
      )
      return extractCode(response, engineType)
    } else {
      const response = await aiService.chat(messages)
      return extractCode(response, engineType)
    }
  }

  /**
   * Single-phase generation for edits
   * @param currentThumbnail - Current diagram thumbnail for AI context
   */
  const singlePhaseGeneration = async (
    userInput: string,
    currentCode: string,
    engineType: EngineType,
    systemPrompt: string,
    assistantMsgId: string,
    attachments?: Attachment[],
    currentThumbnail?: string
  ): Promise<string> => {
    const editPrompt = buildEditPrompt(currentCode, userInput)
    const editContent = buildMultimodalContent(editPrompt, attachments, currentThumbnail)

    const messages: PayloadMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: editContent },
    ]

    setMessages(messages)

    if (USE_STREAMING) {
      const response = await aiService.streamChat(
        messages,
        (_chunk, accumulated) => {
          updateMessage(assistantMsgId, {
            content: `Modifying diagram...\n\n${accumulated}`,
          })
        }
      )
      return extractCode(response, engineType)
    } else {
      const response = await aiService.chat(messages)
      return extractCode(response, engineType)
    }
  }

  /**
   * Attempt to auto-fix Mermaid code errors by asking AI to fix them
   */
  const attemptMermaidAutoFix = async (
    failedCode: string,
    errorMessage: string,
    systemPrompt: string,
    assistantMsgId: string
  ): Promise<string> => {
    let currentCode = failedCode
    let currentError = errorMessage
    let attempts = 0

    while (attempts < MAX_MERMAID_FIX_ATTEMPTS) {
      attempts++

      updateMessage(assistantMsgId, {
        content: `修复报错 (尝试 ${attempts}/${MAX_MERMAID_FIX_ATTEMPTS})...\n错误: ${currentError}`,
        status: 'streaming',
      })

      const fixPrompt = `请修复下面 Mermaid 代码中的错误，只返回修复后的代码。
      报错："""${currentError}"""
      当前代码："""${currentCode}"""`

      const messages: PayloadMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fixPrompt },
      ]

      setMessages(messages)

      let fixedCode: string
      if (USE_STREAMING) {
        const response = await aiService.streamChat(
          messages,
          (_chunk, accumulated) => {
            updateMessage(assistantMsgId, {
              content: `修复报错 (尝试 ${attempts}/${MAX_MERMAID_FIX_ATTEMPTS})...\n\n${accumulated}`,
            })
          }
        )
        fixedCode = extractCode(response, 'mermaid')
      } else {
        const response = await aiService.chat(messages)
        fixedCode = extractCode(response, 'mermaid')
      }

      // Validate the fixed code
      const validation = await validateContent(fixedCode, 'mermaid')
      if (validation.valid) {
        return fixedCode
      }

      // Update for next iteration
      currentCode = fixedCode
      currentError = validation.error || 'Unknown error'
    }

    // Return the last attempted code (will be validated again in caller)
    return currentCode
  }

  return { generate, retryLast }
}
