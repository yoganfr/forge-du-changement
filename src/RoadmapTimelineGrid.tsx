import type { Axe, Chantier, Jalon } from './lib/types'
import {
  assignJalonToColumn,
  buildTimelineColumns,
  sortJalonsForCell,
  UNSCHEDULED_KEY,
} from './lib/roadmapTimelineColumns'

const AXES: Axe[] = ['PROCESSUS', 'ORGANISATION', 'OUTILS', 'KPI']

const AXE_META: Record<Axe, { short: string; color: string }> = {
  PROCESSUS: { short: 'P', color: '#8E3B46' },
  ORGANISATION: { short: 'O', color: '#4C86A8' },
  OUTILS: { short: 'I', color: '#477890' },
  KPI: { short: 'K', color: '#B45309' },
}

const STATUT_LABEL: Record<string, string> = {
  a_venir: 'À venir',
  en_cours: 'En cours',
  realise: 'Réalisé',
  bloque: 'Bloqué',
}

type Props = {
  chantiers: Chantier[]
  jalonsByChantier: Record<string, Jalon[]>
  axeFilter: 'all' | Axe
  readOnly: boolean
  onOpenJalon: (jalon: Jalon, chantierId: string) => void
  onAddJalon: (chantierId: string, axe: Axe) => void
}

export default function RoadmapTimelineGrid({
  chantiers,
  jalonsByChantier,
  axeFilter,
  readOnly,
  onOpenJalon,
  onAddJalon,
}: Props) {
  const timeColumns = buildTimelineColumns(new Date())
  const headerCells: { key: string; label: string; sub?: string }[] = [
    { key: UNSCHEDULED_KEY, label: 'Sans date', sub: 'À planifier' },
    ...timeColumns.map((c) => ({
      key: c.key,
      label: c.label,
      sub: c.kind === 'quarter' ? 'Trimestre' : c.kind === 'year' ? 'Année' : 'Au-delà',
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

  return (
    <div className="mr-tgrid-wrap">
      <p className="mr-tgrid-intro">
        Vue synthèse : chaque <strong>chantier</strong> est une ligne ; les <strong>jalons</strong> se lisent de gauche à
        droite dans le temps — 4 trimestres à maille fine, puis le détail par année.
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
              {!readOnly && <th scope="col" className="mr-tgrid__actions-head" />}
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
                      <div className="mr-tgrid__pills">
                        {(buckets.get(h.key) ?? []).map((j) => (
                          <button
                            key={j.id}
                            type="button"
                            className="mr-tgrid__pill"
                            onClick={() => onOpenJalon(j, ch.id)}
                            title={`${j.nom || 'Jalon'} — ${STATUT_LABEL[j.statut] ?? j.statut}`}
                          >
                            <span
                              className="mr-tgrid__axe-dot"
                              style={{ background: AXE_META[j.axe].color }}
                              aria-hidden
                            />
                            <span className="mr-tgrid__pill-num">{j.numero ?? '—'}</span>
                            <span className="mr-tgrid__pill-name">{j.nom || 'Sans titre'}</span>
                          </button>
                        ))}
                      </div>
                    </td>
                  ))}
                  {!readOnly && (
                    <td className="mr-tgrid__actions">
                      <div className="mr-tgrid__add-menu">
                        <span className="mr-tgrid__add-label">+ Jalon</span>
                        <div className="mr-tgrid__add-btns">
                          {AXES.map((axe) => (
                            <button
                              key={axe}
                              type="button"
                              className="mr-tgrid__add-axe"
                              style={{ borderColor: AXE_META[axe].color }}
                              onClick={() => onAddJalon(ch.id, axe)}
                              title={axe}
                            >
                              {AXE_META[axe].short}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

