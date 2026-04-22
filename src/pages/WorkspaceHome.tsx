import { Fragment, useEffect, useRef } from 'react'
import type { AppUserRole } from '../lib/appRole'

type StepStatus = 'done' | 'current' | 'upcoming'

export type WorkspaceHomeProps = {
  currentStep: number | null
  currentUserRole: AppUserRole
  workspaceName: string
  navigateToMainNav: (navId: string) => void
  onOpenRoadmap: () => void
}

type StepDef = {
  id: number
  title: string
  descCodir: string
  descContributeur: string
  moduleLabel: string
  moduleNavId: string | null
}

const STEPS: readonly StepDef[] = [
  {
    id: 1,
    title: 'Prioriser les projets transformants',
    descCodir: 'Je veux sélectionner et prioriser mes projets transformants',
    descContributeur: 'Je consulte les projets transformants de ma direction',
    moduleLabel: 'Projets transformants',
    moduleNavId: 'fabrique',
  },
  {
    id: 2,
    title: 'Construire une roadmap claire',
    descCodir: 'Je veux décliner mes projets transformants en Maturity Roadmaps',
    descContributeur: "J'apporte mes feedbacks à la Maturity Roadmap de ma Direction",
    moduleLabel: 'Roadmap',
    moduleNavId: 'roadmap',
  },
  {
    id: 3,
    title: 'Engager les équipes',
    descCodir: 'Je veux répondre et arbitrer les feedbacks de mon équipe sur ma Maturity Roadmap',
    descContributeur: 'Je prends connaissance des arbitrages suite à ma Review de Maturity Roadmap',
    moduleLabel: 'Feedbacks Roadmap',
    moduleNavId: null,
  },
  {
    id: 4,
    title: 'Décliner en actions concrètes',
    descCodir: "J'affecte les jalons à des Managers pour la réalisation de Plans d'action et plans de charge",
    descContributeur: "Je crée mon Plan d'action d'équipe et mon plan de charge pour les jalons affectés",
    moduleLabel: "Plans d'action (PAE) & Plans de charge",
    moduleNavId: null,
  },
  {
    id: 5,
    title: 'Lancer réellement',
    descCodir: 'Je prépare ma présentation de la Maturity Roadmap V2 et des PAE',
    descContributeur: "Je présente mes Plans d'action dans le cadre du kick-off d'équipe",
    moduleLabel: 'Kick-off',
    moduleNavId: null,
  },
  {
    id: 6,
    title: 'Piloter dans la durée',
    descCodir: 'Je suis la réalisation des plans d\'action dans le temps et mets à jour la Maturity Roadmap',
    descContributeur: "J'effectue le reporting de mes PAE et décline de nouveaux jalons en plans d'action",
    moduleLabel: 'Suivi PAE',
    moduleNavId: null,
  },
]

function resolveStatus(stepId: number, currentStep: number | null): StepStatus {
  if (currentStep === null) return 'upcoming'
  if (stepId < currentStep) return 'done'
  if (stepId === currentStep) return 'current'
  return 'upcoming'
}

