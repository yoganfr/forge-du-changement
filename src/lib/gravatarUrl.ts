import md5 from 'md5'

/**
 * URL Gravatar (MD5 de l’email en minuscules).
 * Utilisé seulement quand OAuth / `users.avatar_url` / cache profil n’ont pas d’image :
 * certains comptes « email + Google lié » n’ont pas de champ `picture` dans `raw_user_meta_data` côté Supabase.
 */
export function gravatarAvatarUrl(email: string | undefined | null): string | null {
  const normalized = email?.trim().toLowerCase()
  if (!normalized || !normalized.includes('@')) return null
  const hash = md5(normalized)
  return `https://www.gravatar.com/avatar/${hash}?s=192&d=404&r=g`
}
