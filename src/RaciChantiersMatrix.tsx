import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Chantier, Direction, RaciChantier, RaciChantierEntiteType } from './lib/types'
import {
  createRaciChantier,
  deleteRaciChantier,
  getRaciChantiersForProjet,
  updateRaciChantier,
} from './lib/api/raci-chantiers'
import CreateDirectionDialog from './CreateDirectionDialog'

/**
 * REF-7b.1 — Matrice PCI (Pilote / Contributeur / Informé) par chantier.
 *
 * Layout : matrice globale unifiée (option B validée par Yogan).
 * - Colonnes = union canonique des parties prenantes de tous les chantiers du projet
 *   (regroupement côté client par `(entite_type, entite_nom, personne_nom)`).
 * - Lignes = chantiers du projet, dans l'ordre d'affichage de MaturityRoadmap.
 * - Cellules vides cliquables : ouvrent le popover unifié qui permet de renseigner
 *   P/C/I + motivation, et aussi les champs partie prenante si la colonne est en cours de création.
 * - Tri alphabétique des colonnes par `entite_nom` puis `personne_nom` (option Yogan).
 */

export type RaciChantiersMatrixProps = {
  /** Chantiers affichés dans la matrice (dans leur ordre d'affichage MaturityRoadmap). */
  chantiers: Chantier[]
  /** Directions du workspace — alimente le select "Entité" quand entite_type === 'direction'. */
  workspaceDirections: Direction[]
  /** Si true, toute édition est désactivée (mode lecture seule / reviewer). */
  readOnly?: boolean
  /** id du projet pour la clé de cache API (recalculée quand le projet change). */
  projet_id: string
  /** Workspace id — nécessaire pour créer une direction inline depuis le popover. */
  workspaceId: string
  /** Callback après création d'une nouvelle direction inline (le parent doit recharger sa liste). */
  onDirectionCreated?: (direction: Direction) => void | Promise<void>
}

type StakeholderKey = string

type CanonicalStakeholder = {
  key: StakeholderKey
  entite_type: RaciChantierEntiteType
  entite_nom: string
  direction_id: string | null
  personne_nom: string | null
  user_id: string | null
}

type PopoverState =
  | { kind: 'closed' }
  | {
      kind: 'cell'
      chantierId: string
      stakeholderKey: StakeholderKey
      existingRow: RaciChantier | null
    }
  | { kind: 'new-stakeholder'; chantierIdInitial: string | null }
  | { kind: 'stakeholder-edit'; stakeholderKey: StakeholderKey }

function stakeholderKey(row: Pick<RaciChantier, 'entite_type' | 'entite_nom' | 'personne_nom'>): StakeholderKey {
  return [row.entite_type, row.entite_nom.trim().toLowerCase(), (row.personne_nom ?? '').trim().toLowerCase()].join('|')
}

function buildCanonicalFromRow(row: RaciChantier): CanonicalStakeholder {
  return {
    key: stakeholderKey(row),
    entite_type: row.entite_type,
    entite_nom: row.entite_nom,
    direction_id: row.direction_id,
    personne_nom: row.personne_nom,
    user_id: row.user_id,
  }
}

function sortCanonical(a: CanonicalStakeholder, b: CanonicalStakeholder): number {
  const nomCmp = a.entite_nom.localeCompare(b.entite_nom, 'fr', { sensitivity: 'base' })
  if (nomCmp !== 0) return nomCmp
  return (a.personne_nom ?? '').localeCompare(b.personne_nom ?? '', 'fr', { sensitivity: 'base' })
}

function roleBadge(row: RaciChantier): { letter: 'P' | 'C' | 'I' | '·'; title: string } {
  if (row.is_pilote) return { letter: 'P', title: 'Pilote' }
  if (row.is_contributeur) return { letter: 'C', title: 'Contributeur' }
  if (row.is_informe) return { letter: 'I', title: 'Informé' }
  return { letter: '·', title: 'Aucun rôle' }
}

