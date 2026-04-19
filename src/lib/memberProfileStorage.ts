/**
 * Cache profil « Mon profil » (prénom, photo, périmètre, etc.).
 * Clé **par email** pour survivre à la déconnexion / reco sur le même navigateur,
 * et éviter qu’un compte écrase le cache d’un autre sur la même machine.
 */
export const MEMBER_PROFILE_STORAGE_KEY = 'lfdc-member-onboarding'

export function memberProfileStorageKey(email: string | null | undefined): string {
  const e = email?.trim().toLowerCase()
  return e ? `${MEMBER_PROFILE_STORAGE_KEY}:${e}` : MEMBER_PROFILE_STORAGE_KEY
}

/** Copie une fois le JSON legacy vers la clé par email si la cible est vide. */
export function migrateLegacyMemberProfileIfNeeded(email: string | null | undefined): void {
  if (typeof localStorage === 'undefined') return
  const e = email?.trim().toLowerCase()
  if (!e) return
  const keyed = memberProfileStorageKey(e)
  if (localStorage.getItem(keyed)) return
  const legacy = localStorage.getItem(MEMBER_PROFILE_STORAGE_KEY)
  if (!legacy) return
  try {
    localStorage.setItem(keyed, legacy)
  } catch {
    /* quota */
  }
}
