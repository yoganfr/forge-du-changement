import { createDirection, getWorkspaceDirections } from './api'
import { getCurrentUser } from './auth'
import { directionDisplayNamesMatch } from './directionLabels'

/** Aligné sur les pastilles du profil (`ProfileSheet`). */
export type ProfileDirectionType = 'fonctionnel' | 'metier' | 'geographique'

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
): Promise<string | null> {
  const trimmed = directionName.trim()
  if (!trimmed) return null
  const dirs = await getWorkspaceDirections(workspaceId)
  const nonTransverse = dirs.filter((d) => !d.is_transverse)
  const match = nonTransverse.find((d) => directionDisplayNamesMatch(trimmed, d.nom ?? ''))
  if (match) return match.id
  const appUser = await getCurrentUser()
  const created = await createDirection({
    workspace_id: workspaceId,
    user_id: appUser?.id ?? null,
    nom: trimmed,
    type: mapDirectionType(directionType),
    mission: null,
    vision: null,
    color: DEFAULT_NEW_DIRECTION_COLOR,
    is_transverse: false,
  })
  return created.id
}
