import { useEffect, useState } from 'react'

const MONTH_LABELS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const
import type { Axe } from './lib/types'

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
  /** Libellé de la colonne temps (ex. Sept 2026) */
  echeanceLabel: string
  /** null = colonne « Sans date » */
  defaultMonthYear: { mois: number; annee: number } | null
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
  echeanceLabel,
  defaultMonthYear,
  saving,
  onSubmit,
}: Props) {
  const [nom, setNom] = useState('')
  const [axe, setAxe] = useState<Axe>('PROCESSUS')
  const [mois, setMois] = useState(1)
  const [annee, setAnnee] = useState(new Date().getFullYear())

  useEffect(() => {
    if (!open) return
    setNom('')
    setAxe('PROCESSUS')
    if (defaultMonthYear) {
      setMois(defaultMonthYear.mois)
      setAnnee(defaultMonthYear.annee)
    } else {
      setMois(new Date().getMonth() + 1)
      setAnnee(new Date().getFullYear())
    }
  }, [open, defaultMonthYear])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const hasDate = defaultMonthYear !== null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nom.trim()
    if (!trimmed) return
    await onSubmit({
      nom: trimmed,
      axe,
      mois_cible: hasDate ? mois : null,
      annee_cible: hasDate ? annee : null,
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
          <br />
          Échéance : <strong>{echeanceLabel}</strong>
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
          {hasDate && (
            <div className="mr-modal__row">
              <label className="mr-modal__field">
                Mois cible
                <select value={mois} onChange={(e) => setMois(Number(e.target.value))}>
                  {MONTH_LABELS_FR.map((label, i) => (
                    <option key={label} value={i + 1}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mr-modal__field">
                Année
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={annee}
                  onChange={(e) => setAnnee(Number(e.target.value))}
                />
              </label>
            </div>
          )}
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
