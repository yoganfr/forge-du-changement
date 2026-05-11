import { supabase } from '../supabase'
import type { Invitation } from '../types'
import { dedupedFetch, invalidateCache, type ListOptions } from './cache'
import { insertAuditEvent } from './audit'

async function resolveCurrentAppUserForInvitation(workspaceId?: string | null): Promise<{
  id: string | null
  role: string | null
  direction_id: string | null
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const email = session?.user?.email?.trim().toLowerCase() ?? null
  if (!email) return { id: null, role: null, direction_id: null }
  let q = supabase.from('users').select('id, role, direction_id').eq('email', email)
  const ws = workspaceId?.trim()
  if (ws) {
    q = q.eq('workspace_id', ws)
  }
  const { data } = await q.maybeSingle()
  const row = (data as { id?: string; role?: string; direction_id?: string | null } | null) ?? null
  return {
    id: row?.id ?? null,
    role: row?.role ?? null,
    direction_id: row?.direction_id ?? null,
  }
}

function deriveTrigramFromEmail(
  email: string,
  convention: 'prenom_nom_3' | 'nom_prenom_3' | 'custom' | null,
): string | null {
  if (convention === 'custom') return null
  const local = email.split('@')[0] ?? ''
  const normalized = local
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const parts = normalized.split(/[.\-_]/).filter(Boolean)
  if (parts.length === 0) return null
  const first = parts[0] ?? ''
  const second = parts[1] ?? ''
  if (convention === 'nom_prenom_3') {
    const base = `${(second || first).slice(0, 2)}${(first || second).slice(0, 1)}`
    return base.replace(/[^A-Z]/g, '').slice(0, 3) || null
  }
  const base = `${first.slice(0, 2)}${second.slice(0, 1)}`
  return base.replace(/[^A-Z]/g, '').slice(0, 3) || null
}

export async function createInvitation(data: Partial<Invitation>): Promise<Invitation> {
  const inviter = await resolveCurrentAppUserForInvitation(data.workspace_id ?? null)
  let workspaceConvention: 'prenom_nom_3' | 'nom_prenom_3' | 'custom' | null = null
  if (data.workspace_id) {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('trigram_convention')
      .eq('id', data.workspace_id)
      .maybeSingle()
    workspaceConvention =
      ((workspace as { trigram_convention?: 'prenom_nom_3' | 'nom_prenom_3' | 'custom' | null } | null)
        ?.trigram_convention ?? null)
  }
  const directionId =
    data.direction_id ??
    (inviter.role === 'codir' && inviter.direction_id ? inviter.direction_id : null)
  const trigram =
    data.trigram?.trim().toUpperCase() ??
    deriveTrigramFromEmail(data.email?.trim().toLowerCase() ?? '', workspaceConvention)
  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      ...data,
      direction_id: directionId,
      trigram,
    })
    .select()
    .single()
  if (error) throw error
  const inv = invitation as Invitation
  if (inv.workspace_id) invalidateCache([`workspace-invitations:${inv.workspace_id}`])
  void insertAuditEvent({
    workspace_id: inv.workspace_id,
    action: 'invitation_created',
    payload: { email: inv.email, role: inv.role, direction_id: directionId, trigram },
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

/**
 * Dernière invitation au statut « acceptée » pour cet email (indépendamment d’une ligne `users` existante).
 * Sert de référence métier pour rattacher le membre au bon `workspace_id` si la ligne `users` a divergé.
 */
export async function getLatestAcceptedInvitationForEmail(email: string): Promise<Invitation | null> {
  const normalized = email.trim().toLowerCase()
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

/** Supprime toutes les lignes `invitations` pour cet email dans l’espace (nettoyage avant/après retrait du membre). */
export async function deleteInvitationsForWorkspaceEmail(workspaceId: string, email: string): Promise<void> {
  const normalized = email.trim().toLowerCase()
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('email', normalized)
  if (error) throw error
  invalidateCache([`workspace-invitations:${workspaceId}`])
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
