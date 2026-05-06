import { supabase } from '../supabase'

export type ReviewKind = 'reaction' | 'decision' | 'proposition_chantier'
export type ReviewTargetType = 'projet' | 'chantier' | 'jalon' | 'raci_chantier' | 'proposition'
export type ReviewerStatus = 'pending' | 'draft' | 'submitted' | 'closed'
export type CodirDecisionStatus = 'pending' | 'noted' | 'ok' | 'nok' | 'sous_condition'

export type RoadmapSnapshotReviewer = {
  id: string
  snapshot_id: string
  user_id: string
  status: ReviewerStatus
  invited_at: string
  submitted_at: string | null
  closed_at: string | null
  invited_by: string | null
  invited_by_email: string | null
}

export type RoadmapReviewFeedback = {
  id: string
  snapshot_id: string
  reviewer_user_id: string
  kind: ReviewKind
  target_type: ReviewTargetType
  target_id: string | null
  comment: string | null
  constat: string | null
  proposition: string | null
  benefice: string | null
  projet_pere_id: string | null
  axe: 'PROCESSUS' | 'ORGANISATION' | 'OUTILS' | 'KPI' | null
  titre_chantier: string | null
  codir_status: CodirDecisionStatus | null
  codir_motivation: string | null
  codir_user_id: string | null
  codir_at: string | null
  parent_id: string | null
  created_at: string
  updated_at: string
}

