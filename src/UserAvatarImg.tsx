import { useEffect, useState } from 'react'

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
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [src])

  if (!src || broken) {
    return <>{initials}</>
  }

  return (
    <img
      src={src}
      alt=""
      className={className}
      decoding="async"
      onError={() => setBroken(true)}
    />
  )
}
