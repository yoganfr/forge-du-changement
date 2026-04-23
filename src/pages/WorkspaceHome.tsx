import { Fragment, useEffect, useRef } from 'react'
import type { AppUserRole } from '../lib/appRole'

type StepStatus = 'done' | 'current' | 'upcoming'

type JourneyModuleId =
  | 'projects'
  | 'roadmap'
  | 'review'
  | 'feedbacks'
  | 'pae_codir'
  | 'kickoff'
  | 'suivi_codir'
  | 'pae_contrib'
  | 'suivi_contrib'

export type WorkspaceHomeProps = {
  currentStep: number | null
  currentUserRole: AppUserRole
  loggedInUserName?: string | null
  navigateToMainNav: (navId: string) => void
  onOpenRoadmap: () => void
}

type StepDef = {
  id: number
  title: string
  desc: string
  moduleLabel: string
  moduleNavId: JourneyModuleId
  available: boolean
}

const CODIR_STEPS: readonly StepDef[] = [
  {
    id: 1,
    title: 'Prioriser les projets transformants',
    desc: 'Je veux sélectionner et prioriser mes projets transformants',
    moduleLabel: 'Projets transformants',
    moduleNavId: 'projects',
    available: true,
  },
  {
    id: 2,
    title: 'Construire une roadmap claire',
    desc: 'Je veux décliner mes projets transformants en Maturity Roadmaps',
    moduleLabel: 'Roadmap',
    moduleNavId: 'roadmap',
    available: true,
  },
  {
    id: 3,
    title: 'Engager les équipes',
    desc: 'Je veux répondre et arbitrer les feedbacks de mon équipe sur ma Maturity Roadmap V1',
    moduleLabel: 'Feedbacks Roadmap',
    moduleNavId: 'feedbacks',
    available: false,
  },
  {
    id: 4,
    title: 'Décliner en actions concrètes',
    desc: "J'affecte les jalons de ma Maturity Roadmaps V2 à des Managers pour réalisation de Plans d'actions d'Equipe (PAE) et plans de charge",
    moduleLabel: "Plans d'actions d'Equipe (PAE) & Plans de charge (version membre CODIR)",
    moduleNavId: 'pae_codir',
    available: false,
  },
  {
    id: 5,
    title: 'Lancer réellement',
    desc: 'Je prépare ma présentation de ma Maturity Roadmaps V2 et des PAE',
    moduleLabel: 'Kick-off',
    moduleNavId: 'kickoff',
    available: false,
  },
  {
    id: 6,
    title: 'Piloter dans la durée',
    desc: "Je peux suivre la réalisation des plans d'action dans le temps (vers suivi PAE). Je mets à jour la Maturity Roadmap en fonction de la réalisation réelle",
    moduleLabel: 'Suivi PAE (vue membre CODIR)',
    moduleNavId: 'suivi_codir',
    available: false,
  },
]

const CONTRIBUTEUR_STEPS: readonly StepDef[] = [
  {
    id: 1,
    title: 'Construire une roadmap claire',
    desc: "J'apporte mes feedbacks à la Maturity Roadmap de ma Direction",
    moduleLabel: 'Review Roadmap',
    moduleNavId: 'review',
    available: true,
  },
  {
    id: 2,
    title: 'Décliner en actions concrètes',
    desc: "Je souhaite créer mon plan de charge et mon plan d'action pour les Jalons de la Maturity Roadmap qui m'ont été affectés",
    moduleLabel: "Plans d'actions d'Equipe (PAE) & Plans de charge (version contributeur)",
    moduleNavId: 'pae_contrib',
    available: false,
  },
  {
    id: 3,
    title: 'Piloter dans la durée',
    desc: "J'effectue le bon niveau de reporting lorsque je réalise mes PAE (vers Suivi PAE vue contributeur). Je décline de nouveaux jalons en PAE et plans de charge",
    moduleLabel: 'Suivi PAE (vue contributeur)',
    moduleNavId: 'suivi_contrib',
    available: false,
  },
]

