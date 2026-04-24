import { createClient } from '@supabase/supabase-js'

/** Permet de lancer Vite en local sans .env (l’auth / API resteront non fonctionnels tant que les vraies clés ne sont pas définies). */
const DEV_FALLBACK_URL = 'https://example.supabase.co'
const DEV_FALLBACK_KEY = 'dev-placeholder-key'

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL?.trim() ||
  (import.meta.env.DEV ? DEV_FALLBACK_URL : '')
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_KEY?.trim() ||
  (import.meta.env.DEV ? DEV_FALLBACK_KEY : '')

/** Exposés pour les appels `fetch` manuels (ex. Edge Functions) avec les mêmes variables que le client. */
export const VITE_CONFIG_SUPABASE_URL = SUPABASE_URL
export const VITE_CONFIG_SUPABASE_ANON_KEY = SUPABASE_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
  },
})
