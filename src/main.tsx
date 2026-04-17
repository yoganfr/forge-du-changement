import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './themes.css'
import './design-system.css'
import './index.css'
import App from './App.tsx'
import AuthCallback from './pages/AuthCallback.tsx'

const path = window.location.pathname
const RootComponent = path === '/auth/callback' ? AuthCallback : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>,
)