function resolveStatus(stepId: number, currentStep: number | null): StepStatus {
  if (currentStep === null) return stepId === 1 ? 'current' : 'upcoming'
  if (stepId < currentStep) return 'done'
  if (stepId === currentStep) return 'current'
  return 'upcoming'
}

export default function WorkspaceHome({
  currentStep,
  currentUserRole,
  loggedInUserName,
  navigateToMainNav,
  onOpenRoadmap,
}: WorkspaceHomeProps) {
  const isContributeur = currentUserRole === 'contributeur'
  const steps = isContributeur ? CONTRIBUTEUR_STEPS : CODIR_STEPS
  const currentStepForRole = (() => {
    if (currentStep === null) return null
    if (currentStep < 1) return 1
    return Math.min(currentStep, steps.length)
  })()
  const currentArticleRef = useRef<HTMLElement | null>(null)
  const n = steps.length
  const roleLabel = isContributeur ? 'Parcours membre contributeur' : 'Parcours membre CODIR'

  useEffect(() => {
    const t = window.requestAnimationFrame(() => {
      currentArticleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return () => window.cancelAnimationFrame(t)
  }, [currentStepForRole])

  function handleCta(step: StepDef) {
    if (!step.available) return
    if (step.moduleNavId === 'roadmap') {
      onOpenRoadmap()
    } else {
      navigateToMainNav(step.moduleNavId)
    }
  }

  return (
    <div className="wh-page">
      <style>{CSS}</style>

      <div className="wh-inner">
        <header className="wh-header">
          <p className="wh-header-kicker">{roleLabel}</p>
          <h1 className="wh-header-title">Votre parcours de transformation</h1>
          {loggedInUserName ? (
            <p className="wh-header-welcome">Bienvenue, {loggedInUserName}.</p>
          ) : null}
          <p className="wh-header-guidance">
            Cliquez sur le module de l’étape qui vous intéresse&nbsp;:
          </p>
        </header>

        <div className="workspace-home-roadmap">
          <div
            className="landing-roadmap-grid"
            aria-label="Trajectoire en six étapes"
            style={{ gridTemplateRows: `repeat(${n}, auto)` }}
          >
            {steps.map((step, i) => {
              const rowIndex = i + 1
              const num = String(step.id).padStart(2, '0')
              const status = resolveStatus(step.id, currentStepForRole)
              const pinSrc = status === 'current'
                ? '/images/roadmap/pin-red.svg'
                : '/images/roadmap/pin-blue.svg'
              const desc = step.desc
              const showDetail = status !== 'done'
              const showCta = showDetail && step.available
              const showSoon = showDetail && !step.available

              return (
                <Fragment key={step.id}>
                  <div
                    className="landing-roadmap-pin-cell"
                    style={{ gridColumn: 1, gridRow: rowIndex }}
                    data-step-status={status}
                  >
                    <span className="landing-roadmap-pin-wrap">
                      <img
                        src={pinSrc}
                        alt=""
                        width={175}
                        height={104}
                        className="landing-roadmap-pin-img"
                        decoding="async"
                      />
                    </span>
                  </div>
                  <div
                    className="landing-roadmap-connector-cell"
                    style={{ gridColumn: 2, gridRow: rowIndex }}
                    data-step-status={status}
                  >
                    <span className="landing-roadmap-connector-line" aria-hidden />
                  </div>
                  <article
                    ref={status === 'current' ? currentArticleRef : undefined}
                    className="landing-roadmap-card landing-roadmap-svg-card"
                    style={{ gridColumn: 3, gridRow: rowIndex }}
                    data-step-status={status}
                    aria-current={status === 'current' ? 'step' : undefined}
                  >
                    {(status === 'current' || showSoon) ? (
                      <div className="wh-card-corner-badges" aria-hidden>
                        {status === 'current' ? (
                          <span className="wh-card-current-badge">Étape en cours</span>
                        ) : null}
                        {showSoon ? (
                          <span className="wh-card-soon-badge">Bientôt</span>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="wh-card-top">
                      <span className="landing-roadmap-num">{num}</span>
                      <span className="landing-roadmap-sep" aria-hidden>—</span>
                      <h3 className="landing-roadmap-card-title">{step.title}</h3>
                    </div>
                    {showDetail && (
                      <p className="wh-card-desc">{desc}</p>
                    )}
                    {(showCta || showSoon) && (
                      <div className="wh-card-footer">
                        {showCta ? (
                          <button
                            type="button"
                            className="dashboard__logout-btn wh-card-module-btn"
                            onClick={() => handleCta(step)}
                          >
                            {step.moduleLabel}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="dashboard__logout-btn wh-card-module-btn wh-card-module-btn--disabled"
                            disabled
                            aria-disabled="true"
                          >
                            {step.moduleLabel}
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                </Fragment>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const CSS = `
/* ── WorkspaceHome page wrapper ── */
.wh-page {
  min-height: 100%;
  box-sizing: border-box;
  font-family: var(--font-body);
  color: var(--theme-text);
}

.wh-inner {
  max-width: 960px;
  margin-inline: auto;
  padding: clamp(4px, 0.7vw, 8px) clamp(12px, 2vw, 20px) clamp(10px, 1.6vw, 18px);
  box-sizing: border-box;
}

.wh-header {
  margin-bottom: clamp(0.9rem, 1.6vw, 1.2rem);
  max-width: 52rem;
}

.wh-header-kicker {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: color-mix(in srgb, var(--theme-accent) 62%, var(--theme-text-muted));
}

.wh-header-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.24rem, 1.02rem + 0.64vw, 1.56rem);
  font-weight: 600;
  letter-spacing: -0.032em;
  line-height: 1.04;
  color: var(--theme-text);
}

.wh-header-welcome {
  margin: 4px 0 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--theme-text) 82%, var(--theme-text-muted));
}

.wh-header-guidance {
  margin: 2px 0 0;
  font-size: var(--text-sm);
  font-weight: 400;
  line-height: 1.45;
  color: var(--theme-text-muted);
  letter-spacing: 0.02em;
}

/* ── Roadmap grid (full port from web/globals.css) ── */
.landing-roadmap-grid {
  --landing-roadmap-pin-col: 3.35rem;
  --landing-roadmap-pin-pull: clamp(0.48rem, 1.2vw, 0.82rem);
  --landing-roadmap-connector-overlap: clamp(1.8rem, 3vw, 2.3rem);
  display: grid;
  grid-template-columns:
    var(--landing-roadmap-pin-col)
    minmax(0.65rem, 1.35rem)
    minmax(0, 1fr);
  column-gap: 0;
  row-gap: clamp(0.28rem, 0.7vw, 0.46rem);
  align-items: center;
  padding-block: clamp(0.2rem, 0.5vw, 0.4rem);
  min-width: 0;
  overflow: visible;
}

@media (min-width: 720px) {
  .landing-roadmap-grid {
    --landing-roadmap-pin-col: clamp(3.9rem, 4.1vw, 4.5rem);
    row-gap: clamp(0.35rem, 1vw, 0.62rem);
  }

  .landing-roadmap-pin-img {
    width: clamp(3.2rem, 5.2vw, 3.9rem);
  }
}

@media (min-width: 960px) {
  .landing-roadmap-grid {
    --landing-roadmap-pin-col: clamp(4.1rem, 4.2vw, 4.8rem);
    row-gap: clamp(0.32rem, 0.8vw, 0.6rem);
  }
}

.landing-roadmap-pin-cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
  margin-inline-start: calc(-1 * var(--landing-roadmap-pin-pull));
  z-index: 3;
  overflow: visible;
}

.landing-roadmap-pin-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  line-height: 0;
  position: relative;
  z-index: 1;
}

.landing-roadmap-pin-img {
  width: clamp(2rem, 3vw, 2.45rem);
  height: auto;
  display: block;
}

.landing-roadmap-connector-cell {
  display: flex;
  align-items: center;
  align-self: stretch;
  min-width: 0;
  overflow: visible;
  z-index: 1;
}

.landing-roadmap-connector-line {
  display: block;
  height: 1px;
  flex-shrink: 0;
  width: calc(100% + var(--landing-roadmap-connector-overlap));
  margin-inline-start: calc(-1 * var(--landing-roadmap-connector-overlap));
  border-radius: 1px;
  background: linear-gradient(
    90deg,
    var(--theme-route-ink),
    color-mix(in srgb, var(--theme-border) 52%, var(--theme-text) 10%) 55%
  );
  opacity: 0.72;
}

.landing-roadmap-card {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.5rem;
  margin: 0;
  background: var(--theme-bg-raised);
  border: 1px solid color-mix(in srgb, var(--theme-border) 24%, var(--theme-bg-page));
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  min-width: 0;
  width: 100%;
}

.landing-roadmap-svg-card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 7px 12px;
}

.landing-roadmap-num {
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  color: var(--theme-text-muted);
  flex-shrink: 0;
}

.landing-roadmap-sep {
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 400;
  color: var(--theme-text-muted);
  flex-shrink: 0;
}

.landing-roadmap-card-title {
  font-family: var(--font-display);
  font-size: clamp(0.76rem, 0.72rem + 0.08vw, 0.82rem);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--theme-text);
  flex: 1 1 12rem;
  min-width: 0;
  margin: 0;
}

/* ── Status states ── */
.landing-roadmap-pin-cell[data-step-status="done"] .landing-roadmap-pin-img {
  opacity: 0.72;
}

.landing-roadmap-connector-cell[data-step-status="done"] .landing-roadmap-connector-line {
  opacity: 0.38;
}

/* ── Workspace home overrides ── */
.workspace-home-roadmap .landing-roadmap-card.landing-roadmap-svg-card {
  position: relative;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 10px 14px;
  padding-right: max(14px, 6.25rem);
  padding-left: calc(14px + 3px);
  width: min(100%, 560px);
  background: color-mix(in srgb, var(--theme-bg-premium) 72%, var(--theme-bg-page));
  border: 1px solid var(--theme-border-soft);
  box-shadow: 0 8px 20px -16px color-mix(in srgb, var(--theme-text) 18%, transparent), var(--shadow-sm);
}

.workspace-home-roadmap .landing-roadmap-num {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--theme-text-muted);
}

.workspace-home-roadmap .landing-roadmap-sep {
  font-weight: 500;
}

.workspace-home-roadmap .landing-roadmap-card-title {
  letter-spacing: -0.022em;
  font-size: clamp(0.9rem, 0.84rem + 0.14vw, 1rem);
  line-height: 1.1;
}

.workspace-home-roadmap .landing-roadmap-svg-card[data-step-status="upcoming"] {
  box-shadow: var(--shadow-sm);
  border-color: var(--theme-border-soft);
  background: color-mix(in srgb, var(--theme-bg-raised) 92%, var(--theme-bg-page));
}

.workspace-home-roadmap .landing-roadmap-svg-card[data-step-status="done"] {
  opacity: 1;
  background: color-mix(in srgb, var(--theme-bg-page) 58%, var(--theme-bg-raised));
  border-color: color-mix(in srgb, var(--theme-border-soft) 78%, var(--theme-bg-page));
  box-shadow: var(--shadow-sm);
}

.workspace-home-roadmap .landing-roadmap-svg-card[data-step-status="done"] .landing-roadmap-num,
.workspace-home-roadmap .landing-roadmap-svg-card[data-step-status="done"] .landing-roadmap-sep {
  color: color-mix(in srgb, var(--theme-text-muted) 88%, var(--theme-bg-page));
}

.workspace-home-roadmap .landing-roadmap-svg-card[data-step-status="done"] .landing-roadmap-card-title {
  color: color-mix(in srgb, var(--theme-text) 72%, var(--theme-bg-page));
  font-weight: 600;
}

.workspace-home-roadmap .landing-roadmap-svg-card[data-step-status="current"] {
  border-color: color-mix(in srgb, var(--theme-accent) 34%, var(--theme-border-strong));
  box-shadow:
    0 12px 28px -18px color-mix(in srgb, var(--theme-accent) 14%, transparent),
    var(--shadow-sm);
  background: color-mix(in srgb, var(--theme-bg-premium) 84%, var(--theme-bg-page));
}

.workspace-home-roadmap .landing-roadmap-svg-card[data-step-status="current"] .landing-roadmap-num {
  color: color-mix(in srgb, var(--theme-accent) 55%, var(--theme-text-muted));
}

.workspace-home-roadmap .landing-roadmap-svg-card[data-step-status="current"] .landing-roadmap-card-title {
  color: var(--theme-text);
  font-weight: 600;
}

/* ── Card content additions ── */
.wh-card-top {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.1rem 0.2rem;
  width: 100%;
}

.wh-card-desc {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.24;
  color: color-mix(in srgb, var(--theme-text-muted) 92%, var(--theme-bg-page));
  max-width: 52ch;
}

.wh-card-footer {
  margin-top: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.wh-card-module-btn {
  align-self: flex-start;
  max-width: 100%;
  text-align: left;
  white-space: normal;
  line-height: 1.25;
}

/* Même couleur de typo que .company-badge-name (liens modules actifs / disponibles) */
.workspace-home-roadmap .dashboard__logout-btn.wh-card-module-btn:not(.wh-card-module-btn--disabled) {
  color: var(--theme-text);
}

.workspace-home-roadmap .dashboard__logout-btn.wh-card-module-btn:not(.wh-card-module-btn--disabled):hover {
  color: var(--theme-text);
}

.workspace-home-roadmap .wh-card-module-btn--disabled,
.workspace-home-roadmap .wh-card-module-btn--disabled:hover {
  cursor: not-allowed;
  opacity: 0.72;
  color: var(--theme-text-muted);
  border-color: var(--glass-border);
  background: color-mix(in srgb, var(--glass-bg-chip) 90%, transparent);
  transform: none;
  box-shadow: var(--glass-highlight);
}

.workspace-home-roadmap .wh-card-module-btn--disabled:hover {
  color: var(--theme-text-muted);
  border-color: var(--glass-border);
  background: color-mix(in srgb, var(--glass-bg-chip) 90%, transparent);
}

.wh-card-corner-badges {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  pointer-events: none;
  max-width: min(11rem, 46%);
}

/* Mobile : on sort la pilule du chevauchement en la plaçant au-dessus du titre,
   et on retire la réserve de padding-right qui n'est plus nécessaire. */
@media (max-width: 560px) {
  .wh-card-corner-badges {
    position: static;
    flex-direction: row;
    align-self: flex-end;
    align-items: center;
    max-width: 100%;
    margin-bottom: 2px;
    order: -1;
  }

  .workspace-home-roadmap .landing-roadmap-card.landing-roadmap-svg-card {
    padding-right: 14px;
  }
}

.wh-card-current-badge {
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 999px;
  color: var(--theme-text);
  background: color-mix(in srgb, var(--theme-accent) 18%, var(--theme-bg-page));
  border: 1px solid color-mix(in srgb, var(--theme-accent) 48%, transparent);
  flex-shrink: 0;
  text-transform: none;
}

.wh-card-soon-badge {
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 999px;
  color: color-mix(in srgb, var(--theme-text-muted) 86%, var(--theme-text));
  background: color-mix(in srgb, var(--theme-border) 48%, var(--theme-bg-page));
  border: 1px solid color-mix(in srgb, var(--theme-border) 66%, transparent);
  flex-shrink: 0;
}

@media (min-width: 1024px) {
  .wh-inner {
    max-width: 960px;
    padding-top: 2px;
  }

  .landing-roadmap-grid {
    --landing-roadmap-pin-col: 3.55rem;
    row-gap: 0.38rem;
    padding-block: 0.28rem;
  }

  .landing-roadmap-pin-img {
    width: 2.15rem;
  }

  .landing-roadmap-svg-card {
    padding: 8px 12px;
  }

  .workspace-home-roadmap .landing-roadmap-card.landing-roadmap-svg-card {
    width: min(100%, 560px);
    padding: 9px 13px;
    padding-right: max(13px, 6.25rem);
    padding-left: calc(13px + 3px);
    gap: 3px;
  }

  .wh-card-desc {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: none;
  }
}
`
