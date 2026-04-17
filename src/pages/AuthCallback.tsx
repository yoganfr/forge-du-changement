import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        window.location.href = '/'
      }
    })

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = '/'
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100svh',
        fontFamily: 'Inter, system-ui',
      }}
    >
      <p>Connexion en cours...</p>
    </div>
  )
}
