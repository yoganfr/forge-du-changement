import { supabase } from '../supabase'
import type { Invitation } from '../types'
import { dedupedFetch, invalidateCache, type ListOptions } from './cache'
import { insertAuditEvent } from './audit'

export async function createInvitation(data: Partial<Invitation>): Promise<Invitation> {
  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  const inv = invitation as Invitation
  if (inv.workspace_id) invalidateCache([`workspace-invitations:${inv.workspace_id}`])
  void insertAuditEvent({
    workspace_id: inv.workspace_id,
    action: 'invitation_created',
    payload: { email: inv.email, role: inv.role },
  })
  return inv
}

export async function getWorkspaceInvitations(
  workspaceId: string,
  options?: ListOptions,
): Promise<Invitation[]> {
  const offset = options?.offset ?? 0
  const limit = options?.limit
  const cacheKey = `workspace-invitations:${workspaceId}:${offset}:${limit ?? 'all'}`
  return dedupedFetch(cacheKey, async () => {
    let query = supabase.from('invitations').select('*').eq('workspace_id', workspaceId)
    if (typeof limit === 'number' && limit > 0) {
      query = query.range(offset, offset + limit - 1)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as Invitation[]
  })
}

/** Invitation par email — la RLS doit limiter qui lit quelles lignes (éviter fuite cross-workspace). */
export async function getLatestPendingInvitationForEmail(email: string): Promise<Invitation | null> {
  const normalized = email.trim().toLowerCase()
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('email', normalized)
    .eq('status', 'en_attente')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data as Invitation | null
}

/** Invitation déjà acceptée côté Auth / base, mais pas encore de ligne `public.users` (profil à créer). */
export async function getAcceptedInvitationAwaitingUserRow(email: string): Promise<Invitation | null> {
  const normalized = email.trim().toLowerCase()
  const { data: existingUser } = await supabase.from('users').select('id').eq('email', normalized).maybeSingle()
  if (existingUser) return null
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('email', normalized)
    .eq('status', 'acceptee')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data as Invitation | null
}

/** Passe les invitations `en_attente` à `acceptee` pour cet email dans cet espace (après confirmation email ou profil). */
export async function markInvitationsAcceptedForWorkspaceEmail(
  workspaceId: string,
  email: string,
): Promise<void> {
  const normalized = email.trim().toLowerCase()
  const { error } = await supabase
    .from('invitations')
    .update({ status: 'acceptee' })
    .eq('workspace_id', workspaceId)
    .eq('email', normalized)
    .eq('status', 'en_attente')
  if (error) throw error
  invalidateCache([`workspace-invitations:${workspaceId}`])
  void insertAuditEvent({
    workspace_id: workspaceId,
    action: 'invitations_marked_accepted',
    payload: { email: normalized },
  })
}
