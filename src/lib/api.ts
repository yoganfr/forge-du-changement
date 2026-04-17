import { supabase } from './supabase'
import type { Workspace, User, Direction, Projet, Invitation } from './types'

// -- WORKSPACES --
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
  return workspace as Workspace
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Workspace
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
  return workspace as Workspace
}

// -- USERS --
export async function createUser(data: Partial<User>): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return user as User
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return user as User
}

export async function getWorkspaceUsers(workspaceId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('workspace_id', workspaceId)
  if (error) throw error
  return (data ?? []) as User[]
}

// -- DIRECTIONS --
export async function createDirection(data: Partial<Direction>): Promise<Direction> {
  const { data: direction, error } = await supabase
    .from('directions')
    .insert(data)
    .select()
    .single()
  if (error) throw error
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

// -- PROJETS --
export async function createProjet(data: Partial<Projet>): Promise<Projet> {
  const { data: projet, error } = await supabase
    .from('projets')
    .insert(data)
    .select()
    .single()
  if (error) throw error
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

export async function deleteProjet(id: string): Promise<void> {
  const { error } = await supabase
    .from('projets')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// -- INVITATIONS --
export async function createInvitation(data: Partial<Invitation>): Promise<Invitation> {
  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return invitation as Invitation
}

export async function getWorkspaceInvitations(workspaceId: string): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('workspace_id', workspaceId)
  if (error) throw error
  return (data ?? []) as Invitation[]
}
