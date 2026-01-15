import * as React from 'react'
import {Slot} from '@radix-ui/react-slot'
import {cn} from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          // Variants
          {
            // Default: solid black button
            'bg-primary text-surface hover:bg-secondary': variant === 'default',
            // Outline: thin border style (Monochrome)
            'border border-primary bg-transparent text-primary hover:bg-primary hover:text-surface':
              variant === 'outline',
            // Ghost: no border, subtle hover
            'bg-transparent text-primary hover:bg-border': variant === 'ghost',
            // Link: text only
            'bg-transparent text-primary underline-offset-4 hover:underline': variant === 'link',
            // Secondary: muted background
            'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
            // Destructive: red background
            'bg-red-500 text-white hover:bg-red-600': variant === 'destructive',
          },
          // Sizes
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
