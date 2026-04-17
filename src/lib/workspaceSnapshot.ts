const SNAPSHOT_KEY = 'lfdc-workspace-snapshot'
const LOGO_CACHE_KEY = 'lfdc-workspace-logo-cache'

export type WorkspaceSnapshot = {
  id: string
  company_name: string
  sector: string | null
  size: string | null
  logo_url: string | null
}

/** URL publique du logo telle que renvoyée par l’API / la sauvegarde. */
export function normalizeWorkspaceLogoUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const s = value.trim()
  if (!s || s === 'null') return null
  return s.startsWith('http') ? s : null
}

/** Dernière URL de logo connue pour ce workspace (survit aux réponses API sans logo_url, ex. RLS SELECT). */
export function readWorkspaceLogoUrl(workspaceId: string | null): string | null {
  if (!workspaceId || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LOGO_CACHE_KEY)
    if (!raw) return null
    const o = JSON.parse(raw) as { id?: string; url?: string }
    if (o.id !== workspaceId) return null
    return normalizeWorkspaceLogoUrl(o.url)
  } catch {
    return null
  }
}

export function writeWorkspaceLogoUrl(workspaceId: string, url: string | null): void {
  if (typeof window === 'undefined') return
  try {
    const normalized = normalizeWorkspaceLogoUrl(url)
    if (normalized) {
      window.localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify({ id: workspaceId, url: normalized }))
    } else {
      window.localStorage.removeItem(LOGO_CACHE_KEY)
    }
  } catch {
    /* quota */
  }
}

/** Logo affiché au tout premier paint après F5 (cache ou snapshot). */
export function readInitialCompanyLogo(): string | null {
  if (typeof window === 'undefined') return null
  const wid = window.localStorage.getItem('workspaceId')
  if (!wid) return null
  const fromCache = readWorkspaceLogoUrl(wid)
  if (fromCache) return fromCache
  const snap = readWorkspaceSnapshot()
  if (snap?.id === wid) return normalizeWorkspaceLogoUrl(snap.logo_url)
  return null
}

export function readWorkspaceSnapshot(): WorkspaceSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WorkspaceSnapshot
    if (!parsed?.id || typeof parsed.company_name !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export function writeWorkspaceSnapshot(data: WorkspaceSnapshot): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(data))
  } catch {
    /* quota / private mode */
  }
}

export function clearWorkspaceSnapshot(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SNAPSHOT_KEY)
  window.localStorage.removeItem(LOGO_CACHE_KEY)
}
