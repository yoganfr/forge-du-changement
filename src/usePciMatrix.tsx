import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Chantier, Direction, RaciChantier, RaciChantierEntiteType } from './lib/types'
import {
  createRaciChantier,
  deleteRaciChantier,
  getRaciChantiersByChantierIds,
  getRaciChantiersForProjet,
  updateRaciChantier,
} from './lib/api/raci-chantiers'
import { RaciPopover } from './RaciChantiersPopover'
import type { CanonicalStakeholder, PopoverState, StakeholderKey } from './pciMatrixTypes'
import { buildCanonicalFromRow, sortCanonical, stakeholderKey } from './pciMatrixTypes'

export type UsePciMatrixParams = {
  workspaceId: string
  workspaceDirections: Direction[]
  readOnly?: boolean
  onDirectionCreated?: (direction: Direction) => void | Promise<void>
} & (
  | { loadMode: 'projet'; projet_id: string; chantiers: Chantier[] }
  | { loadMode: 'roadmap'; chantiers: Chantier[] }
)

export type UsePciMatrixResult = {
  chantiers: Chantier[]
  raciByChantier: Record<string, RaciChantier[]>
  canonicalStakeholders: CanonicalStakeholder[]
  loading: boolean
  loadError: string | null
  saving: boolean
  readOnly: boolean
  firstChantierId: string | null
  getRowFor: (chantierId: string, key: StakeholderKey) => RaciChantier | null
  openCell: (chantierId: string, key: StakeholderKey) => void
  openNewStakeholder: (chantierIdInitial: string | null) => void
  openEditStakeholder: (key: StakeholderKey) => void
  reload: () => Promise<void>
  popoverNode: ReactNode
  workspaceId: string
  workspaceDirections: Direction[]
}

