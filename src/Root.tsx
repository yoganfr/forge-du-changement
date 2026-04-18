import App from './App.tsx'
import AuthCallback from './pages/AuthCallback.tsx'

export default function Root() {
  const path = window.location.pathname
  return path === '/auth/callback' ? <AuthCallback /> : <App />
}
