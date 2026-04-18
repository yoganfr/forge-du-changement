import { supabase } from './supabase'
import type {
  Workspace,
  User,
  Direction,
  Projet,
  Invitation,
  Chantier,
  Jalon,
  Axe,
  RaciJalon,
  RaciRole,
} from './types'

const STORAGE_BUCKET = 'assets'
const CACHE_TTL_MS = 30_000
type ListOptions = { limit?: number; offset?: number }

type CacheEntry<T> = { value: T; expiresAt: number }
const responseCache = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()
/** Incrémenté à chaque invalidation pour ignorer les réponses obsolètes (inflight / écriture tardive). */
const fetchGeneration = new Map<string, number>()

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
  const keysToBump = new Set<string>()
  for (const key of responseCache.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) keysToBump.add(key)
  }
  for (const key of inflight.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) keysToBump.add(key)
  }
  for (const key of keysToBump) {
    responseCache.delete(key)
    inflight.delete(key)
    fetchGeneration.set(key, (fetchGeneration.get(key) ?? 0) + 1)
  }
}

async function dedupedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = readCache<T>(key)
  if (cached !== null) return cached
  const existing = inflight.get(key) as Promise<T> | undefined
  if (existing) return existing
  const genAtStart = fetchGeneration.get(key) ?? 0
  const handle: { p: Promise<T> | null } = { p: null }
  handle.p = (async () => {
    try {
      const result = await fetcher()
      if ((fetchGeneration.get(key) ?? 0) !== genAtStart) {
        return result
      }
      return writeCache(key, result)
    } finally {
      const current = inflight.get(key)
      if (current === handle.p) {
        inflight.delete(key)
      }
    }
  })()
  inflight.set(key, handle.p)
  return handle.p
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