export function usePciMatrix(params: UsePciMatrixParams): UsePciMatrixResult {
  const { workspaceId, workspaceDirections, readOnly = false, onDirectionCreated } = params
  const chantiers = params.chantiers
  const projetId = params.loadMode === 'projet' ? params.projet_id : null

  const [raciByChantier, setRaciByChantier] = useState<Record<string, RaciChantier[]>>({})
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [popover, setPopover] = useState<PopoverState>({ kind: 'closed' })
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [pendingStakeholders, setPendingStakeholders] = useState<CanonicalStakeholder[]>([])

  const chantierIds = useMemo(() => chantiers.map((c) => c.id), [chantiers])

  const reload = useCallback(async () => {
    if (chantierIds.length === 0) {
      setRaciByChantier({})
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const map =
        params.loadMode === 'projet' && projetId
          ? await getRaciChantiersForProjet(projetId, chantierIds)
          : await getRaciChantiersByChantierIds(chantierIds)
      setRaciByChantier(map)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erreur de chargement RACI chantiers')
    } finally {
      setLoading(false)
    }
  }, [chantierIds, params.loadMode, projetId])

  useEffect(() => {
    void reload()
  }, [reload])

  const canonicalStakeholders = useMemo<CanonicalStakeholder[]>(() => {
    const byKey = new Map<StakeholderKey, CanonicalStakeholder>()
    for (const list of Object.values(raciByChantier)) {
      for (const row of list) {
        const canonical = buildCanonicalFromRow(row)
        if (!byKey.has(canonical.key)) byKey.set(canonical.key, canonical)
      }
    }
    for (const pending of pendingStakeholders) {
      if (!byKey.has(pending.key)) byKey.set(pending.key, pending)
    }
    return [...byKey.values()].sort(sortCanonical)
  }, [raciByChantier, pendingStakeholders])

  useEffect(() => {
    if (pendingStakeholders.length === 0) return
    const dbKeys = new Set<StakeholderKey>()
    for (const list of Object.values(raciByChantier)) {
      for (const row of list) dbKeys.add(stakeholderKey(row))
    }
    const nextPending = pendingStakeholders.filter((p) => !dbKeys.has(p.key))
    if (nextPending.length !== pendingStakeholders.length) {
      setPendingStakeholders(nextPending)
    }
  }, [raciByChantier, pendingStakeholders])

  const getRowFor = useCallback(
    (chantierId: string, key: StakeholderKey): RaciChantier | null => {
      const rows = raciByChantier[chantierId] ?? []
      return rows.find((r) => stakeholderKey(r) === key) ?? null
    },
    [raciByChantier],
  )

  const openCell = useCallback(
    (chantierId: string, key: StakeholderKey) => {
      if (readOnly) return
      const existingRow = getRowFor(chantierId, key)
      setPopover({ kind: 'cell', chantierId, stakeholderKey: key, existingRow })
    },
    [readOnly, getRowFor],
  )

  const openNewStakeholder = useCallback(
    (chantierIdInitial: string | null) => {
      if (readOnly) return
      setPopover({ kind: 'new-stakeholder', chantierIdInitial })
    },
    [readOnly],
  )

  const openEditStakeholder = useCallback(
    (key: StakeholderKey) => {
      if (readOnly) return
      setPopover({ kind: 'stakeholder-edit', stakeholderKey: key })
    },
    [readOnly],
  )

  const closePopover = useCallback(() => setPopover({ kind: 'closed' }), [])

  const handleSaveRow = useCallback(
    async (
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
    ) => {
      setSaving(true)
      try {
        if (existingRow) {
          await updateRaciChantier(existingRow.id, input)
        } else {
          await createRaciChantier({ chantier_id: chantierId, ...input })
        }
        await reload()
        closePopover()
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erreur enregistrement RACI')
      } finally {
        setSaving(false)
      }
    },
    [reload, closePopover],
  )

  const handleBulkUpdateStakeholder = useCallback(
    async (
      oldKey: StakeholderKey,
      input: {
        entite_type: RaciChantierEntiteType
        entite_nom: string
        direction_id: string | null
        personne_nom: string | null
      },
    ) => {
      setSaving(true)
      try {
        const affected: RaciChantier[] = []
        for (const list of Object.values(raciByChantier)) {
          for (const row of list) {
            if (stakeholderKey(row) === oldKey) affected.push(row)
          }
        }
        for (const row of affected) {
          await updateRaciChantier(row.id, {
            entite_type: input.entite_type,
            entite_nom: input.entite_nom,
            direction_id: input.direction_id,
            personne_nom: input.personne_nom,
          })
        }
        setPendingStakeholders((prev) =>
          prev.map((p) => {
            if (p.key !== oldKey) return p
            const newKey = stakeholderKey({
              entite_type: input.entite_type,
              entite_nom: input.entite_nom,
              personne_nom: input.personne_nom,
            })
            return {
              key: newKey,
              entite_type: input.entite_type,
              entite_nom: input.entite_nom,
              direction_id: input.direction_id,
              personne_nom: input.personne_nom,
              user_id: p.user_id,
            }
          }),
        )
        await reload()
        closePopover()
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erreur mise à jour de la partie prenante')
      } finally {
        setSaving(false)
      }
    },
    [raciByChantier, reload, closePopover],
  )

  const handleBulkDeleteStakeholder = useCallback(
    async (key: StakeholderKey) => {
      const affected: RaciChantier[] = []
      for (const list of Object.values(raciByChantier)) {
        for (const row of list) {
          if (stakeholderKey(row) === key) affected.push(row)
        }
      }
      setSaving(true)
      try {
        for (const row of affected) {
          await deleteRaciChantier(row.id)
        }
        setPendingStakeholders((prev) => prev.filter((p) => p.key !== key))
        await reload()
        closePopover()
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erreur suppression de la colonne')
      } finally {
        setSaving(false)
      }
    },
    [raciByChantier, reload, closePopover],
  )

  const handleAddEphemeralStakeholder = useCallback(
    (input: {
      entite_type: RaciChantierEntiteType
      entite_nom: string
      direction_id: string | null
      personne_nom: string | null
    }) => {
      const key = stakeholderKey({
        entite_type: input.entite_type,
        entite_nom: input.entite_nom,
        personne_nom: input.personne_nom,
      })
      setPendingStakeholders((prev) => {
        if (prev.some((p) => p.key === key)) return prev
        return [
          ...prev,
          {
            key,
            entite_type: input.entite_type,
            entite_nom: input.entite_nom,
            direction_id: input.direction_id,
            personne_nom: input.personne_nom,
            user_id: null,
          },
        ]
      })
      closePopover()
    },
    [closePopover],
  )

  const handleDeleteRow = useCallback(
    async (row: RaciChantier) => {
      if (!window.confirm(`Retirer "${row.entite_nom}${row.personne_nom ? ` (${row.personne_nom})` : ''}" de ce chantier ?`)) return
      setSaving(true)
      try {
        await deleteRaciChantier(row.id)
        await reload()
        closePopover()
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erreur suppression partie prenante')
      } finally {
        setSaving(false)
      }
    },
    [reload, closePopover],
  )

  useEffect(() => {
    if (popover.kind === 'closed') return
    function onMouseDown(e: MouseEvent) {
      const stackedModal = document.querySelector('.mr-modal-overlay--stack')
      if (stackedModal && stackedModal.contains(e.target as Node)) return
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        closePopover()
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (document.querySelector('.mr-modal-overlay--stack')) return
      if (e.key === 'Escape') closePopover()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [popover.kind, closePopover])

  const firstChantierId = chantiers[0]?.id ?? null

  const popoverNode =
    popover.kind !== 'closed' ? (
      <RaciPopover
        forwardedRef={popoverRef}
        state={popover}
        workspaceDirections={workspaceDirections}
        saving={saving}
        existingStakeholders={canonicalStakeholders}
        raciByChantier={raciByChantier}
        workspaceId={workspaceId}
        onClose={closePopover}
        onSave={handleSaveRow}
        onDelete={handleDeleteRow}
        onAddEphemeral={handleAddEphemeralStakeholder}
        onBulkUpdateStakeholder={handleBulkUpdateStakeholder}
        onBulkDeleteStakeholder={handleBulkDeleteStakeholder}
        onDirectionCreated={onDirectionCreated}
      />
    ) : null

  return {
    chantiers,
    raciByChantier,
    canonicalStakeholders,
    loading,
    loadError,
    saving,
    readOnly: readOnly ?? false,
    firstChantierId,
    getRowFor,
    openCell,
    openNewStakeholder,
    openEditStakeholder,
    reload,
    popoverNode,
    workspaceId,
    workspaceDirections,
  }
}
