import { supabase } from '../supabase'
import type { AuditEvent } from '../types'
import { resolveSessionAppUserId } from './sessionUser'

async function resolveAuditActorUserId(): Promise<string | null> {
  return resolveSessionAppUserId()
}

export async function insertAuditEvent(params: {
  workspace_id: string | null
  action: string
  payload?: Record<string, unknown>
}): Promise<boolean> {
  const actor_user_id = await resolveAuditActorUserId()
  const { error } = await supabase.from('audit_events').insert({
    workspace_id: params.workspace_id,
    actor_user_id,
    action: params.action,
    payload: params.payload ?? null,
  })
  if (error) {
    console.warn('[audit_events]', params.action, error.message)
    return false
  }
  return true
}

export async function listWorkspaceAuditEvents(
  workspaceId: string,
  actions?: string[],
  limit = 30,
): Promise<AuditEvent[]> {
  let q = supabase
    .from('audit_events')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (actions && actions.length > 0) {
    q = q.in('action', actions)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as AuditEvent[]
}
