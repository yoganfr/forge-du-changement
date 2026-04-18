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
      .select('id, company_name, sector, size, logo_url, created_at')
      .order('company_name', { ascending: true })
    if (error) throw error
    return (data ?? []) as Workspace[]
  })
}

export async function updateWorkspace(
  id: string,
  data: Partial<Pick<Workspace, 'company_name' | 'sector' | 'size' | 'logo_url'>>,
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
