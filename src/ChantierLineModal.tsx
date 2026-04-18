import { useEffect, useState, type FormEvent } from 'react'

export type ChantierLineModalProps = {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  projects: { id: string; nom: string }[]
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
    setNom(initialNom)
    const pick =
      initialProjetId && projects.some((p) => p.id === initialProjetId)
        ? initialProjetId
        : projects[0]?.id ?? ''
    setProjetId(pick)
  }, [open, initialNom, initialProjetId, projects])

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

  const title = mode === 'create' ? 'Chantier et projet transformant' : 'Chantier'

  return (
    <div className="mr-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="mr-modal"
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
          Choisissez le <strong>projet transformant</strong> parent (BUILD validé DG) — la couleur des jalons suivra ce
          projet.
          {axeTypeLabel ? (
            <>
              <br />
              <strong>Type (axe)</strong> : {axeTypeLabel}
            </>
          ) : null}
        </p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mr-modal__form">
          <label className="mr-modal__field">
            Projet parent
            <select
              value={projetId}
              onChange={(e) => setProjetId(e.target.value)}
              required
              disabled={readOnly || projects.length === 0}
            >
              {projects.length === 0 ? (
                <option value="">Aucun projet éligible</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))
              )}
            </select>
          </label>
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
