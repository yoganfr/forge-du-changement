import type { Chantier, Direction } from './lib/types'
import { roleBadge } from './pciMatrixTypes'
import { usePciMatrix } from './usePciMatrix'

/**
 * REF-7b.1 — Matrice PCI autonome par projet (vue détachée si besoin).
 * La roadmap principale intègre désormais le PCI dans `RoadmapTimelineGrid`.
 */

export type RaciChantiersMatrixProps = {
  chantiers: Chantier[]
  workspaceDirections: Direction[]
  readOnly?: boolean
  projet_id: string
  workspaceId: string
  onDirectionCreated?: (direction: Direction) => void | Promise<void>
}

export default function RaciChantiersMatrix({
  chantiers,
  workspaceDirections,
  readOnly = false,
  projet_id,
  workspaceId,
  onDirectionCreated,
}: RaciChantiersMatrixProps) {
  const pci = usePciMatrix({
    loadMode: 'projet',
    projet_id,
    chantiers,
    workspaceId,
    workspaceDirections,
    readOnly,
    onDirectionCreated,
  })

  const {
    canonicalStakeholders,
    loadError,
    loading,
    readOnly: ro,
    getRowFor,
    openCell,
    openNewStakeholder,
    openEditStakeholder,
    popoverNode,
  } = pci

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
                  className={`rcm-col-stakeholder ${ro ? '' : 'rcm-col-stakeholder--editable'}`}
                  title={ro ? s.personne_nom ?? undefined : 'Cliquer pour modifier cette partie prenante'}
                  onClick={ro ? undefined : () => openEditStakeholder(s.key)}
                  role={ro ? undefined : 'button'}
                  tabIndex={ro ? -1 : 0}
                  onKeyDown={(e) => {
                    if (ro) return
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
              {!ro && (
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
                <td className="rcm-empty" colSpan={canonicalStakeholders.length + (ro ? 1 : 2)}>
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
                      className={`rcm-cell ${row ? 'rcm-cell--filled' : 'rcm-cell--empty'} ${ro ? 'rcm-cell--readonly' : ''}`}
                      onClick={() => openCell(c.id, s.key)}
                      title={row?.motivation ?? (badge ? badge.title : 'Cliquer pour impliquer cette partie prenante')}
                      role={ro ? undefined : 'button'}
                      tabIndex={ro ? -1 : 0}
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
                {!ro && (
                  <td
                    className="rcm-cell rcm-cell--add-target"
                    onClick={() => openNewStakeholder(c.id)}
                    role="button"
                    tabIndex={0}
                  >
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

      {popoverNode}
    </section>
  )
}
