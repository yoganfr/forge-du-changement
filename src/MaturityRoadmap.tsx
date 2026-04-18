import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Axe, Direction, Jalon, JalonFacette, JalonStatut, Projet, RaciRole, User } from './lib/types'
import {
  createChantier,
  createJalon,
  deleteChantier,
  deleteJalon,
  getChantierJalons,
  getJalonsByChantierIds,
  getJalonRaci,
  getProjetChantiers,
  getProjetJalons,
  getRoadmapEligibleProjects,
  getRoadmapEligibleProjectsForDirection,
  getWorkspaceDirections,
  monthToQuarter,
  removeRaci,
  setRaci,
  updateChantierAndReparentProject,
  updateJalon,
} from './lib/api'
import { getCurrentUser } from './lib/auth'
import ChantierLineModal from './ChantierLineModal'
import JalonQuickAddModal from './JalonQuickAddModal'
import RoadmapTimelineGrid from './RoadmapTimelineGrid'
import type { TimelineColumn } from './lib/roadmapTimelineColumns'
import { assignRoadmapProjectColors } from './lib/projectRoadmapColor'
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

/** Direction « métier » du membre CODIR / pilote (nom dans le profil ou première direction non transverse). */
function resolveMemberDirectionId(dirs: Direction[], u: User | null): string | null {
  if (!u) return null
  const want = u.direction_nom?.trim().toLowerCase()
  if (want) {
    const hit = dirs.find((d) => d.nom.trim().toLowerCase() === want)
    if (hit) return hit.id
  }
  if (u.role === 'codir' || u.role === 'pilote') {
    return dirs.find((d) => !d.is_transverse)?.id ?? dirs[0]?.id ?? null
  }
  return null
}

export type MaturityRoadmapProps = {
  workspaceId: string
  /** Ouverture depuis un projet : ne coche que ce projet dans la légende. */
  focusProjetId?: string | null
  readOnly?: boolean
  onBack: () => void
}

