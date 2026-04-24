import {
  supabase,
  VITE_CONFIG_SUPABASE_ANON_KEY,
  VITE_CONFIG_SUPABASE_URL,
} from '../supabase'
import type { DiscoursScoreSnapshot } from '../types'

/**
 * Appelle l’Edge Function `discours-analyze` (OpenRouter) avec la session courante.
 * Métier : la clé OpenRouter ne transite jamais par le navigateur (uniquement côté Supabase).
 *
 * `fetch` explicite (apikey + Authorization) : en prod, `functions.invoke` a pu envoyer
 * la requête sans en-tête utilisateur (UNAUTHORIZED_NO_AUTH_HEADER) selon le bundle.
 */
export async function analyzeDiscoursWithAI(
  workspaceId: string,
  flatText: string,
): Promise<DiscoursScoreSnapshot> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) {
    throw new Error('Session expirée ou absente. Reconnectez-vous pour lancer l’analyse IA.')
  }

  const base = VITE_CONFIG_SUPABASE_URL?.replace(/\/$/, '') ?? ''
  const anon = VITE_CONFIG_SUPABASE_ANON_KEY
  if (!base || !anon) {
    throw new Error('Configuration Supabase manquante (URL ou clé).')
  }

  const res = await fetch(`${base}/functions/v1/discours-analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ workspaceId, text: flatText }),
  })

  let payload: unknown
  try {
    payload = await res.json()
  } catch {
    throw new Error(`Analyse IA indisponible (réponse ${res.status}).`)
  }

  if (!res.ok) {
    const err = payload as { message?: string; code?: string; error?: string }
    const msg =
      err?.message || err?.error || err?.code || `Analyse IA indisponible (${res.status})`
    throw new Error(msg)
  }

  const data = payload
  if (!data || typeof data !== 'object' || !('source' in data)) {
    throw new Error('Réponse IA vide ou invalide')
  }
  return data as DiscoursScoreSnapshot
}
