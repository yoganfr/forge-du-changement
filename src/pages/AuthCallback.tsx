import { useEffect } from 'react'
import { userCanAccessApp, signOut } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | undefined

    async function allowThenRedirect(sessionUserEmail: string) {
      const ok = await userCanAccessApp(sessionUserEmail)
      if (cancelled) return
      if (!ok) {
        await signOut()
        window.location.replace('/')
        return
      }
      window.location.replace('/')
    }

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return
      if (session?.user?.email) {
        await allowThenRedirect(session.user.email)
        return
      }
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
        if (cancelled || event !== 'SIGNED_IN' || !nextSession?.user?.email) return
        subscription.unsubscribe()
        await allowThenRedirect(nextSession.user.email)
      })
      unsubscribe = () => subscription.unsubscribe()
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
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
