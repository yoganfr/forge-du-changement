import { useEffect, useState, type FormEvent } from 'react'

export type ChantierLineModalProps = {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  /** Projets BUILD éligibles, avec couleur roadmap pour repérage visuel. */
  projects: { id: string; nom: string; color: string }[]
  initialNom: string
  initialProjetId: string | null
  saving: boolean
  /** Libellé de la direction (périmètre CODIR). */
  directionLabel?: string | null
  /** Axe de roadmap (zone) — affichage seul, non modifiable ici. */
  axeTypeLabel?: string | null
  readOnly?: boolean
  onSubmit: (projetId: string, nom: string) => Promise<void>
  onDelete?: () => Promise<void>
}

export default function ChantierLineModal({
  open,
  onClose,
  mode,
  projects,
  initialNom,
  initialProjetId,
  saving,
  directionLabel,
  axeTypeLabel,
  readOnly = false,
  onSubmit,
  onDelete,
}: ChantierLineModalProps) {
  const [projetId, setProjetId] = useState('')
  const [nom, setNom] = useState('')

  useEffect(() => {
    if (!open) return
    queueMicrotask(() => {
      setNom(initialNom)
      if (mode === 'create') {
        setProjetId('')
        return
      }
      const pick =
        initialProjetId && projects.some((p) => p.id === initialProjetId)
          ? initialProjetId
          : projects[0]?.id ?? ''
      setProjetId(pick)
    })
  }, [open, mode, initialNom, initialProjetId, projects])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (readOnly) return
    const n = nom.trim() || 'Chantier'
    if (!projetId) return
    await onSubmit(projetId, n)
  }

  function toggleProjet(id: string, nextChecked: boolean) {
    if (readOnly) return
    if (nextChecked) {
      setProjetId(id)
      return
    }
    if (projetId !== id) return
    if (mode === 'create') {
      setProjetId('')
      return
    }
    const alt = projects.find((p) => p.id !== id)
    if (alt) setProjetId(alt.id)
  }

  const title = mode === 'create' ? 'Chantier et projet transformant' : 'Chantier'

  return (
    <div className="mr-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="mr-modal mr-modal--chantier"
        role="dialog"
        aria-labelledby="mr-chantier-modal-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h2 id="mr-chantier-modal-title" className="mr-modal__title">
          {title}
        </h2>
        <p className="mr-modal__meta">
          {directionLabel ? (
            <>
              Direction : <strong>{directionLabel}</strong>
              <br />
            </>
          ) : null}
          Cochez le <strong>projet transformant</strong> auquel rattacher le chantier — la couleur des jalons suivra ce
          projet.
          {axeTypeLabel ? (
            <>
              <br />
              <strong>Type (axe)</strong> : {axeTypeLabel}
            </>
          ) : null}
        </p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mr-modal__form">
          <div className="mr-modal__field">
            <span className="mr-modal__field-label">Projet transformant</span>
            {projects.length === 0 ? (
              <p className="mr-modal__empty-hint">Aucun projet BUILD éligible.</p>
            ) : (
              <ul className="mr-modal__project-list" role="list">
                {projects.map((p) => (
                  <li key={p.id}>
                    <label className="mr-modal__project-row">
                      <input
                        type="checkbox"
                        className="mr-modal__project-check"
                        checked={projetId === p.id}
                        disabled={readOnly}
                        onChange={(e) => toggleProjet(p.id, e.target.checked)}
                        aria-label={`Rattacher au projet ${p.nom}`}
                      />
                      <span
                        className="mr-modal__project-swatch"
                        style={{ background: p.color }}
                        aria-hidden
                      />
                      <span className="mr-modal__project-name">{p.nom}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <label className="mr-modal__field">
            Intitulé du chantier (ligne de roadmap)
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom du chantier"
              autoFocus
              disabled={readOnly}
            />
          </label>
          <div className="mr-modal__actions mr-modal__actions--split">
            {mode === 'edit' && onDelete && !readOnly ? (
              <button
                type="button"
                className="mr-btn-ghost mr-btn-danger"
                disabled={saving}
                onClick={() => void onDelete()}
              >
                Supprimer
              </button>
            ) : (
              <span aria-hidden className="mr-modal__actions-spacer" />
            )}
            <div className="mr-modal__actions-right">
              <button type="button" className="mr-btn-ghost" onClick={onClose} disabled={saving}>
                Annuler
              </button>
              <button type="submit" className="mr-btn-primary" disabled={saving || readOnly || !projetId}>
                {saving ? '…' : mode === 'create' ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
