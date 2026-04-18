import { useEffect, useMemo, useState } from 'react'
import { getWorkspaceDirectionsWithProjects } from '../lib/api'
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

function monthKeys(count: number): Array<{ key: string; label: string }> {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    return {
      key: `${d.getMonth()}-${d.getFullYear()}`,
      label: d.toLocaleString('fr-FR', { month: 'short' }).replace('.', ''),
    }
  })
}

export default function DashboardDG({ workspaceId }: { workspaceId: string | null }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [directions, setDirections] = useState<Array<{ name: string; projects: Projet[] }>>([])

  useEffect(() => {
    if (!workspaceId) {
      setDirections([])
      return
    }
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const rows = await getWorkspaceDirectionsWithProjects(workspaceId)
        if (cancelled) return
        setDirections(rows.map((r) => ({ name: r.direction.nom, projects: r.projects })))
      } catch (e) {
        if (cancelled) return
        const message =
          typeof e === 'object' && e !== null && 'message' in e
            ? String((e as { message?: unknown }).message ?? '').trim()
            : ''
        setError(message || 'Impossible de charger la vue consolidée.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workspaceId])

  const model = useMemo(() => {
    const directionStats: DashboardDgDirectionStats[] = directions.map((direction, idx) => {
      const build = direction.projects.filter((p) => p.type === 'BUILD')
      const run = direction.projects.filter((p) => p.type === 'RUN')
      const avgBuildScore =
        build.length > 0
          ? Math.round(build.reduce((sum, p) => sum + computeProjectScore(p), 0) / build.length)
          : 0
      return {
        directionId: `${idx}-${direction.name}`,
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

    const months = monthKeys(12)
    const ganttRows = top5.map((direction) => {
      const dirData = directions.find((d) => d.name === direction.directionName)
      const selectedBuilds = (dirData?.projects ?? []).filter((p) => p.type === 'BUILD')
      const timeline = months.map((month) => {
        const activeCount = selectedBuilds.reduce((count, project) => {
          const active = project.planning?.[month.key] ?? false
          return active ? count + 1 : count
        }, 0)
        return activeCount
      })
      return { directionName: direction.directionName, timeline }
    })

    return { kpis, top5, ganttRows, months }
  }, [directions])

  return (
    <section className="dg" id="dg-print-scope">
      <div className="dg__header">
        <div>
          <h2 className="dg__title">Vue DG consolidée</h2>
          <p className="dg__subtitle">Synthèse multi-directions des priorités BUILD et de la charge macro.</p>
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

          <div className="dg__grid">
            <article className="dg__card">
              <h3>Top 5 inter-directions (BUILD)</h3>
              <ol className="dg__ranking">
                {model.top5.length === 0 && <li>Aucune direction BUILD pour le moment.</li>}
                {model.top5.map((item) => (
                  <li key={item.directionId} className="dg__ranking-item">
                    <span>{item.directionName}</span>
                    <span>{item.avgBuildScore}/100 · {item.buildProjects} BUILD</span>
                  </li>
                ))}
              </ol>
            </article>

            <article className="dg__card">
              <h3>Gantt macro consolidé (12 mois)</h3>
              <div className="dg__months">
                {model.months.map((month) => (
                  <span key={month.key}>{month.label}</span>
                ))}
              </div>
              <div className="dg__gantt">
                {model.ganttRows.map((row) => (
                  <div key={row.directionName} className="dg__gantt-row">
                    <span className="dg__gantt-label">{row.directionName}</span>
                    <div className="dg__gantt-cells">
                      {row.timeline.map((value, idx) => (
                        <span
                          key={`${row.directionName}-${idx}`}
                          className={`dg__gantt-cell ${value > 0 ? 'dg__gantt-cell--on' : ''}`}
                          title={value > 0 ? `${value} projet(s) actif(s)` : 'Aucun projet actif'}
                        >
                          {value > 0 ? value : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  )
}
