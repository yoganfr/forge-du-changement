import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Axe, Direction, Jalon, JalonFacette, JalonStatut, RaciRole } from './lib/types'
import {
  createChantier,
  createJalon,
  deleteChantier,
  deleteJalon,
  getChantierJalons,
  getJalonRaci,
  getProjet,
  getProjetChantiers,
  getProjetJalons,
  getWorkspaceDirections,
  monthToQuarter,
  removeRaci,
  setRaci,
  updateChantier,
  updateJalon,
} from './lib/api'
import JalonQuickAddModal from './JalonQuickAddModal'
import RoadmapTimelineGrid from './RoadmapTimelineGrid'
import {
  defaultTargetMonthYearForColumn,
  UNSCHEDULED_KEY,
  type TimelineColumn,
} from './lib/roadmapTimelineColumns'
import { getRoadmapProjectColorHex } from './lib/projectRoadmapColor'
import './MaturityRoadmap.css'

const AXES: Axe[] = ['PROCESSUS', 'ORGANISATION', 'OUTILS', 'KPI']

const AXE_META: Record<
  Axe,
  { title: string; color: string }
> = {
  PROCESSUS: { title: '1. Processus métiers', color: '#8E3B46' },
  ORGANISATION: { title: '2. Organisation', color: '#4C86A8' },
  OUTILS: { title: '3. Outils IT', color: '#477890' },
  KPI: { title: "4. KPI's", color: '#B45309' },
}

const STATUT_LABEL: Record<JalonStatut, string> = {
  a_venir: 'À venir',
  en_cours: 'En cours',
  realise: 'Réalisé',
  bloque: 'Bloqué',
}

const FACETTE_OPTIONS: { value: JalonFacette; label: string }[] = [
  { value: 'CONCEPTUALISATION', label: 'Conceptualisation' },
  { value: 'FORMATION', label: 'Formation' },
  { value: 'ACQUISITION', label: 'Acquisition pratique' },
  { value: 'PRODUCTION', label: 'Production' },
  { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'AUTRE', label: 'Autre' },
]

function formatMonthYearShort(mois: number | null, annee: number | null): string {
  if (!mois || !annee) return '—'
  const d = new Date(annee, mois - 1, 1)
  const s = d.toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
  return s.replace(/\.$/, '')
}

function monthInQuarter(mois: number, q: 'Q1' | 'Q2' | 'Q3' | 'Q4'): boolean {
  if (mois < 1 || mois > 12) return false
  if (q === 'Q1') return mois <= 3
  if (q === 'Q2') return mois >= 4 && mois <= 6
  if (q === 'Q3') return mois >= 7 && mois <= 9
  return mois >= 10
}

function jalonMatchesFilters(
  j: Jalon,
  trimestre: 'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4',
  axe: 'all' | Axe,
  year: number,
): boolean {
  if (axe !== 'all' && j.axe !== axe) return false
  if (trimestre === 'all') return true
  if (!j.mois_cible || !j.annee_cible) return true
  if (j.annee_cible !== year) return false
  return monthInQuarter(j.mois_cible, trimestre)
}

export type MaturityRoadmapProps = {
  workspaceId: string
  projetId: string
  directionId: string
  readOnly?: boolean
  onBack: () => void
}