export async function listSnapshotReviewers(snapshotId: string): Promise<RoadmapSnapshotReviewer[]> {
  const { data, error } = await supabase
    .from('roadmap_snapshot_reviewers')
    .select('*')
    .eq('snapshot_id', snapshotId)
    .order('invited_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as RoadmapSnapshotReviewer[]
}

/** Ligne reviewer pour un utilisateur sur ce snapshot (null si non invité). */
export async function getReviewerRowForUser(
  snapshotId: string,
  userId: string,
): Promise<RoadmapSnapshotReviewer | null> {
  const rows = await listSnapshotReviewers(snapshotId)
  return rows.find((r) => r.user_id === userId) ?? null
}

/** Revues où l'utilisateur est reviewer, restreint au workspace (après jointure snapshot). */
export type ReviewerWorkspaceAssignment = {
  snapshot_id: string
  snapshot_label: string
  snapshot_status: string
  review_deadline: string | null
  frozen_at: string
  reviewer_status: ReviewerStatus
  submitted_at: string | null
  /** Renseigné si `viewerIsPlatformSuperadmin` : ligne reviewer distincte par assignation. */
  reviewer_user_id?: string
  reviewer_email?: string | null
  reviewer_display_name?: string | null
}

export type ListReviewerAssignmentsOptions = {
  /**
   * Super-admin plateforme (REF-7b.2 §6.4) : liste toutes les assignations reviewers du workspace,
   * pas seulement celles du compte courant — lecture transverse « partie Manager ».
   */
  viewerIsPlatformSuperadmin?: boolean
}

export async function listReviewerAssignmentsForWorkspace(
  workspaceId: string,
  userId: string,
  options?: ListReviewerAssignmentsOptions,
): Promise<ReviewerWorkspaceAssignment[]> {
  const viewerIsPlatformSuperadmin = options?.viewerIsPlatformSuperadmin === true

  let q = supabase.from('roadmap_snapshot_reviewers').select(
    `
      user_id,
      status,
      submitted_at,
      snapshot_id,
      users!roadmap_snapshot_reviewers_user_id_fkey ( email, prenom, nom ),
      roadmap_snapshots (
        id,
        workspace_id,
        label,
        status,
        review_deadline,
        frozen_at
      )
    `,
  )
  if (!viewerIsPlatformSuperadmin) {
    q = q.eq('user_id', userId)
  }

  const { data, error } = await q

  if (error) throw error

  type SnapRow = {
    id: string
    workspace_id: string
    label: string
    status: string
    review_deadline: string | null
    frozen_at: string
  }

  type UserRow = { email: string | null; prenom: string | null; nom: string | null }

  type Row = {
    user_id: string
    status: ReviewerStatus
    submitted_at: string | null
    snapshot_id: string
    users: UserRow | UserRow[] | null
    roadmap_snapshots: SnapRow | SnapRow[] | null
  }

  const rows = (data ?? []) as Row[]
  const out: ReviewerWorkspaceAssignment[] = []
  for (const r of rows) {
    const raw = r.roadmap_snapshots
    const snap = Array.isArray(raw) ? raw[0] ?? null : raw
    if (!snap || snap.workspace_id !== workspaceId) continue

    const uRaw = r.users
    const u = Array.isArray(uRaw) ? uRaw[0] ?? null : uRaw
    const display =
      [u?.prenom, u?.nom].filter(Boolean).join(' ').trim() || u?.email?.trim() || null

    const base: ReviewerWorkspaceAssignment = {
      snapshot_id: snap.id,
      snapshot_label: snap.label,
      snapshot_status: snap.status,
      review_deadline: snap.review_deadline,
      frozen_at: snap.frozen_at,
      reviewer_status: r.status,
      submitted_at: r.submitted_at,
    }
    if (viewerIsPlatformSuperadmin) {
      base.reviewer_user_id = r.user_id
      base.reviewer_email = u?.email ?? null
      base.reviewer_display_name = display
    }
    out.push(base)
  }
  out.sort((a, b) => Date.parse(b.frozen_at) - Date.parse(a.frozen_at))
  return out
}

export async function openSnapshotReview(params: {
  snapshotId: string
  reviewerUserIds: string[]
  invitedBy?: string | null
  invitedByEmail?: string | null
  reviewDeadline?: string | null
}): Promise<void> {
  const reviewerRows = params.reviewerUserIds.map((userId) => ({
    snapshot_id: params.snapshotId,
    user_id: userId,
    status: 'draft',
    invited_by: params.invitedBy ?? null,
    invited_by_email: params.invitedByEmail ?? null,
  }))

  if (reviewerRows.length > 0) {
    const { error: reviewersError } = await supabase
      .from('roadmap_snapshot_reviewers')
      .upsert(reviewerRows, { onConflict: 'snapshot_id,user_id' })
    if (reviewersError) throw reviewersError
  }

  const { error: snapshotError } = await supabase
    .from('roadmap_snapshots')
    .update({
      status: 'in_review',
      review_deadline: params.reviewDeadline ?? null,
    })
    .eq('id', params.snapshotId)
  if (snapshotError) throw snapshotError
}

/** Repasse le snapshot en brouillon : fin de la campagne « revue ouverte » (statut `in_review`). */
export async function closeSnapshotReview(snapshotId: string): Promise<void> {
  const { error } = await supabase
    .from('roadmap_snapshots')
    .update({ status: 'draft' })
    .eq('id', snapshotId)
    .eq('status', 'in_review')
  if (error) throw error
}

export async function listSnapshotFeedbacks(snapshotId: string): Promise<RoadmapReviewFeedback[]> {
  const { data, error } = await supabase
    .from('roadmap_review_feedbacks')
    .select('*')
    .eq('snapshot_id', snapshotId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as RoadmapReviewFeedback[]
}

export async function listReviewerFeedbacks(
  snapshotId: string,
  reviewerUserId: string,
): Promise<RoadmapReviewFeedback[]> {
  const { data, error } = await supabase
    .from('roadmap_review_feedbacks')
    .select('*')
    .eq('snapshot_id', snapshotId)
    .eq('reviewer_user_id', reviewerUserId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as RoadmapReviewFeedback[]
}

export async function createReviewFeedback(
  payload: Omit<RoadmapReviewFeedback, 'id' | 'created_at' | 'updated_at' | 'codir_at' | 'codir_user_id'>,
): Promise<RoadmapReviewFeedback> {
  const { data, error } = await supabase
    .from('roadmap_review_feedbacks')
    .insert(payload)
    .select('*')
    .single()
  if (error || !data) throw error ?? new Error('Impossible de créer le feedback')
  return data as RoadmapReviewFeedback
}

export async function submitReviewerReview(snapshotId: string, reviewerUserId: string): Promise<void> {
  const { error } = await supabase
    .from('roadmap_snapshot_reviewers')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .eq('snapshot_id', snapshotId)
    .eq('user_id', reviewerUserId)
  if (error) throw error
}

export async function arbitrateFeedback(
  feedbackId: string,
  codirStatus: CodirDecisionStatus,
  codirMotivation: string,
  codirUserId?: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('roadmap_review_feedbacks')
    .update({
      codir_status: codirStatus,
      codir_motivation: codirMotivation,
      codir_user_id: codirUserId ?? null,
      codir_at: new Date().toISOString(),
    })
    .eq('id', feedbackId)
  if (error) throw error
}