export default function RaciChantiersMatrix({
  chantiers,
  workspaceDirections,
  readOnly = false,
  projet_id,
  workspaceId,
  onDirectionCreated,
}: RaciChantiersMatrixProps) {
  const [raciByChantier, setRaciByChantier] = useState<Record<string, RaciChantier[]>>({})
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [popover, setPopover] = useState<PopoverState>({ kind: 'closed' })
  const popoverRef = useRef<HTMLDivElement | null>(null)
  /**
   * Colonnes "éphémères" créées via le bouton "+ Ajouter" (mode stakeholder-only, cf. REF-7b.1 fix 3).
   * Non persistées : une colonne sans aucun rôle coché sur aucune cellule disparaît au refresh.
   * Dès qu'un rôle est coché sur une cellule, la row DB est créée et la key rejoint `raciByChantier` —
   * la clé canonique étant identique (entite_type|entite_nom|personne_nom), pas de doublon colonne.
   */
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
      const map = await getRaciChantiersForProjet(projet_id, chantierIds)
      setRaciByChantier(map)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erreur de chargement RACI chantiers')
    } finally {
      setLoading(false)
    }
  }, [chantierIds, projet_id])

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

  // Nettoie les éphémères qui sont désormais persistés (même key dans raciByChantier).
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

  /**
   * REF-7b.1 — mise à jour du header de colonne (entité / personne / type) qui se propage
   * à toutes les rows DB partageant la key canonique actuelle + au pending local éventuel.
   */
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

  /**
   * REF-7b.1 — suppression d'une colonne entière (entête partie prenante).
   * Supprime toutes les rows DB partageant la key canonique + purge le pending éphémère.
   */
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
    [raciByChantier, pendingStakeholders, reload, closePopover],
  )

  /**
   * REF-7b.1 fix 3 — création d'une colonne partie prenante "éphémère" (pas de call DB).
   * La colonne apparaît dans la matrice ; la row DB ne sera créée que quand un rôle
   * sera coché dans une cellule de cette colonne.
   */
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
      // Garde-fou : si une modale surimposee est ouverte (ex. CreateDirectionDialog),
      // on n'intercepte pas les clics qui la concernent.
      const stackedModal = document.querySelector('.mr-modal-overlay--stack')
      if (stackedModal && stackedModal.contains(e.target as Node)) return
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        closePopover()
      }
    }
    function onEsc(e: KeyboardEvent) {
      // Si une modale surimposee gere deja Escape, on ne ferme pas la popin en cascade.
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

  return (
    <section className="rcm" aria-label="Matrice RACI par chantier">
      <header className="rcm-header">
        <h3 className="rcm-title">
          Matrice PCI <span className="rcm-title-sub">Pilote / Contributeur / Informé</span>
        </h3>
        <p className="rcm-hint">
          Cliquez sur une cellule pour éditer, ou sur <strong>+ Ajouter</strong> pour créer une nouvelle partie prenante.
        </p>
      </header>

      {loadError && <p className="rcm-error">{loadError}</p>}

      <div className="rcm-table-wrap">
        <table className="rcm-table">
          <thead>
            <tr>
              <th className="rcm-col-chantier">Chantier</th>
              {canonicalStakeholders.map((s) => (
                <th
                  key={s.key}
                  className={`rcm-col-stakeholder ${readOnly ? '' : 'rcm-col-stakeholder--editable'}`}
                  title={readOnly ? s.personne_nom ?? undefined : 'Cliquer pour modifier cette partie prenante'}
                  onClick={readOnly ? undefined : () => openEditStakeholder(s.key)}
                  role={readOnly ? undefined : 'button'}
                  tabIndex={readOnly ? -1 : 0}
                  onKeyDown={(e) => {
                    if (readOnly) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openEditStakeholder(s.key)
                    }
                  }}
                >
                  <span className="rcm-stakeholder-nom">{s.entite_nom}</span>
                  {s.personne_nom && <span className="rcm-stakeholder-personne">{s.personne_nom}</span>}
                </th>
              ))}
              {!readOnly && (
                <th className="rcm-col-add">
                  <button
                    type="button"
                    className="rcm-add-btn"
                    onClick={() => openNewStakeholder(chantiers[0]?.id ?? null)}
                    disabled={chantiers.length === 0}
                    title="Ajouter une partie prenante"
                  >
                    + Ajouter
                  </button>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {chantiers.length === 0 && (
              <tr>
                <td className="rcm-empty" colSpan={canonicalStakeholders.length + (readOnly ? 1 : 2)}>
                  Aucun chantier affiché.
                </td>
              </tr>
            )}
            {chantiers.map((c) => (
              <tr key={c.id}>
                <th scope="row" className="rcm-row-title" title={c.description ?? undefined}>
                  {c.nom}
                </th>
                {canonicalStakeholders.map((s) => {
                  const row = getRowFor(c.id, s.key)
                  const badge = row ? roleBadge(row) : null
                  const roles: string[] = []
                  if (row?.is_pilote) roles.push('P')
                  if (row?.is_contributeur) roles.push('C')
                  if (row?.is_informe) roles.push('I')
                  return (
                    <td
                      key={s.key}
                      className={`rcm-cell ${row ? 'rcm-cell--filled' : 'rcm-cell--empty'} ${readOnly ? 'rcm-cell--readonly' : ''}`}
                      onClick={() => openCell(c.id, s.key)}
                      title={row?.motivation ?? (badge ? badge.title : 'Cliquer pour impliquer cette partie prenante')}
                      role={readOnly ? undefined : 'button'}
                      tabIndex={readOnly ? -1 : 0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openCell(c.id, s.key)
                        }
                      }}
                    >
                      {roles.length > 0 ? (
                        <span className="rcm-cell-roles">
                          {roles.map((r) => (
                            <span key={r} className={`rcm-role rcm-role--${r.toLowerCase()}`}>
                              {r}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="rcm-cell-empty-dot" aria-hidden>
                          ·
                        </span>
                      )}
                    </td>
                  )
                })}
                {!readOnly && (
                  <td className="rcm-cell rcm-cell--add-target" onClick={() => openNewStakeholder(c.id)} role="button" tabIndex={0}>
                    <span className="rcm-add-inline" aria-hidden>
                      +
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <p className="rcm-loading">Chargement…</p>}

      {popover.kind !== 'closed' && (
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
      )}
    </section>
  )
}

type PciRole = 'pilote' | 'contributeur' | 'informe' | null

type RaciPopoverProps = {
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

function RaciPopover({
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
}: RaciPopoverProps & { forwardedRef: React.RefObject<HTMLDivElement | null> }) {
  const existingRow = state.kind === 'cell' ? state.existingRow : null
  const editedStakeholder = useMemo<CanonicalStakeholder | null>(() => {
    if (state.kind === 'cell') return existingStakeholders.find((s) => s.key === state.stakeholderKey) ?? null
    if (state.kind === 'stakeholder-edit')
      return existingStakeholders.find((s) => s.key === state.stakeholderKey) ?? null
    return null
  }, [state, existingStakeholders])

  // Dans le mode cellule, on "verrouille" l'identité de la colonne pour éviter d'en créer une nouvelle par erreur —
  // la modification de l'identité se fait volontairement via l'entête (mode stakeholder-edit).
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
   * - duplicate sans personne : l'entité existe deja mais la personne saisie est vide
   *   → on force l'utilisateur a preciser une personne pour lever l'ambiguite.
   * Applique uniquement en modes 'new-stakeholder' et 'stakeholder-edit' (en cell l'identite est verrouillee).
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
    ? 'Modifier la partie prenante (entête de colonne)'
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
                      implication n’est encore enregistrée en base pour cette partie prenante.
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
