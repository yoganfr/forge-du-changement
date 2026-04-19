import { useCallback, useEffect, useRef } from 'react'

/** Props à étaler sur le backdrop (zone plein écran derrière le panneau / modale). */
export const mrBackdropProps = { 'data-mr-backdrop': '1' } as const

function isMrBackdropTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.dataset.mrBackdrop === '1'
}

/**
 * Ferme un overlay seulement si pointerdown et pointerup ont tous deux eu lieu
 * sur le backdrop (évite la fermeture lors d’une sélection de texte qui sort du panneau).
 */
export function useBackdropPointerClose(onClose: () => void, active: boolean) {
  const startedOnBackdrop = useRef(false)

  const onBackdropPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!active) return
      startedOnBackdrop.current = isMrBackdropTarget(e.target)
    },
    [active],
  )

  useEffect(() => {
    if (!active) {
      startedOnBackdrop.current = false
      return
    }

    function onWindowPointerUp(e: PointerEvent) {
      if (!startedOnBackdrop.current) return
      if (isMrBackdropTarget(e.target)) {
        onClose()
      }
      startedOnBackdrop.current = false
    }

    window.addEventListener('pointerup', onWindowPointerUp)
    return () => window.removeEventListener('pointerup', onWindowPointerUp)
  }, [active, onClose])

  return { onBackdropPointerDown }
}
