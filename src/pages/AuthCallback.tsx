import { useEffect, useState } from 'react'
import { userCanAccessApp, signOut } from '../lib/auth'
import { supabase } from '../lib/supabase'

const STALL_MS = 45_000

export default function AuthCallback() {
  const [stallError, setStallError] = useState(false)

  useEffect(() => {
    let cancelled = false
    let finished = false
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

    function tryContinueWithSession(session: { user?: { email?: string | null } } | null) {
      const email = session?.user?.email?.trim()
      if (!email || cancelled || finished) return
      finished = true
      unsubscribe?.()
      void allowThenRedirect(email)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled || finished) return
      if (event === 'PASSWORD_RECOVERY') return
      if (
        event === 'SIGNED_IN' ||
        event === 'INITIAL_SESSION' ||
        (event === 'TOKEN_REFRESHED' && session?.user?.email)
      ) {
        tryContinueWithSession(session)
      }
    })
    unsubscribe = () => subscription.unsubscribe()

    void supabase.auth.getSession().then(({ data: { session } }) => {
      tryContinueWithSession(session)
    })

    const stallTimer = window.setTimeout(() => {
      if (!cancelled && !finished) setStallError(true)
    }, STALL_MS)

    return () => {
      cancelled = true
      window.clearTimeout(stallTimer)
      subscription.unsubscribe()
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
      gap: '16px',
      padding: '24px',
      textAlign: 'center',
    }}>
      {!stallError ? (
        <>
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
        </>
      ) : (
        <>
          <p style={{ fontSize: '15px', maxWidth: '320px', lineHeight: 1.5 }}>
            La connexion via le lien prend trop de temps. Ouvrez le lien depuis le navigateur
            de votre téléphone (Safari, Chrome) plutôt que depuis l’application mail, ou
            demandez un nouvel email d’invitation.
          </p>
          <a
            href="/"
            style={{
              fontSize: '14px',
              color: 'var(--theme-accent, #8E3B46)',
              textDecoration: 'underline',
            }}
          >
            Retour à la connexion
          </a>
        </>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
