import { useEffect, useState, type CSSProperties } from 'react'
import { useStoredAssetUrl } from './useStoredAssetUrl'

/** Affiche une image si `src` charge ; sinon (404, erreur) retombe sur `initials`. */
export default function UserAvatarImg({
  src,
  initials,
  className,
}: {
  src: string | null
  initials: string
  className?: string
}) {
  const displaySrc = useStoredAssetUrl(src)
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [src, displaySrc])

  if (!displaySrc || broken) {
    return <>{initials}</>
  }

  return (
    <img
      src={displaySrc}
      alt=""
      className={className}
      decoding="async"
      onError={() => setBroken(true)}
    />
  )
}

/** Logo ou photo enregistrée. L’adresse stockée reste inchangée ; seul l’affichage est temporaire. */
export function StoredAssetImg({
  src,
  className,
  style,
}: {
  src: string | null
  className?: string
  style?: CSSProperties
}) {
  const displaySrc = useStoredAssetUrl(src)
  if (!displaySrc) return null
  return <img src={displaySrc} alt="" className={className} style={style} decoding="async" />
}
