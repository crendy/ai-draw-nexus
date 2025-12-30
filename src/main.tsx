import React, {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Log environment configuration at startup
const env = (window as any)._ENV_
console.log('[App] Startup Environment:', env)
if (env?.DEBUG) {
  console.log('[App] Debug mode enabled')
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)