import type { Invitation, User } from './types'

/** Rôle affiché dans l’UI (localStorage). La sécurité réelle = RLS Postgres, pas ce libellé. */
export type AppUserRole = 'consultant' | 'admin' | 'codir' | 'pilote' | 'contributeur'

export function invitationRoleToStoredRole(role: Invitation['role']): Exclude<AppUserRole, 'admin'> {
  if (role === 'consultant') return 'consultant'
  if (role === 'pilote') return 'pilote'
  if (role === 'contributeur') return 'contributeur'
  return 'codir'
}

/** Aligne le cache UI sur le rôle issu de `public.users` (réduit l’écart si le localStorage a été modifié). */
export function appRoleFromDbUser(user: User): AppUserRole {
  const r = user.role
  if (r === 'consultant' || r === 'admin' || r === 'codir' || r === 'pilote' || r === 'contributeur') {
    return r
  }
  return 'consultant'
}
