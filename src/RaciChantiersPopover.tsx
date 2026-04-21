import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'
import type { Direction, RaciChantier, RaciChantierEntiteType } from './lib/types'
import CreateDirectionDialog from './CreateDirectionDialog'
import type { CanonicalStakeholder, PopoverState, StakeholderKey } from './pciMatrixTypes'
import { stakeholderKey } from './pciMatrixTypes'

type PciRole = 'pilote' | 'contributeur' | 'informe' | null

export type RaciPopoverProps = {
  state: Extract<PopoverState, { kind: 'cell' | 'new-stakeholder' | 'stakeholder-edit' }>
  workspaceDirections: Direction[]
  existingStakeholders: CanonicalStakeholder[]
  raciByChantier: Record<string, RaciChantier[]>
  workspaceId: string
  saving: boolean
  onClose: () => void
  onSave: (
    chantierId: string,
    existingRow: RaciChantier | null,
    input: {
      entite_type: RaciChantierEntiteType
      entite_nom: string
      direction_id: string | null
      personne_nom: string | null
      is_pilote: boolean
      is_contributeur: boolean
      is_informe: boolean
      motivation: string | null
    },
  ) => Promise<void>
  onDelete: (row: RaciChantier) => Promise<void>
  onAddEphemeral: (input: {
    entite_type: RaciChantierEntiteType
    entite_nom: string
    direction_id: string | null
    personne_nom: string | null
  }) => void
  onBulkUpdateStakeholder: (
    oldKey: StakeholderKey,
    input: {
      entite_type: RaciChantierEntiteType
      entite_nom: string
      direction_id: string | null
      personne_nom: string | null
    },
  ) => Promise<void>
  onBulkDeleteStakeholder: (key: StakeholderKey) => Promise<void>
  onDirectionCreated?: (direction: Direction) => void | Promise<void>
}

function initialRole(row: RaciChantier | null): PciRole {
  if (!row) return null
  if (row.is_pilote) return 'pilote'
  if (row.is_contributeur) return 'contributeur'
  if (row.is_informe) return 'informe'
  return null
}