export default function WorkspaceHome({
  currentStep,
  currentUserRole,
  workspaceName,
  navigateToMainNav,
  onOpenRoadmap,
}: WorkspaceHomeProps) {
  const isContributeur = currentUserRole === 'contributeur'
  const currentArticleRef = useRef<HTMLElement | null>(null)
  const n = STEPS.length

  useEffect(() => {
    const t = window.requestAnimationFrame(() => {
      currentArticleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return () => window.cancelAnimationFrame(t)
  }, [currentStep])

  function handleCta(step: StepDef) {
    if (step.moduleNavId === 'roadmap') {
      onOpenRoadmap()
    } else if (step.moduleNavId) {
      navigateToMainNav(step.moduleNavId)
    }
  }

  return (
    <div className="wh-page">
      <style>{CSS}</style>

      <div className="wh-inner">
        <header className="wh-header">
          <p className="wh-header-company">{workspaceName}</p>
          <h1 className="wh-header-title">Votre parcours de transformation</h1>
          {currentStep !== null && (
            <p className="wh-header-step">Étape {currentStep}&thinsp;/&thinsp;6 en cours</p>
          )}
        </header>

        <div className="workspace-home-roadmap">
          <div
            className="landing-roadmap-grid"
            aria-label="Trajectoire en six étapes"
            style={{ gridTemplateRows: `repeat(${n}, auto)` }}
          >
            <div
              className="landing-roadmap-road-cell"
              style={{ gridColumn: 1, gridRow: `1 / span ${n}` }}
              aria-hidden
            >
              <img
                src="/images/roadmap/road.svg"
                alt=""
                className="landing-roadmap-road-svg"
                decoding="async"
              />
            </div>

            {STEPS.map((step, i) => {
              const rowIndex = i + 1
              const num = String(step.id).padStart(2, '0')
              const status = resolveStatus(step.id, currentStep)
              const pinSrc = status === 'current'
                ? '/images/roadmap/pin-red.svg'
                : '/images/roadmap/pin-blue.svg'
              const desc = isContributeur ? step.descContributeur : step.descCodir
              const showDetail = status !== 'done'
              const showCta = showDetail && step.moduleNavId !== null
              const showSoon = showDetail && step.moduleNavId === null

              return (
                <Fragment key={step.id}>
                  <div
                    className="landing-roadmap-pin-cell"
                    style={{ gridColumn: 2, gridRow: rowIndex }}
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
                    style={{ gridColumn: 3, gridRow: rowIndex }}
                    data-step-status={status}
                  >
                    <span className="landing-roadmap-connector-line" aria-hidden />
                  </div>
                  <article
                    ref={status === 'current' ? currentArticleRef : undefined}
                    className="landing-roadmap-card landing-roadmap-svg-card"
                    style={{ gridColumn: 4, gridRow: rowIndex }}
                    data-step-status={status}
                    aria-current={status === 'current' ? 'step' : undefined}
                  >
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
                            className="wh-card-cta"
                            onClick={() => handleCta(step)}
                          >
                            {step.moduleLabel}
                            <span className="wh-card-cta-arrow" aria-hidden> →</span>
                          </button>
                        ) : (
                          <span className="wh-card-soon">{step.moduleLabel}</span>
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
  max-width: 780px;
  margin-inline: auto;
  padding: clamp(32px, 5vw, 56px) clamp(16px, 4vw, 40px);
  box-sizing: border-box;
}

.wh-header {
  margin-bottom: clamp(2rem, 4vw, 3rem);
}

.wh-header-company {
  margin: 0 0 6px;
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--theme-text-muted);
}

.wh-header-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 1.1rem + 2.2vw, 2.4rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.15;
  color: var(--theme-text);
}

.wh-header-step {
  margin: 10px 0 0;
  font-size: var(--text-sm);
  color: var(--theme-accent);
  font-weight: 600;
}

/* ── Roadmap grid (full port from web/globals.css) ── */
.landing-roadmap-grid {
  --landing-roadmap-road-w: 2rem;
  --landing-roadmap-pin-col: 3.35rem;
  --landing-roadmap-pin-pull: clamp(0.48rem, 1.2vw, 0.82rem);
  --landing-roadmap-connector-bridge: clamp(0.22rem, 1.5vw, 0.52rem);
  display: grid;
  grid-template-columns:
    var(--landing-roadmap-road-w)
    var(--landing-roadmap-pin-col)
    minmax(0.65rem, 1.35rem)
    minmax(0, 1fr);
  column-gap: 0;
  row-gap: clamp(0.65rem, 1.6vw, 16px);
  align-items: center;
  padding-block: clamp(0.6rem, 1.5vw, 1rem);
  min-width: 0;
  overflow: visible;
}

@media (min-width: 720px) {
  .landing-roadmap-grid {
    --landing-roadmap-road-w: clamp(3.05rem, 1.65rem + 3vw, 4.5rem);
    --landing-roadmap-pin-col: clamp(4.6rem, 4.75vw, 5.15rem);
    row-gap: clamp(0.5rem, 1.4vw, 0.75rem);
  }

  .landing-roadmap-pin-img {
    width: clamp(3.825rem, 6.3vw, 4.8rem);
  }
}

@media (min-width: 960px) {
  .landing-roadmap-grid {
    --landing-roadmap-road-w: clamp(3.35rem, 2.25rem + 2.2vw, 5rem);
    --landing-roadmap-pin-col: clamp(5rem, 5.2vw, 5.5rem);
    row-gap: clamp(0.55rem, 1.3vw, 0.85rem);
  }
}

.landing-roadmap-road-cell {
  position: relative;
  align-self: stretch;
  justify-self: stretch;
  min-width: 0;
  z-index: 0;
  overflow: visible;
}

.landing-roadmap-road-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  z-index: 1;
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
  width: clamp(2.55rem, 4.2vw, 3.2rem);
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
  width: calc(100% + var(--landing-roadmap-connector-bridge));
  margin-inline-start: calc(-1 * var(--landing-roadmap-connector-bridge));
  border-radius: 1px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, #2f5b82 38%, var(--theme-border)),
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
  padding: 20px 28px;
}

.landing-roadmap-num {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.35;
  color: var(--theme-text-muted);
  flex-shrink: 0;
}

.landing-roadmap-sep {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 400;
  color: var(--theme-text-muted);
  flex-shrink: 0;
}

.landing-roadmap-card-title {
  font-family: var(--font-display);
  font-size: clamp(0.95rem, 0.88rem + 0.22vw, 1.08rem);
  font-weight: 600;
  line-height: 1.35;
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
  gap: 8px;
  padding-left: calc(28px + 3px);
  background: var(--theme-bg-raised);
  border: 1px solid color-mix(in srgb, var(--theme-border) 26%, var(--theme-bg-page));
  box-shadow: var(--shadow-md);
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
}

.workspace-home-roadmap .landing-roadmap-svg-card[data-step-status="upcoming"] {
  box-shadow: var(--shadow-sm);
  border-color: color-mix(in srgb, var(--theme-border) 22%, var(--theme-bg-page));
  background: color-mix(in srgb, var(--theme-bg-raised) 92%, var(--theme-bg-page));
}

.workspace-home-roadmap .landing-roadmap-svg-card[data-step-status="done"] {
  opacity: 1;
  background: color-mix(in srgb, var(--theme-bg-page) 55%, var(--theme-bg-raised));
  border-color: color-mix(in srgb, var(--theme-border) 34%, var(--theme-bg-page));
  box-shadow: var(--shadow-sm);
}

.workspace-home-roadmap .landing-roadmap-svg-card[data-step-status="done"]::before {
  content: "";
  position: absolute;
  left: 0;
  top: 16px;
  bottom: 16px;
  width: 3px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--theme-text-muted) 45%, var(--theme-border));
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
  border-color: color-mix(in srgb, var(--theme-accent) 38%, var(--theme-border));
  box-shadow: var(--shadow-md);
  background: color-mix(in srgb, var(--theme-bg-raised) 78%, var(--theme-bg-page));
}

.workspace-home-roadmap .landing-roadmap-svg-card[data-step-status="current"]::before {
  content: "";
  position: absolute;
  left: 0;
  top: 16px;
  bottom: 16px;
  width: 4px;
  border-radius: var(--radius-sm);
  background: var(--theme-accent);
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
  gap: 0.35rem 0.5rem;
  width: 100%;
}

.wh-card-desc {
  margin: 0;
  font-size: var(--text-sm);
  line-height: 1.55;
  color: var(--theme-text-muted);
  max-width: 52ch;
}

.wh-card-footer {
  margin-top: 4px;
}

.wh-card-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--theme-accent);
  text-decoration: none;
  transition: opacity .15s;
}

.wh-card-cta:hover {
  opacity: 0.8;
}

.wh-card-cta-arrow {
  font-size: 0.9em;
  line-height: 1;
}

.wh-card-soon {
  display: inline-block;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--theme-text-muted);
  background: color-mix(in srgb, var(--theme-border) 38%, var(--theme-bg-page));
  border-radius: var(--ui-radius-control);
  padding: 3px 10px;
  letter-spacing: 0.025em;
}
`
