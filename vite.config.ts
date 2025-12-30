import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import dotenv from 'dotenv'
import fs from 'fs'

// Load .dev.vars
const devVarsPath = path.resolve(__dirname, '.dev.vars')
if (fs.existsSync(devVarsPath)) {
  dotenv.config({ path: devVarsPath })
}

const htmlPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml(html) {
      const debug = process.env.DEBUG === 'true'
      return html.replace(
        '</head>',
        `<script>window._ENV_ = { DEBUG: ${debug} };</script></head>`
      )
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), htmlPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy API requests to the local Node.js server
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
