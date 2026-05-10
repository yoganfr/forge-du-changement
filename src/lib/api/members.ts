import {
  supabase,
  VITE_CONFIG_SUPABASE_ANON_KEY,
  VITE_CONFIG_SUPABASE_URL,
} from '../supabase'
import { insertAuditEvent } from './audit'
import { invalidateCache } from './cache'
import { setWorkspaceDirigeant } from './discoursTransformation'
import { deleteInvitationsForWorkspaceEmail } from './invitations'

/**
 * Retire un membre de l’espace : invitations puis rattachement consultant éventuel, puis ligne `users`.
 * La suppression éventuelle du compte Supabase Auth est déclenchée ensuite par
 * {@link invokeRemoveMemberAuthCleanup} (Edge Function `remove-member-auth-cleanup`).
 */
export async function removeWorkspaceMember(params: {
  workspaceId: string
  email: string
  userId: string | null
  /** Si la ligne supprimée est le dirigeant désigné, le champ est effacé avant DELETE `users`. */
  workspaceDirigeantUserId?: string | null
}): Promise<void> {
  const { workspaceId, email, userId, workspaceDirigeantUserId } = params
  const normalized = email.trim().toLowerCase()

  await deleteInvitationsForWorkspaceEmail(workspaceId, normalized)

  if (!userId) {
    void insertAuditEvent({
      workspace_id: workspaceId,
      action: 'workspace_member_removed',
      payload: { email: normalized, user_id: null },
    })
    return
  }

  if (workspaceDirigeantUserId && userId === workspaceDirigeantUserId) {
    await setWorkspaceDirigeant(workspaceId, null)
  }

  const { error: wcErr } = await supabase
    .from('workspace_consultants')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
  if (wcErr) throw wcErr

  const { error: delErr } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)
    .eq('workspace_id', workspaceId)
  if (delErr) throw delErr

  invalidateCache([`workspace-users:${workspaceId}`, `workspace:${workspaceId}`])

  void insertAuditEvent({
    workspace_id: workspaceId,
    action: 'workspace_member_removed',
    payload: { email: normalized, user_id: userId },
  })
}

export type RemoveMemberAuthCleanupResult =
  | { ok: true; auth_deleted?: boolean; skipped?: string }
  | { ok?: false; error?: string }

/**
 * Appelle l’Edge Function qui supprime le compte Auth si l’email n’a plus de profil ni d’invitation active.
 * Ne bloque pas le retrait membre en cas d’échec réseau : à utiliser après succès de {@link removeWorkspaceMember}.
 */
export async function invokeRemoveMemberAuthCleanup(params: {
  workspaceId: string
  email: string
}): Promise<RemoveMemberAuthCleanupResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) {
    return { ok: false, error: 'Session expirée ou absente.' }
  }

  const base = VITE_CONFIG_SUPABASE_URL?.replace(/\/$/, '') ?? ''
  const anon = VITE_CONFIG_SUPABASE_ANON_KEY
  if (!base || !anon) {
    return { ok: false, error: 'Configuration Supabase manquante (URL ou clé).' }
  }

  const res = await fetch(`${base}/functions/v1/remove-member-auth-cleanup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      workspace_id: params.workspaceId,
      email: params.email.trim().toLowerCase(),
    }),
  })

  let payload: unknown
  try {
    payload = await res.json()
  } catch {
    return { ok: false, error: `Nettoyage Auth indisponible (réponse ${res.status}).` }
  }

  if (!res.ok) {
    const err = payload as { message?: string; error?: string }
    const msg = err?.message || err?.error || `Nettoyage Auth indisponible (${res.status})`
    return { ok: false, error: msg }
  }

  return payload as RemoveMemberAuthCleanupResult
}
