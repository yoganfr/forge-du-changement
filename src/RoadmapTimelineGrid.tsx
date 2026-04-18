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

export type RoadmapLegendProject = {
  id: string
  nom: string
  color: string
  checked: boolean
}

type Props = {
  chantiers: Chantier[]
  jalonsByChantier: Record<string, Jalon[]>
  axeFilter: 'all' | Axe
  readOnly: boolean
  legendProjects: RoadmapLegendProject[]
  onToggleLegendProject: (projetId: string) => void
  onSelectAllLegendProjects: () => void
  onDeselectAllLegendProjects: () => void
  projectColorById: Record<string, string>
  projetNomById: Record<string, string>
  onOpenJalon: (jalon: Jalon, chantierId: string) => void
  onQuickAddInCell: (
    chantierId: string,
    column: TimelineColumn | typeof UNSCHEDULED_KEY,
    axe: Axe,
  ) => void
  /** Case « réalisé » sur la pilule (hors lecture seule). */
  onToggleJalonRealise?: (jalon: Jalon, chantierId: string, realised: boolean) => void
  /** Clic sur la cellule « Chantier » : nom + rattachement projet (hors lecture seule). */
  onChantierCellClick?: (chantierId: string) => void
  /** Ligne d’ajout en bas du tableau (pas de bouton séparé dans la barre). */
  onAddChantierRowClick?: () => void
}

