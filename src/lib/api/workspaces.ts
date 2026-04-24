import { supabase } from '../supabase'
import type { Workspace } from '../types'
import { dedupedFetch, invalidateCache } from './cache'
import { insertAuditEvent } from './audit'

export async function createWorkspace(data: {
  company_name: string
  sector: string
  size: string
  logo_url?: string | null
}): Promise<Workspace> {
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  const w = workspace as Workspace
  invalidateCache(['workspaces:list'])
  void insertAuditEvent({
    workspace_id: w.id,
    action: 'workspace_created',
    payload: { company_name: w.company_name },
  })
  return w
}

export async function getWorkspace(id: string): Promise<Workspace> {
  return dedupedFetch(`workspace:${id}`, async () => {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Workspace
  })
}

/** Liste des espaces entreprise (consultant / admin). Exposer uniquement ce que la RLS autorise pour ce JWT. */
export async function listWorkspaces(): Promise<Workspace[]> {
  return dedupedFetch('workspaces:list', async () => {
    const { data, error } = await supabase
      .from('workspaces')
      .select('id, company_name, sector, size, logo_url, trigram_convention, created_at')
      .order('company_name', { ascending: true })
    if (error) throw error
    return (data ?? []) as Workspace[]
  })
}

export async function updateWorkspace(
  id: string,
  data: Partial<Pick<Workspace, 'company_name' | 'sector' | 'size' | 'logo_url' | 'trigram_convention'>>,
): Promise<Workspace> {
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  invalidateCache(['workspaces:list', `workspace:${id}`])
  void insertAuditEvent({
    workspace_id: id,
    action: 'workspace_updated',
    payload: { fields: Object.keys(data) },
  })
  return workspace as Workspace
}

/**
 * Met à jour la phase en cours du parcours CODIR et/ou Contributeur.
 *
 * - Borne serveur : check constraints Postgres (0..6 pour CODIR, 0..3 pour Contributeur).
 * - Autorisation : policy RLS `workspaces_update` (superadmin + consultant owner + admin client).
 * - Passer `null` remet le parcours à l'état « non démarré » (tous modules verrouillés).
 */
/** Niveau de rattachement consultant ↔ workspace (table `workspace_consultants`). */
export type WorkspaceConsultantLevel = 'owner' | 'collaborator'

/**
 * Ligne active `workspace_consultants` pour ce couple workspace / utilisateur.
 * Retourne `null` si pas de ligne ou erreur (à traiter comme « pas owner » côté UI).
 */
export async function getWorkspaceConsultantMembership(
  workspaceId: string,
  userId: string,
): Promise<{ level: WorkspaceConsultantLevel } | null> {
  const { data, error } = await supabase
    .from('workspace_consultants')
    .select('level')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error || !data?.level) return null
  const level = data.level as string
  if (level !== 'owner' && level !== 'collaborator') return null
  return { level: level as WorkspaceConsultantLevel }
}

export async function updateWorkspaceCurrentStep(
  id: string,
  patch: { codir?: number | null; contributeur?: number | null },
): Promise<Workspace> {
  const payload: Record<string, number | null> = {}
  if (Object.prototype.hasOwnProperty.call(patch, 'codir')) {
    payload.current_step_codir = patch.codir ?? null
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'contributeur')) {
    payload.current_step_contributeur = patch.contributeur ?? null
  }
  if (Object.keys(payload).length === 0) {
    return getWorkspace(id)
  }
  const { data, error } = await supabase
    .from('workspaces')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  invalidateCache(['workspaces:list', `workspace:${id}`])
  void insertAuditEvent({
    workspace_id: id,
    action: 'workspace_current_step_updated',
    payload,
  })
  return data as Workspace
}
