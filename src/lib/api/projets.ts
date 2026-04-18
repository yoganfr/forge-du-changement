import { supabase } from '../supabase'
import type { Projet } from '../types'
import { invalidateCache } from './cache'

export async function createProjet(data: Partial<Projet>): Promise<Projet> {
  const { data: projet, error } = await supabase
    .from('projets')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  if (projet?.workspace_id) invalidateCache([`workspace-directions-projects:${projet.workspace_id}`])
  return projet as Projet
}

export async function updateProjet(id: string, data: Partial<Projet>): Promise<Projet> {
  const { data: projet, error } = await supabase
    .from('projets')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  if (projet?.workspace_id) invalidateCache([`workspace-directions-projects:${projet.workspace_id}`])
  return projet as Projet
}

export async function getDirectionProjets(directionId: string): Promise<Projet[]> {
  const { data, error } = await supabase
    .from('projets')
    .select('*')
    .eq('direction_id', directionId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Projet[]
}

/** Tous les projets d’un workspace (pour batch directions → projets). */
export async function getProjetsForWorkspace(workspaceId: string): Promise<Projet[]> {
  const { data, error } = await supabase
    .from('projets')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Projet[]
}

export async function deleteProjet(id: string): Promise<void> {
  const { data: row } = await supabase.from('projets').select('workspace_id').eq('id', id).maybeSingle()
  const { error } = await supabase.from('projets').delete().eq('id', id)
  if (error) throw error
  const wid = (row as { workspace_id?: string } | null)?.workspace_id
  if (wid) invalidateCache([`workspace-directions-projects:${wid}`])
}

export async function getProjet(id: string): Promise<Projet> {
  const { data, error } = await supabase.from('projets').select('*').eq('id', id).single()
  if (error) throw error
  return data as Projet
}
