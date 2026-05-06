import { useEffect, useState } from 'react'
import { mrBackdropProps, useBackdropPointerClose } from './lib/useBackdropPointerClose'

type Props = {
  open: boolean
  suggestedLabel: string
  onCancel: () => void
  onConfirm: (label: string) => void
}

export default function FreezeRoadmapDialog({ open, suggestedLabel, onCancel, onConfirm }: Props) {
  const { onBackdropPointerDown } = useBackdropPointerClose(onCancel, open)
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!open) return
    setLabel(suggestedLabel)
  }, [open, suggestedLabel])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const trimmed = label.trim()

  return (
    <div
      className="mr-modal-overlay mr-modal-overlay--stack"
      role="presentation"
      {...mrBackdropProps}
      onPointerDown={onBackdropPointerDown}
    >
      <div
        className="mr-modal freeze-roadmap-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="freeze-roadmap-title"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <h2 id="freeze-roadmap-title" className="mr-modal__title">
          Figer la roadmap en cours
        </h2>
        <p className="mr-modal__meta">
          Une version figée est une photographie des chantiers et jalons à cet instant. Vous pourrez la nommer (ex.
          V1 mai 2026, V2 après arbitrage) et ouvrir une revue dessus.
        </p>
        <form
          className="mr-modal__form"
          onSubmit={(e) => {
            e.preventDefault()
            if (!trimmed) return
            onConfirm(trimmed)
          }}
        >
          <label className="mr-modal__field">
            Libellé de la version
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex. V2 juin 2026"
              autoFocus
              required
            />
          </label>
          <div className="mr-modal__actions">
            <button type="button" className="mr-btn-ghost" onClick={onCancel}>
              Annuler
            </button>
            <button type="submit" className="mr-btn-primary" disabled={!trimmed}>
              Figer cette version
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
