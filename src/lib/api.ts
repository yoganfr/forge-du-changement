/**
 * Client Supabase **anon** + JWT session. L’accès aux données repose sur les **RLS** Postgres
 * (`auth.uid()` / `current_app_user_id()`), pas sur ce fichier.
 * Implémentation découpée dans `./api/*` ; ce fichier réexporte la même surface publique.
 */
export { insertAuditEvent } from './api/audit'
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
  listWorkspaces,
  updateWorkspace,
} from './api/workspaces'
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
  getJalonRaci,
  getJalonsByChantierIds,
  getNextJalonNumero,
  getProjetChantiers,
  getProjetJalons,
  monthToQuarter,
  normalizeAxeForDb,
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