export default function MaturityRoadmap({
  workspaceId,
  focusProjetId = null,
  readOnly = false,
  onBack,
}: MaturityRoadmapProps) {
  const [roadmapProjects, setRoadmapProjects] = useState<Projet[]>([])
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [chantiers, setChantiers] = useState<Awaited<ReturnType<typeof getProjetChantiers>>>([])
  const [jalonsByChantier, setJalonsByChantier] = useState<Record<string, Jalon[]>>({})
  const [directions, setDirections] = useState<Direction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chantierSaving, setChantierSaving] = useState(false)
  const [memberDirectionLabel, setMemberDirectionLabel] = useState<string | null>(null)
  const [chantierModal, setChantierModal] = useState<{
    mode: 'create' | 'edit'
    chantierId: string | null
    /** Axe du bloc où la création a été lancée (type Processus / … / KPI). */
    axeForCreate?: Axe
  } | null>(null)
  const [axeFilter, setAxeFilter] = useState<'all' | Axe>('all')
  const [drawerJalonId, setDrawerJalonId] = useState<string | null>(null)
  const [drawerChantierId, setDrawerChantierId] = useState<string | null>(null)
  /** Jalon tout juste créé (évite un tiroir bloqué si le cache réseau était encore en cours). */
  const [drawerSeedJalon, setDrawerSeedJalon] = useState<Jalon | null>(null)
  const [quickAdd, setQuickAdd] = useState<{
    chantierId: string
    column: TimelineColumn
    axe: Axe
  } | null>(null)
  const [quickAddSaving, setQuickAddSaving] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dirs, appUser] = await Promise.all([
        getWorkspaceDirections(workspaceId),
        getCurrentUser(),
      ])
      setDirections(dirs)
      const memberDirId = resolveMemberDirectionId(dirs, appUser)
      const dirLabel = memberDirId ? dirs.find((d) => d.id === memberDirId)?.nom ?? null : null
      setMemberDirectionLabel(dirLabel)

      const projects = memberDirId
        ? await getRoadmapEligibleProjectsForDirection(memberDirId)
        : await getRoadmapEligibleProjects(workspaceId)

      if (projects.length === 0) {
        setRoadmapProjects([])
        setSelectedProjectIds([])
        setChantiers([])
        setJalonsByChantier({})
        setError(
          memberDirId
            ? 'Aucun projet BUILD validé par le DG pour votre direction. Créez un BUILD dans La Fabrique, retenez-le pour le DG, puis validez-le dans la Vue DG (section « Projets BUILD soumis pour la roadmap »).'
            : 'Aucun projet BUILD validé par le DG pour la roadmap. Créez un BUILD dans La Fabrique, retenez-le pour le DG, puis validez-le dans la Vue DG (section « Projets BUILD soumis pour la roadmap »).',
        )
        return
      }
      setRoadmapProjects(projects)
      const ids = projects.map((p) => p.id)
      const focus =
        focusProjetId && ids.includes(focusProjetId) ? [focusProjetId] : [...ids]
      setSelectedProjectIds(focus)

      const projectOrder = new Map(projects.map((p, i) => [p.id, i]))
      const allChs: Awaited<ReturnType<typeof getProjetChantiers>> = []
      const jMap: Record<string, Jalon[]> = {}
      await Promise.all(
        projects.map(async (p) => {
          const chs = await getProjetChantiers(p.id)
          for (const c of chs) {
            allChs.push(c)
          }
        }),
      )
      allChs.sort((a, b) => {
        const oa = projectOrder.get(a.projet_id) ?? 999
        const ob = projectOrder.get(b.projet_id) ?? 999
        if (oa !== ob) return oa - ob
        return a.ordre - b.ordre || a.created_at.localeCompare(b.created_at)
      })
      setChantiers(allChs)
      const byChantier = await getJalonsByChantierIds(allChs.map((c) => c.id))
      for (const c of allChs) {
        jMap[c.id] = byChantier[c.id] ?? []
      }
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
  }, [workspaceId, focusProjetId])

  useEffect(() => {
    queueMicrotask(() => {
      void loadAll()
    })
  }, [loadAll])

  const projectsById = useMemo(
    () => new Map(roadmapProjects.map((p) => [p.id, p])),
    [roadmapProjects],
  )

  const visibleChantiers = useMemo(
    () => chantiers.filter((c) => selectedProjectIds.includes(c.projet_id)),
    [chantiers, selectedProjectIds],
  )

  const projectColorById = useMemo(
    () => assignRoadmapProjectColors(roadmapProjects.map((p) => p.id)),
    [roadmapProjects],
  )

  const projetNomById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const p of roadmapProjects) {
      m[p.id] = p.nom
    }
    return m
  }, [roadmapProjects])

  function toggleLegendProject(id: string) {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function selectAllLegendProjects() {
    setSelectedProjectIds(roadmapProjects.map((p) => p.id))
  }

  function deselectAllLegendProjects() {
    setSelectedProjectIds([])
  }

  async function refreshChantierJalons(chantierId: string) {
    const list = await getChantierJalons(chantierId)
    setJalonsByChantier((prev) => ({ ...prev, [chantierId]: list }))
  }

  async function handleChantierModalSubmit(projetId: string, nom: string) {
    if (readOnly) return
    setChantierSaving(true)
    try {
      if (chantierModal?.mode === 'edit' && chantierModal.chantierId) {
        await updateChantierAndReparentProject(chantierModal.chantierId, { nom, projet_id: projetId })
        setSelectedProjectIds((prev) => (prev.includes(projetId) ? prev : [...prev, projetId]))
        setChantierModal(null)
        await loadAll()
        return
      }
      const axeForCreate = chantierModal?.axeForCreate
      if (axeForCreate == null) {
        window.alert(
          'L’axe du chantier est obligatoire. Fermez cette fenêtre et utilisez la ligne en bas du bloc d’axe souhaité (Processus, Organisation, Outils ou KPI).',
        )
        return
      }
      const sameCh = chantiers.filter((c) => c.projet_id === projetId && c.axe === axeForCreate)
      const ordre = (sameCh.reduce((m, c) => Math.max(m, c.ordre), 0) || 0) + 1
      const c = await createChantier({
        projet_id: projetId,
        workspace_id: workspaceId,
        nom,
        ordre,
        axe: axeForCreate,
      })
      setSelectedProjectIds((prev) => (prev.includes(projetId) ? prev : [...prev, projetId]))
      setChantierModal(null)
      setChantiers((prev) => {
        const created = { ...c, axe: c.axe ?? axeForCreate }
        const next = [...prev, created]
        const order = new Map(roadmapProjects.map((p, i) => [p.id, i]))
        return next.sort((a, b) => {
          const oa = order.get(a.projet_id) ?? 999
          const ob = order.get(b.projet_id) ?? 999
          if (oa !== ob) return oa - ob
          return a.ordre - b.ordre || a.created_at.localeCompare(b.created_at)
        })
      })
      setJalonsByChantier((prev) => ({ ...prev, [c.id]: [] }))
    } catch (e) {
      const msg =
        typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message?: unknown }).message ?? '').trim()
          : ''
      window.alert(msg || 'Impossible de créer le chantier.')
    } finally {
      setChantierSaving(false)
    }
  }

  async function handleChantierModalDelete() {
    if (readOnly || !chantierModal || chantierModal.mode !== 'edit' || !chantierModal.chantierId) return
    if (!window.confirm('Supprimer ce chantier et tous ses jalons ?')) return
    setChantierSaving(true)
    try {
      await deleteChantier(chantierModal.chantierId)
      setChantierModal(null)
      await loadAll()
    } catch (e) {
      const msg =
        typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message?: unknown }).message ?? '').trim()
          : ''
      window.alert(msg || 'Impossible de supprimer le chantier.')
    } finally {
      setChantierSaving(false)
    }
  }

  async function handleQuickAddSubmit(data: {
    nom: string
    axe: Axe
    mois_cible: number | null
    annee_cible: number | null
  }) {
    if (!quickAdd || readOnly) return
    const { chantierId } = quickAdd
    const ch = chantiers.find((c) => c.id === chantierId)
    const proj = ch ? projectsById.get(ch.projet_id) : undefined
    if (!ch || !proj) return
    /** Jalons : même axe que le chantier si typé ; sinon axe de la case (chantiers historiques). */
    const axe = ch.axe ?? quickAdd.axe
    setQuickAddSaving(true)
    try {
      const j = await createJalon({
        chantier_id: chantierId,
        axe,
        nom: data.nom,
        mois_cible: data.mois_cible,
        annee_cible: data.annee_cible,
        direction_id: proj.direction_id,
        projet_id: proj.id,
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

  async function handleToggleJalonRealise(jalon: Jalon, chantierId: string, realised: boolean) {
    if (readOnly) return
    try {
      await updateJalon(jalon.id, { statut: realised ? 'realise' : 'en_cours' })
      await refreshChantierJalons(chantierId)
    } catch (e) {
      const msg =
        typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message?: unknown }).message ?? '').trim()
          : ''
      window.alert(msg || 'Impossible de mettre à jour le statut.')
    }
  }

  async function openDrawer(jalon: Jalon, chantierId: string) {
    setDrawerSeedJalon(null)
    setDrawerChantierId(chantierId)
    setDrawerJalonId(jalon.id)
  }

  const drawerChantier = drawerChantierId
    ? chantiers.find((c) => c.id === drawerChantierId)
    : null
  const drawerProjetId = drawerChantier?.projet_id ?? ''
  const drawerProjetNom = drawerProjetId ? projectsById.get(drawerProjetId)?.nom ?? '' : ''

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
      <h1 className="mr-title">Maturity Roadmap</h1>
      <p className="mr-sub">
        {memberDirectionLabel ? (
          <>
            Direction : <strong>{memberDirectionLabel}</strong>
            {' — '}
          </>
        ) : null}
        {roadmapProjects.length} projet{roadmapProjects.length > 1 ? 's' : ''} transformant
        {roadmapProjects.length > 1 ? 's' : ''}. Cochez les projets dans la légende ci-dessous (couleurs sur la
        grille). Choisissez ensuite l’axe affiché. Cliquez sur l’intitulé d’une ligne (ou sur la ligne dédiée en bas
        de chaque axe) pour le nom et le rattachement au projet.
      </p>

      <div className="mr-toolbar">
        <div className="mr-toolbar__field mr-toolbar__field--projects-legend">
          <span className="mr-toolbar__label">Projets transformants affichés</span>
          {memberDirectionLabel ? (
            <span className="mr-toolbar__direction">Direction {memberDirectionLabel}</span>
          ) : null}
          <div
            className="mr-toolbar__projects-panel"
            role="group"
            aria-label="Légende couleur et filtre des projets transformants"
          >
            <div className="mr-toolbar__projects-actions">
              <button type="button" className="mr-toolbar__link" onClick={selectAllLegendProjects}>
                Tout afficher
              </button>
              <span className="mr-toolbar__sep" aria-hidden>
                ·
              </span>
              <button type="button" className="mr-toolbar__link" onClick={deselectAllLegendProjects}>
                Tout masquer
              </button>
              <span className="mr-toolbar__projects-count" aria-live="polite">
                {selectedProjectIds.length}/{roadmapProjects.length} dans la vue
              </span>
            </div>
            <ul className="mr-toolbar__projects-list">
              {roadmapProjects.map((p) => (
                <li key={p.id}>
                  <label className="mr-toolbar__project-row">
                    <input
                      type="checkbox"
                      className="mr-toolbar__project-check"
                      checked={selectedProjectIds.includes(p.id)}
                      onChange={() => toggleLegendProject(p.id)}
                    />
                    <span className="mr-toolbar__project-line">
                      <span
                        className="mr-toolbar__project-swatch mr-toolbar__project-swatch--legend"
                        style={{ background: projectColorById[p.id] }}
                        aria-hidden
                      />
                      <span className="mr-toolbar__project-name">{p.nom}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <label className="mr-toolbar__field" htmlFor="mr-axe-filter">
          <span className="mr-toolbar__label">Axe affiché</span>
          <select
            id="mr-axe-filter"
            value={axeFilter}
            onChange={(e) => setAxeFilter(e.target.value as typeof axeFilter)}
          >
            <option value="all">Les quatre axes</option>
            {AXES.map((a) => (
              <option key={a} value={a}>
                {AXE_META[a].title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <RoadmapTimelineGrid
        chantiers={visibleChantiers}
        jalonsByChantier={jalonsByChantier}
        axeFilter={axeFilter}
        readOnly={readOnly}
        projectColorById={projectColorById}
        projetNomById={projetNomById}
        onOpenJalon={(j, chId) => void openDrawer(j, chId)}
        onQuickAddInCell={(chId, col, axe) => setQuickAdd({ chantierId: chId, column: col, axe })}
        onToggleJalonRealise={
          readOnly ? undefined : (j, chId, realised) => void handleToggleJalonRealise(j, chId, realised)
        }
        onChantierCellClick={
          readOnly
            ? undefined
            : (chantierId, axeForCreate) => {
                if (chantierId === null) {
                  if (roadmapProjects.length === 0) {
                    window.alert(
                      'Aucun projet BUILD validé par le DG pour cette direction. Validez un projet dans la Vue DG avant d’ajouter des chantiers.',
                    )
                    return
                  }
                  if (axeForCreate == null) {
                    window.alert('Impossible de déterminer l’axe du chantier. Rechargez la page et réessayez.')
                    return
                  }
                  setChantierModal({ mode: 'create', chantierId: null, axeForCreate })
                  return
                }
                setChantierModal({ mode: 'edit', chantierId })
              }
        }
      />

      <ChantierLineModal
        open={chantierModal !== null}
        onClose={() => setChantierModal(null)}
        mode={chantierModal?.mode ?? 'create'}
        projects={roadmapProjects.map((p) => ({
          id: p.id,
          nom: p.nom,
          color: projectColorById[p.id] ?? '#8E3B46',
        }))}
        initialNom={
          chantierModal?.mode === 'edit' && chantierModal.chantierId
            ? chantiers.find((c) => c.id === chantierModal.chantierId)?.nom ?? ''
            : ''
        }
        initialProjetId={
          chantierModal?.mode === 'edit' && chantierModal.chantierId
            ? chantiers.find((c) => c.id === chantierModal.chantierId)?.projet_id ?? null
            : null
        }
        axeTypeLabel={(() => {
          if (chantierModal?.mode === 'create' && chantierModal.axeForCreate) {
            return AXE_META[chantierModal.axeForCreate].title
          }
          if (chantierModal?.mode === 'edit' && chantierModal.chantierId) {
            const ec = chantiers.find((c) => c.id === chantierModal.chantierId)
            if (ec?.axe) return AXE_META[ec.axe].title
            return 'Non défini (données antérieures)'
          }
          return null
        })()}
        directionLabel={memberDirectionLabel}
        readOnly={readOnly}
        saving={chantierSaving}
        onSubmit={async (projetId, nom) => {
          await handleChantierModalSubmit(projetId, nom)
        }}
        onDelete={
          chantierModal?.mode === 'edit' && !readOnly ? () => handleChantierModalDelete() : undefined
        }
      />

      <JalonQuickAddModal
        open={quickAdd !== null}
        onClose={() => setQuickAdd(null)}
        chantierNom={visibleChantiers.find((c) => c.id === quickAdd?.chantierId)?.nom ?? chantiers.find((c) => c.id === quickAdd?.chantierId)?.nom ?? ''}
        initialColumnKey={quickAdd?.column.key ?? ''}
        saving={quickAddSaving}
        fixedAxe={
          quickAdd
            ? chantiers.find((c) => c.id === quickAdd.chantierId)?.axe ?? quickAdd.axe
            : null
        }
        onSubmit={async (data) => {
          await handleQuickAddSubmit(data)
        }}
      />

      {drawerJalonId && drawerChantierId && drawerProjetId && (
        <JalonDrawer
          projetId={drawerProjetId}
          chantierId={drawerChantierId}
          jalonId={drawerJalonId}
          seedJalon={drawerSeedJalon}
          projetNom={drawerProjetNom}
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
        <h2>Détail jalon</h2>
        <p className="mr-muted">
          Projet : {projetNom}
          <br />
          Chantier : {chantierNom}
          <br />
          Axe : {axeLabel}
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
                {j.nom || 'Sans titre'}
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
