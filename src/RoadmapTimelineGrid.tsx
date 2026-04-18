import type { Axe, Chantier, Jalon } from './lib/types'
import {
  assignJalonToColumn,
  buildTimelineColumns,
  sortJalonsForCell,
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

/**
 * Un chantier avec `axe` renseigné n’apparaît que dans ce bloc (pas de copie sur les 4 axes).
 * Chantiers sans axe (données antérieures) : visibles uniquement dans les blocs où ils ont au moins un jalon ;
 * s’ils n’en ont aucun, une seule ligne sur Processus pour éviter les doublons vides.
 */
export function chantierVisibleInAxisBlock(c: Chantier, blockAxe: Axe, jalons: Jalon[]): boolean {
  const typed = c.axe != null && String(c.axe).trim() !== ''
  if (typed) {
    return c.axe === blockAxe
  }
  if (jalons.length === 0) {
    return blockAxe === 'PROCESSUS'
  }
  return jalons.some((j) => j.axe === blockAxe)
}

type Props = {
  chantiers: Chantier[]
  jalonsByChantier: Record<string, Jalon[]>
  axeFilter: 'all' | Axe
  readOnly: boolean
  projectColorById: Record<string, string>
  projetNomById: Record<string, string>
  onOpenJalon: (jalon: Jalon, chantierId: string) => void
  onQuickAddInCell: (chantierId: string, column: TimelineColumn, axe: Axe) => void
  /** Case « réalisé » sur la pilule (hors lecture seule). */
  onToggleJalonRealise?: (jalon: Jalon, chantierId: string, realised: boolean) => void
  /**
   * Clic sur la cellule « Chantier » : nom + rattachement projet.
   * `chantierId === null` = créer une ligne dans le bloc `axeForCreate` (type Processus / … / KPI).
   */
  onChantierCellClick?: (chantierId: string | null, axeForCreate?: Axe) => void
}

export default function RoadmapTimelineGrid({
  chantiers,
  jalonsByChantier,
  axeFilter,
  readOnly,
  projectColorById,
  projetNomById,
  onOpenJalon,
  onQuickAddInCell,
  onToggleJalonRealise,
  onChantierCellClick,
}: Props) {
  const timeColumns = buildTimelineColumns(new Date())

  const headerCells: { key: string; label: string; sub: string; col: TimelineColumn }[] = timeColumns.map((c) => ({
    key: c.key,
    label: c.label,
    sub:
      c.kind === 'quarter'
        ? 'Échéance'
        : c.kind === 'year'
          ? 'Horizon annuel'
          : 'Projection',
    col: c,
  }))

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

  /** Couleur des pilules = projet transformant du chantier (voir `projectColorById[ch.projet_id]`). */
  const defaultPillColor = 'var(--theme-accent, #8e3b46)'

  return (
    <div className="mr-tgrid-wrap">
      <p className="mr-tgrid-intro">
        Chaque <strong>chantier</strong> n’apparaît que dans le <strong>bloc d’axe</strong> où vous le créez (pas de doublon
        sur les autres axes). Rattachement au projet transformant ; les <strong>jalons</strong> reprennent la couleur du
        projet. Un seul jalon par case temps — le <strong>+</strong> disparaît une fois le jalon créé. Faites défiler
        horizontalement si besoin ; les colonnes sont condensées pour limiter la largeur.
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
          {axesToShow.map((axe, blockIndex) => {
            const blockChantiers = chantiers.filter((c) =>
              chantierVisibleInAxisBlock(c, axe, jalonsByChantier[c.id] ?? []),
            )
            const showEmptyReadonlyRow = readOnly && blockChantiers.length === 0
            const rowCount =
              showEmptyReadonlyRow ? 1 : blockChantiers.length + (readOnly ? 0 : 1)
            return (
            <tbody key={axe} className="mr-tgrid__axis-block">
              {Array.from({ length: rowCount }, (_, rowIdx) => {
                const isAddRow = !readOnly && rowIdx === blockChantiers.length
                const isReadonlyEmpty = showEmptyReadonlyRow && rowIdx === 0
                const ch = rowIdx < blockChantiers.length ? blockChantiers[rowIdx] : null
                const isFirst = rowIdx === 0
                const blockStartRow = blockIndex > 0 && rowIdx === 0

                if (isReadonlyEmpty) {
                  return (
                    <tr key={`${axe}-empty`} className={blockStartRow ? 'mr-tgrid__block-start-row' : undefined}>
                      {isFirst ? (
                        <td
                          rowSpan={rowCount}
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
                        className="mr-tgrid__sticky mr-tgrid__sticky--chantier mr-tgrid__chantier-cell mr-tgrid__chantier-cell--empty"
                      >
                        <span className="mr-tgrid__chantier-empty">—</span>
                      </th>
                      {headerCells.map((h) => (
                        <td key={h.key} className="mr-tgrid__cell mr-tgrid__cell--filler" aria-hidden />
                      ))}
                    </tr>
                  )
                }

                if (isAddRow) {
                  return (
                    <tr
                      key={`${axe}-add`}
                      className={`mr-tgrid__add-line-row${blockStartRow ? ' mr-tgrid__block-start-row' : ''}`}
                    >
                      {isFirst ? (
                        <td
                          rowSpan={rowCount}
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
                        className="mr-tgrid__sticky mr-tgrid__sticky--chantier mr-tgrid__chantier-cell mr-tgrid__chantier-cell--add"
                      >
                        <button
                          type="button"
                          className="mr-tgrid__chantier-add-placeholder"
                          onClick={() => onChantierCellClick?.(null, axe)}
                          disabled={!onChantierCellClick}
                          aria-label="Définir la ligne : nom du chantier et projet transformant"
                        >
                          Cliquer ici — chantier et projet transformant
                        </button>
                      </th>
                      {headerCells.map((h) => (
                        <td key={h.key} className="mr-tgrid__cell mr-tgrid__cell--filler" aria-hidden />
                      ))}
                    </tr>
                  )
                }

                if (!ch) return null

                const buckets = bucketForChantierAxis(ch.id, axe)
                const projectColor = projectColorById[ch.projet_id] ?? defaultPillColor
                const projetLabel = projetNomById[ch.projet_id] ?? ''

                return (
                  <tr
                    key={`${axe}-${ch.id}`}
                    className={blockStartRow ? 'mr-tgrid__block-start-row' : undefined}
                  >
                    {isFirst ? (
                      <td
                        rowSpan={rowCount}
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
                          onClick={() => onChantierCellClick(ch.id, undefined)}
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
                                      title={
                                        j.numero
                                          ? `${j.nom || 'Jalon'} (${j.numero}) — ${STATUT_LABEL[j.statut] ?? j.statut}`
                                          : `${j.nom || 'Jalon'} — ${STATUT_LABEL[j.statut] ?? j.statut}`
                                      }
                                    >
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
          })}
        </table>
      </div>
    </div>
  )
}
