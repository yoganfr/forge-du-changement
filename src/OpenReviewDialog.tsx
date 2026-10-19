import { useEffect, useMemo, useState } from 'react'
import type { ReviewAudiencePerson } from './lib/openReviewAudience'
import { mrBackdropProps, useBackdropPointerClose } from './lib/useBackdropPointerClose'
import './OpenReviewDialog.css'

type Props = {
  open: boolean
  snapshotLabel: string
  transverse: boolean
  sameDirection: ReviewAudiencePerson[]
  otherDirections: ReviewAudiencePerson[]
  memberHasDirection: boolean
  initialSelectedIds: string[]
  onCancel: () => void
  onConfirm: (reviewerIds: string[]) => void
}

function groupByDirection(people: ReviewAudiencePerson[]): Array<[string, ReviewAudiencePerson[]]> {
  const groups = new Map<string, ReviewAudiencePerson[]>()
  for (const person of people) {
    const list = groups.get(person.directionLabel) ?? []
    list.push(person)
    groups.set(person.directionLabel, list)
  }
  return [...groups.entries()]
}

export default function OpenReviewDialog({
  open,
  snapshotLabel,
  transverse,
  sameDirection,
  otherDirections,
  memberHasDirection,
  initialSelectedIds,
  onCancel,
  onConfirm,
}: Props) {
  const { onBackdropPointerDown } = useBackdropPointerClose(onCancel, open)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const selectionKey = initialSelectedIds.join('|')

  useEffect(() => {
    if (!open) return
    setSelected(new Set(selectionKey ? selectionKey.split('|') : []))
  }, [open, selectionKey])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  const otherGroups = useMemo(() => groupByDirection(otherDirections), [otherDirections])

  if (!open) return null

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div
      className="mr-modal-overlay mr-modal-overlay--stack"
      role="presentation"
      {...mrBackdropProps}
      onPointerDown={onBackdropPointerDown}
    >
      <div
        className="mr-modal open-review-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="open-review-title"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <h2 id="open-review-title" className="mr-modal__title">
          Ouvrir la revue
        </h2>
        <p className="open-review-dialog__warning" role="status">
          Attention, veuillez vous assurer d’avoir figé la version de la Roadmap que vous souhaitez
          soumettre à vos contributeurs.
        </p>
        <p className="open-review-dialog__version">
          Version soumise : <strong>{snapshotLabel}</strong>
        </p>

        <section className="open-review-dialog__section" aria-labelledby="open-review-own">
          <h3 id="open-review-own" className="open-review-dialog__heading">
            Contributeurs de ma direction
          </h3>
          {!memberHasDirection ? (
            <p className="mr-modal__empty-hint">
              Votre fiche n’a pas de direction. Les contributeurs de votre périmètre ne peuvent pas
              être proposés.
            </p>
          ) : sameDirection.length === 0 ? (
            <p className="mr-modal__empty-hint">Aucun contributeur actif dans votre direction.</p>
          ) : (
            <ul className="open-review-dialog__list">
              {sameDirection.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  checked={selected.has(person.id)}
                  onToggle={toggle}
                />
              ))}
            </ul>
          )}
        </section>

        {transverse ? (
          <section className="open-review-dialog__section" aria-labelledby="open-review-others">
            <h3 id="open-review-others" className="open-review-dialog__heading">
              Contributeurs des autres directions
            </h3>
            <p className="mr-modal__meta">Cette version contient un projet transverse.</p>
            {otherGroups.length === 0 ? (
              <p className="mr-modal__empty-hint">
                Aucun contributeur actif dans les autres directions.
              </p>
            ) : (
              otherGroups.map(([directionLabel, people]) => (
                <div key={directionLabel} className="open-review-dialog__group">
                  <p className="open-review-dialog__direction">{directionLabel}</p>
                  <ul className="open-review-dialog__list">
                    {people.map((person) => (
                      <PersonRow
                        key={person.id}
                        person={person}
                        checked={selected.has(person.id)}
                        onToggle={toggle}
                      />
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>
        ) : null}

        <p className="mr-modal__meta">
          Aucun email n’est envoyé. Après la date limite, le lien sera copié pour que vous le
          transmettiez.
        </p>

        <div className="mr-modal__actions">
          <button type="button" className="mr-btn-ghost" onClick={onCancel}>
            Annuler
          </button>
          <button
            type="button"
            className="mr-btn-primary"
            disabled={selected.size === 0}
            onClick={() => onConfirm([...selected])}
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  )
}

function PersonRow({
  person,
  checked,
  onToggle,
}: {
  person: ReviewAudiencePerson
  checked: boolean
  onToggle: (id: string) => void
}) {
  return (
    <li>
      <label className="open-review-dialog__person">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(person.id)}
        />
        <span>{person.label}</span>
      </label>
    </li>
  )
}
