import App from './App.tsx'
import AuthCallback from './pages/AuthCallback.tsx'

/** Même logique que `/auth/callback` si le template mail ou la config Supabase pointe vers `/auth/confirm`. */
const AUTH_RETURN_PATHS = new Set(['/auth/callback', '/auth/confirm'])

export default function Root() {
  const path = window.location.pathname
  return AUTH_RETURN_PATHS.has(path) ? <AuthCallback /> : <App />
}