export async function getWorkspaceDirectionsWithProjects(workspaceId: string): Promise<Array<{
  direction: Direction
  projects: Projet[]
}>> {
  return dedupedFetch(`workspace-directions-projects:${workspaceId}`, async () => {
    const directions = await getWorkspaceDirections(workspaceId)
    const rows = await Promise.all(
      directions.map(async (direction) => {
        const projects = await getDirectionProjets(direction.id)
        return { direction, projects }
      }),
    )
    return rows
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

// -- PROJETS --
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

export async function deleteProjet(id: string): Promise<void> {
  const { error } = await supabase
    .from('projets')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getProjet(id: string): Promise<Projet> {
  const { data, error } = await supabase.from('projets').select('*').eq('id', id).single()
  if (error) throw error
  return data as Projet
}

const AXE_ORDER: Axe[] = ['PROCESSUS', 'ORGANISATION', 'OUTILS', 'KPI']

const AXE_PREFIX: Record<Axe, number> = {
  PROCESSUS: 1,
  ORGANISATION: 2,
  OUTILS: 3,
  KPI: 4,
}

/** Aligné sur la contrainte PostgreSQL `jalons_axe_check` (valeurs strictes en majuscules). */
const ALLOWED_AXES: readonly Axe[] = ['PROCESSUS', 'ORGANISATION', 'OUTILS', 'KPI']

/** Synonymes / anciennes variantes → axe canonique (même logique que le script SQL de réparation). */
const AXE_SYNONYMS: Record<string, Axe> = {
  PROCESSUS: 'PROCESSUS',
  ORGANISATION: 'ORGANISATION',
  OUTILS: 'OUTILS',
  OUTIL: 'OUTILS',
  KPI: 'KPI',
  KPIS: 'KPI',
  P: 'PROCESSUS',
  O: 'ORGANISATION',
  I: 'OUTILS',
  K: 'KPI',
  '1': 'PROCESSUS',
  '2': 'ORGANISATION',
  '3': 'OUTILS',
  '4': 'KPI',
}

export function normalizeAxeForDb(input: unknown): Axe {
  let raw = String(input ?? '').trim()
  raw = raw.replace(/[\u200B-\u200D\uFEFF]/g, '')
  const upper = raw.toUpperCase()
  const fromMap = AXE_SYNONYMS[upper]
  if (fromMap) return fromMap
  const deaccent = upper
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
  if (AXE_SYNONYMS[deaccent]) return AXE_SYNONYMS[deaccent]
  if (ALLOWED_AXES.includes(upper as Axe)) return upper as Axe
  if (ALLOWED_AXES.includes(deaccent as Axe)) return deaccent as Axe
  throw new Error(
    `Axe invalide: "${raw}". Valeurs autorisées: ${ALLOWED_AXES.join(', ')}. Si la base a une ancienne contrainte, exécutez docs/supabase-jalons-fix-axe-check.sql dans Supabase.`,
  )
}

function invalidateRoadmapCaches(params: {
  projet_id?: string
  chantier_id?: string
  jalon_id?: string
}): void {
  const p: string[] = []
  if (params.projet_id) p.push(`roadmap-chantiers:${params.projet_id}`)
  if (params.chantier_id) p.push(`roadmap-jalons:${params.chantier_id}`)
  if (params.jalon_id) p.push(`roadmap-raci:${params.jalon_id}`)
  invalidateCache(p)
}

// -- CHANTIERS (Maturity Roadmap) --
export async function createChantier(data: Partial<Chantier>): Promise<Chantier> {
  const { data: row, error } = await supabase
    .from('chantiers')
    .insert({
      projet_id: data.projet_id,
      workspace_id: data.workspace_id,
      nom: data.nom ?? 'Nouveau chantier',
      description: data.description ?? null,
      ordre: data.ordre ?? 1,
    })
    .select()
    .single()
  if (error) throw error
  const c = row as Chantier
  invalidateRoadmapCaches({ projet_id: c.projet_id })
  return c
}

export async function updateChantier(id: string, data: Partial<Chantier>): Promise<Chantier> {
  const { data: row, error } = await supabase
    .from('chantiers')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  const c = row as Chantier
  invalidateRoadmapCaches({ projet_id: c.projet_id })
  return c
}

/**
 * Met à jour le chantier ; si `projet_id` change, aligne aussi les jalons du chantier sur le nouveau projet.
 * Invalide les caches chantiers des deux projets (ancien / nouveau).
 */
export async function updateChantierAndReparentProject(
  chantierId: string,
  data: { nom?: string; projet_id?: string },
): Promise<Chantier> {
  const { data: before, error: e0 } = await supabase
    .from('chantiers')
    .select('projet_id')
    .eq('id', chantierId)
    .single()
  if (e0) throw e0
  const oldPid = (before as { projet_id: string }).projet_id

  const row = await updateChantier(chantierId, data)
  const c = row as Chantier

  if (data.projet_id !== undefined && data.projet_id !== oldPid) {
    const { error } = await supabase
      .from('jalons')
      .update({ projet_id: data.projet_id })
      .eq('chantier_id', chantierId)
    if (error) throw error
    invalidateRoadmapCaches({ projet_id: oldPid })
    invalidateRoadmapCaches({ projet_id: data.projet_id })
  }
  return c
}

export async function deleteChantier(id: string): Promise<void> {
  const { data: before } = await supabase.from('chantiers').select('projet_id').eq('id', id).maybeSingle()
  const { error } = await supabase.from('chantiers').delete().eq('id', id)
  if (error) throw error
  if (before) {
    invalidateRoadmapCaches({
      projet_id: (before as { projet_id: string }).projet_id,
    })
  }
}

export async function getProjetChantiers(projet_id: string): Promise<Chantier[]> {
  return dedupedFetch(`roadmap-chantiers:${projet_id}`, async () => {
    const { data, error } = await supabase
      .from('chantiers')
      .select('*')
      .eq('projet_id', projet_id)
      .order('ordre', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as Chantier[]
  })
}

// -- JALONS --
export function monthToQuarter(mois: number): string {
  if (mois >= 1 && mois <= 3) return 'Q1'
  if (mois >= 4 && mois <= 6) return 'Q2'
  if (mois >= 7 && mois <= 9) return 'Q3'
  return 'Q4'
}

export async function getNextJalonNumero(chantier_id: string, axe: Axe): Promise<string> {
  const { count, error } = await supabase
    .from('jalons')
    .select('*', { count: 'exact', head: true })
    .eq('chantier_id', chantier_id)
    .eq('axe', axe)
  if (error) throw error
  const n = (count ?? 0) + 1
  return `${AXE_PREFIX[axe]}.${n}`
}

/** Tous les jalons d'un projet (dépendances, vue globale). */
export async function getProjetJalons(projet_id: string): Promise<Jalon[]> {
  const { data, error } = await supabase.from('jalons').select('*').eq('projet_id', projet_id)
  if (error) throw error
  const list = (data ?? []) as Jalon[]
  const rank = (a: Axe) => AXE_ORDER.indexOf(a)
  return list.sort((a, b) => {
    const ra = rank(a.axe)
    const rb = rank(b.axe)
    if (ra !== rb) return ra - rb
    return (a.ordre_sequentiel ?? 0) - (b.ordre_sequentiel ?? 0)
  })
}

export async function getChantierJalons(chantier_id: string): Promise<Jalon[]> {
  return dedupedFetch(`roadmap-jalons:${chantier_id}`, async () => {
    const { data, error } = await supabase.from('jalons').select('*').eq('chantier_id', chantier_id)
    if (error) throw error
    const list = (data ?? []) as Jalon[]
    const rank = (a: Axe) => AXE_ORDER.indexOf(a)
    return list.sort((a, b) => {
      const ra = rank(a.axe)
      const rb = rank(b.axe)
      if (ra !== rb) return ra - rb
      return (a.ordre_sequentiel ?? 0) - (b.ordre_sequentiel ?? 0)
    })
  })
}

export async function createJalon(data: Partial<Jalon>): Promise<Jalon> {
  if (!data.chantier_id || data.axe === undefined || data.axe === null || String(data.axe).trim() === '') {
    throw new Error('createJalon: chantier_id et axe sont requis')
  }
  const { data: ch, error: eCh } = await supabase
    .from('chantiers')
    .select('projet_id, workspace_id')
    .eq('id', data.chantier_id)
    .single()
  if (eCh) throw eCh
  const chantier = ch as { projet_id: string; workspace_id: string }
  const axe = normalizeAxeForDb(data.axe)
  const numero = data.numero ?? (await getNextJalonNumero(data.chantier_id, axe))
  const seq = Number.parseInt(numero.split('.')[1] ?? '1', 10) || 1
  const insert = {
    chantier_id: data.chantier_id,
    projet_id: data.projet_id ?? chantier.projet_id,
    workspace_id: data.workspace_id ?? chantier.workspace_id,
    direction_id: data.direction_id ?? null,
    axe,
    numero,
    nom: data.nom?.trim() ? data.nom : 'Nouveau jalon',
    description: data.description ?? null,
    mois_cible: data.mois_cible ?? null,
    annee_cible: data.annee_cible ?? null,
    ordre_sequentiel: data.ordre_sequentiel ?? seq,
    statut: data.statut ?? 'a_venir',
    responsable: data.responsable ?? null,
    decideur: data.decideur ?? null,
    kpi_description: data.kpi_description ?? null,
    kpi_valeur_cible: data.kpi_valeur_cible ?? null,
    facette: data.facette ?? null,
    jalon_dependance_id: data.jalon_dependance_id ?? null,
    note_contexte: data.note_contexte ?? null,
  }
  const { data: row, error } = await supabase.from('jalons').insert(insert).select().single()
  if (error) throw error
  const j = row as Jalon
  invalidateRoadmapCaches({
    chantier_id: j.chantier_id,
    projet_id: j.projet_id,
  })
  return j
}

export async function updateJalon(id: string, data: Partial<Jalon>): Promise<Jalon> {
  const payload = { ...data, updated_at: new Date().toISOString() }
  if (data.axe !== undefined && data.axe !== null) {
    ;(payload as Partial<Jalon>).axe = normalizeAxeForDb(data.axe)
  }
  const { data: row, error } = await supabase
    .from('jalons')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  const j = row as Jalon
  invalidateRoadmapCaches({
    chantier_id: j.chantier_id,
    projet_id: j.projet_id,
    jalon_id: j.id,
  })
  return j
}

export async function deleteJalon(id: string): Promise<void> {
  const { data: before } = await supabase
    .from('jalons')
    .select('chantier_id, projet_id, workspace_id')
    .eq('id', id)
    .maybeSingle()
  const { error } = await supabase.from('jalons').delete().eq('id', id)
  if (error) throw error
  if (before) {
    const b = before as { chantier_id: string; projet_id: string; workspace_id: string }
    invalidateRoadmapCaches({ chantier_id: b.chantier_id, projet_id: b.projet_id })
  }
}

// -- RACI jalons --
export async function getJalonRaci(jalon_id: string): Promise<RaciJalon[]> {
  return dedupedFetch(`roadmap-raci:${jalon_id}`, async () => {
    const { data, error } = await supabase.from('raci_jalons').select('*').eq('jalon_id', jalon_id)
    if (error) throw error
    return (data ?? []) as RaciJalon[]
  })
}

export async function setRaci(jalon_id: string, direction_id: string, role: RaciRole): Promise<RaciJalon> {
  if (role === 'PILOTE') {
    const { error: delErr } = await supabase.from('raci_jalons').delete().eq('jalon_id', jalon_id).eq('role', 'PILOTE')
    if (delErr) throw delErr
  }
  const { data, error } = await supabase
    .from('raci_jalons')
    .upsert(
      { jalon_id, direction_id, role },
      { onConflict: 'jalon_id,direction_id' },
    )
    .select()
    .single()
  if (error) throw error
  const r = data as RaciJalon
  const { data: j } = await supabase.from('jalons').select('chantier_id, projet_id').eq('id', jalon_id).single()
  if (j) {
    invalidateRoadmapCaches({
      jalon_id,
      chantier_id: (j as { chantier_id: string }).chantier_id,
      projet_id: (j as { projet_id: string }).projet_id,
    })
  }
  return r
}

export async function removeRaci(jalon_id: string, direction_id: string): Promise<void> {
  const { data: j } = await supabase.from('jalons').select('chantier_id, projet_id').eq('id', jalon_id).single()
  const { error } = await supabase.from('raci_jalons').delete().eq('jalon_id', jalon_id).eq('direction_id', direction_id)
  if (error) throw error
  if (j) {
    invalidateRoadmapCaches({
      jalon_id,
      chantier_id: (j as { chantier_id: string }).chantier_id,
      projet_id: (j as { projet_id: string }).projet_id,
    })
  }
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
