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
  // #region agent log
  try {
    const { data: userInfo } = await supabase.auth.getUser()
    fetch('http://127.0.0.1:7271/ingest/4a825d9f-9e80-4d72-a03f-6e97efcd6511',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cf4629'},body:JSON.stringify({sessionId:'cf4629',runId:'discours-pre-call',hypothesisId:'H1-H4',location:'discoursAnalyze.ts:before-fetch',message:'pre invoke session/user',data:{has_token:Boolean(token),session_user_id:session?.user?.id ?? null,session_user_email:session?.user?.email ?? null,getuser_id:userInfo?.user?.id ?? null,getuser_email:userInfo?.user?.email ?? null,workspaceId},timestamp:Date.now()})}).catch(()=>{})
  } catch { /* ignore */ }
  // #endregion
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
    const err = payload as { message?: string; code?: string; error?: string; _debug?: unknown }
    // #region agent log
    fetch('http://127.0.0.1:7271/ingest/4a825d9f-9e80-4d72-a03f-6e97efcd6511',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cf4629'},body:JSON.stringify({sessionId:'cf4629',runId:'discours-response',hypothesisId:'H1-H5',location:'discoursAnalyze.ts:after-fetch',message:'edge non-2xx',data:{status:res.status,body:err},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
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
