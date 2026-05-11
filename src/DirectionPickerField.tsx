import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { getWorkspaceDirections } from './lib/api'
import type { Direction } from './lib/types'
import { directionDisplayNamesMatch, normalizeDirectionComparisonKey } from './lib/directionLabels'

type Props = {
  label: string
  value: string
  workspaceId: string
  onCommit: (name: string) => void
}

/** Champ « direction » : liste des directions existantes + saisie libre (création à l’enregistrement du profil). */
export default function DirectionPickerField({ label, value, workspaceId, onCommit }: Props) {
  const baseId = useId()
  const labelId = `${baseId}-label`
  const listId = `${baseId}-list`
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value)
  const [options, setOptions] = useState<Direction[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!editing || !workspaceId) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    void (async () => {
      try {
        const dirs = await getWorkspaceDirections(workspaceId)
        if (cancelled) return
        const sorted = dirs
          .filter((d) => !d.is_transverse)
          .sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? '', 'fr'))
        setOptions(sorted)
      } catch (e) {
        if (!cancelled) {
          setLoadError(typeof e === 'object' && e && 'message' in e ? String((e as Error).message) : 'Liste indisponible')
          setOptions([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [editing, workspaceId])

  const query = local.trim()
  const qKey = normalizeDirectionComparisonKey(local)

  const filtered = useMemo(() => {
    if (!qKey) return options
    return options.filter((d) => {
      const nom = d.nom ?? ''
      return (
        nom.toLowerCase().includes(qKey) ||
        directionDisplayNamesMatch(local, nom)
      )
    })
  }, [options, local, qKey])

  const exactMatch = useMemo(
    () => options.find((d) => directionDisplayNamesMatch(local, d.nom ?? '')),
    [options, local],
  )

  const showCreateHint = Boolean(query) && !exactMatch

  function commit(next?: string) {
    const v = (next ?? local).trim()
    if (v !== value.trim()) onCommit(v)
    setEditing(false)
  }

  function cancel() {
    setLocal(value)
    setEditing(false)
  }

  function pickDirection(d: Direction) {
    const nom = d.nom?.trim() ?? ''
    setLocal(nom)
    onCommit(nom)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="psd-inline psd-inline--read"
        onClick={() => {
          setLocal(value)
          setEditing(true)
        }}
      >
        <span className="psd-inline-label">{label}</span>
        <span className="psd-inline-value">
          {value || '—'}
          <span className="psd-pencil" aria-hidden>
            ✎
          </span>
        </span>
      </button>
    )
  }

  return (
    <div className="psd-inline psd-inline--edit psd-dir-picker">
      <span className="psd-inline-label" id={labelId}>
        {label}
      </span>
      <div className="psd-inline-row psd-dir-picker-row">
        <input
          ref={inputRef}
          className="psd-inline-input"
          aria-labelledby={labelId}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded="true"
          role="combobox"
          value={local}
          placeholder="Rechercher ou saisir une direction…"
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
            if (e.key === 'Escape') cancel()
          }}
        />
        <button type="button" className="psd-inline-ok" onClick={() => commit()} aria-label="Valider">
          ✓
        </button>
        <button type="button" className="psd-inline-x" onClick={cancel} aria-label="Annuler">
          ✗
        </button>
      </div>
      <p className="psd-dir-picker-hint">
        Choisissez une direction existante ou saisissez un nouveau nom : une entrée sera créée à l’enregistrement si besoin.
      </p>
      {loading ? <p className="psd-dir-picker-meta">Chargement des directions…</p> : null}
      {loadError ? <p className="psd-dir-picker-err">{loadError}</p> : null}
      <div
        id={listId}
        className="psd-dir-picker-list"
        role="listbox"
        aria-label="Directions du workspace"
      >
        {filtered.length === 0 && !loading && query ? (
          <div className="psd-dir-picker-empty">Aucune direction ne correspond à « {local} ». Vous pourrez créer ce libellé à l’enregistrement.</div>
        ) : null}
        {filtered.map((d) => (
          <button
            key={d.id}
            type="button"
            role="option"
            className="psd-dir-picker-item"
            onClick={() => pickDirection(d)}
          >
            {d.nom}
          </button>
        ))}
      </div>
      {showCreateHint ? (
        <p className="psd-dir-picker-new">
          Nouveau libellé : <strong>{query}</strong> — sera créé dans l’espace si vous enregistrez le profil.
        </p>
      ) : null}
    </div>
  )
}
