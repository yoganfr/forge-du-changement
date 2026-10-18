import type { User } from '../types'

/**
 * Insert : le rôle vient du second argument, jamais d’un champ libre du partial.
 * Le flag plateforme ne part jamais du client.
 */
export function payloadForUserInsert(data: Partial<User>, role: User['role']): Partial<User> {
  const next: Partial<User> = { ...data }
  delete next.is_platform_superadmin
  delete next.role
  next.role = role
  return next
}

/**
 * Update : `role` et `is_platform_superadmin` ne sont jamais envoyés.
 * `workspace_id` non plus, sauf realignement explicite (`allowWorkspaceId`).
 */
export function payloadForUserUpdate(
  data: Partial<User>,
  options?: { allowWorkspaceId?: boolean },
): Partial<User> {
  const next: Partial<User> = { ...data }
  delete next.role
  delete next.is_platform_superadmin
  if (!options?.allowWorkspaceId) delete next.workspace_id
  return next
}
