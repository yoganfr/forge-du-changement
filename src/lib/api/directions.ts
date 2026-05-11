import { supabase } from '../supabase'
import type { Direction, Projet } from '../types'
import { dedupedFetch, invalidateCache } from './cache'
import { getDirectionProjets, getProjetsForWorkspace } from './projets'

export async function createDirection(data: Partial<Direction>): Promise<Direction> {
  const { data: direction, error } = await supabase
    .from('directions')
    .insert(data)
    .select()
    .single()
  if (error) {
    // #region agent log
    fetch('http://127.0.0.1:7271/ingest/4a825d9f-9e80-4d72-a03f-6e97efcd6511', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f7b5d7' },
      body: JSON.stringify({
        sessionId: 'f7b5d7',
        location: 'directions.ts:createDirection',
        message: 'directions insert error',
        data: {
          code: (error as { code?: string }).code,
          msg: (error as { message?: string }).message,
        },
        timestamp: Date.now(),
        hypothesisId: 'H-RLS',
      }),
    }).catch(() => {})
    // #endregion
    throw error
  }
  if (direction?.workspace_id) invalidateCache([`workspace-directions-projects:${direction.workspace_id}`])
  return direction as Direction
}

export async function updateDirection(id: string, data: Partial<Direction>): Promise<Direction> {
  const { data: direction, error } = await supabase
    .from('directions')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  if (direction?.workspace_id) invalidateCache([`workspace-directions-projects:${direction.workspace_id}`])
  return direction as Direction
}

export async function getWorkspaceDirections(workspaceId: string): Promise<Direction[]> {
  const { data, error } = await supabase
    .from('directions')
    .select('*')
    .eq('workspace_id', workspaceId)
  if (error) throw error
  return (data ?? []) as Direction[]
}

export async function getWorkspaceDirectionsWithProjects(workspaceId: string): Promise<
  Array<{
    direction: Direction
    projects: Projet[]
  }>
> {
  return dedupedFetch(`workspace-directions-projects:${workspaceId}`, async () => {
    const directions = await getWorkspaceDirections(workspaceId)
    if (directions.length === 0) return []
    const allProjets = await getProjetsForWorkspace(workspaceId)
    const byDirectionId = new Map<string, Projet[]>()
    for (const d of directions) {
      byDirectionId.set(d.id, [])
    }
    for (const p of allProjets) {
      const bucket = byDirectionId.get(p.direction_id)
      if (bucket) bucket.push(p)
    }
    return directions.map((direction) => ({
      direction,
      projects: byDirectionId.get(direction.id) ?? [],
    }))
  })
}

/** BUILD retenu pour le décideur et validé — seul cas éligible à la Maturity Roadmap (chantiers / jalons). */
function isRoadmapEligibleProjet(p: Projet): boolean {
  return p.type === 'BUILD' && p.selected_for_transfo && p.dg_validated_transfo
}

/** Projets BUILD retenus + validés DG — éligibles roadmap, tout périmètre workspace (dédoublonnés). */
export async function getRoadmapEligibleProjects(workspaceId: string): Promise<Projet[]> {
  const rows = await getWorkspaceDirectionsWithProjects(workspaceId)
  const seen = new Set<string>()
  const out: Projet[] = []
  for (const row of rows) {
    for (const p of row.projects) {
      if (!isRoadmapEligibleProjet(p)) continue
      if (seen.has(p.id)) continue
      seen.add(p.id)
      out.push(p)
    }
  }
  return out.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

/** Projets BUILD retenus + validés DG — pour une direction donnée. */
export async function getRoadmapEligibleProjectsForDirection(directionId: string): Promise<Projet[]> {
  const list = await getDirectionProjets(directionId)
  return list
    .filter(isRoadmapEligibleProjet)
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

/**
 * Membre CODIR / contributeur / pilote : projets rattachés à `users.direction_id` uniquement.
 * Les projets « transverses » (co-pilotes) restent sur cette même `direction_id` ; la distinction est UI (directions_contributrices).
 */
export async function getRoadmapEligibleProjectsForRestrictedMember(
  _workspaceId: string,
  memberDirectionId: string | null,
): Promise<Projet[]> {
  if (!memberDirectionId) return []
  const list = await getDirectionProjets(memberDirectionId)
  return list.filter(isRoadmapEligibleProjet).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}
