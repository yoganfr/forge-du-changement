import { supabase } from '../supabase'

export type ReviewKind = 'reaction' | 'decision' | 'proposition_chantier'
export type ReviewTargetType = 'projet' | 'chantier' | 'jalon' | 'proposition'
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
