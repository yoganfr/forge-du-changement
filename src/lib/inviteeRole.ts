/** Rôle copié depuis `invitations.role`. Jamais déduit d’un libellé d’écran. */
export type InviteeStoredRole = 'consultant' | 'codir' | 'pilote' | 'contributeur'

export const INCOMPLETE_INVITATION_MESSAGE =
  'Ton invitation est incomplète, contacte la personne qui t’a invité.'

export const INVITATION_ABSENT_MESSAGE =
  'Aucune invitation acceptée ne correspond à cet espace. Contacte la personne qui t’a invité.'

export const INVITATION_READ_FAILED_MESSAGE =
  'Impossible de lire ton invitation. Réessaie dans un instant.'

export const INVITATION_STATUS_CHANGED_MESSAGE =
  'Ton invitation a changé pendant l’enregistrement. Contacte la personne qui t’a invité.'

export type InvitationCandidate = {
  id: string
  workspace_id: string | null
  role: string | null
  status: string | null
  created_at: string
  direction_id: string | null
  trigram: string | null
}

/**
 * Rôle d’invitation réellement stockable.
 * `null`, vide ou inconnu est une erreur : pas de repli vers `codir`.
 */
export function invitationRoleToStoredRole(role: string | null | undefined): InviteeStoredRole | null {
  if (role === 'consultant' || role === 'codir' || role === 'pilote' || role === 'contributeur') {
    return role
  }
  return null
}

function readStringOrNull(record: object, key: string): string | null | undefined {
  if (!(key in record)) return undefined
  const value: unknown = Reflect.get(record, key)
  if (value === null) return null
  if (typeof value === 'string') return value
  return undefined
}

export function parseInvitationCandidate(value: unknown): InvitationCandidate | null {
  if (typeof value !== 'object' || value === null) return null
  const id = readStringOrNull(value, 'id')
  if (!id) return null
  const createdAt = readStringOrNull(value, 'created_at')
  return {
    id,
    workspace_id: readStringOrNull(value, 'workspace_id') ?? null,
    role: readStringOrNull(value, 'role') ?? null,
    status: readStringOrNull(value, 'status') ?? null,
    created_at: createdAt ?? '',
    direction_id: readStringOrNull(value, 'direction_id') ?? null,
    trigram: readStringOrNull(value, 'trigram') ?? null,
  }
}

export function parseInvitationCandidates(value: unknown): InvitationCandidate[] {
  if (!Array.isArray(value)) return []
  const out: InvitationCandidate[] = []
  for (const item of value) {
    const row = parseInvitationCandidate(item)
    if (row) out.push(row)
  }
  return out
}

/** Plus récente d’abord. À date égale, l’identifiant le plus grand l’emporte. */
export function sortInvitationsNewestFirst(rows: readonly InvitationCandidate[]): InvitationCandidate[] {
  return [...rows].sort((a, b) => {
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1
    if (a.id === b.id) return 0
    return a.id < b.id ? 1 : -1
  })
}

/**
 * Invitation qui ouvre la session : la plus récente (`en_attente` ou `acceptee`).
 * Même règle que `pickInvitationForWorkspace`, pour que le rôle affiché
 * soit celui qui sera écrit. Un espace plus ancien ne passe pas devant.
 */
export function preferBootstrapInvitation(rows: readonly InvitationCandidate[]): InvitationCandidate | null {
  return sortInvitationsNewestFirst(rows)[0] ?? null
}

/** Parmi les invitations de cet espace, une seule : la plus récente. */
export function pickInvitationForWorkspace(
  rows: readonly InvitationCandidate[],
  workspaceId: string,
): InvitationCandidate | null {
  const matching = rows.filter((row) => row.workspace_id === workspaceId)
  return sortInvitationsNewestFirst(matching)[0] ?? null
}

export type InviteeRoleClass =
  | { kind: 'absent' }
  | { kind: 'incomplete' }
  | { kind: 'ready'; role: InviteeStoredRole }

export function classifyInviteeRole(row: InvitationCandidate | null, workspaceId: string): InviteeRoleClass {
  if (!row || row.workspace_id !== workspaceId) return { kind: 'absent' }
  const role = invitationRoleToStoredRole(row.role)
  if (!role) return { kind: 'incomplete' }
  return { kind: 'ready', role }
}

/**
 * Relecture juste avant l’insert.
 * Statut plus `acceptee`, autre espace, ou ligne disparue : on ne crée pas la fiche.
 */
export function classifyRereadInvitation(
  row: InvitationCandidate | null,
  workspaceId: string,
  invitationId: string,
): InviteeRoleClass | { kind: 'status_changed' } {
  if (!row || row.id !== invitationId || row.workspace_id !== workspaceId || row.status !== 'acceptee') {
    return { kind: 'status_changed' }
  }
  return classifyInviteeRole(row, workspaceId)
}