export default function MaturityRoadmap({
  workspaceId,
  projetId,
  directionId,
  readOnly = false,
  onBack,
}: MaturityRoadmapProps) {
  const [projetNom, setProjetNom] = useState('')
  const [directionNom, setDirectionNom] = useState('')
  const [chantiers, setChantiers] = useState<Awaited<ReturnType<typeof getProjetChantiers>>>([])
  const [jalonsByChantier, setJalonsByChantier] = useState<Record<string, Jalon[]>>({})
  const [directions, setDirections] = useState<Direction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trimestre, setTrimestre] = useState<'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('all')
  const [axeFilter, setAxeFilter] = useState<'all' | Axe>('all')
  const [filterYear, setFilterYear] = useState(() => new Date().getFullYear())
  const [editingChantierId, setEditingChantierId] = useState<string | null>(null)
  const [drawerJalonId, setDrawerJalonId] = useState<string | null>(null)
  const [drawerChantierId, setDrawerChantierId] = useState<string | null>(null)
  /** Jalon tout juste créé (évite un tiroir bloqué si le cache réseau était encore en cours). */
  const [drawerSeedJalon, setDrawerSeedJalon] = useState<Jalon | null>(null)
  const [quickAdd, setQuickAdd] = useState<{
    chantierId: string
    column: TimelineColumn | typeof UNSCHEDULED_KEY
  } | null>(null)
  const [quickAddSaving, setQuickAddSaving] = useState(false)

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear()
    return [y - 1, y, y + 1, y + 2]
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const p = await getProjet(projetId)
      if (p.type === 'BUILD' && !p.dg_validated_transfo) {
        setError(
          'Ce projet BUILD n’est pas validé par le DG pour la Maturity Roadmap. Ouvrez la Vue DG et validez-le dans « Projets BUILD soumis pour la roadmap ».',
        )
        return
      }
      const [dirs, chs] = await Promise.all([
        getWorkspaceDirections(workspaceId),
        getProjetChantiers(projetId),
      ])
      setProjetNom(p.nom)
      const dir = dirs.find((d) => d.id === directionId)
      setDirectionNom(dir?.nom ?? 'Direction')
      setDirections(dirs)
      setChantiers(chs)
      const jMap: Record<string, Jalon[]> = {}
      await Promise.all(
        chs.map(async (c) => {
          jMap[c.id] = await getChantierJalons(c.id)
        }),
      )
      setJalonsByChantier(jMap)
    } catch (e) {
      const msg =
        typeof e === 'object' && e && 'message' in e
          ? String((e as { message?: unknown }).message ?? '')
          : 'Erreur de chargement'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [projetId, workspaceId, directionId])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const directionById = useMemo(() => new Map(directions.map((d) => [d.id, d.nom])), [directions])

  const projetRoadmapColor = useMemo(() => getRoadmapProjectColorHex(projetId), [projetId])

  async function refreshChantierJalons(chantierId: string) {
    const list = await getChantierJalons(chantierId)
    setJalonsByChantier((prev) => ({ ...prev, [chantierId]: list }))
  }

  async function handleNewChantier() {
    if (readOnly) return
    const ordre = (chantiers.reduce((m, c) => Math.max(m, c.ordre), 0) || 0) + 1
    const c = await createChantier({
      projet_id: projetId,
      workspace_id: workspaceId,
      nom: 'Nouveau chantier',
      ordre,
    })
    setChantiers((prev) => [...prev, c].sort((a, b) => a.ordre - b.ordre || a.created_at.localeCompare(b.created_at)))
    setJalonsByChantier((prev) => ({ ...prev, [c.id]: [] }))
  }

  async function handleDeleteChantier(id: string) {
    if (readOnly) return
    if (!window.confirm('Supprimer ce chantier et tous ses jalons ?')) return
    await deleteChantier(id)
    setChantiers((prev) => prev.filter((c) => c.id !== id))
    setJalonsByChantier((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  async function handleSaveChantierName(id: string, nom: string) {
    if (readOnly) return
    const updated = await updateChantier(id, { nom })
    setChantiers((prev) => prev.map((c) => (c.id === id ? updated : c)))
    setEditingChantierId(null)
  }

  async function handleQuickAddSubmit(data: {
    nom: string
    axe: Axe
    mois_cible: number | null
    annee_cible: number | null
  }) {
    if (!quickAdd || readOnly) return
    const { chantierId } = quickAdd
    setQuickAddSaving(true)
    try {
      const j = await createJalon({
        chantier_id: chantierId,
        axe: data.axe,
        nom: data.nom,
        mois_cible: data.mois_cible,
        annee_cible: data.annee_cible,
        direction_id: directionId,
        projet_id: projetId,
        workspace_id: workspaceId,
      })
      setQuickAdd(null)
      setDrawerSeedJalon(j)
      setDrawerChantierId(chantierId)
      setDrawerJalonId(j.id)
      await refreshChantierJalons(chantierId)
    } catch (e) {
      const msg =
        typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message?: unknown }).message ?? '').trim()
          : ''
      window.alert(msg || 'Impossible de créer le jalon.')
    } finally {
      setQuickAddSaving(false)
    }
  }

  async function handleNewJalon(chantierId: string, axe: Axe) {
    if (readOnly) return
    try {
      const j = await createJalon({
        chantier_id: chantierId,
        axe,
        direction_id: directionId,
        projet_id: projetId,
        workspace_id: workspaceId,
      })
      setDrawerSeedJalon(j)
      setDrawerChantierId(chantierId)
      setDrawerJalonId(j.id)
      await refreshChantierJalons(chantierId)
    } catch (e) {
      const msg =
        typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message?: unknown }).message ?? '').trim()
          : ''
      window.alert(msg || 'Impossible de créer le jalon.')
    }
  }

  async function openDrawer(jalon: Jalon, chantierId: string) {
    setDrawerSeedJalon(null)
    setDrawerChantierId(chantierId)
    setDrawerJalonId(jalon.id)
  }

  function filteredJalons(list: Jalon[]): Jalon[] {
    return list.filter((j) => jalonMatchesFilters(j, trimestre, axeFilter, filterYear))
  }

  if (loading) {
    return (
      <div className="mr-root">
        <p className="mr-muted">Chargement de la roadmap…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mr-root">
        <button type="button" className="mr-back" onClick={onBack}>
          ← Retour aux projets
        </button>
        <div className="mr-error" role="alert">
          {error}
          <p className="mr-hint" style={{ marginTop: 8 }}>
            Vérifiez que le script SQL « maturity roadmap phase 1 » a bien été appliqué sur Supabase.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mr-root">
      <button type="button" className="mr-back" onClick={onBack}>
        ← Retour aux projets
      </button>
      <h1 className="mr-title">Maturity Roadmap — {projetNom}</h1>
      <p className="mr-sub">Direction : {directionNom}</p>

      <div className="mr-toolbar">
        <label>
          Axe
          <select value={axeFilter} onChange={(e) => setAxeFilter(e.target.value as typeof axeFilter)}>
            <option value="all">Tous</option>
            {AXES.map((a) => (
              <option key={a} value={a}>
                {AXE_META[a].title}
              </option>
            ))}
          </select>
        </label>
        {!readOnly && (
          <button type="button" className="mr-btn-primary" onClick={() => void handleNewChantier()}>
            + Nouveau chantier
          </button>
        )}
      </div>

      <RoadmapTimelineGrid
        chantiers={chantiers}
        jalonsByChantier={jalonsByChantier}
        axeFilter={axeFilter}
        readOnly={readOnly}
        legendProjects={[{ id: projetId, nom: projetNom || 'Projet', color: projetRoadmapColor }]}
        onOpenJalon={(j, chId) => void openDrawer(j, chId)}
        onQuickAddInCell={(chId, col) => setQuickAdd({ chantierId: chId, column: col })}
      />

      <JalonQuickAddModal
        open={quickAdd !== null}
        onClose={() => setQuickAdd(null)}
        chantierNom={chantiers.find((c) => c.id === quickAdd?.chantierId)?.nom ?? ''}
        echeanceLabel={
          quickAdd
            ? quickAdd.column === UNSCHEDULED_KEY
              ? 'Sans date'
              : quickAdd.column.label
            : ''
        }
        defaultMonthYear={
          quickAdd && quickAdd.column !== UNSCHEDULED_KEY
            ? defaultTargetMonthYearForColumn(quickAdd.column)
            : null
        }
        saving={quickAddSaving}
        onSubmit={async (data) => {
          await handleQuickAddSubmit(data)
        }}
      />

      <details className="mr-axes-detail">
        <summary className="mr-axes-detail__summary">Vue liste par axe (filtres trimestre / année)</summary>
        <div className="mr-toolbar" style={{ marginTop: 12 }}>
          <label>
            Trimestre
            <select
              value={trimestre}
              onChange={(e) => setTrimestre(e.target.value as typeof trimestre)}
            >
              <option value="all">Tous</option>
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
            </select>
          </label>
          {trimestre !== 'all' && (
            <label>
              Année
              <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Axe
            <select value={axeFilter} onChange={(e) => setAxeFilter(e.target.value as typeof axeFilter)}>
              <option value="all">Tous</option>
              {AXES.map((a) => (
                <option key={a} value={a}>
                  {AXE_META[a].title}
                </option>
              ))}
            </select>
          </label>
        </div>

      {chantiers.map((ch) => {
        const allJalons = jalonsByChantier[ch.id] ?? []
        return (
          <section key={ch.id} className="mr-chantier">
            <div className="mr-chantier-header">
              {editingChantierId === ch.id ? (
                <input
                  className="mr-chantier-title"
                  defaultValue={ch.nom}
                  autoFocus
                  onBlur={(e) => void handleSaveChantierName(ch.id, e.target.value.trim() || 'Chantier')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                    if (e.key === 'Escape') setEditingChantierId(null)
                  }}
                />
              ) : (
                <h2 className="mr-chantier-title">
                  CHANTIER : {ch.nom}
                </h2>
              )}
              {!readOnly && (
                <>
                  <button type="button" className="mr-btn-ghost" onClick={() => setEditingChantierId(ch.id)}>
                    Éditer nom
                  </button>
                  <button type="button" className="mr-btn-ghost mr-btn-danger" onClick={() => void handleDeleteChantier(ch.id)}>
                    Supprimer chantier
                  </button>
                </>
              )}
            </div>

            {AXES.map((axe) => {
              const rawAxis = allJalons.filter((j) => j.axe === axe)
              const axisJalons = filteredJalons(rawAxis)
              const meta = AXE_META[axe]
              return (
                <div
                  key={axe}
                  className="mr-axe"
                  style={{
                    background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
                  }}
                >
                  <div className="mr-axe-title">{meta.title}</div>
                  {axisJalons.length === 0 && (
                    <p className="mr-muted" style={{ margin: '0 0 8px' }}>
                      {rawAxis.length === 0
                        ? 'Aucun jalon dans cet axe.'
                        : 'Aucun jalon ne correspond aux filtres.'}
                    </p>
                  )}
                  {axisJalons.map((j) => (
                    <JalonRow
                      key={j.id}
                      jalon={j}
                      onOpen={() => void openDrawer(j, ch.id)}
                      directionById={directionById}
                    />
                  ))}
                  {!readOnly && (
                    <div className="mr-add-jalon">
                      <button
                        type="button"
                        className="mr-btn-ghost"
                        onClick={() => void handleNewJalon(ch.id, axe)}
                      >
                        + Nouveau jalon dans cet axe
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        )
      })}

      {!readOnly && (
        <button type="button" className="mr-btn-primary" style={{ marginTop: 8 }} onClick={() => void handleNewChantier()}>
          + Nouveau chantier
        </button>
      )}
      </details>

      {drawerJalonId && drawerChantierId && (
        <JalonDrawer
          projetId={projetId}
          chantierId={drawerChantierId}
          jalonId={drawerJalonId}
          seedJalon={drawerSeedJalon}
          projetNom={projetNom}
          chantierNom={chantiers.find((c) => c.id === drawerChantierId)?.nom ?? ''}
          directions={directions}
          readOnly={readOnly}
          onClose={() => {
            setDrawerJalonId(null)
            setDrawerChantierId(null)
            setDrawerSeedJalon(null)
          }}
          onSaved={async () => {
            await refreshChantierJalons(drawerChantierId)
            await loadAll()
          }}
        />
      )}
    </div>
  )
}

function JalonRow({
  jalon,
  onOpen,
  directionById,
}: {
  jalon: Jalon
  onOpen: () => void
  directionById: Map<string, string>
}) {
  const [raciPilote, setRaciPilote] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const raci = await getJalonRaci(jalon.id)
      const pilote = raci.find((r) => r.role === 'PILOTE')
      if (!cancelled && pilote) {
        setRaciPilote(directionById.get(pilote.direction_id) ?? '')
      } else if (!cancelled) setRaciPilote('')
    })()
    return () => {
      cancelled = true
    }
  }, [jalon.id, directionById])

  const displayPilote = raciPilote

  return (
    <div className="mr-jalon-row" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onOpen()
      }
    }}>
      <span className="mr-jalon-num">{jalon.numero ?? '—'}</span>
      <span className="mr-jalon-name">
        &ldquo;{jalon.nom || 'Sans titre'}&rdquo;
      </span>
      <span className="mr-badge-date">{formatMonthYearShort(jalon.mois_cible, jalon.annee_cible)}</span>
      <span className={`mr-badge-statut mr-statut-${jalon.statut}`}>{STATUT_LABEL[jalon.statut]}</span>
      {jalon.responsable ? (
        <span className="mr-jalon-meta">Responsable : {jalon.responsable}</span>
      ) : null}
      {displayPilote ? (
        <span className="mr-jalon-meta">Pilote : {displayPilote}</span>
      ) : null}
    </div>
  )
}

