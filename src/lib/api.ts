/**
 * Client Supabase **anon** + JWT session. L’accès aux données repose sur les **RLS** Postgres
 * (`auth.uid()` / `current_app_user_id()`), pas sur ce fichier.
 * Implémentation découpée dans `./api/*` ; ce fichier réexporte la même surface publique.
 */
export { insertAuditEvent, listWorkspaceAuditEvents } from './api/audit'
export {
  STORAGE_BUCKET_ASSETS,
  createSignedAssetUrl,
  isStorageBucketNotFound,
  uploadImageToStorage,
} from './api/storage'
export type { ListOptions } from './api/cache'
export {
  createWorkspace,
  getWorkspace,
  getWorkspaceConsultantMembership,
  listWorkspaces,
  updateWorkspace,
  updateWorkspaceCurrentStep,
} from './api/workspaces'
export type { WorkspaceConsultantLevel } from './api/workspaces'
export { createUser, getWorkspaceUsers, updateUser } from './api/users'
export {
  createDirection,
  getRoadmapEligibleProjects,
  getRoadmapEligibleProjectsForDirection,
  getWorkspaceDirections,
  getWorkspaceDirectionsWithProjects,
  updateDirection,
} from './api/directions'
export {
  createProjet,
  deleteProjet,
  getDirectionProjets,
  getProjet,
  updateProjet,
} from './api/projets'
export {
  createChantier,
  createJalon,
  deleteChantier,
  deleteJalon,
  getChantierJalons,
  getJalonById,
  getJalonRaci,
  getJalonsByChantierIds,
  getNextJalonNumero,
  getProjetChantiers,
  getProjetJalons,
  monthToQuarter,
  normalizeAxeForDb,
  recalculateOrdreSequentielForChantierAxe,
  removeRaci,
  setRaci,
  sortJalonsByAxeAndOrder,
  updateChantier,
  updateChantierAndReparentProject,
  updateJalon,
} from './api/roadmap'
export {
  createInvitation,
  getAcceptedInvitationAwaitingUserRow,
  getLatestPendingInvitationForEmail,
  getWorkspaceInvitations,
  markInvitationsAcceptedForWorkspaceEmail,
} from './api/invitations'
export {
  createRoadmapSnapshot,
  getRoadmapSnapshotById,
  listRoadmapSnapshotItems,
  listRoadmapSnapshots,
} from './api/roadmapSnapshots'
export {
  arbitrateFeedback,
  createReviewFeedback,
  getReviewerRowForUser,
  listReviewerAssignmentsForWorkspace,
  listReviewerFeedbacks,
  listSnapshotFeedbacks,
  listSnapshotReviewers,
  openSnapshotReview,
  submitReviewerReview,
} from './api/roadmapReviews'
export type {
  CodirDecisionStatus,
  ListReviewerAssignmentsOptions,
  ReviewKind,
  ReviewTargetType,
  ReviewerStatus,
  ReviewerWorkspaceAssignment,
  RoadmapReviewFeedback,
  RoadmapSnapshotReviewer,
} from './api/roadmapReviews'
export {
  freezeNewVersion,
  getLatestVersionForDiscourse,
  getOrCreateDiscoursForWorkspace,
  getVersionById,
  listVersionsForDiscourse,
  softDeleteDiscourseVersion,
  setDiscourseCurrentVersion,
  setWorkspaceDirigeant,
  updateVersionBlocs,
  updateVersionScore,
} from './api/discoursTransformation'
export { analyzeDiscoursWithAI } from './api/discoursAnalyze'
export type { CreateRaciChantierInput, UpdateRaciChantierInput } from './api/raci-chantiers'
export {
  createRaciChantier,
  deleteRaciChantier,
  getRaciChantiersByChantierIds,
  getRaciChantiersForProjet,
  listRaciChantiersForChantier,
  reorderRaciChantiersForChantier,
  toggleRaciChantierRole,
  updateRaciChantier,
} from './api/raci-chantiers'
