import { useEffect, useMemo, useState } from 'react'
import { updateWorkspaceCurrentStep } from '../lib/api'
import type { Workspace } from '../lib/types'

/**
 * Libellés affichés dans le select "Phase du parcours" — ils doivent rester cohérents avec
 * l'ordre des modules déverrouillés dans App.tsx (`CODIR_JOURNEY_DEFS` / `CONTRIBUTEUR_JOURNEY_DEFS`).
 * Chaque entrée représente une phase atteinte : tout module d'index ≤ à la phase est déverrouillé.
 */
const CODIR_STEP_LABELS: readonly string[] = [
  '1 — Prioriser les projets transformants (Projets transformants)',
  '2 — Construire une roadmap claire (Roadmap)',
  '3 — Engager les équipes (Feedbacks Roadmap)',
  '4 — Décliner en actions concrètes (PAE CODIR)',
  '5 — Lancer réellement (Kick-off)',
  '6 — Piloter dans la durée (Suivi PAE CODIR)',
]

const CONTRIBUTEUR_STEP_LABELS: readonly string[] = [
  '1 — Construire une roadmap claire (Review Roadmap)',
  '2 — Décliner en actions concrètes (PAE contributeur)',
  '3 — Piloter dans la durée (Suivi PAE contributeur)',
]

export interface SettingsPageProps {
  workspaceId: string | null
  workspaceName: string
  workspaces: Workspace[]
  workspacesLoading: boolean
  workspacesError: string | null
  onRefreshWorkspaces: () => void
  onSelectWorkspace: (workspaceId: string) => void
  onAddWorkspace: () => void
  /** Workspace actif complet, fourni par App pour afficher `current_step_codir` / `_contributeur`. */
  currentWorkspace: Workspace | null
  /** Droit d'écriture sur `current_step_*` (superadmin + consultant owner + admin client). */
  canEditCurrentStep: boolean
  /** Callback remonté à App pour rafraîchir le state local après sauvegarde en DB. */
  onCurrentStepUpdated: (patch: {
    current_step_codir: number | null
    current_step_contributeur: number | null
  }) => void
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
  currentWorkspace,
  canEditCurrentStep,
  onCurrentStepUpdated,
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
        trigram_convention: null,
        current_step_codir: currentWorkspace?.current_step_codir ?? null,
        current_step_contributeur: currentWorkspace?.current_step_contributeur ?? null,
        dirigeant_user_id: null,
        created_at: '',
      } as Workspace)
    }
    return out
  }, [workspaces, workspaceId, workspaceName, currentWorkspace])

  // État local : on réagit au workspace affiché pour synchroniser les selects.
  const initialCodir = currentWorkspace?.current_step_codir ?? 0
  const initialContrib = currentWorkspace?.current_step_contributeur ?? 0
  const [codirStep, setCodirStep] = useState<number>(initialCodir)
  const [contribStep, setContribStep] = useState<number>(initialContrib)
  const [savingCodir, setSavingCodir] = useState(false)
  const [savingContrib, setSavingContrib] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

  // Resynchronise l'état local quand on change de workspace ou quand les valeurs distantes bougent.
  useEffect(() => {
    setCodirStep(currentWorkspace?.current_step_codir ?? 0)
    setContribStep(currentWorkspace?.current_step_contributeur ?? 0)
    setStepError(null)
  }, [currentWorkspace?.id, currentWorkspace?.current_step_codir, currentWorkspace?.current_step_contributeur])

  async function persistStep(patch: { codir?: number | null; contributeur?: number | null }) {
    if (!workspaceId) return
    setStepError(null)
    const setSaving = 'codir' in patch ? setSavingCodir : setSavingContrib
    setSaving(true)
    try {
      const updated = await updateWorkspaceCurrentStep(workspaceId, patch)
      onCurrentStepUpdated({
        current_step_codir: updated.current_step_codir,
        current_step_contributeur: updated.current_step_contributeur,
      })
      setLastSavedAt(Date.now())
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setStepError(`Impossible de mettre à jour la phase : ${msg}`)
      // Rollback local en cas d'échec.
      setCodirStep(currentWorkspace?.current_step_codir ?? 0)
      setContribStep(currentWorkspace?.current_step_contributeur ?? 0)
    } finally {
      setSaving(false)
    }
  }

  function handleCodirChange(value: number) {
    setCodirStep(value)
    void persistStep({ codir: value === 0 ? null : value })
  }

  function handleContribChange(value: number) {
    setContribStep(value)
    void persistStep({ contributeur: value === 0 ? null : value })
  }

  const readonlyReason = canEditCurrentStep
    ? null
    : "Vous n'avez pas les droits pour modifier la phase. Seuls le super admin plateforme, le consultant owner de l'espace et un admin client peuvent ajuster le curseur."

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

      <section className="settings-page__card" aria-labelledby="settings-journey-phase-heading">
        <h2 id="settings-journey-phase-heading" className="settings-page__section-title">
          Phase du parcours de transformation
        </h2>
        <p className="settings-page__lead">
          Chaque parcours (CODIR et Contributeur) avance en phases successives. La phase sélectionnée ici
          <strong> déverrouille les modules correspondants</strong> dans la navigation de tous les membres de l'espace :
          toutes les étapes d'index inférieur ou égal deviennent accessibles, les suivantes restent marquées « Bientôt ».
          La pilule « Étape en cours » dans le menu suit également cette valeur.
        </p>

        {!canEditCurrentStep ? (
          <p className="settings-page__field-hint" style={{ fontStyle: 'italic' }}>
            {readonlyReason}
          </p>
        ) : null}

        <div className="settings-page__field">
          <label htmlFor="settings-step-codir" className="settings-page__label">
            Phase du parcours membre CODIR
          </label>
          <select
            id="settings-step-codir"
            className="settings-page__select"
            value={codirStep}
            onChange={(e) => handleCodirChange(Number(e.target.value))}
            disabled={!canEditCurrentStep || savingCodir || !workspaceId}
          >
            <option value={0}>— Parcours non démarré (tous modules verrouillés)</option>
            {CODIR_STEP_LABELS.map((label, idx) => (
              <option key={idx + 1} value={idx + 1}>
                Phase {label}
              </option>
            ))}
          </select>
          <p className="settings-page__field-hint">
            {savingCodir ? 'Enregistrement…' : 'Les modules CODIR jusqu\'à cette phase incluse sont déverrouillés.'}
          </p>
        </div>

        <div className="settings-page__field">
          <label htmlFor="settings-step-contrib" className="settings-page__label">
            Phase du parcours membre Contributeur
          </label>
          <select
            id="settings-step-contrib"
            className="settings-page__select"
            value={contribStep}
            onChange={(e) => handleContribChange(Number(e.target.value))}
            disabled={!canEditCurrentStep || savingContrib || !workspaceId}
          >
            <option value={0}>— Parcours non démarré (tous modules verrouillés)</option>
            {CONTRIBUTEUR_STEP_LABELS.map((label, idx) => (
              <option key={idx + 1} value={idx + 1}>
                Phase {label}
              </option>
            ))}
          </select>
          <p className="settings-page__field-hint">
            {savingContrib ? 'Enregistrement…' : 'Les modules contributeur jusqu\'à cette phase incluse sont déverrouillés.'}
          </p>
        </div>

        {stepError ? <p className="settings-page__error">{stepError}</p> : null}
        {lastSavedAt && !stepError && !savingCodir && !savingContrib ? (
          <p className="settings-page__field-hint" style={{ color: 'var(--theme-text-muted)' }}>
            Dernière sauvegarde : {new Date(lastSavedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        ) : null}
      </section>
    </div>
  )
}
