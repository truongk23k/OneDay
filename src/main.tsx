import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Chỉ nạp bộ chữ Latin + tiếng Việt (bỏ các bảng chữ khác cho nhẹ).
import '@fontsource/be-vietnam-pro/latin-500.css'
import '@fontsource/be-vietnam-pro/latin-ext-500.css'
import '@fontsource/be-vietnam-pro/vietnamese-500.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/be-vietnam-pro/latin-ext-700.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/baloo-2/latin-800.css'
import '@fontsource/baloo-2/latin-ext-800.css'
import '@fontsource/baloo-2/vietnamese-800.css'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
