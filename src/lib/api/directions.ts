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
  if (error) throw error
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

/** Projets BUILD validés DG — éligibles à la Maturity Roadmap (dédoublonnés, tri par nom). */
export async function getRoadmapEligibleProjects(workspaceId: string): Promise<Projet[]> {
  const rows = await getWorkspaceDirectionsWithProjects(workspaceId)
  const seen = new Set<string>()
  const out: Projet[] = []
  for (const row of rows) {
    for (const p of row.projects) {
      if (p.type !== 'BUILD' || !p.dg_validated_transfo) continue
      if (seen.has(p.id)) continue
      seen.add(p.id)
      out.push(p)
    }
  }
  return out.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

/** Projets BUILD validés DG — pour une direction donnée (périmètre CODIR / roadmap). */
export async function getRoadmapEligibleProjectsForDirection(directionId: string): Promise<Projet[]> {
  const list = await getDirectionProjets(directionId)
  return list
    .filter((p) => p.type === 'BUILD' && p.dg_validated_transfo)
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}
