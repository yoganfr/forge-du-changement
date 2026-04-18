import { supabase } from '../supabase'

async function resolveAuditActorUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const email = session?.user?.email?.trim().toLowerCase()
  if (!email) return null
  const { data } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
  return data?.id ?? null
}

export async function insertAuditEvent(params: {
  workspace_id: string | null
  action: string
  payload?: Record<string, unknown>
}): Promise<void> {
  const actor_user_id = await resolveAuditActorUserId()
  const { error } = await supabase.from('audit_events').insert({
    workspace_id: params.workspace_id,
    actor_user_id,
    action: params.action,
    payload: params.payload ?? null,
  })
  if (error && import.meta.env.DEV) {
    console.warn('[audit_events]', params.action, error.message)
  }
}
