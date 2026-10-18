import { supabase } from '../supabase'

export type SessionUserCandidate = {
  id: string
  email: string | null
  workspace_id: string | null
}

/**
 * Une seule ligne : on la garde (même résultat que `maybeSingle`).
 * Plusieurs lignes : auth.uid(), puis l’id mémorisé, puis l’espace mémorisé, puis la plus récente.
 */
export function pickSessionUserId(params: {
  candidates: SessionUserCandidate[]
  email: string
  authUserId: string | null
  storedUserId: string | null
  storedWorkspaceId: string | null
}): string | null {
  const email = params.email.trim().toLowerCase()
  const pool = params.candidates.filter((row) => {
    const rowEmail = row.email?.trim().toLowerCase() ?? ''
    return row.id.length > 0 && rowEmail === email
  })
  if (pool.length === 0) return null
  if (pool.length === 1) return pool[0].id
  if (params.authUserId && pool.some((row) => row.id === params.authUserId)) return params.authUserId
  if (params.storedUserId && pool.some((row) => row.id === params.storedUserId)) return params.storedUserId
  if (params.storedWorkspaceId) {
    const byWorkspace = pool.find((row) => row.workspace_id === params.storedWorkspaceId)
    if (byWorkspace) return byWorkspace.id
  }
  return pool[0].id
}

function readBrowserIds(): { storedUserId: string | null; storedWorkspaceId: string | null } {
  try {
    return {
      storedUserId: localStorage.getItem('lfdc-user-id')?.trim() || null,
      storedWorkspaceId: localStorage.getItem('workspaceId')?.trim() || null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'localStorage inaccessible'
    console.warn('[session-user]', message)
    return { storedUserId: null, storedWorkspaceId: null }
  }
}

function asCandidate(row: unknown): SessionUserCandidate | null {
  if (!row || typeof row !== 'object') return null
  if (!('id' in row) || typeof row.id !== 'string' || !row.id) return null
  const email = 'email' in row && typeof row.email === 'string' ? row.email : null
  const workspaceId =
    'workspace_id' in row && typeof row.workspace_id === 'string' ? row.workspace_id : null
  return { id: row.id, email, workspace_id: workspaceId }
}

/** Id applicatif de la session. `null` s’il n’y a pas de ligne, ou si la lecture a échoué (avis console). */
export async function resolveSessionAppUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const email = session?.user?.email?.trim().toLowerCase() ?? ''
  if (!email) return null

  const { data, error } = await supabase
    .from('users')
    .select('id, email, workspace_id')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(25)

  if (error) {
    console.warn('[session-user]', error.message)
    return null
  }

  const candidates = (data ?? []).flatMap((row) => {
    const candidate = asCandidate(row)
    return candidate ? [candidate] : []
  })
  const browser = readBrowserIds()
  return pickSessionUserId({
    candidates,
    email,
    authUserId: session?.user?.id ?? null,
    storedUserId: browser.storedUserId,
    storedWorkspaceId: browser.storedWorkspaceId,
  })
}
