import {useEffect, useRef} from 'react'
import {Megaphone} from 'lucide-react'

interface NotificationBarProps {
  message?: string
  className?: string
  showIcon?: boolean
  iconClassName?: string
}

export function NotificationBar({ message, className, showIcon = true, iconClassName }: NotificationBarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const text = textRef.current
    if (!container || !text || !message) return

    let animation: Animation | undefined

    const startAnimation = () => {
      if (animation) animation.cancel()

      const containerWidth = container.offsetWidth
      const textWidth = text.offsetWidth

      // Calculate distance: from right edge of container to left edge of text (fully hidden)
      // Start: translateX(containerWidth) -> Text is just outside right edge
      // End: translateX(-textWidth) -> Text is just outside left edge
      const distance = containerWidth + textWidth
      const speed = 50 // pixels per second
      const duration = (distance / speed) * 1000 // ms

      animation = text.animate(
        [
          { transform: `translateX(${containerWidth}px)` },
          { transform: `translateX(-${textWidth}px)` }
        ],
        {
          duration: duration,
          iterations: Infinity,
          easing: 'linear'
        }
      )
    }

    startAnimation()

    const handleResize = () => {
      startAnimation()
    }

    window.addEventListener('resize', handleResize)
    return () => {
      if (animation) animation.cancel()
      window.removeEventListener('resize', handleResize)
    }
  }, [message])

  const handleMouseEnter = () => {
    const text = textRef.current
    if (text) {
      text.getAnimations().forEach(anim => anim.pause())
    }
  }

  const handleMouseLeave = () => {
    const text = textRef.current
    if (text) {
      text.getAnimations().forEach(anim => anim.play())
    }
  }

  if (!message) return null

  // Default styles if not overridden by className
  const defaultBg = className?.includes('bg-') ? '' : 'bg-yellow-50/80 border-b border-yellow-100 text-yellow-800'

  return (
    <div
      className={`relative w-full max-w-full h-8 overflow-hidden flex items-center ${defaultBg} ${className || ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showIcon && (
        <div className={`absolute left-0 top-0 bottom-0 z-10 flex items-center px-2 ${iconClassName || 'bg-yellow-50/90 shadow-[2px_0_5px_rgba(255,255,255,0.5)]'}`}>
          <Megaphone className="h-4 w-4 text-current opacity-80" />
        </div>
      )}
      <div ref={containerRef} className={`flex-1 overflow-hidden relative h-full flex items-center min-w-0 ${showIcon ? 'ml-8' : ''}`}>
        <div
          ref={textRef}
          className="absolute whitespace-nowrap flex items-center will-change-transform"
        >
          <span
            className="px-4 text-sm font-medium [&_a]:text-blue-600 [&_a]:underline [&_a]:font-semibold [&_b]:text-black [&_b]:font-extrabold [&_strong]:text-black [&_strong]:font-extrabold"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        </div>
      </div>
    </div>
  )
}

