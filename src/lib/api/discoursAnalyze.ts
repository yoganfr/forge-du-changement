import { supabase } from '../supabase'
import type { DiscoursScoreSnapshot } from '../types'

/**
 * Appelle l’Edge Function `discours-analyze` (OpenRouter) avec la session courante.
 * Métier : la clé OpenRouter ne transite jamais par le navigateur (uniquement côté Supabase).
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
  const { data, error } = await supabase.functions.invoke<DiscoursScoreSnapshot>('discours-analyze', {
    body: { workspaceId, text: flatText },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (error) {
    const msg = error.message ?? 'Analyse IA indisponible'
    throw new Error(msg)
  }
  if (!data || typeof data !== 'object' || !('source' in data)) {
    throw new Error('Réponse IA vide ou invalide')
  }
  return data as DiscoursScoreSnapshot
}
