import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Consomme les paramètres d’URL renvoyés par Supabase Auth après un magic link / OAuth.
 * Complète `detectSessionInUrl` (parfois trop tardif ou capricieux sur mobile / WebView).
 */
export async function consumeAuthRedirectUrl(client: SupabaseClient): Promise<{
  consumed: boolean
  errorMessage?: string
}> {
  const url = new URL(window.location.href)
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))

  const authError =
    hashParams.get('error_description') ||
    hashParams.get('error') ||
    url.searchParams.get('error_description') ||
    url.searchParams.get('error')
  if (authError) {
    return { consumed: true, errorMessage: authError }
  }

  const access_token = hashParams.get('access_token')
  const refresh_token = hashParams.get('refresh_token')
  if (access_token && refresh_token) {
    const { error } = await client.auth.setSession({ access_token, refresh_token })
    if (error) return { consumed: true, errorMessage: error.message }
    stripSensitiveAuthFromUrl(url)
    return { consumed: true }
  }

  const code = url.searchParams.get('code')
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code)
    if (error) return { consumed: true, errorMessage: error.message }
    stripSensitiveAuthFromUrl(url)
    return { consumed: true }
  }

  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  if (token_hash && type) {
    const { error } = await client.auth.verifyOtp({
      token_hash,
      type: type as 'email' | 'signup' | 'recovery' | 'invite' | 'magiclink',
    })
    if (error) return { consumed: true, errorMessage: error.message }
    stripSensitiveAuthFromUrl(url)
    return { consumed: true }
  }

  return { consumed: false }
}

function stripSensitiveAuthFromUrl(url: URL) {
  url.hash = ''
  for (const key of ['code', 'token_hash', 'type', 'error', 'error_description']) {
    url.searchParams.delete(key)
  }
  const qs = url.searchParams.toString()
  window.history.replaceState({}, '', `${url.pathname}${qs ? `?${qs}` : ''}`)
}
