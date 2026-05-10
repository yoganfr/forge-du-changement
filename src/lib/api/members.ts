import { supabase } from '../supabase'
import { insertAuditEvent } from './audit'
import { invalidateCache } from './cache'
import { setWorkspaceDirigeant } from './discoursTransformation'
import { deleteInvitationsForWorkspaceEmail } from './invitations'

/**
 * Retire un membre de l’espace : invitations puis rattachement consultant éventuel, puis ligne `users`.
 * Ne supprime pas le compte Supabase Auth (traitement séparé si besoin).
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
