import '@primer/react-brand/fonts/fonts.css'
import '@primer/react-brand/lib/css/main.css'
import './global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
