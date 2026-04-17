import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.replace('/')
        return
      }
      // Traiter le hash fragment OAuth
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          window.location.replace('/')
        }
      })
    })
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100svh',
      fontFamily: 'var(--font-body)',
      background: 'var(--theme-bg-page, #121212)',
      color: 'var(--theme-text, #f0f0f0)',
      gap: '16px'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '3px solid #8E3B46',
        borderTopColor: 'transparent',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{ fontSize: '14px', opacity: 0.6 }}>
        Connexion en cours...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
