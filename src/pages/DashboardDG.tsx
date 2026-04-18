import { useCallback, useEffect, useMemo, useState } from 'react'
import DgProjectAccordion from '../DgProjectAccordion'
import { getWorkspaceDirectionsWithProjects, updateProjet } from '../lib/api'
import type { DashboardDgDirectionStats, DashboardDgKpis, Projet } from '../lib/types'

const SCORE_COEFFICIENTS = {
  criticite: 3,
  urgence: 2,
  recurrence: 2,
  temps: 1,
  etp: 1,
  investissement: 1,
} as const

function computeProjectScore(project: Projet): number {
  const scoreMax =
    (5 * SCORE_COEFFICIENTS.criticite) +
    (5 * SCORE_COEFFICIENTS.urgence) +
    (5 * SCORE_COEFFICIENTS.recurrence) +
    (5 * SCORE_COEFFICIENTS.temps) +
    (5 * SCORE_COEFFICIENTS.etp) +
    (5 * SCORE_COEFFICIENTS.investissement)

  const raw =
    (project.score_criticite * SCORE_COEFFICIENTS.criticite) +
    (project.score_urgence * SCORE_COEFFICIENTS.urgence) +
    (project.score_recurrence * SCORE_COEFFICIENTS.recurrence) +
    (project.score_temps * SCORE_COEFFICIENTS.temps) +
    (project.score_etp * SCORE_COEFFICIENTS.etp) +
    (project.score_investissement * SCORE_COEFFICIENTS.investissement)

  if (raw <= 0) return 0
  return Math.round((raw / scoreMax) * 100)
}

type DirectionBundle = {
  id: string
  name: string
  color: string
  projects: Projet[]
}

