import { supabase } from '../supabase'
import type { Axe, Chantier, Jalon, RaciJalon, RaciRole } from '../types'
import { dedupedFetch, invalidateCache } from './cache'

const AXE_ORDER: Axe[] = ['PROCESSUS', 'ORGANISATION', 'OUTILS', 'KPI']

const AXE_PREFIX: Record<Axe, number> = {
  PROCESSUS: 1,
  ORGANISATION: 2,
  OUTILS: 3,
  KPI: 4,
}

/** Exporté pour tests unitaires (tri identique à getChantierJalons / getProjetJalons). */
export function sortJalonsByAxeAndOrder(list: Jalon[]): Jalon[] {
  const rank = (axe: Axe) => AXE_ORDER.indexOf(axe)
  return [...list].sort((a, b) => {
    const ra = rank(a.axe)
    const rb = rank(b.axe)
    if (ra !== rb) return ra - rb
    return (a.ordre_sequentiel ?? 0) - (b.ordre_sequentiel ?? 0)
  })
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

export async function createChantier(data: Partial<Chantier>): Promise<Chantier> {
  const insert: Record<string, unknown> = {
    projet_id: data.projet_id,
    workspace_id: data.workspace_id,
    nom: data.nom ?? 'Chantier',
    description: data.description ?? null,
    ordre: data.ordre ?? 1,
  }
  if (data.axe !== undefined && data.axe !== null) {
    insert.axe = normalizeAxeForDb(data.axe)
  }
  const { data: row, error } = await supabase.from('chantiers').insert(insert).select().single()
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
  return sortJalonsByAxeAndOrder((data ?? []) as Jalon[])
}

export async function getChantierJalons(chantier_id: string): Promise<Jalon[]> {
  return dedupedFetch(`roadmap-jalons:${chantier_id}`, async () => {
    const { data, error } = await supabase.from('jalons').select('*').eq('chantier_id', chantier_id)
    if (error) throw error
    return sortJalonsByAxeAndOrder((data ?? []) as Jalon[])
  })
}

const JALONS_IN_CHUNK_SIZE = 200

/**
 * Jalons pour plusieurs chantiers en une ou plusieurs requêtes `.in()` (évite N+1 sur la roadmap).
 * Les tableaux vides par chantier sont garantis pour chaque id demandé.
 */
export async function getJalonsByChantierIds(chantierIds: string[]): Promise<Record<string, Jalon[]>> {
  const unique = [...new Set(chantierIds.filter(Boolean))]
  const out: Record<string, Jalon[]> = Object.fromEntries(unique.map((id) => [id, [] as Jalon[]]))
  if (unique.length === 0) return out

  const merged: Jalon[] = []
  for (let i = 0; i < unique.length; i += JALONS_IN_CHUNK_SIZE) {
    const chunk = unique.slice(i, i + JALONS_IN_CHUNK_SIZE)
    const { data, error } = await supabase.from('jalons').select('*').in('chantier_id', chunk)
    if (error) throw error
    merged.push(...((data ?? []) as Jalon[]))
  }
  for (const j of merged) {
    const k = j.chantier_id
    if (out[k]) out[k]!.push(j)
    else out[k] = [j]
  }
  for (const id of unique) {
    out[id] = sortJalonsByAxeAndOrder(out[id] ?? [])
  }
  return out
}

export async function createJalon(data: Partial<Jalon>): Promise<Jalon> {
  if (!data.chantier_id || data.axe === undefined || data.axe === null || String(data.axe).trim() === '') {
    throw new Error('createJalon: chantier_id et axe sont requis')
  }
  const { data: ch, error: eCh } = await supabase
    .from('chantiers')
    .select('projet_id, workspace_id, axe')
    .eq('id', data.chantier_id)
    .single()
  if (eCh) throw eCh
  const chantier = ch as { projet_id: string; workspace_id: string; axe?: Axe | null }
  const axe =
    chantier.axe != null && String(chantier.axe).trim() !== ''
      ? normalizeAxeForDb(chantier.axe)
      : normalizeAxeForDb(data.axe)
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
  const { data: j } = await supabase.from('jalons').select('chantier_id, projet_id').eq('id', jalon_id).single()
  if (j) {
    invalidateRoadmapCaches({
      jalon_id,
      chantier_id: (j as { chantier_id: string }).chantier_id,
      projet_id: (j as { projet_id: string }).projet_id,
    })
  }
  return data as RaciJalon
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
