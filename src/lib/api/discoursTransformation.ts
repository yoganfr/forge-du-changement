import { supabase } from '../supabase'
import type {
  DiscoursBlocsPayload,
  DiscoursScoreSnapshot,
  TransformationDiscourse,
  TransformationDiscourseVersion,
  Workspace,
} from '../types'
import { emptyBlocsPayload } from '../discours/blocs'
import { insertAuditEvent } from './audit'
import { invalidateCache } from './cache'

/** Cache-bust key for the workspace's discourse. */
function discourseCacheKeys(workspaceId: string): string[] {
  return [`discours:${workspaceId}`, `discours-versions:${workspaceId}`]
}

/**
 * Récupère le discours du workspace, le crée avec une version `v1` vide s'il n'existe pas encore.
 * Les droits d'écriture sont gérés côté Postgres par la policy RLS
 * `can_edit_transformation_discourse` — donc l'appel peut échouer en écriture
 * si l'utilisateur courant n'a pas les droits. On capture ce cas et on
 * remonte un état « lecture seule, discours inexistant ».
 */
export async function getOrCreateDiscoursForWorkspace(
  workspaceId: string,
): Promise<{
  discourse: TransformationDiscourse | null
  currentVersion: TransformationDiscourseVersion | null
}> {
  const { data: existing, error: selErr } = await supabase
    .from('transformation_discourses')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()
  if (selErr) throw selErr

  let discourse = (existing as TransformationDiscourse | null) ?? null

  if (!discourse) {
    const { data: inserted, error: insErr } = await supabase
      .from('transformation_discourses')
      .insert({ workspace_id: workspaceId })
      .select()
      .single()
    if (insErr) {
      if (isRlsError(insErr)) {
        return { discourse: null, currentVersion: null }
      }
      throw insErr
    }
    discourse = inserted as TransformationDiscourse

    const { data: firstVersion, error: vErr } = await supabase
      .from('transformation_discourse_versions')
      .insert({
        discourse_id: discourse.id,
        version_label: 'v1',
        blocs: emptyBlocsPayload(),
      })
      .select()
      .single()
    if (vErr) {
      if (isRlsError(vErr)) {
        return { discourse, currentVersion: null }
      }
      throw vErr
    }
    const version = firstVersion as TransformationDiscourseVersion

    const { data: updated, error: updErr } = await supabase
      .from('transformation_discourses')
      .update({ current_version_id: version.id })
      .eq('id', discourse.id)
      .select()
      .single()
    if (updErr && !isRlsError(updErr)) throw updErr
    if (updated) discourse = updated as TransformationDiscourse

    invalidateCache(discourseCacheKeys(workspaceId))
    void insertAuditEvent({
      workspace_id: workspaceId,
      action: 'discours_transformation_created',
      payload: { discourse_id: discourse.id, version_id: version.id },
    })

    return { discourse, currentVersion: version }
  }

  const currentVersion = discourse.current_version_id
    ? await getVersionById(discourse.current_version_id)
    : await getLatestVersionForDiscourse(discourse.id)
  return { discourse, currentVersion }
}

export async function getVersionById(
  versionId: string,
): Promise<TransformationDiscourseVersion | null> {
  const { data, error } = await supabase
    .from('transformation_discourse_versions')
    .select('*')
    .eq('id', versionId)
    .maybeSingle()
  if (error) throw error
  return (data as TransformationDiscourseVersion | null) ?? null
}

export async function getLatestVersionForDiscourse(
  discourseId: string,
): Promise<TransformationDiscourseVersion | null> {
  const { data, error } = await supabase
    .from('transformation_discourse_versions')
    .select('*')
    .eq('discourse_id', discourseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as TransformationDiscourseVersion | null) ?? null
}

export async function listVersionsForDiscourse(
  discourseId: string,
): Promise<TransformationDiscourseVersion[]> {
  const { data, error } = await supabase
    .from('transformation_discourse_versions')
    .select('*')
    .eq('discourse_id', discourseId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as TransformationDiscourseVersion[]
}

/** Met à jour les blocs de la version en cours (auto-save). */
export async function updateVersionBlocs(
  versionId: string,
  blocs: DiscoursBlocsPayload,
): Promise<TransformationDiscourseVersion> {
  const { data, error } = await supabase
    .from('transformation_discourse_versions')
    .update({ blocs })
    .eq('id', versionId)
    .select()
    .single()
  if (error) throw error
  return data as TransformationDiscourseVersion
}

/** Met à jour le score_snapshot d'une version (après analyse IA ou rule-based). */
export async function updateVersionScore(
  versionId: string,
  score: DiscoursScoreSnapshot,
): Promise<TransformationDiscourseVersion> {
  const { data, error } = await supabase
    .from('transformation_discourse_versions')
    .update({ score_snapshot: score })
    .eq('id', versionId)
    .select()
    .single()
  if (error) throw error
  return data as TransformationDiscourseVersion
}

/**
 * Crée une nouvelle version à partir de la version courante (« geler la version »).
 * Utile pour la comparaison v1/v2 (Lot 4).
 */
export async function freezeNewVersion(
  discourseId: string,
  sourceVersion: TransformationDiscourseVersion,
  versionLabel: string,
): Promise<TransformationDiscourseVersion> {
  const { data, error } = await supabase
    .from('transformation_discourse_versions')
    .insert({
      discourse_id: discourseId,
      version_label: versionLabel,
      blocs: sourceVersion.blocs,
      score_snapshot: sourceVersion.score_snapshot,
    })
    .select()
    .single()
  if (error) throw error
  const version = data as TransformationDiscourseVersion

  const { error: updErr } = await supabase
    .from('transformation_discourses')
    .update({ current_version_id: version.id })
    .eq('id', discourseId)
  if (updErr) throw updErr

  return version
}

/** Désigne (ou retire) le membre CODIR « dirigeant » pour ce workspace. */
export async function setWorkspaceDirigeant(
  workspaceId: string,
  userId: string | null,
): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .update({ dirigeant_user_id: userId })
    .eq('id', workspaceId)
    .select()
    .single()
  if (error) throw error
  invalidateCache([`workspace:${workspaceId}`, 'workspaces:list'])
  void insertAuditEvent({
    workspace_id: workspaceId,
    action: 'workspace_dirigeant_set',
    payload: { dirigeant_user_id: userId },
  })
  return data as Workspace
}

/** Détection des erreurs liées aux policies RLS (utile pour basculer en lecture seule). */
function isRlsError(err: unknown): boolean {
  const msg =
    typeof err === 'object' && err && 'message' in err
      ? String((err as { message?: unknown }).message ?? '').toLowerCase()
      : ''
  return (
    msg.includes('row-level security') ||
    msg.includes('row level security') ||
    msg.includes('permission denied')
  )
}