export default function DashboardDG({ workspaceId }: { workspaceId: string | null }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [directions, setDirections] = useState<DirectionBundle[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) {
      setDirections([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await getWorkspaceDirectionsWithProjects(workspaceId)
      setDirections(
        rows.map((r) => ({
          id: r.direction.id,
          name: r.direction.nom,
          color: r.direction.color,
          projects: r.projects,
        })),
      )
    } catch (e) {
      const message =
        typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message?: unknown }).message ?? '').trim()
          : ''
      setError(message || 'Impossible de charger la vue consolidée.')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    queueMicrotask(() => {
      void load()
    })
  }, [load])

  const pendingByDirection = useMemo(() => {
    const groups: Array<{
      directionId: string
      directionName: string
      directionColor: string
      projects: Projet[]
    }> = []
    for (const d of directions) {
      const pending = d.projects.filter(
        (p) => p.type === 'BUILD' && p.selected_for_transfo && !p.dg_validated_transfo,
      )
      if (pending.length === 0) continue
      groups.push({
        directionId: d.id,
        directionName: d.name,
        directionColor: d.color,
        projects: [...pending].sort((a, b) => computeProjectScore(b) - computeProjectScore(a)),
      })
    }
    return groups.sort((a, b) => a.directionName.localeCompare(b.directionName, 'fr'))
  }, [directions])

  const validatedByDirection = useMemo(() => {
    const groups: Array<{
      directionId: string
      directionName: string
      directionColor: string
      projects: Projet[]
    }> = []
    for (const d of directions) {
      const val = d.projects.filter((p) => p.type === 'BUILD' && p.dg_validated_transfo)
      if (val.length === 0) continue
      groups.push({
        directionId: d.id,
        directionName: d.name,
        directionColor: d.color,
        projects: [...val].sort((a, b) => computeProjectScore(b) - computeProjectScore(a)),
      })
    }
    return groups.sort((a, b) => a.directionName.localeCompare(b.directionName, 'fr'))
  }, [directions])

  async function handleValidate(projetId: string, validated: boolean) {
    setSavingId(projetId)
    try {
      await updateProjet(projetId, { dg_validated_transfo: validated })
      await load()
    } catch (e) {
      const message =
        typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message?: unknown }).message ?? '').trim()
          : ''
      window.alert(message || 'Impossible de mettre à jour le projet.')
    } finally {
      setSavingId(null)
    }
  }

  const model = useMemo(() => {
    const directionStats: DashboardDgDirectionStats[] = directions.map((direction) => {
      const build = direction.projects.filter((p) => p.type === 'BUILD')
      const run = direction.projects.filter((p) => p.type === 'RUN')
      const avgBuildScore =
        build.length > 0
          ? Math.round(build.reduce((sum, p) => sum + computeProjectScore(p), 0) / build.length)
          : 0
      return {
        directionId: direction.id,
        directionName: direction.name,
        totalProjects: direction.projects.length,
        runProjects: run.length,
        buildProjects: build.length,
        avgBuildScore,
        selectedBuildCount: build.filter((p) => p.selected_for_transfo).length,
      }
    })

    const allProjects = directions.flatMap((d) => d.projects)
    const buildProjects = allProjects.filter((p) => p.type === 'BUILD')
    const kpis: DashboardDgKpis = {
      totalProjects: allProjects.length,
      runProjects: allProjects.filter((p) => p.type === 'RUN').length,
      buildProjects: buildProjects.length,
      activeDirections: directionStats.filter((d) => d.totalProjects > 0).length,
      avgBuildScore:
        buildProjects.length > 0
          ? Math.round(buildProjects.reduce((sum, p) => sum + computeProjectScore(p), 0) / buildProjects.length)
          : 0,
      criticalProjects: buildProjects.filter((p) => computeProjectScore(p) >= 75).length,
    }

    const top5 = [...directionStats]
      .filter((d) => d.buildProjects > 0)
      .sort((a, b) => b.avgBuildScore - a.avgBuildScore || b.buildProjects - a.buildProjects)
      .slice(0, 5)

    return { kpis, top5 }
  }, [directions])

  return (
    <section className="dg" id="dg-print-scope">
      <div className="dg__header">
        <div>
          <h2 className="dg__title">Vue DG consolidée</h2>
          <p className="dg__subtitle">Synthèse multi-directions, validation des projets BUILD pour la Maturity Roadmap.</p>
        </div>
        <button
          type="button"
          className="dg__export"
          onClick={() => {
            document.body.classList.add('dg-printing')
            window.print()
            setTimeout(() => document.body.classList.remove('dg-printing'), 200)
          }}
        >
          Export PDF
        </button>
      </div>

      {loading && <p className="dg__state">Chargement des données consolidées...</p>}
      {error && <p className="dg__state dg__state--error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="dg__kpis">
            <article className="dg__kpi"><span>Projets total</span><strong>{model.kpis.totalProjects}</strong></article>
            <article className="dg__kpi"><span>BUILD</span><strong>{model.kpis.buildProjects}</strong></article>
            <article className="dg__kpi"><span>RUN</span><strong>{model.kpis.runProjects}</strong></article>
            <article className="dg__kpi"><span>Directions actives</span><strong>{model.kpis.activeDirections}</strong></article>
            <article className="dg__kpi"><span>Score BUILD moyen</span><strong>{model.kpis.avgBuildScore}/100</strong></article>
            <article className="dg__kpi"><span>Projets critiques</span><strong>{model.kpis.criticalProjects}</strong></article>
          </div>

          <article className="dg__card dg__card--wide">
            <h3>Projets BUILD soumis pour la roadmap</h3>
            <p className="dg__hint">
              Les directions marquent des projets comme &laquo; retenus pour le DG &raquo; dans La Fabrique. Validez ici ceux qui passent en
              Maturity Roadmap (chantiers et jalons sur 4 axes).
            </p>
            {pendingByDirection.length === 0 ? (
              <p className="dg__empty">Aucun projet en attente de validation.</p>
            ) : (
              <div className="dg__direction-groups">
                {pendingByDirection.map((group) => (
                  <section key={group.directionId} className="dg__direction-group">
                    <h4 className="dg__direction-heading">{group.directionName}</h4>
                    <ul className="dg__proj-list">
                      {group.projects.map((projet) => (
                        <li key={projet.id} className="dg__proj-list-item">
                          <DgProjectAccordion
                            projet={projet}
                            accentColor={group.directionColor}
                            globalScore={computeProjectScore(projet)}
                            mode="pending"
                            saving={savingId === projet.id}
                            onValidate={() => void handleValidate(projet.id, true)}
                            onRevoke={() => {}}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </article>

          {validatedByDirection.length > 0 && (
            <article className="dg__card dg__card--wide">
              <h3>Projets validés pour la roadmap</h3>
              <p className="dg__hint">Ces projets sont disponibles dans <strong>Mon Espace → Ma roadmap</strong> (et le bouton roadmap dans La Fabrique).</p>
              <div className="dg__direction-groups">
                {validatedByDirection.map((group) => (
                  <section key={group.directionId} className="dg__direction-group">
                    <h4 className="dg__direction-heading">{group.directionName}</h4>
                    <ul className="dg__proj-list dg__proj-list--muted">
                      {group.projects.map((projet) => (
                        <li key={projet.id} className="dg__proj-list-item">
                          <DgProjectAccordion
                            projet={projet}
                            accentColor={group.directionColor}
                            globalScore={computeProjectScore(projet)}
                            mode="validated"
                            saving={savingId === projet.id}
                            onValidate={() => {}}
                            onRevoke={() => {
                              if (
                                !window.confirm(
                                  'Retirer la validation DG ? Le projet ne sera plus accessible depuis Ma roadmap tant qu’il n’est pas validé à nouveau.',
                                )
                              )
                                return
                              void handleValidate(projet.id, false)
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </article>
          )}

          <article className="dg__card">
            <h3>Top 5 inter-directions (BUILD)</h3>
            <ol className="dg__ranking">
              {model.top5.length === 0 && <li>Aucune direction BUILD pour le moment.</li>}
              {model.top5.map((item) => (
                <li key={item.directionId} className="dg__ranking-item">
                  <span>{item.directionName}</span>
                  <span>
                    {item.avgBuildScore}/100 · {item.buildProjects} BUILD
                  </span>
                </li>
              ))}
            </ol>
          </article>
        </>
      )}
    </section>
  )
}
