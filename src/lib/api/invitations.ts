import { supabase } from '../supabase'
import type { Invitation } from '../types'
import { dedupedFetch, invalidateCache, type ListOptions } from './cache'
import { insertAuditEvent } from './audit'
import {
  INCOMPLETE_INVITATION_MESSAGE,
  INVITATION_ABSENT_MESSAGE,
  INVITATION_READ_FAILED_MESSAGE,
  INVITATION_STATUS_CHANGED_MESSAGE,
  classifyInviteeRole,
  classifyRereadInvitation,
  parseInvitationCandidate,
  parseInvitationCandidates,
  pickInvitationForWorkspace,
  preferBootstrapInvitation,
  type InvitationCandidate,
  type InviteeStoredRole,
} from '../inviteeRole'

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
  const { data: existingUsers, error: existingUserError } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalized)
    .limit(1)
  if (existingUserError) {
    console.warn('[invitations]', existingUserError.message)
  } else if (existingUsers && existingUsers.length > 0) {
    return null
  }
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('email', normalized)
    .eq('status', 'acceptee')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.warn('[invitations]', error.message)
    return null
  }
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

const INVITATION_ROLE_COLUMNS = 'id, workspace_id, role, status, created_at, direction_id, trigram'

export type InvitationBootstrap =
  | { kind: 'ready'; role: InviteeStoredRole; workspaceId: string; invitationId: string }
  | { kind: 'incomplete'; message: string }
  | { kind: 'absent' }
  | { kind: 'read_failed'; message: string }

export type AcceptedInviteeRoleResult =
  | {
      kind: 'ready'
      role: InviteeStoredRole
      invitationId: string
      workspaceId: string
      directionId: string | null
      trigram: string | null
    }
  | { kind: 'incomplete' | 'absent' | 'read_failed' | 'status_changed'; message: string }

function warnInvitation(kind: string, detail: Record<string, string | null>): void {
  console.warn('[invitation]', kind, detail)
}

function messageForClass(kind: 'incomplete' | 'absent' | 'status_changed'): string {
  if (kind === 'incomplete') return INCOMPLETE_INVITATION_MESSAGE
  if (kind === 'absent') return INVITATION_ABSENT_MESSAGE
  return INVITATION_STATUS_CHANGED_MESSAGE
}

/**
 * Lecture des invitations de cet e-mail pour ouvrir la session.
 * Une erreur réseau n’est pas une absence : l’appelant affiche un message de nouvel essai.
 */
export async function readInvitationBootstrap(email: string): Promise<InvitationBootstrap> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return { kind: 'absent' }
  const { data, error } = await supabase
    .from('invitations')
    .select(INVITATION_ROLE_COLUMNS)
    .eq('email', normalized)
    .in('status', ['en_attente', 'acceptee'])
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(20)
  if (error) {
    warnInvitation('read_failed', { invitationId: null, workspaceId: null })
    return { kind: 'read_failed', message: INVITATION_READ_FAILED_MESSAGE }
  }
  const chosen = preferBootstrapInvitation(parseInvitationCandidates(data))
  if (!chosen?.workspace_id) return { kind: 'absent' }
  const classified = classifyInviteeRole(chosen, chosen.workspace_id)
  if (classified.kind === 'incomplete') {
    warnInvitation('incomplete', { invitationId: chosen.id, workspaceId: chosen.workspace_id })
    return { kind: 'incomplete', message: INCOMPLETE_INVITATION_MESSAGE }
  }
  if (classified.kind !== 'ready') return { kind: 'absent' }
  return {
    kind: 'ready',
    role: classified.role,
    workspaceId: chosen.workspace_id,
    invitationId: chosen.id,
  }
}

async function listInviteeInvitationsForWorkspace(
  email: string,
  workspaceId: string,
): Promise<{ kind: 'rows'; rows: InvitationCandidate[] } | { kind: 'read_failed'; message: string }> {
  const { data, error } = await supabase
    .from('invitations')
    .select(INVITATION_ROLE_COLUMNS)
    .eq('email', email)
    .eq('workspace_id', workspaceId)
    .in('status', ['en_attente', 'acceptee'])
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(20)
  if (error) {
    warnInvitation('read_failed', { invitationId: null, workspaceId })
    return { kind: 'read_failed', message: INVITATION_READ_FAILED_MESSAGE }
  }
  return { kind: 'rows', rows: parseInvitationCandidates(data) }
}

async function rereadInvitation(
  invitationId: string,
  workspaceId: string,
  email: string,
): Promise<{ kind: 'row'; row: InvitationCandidate | null } | { kind: 'read_failed'; message: string }> {
  const { data, error } = await supabase
    .from('invitations')
    .select(INVITATION_ROLE_COLUMNS)
    .eq('id', invitationId)
    .eq('workspace_id', workspaceId)
    .eq('email', email)
    .maybeSingle()
  if (error) {
    warnInvitation('read_failed', { invitationId, workspaceId })
    return { kind: 'read_failed', message: INVITATION_READ_FAILED_MESSAGE }
  }
  return { kind: 'row', row: parseInvitationCandidate(data) }
}

/**
 * Rôle à écrire sur `users` pour un invité de cet espace.
 * La ligne retenue est la plus récente (`en_attente` ou `acceptee`),
 * même règle que l’ouverture de session. Elle est relue au statut `acceptee`
 * juste avant l’insert. Une invitation d’un autre espace ne compte pas.
 */
export async function resolveAcceptedInviteeRole(
  email: string,
  workspaceId: string,
): Promise<AcceptedInviteeRoleResult> {
  const normalized = email.trim().toLowerCase()
  const listed = await listInviteeInvitationsForWorkspace(normalized, workspaceId)
  if (listed.kind === 'read_failed') return listed
  const picked = pickInvitationForWorkspace(listed.rows, workspaceId)
  const classified = classifyInviteeRole(picked, workspaceId)
  if (classified.kind !== 'ready' || !picked) {
    const kind = classified.kind === 'ready' ? 'absent' : classified.kind
    warnInvitation(kind, { invitationId: picked?.id ?? null, workspaceId })
    return { kind, message: messageForClass(kind) }
  }
  if (picked.status === 'en_attente') {
    try {
      await markInvitationsAcceptedForWorkspaceEmail(workspaceId, normalized)
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'mise à jour impossible'
      warnInvitation('read_failed', { invitationId: picked.id, workspaceId })
      console.warn('[invitation]', detail)
      return { kind: 'read_failed', message: INVITATION_READ_FAILED_MESSAGE }
    }
  }
  const reread = await rereadInvitation(picked.id, workspaceId, normalized)
  if (reread.kind === 'read_failed') return reread
  const after = classifyRereadInvitation(reread.row, workspaceId, picked.id)
  if (after.kind !== 'ready') {
    warnInvitation(after.kind, { invitationId: picked.id, workspaceId })
    return { kind: after.kind, message: messageForClass(after.kind) }
  }
  return {
    kind: 'ready',
    role: after.role,
    invitationId: picked.id,
    workspaceId,
    directionId: reread.row?.direction_id ?? null,
    trigram: reread.row?.trigram?.trim().toUpperCase() || null,
  }
}
