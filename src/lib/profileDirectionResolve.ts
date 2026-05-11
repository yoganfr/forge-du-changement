import { createDirection, getWorkspaceDirections } from './api'
import { directionDisplayNamesMatch } from './directionLabels'

/** Aligné sur les pastilles du profil (`ProfileSheet`). */
export type ProfileDirectionType = 'fonctionnel' | 'metier' | 'geographique'

export type ResolveMemberDirectionOptions = {
  /**
   * `public.users.id` pour `directions.user_id` (FK). Ne pas utiliser `auth.uid()` si la ligne
   * `users` n’a pas le même id. Si absent / null : INSERT sans `user_id` (NULL) — ex. wizard
   * avant `createUser`, ou profil sans `lfdc-user-id` encore aligné.
   */
  directionOwnerDbUserId?: string | null
}

const DEFAULT_NEW_DIRECTION_COLOR = '#8E3B46'

function mapDirectionType(t: ProfileDirectionType): 'Fonctionnel' | 'Métier' | 'Géographique' {
  return t === 'metier' ? 'Métier' : t === 'geographique' ? 'Géographique' : 'Fonctionnel'
}

/**
 * Rattache le membre à une ligne `directions` existante (hors transverse, matching tolérant)
 * ou crée une direction métier si le libellé ne correspond à aucune entrée.
 */
export async function resolveOrCreateMemberDirection(
  workspaceId: string,
  directionName: string,
  directionType: ProfileDirectionType,
  options?: ResolveMemberDirectionOptions,
): Promise<string | null> {
  const trimmed = directionName.trim()
  if (!trimmed) return null
  const dirs = await getWorkspaceDirections(workspaceId)
  const nonTransverse = dirs.filter((d) => !d.is_transverse)
  const match = nonTransverse.find((d) => directionDisplayNamesMatch(trimmed, d.nom ?? ''))
  if (match) return match.id
  const ownerRaw = options?.directionOwnerDbUserId?.trim()
  const ownerId = ownerRaw || null
  const insertPayload: Parameters<typeof createDirection>[0] = {
    workspace_id: workspaceId,
    nom: trimmed,
    type: mapDirectionType(directionType),
    mission: null,
    vision: null,
    color: DEFAULT_NEW_DIRECTION_COLOR,
    is_transverse: false,
  }
  if (ownerId) {
    insertPayload.user_id = ownerId
  }
  const created = await createDirection(insertPayload)
  return created.id
}
