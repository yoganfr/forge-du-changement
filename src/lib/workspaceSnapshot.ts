const SNAPSHOT_KEY = 'lfdc-workspace-snapshot'

export type WorkspaceSnapshot = {
  id: string
  company_name: string
  sector: string | null
  size: string | null
  logo_url: string | null
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
}
