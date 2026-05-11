/**
 * Couche unique : sélection d’espace en navigateur vs rattachement `public.users`.
 * Évite de disperser localStorage / reconcile dans tout App.tsx.
 */
import {
  getLatestAcceptedInvitationForEmail,
  updateUser,
} from './api'
import type { User } from './types'
import { clearWorkspaceSnapshot } from './workspaceSnapshot'

/** À appeler à la déconnexion Auth (et au bouton Déconnexion) : supprime un workspaceId résiduel d’un autre espace. */
export function clearStoredWorkspaceSelection(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem('workspaceId')
  } catch {
    /* quota */
  }
  clearWorkspaceSnapshot()
}

/**
 * Si la ligne `users` diverge de la dernière invitation acceptée (même email), réaligne en base.
 * Les consultants ne sont pas modifiés (multi-espaces volontaire).
 */
export async function alignUserWorkspaceToLatestAcceptedInvitation(
  row: User,
  emailNormalized: string,
): Promise<User> {
  if (row.role === 'consultant') return row
  try {
    const latest = await getLatestAcceptedInvitationForEmail(emailNormalized)
    if (!latest?.workspace_id || latest.workspace_id === row.workspace_id) {
      return row
    }
    return await updateUser(
      row.id,
      { workspace_id: latest.workspace_id },
      { workspace_id: row.workspace_id },
    )
  } catch {
    return row
  }
}
