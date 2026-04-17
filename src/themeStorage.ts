export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'lfdc-theme'

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === 'dark' ? 'dark' : 'light'
}

export function persistTheme(mode: ThemeMode) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, mode)
}

export function applyThemeToDocument(mode: ThemeMode) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = mode
}
