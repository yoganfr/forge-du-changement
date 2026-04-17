import { useMemo } from 'react'
import type { Workspace } from '../lib/types'

export interface SettingsPageProps {
  workspaceId: string | null
  workspaceName: string
  workspaces: Workspace[]
  workspacesLoading: boolean
  workspacesError: string | null
  onRefreshWorkspaces: () => void
  onSelectWorkspace: (workspaceId: string) => void
  onAddWorkspace: () => void
}

export default function SettingsPage({
  workspaceId,
  workspaceName,
  workspaces,
  workspacesLoading,
  workspacesError,
  onRefreshWorkspaces,
  onSelectWorkspace,
  onAddWorkspace,
}: SettingsPageProps) {
  const workspaceOptions = useMemo(() => {
    const seen = new Set(workspaces.map((w) => w.id))
    const out = [...workspaces]
    if (workspaceId && !seen.has(workspaceId)) {
      out.unshift({
        id: workspaceId,
        company_name: `${workspaceName} (espace actuel)`,
        sector: null,
        size: null,
        logo_url: null,
        created_at: '',
      } as Workspace)
    }
    return out
  }, [workspaces, workspaceId, workspaceName])

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <h1 className="settings-page__title">Paramètres</h1>
        <p className="settings-page__lead">
          Gestion des espaces entreprise clients : créer un espace, choisir celui que vous explorez, puis ouvrir la
          fiche entreprise pour les membres et les invitations.
        </p>
      </header>

      <section className="settings-page__card" aria-labelledby="settings-missions-heading">
        <h2 id="settings-missions-heading" className="settings-page__section-title">
          Missions &amp; entreprises clientes
        </h2>

        <div className="settings-page__actions">
          <button type="button" className="settings-page__btn settings-page__btn--primary" onClick={onAddWorkspace}>
            + Ajouter une entreprise
          </button>
          <button
            type="button"
            className="settings-page__btn settings-page__btn--ghost"
            onClick={onRefreshWorkspaces}
            disabled={workspacesLoading}
          >
            {workspacesLoading ? 'Chargement…' : 'Actualiser la liste'}
          </button>
        </div>

        <div className="settings-page__field">
          <label htmlFor="settings-workspace-select" className="settings-page__label">
            Entreprise à explorer
          </label>
          <select
            id="settings-workspace-select"
            className="settings-page__select"
            value={workspaceId ?? ''}
            onChange={(e) => {
              const id = e.target.value
              if (id) onSelectWorkspace(id)
            }}
            disabled={workspacesLoading || workspaceOptions.length === 0}
          >
            {workspaceOptions.length === 0 && !workspacesLoading ? (
              <option value="">Aucun espace disponible</option>
            ) : (
              workspaceOptions.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.company_name}
                </option>
              ))
            )}
          </select>
          <p className="settings-page__field-hint">
            Après sélection, la barre du haut et les modules utilisent cet espace. Ouvrez la{' '}
            <strong>fiche entreprise</strong> (badge avec le nom) pour les membres, inviter et suivre les invitations.
          </p>
        </div>

        {workspacesError && <p className="settings-page__error">{workspacesError}</p>}

        <dl className="settings-page__meta settings-page__meta--compact">
          <div>
            <dt>Espace actif</dt>
            <dd>{workspaceName}</dd>
          </div>
          <div>
            <dt>Identifiant</dt>
            <dd>{workspaceId ?? '—'}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
