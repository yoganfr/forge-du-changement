/**
 * Couche unique : sélection d’espace en navigateur vs rattachement `public.users`.
 * Évite de disperser localStorage / reconcile dans tout App.tsx.
 */
import {
  getLatestAcceptedInvitationForEmail,
  updateUser,
} from './api'
import { formatClientErrorMessage } from './formatClientErrorMessage'
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
  // La RLS n’accepte un changement de workspace_id que pour un admin ou un superadmin.
  // Les autres rôles restaient déjà sur leur ligne : on n’envoie plus une écriture vouée à l’échec.
  const canMoveWorkspace = row.role === 'admin' || row.is_platform_superadmin === true
  if (!canMoveWorkspace) return row
  try {
    const latest = await getLatestAcceptedInvitationForEmail(emailNormalized)
    if (!latest?.workspace_id || latest.workspace_id === row.workspace_id) {
      return row
    }
    return await updateUser(
      row.id,
      { workspace_id: latest.workspace_id },
      { workspace_id: row.workspace_id },
      { allowWorkspaceId: true },
    )
  } catch (err) {
    // Le login ne doit pas échouer si le realignement est refusé : on garde la ligne actuelle.
    console.warn('[session-workspace]', formatClientErrorMessage(err))
    return row
  }
}
