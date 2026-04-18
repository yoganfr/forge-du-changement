import { useEffect, useMemo, useState } from 'react'
import type { Axe } from './lib/types'
import { buildTimelineColumns, defaultTargetMonthYearForColumn } from './lib/roadmapTimelineColumns'

const AXES: Axe[] = ['PROCESSUS', 'ORGANISATION', 'OUTILS', 'KPI']

const AXE_LABELS: Record<Axe, string> = {
  PROCESSUS: '1. Processus métiers',
  ORGANISATION: '2. Organisation',
  OUTILS: '3. Outils IT',
  KPI: "4. KPI's",
}

type Props = {
  open: boolean
  onClose: () => void
  chantierNom: string
  /** Clé de la colonne temps cliquée dans la grille (alignée sur `buildTimelineColumns`). */
  initialColumnKey: string
  /** Si défini (ex. création depuis la grille par axe), l’axe n’est pas modifiable. */
  fixedAxe?: Axe | null
  saving: boolean
  onSubmit: (data: {
    nom: string
    axe: Axe
    mois_cible: number | null
    annee_cible: number | null
  }) => Promise<void>
}

export default function JalonQuickAddModal({
  open,
  onClose,
  chantierNom,
  initialColumnKey,
  fixedAxe = null,
  saving,
  onSubmit,
}: Props) {
  const [nom, setNom] = useState('')
  const [axe, setAxe] = useState<Axe>('PROCESSUS')
  const [echeanceKey, setEcheanceKey] = useState(initialColumnKey)

  const echeanceOptions = useMemo(() => (open ? buildTimelineColumns() : []), [open])

  useEffect(() => {
    if (!open) return
    queueMicrotask(() => {
      setNom('')
      setAxe(fixedAxe ?? 'PROCESSUS')
      setEcheanceKey(initialColumnKey)
    })
  }, [open, initialColumnKey, fixedAxe])

  const echeanceSelectValue = useMemo(() => {
    const keys = new Set(echeanceOptions.map((c) => c.key))
    if (keys.has(echeanceKey)) return echeanceKey
    if (keys.has(initialColumnKey)) return initialColumnKey
    return echeanceOptions[0]?.key ?? ''
  }, [echeanceOptions, echeanceKey, initialColumnKey])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nom.trim()
    if (!trimmed) return
    const col = echeanceOptions.find((c) => c.key === echeanceSelectValue)
    const my = col ? defaultTargetMonthYearForColumn(col) : null
    await onSubmit({
      nom: trimmed,
      axe: fixedAxe ?? axe,
      mois_cible: my?.mois ?? null,
      annee_cible: my?.annee ?? null,
    })
  }

  return (
    <div className="mr-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="mr-modal"
        role="dialog"
        aria-labelledby="mr-modal-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h2 id="mr-modal-title" className="mr-modal__title">
          Nouveau jalon
        </h2>
        <p className="mr-modal__meta">
          Chantier : <strong>{chantierNom}</strong>
        </p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mr-modal__form">
          <label className="mr-modal__field">
            Intitulé
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom du jalon"
              autoFocus
              required
            />
          </label>
          {fixedAxe ? (
            <p className="mr-modal__meta">
              Axe : <strong>{AXE_LABELS[fixedAxe]}</strong>
            </p>
          ) : (
            <label className="mr-modal__field">
              Axe
              <select value={axe} onChange={(e) => setAxe(e.target.value as Axe)}>
                {AXES.map((a) => (
                  <option key={a} value={a}>
                    {AXE_LABELS[a]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="mr-modal__field">
            Échéance
            <select
              id="mr-jalon-echeance"
              value={echeanceSelectValue}
              onChange={(e) => setEcheanceKey(e.target.value)}
            >
              {echeanceOptions.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div className="mr-modal__actions">
            <button type="button" className="mr-btn-ghost" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button type="submit" className="mr-btn-primary" disabled={saving || !nom.trim()}>
              {saving ? '…' : 'Créer le jalon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
