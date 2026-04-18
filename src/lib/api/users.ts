import { supabase } from '../supabase'
import type { User } from '../types'
import { insertAuditEvent } from './audit'
import { dedupedFetch, invalidateCache, type ListOptions } from './cache'

export async function createUser(data: Partial<User>): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  const u = user as User
  if (u.workspace_id) invalidateCache([`workspace-users:${u.workspace_id}`])
  if (u.workspace_id) {
    void insertAuditEvent({
      workspace_id: u.workspace_id,
      action: 'user_created',
      payload: { email: u.email, role: u.role },
    })
  }
  return u
}

/**
 * Mise à jour d’un `users` par id. Si `scope.workspace_id` est fourni, l’update ne matche que si la ligne
 * appartient à ce workspace (défense en profondeur ; la RLS reste la barrière principale).
 */
export async function updateUser(
  id: string,
  data: Partial<User>,
  scope?: { workspace_id: string },
): Promise<User> {
  let priorWorkspaceId: string | null = null
  if (!scope?.workspace_id) {
    const { data: prior } = await supabase.from('users').select('workspace_id').eq('id', id).maybeSingle()
    priorWorkspaceId = (prior as { workspace_id?: string } | null)?.workspace_id ?? null
  }
  let q = supabase.from('users').update(data).eq('id', id)
  if (scope?.workspace_id) {
    q = q.eq('workspace_id', scope.workspace_id)
  }
  const { data: user, error } = await q.select().single()
  if (error) throw error
  const u = user as User
  const workspacesToBump = new Set<string>()
  if (scope?.workspace_id) workspacesToBump.add(scope.workspace_id)
  if (priorWorkspaceId) workspacesToBump.add(priorWorkspaceId)
  if (u.workspace_id) workspacesToBump.add(u.workspace_id)
  invalidateCache([...workspacesToBump].map((w) => `workspace-users:${w}`))
  return u
}

export async function getWorkspaceUsers(workspaceId: string, options?: ListOptions): Promise<User[]> {
  const offset = options?.offset ?? 0
  const limit = options?.limit
  const cacheKey = `workspace-users:${workspaceId}:${offset}:${limit ?? 'all'}`
  return dedupedFetch(cacheKey, async () => {
    let query = supabase.from('users').select('*').eq('workspace_id', workspaceId)
    if (typeof limit === 'number' && limit > 0) {
      query = query.range(offset, offset + limit - 1)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as User[]
  })
}
