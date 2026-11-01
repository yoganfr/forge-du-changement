import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Empreinte du script de thème dans index.html. À recalculer si ce script change.
const themeScriptHash = 'sha256-iMvwttWUHtn5gjGmRk+V5swlmlBIXGphq5bFutnzT/4='

const cspBase = [
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
]

const securityHeaders: Record<string, string> = {
  'Content-Security-Policy': [...cspBase, `script-src 'self' '${themeScriptHash}'`].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
}

// En local, Vite injecte un script qui change à chaque lancement. L'empreinte du thème
// ne peut pas le couvrir, et la page reste blanche. La politique stricte reste sur
// l'aperçu et sur Vercel.
const devSecurityHeaders: Record<string, string> = {
  ...securityHeaders,
  'Content-Security-Policy': [...cspBase, "script-src 'self' 'unsafe-inline'"].join('; '),
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { headers: devSecurityHeaders },
  preview: { headers: securityHeaders },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@supabase/supabase-js')) return 'supabase-vendor'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          return undefined
        },
      },
    },
  },
})
