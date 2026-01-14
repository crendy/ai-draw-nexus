import {Bot} from 'lucide-react'

export const ProviderIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'openai':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 1.9016-1.116a.3194.3194 0 0 0 .1465-.2632v-2.6742l.8141.4716v4.4819a4.4755 4.4755 0 0 1-.1277.2211zm-9.6684-4.2634a4.466 4.466 0 0 1-.0852-3.0623l.142.0852 1.8921 1.116a.3241.3241 0 0 0 .3076 0L7.9757 15.17l-2.2936 3.8545a4.466 4.466 0 0 1-2.0918-2.8668zm6.5098-9.1183a4.4708 4.4708 0 0 1 3.0908-.0851l-.142.0851-1.8921 1.116a.3241.3241 0 0 0-.3076 0l-2.1341 1.2309-2.2936-3.8545a4.466 4.466 0 0 1 3.6786 1.5076zm12.349 2.2237a4.466 4.466 0 0 1 .0852 3.0623l-.142-.0852-1.8921-1.116a.3241.3241 0 0 0-.3076 0l-2.1341 1.2309 2.2936-3.8545a4.466 4.466 0 0 1 2.097 2.7625zm-3.3018 8.2628l-2.1341-1.231.0614-.0331 1.8921-1.116a.3241.3241 0 0 0 .1563-.2632v-2.4658l2.2841 3.9446a4.4708 4.4708 0 0 1-2.2598 1.1645zm-8.3766-5.346l-2.1341-1.2309 2.2936-3.8545a4.466 4.466 0 0 1 2.0918 2.8668l-.1419-.0804-1.9016-1.116a.3194.3194 0 0 0-.1465.2632v2.6742l-.8141-.4716a.3194.3194 0 0 0-.0473-.0506zm-1.2642 1.3065a1.79 1.79 0 0 1-1.7308-.0048 1.79 1.79 0 0 1-1.013-1.5434 1.79 1.79 0 0 1 1.0035-1.5481 1.79 1.79 0 0 1 1.7356-.0048 1.79 1.79 0 0 1 1.013 1.5481 1.79 1.79 0 0 1-1.0083 1.553z" fill="currentColor" />
        </svg>
      )
    case 'deepseek':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
        </svg>
      )
    case 'siliconflow':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
          <path d="M4 4H20V20H4V4ZM6 6V18H18V6H6ZM8 8H16V16H8V8Z" fill="currentColor"/>
        </svg>
      )
    case 'volcengine':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
           <path d="M12 2L2 22H22L12 2Z" fill="currentColor"/>
        </svg>
      )
    case 'ollama':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
           <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
           <circle cx="9" cy="10" r="1.5" fill="currentColor" className="text-background"/>
           <circle cx="15" cy="10" r="1.5" fill="currentColor" className="text-background"/>
           <path d="M12 16C10 16 9 15 9 15H15C15 15 14 16 12 16Z" fill="currentColor" className="text-background"/>
        </svg>
      )
    case 'moonshot':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
           <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>
        </svg>
      )
    case 'hunyuan':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
           <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
           <path d="M12 2C12 2 16 7 16 12C16 17 12 22 12 22" stroke="currentColor" strokeWidth="2"/>
           <path d="M12 2C12 2 8 7 8 12C8 17 12 22 12 22" stroke="currentColor" strokeWidth="2"/>
           <path d="M2 12H22" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    case 'newapi':
      return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
           <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/>
        </svg>
      )
    default:
      return <Bot className="h-4 w-4" />
  }
}