function JalonDrawer({
  projetId,
  chantierId,
  jalonId,
  seedJalon,
  projetNom,
  chantierNom,
  directions,
  readOnly,
  onClose,
  onSaved,
}: {
  projetId: string
  chantierId: string
  jalonId: string
  /** Réponse de `createJalon` si la liste chantier n’est pas encore à jour. */
  seedJalon: Jalon | null
  projetNom: string
  chantierNom: string
  directions: Direction[]
  readOnly: boolean
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [jalon, setJalon] = useState<Jalon | null>(null)
  const [projetJalons, setProjetJalons] = useState<Jalon[]>([])
  const [piloteId, setPiloteId] = useState<string>('')
  const [implIds, setImplIds] = useState<Set<string>>(new Set())
  const [infIds, setInfIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [jList, raci, allJ] = await Promise.all([
        getChantierJalons(chantierId),
        getJalonRaci(jalonId),
        getProjetJalons(projetId),
      ])
      if (cancelled) return
      const j =
        jList.find((x) => x.id === jalonId) ??
        (seedJalon?.id === jalonId ? seedJalon : null) ??
        null
      setJalon(j)
      setProjetJalons(allJ)
      const pilote = raci.find((r) => r.role === 'PILOTE')
      setPiloteId(pilote?.direction_id ?? '')
      setImplIds(new Set(raci.filter((r) => r.role === 'IMPLIQUE').map((r) => r.direction_id)))
      setInfIds(new Set(raci.filter((r) => r.role === 'INFORME').map((r) => r.direction_id)))
    })()
    return () => {
      cancelled = true
    }
  }, [chantierId, jalonId, projetId, seedJalon])

  const axeLabel = jalon ? AXE_META[jalon.axe].title : ''

  async function syncRaci() {
    const raci = await getJalonRaci(jalonId)
    const desired = new Map<string, RaciRole>()
    if (piloteId) desired.set(piloteId, 'PILOTE')
    for (const id of implIds) {
      if (id !== piloteId) desired.set(id, 'IMPLIQUE')
    }
    for (const id of infIds) {
      if (id !== piloteId && !implIds.has(id)) desired.set(id, 'INFORME')
    }
    for (const row of raci) {
      if (!desired.has(row.direction_id)) {
        await removeRaci(jalonId, row.direction_id)
      }
    }
    for (const [dirId, role] of desired) {
      await setRaci(jalonId, dirId, role)
    }
  }

  async function handleSave() {
    if (!jalon || readOnly) return
    setSaving(true)
    try {
      await updateJalon(jalonId, {
        nom: jalon.nom,
        description: jalon.description,
        mois_cible: jalon.mois_cible,
        annee_cible: jalon.annee_cible,
        statut: jalon.statut,
        facette: jalon.facette,
        responsable: jalon.responsable,
        decideur: jalon.decideur,
        kpi_description: jalon.kpi_description,
        kpi_valeur_cible: jalon.kpi_valeur_cible,
        note_contexte: jalon.note_contexte,
        jalon_dependance_id: jalon.jalon_dependance_id,
        direction_id: jalon.direction_id,
      })
      await syncRaci()
      await onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (readOnly) return
    if (!window.confirm('Supprimer ce jalon ?')) return
    await deleteJalon(jalonId)
    await onSaved()
    onClose()
  }

  if (!jalon) {
    return (
      <div className="mr-drawer-overlay" onClick={onClose} role="presentation">
        <div className="mr-drawer" onClick={(e) => e.stopPropagation()}>
          <p>Chargement…</p>
        </div>
      </div>
    )
  }

  const trimLabel =
    jalon.mois_cible && jalon.annee_cible
      ? `${monthToQuarter(jalon.mois_cible)} ${jalon.annee_cible}`
      : '—'

  const depOptions = projetJalons.filter((j) => j.id !== jalonId)

  return (
    <div className="mr-drawer-overlay" onClick={onClose} role="presentation">
      <div className="mr-drawer" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mr-back" onClick={onClose}>
          ✕ Fermer
        </button>
        <h2>
          Détail jalon {jalon.numero ?? ''}
        </h2>
        <p className="mr-muted">
          Projet : {projetNom}
          <br />
          Chantier : {chantierNom}
          <br />
          Axe : {axeLabel}
          <br />
          Numéro : {jalon.numero ?? '—'}
        </p>

        <div className="mr-field">
          <label htmlFor="jalon-nom">Nom du jalon (formulé au passé)</label>
          <input
            id="jalon-nom"
            value={jalon.nom}
            disabled={readOnly}
            onChange={(e) => setJalon((prev) => (prev ? { ...prev, nom: e.target.value } : null))}
            placeholder="L'équipe a été formée"
          />
          <p className="mr-hint">
            Un jalon est une réalisation à date, formulée au passé, spécifique, concise. Pas une action.
          </p>
        </div>

        <div className="mr-field">
          <label htmlFor="jalon-desc">Description</label>
          <textarea
            id="jalon-desc"
            value={jalon.description ?? ''}
            disabled={readOnly}
            onChange={(e) => setJalon((prev) => (prev ? { ...prev, description: e.target.value || null } : null))}
          />
        </div>

        <div className="mr-field">
          <span>Date cible</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <label>
              Mois
              <select
                value={jalon.mois_cible ?? ''}
                disabled={readOnly}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null
                  setJalon((prev) => (prev ? { ...prev, mois_cible: v } : null))
                }}
              >
                <option value="">—</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1).toLocaleString('fr-FR', { month: 'long' })}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Année
              <select
                value={jalon.annee_cible ?? ''}
                disabled={readOnly}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null
                  setJalon((prev) => (prev ? { ...prev, annee_cible: v } : null))
                }}
              >
                <option value="">—</option>
                {yearOptionsDrawer().map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="mr-hint">Trimestre : {trimLabel}</p>
        </div>

        <div className="mr-field">
          <label htmlFor="jalon-statut">Statut</label>
          <select
            id="jalon-statut"
            value={jalon.statut}
            disabled={readOnly}
            onChange={(e) =>
              setJalon((prev) =>
                prev ? { ...prev, statut: e.target.value as JalonStatut } : null,
              )
            }
          >
            {(Object.keys(STATUT_LABEL) as JalonStatut[]).map((k) => (
              <option key={k} value={k}>
                {STATUT_LABEL[k]}
              </option>
            ))}
          </select>
        </div>

        <div className="mr-field">
          <label htmlFor="jalon-facette">Facette (optionnel)</label>
          <select
            id="jalon-facette"
            value={jalon.facette ?? ''}
            disabled={readOnly}
            onChange={(e) => {
              const v = e.target.value as JalonFacette | ''
              setJalon((prev) =>
                prev ? { ...prev, facette: v === '' ? null : v } : null,
              )
            }}
          >
            <option value="">—</option>
            {FACETTE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="mr-hint">Ces catégories aident à vérifier que vous avez pensé à tous les types de jalons nécessaires.</p>
        </div>

        <div className="mr-field">
          <label htmlFor="jalon-resp">Responsable</label>
          <input
            id="jalon-resp"
            value={jalon.responsable ?? ''}
            disabled={readOnly}
            onChange={(e) => setJalon((prev) => (prev ? { ...prev, responsable: e.target.value || null } : null))}
          />
        </div>
        <div className="mr-field">
          <label htmlFor="jalon-dec">Décideur</label>
          <input
            id="jalon-dec"
            value={jalon.decideur ?? ''}
            disabled={readOnly}
            onChange={(e) => setJalon((prev) => (prev ? { ...prev, decideur: e.target.value || null } : null))}
          />
        </div>

        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>KPI de suivi</h3>
        <div className="mr-field">
          <label htmlFor="kpi-desc">Indicateur</label>
          <input
            id="kpi-desc"
            value={jalon.kpi_description ?? ''}
            disabled={readOnly}
            placeholder="% de décrochés sous 3 sonneries"
            onChange={(e) => setJalon((prev) => (prev ? { ...prev, kpi_description: e.target.value || null } : null))}
          />
        </div>
        <div className="mr-field">
          <label htmlFor="kpi-val">Valeur cible</label>
          <input
            id="kpi-val"
            value={jalon.kpi_valeur_cible ?? ''}
            disabled={readOnly}
            placeholder="90%"
            onChange={(e) => setJalon((prev) => (prev ? { ...prev, kpi_valeur_cible: e.target.value || null } : null))}
          />
        </div>

        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>Macro RACI</h3>
        <div className="mr-field">
          <label>◉ Pilote (une direction)</label>
          <select
            value={piloteId}
            disabled={readOnly}
            onChange={(e) => {
              const v = e.target.value
              setPiloteId(v)
              if (v) {
                setImplIds((prev) => {
                  const n = new Set(prev)
                  n.delete(v)
                  return n
                })
                setInfIds((prev) => {
                  const n = new Set(prev)
                  n.delete(v)
                  return n
                })
              }
            }}
          >
            <option value="">—</option>
            {directions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="mr-field">
          <span>◎ Impliqué</span>
          <div className="mr-raci-grid" style={{ marginTop: 6 }}>
            {directions
              .filter((d) => d.id !== piloteId)
              .map((d) => (
                <label key={d.id} className="mr-raci-row">
                  <input
                    type="checkbox"
                    checked={implIds.has(d.id)}
                    disabled={readOnly}
                    onChange={() => {
                      setImplIds((prev) => {
                        const n = new Set(prev)
                        if (n.has(d.id)) n.delete(d.id)
                        else {
                          n.add(d.id)
                          setInfIds((inf) => {
                            const nn = new Set(inf)
                            nn.delete(d.id)
                            return nn
                          })
                        }
                        return n
                      })
                    }}
                  />
                  {d.nom}
                </label>
              ))}
          </div>
        </div>
        <div className="mr-field">
          <span>○ Informé</span>
          <div className="mr-raci-grid" style={{ marginTop: 6 }}>
            {directions
              .filter((d) => d.id !== piloteId && !implIds.has(d.id))
              .map((d) => (
                <label key={d.id} className="mr-raci-row">
                  <input
                    type="checkbox"
                    checked={infIds.has(d.id)}
                    disabled={readOnly}
                    onChange={() => {
                      setInfIds((prev) => {
                        const n = new Set(prev)
                        if (n.has(d.id)) n.delete(d.id)
                        else n.add(d.id)
                        return n
                      })
                    }}
                  />
                  {d.nom}
                </label>
              ))}
          </div>
        </div>

        <div className="mr-field">
          <label htmlFor="jalon-dep">Dépendance (optionnel)</label>
          <select
            id="jalon-dep"
            value={jalon.jalon_dependance_id ?? ''}
            disabled={readOnly}
            onChange={(e) => {
              const v = e.target.value || null
              setJalon((prev) => (prev ? { ...prev, jalon_dependance_id: v } : null))
            }}
          >
            <option value="">—</option>
            {depOptions.map((j) => (
              <option key={j.id} value={j.id}>
                {j.numero ?? j.id.slice(0, 8)} — {j.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="mr-field">
          <label htmlFor="jalon-note">Note de contexte</label>
          <textarea
            id="jalon-note"
            value={jalon.note_contexte ?? ''}
            disabled={readOnly}
            onChange={(e) => setJalon((prev) => (prev ? { ...prev, note_contexte: e.target.value || null } : null))}
          />
        </div>
        <p className="mr-hint">
          Les actions terrain pour atteindre ce jalon seront construites plus tard via le module Plan d&apos;Action d&apos;Équipe (PAE).
        </p>

        {!readOnly && (
          <div className="mr-drawer-actions">
            <button type="button" className="mr-btn-ghost mr-btn-danger" onClick={() => void handleDelete()}>
              Supprimer jalon
            </button>
            <button type="button" className="mr-btn-primary" disabled={saving} onClick={() => void handleSave()}>
              Enregistrer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function yearOptionsDrawer(): number[] {
  const y = new Date().getFullYear()
  return [y - 1, y, y + 1, y + 2, y + 3]
}
