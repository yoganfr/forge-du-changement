import { useEffect, useState } from 'react'
import type { Direction } from './lib/types'
import { createDirection } from './lib/api'
import { findSimilarDirection } from './lib/directionNameMatch'
import { getCurrentUser } from './lib/auth'
import { mrBackdropProps, useBackdropPointerClose } from './lib/useBackdropPointerClose'

const DIRECTION_COLORS = ['#8E3B46', '#4C86A8', '#477890', '#B45309', '#6B7280']

type Props = {
  open: boolean
  workspaceId: string
  existingDirections: Direction[]
  onClose: () => void
  /** Après création ou choix d’une direction existante. */
  onResolved: (direction: Direction) => void | Promise<void>
}

export default function CreateDirectionDialog({
  open,
  workspaceId,
  existingDirections,
  onClose,
  onResolved,
}: Props) {
  const [nom, setNom] = useState('')
  const [saving, setSaving] = useState(false)
  const { onBackdropPointerDown } = useBackdropPointerClose(onClose, open)

  useEffect(() => {
    if (!open) return
    setNom('')
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function persistNewDirection(trimmed: string) {
    const appUser = await getCurrentUser()
    const idx = existingDirections.length % DIRECTION_COLORS.length
    const created = await createDirection({
      workspace_id: workspaceId,
      user_id: appUser?.id ?? null,
      nom: trimmed,
      type: 'Métier',
      mission: null,
      vision: null,
      color: DIRECTION_COLORS[idx] ?? DIRECTION_COLORS[0],
      is_transverse: false,
    })
    onResolved(created)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nom.trim()
    if (!trimmed || saving) return
    const similar = findSimilarDirection(trimmed, existingDirections)
    if (similar) {
      const useExisting = window.confirm(
        `Une direction proche existe déjà : « ${similar.nom} ».\n\n` +
          `Souhaitez-vous utiliser cette direction plutôt que d’en créer une nouvelle ?`,
      )
      if (useExisting) {
        onResolved(similar)
        onClose()
        return
      }
      const force = window.confirm('Créer une nouvelle direction malgré tout ?')
      if (!force) return
    }
    setSaving(true)
    try {
      await persistNewDirection(trimmed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="mr-modal-overlay mr-modal-overlay--stack"
      role="presentation"
      {...mrBackdropProps}
      onPointerDown={onBackdropPointerDown}
    >
      <div
        className="mr-modal"
        role="dialog"
        aria-labelledby="mr-create-dir-title"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <h2 id="mr-create-dir-title" className="mr-modal__title">
          Nouvelle direction
        </h2>
        <p className="mr-modal__meta">
          Intitulé du périmètre (direction). Nous détectons les doublons évidents avant création.
        </p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mr-modal__form">
          <label className="mr-modal__field">
            Nom
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="ex. Direction Industrielle"
              autoFocus
              required
            />
          </label>
          <div className="mr-modal__actions">
            <button type="button" className="mr-btn-ghost" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button type="submit" className="mr-btn-primary" disabled={saving || !nom.trim()}>
              {saving ? '…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