export default function RoadmapTimelineGrid({
  chantiers,
  jalonsByChantier,
  axeFilter,
  readOnly,
  legendProjects,
  onToggleLegendProject,
  onSelectAllLegendProjects,
  onDeselectAllLegendProjects,
  projectColorById,
  projetNomById,
  onOpenJalon,
  onQuickAddInCell,
  onToggleJalonRealise,
  onChantierCellClick,
  onAddChantierRowClick,
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

  const axesToShow: Axe[] = axeFilter === 'all' ? AXES : [axeFilter]

  function bucketForChantierAxis(chId: string, blockAxe: Axe): Map<string, Jalon[]> {
    const raw = (jalonsByChantier[chId] ?? []).filter((j) => j.axe === blockAxe)
    const map = new Map<string, Jalon[]>()
    for (const j of raw) {
      const k = assignJalonToColumn(j, timeColumns)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(j)
    }
    for (const [, arr] of map) sortJalonsForCell(arr)
    return map
  }

  const defaultPillColor = 'var(--theme-accent, #8e3b46)'
  const colCount = headerCells.length + 2

  return (
    <div className="mr-tgrid-wrap">
      <div className="mr-tgrid-legend" role="group" aria-label="Projets transformants">
        <span className="mr-tgrid-legend__label">Projets transformants</span>
        <div className="mr-tgrid-legend__toolbar">
          <button type="button" className="mr-tgrid-legend__link" onClick={onSelectAllLegendProjects}>
            Tout afficher
          </button>
          <span className="mr-tgrid-legend__sep" aria-hidden>
            ·
          </span>
          <button type="button" className="mr-tgrid-legend__link" onClick={onDeselectAllLegendProjects}>
            Tout masquer
          </button>
        </div>
        <ul className="mr-tgrid-legend__list">
          {legendProjects.map((p) => (
            <li key={p.id} className="mr-tgrid-legend__item">
              <label className="mr-tgrid-legend__check">
                <input
                  type="checkbox"
                  checked={p.checked}
                  onChange={() => onToggleLegendProject(p.id)}
                />
                <span className="mr-tgrid-legend__swatch" style={{ background: p.color }} aria-hidden />
                <span>{p.nom}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <p className="mr-tgrid-intro">
        Quatre <strong>blocs d’axe</strong> : chaque <strong>ligne chantier</strong> se définit en cliquant sur son
        intitulé. Une case temps ne contient qu’<strong>un seul jalon</strong> : le <strong>+</strong> disparaît une fois le
        jalon créé ; cliquez sur le jalon pour ouvrir le détail et le <strong>supprimer</strong>, ce qui réaffiche le +.
      </p>

      <div className="mr-tgrid-scroll" role="region" aria-label="Tableau roadmap par axe et temps">
        <table className="mr-tgrid mr-tgrid--matrix">
          <thead>
            <tr>
              <th scope="col" className="mr-tgrid__sticky mr-tgrid__sticky--axis mr-tgrid__axis-head">
                Axe
              </th>
              <th scope="col" className="mr-tgrid__sticky mr-tgrid__sticky--chantier mr-tgrid__chantier-head">
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
          {chantiers.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={colCount} className="mr-tgrid__empty">
                  {legendProjects.some((p) => p.checked)
                    ? 'Aucun chantier pour les projets sélectionnés. Utilisez la ligne ci-dessous ou cochez d’autres projets dans la légende.'
                    : 'Cochez au moins un projet dans la légende, ou ajoutez une ligne de chantier ci-dessous.'}
                </td>
              </tr>
              {!readOnly && onAddChantierRowClick ? (
                <tr className="mr-tgrid__add-chantier-row">
                  <td
                    colSpan={2}
                    className="mr-tgrid__sticky mr-tgrid__sticky--chantier mr-tgrid__add-chantier-cell"
                  >
                    <button type="button" className="mr-tgrid__chantier-add-line" onClick={onAddChantierRowClick}>
                      + Ajouter une ligne de chantier
                    </button>
                  </td>
                  {headerCells.map((h) => (
                    <td key={h.key} className="mr-tgrid__cell mr-tgrid__cell--filler" aria-hidden />
                  ))}
                </tr>
              ) : null}
            </tbody>
          ) : (
            axesToShow.map((axe, blockIndex) => {
              const n = chantiers.length
              return (
                <tbody key={axe} className="mr-tgrid__axis-block">
                  {chantiers.map((ch, rowIdx) => {
                    const buckets = bucketForChantierAxis(ch.id, axe)
                    const projectColor = projectColorById[ch.projet_id] ?? defaultPillColor
                    const projetLabel = projetNomById[ch.projet_id] ?? ''
                    const isFirst = rowIdx === 0
                    const blockStartRow = blockIndex > 0 && rowIdx === 0
                    return (
                      <tr
                        key={`${axe}-${ch.id}`}
                        className={blockStartRow ? 'mr-tgrid__block-start-row' : undefined}
                      >
                        {isFirst ? (
                          <td
                            rowSpan={n}
                            className="mr-tgrid__sticky mr-tgrid__sticky--axis mr-tgrid__axis-cell"
                            style={{
                              borderLeftColor: AXE_META[axe].color,
                              background: `color-mix(in srgb, ${AXE_META[axe].color} 14%, var(--theme-bg-card))`,
                            }}
                          >
                            <span className="mr-tgrid__axis-cell-title">{AXE_META[axe].title}</span>
                          </td>
                        ) : null}
                        <th
                          scope="row"
                          className="mr-tgrid__sticky mr-tgrid__sticky--chantier mr-tgrid__chantier-cell"
                        >
                          {!readOnly && onChantierCellClick ? (
                            <button
                              type="button"
                              className="mr-tgrid__chantier-name-btn"
                              onClick={() => onChantierCellClick(ch.id)}
                            >
                              <span className="mr-tgrid__chantier-name">{ch.nom}</span>
                              {projetLabel ? (
                                <span className="mr-tgrid__chantier-projet" title="Projet parent">
                                  {projetLabel}
                                </span>
                              ) : null}
                            </button>
                          ) : (
                            <>
                              <span className="mr-tgrid__chantier-name">{ch.nom}</span>
                              {projetLabel ? (
                                <span className="mr-tgrid__chantier-projet" title="Projet parent">
                                  {projetLabel}
                                </span>
                              ) : null}
                            </>
                          )}
                        </th>
                        {headerCells.map((h) => {
                          const cellJalons = buckets.get(h.key) ?? []
                          const cellEmpty = cellJalons.length === 0
                          return (
                          <td key={h.key} className="mr-tgrid__cell">
                            <div className="mr-tgrid__cell-inner">
                              <div className="mr-tgrid__pills">
                                {cellJalons.map((j) => {
                                  const realised = j.statut === 'realise'
                                  return (
                                    <div
                                      key={j.id}
                                      className="mr-tgrid__pill mr-tgrid__pill--matrix"
                                      style={{
                                        borderLeft: `4px solid ${projectColor}`,
                                        background: `color-mix(in srgb, ${projectColor} 22%, var(--theme-bg-card))`,
                                      }}
                                    >
                                      {!readOnly && onToggleJalonRealise ? (
                                        <label className="mr-tgrid__pill-check">
                                          <input
                                            type="checkbox"
                                            checked={realised}
                                            aria-label={`Réalisé — ${j.nom || 'Jalon'}`}
                                            onChange={(e) => {
                                              e.stopPropagation()
                                              onToggleJalonRealise(j, ch.id, e.target.checked)
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </label>
                                      ) : null}
                                      <button
                                        type="button"
                                        className="mr-tgrid__pill-main"
                                        onClick={() => onOpenJalon(j, ch.id)}
                                        title={`${j.nom || 'Jalon'} — ${STATUT_LABEL[j.statut] ?? j.statut}`}
                                      >
                                        <span className="mr-tgrid__pill-num">{j.numero ?? '—'}</span>
                                        <span className="mr-tgrid__pill-name">{j.nom || 'Sans titre'}</span>
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                              {!readOnly && cellEmpty && (
                                <button
                                  type="button"
                                  className="mr-tgrid__cell-plus"
                                  aria-label={`Ajouter un jalon — ${ch.nom} — ${AXE_META[axe].title} — ${h.label}`}
                                  onClick={() => onQuickAddInCell(ch.id, h.col, axe)}
                                >
                                  <span className="mr-tgrid__cell-plus-ring" aria-hidden>
                                    +
                                  </span>
                                </button>
                              )}
                            </div>
                          </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              )
            })
          )}
          {chantiers.length > 0 && !readOnly && onAddChantierRowClick ? (
            <tbody>
              <tr className="mr-tgrid__add-chantier-row">
                <td className="mr-tgrid__sticky mr-tgrid__sticky--axis mr-tgrid__add-axis-filler" aria-hidden>
                  {' '}
                </td>
                <td className="mr-tgrid__sticky mr-tgrid__sticky--chantier mr-tgrid__add-chantier-cell">
                  <button type="button" className="mr-tgrid__chantier-add-line" onClick={onAddChantierRowClick}>
                    + Ajouter une ligne de chantier
                  </button>
                </td>
                {headerCells.map((h) => (
                  <td key={h.key} className="mr-tgrid__cell mr-tgrid__cell--filler" aria-hidden />
                ))}
              </tr>
            </tbody>
          ) : null}
        </table>
      </div>
    </div>
  )
}
