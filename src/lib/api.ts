import { supabase } from './supabase'
import type { Workspace, User, Direction, Projet, Invitation } from './types'

const STORAGE_BUCKET = 'assets'
const CACHE_TTL_MS = 30_000
type ListOptions = { limit?: number; offset?: number }

type CacheEntry<T> = { value: T; expiresAt: number }
const responseCache = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

function readCache<T>(key: string): T | null {
  const now = Date.now()
  const entry = responseCache.get(key)
  if (!entry) return null
  if (entry.expiresAt <= now) {
    responseCache.delete(key)
    return null
  }
  return entry.value as T
}

function writeCache<T>(key: string, value: T, ttlMs = CACHE_TTL_MS): T {
  responseCache.set(key, { value, expiresAt: Date.now() + ttlMs })
  return value
}

function invalidateCache(prefixes: string[]): void {
  if (prefixes.length === 0) return
  for (const key of responseCache.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      responseCache.delete(key)
    }
  }
}

async function dedupedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = readCache<T>(key)
  if (cached !== null) return cached
  const existing = inflight.get(key) as Promise<T> | undefined
  if (existing) return existing
  const request = (async () => {
    try {
      const result = await fetcher()
      return writeCache(key, result)
    } finally {
      inflight.delete(key)
    }
  })()
  inflight.set(key, request)
  return request
}

async function resolveAuditActorUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const email = session?.user?.email?.trim().toLowerCase()
  if (!email) return null
  const { data } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
  return data?.id ?? null
}

/** Écrit une ligne dans `audit_events` (best-effort : échecs silencieux en prod, log en dev). */
export async function insertAuditEvent(params: {
  workspace_id: string | null
  action: string
  payload?: Record<string, unknown>
}): Promise<void> {
  const actor_user_id = await resolveAuditActorUserId()
  const { error } = await supabase.from('audit_events').insert({
    workspace_id: params.workspace_id,
    actor_user_id,
    action: params.action,
    payload: params.payload ?? null,
  })
  if (error && import.meta.env.DEV) {
    console.warn('[audit_events]', params.action, error.message)
  }
}

/**
 * Upload vers le bucket Storage `assets` + URL publique.
 * Les URLs retournées sont lisibles par quiconque connaît le lien (bucket typiquement public en lecture).
 * Pour des pièces sensibles : bucket privé + `createSignedUrl` + voir `docs/supabase-storage-assets-hardening.sql`.
 */
export function isStorageBucketNotFound(error: unknown): boolean {
  const msg = typeof error === 'object' && error && 'message' in error
    ? String((error as { message?: unknown }).message ?? '').toLowerCase()
    : ''
  return msg.includes('bucket') && msg.includes('not found')
}

export async function uploadImageToStorage(params: {
  file: File
  folder: string
  filenamePrefix?: string
}): Promise<string> {
  const ext = params.file.name.split('.').pop()?.toLowerCase() || 'bin'
  const safeFolder = params.folder.replace(/^\/+|\/+$/g, '')
  const safePrefix = (params.filenamePrefix ?? 'file').replace(/[^a-zA-Z0-9_-]/g, '-')
  const path = `${safeFolder}/${safePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, params.file, { upsert: false, contentType: params.file.type })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

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

/** Liste des espaces entreprise (consultant / admin). Nécessite une policy RLS SELECT adaptée. */
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

// -- USERS --
export async function createUser(data: Partial<User>): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  const u = user as User
  if (u.workspace_id) invalidateCache([`workspace-users:${u.workspace_id}`])
  if (u.workspace_id) {
    void insertAuditEvent({
      workspace_id: u.workspace_id,
      action: 'user_created',
      payload: { email: u.email, role: u.role },
    })
  }
  return u
}

/**
 * Mise à jour d’un `users` par id. Si `scope.workspace_id` est fourni, l’update ne matche que si la ligne
 * appartient à ce workspace (défense en profondeur ; la RLS reste la barrière principale).
 */
export async function updateUser(
  id: string,
  data: Partial<User>,
  scope?: { workspace_id: string },
): Promise<User> {
  let q = supabase.from('users').update(data).eq('id', id)
  if (scope?.workspace_id) {
    q = q.eq('workspace_id', scope.workspace_id)
  }
  const { data: user, error } = await q.select().single()
  if (error) throw error
  if (scope?.workspace_id) invalidateCache([`workspace-users:${scope.workspace_id}`])
  return user as User
}

export async function getWorkspaceUsers(workspaceId: string, options?: ListOptions): Promise<User[]> {
  const offset = options?.offset ?? 0
  const limit = options?.limit
  const cacheKey = `workspace-users:${workspaceId}:${offset}:${limit ?? 'all'}`
  return dedupedFetch(cacheKey, async () => {
    let query = supabase.from('users').select('*').eq('workspace_id', workspaceId)
    if (typeof limit === 'number' && limit > 0) {
      query = query.range(offset, offset + limit - 1)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as User[]
  })
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
  const inv = invitation as Invitation
  if (inv.workspace_id) invalidateCache([`workspace-invitations:${inv.workspace_id}`])
  void insertAuditEvent({
    workspace_id: inv.workspace_id,
    action: 'invitation_created',
    payload: { email: inv.email, role: inv.role },
  })
  return inv
}

export async function getWorkspaceInvitations(
  workspaceId: string,
  options?: ListOptions,
): Promise<Invitation[]> {
  const offset = options?.offset ?? 0
  const limit = options?.limit
  const cacheKey = `workspace-invitations:${workspaceId}:${offset}:${limit ?? 'all'}`
  return dedupedFetch(cacheKey, async () => {
    let query = supabase.from('invitations').select('*').eq('workspace_id', workspaceId)
    if (typeof limit === 'number' && limit > 0) {
      query = query.range(offset, offset + limit - 1)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as Invitation[]
  })
}

/** Dernière invitation en attente pour cet email (connexion magic link avant ligne `users`). */
export async function getLatestPendingInvitationForEmail(email: string): Promise<Invitation | null> {
  const normalized = email.trim().toLowerCase()
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('email', normalized)
    .eq('status', 'en_attente')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data as Invitation | null
}

/** Invitation déjà acceptée côté Auth / base, mais pas encore de ligne `public.users` (profil à créer). */
export async function getAcceptedInvitationAwaitingUserRow(email: string): Promise<Invitation | null> {
  const normalized = email.trim().toLowerCase()
  const { data: existingUser } = await supabase.from('users').select('id').eq('email', normalized).maybeSingle()
  if (existingUser) return null
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('email', normalized)
    .eq('status', 'acceptee')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data as Invitation | null
}

/** Passe les invitations `en_attente` à `acceptee` pour cet email dans cet espace (après confirmation email ou profil). */
export async function markInvitationsAcceptedForWorkspaceEmail(
  workspaceId: string,
  email: string,
): Promise<void> {
  const normalized = email.trim().toLowerCase()
  const { error } = await supabase
    .from('invitations')
    .update({ status: 'acceptee' })
    .eq('workspace_id', workspaceId)
    .eq('email', normalized)
    .eq('status', 'en_attente')
  if (error) throw error
  invalidateCache([`workspace-invitations:${workspaceId}`])
  void insertAuditEvent({
    workspace_id: workspaceId,
    action: 'invitations_marked_accepted',
    payload: { email: normalized },
  })
}
