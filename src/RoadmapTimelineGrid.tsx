import type { Axe, Chantier, Jalon } from './lib/types'
import {
  assignJalonToColumn,
  buildTimelineColumns,
  sortJalonsForCell,
  UNSCHEDULED_KEY,
  type TimelineColumn,
} from './lib/roadmapTimelineColumns'

const AXES: Axe[] = ['PROCESSUS', 'ORGANISATION', 'OUTILS', 'KPI']

const AXE_META: Record<Axe, { short: string; color: string; title: string }> = {
  PROCESSUS: { short: 'P', color: '#8E3B46', title: '1. Processus métiers' },
  ORGANISATION: { short: 'O', color: '#4C86A8', title: '2. Organisation' },
  OUTILS: { short: 'I', color: '#477890', title: '3. Outils IT' },
  KPI: { short: 'K', color: '#B45309', title: "4. KPI's" },
}

const STATUT_LABEL: Record<string, string> = {
  a_venir: 'À venir',
  en_cours: 'En cours',
  realise: 'Réalisé',
  bloque: 'Bloqué',
}

export type RoadmapLegendProject = { id: string; nom: string; color: string }

type Props = {
  chantiers: Chantier[]
  jalonsByChantier: Record<string, Jalon[]>
  axeFilter: 'all' | Axe
  readOnly: boolean
  /** Couleur du (ou des) projet(s) transformant(s) — pilules et légende. */
  legendProjects: RoadmapLegendProject[]
  onOpenJalon: (jalon: Jalon, chantierId: string) => void
  /** Clic sur le + dans une cellule (création guidée en popin). */
  onQuickAddInCell: (chantierId: string, column: TimelineColumn | typeof UNSCHEDULED_KEY) => void
}

export default function RoadmapTimelineGrid({
  chantiers,
  jalonsByChantier,
  axeFilter,
  readOnly,
  legendProjects,
  onOpenJalon,
  onQuickAddInCell,
}: Props) {
  const timeColumns = buildTimelineColumns(new Date())

  const headerCells: { key: string; label: string; sub: string; col: TimelineColumn | 'unscheduled' }[] = [
    { key: UNSCHEDULED_KEY, label: 'Sans date', sub: 'À planifier', col: UNSCHEDULED_KEY },
    ...timeColumns.map((c) => ({
      key: c.key,
      label: c.label,
      sub:
        c.kind === 'quarter'
          ? 'Échéance'
          : c.kind === 'year'
            ? 'Horizon annuel'
            : 'Projection',
      col: c,
    })),
  ]

  function filterJalon(j: Jalon): boolean {
    if (axeFilter !== 'all' && j.axe !== axeFilter) return false
    return true
  }

  function bucketForChantier(chId: string): Map<string, Jalon[]> {
    const raw = (jalonsByChantier[chId] ?? []).filter(filterJalon)
    const map = new Map<string, Jalon[]>()
    for (const j of raw) {
      const k = assignJalonToColumn(j, timeColumns)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(j)
    }
    for (const [, arr] of map) sortJalonsForCell(arr)
    return map
  }

  /** Couleur projet pour une ligne : un seul projet → legendProjects[0]. */
  const projectColor = legendProjects[0]?.color ?? 'var(--theme-accent, #8e3b46)'

  return (
    <div className="mr-tgrid-wrap">
      <section className="mr-four-axes" aria-label="Les 4 axes de transformation">
        {AXES.map((a) => (
          <div
            key={a}
            className="mr-four-axes__item"
            style={{
              borderLeftColor: AXE_META[a].color,
              background: `color-mix(in srgb, ${AXE_META[a].color} 10%, transparent)`,
            }}
          >
            <span className="mr-four-axes__title">{AXE_META[a].title}</span>
          </div>
        ))}
      </section>

      <div className="mr-tgrid-legend" role="group" aria-label="Projets transformants">
        <span className="mr-tgrid-legend__label">Projets transformants</span>
        <ul className="mr-tgrid-legend__list">
          {legendProjects.map((p) => (
            <li key={p.id} className="mr-tgrid-legend__item">
              <span className="mr-tgrid-legend__swatch" style={{ background: p.color }} aria-hidden />
              <span>{p.nom}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mr-tgrid-intro">
        Chaque <strong>chantier</strong> est une ligne ; les <strong>jalons</strong> sont des pilules à la couleur du
        projet, avec le repère d’axe (P / O / I / K). Utilisez le <strong>+</strong> dans une case pour créer un jalon à
        cette échéance.
      </p>

      <div className="mr-tgrid-scroll" role="region" aria-label="Tableau roadmap temps">
        <table className="mr-tgrid">
          <thead>
            <tr>
              <th scope="col" className="mr-tgrid__sticky mr-tgrid__chantier-head">
                Chantier
              </th>
              {headerCells.map((h) => (
                <th key={h.key} scope="col" className="mr-tgrid__time-head">
                  <span className="mr-tgrid__time-label">{h.label}</span>
                  <span className="mr-tgrid__time-sub">{h.sub}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chantiers.map((ch) => {
              const buckets = bucketForChantier(ch.id)
              return (
                <tr key={ch.id}>
                  <th scope="row" className="mr-tgrid__sticky mr-tgrid__chantier-cell">
                    <span className="mr-tgrid__chantier-name">{ch.nom}</span>
                  </th>
                  {headerCells.map((h) => (
                    <td key={h.key} className="mr-tgrid__cell">
                      <div className="mr-tgrid__cell-inner">
                        <div className="mr-tgrid__pills">
                          {(buckets.get(h.key) ?? []).map((j) => (
                            <button
                              key={j.id}
                              type="button"
                              className="mr-tgrid__pill"
                              style={{
                                borderColor: projectColor,
                                background: `color-mix(in srgb, ${projectColor} 14%, var(--theme-bg-page))`,
                              }}
                              onClick={() => onOpenJalon(j, ch.id)}
                              title={`${j.nom || 'Jalon'} — ${STATUT_LABEL[j.statut] ?? j.statut}`}
                            >
                              <span
                                className="mr-tgrid__axe-badge"
                                style={{
                                  background: AXE_META[j.axe].color,
                                  color: '#fff',
                                }}
                                aria-hidden
                              >
                                {AXE_META[j.axe].short}
                              </span>
                              <span className="mr-tgrid__pill-num">{j.numero ?? '—'}</span>
                              <span className="mr-tgrid__pill-name">{j.nom || 'Sans titre'}</span>
                            </button>
                          ))}
                        </div>
                        {!readOnly && (
                          <button
                            type="button"
                            className="mr-tgrid__cell-plus"
                            aria-label={`Ajouter un jalon — ${ch.nom} — ${h.label}`}
                            onClick={() => onQuickAddInCell(ch.id, h.col)}
                          >
                            <span className="mr-tgrid__cell-plus-ring" aria-hidden>
                              +
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
