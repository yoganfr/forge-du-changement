/**
 * Libellé lisible pour erreurs API client (ex. objet PostgREST renvoyé par supabase-js),
 * évite l’affichage « [object Object] » dans l’UI.
 */
export function formatClientErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err.trim() || 'Erreur inconnue'
  if (err instanceof Error) return err.message.trim() || 'Erreur inconnue'
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>
    const msg = o.message
    if (typeof msg === 'string' && msg.trim()) return msg.trim()
    const code = typeof o.code === 'string' ? o.code : null
    const details = typeof o.details === 'string' ? o.details : null
    const hint = typeof o.hint === 'string' ? o.hint : null
    const joined = [code, details, hint].filter((s): s is string => Boolean(s?.trim())).join(' — ')
    if (joined) return joined
    try {
      return JSON.stringify(err)
    } catch {
      return 'Erreur inconnue'
    }
  }
  return String(err)
}