export function RaciPopover({
  state,
  workspaceDirections,
  existingStakeholders,
  raciByChantier,
  workspaceId,
  saving,
  onClose,
  onSave,
  onDelete,
  onAddEphemeral,
  onBulkUpdateStakeholder,
  onBulkDeleteStakeholder,
  onDirectionCreated,
  forwardedRef,
}: RaciPopoverProps & { forwardedRef: RefObject<HTMLDivElement | null> }) {
  const existingRow = state.kind === 'cell' ? state.existingRow : null
  const editedStakeholder = useMemo<CanonicalStakeholder | null>(() => {
    if (state.kind === 'cell') return existingStakeholders.find((s) => s.key === state.stakeholderKey) ?? null
    if (state.kind === 'stakeholder-edit')
      return existingStakeholders.find((s) => s.key === state.stakeholderKey) ?? null
    return null
  }, [state, existingStakeholders])

  // Dans le mode cellule, on "verrouille" l'identité de la colonne pour éviter d'en créer une nouvelle par erreur —
  // la modification de l'identité se fait volontairement via l'en-tête (mode stakeholder-edit).
  const lockedStakeholder = state.kind === 'cell' ? editedStakeholder : null

  const isRoleHidden = state.kind === 'new-stakeholder' || state.kind === 'stakeholder-edit'
  const isBulkEditMode = state.kind === 'stakeholder-edit'

  const [entiteType, setEntiteType] = useState<RaciChantierEntiteType>(
    existingRow?.entite_type ?? editedStakeholder?.entite_type ?? 'direction',
  )
  const [directionId, setDirectionId] = useState<string | null>(
    existingRow?.direction_id ?? editedStakeholder?.direction_id ?? null,
  )
  const [entiteNom, setEntiteNom] = useState<string>(
    existingRow?.entite_nom ?? editedStakeholder?.entite_nom ?? '',
  )
  const [personneNom, setPersonneNom] = useState<string>(
    existingRow?.personne_nom ?? editedStakeholder?.personne_nom ?? '',
  )
  const [role, setRole] = useState<PciRole>(initialRole(existingRow))
  const [motivation, setMotivation] = useState<string>(existingRow?.motivation ?? '')
  const [createDirOpen, setCreateDirOpen] = useState<boolean>(false)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)

  const stakeholderLocked = Boolean(lockedStakeholder && !existingRow && state.kind === 'cell')

  const popoverResetKey =
    state.kind === 'cell'
      ? `c:${state.chantierId}:${state.stakeholderKey}`
      : state.kind === 'stakeholder-edit'
        ? `e:${state.stakeholderKey}`
        : `n:${state.chantierIdInitial ?? '_'}`

  useEffect(() => {
    setBulkDeleteConfirmOpen(false)
  }, [popoverResetKey])

  useEffect(() => {
    if (!bulkDeleteConfirmOpen) return
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setBulkDeleteConfirmOpen(false)
      }
    }
    document.addEventListener('keydown', onEsc, true)
    return () => document.removeEventListener('keydown', onEsc, true)
  }, [bulkDeleteConfirmOpen])

  const bulkDeletePreview = useMemo(() => {
    if (state.kind !== 'stakeholder-edit') return null
    const key = state.stakeholderKey
    let count = 0
    for (const list of Object.values(raciByChantier)) {
      for (const row of list) {
        if (stakeholderKey(row) === key) count++
      }
    }
    const canon = existingStakeholders.find((s) => s.key === key)
    const label = canon?.entite_nom ?? 'cette colonne'
    const personne = canon?.personne_nom ?? null
    const displayLabel = personne ? `${label} — ${personne}` : label
    return { displayLabel, count, key }
  }, [state, raciByChantier, existingStakeholders])

  useEffect(() => {
    if (entiteType !== 'direction') {
      setDirectionId(null)
    } else if (!directionId && entiteNom) {
      const match = workspaceDirections.find(
        (d) => d.nom.trim().toLowerCase() === entiteNom.trim().toLowerCase(),
      )
      if (match) setDirectionId(match.id)
    }
  }, [entiteType, directionId, entiteNom, workspaceDirections])

  // Collision Pilote sur le chantier courant (cas cell uniquement, warning non bloquant).
  const piloteConflict = useMemo<{ nom: string; personne: string | null } | null>(() => {
    if (state.kind !== 'cell') return null
    if (role !== 'pilote') return null
    const rows = raciByChantier[state.chantierId] ?? []
    const otherPilote = rows.find((r) => r.is_pilote && r.id !== existingRow?.id)
    if (!otherPilote) return null
    return { nom: otherPilote.entite_nom, personne: otherPilote.personne_nom }
  }, [state, role, raciByChantier, existingRow])

  /**
   * Détection de doublon d'entité (bloquant) :
   * - duplicate exact : une autre colonne avec même entite_type + même nom + même personne.
   * - duplicate sans personne : l'entité existe déjà mais la personne saisie est vide
   *   → on force l'utilisateur à préciser une personne pour lever l'ambiguïté.
   * Applique uniquement en modes 'new-stakeholder' et 'stakeholder-edit' (en cell l'identité est verrouillée).
   */
  const duplicateDetected = useMemo<'exact' | 'same-entity-no-person' | null>(() => {
    if (state.kind === 'cell') return null
    const nom = entiteNom.trim().toLowerCase()
    if (!nom) return null
    const personne = personneNom.trim().toLowerCase()
    const currentKey = [entiteType, nom, personne].join('|')
    const selfKey = state.kind === 'stakeholder-edit' ? state.stakeholderKey : null

    const sameEntityMatches = existingStakeholders.filter(
      (s) =>
        s.entite_type === entiteType &&
        s.entite_nom.trim().toLowerCase() === nom &&
        s.key !== selfKey,
    )
    if (sameEntityMatches.length === 0) return null

    const exact = sameEntityMatches.some(
      (s) => (s.personne_nom ?? '').trim().toLowerCase() === personne && s.key === currentKey,
    )
    if (exact) return 'exact'

    if (personne === '') return 'same-entity-no-person'
    return null
  }, [state, entiteType, entiteNom, personneNom, existingStakeholders])

  const disabled = useMemo(() => {
    const nom = entiteNom.trim()
    if (!nom) return true
    if (duplicateDetected) return true
    if (isRoleHidden) return false
    return role === null
  }, [entiteNom, role, isRoleHidden, duplicateDetected])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (disabled) return
      const nom = entiteNom.trim()
      const personne = personneNom.trim() || null
      const effectiveDirectionId = entiteType === 'direction' ? directionId : null

      if (state.kind === 'new-stakeholder') {
        onAddEphemeral({
          entite_type: entiteType,
          entite_nom: nom,
          direction_id: effectiveDirectionId,
          personne_nom: personne,
        })
        return
      }

      if (state.kind === 'stakeholder-edit') {
        await onBulkUpdateStakeholder(state.stakeholderKey, {
          entite_type: entiteType,
          entite_nom: nom,
          direction_id: effectiveDirectionId,
          personne_nom: personne,
        })
        return
      }

      const chantierId = state.chantierId
      if (!chantierId) {
        alert('Aucun chantier cible pour créer la partie prenante.')
        return
      }

      await onSave(chantierId, existingRow, {
        entite_type: entiteType,
        entite_nom: nom,
        direction_id: effectiveDirectionId,
        personne_nom: personne,
        is_pilote: role === 'pilote',
        is_contributeur: role === 'contributeur',
        is_informe: role === 'informe',
        motivation: motivation.trim() || null,
      })
    },
    [
      disabled,
      onAddEphemeral,
      onBulkUpdateStakeholder,
      state,
      entiteType,
      entiteNom,
      directionId,
      personneNom,
      role,
      motivation,
      existingRow,
      onSave,
    ],
  )

  const handleDirectionSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value
      if (value === '__NEW__') {
        setCreateDirOpen(true)
        return
      }
      const id = value || null
      setDirectionId(id)
      const match = workspaceDirections.find((d) => d.id === id)
      if (match) setEntiteNom(match.nom)
    },
    [workspaceDirections],
  )

  const headerTitle = isBulkEditMode
    ? 'Modifier la partie prenante (en-tête de colonne)'
    : existingRow
      ? 'Modifier la partie prenante'
      : state.kind === 'new-stakeholder'
        ? 'Ajouter une partie prenante'
        : lockedStakeholder
          ? 'Impliquer cette partie prenante'
          : 'Ajouter une partie prenante'

  function dismissOrClose() {
    if (bulkDeleteConfirmOpen) setBulkDeleteConfirmOpen(false)
    else onClose()
  }

  return (
    <div className="rcm-popover-backdrop">
      <div ref={forwardedRef} className="rcm-popover-wrap">
        <div className="rcm-popover" role="dialog" aria-label="Éditer partie prenante">
          <div className="rcm-popover-body">
            <header className="rcm-popover-header">
              <h4>{headerTitle}</h4>
              <button type="button" className="rcm-popover-close" onClick={dismissOrClose} aria-label="Fermer">
                ×
              </button>
            </header>

            <form onSubmit={handleSubmit} className="rcm-popover-form">
          <fieldset className="rcm-popover-fieldset" disabled={stakeholderLocked}>
            <legend className="rcm-popover-legend">Partie prenante</legend>

            <label className="rcm-field">
              <span>Type d'entité</span>
              <select
                value={entiteType}
                onChange={(e) => setEntiteType(e.target.value as RaciChantierEntiteType)}
              >
                <option value="direction">Direction</option>
                <option value="autre">Autre</option>
              </select>
            </label>

            {entiteType === 'direction' ? (
              <label className="rcm-field">
                <span>Direction</span>
                <select value={directionId ?? ''} onChange={handleDirectionSelectChange}>
                  <option value="">— Choisir —</option>
                  {workspaceDirections.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nom}
                    </option>
                  ))}
                  <option value="__NEW__">+ Créer une nouvelle direction…</option>
                </select>
              </label>
            ) : (
              <label className="rcm-field">
                <span>Nom de l'entité</span>
                <input
                  type="text"
                  value={entiteNom}
                  onChange={(e) => setEntiteNom(e.target.value)}
                  placeholder="ex. Cabinet XX, Comité pilotage…"
                />
              </label>
            )}

            <label className="rcm-field">
              <span>Personne (optionnel)</span>
              <input
                type="text"
                value={personneNom}
                onChange={(e) => setPersonneNom(e.target.value)}
                placeholder="Prénom NOM"
              />
            </label>

            {duplicateDetected === 'exact' && (
              <p className="rcm-warning-inline rcm-warning-inline--error" role="alert">
                ⛔ Une colonne avec cette entité et cette personne existe déjà. Modifiez l'un des champs pour lever le doublon.
              </p>
            )}
            {duplicateDetected === 'same-entity-no-person' && (
              <p className="rcm-warning-inline" role="alert">
                ⚠ L'entité <strong>{entiteNom.trim()}</strong> existe déjà en tant que colonne. Précisez une personne (Prénom NOM) pour distinguer cette partie prenante.
              </p>
            )}
          </fieldset>

          {!isRoleHidden && (
            <>
              <fieldset className="rcm-popover-fieldset">
                <legend className="rcm-popover-legend">Rôle sur ce chantier</legend>
                <div className="rcm-role-radios" role="radiogroup" aria-label="Rôle PCI">
                  <label className={`rcm-role-check ${role === 'pilote' ? 'rcm-role-check--on' : ''}`}>
                    <input
                      type="radio"
                      name="rcm-pci-role"
                      checked={role === 'pilote'}
                      onChange={() => setRole('pilote')}
                    />
                    <span className="rcm-role-pill rcm-role-pill--p">P</span>
                    Pilote
                  </label>
                  <label className={`rcm-role-check ${role === 'contributeur' ? 'rcm-role-check--on' : ''}`}>
                    <input
                      type="radio"
                      name="rcm-pci-role"
                      checked={role === 'contributeur'}
                      onChange={() => setRole('contributeur')}
                    />
                    <span className="rcm-role-pill rcm-role-pill--c">C</span>
                    Contributeur
                  </label>
                  <label className={`rcm-role-check ${role === 'informe' ? 'rcm-role-check--on' : ''}`}>
                    <input
                      type="radio"
                      name="rcm-pci-role"
                      checked={role === 'informe'}
                      onChange={() => setRole('informe')}
                    />
                    <span className="rcm-role-pill rcm-role-pill--i">I</span>
                    Informé
                  </label>
                </div>
                {piloteConflict && (
                  <p className="rcm-warning-inline" role="alert">
                    ⚠ Il y a déjà un Pilote sur ce chantier :{' '}
                    <strong>
                      {piloteConflict.nom}
                      {piloteConflict.personne ? ` — ${piloteConflict.personne}` : ''}
                    </strong>
                    . Un co-pilotage est possible ; assurez-vous que c'est intentionnel.
                  </p>
                )}
              </fieldset>

              <label className="rcm-field">
                <span>Motivation (optionnel)</span>
                <textarea
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  rows={3}
                  placeholder="Pourquoi cette partie prenante est impliquée sur ce chantier ?"
                />
              </label>
            </>
          )}

          <footer className="rcm-popover-footer">
            {existingRow && (
              <button
                type="button"
                className="rcm-btn rcm-btn--danger"
                onClick={() => onDelete(existingRow)}
                disabled={saving}
              >
                Retirer du chantier
              </button>
            )}
            {isBulkEditMode && (
              <button
                type="button"
                className="rcm-btn rcm-btn--danger"
                onClick={() => setBulkDeleteConfirmOpen(true)}
                disabled={saving || bulkDeleteConfirmOpen}
                title="Supprime la colonne et toutes les implications P/C/I associées"
              >
                Supprimer la colonne
              </button>
            )}
            <button type="button" className="rcm-btn" onClick={dismissOrClose} disabled={saving}>
              Annuler
            </button>
            <button type="submit" className="rcm-btn rcm-btn--primary" disabled={disabled || saving}>
              {saving
                ? 'Enregistrement…'
                : state.kind === 'new-stakeholder'
                  ? 'Créer la colonne'
                  : 'Enregistrer'}
            </button>
          </footer>
            </form>
          </div>

          {bulkDeleteConfirmOpen && bulkDeletePreview && (
            <div
              className="rcm-popover-confirm-layer"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="rcm-bulk-delete-title"
              aria-describedby="rcm-bulk-delete-desc"
            >
              <div className="rcm-popover-confirm-card">
                <h5 id="rcm-bulk-delete-title">Supprimer cette colonne ?</h5>
                <p id="rcm-bulk-delete-desc">
                  {bulkDeletePreview.count > 0 ? (
                    <>
                      La colonne <strong>{bulkDeletePreview.displayLabel}</strong> sera retirée.{' '}
                      <strong>{bulkDeletePreview.count}</strong> implication
                      {bulkDeletePreview.count > 1 ? 's' : ''} sur les chantiers (rôles P/C/I, motivations) seront
                      effacées. Cette action est irréversible.
                    </>
                  ) : (
                    <>
                      La colonne <strong>{bulkDeletePreview.displayLabel}</strong> sera retirée de la grille. Aucune
                      implication n'est encore enregistrée en base pour cette partie prenante.
                    </>
                  )}
                </p>
                <div className="rcm-popover-confirm-actions">
                  <button
                    type="button"
                    className="rcm-btn"
                    onClick={() => setBulkDeleteConfirmOpen(false)}
                    disabled={saving}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="rcm-btn rcm-btn--danger"
                    onClick={() => void onBulkDeleteStakeholder(bulkDeletePreview.key)}
                    disabled={saving}
                  >
                    Supprimer définitivement
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <CreateDirectionDialog
          open={createDirOpen}
          workspaceId={workspaceId}
          existingDirections={workspaceDirections}
          onClose={() => setCreateDirOpen(false)}
          onResolved={async (dir) => {
            setDirectionId(dir.id)
            setEntiteNom(dir.nom)
            if (onDirectionCreated) await onDirectionCreated(dir)
          }}
        />
      </div>
    </div>
  )
}
