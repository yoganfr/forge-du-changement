import { useEffect, useState } from 'react'
import { resolveStoredAssetUrl } from './lib/api/storage'

/** Adresse affichable d’une photo enregistrée. L’adresse stockée en base n’est pas modifiée. */
export function useStoredAssetUrl(stored: string | null | undefined): string | null {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const value = stored?.trim()
    if (!value) {
      setDisplayUrl(null)
      return
    }
    void resolveStoredAssetUrl(value).then((next) => {
      if (!cancelled) setDisplayUrl(next)
    })
    return () => {
      cancelled = true
    }
  }, [stored])

  return displayUrl
}
