import { useEffect, useState, type FormEvent } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  projects: { id: string; nom: string }[]
  defaultProjetId: string | null
  saving: boolean
  onSubmit: (projetId: string, nom: string) => Promise<void>
}

export default function ChantierCreateModal({
  open,
  onClose,
  projects,
  defaultProjetId,
  saving,
  onSubmit,
}: Props) {
  const [projetId, setProjetId] = useState('')
  const [nom, setNom] = useState('')

  useEffect(() => {
    if (!open) return
    setNom('')
    const first = defaultProjetId && projects.some((p) => p.id === defaultProjetId)
      ? defaultProjetId
      : projects[0]?.id ?? ''
    setProjetId(first)
  }, [open, defaultProjetId, projects])

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
    const n = nom.trim() || 'Nouveau chantier'
    if (!projetId) return
    await onSubmit(projetId, n)
  }

  return (
    <div className="mr-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="mr-modal"
        role="dialog"
        aria-labelledby="mr-chantier-modal-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h2 id="mr-chantier-modal-title" className="mr-modal__title">
          Nouveau chantier
        </h2>
        <p className="mr-modal__meta">
          Rattachez le chantier au <strong>projet transformant</strong> concerné — la couleur et les filtres de la
          roadmap suivront ce projet.
        </p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mr-modal__form">
          <label className="mr-modal__field">
            Projet parent
            <select
              value={projetId}
              onChange={(e) => setProjetId(e.target.value)}
              required
              disabled={projects.length === 0}
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
            Nom du chantier
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom du chantier"
              autoFocus
            />
          </label>
          <div className="mr-modal__actions">
            <button type="button" className="mr-btn-ghost" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button type="submit" className="mr-btn-primary" disabled={saving || !projetId}>
              {saving ? '…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
