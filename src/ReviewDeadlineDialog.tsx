import { useEffect, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { fr } from 'date-fns/locale'
import { mrBackdropProps, useBackdropPointerClose } from './lib/useBackdropPointerClose'
import 'react-day-picker/src/style.css'
import './ReviewDeadlineDialog.css'

type Props = {
  open: boolean
  onCancel: () => void
  /** `null` = pas d’échéance enregistrée */
  onConfirm: (deadlineIso: string | null) => void
}

function defaultDeadlineDay(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function ReviewDeadlineDialog({ open, onCancel, onConfirm }: Props) {
  const { onBackdropPointerDown } = useBackdropPointerClose(onCancel, open)
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)
  const [timeStr, setTimeStr] = useState('23:59')
  const [noDeadline, setNoDeadline] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedDay(defaultDeadlineDay())
    setTimeStr('23:59')
    setNoDeadline(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  function mergeToIso(): string | null {
    if (noDeadline) return null
    if (!selectedDay) return null
    const parts = timeStr.split(':').map((x) => parseInt(x, 10))
    const hh = Number.isFinite(parts[0]) ? parts[0] : 23
    const mm = Number.isFinite(parts[1]) ? parts[1] : 59
    const h = Math.min(23, Math.max(0, hh))
    const m = Math.min(59, Math.max(0, mm))
    const out = new Date(selectedDay)
    out.setHours(h, m, 0, 0)
    return out.toISOString()
  }

  const canSubmit = noDeadline || selectedDay != null

  return (
    <div
      className="mr-modal-overlay mr-modal-overlay--stack"
      role="presentation"
      {...mrBackdropProps}
      onPointerDown={onBackdropPointerDown}
    >
      <div
        className="mr-modal review-deadline-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-deadline-title"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <h2 id="review-deadline-title" className="mr-modal__title">
          Date limite de la revue
        </h2>
        <p className="mr-modal__meta">
          Choisissez le jour et l’heure limite pour la collecte des feedbacks reviewers. Par défaut : dans 14 jours,
          23 h 59.
        </p>

        <label className="mr-modal__field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={noDeadline}
            onChange={(e) => setNoDeadline(e.target.checked)}
          />
          <span>Pas de date limite</span>
        </label>

        <div
          className="review-deadline-dialog__calendar"
          style={{ opacity: noDeadline ? 0.45 : 1, pointerEvents: noDeadline ? 'none' : 'auto' }}
        >
          <DayPicker
            mode="single"
            selected={selectedDay}
            onSelect={setSelectedDay}
            locale={fr}
            defaultMonth={selectedDay ?? defaultDeadlineDay()}
          />
        </div>

        <div className="review-deadline-dialog__row">
          <label>
            Heure limite
            <input
              type="time"
              value={timeStr}
              disabled={noDeadline}
              onChange={(e) => setTimeStr(e.target.value)}
            />
          </label>
        </div>

        <p className="review-deadline-dialog__hint">
          Fuseau : heure locale du navigateur (stockée en UTC côté serveur).
        </p>

        <div className="mr-modal__actions">
          <button type="button" className="mr-btn-ghost" onClick={onCancel}>
            Annuler
          </button>
          <button
            type="button"
            className="mr-btn-primary"
            disabled={!canSubmit}
            onClick={() => onConfirm(mergeToIso())}
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  )
}

export function formatDeadlinePreview(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
  } catch {
    return iso
  }
}
