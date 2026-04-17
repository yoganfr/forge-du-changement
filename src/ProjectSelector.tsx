import { useState } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────

type ProjectType = 'RUN' | 'BUILD'

type Scores = {
  criticite: number
  urgence: number
  recurrence: number
  temps: number
  etp: number
  investissement: number
}

type Coefficients = {
  criticite: number
  urgence: number
  recurrence: number
  temps: number
  etp: number
  investissement: number
}

type Project = {
  id: string
  name: string
  thematique: string
  problematique: string
  description: string
  type: ProjectType
  scores: Scores
  competences_dispo: boolean
  selected_for_transfo: boolean
  planning: Record<string, boolean>
  pilote: string
}

type Perimetre = {
  id: string
  name: string
  color: string
  mission: string
  vision: string
  projects: Project[]
}

// ─── Constantes ─────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

const DEFAULT_COEFFICIENTS: Coefficients = {
  criticite: 3,
  urgence: 2,
  recurrence: 2,
  temps: 1,
  etp: 1,
  investissement: 1,
}

const CRITERIA_META = {
  criticite: { label: 'Criticité', desc: 'Impact si non réalisé', icon: '⚡' },
  urgence: { label: 'Urgence', desc: 'Délai avant problème', icon: '⏱' },
  recurrence: { label: 'Récurrence', desc: 'Fréquence du problème', icon: '🔁' },
  temps: { label: 'Temps', desc: 'Durée de réalisation', icon: '📅' },
  etp: { label: 'ETP', desc: 'Ressources humaines', icon: '👥' },
  investissement: { label: 'Investissement', desc: 'Coût capital', icon: '💰' },
}

const PERIMETRE_COLORS = ['#8E3B46', '#4C86A8', '#477890', '#6B7280', '#7C3AED', '#059669']

// ─── Calcul du score ────────────────────────────────────────────────────────

function computeScore(project: Project, coefs: Coefficients): number {
  const { scores, type, competences_dispo } = project
  const scoreMax =
    (5 * coefs.criticite) +
    (5 * coefs.urgence) +
    (5 * coefs.recurrence) +
    (5 * coefs.temps) +
    (5 * coefs.etp) +
    (5 * coefs.investissement)

  const scoreBrut =
    (scores.criticite * coefs.criticite) +
    (scores.urgence * coefs.urgence) +
    (scores.recurrence * coefs.recurrence) +
    (scores.temps * coefs.temps) +
    (scores.etp * coefs.etp) +
    (scores.investissement * coefs.investissement)

  let normalise = (scoreBrut / scoreMax) * 100
  if (type === 'BUILD') normalise *= 1.5
  if (!competences_dispo) normalise *= 0.8
  return Math.min(100, Math.round(normalise))
}

function getScoreColor(score: number): string {
  if (score >= 76) return '#10B981'
  if (score >= 56) return '#F59E0B'
  if (score >= 31) return '#E0777D'
  return '#6B7280'
}

function getScoreLabel(score: number): string {
  if (score >= 76) return 'Critique'
  if (score >= 56) return 'Haute'
  if (score >= 31) return 'Moyenne'
  return 'Faible'
}

// ─── Données de démo ─────────────────────────────────────────────────────────

const DEMO_DATA: Perimetre[] = [
  {
    id: 'p1',
    name: 'Direction Ressources Humaines',
    color: PERIMETRE_COLORS[0],
    mission: 'Attirer, développer et fidéliser les talents au service de la transformation de l\'entreprise.',
    vision: 'Devenir la DRH de référence dans notre secteur en plaçant l\'humain au cœur de chaque décision stratégique.',
    projects: [
      {
        id: 'pr1', name: 'Refonte SIRH', thematique: 'Digitalisation RH',
        problematique: 'Système vieillissant, données fragmentées, reporting manuel chronophage',
        description: 'Migration vers un SIRH unifié avec module de paie, formation et recrutement intégrés.',
        type: 'BUILD', pilote: 'Marie Dupont',
        scores: { criticite: 5, urgence: 3, recurrence: 4, temps: 4, etp: 3, investissement: 4 },
        competences_dispo: true, selected_for_transfo: true,
        planning: { jan: false, feb: false, mar: true, apr: true, may: true, jun: true, jul: true, aug: false, sep: false, oct: false, nov: false, dec: false },
      },
      {
        id: 'pr2', name: 'Programme Onboarding', thematique: 'Intégration',
        problematique: 'Turnover élevé à 6 mois — 34% des nouvelles recrues quittent l\'entreprise',
        description: 'Parcours d\'intégration structuré sur 90 jours avec buddy system et suivi managérial.',
        type: 'BUILD', pilote: 'Thomas Bernard',
        scores: { criticite: 4, urgence: 5, recurrence: 5, temps: 2, etp: 2, investissement: 2 },
        competences_dispo: true, selected_for_transfo: true,
        planning: { jan: true, feb: true, mar: true, apr: false, may: false, jun: false, jul: false, aug: false, sep: false, oct: false, nov: false, dec: false },
      },
      {
        id: 'pr3', name: 'Harmonisation grilles salariales', thematique: 'Rémunération',
        problematique: 'Disparités internes créant des tensions et des risques légaux',
        description: 'Audit complet + refonte de la politique de rémunération par famille métier.',
        type: 'RUN', pilote: 'Sophie Martin',
        scores: { criticite: 3, urgence: 2, recurrence: 3, temps: 3, etp: 2, investissement: 1 },
        competences_dispo: false, selected_for_transfo: false,
        planning: { jan: false, feb: false, mar: false, apr: false, may: true, jun: true, jul: true, aug: true, sep: false, oct: false, nov: false, dec: false },
      },
    ],
  },
  {
    id: 'p2',
    name: 'Direction des Systèmes d\'Information',
    color: PERIMETRE_COLORS[1],
    mission: 'Garantir la performance, la sécurité et l\'évolution du système d\'information au service des métiers.',
    vision: 'Infrastructure 100% cloud-native et résiliente à horizon 3 ans, socle d\'innovation produit.',
    projects: [
      {
        id: 'pr4', name: 'Migration Cloud AWS', thematique: 'Infrastructure',
        problematique: 'Datacenter en fin de vie, coûts de maintenance exponentiels, obsolescence',
        description: 'Migration de l\'ensemble des serveurs on-premise vers AWS avec plan de reprise d\'activité intégré.',
        type: 'BUILD', pilote: 'Lucas Petit',
        scores: { criticite: 5, urgence: 5, recurrence: 2, temps: 5, etp: 4, investissement: 5 },
        competences_dispo: true, selected_for_transfo: true,
        planning: { jan: false, feb: false, mar: false, apr: false, may: false, jun: true, jul: true, aug: true, sep: true, oct: true, nov: true, dec: false },
      },
      {
        id: 'pr5', name: 'Sécurisation endpoints', thematique: 'Cybersécurité',
        problematique: '40% des postes non conformes à la politique de sécurité — risque RGPD',
        description: 'Déploiement EDR sur l\'ensemble du parc + formation sensibilisation collaborateurs.',
        type: 'RUN', pilote: 'Camille Roux',
        scores: { criticite: 4, urgence: 4, recurrence: 3, temps: 2, etp: 2, investissement: 3 },
        competences_dispo: true, selected_for_transfo: false,
        planning: { jan: true, feb: true, mar: true, apr: true, may: false, jun: false, jul: false, aug: false, sep: false, oct: false, nov: false, dec: false },
      },
    ],
  },
]

// ─── Composant Gantt Pilules ─────────────────────────────────────────────────

function GanttPilules({
  planning,
  color,
  editable = false,
  onChange,
}: {
  planning: Record<string, boolean>
  color: string
  editable?: boolean
  onChange?: (key: string) => void
}) {
  return (
    <div className="gantt-grid">
      {MONTH_KEYS.map((key, i) => {
        const active = planning[key]
        const prevActive = i > 0 && planning[MONTH_KEYS[i - 1]]
        const nextActive = i < 11 && planning[MONTH_KEYS[i + 1]]
        const isStart = active && !prevActive
        const isEnd = active && !nextActive

        return (
          <button
            key={key}
            type="button"
            className={`gantt-cell ${active ? 'gantt-cell--active' : ''} ${editable ? 'gantt-cell--editable' : ''}`}
            style={active ? {
              background: color,
              borderTopLeftRadius: isStart ? '999px' : '0',
              borderBottomLeftRadius: isStart ? '999px' : '0',
              borderTopRightRadius: isEnd ? '999px' : '0',
              borderBottomRightRadius: isEnd ? '999px' : '0',
            } : {}}
            onClick={() => editable && onChange?.(key)}
            title={MONTHS[i]}
          >
            <span className="gantt-month-label">{MONTHS[i]}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Score Badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = getScoreColor(score)
  const label = getScoreLabel(score)
  return (
    <div className="score-badge" style={{ '--score-color': color } as React.CSSProperties}>
      <svg className="score-ring" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${(score / 100) * 94.2} 94.2`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span className="score-value" style={{ color }}>{score}</span>
      <span className="score-label" style={{ color }}>{label}</span>
    </div>
  )
}

// ─── Critère Slider ───────────────────────────────────────────────────────────

function CritereSlider({
  criteriaKey,
  value,
  coef,
  onChange,
}: {
  criteriaKey: keyof Scores
  value: number
  coef: number
  onChange: (v: number) => void
}) {
  const meta = CRITERIA_META[criteriaKey]
  return (
    <div className="critere-row">
      <div className="critere-header">
        <span className="critere-icon">{meta.icon}</span>
        <div>
          <div className="critere-name">
            {meta.label}
            <span className="critere-coef">×{coef}</span>
          </div>
          <div className="critere-desc">{meta.desc}</div>
        </div>
        <span className="critere-val">{value}/5</span>
      </div>
      <div className="critere-dots">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`dot ${n <= value ? 'dot--active' : ''}`}
            onClick={() => onChange(n)}
            aria-label={`${meta.label} : ${n}`}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Fiche Projet (édition) ───────────────────────────────────────────────────

function ProjectCard({
  project,
  coefs,
  perimColor,
  onToggleTransfo,
  onUpdateScore,
  onTogglePlanning,
}: {
  project: Project
  coefs: Coefficients
  perimColor: string
  onToggleTransfo: () => void
  onUpdateScore: (key: keyof Scores, v: number) => void
  onTogglePlanning: (key: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const score = computeScore(project, coefs)

  return (
    <div className={`project-card ${project.selected_for_transfo ? 'project-card--selected' : ''}`}
      style={{ '--perim-color': perimColor } as React.CSSProperties}>
      <div className="project-card__header" onClick={() => setExpanded(!expanded)}>
        <div className="project-card__meta">
          <div className="project-card__top">
            <span className={`type-badge type-badge--${project.type.toLowerCase()}`}>{project.type}</span>
            <span className="project-thematique">{project.thematique}</span>
            {!project.competences_dispo && (
              <span className="competence-warn" title="Compétences non disponibles">⚠ Compétences</span>
            )}
          </div>
          <h3 className="project-name">{project.name}</h3>
          <p className="project-problematique">{project.problematique}</p>
        </div>
        <div className="project-card__right">
          <ScoreBadge score={score} />
          <button
            type="button"
            className={`transfo-toggle ${project.selected_for_transfo ? 'transfo-toggle--on' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleTransfo() }}
            title="Retenir pour la transformation"
          >
            {project.selected_for_transfo ? '★ Retenu' : '☆ Retenir'}
          </button>
          <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="project-card__body">
          <p className="project-desc-full">{project.description}</p>

          <div className="project-sections">
            <div className="project-scoring">
              <div className="section-title">Scoring</div>
              {(Object.keys(CRITERIA_META) as Array<keyof Scores>).map((k) => (
                <CritereSlider
                  key={k}
                  criteriaKey={k}
                  value={project.scores[k]}
                  coef={coefs[k]}
                  onChange={(v) => onUpdateScore(k, v)}
                />
              ))}
              <div className="scoring-formula">
                Score = {(Object.keys(coefs) as Array<keyof Coefficients>).map(k =>
                  `${project.scores[k]}×${coefs[k]}`).join(' + ')}
                {project.type === 'BUILD' ? ' × 1.5 (BUILD)' : ''}
                {!project.competences_dispo ? ' × 0.8 (compétences)' : ''}
                {' = '}
                <strong style={{ color: getScoreColor(score) }}>{score}/100</strong>
              </div>
            </div>

            <div className="project-planning">
              <div className="section-title">Planning prévisionnel</div>
              <GanttPilules
                planning={project.planning}
                color={perimColor}
                editable
                onChange={onTogglePlanning}
              />
              <div className="project-pilote">
                <span>Pilote :</span> <strong>{project.pilote}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Vue Synthèse ─────────────────────────────────────────────────────────────

function SyntheseView({ perimetre, coefs }: { perimetre: Perimetre; coefs: Coefficients }) {
  const selected = perimetre.projects
    .filter((p) => p.selected_for_transfo)
    .sort((a, b) => computeScore(b, coefs) - computeScore(a, coefs))
    .slice(0, 5)

  return (
    <div className="synthese-view">
      <div className="synthese-header">
        <div className="synthese-bloc">
          <div className="synthese-bloc-label">Mission</div>
          <p className="synthese-bloc-text">{perimetre.mission || '— Non renseignée —'}</p>
        </div>
        <div className="synthese-bloc">
          <div className="synthese-bloc-label">Vision</div>
          <p className="synthese-bloc-text">{perimetre.vision || '— Non renseignée —'}</p>
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 'var(--space-xl)' }}>
        Projets transformants retenus ({selected.length}/5)
      </div>

      {selected.length === 0 && (
        <div className="empty-state">Aucun projet retenu pour la transformation.</div>
      )}

      <div className="synthese-projects">
        {selected.map((project, i) => {
          const score = computeScore(project, coefs)
          return (
            <div key={project.id} className="synthese-project-row">
              <div className="synthese-rank" style={{ color: perimetre.color }}>#{i + 1}</div>
              <div className="synthese-project-main">
                <div className="synthese-project-top">
                  <span className={`type-badge type-badge--${project.type.toLowerCase()}`}>{project.type}</span>
                  <strong className="synthese-project-name">{project.name}</strong>
                  <span className="synthese-thematique">{project.thematique}</span>
                  <span className="synthese-score" style={{ color: getScoreColor(score) }}>{score}pts</span>
                </div>
                <p className="synthese-problematique">{project.problematique}</p>
                <GanttPilules planning={project.planning} color={perimetre.color} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Vue Périmètre ────────────────────────────────────────────────────────────

function PerimetreView({
  perimetre,
  coefs,
  onUpdateProject,
}: {
  perimetre: Perimetre
  coefs: Coefficients
  onUpdateProject: (perimId: string, projId: string, updates: Partial<Project>) => void
}) {
  const [mode, setMode] = useState<'edition' | 'synthese'>('edition')
  const selectedCount = perimetre.projects.filter((p) => p.selected_for_transfo).length

  const sorted = [...perimetre.projects].sort((a, b) => computeScore(b, coefs) - computeScore(a, coefs))

  return (
    <div className="perimetre-view">
      <div className="perimetre-header">
        <div className="perimetre-dot" style={{ background: perimetre.color }} />
        <div>
          <h2 className="perimetre-name">{perimetre.name}</h2>
          <div className="perimetre-stats">
            <span>{perimetre.projects.length} projets</span>
            <span>·</span>
            <span style={{ color: perimetre.color }}>{selectedCount} retenus pour la transfo</span>
          </div>
        </div>
        <div className="mode-toggle">
          <button
            type="button"
            className={`mode-btn ${mode === 'edition' ? 'mode-btn--active' : ''}`}
            onClick={() => setMode('edition')}
          >
            ✏️ Édition
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === 'synthese' ? 'mode-btn--active' : ''}`}
            onClick={() => setMode('synthese')}
          >
            📋 Synthèse
          </button>
        </div>
      </div>

      {mode === 'edition' ? (
        <div className="projects-list">
          {sorted.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              coefs={coefs}
              perimColor={perimetre.color}
              onToggleTransfo={() => {
                if (!project.selected_for_transfo && selectedCount >= 5) return
                onUpdateProject(perimetre.id, project.id, { selected_for_transfo: !project.selected_for_transfo })
              }}
              onUpdateScore={(key, v) =>
                onUpdateProject(perimetre.id, project.id, {
                  scores: { ...project.scores, [key]: v },
                })
              }
              onTogglePlanning={(key) =>
                onUpdateProject(perimetre.id, project.id, {
                  planning: { ...project.planning, [key]: !project.planning[key] },
                })
              }
            />
          ))}
        </div>
      ) : (
        <SyntheseView perimetre={perimetre} coefs={coefs} />
      )}
    </div>
  )
}

// ─── Panneau Coefficients ──────────────────────────────────────────────────────

function CoefPanel({ coefs, onChange, onClose }: {
  coefs: Coefficients
  onChange: (k: keyof Coefficients, v: number) => void
  onClose: () => void
}) {
  return (
    <div className="coef-overlay" onClick={onClose}>
      <div className="coef-panel" onClick={(e) => e.stopPropagation()}>
        <div className="coef-panel-header">
          <h3>Coefficients de scoring</h3>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>
        <p className="coef-panel-hint">
          Adaptez les poids selon le contexte client. La Criticité est pondérée ×3 par défaut car c'est le critère stratégique central.
        </p>
        {(Object.keys(coefs) as Array<keyof Coefficients>).map((k) => (
          <div key={k} className="coef-row">
            <span className="coef-key">{CRITERIA_META[k].icon} {CRITERIA_META[k].label}</span>
            <div className="coef-dots">
              {[1, 2, 3].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`coef-dot ${coefs[k] === v ? 'coef-dot--active' : ''}`}
                  onClick={() => onChange(k, v)}
                >
                  ×{v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Composant Principal ──────────────────────────────────────────────────────

export default function ProjectSelector() {
  const [perimetres, setPerimetres] = useState<Perimetre[]>(DEMO_DATA)
  const [activeId, setActiveId] = useState<string>(DEMO_DATA[0].id)
  const [coefs, setCoefs] = useState<Coefficients>(DEFAULT_COEFFICIENTS)
  const [showCoefs, setShowCoefs] = useState(false)

  const active = perimetres.find((p) => p.id === activeId)!

  function updateProject(perimId: string, projId: string, updates: Partial<Project>) {
    setPerimetres((prev) =>
      prev.map((p) =>
        p.id !== perimId ? p : {
          ...p,
          projects: p.projects.map((pr) =>
            pr.id !== projId ? pr : { ...pr, ...updates }
          ),
        }
      )
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ps-root">
        {/* Sidebar périmètres */}
        <aside className="ps-sidebar">
          <div className="ps-sidebar-title">Périmètres</div>
          {perimetres.map((p) => {
            const sel = p.projects.filter((pr) => pr.selected_for_transfo).length
            return (
              <button
                key={p.id}
                type="button"
                className={`ps-perim-btn ${activeId === p.id ? 'ps-perim-btn--active' : ''}`}
                onClick={() => setActiveId(p.id)}
              >
                <span className="ps-perim-dot" style={{ background: p.color }} />
                <span className="ps-perim-label">{p.name}</span>
                {sel > 0 && (
                  <span className="ps-perim-count" style={{ background: p.color }}>{sel}</span>
                )}
              </button>
            )
          })}

          <div className="ps-sidebar-divider" />
          <button
            type="button"
            className="ps-coef-btn"
            onClick={() => setShowCoefs(true)}
          >
            ⚙ Coefficients
          </button>
        </aside>

        {/* Contenu principal */}
        <main className="ps-main">
          <div className="ps-page-header">
            <div>
              <h1 className="ps-page-title">Sélection de projets transformants</h1>
              <p className="ps-page-sub">Évaluez et priorisez vos projets BUILD & RUN avec le système de scoring hybride pondéré</p>
            </div>
            <div className="ps-legend">
              <span className="legend-item"><span className="legend-dot" style={{ background: '#10B981' }} />Critique (76+)</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#F59E0B' }} />Haute (56+)</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#E0777D' }} />Moyenne (31+)</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#6B7280' }} />Faible</span>
            </div>
          </div>

          <PerimetreView
            perimetre={active}
            coefs={coefs}
            onUpdateProject={updateProject}
          />
        </main>

        {showCoefs && (
          <CoefPanel
            coefs={coefs}
            onChange={(k, v) => setCoefs((c) => ({ ...c, [k]: v }))}
            onClose={() => setShowCoefs(false)}
          />
        )}
      </div>
    </>
  )
}

// ─── CSS intégré ──────────────────────────────────────────────────────────────

const CSS = `
/* ── Root ── */
.ps-root {
  display: flex;
  min-height: 100svh;
  background: var(--theme-bg-page);
  color: var(--theme-text);
  font-family: var(--font-body);
}

/* ── Sidebar ── */
.ps-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--theme-bg-sidebar);
  padding: var(--space-xl) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.ps-sidebar-title {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--theme-sidebar-text-muted);
  padding: 0 var(--space-sm);
  margin-bottom: var(--space-sm);
}

.ps-perim-btn {
  appearance: none;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--theme-sidebar-text-muted);
  transition: background var(--transition), color var(--transition);
}

.ps-perim-btn:hover {
  background: rgba(255,255,255,0.06);
  color: var(--theme-sidebar-text);
}

.ps-perim-btn--active {
  background: rgba(255,255,255,0.1);
  color: var(--theme-sidebar-text);
}

.ps-perim-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ps-perim-label {
  flex: 1;
  line-height: 1.3;
}

.ps-perim-count {
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  padding: 1px 7px;
  border-radius: 999px;
  flex-shrink: 0;
}

.ps-sidebar-divider {
  height: 1px;
  background: rgba(255,255,255,0.08);
  margin: var(--space-md) 0;
}

.ps-coef-btn {
  appearance: none;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.85rem;
  color: var(--theme-sidebar-text-muted);
  transition: background var(--transition), color var(--transition);
}

.ps-coef-btn:hover {
  background: rgba(255,255,255,0.06);
  color: var(--theme-sidebar-text);
}

/* ── Main ── */
.ps-main {
  flex: 1;
  min-width: 0;
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.ps-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-xl);
  flex-wrap: wrap;
}

.ps-page-title {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--theme-text);
  margin: 0 0 var(--space-xs);
}

.ps-page-sub {
  font-size: 0.9rem;
  color: var(--theme-text-muted);
  margin: 0;
}

.ps-legend {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: var(--theme-text-muted);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* ── Périmètre ── */
.perimetre-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.perimetre-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-xl);
  background: var(--theme-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--theme-border);
  flex-wrap: wrap;
}

.perimetre-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.perimetre-name {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 2px;
  color: var(--theme-text);
}

.perimetre-stats {
  font-size: 0.82rem;
  color: var(--theme-text-muted);
  display: flex;
  gap: var(--space-sm);
}

.mode-toggle {
  margin-left: auto;
  display: flex;
  gap: var(--space-xs);
  background: var(--theme-bg-page);
  border-radius: var(--radius-md);
  padding: 4px;
}

.mode-btn {
  appearance: none;
  border: none;
  background: transparent;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--theme-text-muted);
  transition: background var(--transition), color var(--transition);
}

.mode-btn--active {
  background: var(--theme-bg-card);
  color: var(--theme-text);
  box-shadow: var(--shadow-sm);
}

/* ── Projet Card ── */
.projects-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.project-card {
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.project-card--selected {
  border-color: var(--perim-color);
  box-shadow: 0 0 0 1px var(--perim-color), var(--shadow-sm);
}

.project-card__header {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg) var(--space-xl);
  cursor: pointer;
  transition: background var(--transition);
}

.project-card__header:hover {
  background: color-mix(in srgb, var(--theme-border) 30%, var(--theme-bg-card));
}

.project-card__meta {
  flex: 1;
  min-width: 0;
}

.project-card__top {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
  flex-wrap: wrap;
}

.type-badge {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border-radius: 4px;
}

.type-badge--build {
  background: color-mix(in srgb, #8E3B46 15%, transparent);
  color: #8E3B46;
  border: 1px solid #8E3B46;
}

.type-badge--run {
  background: color-mix(in srgb, #4C86A8 15%, transparent);
  color: #4C86A8;
  border: 1px solid #4C86A8;
}

.project-thematique {
  font-size: 0.75rem;
  color: var(--theme-text-muted);
  font-style: italic;
}

.competence-warn {
  font-size: 0.72rem;
  color: #F59E0B;
  font-weight: 600;
}

.project-name {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--theme-text);
  margin: 0 0 4px;
}

.project-problematique {
  font-size: 0.82rem;
  color: var(--theme-text-muted);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-card__right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.expand-icon {
  font-size: 0.7rem;
  color: var(--theme-text-muted);
}

/* ── Score Badge ── */
.score-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  position: relative;
  width: 64px;
}

.score-ring {
  width: 56px;
  height: 56px;
}

.score-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -52%);
  font-size: 1rem;
  font-weight: 800;
  font-family: var(--font-display);
  line-height: 1;
}

.score-label {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

/* ── Transfo Toggle ── */
.transfo-toggle {
  appearance: none;
  border: 1px solid var(--theme-border);
  background: transparent;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  color: var(--theme-text-muted);
  white-space: nowrap;
  font-family: var(--font-body);
  transition: all var(--transition);
}

.transfo-toggle--on {
  border-color: var(--perim-color);
  color: var(--perim-color);
  background: color-mix(in srgb, var(--perim-color) 10%, transparent);
}

/* ── Corpo du projet ── */
.project-card__body {
  padding: var(--space-lg) var(--space-xl) var(--space-xl);
  border-top: 1px solid var(--theme-border);
}

.project-desc-full {
  font-size: 0.88rem;
  color: var(--theme-text-muted);
  line-height: 1.55;
  margin: 0 0 var(--space-lg);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--theme-border);
}

.project-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
}

.section-title {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--theme-text-muted);
  margin-bottom: var(--space-md);
}

/* ── Critère Slider ── */
.critere-row {
  margin-bottom: var(--space-md);
}

.critere-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.critere-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.critere-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--theme-text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.critere-coef {
  font-size: 0.68rem;
  background: var(--theme-border);
  color: var(--theme-text-muted);
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 600;
}

.critere-desc {
  font-size: 0.72rem;
  color: var(--theme-text-muted);
}

.critere-val {
  margin-left: auto;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--theme-accent);
  min-width: 24px;
  text-align: right;
}

.critere-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 28px;
  height: 8px;
  border-radius: 999px;
  border: none;
  background: var(--theme-border);
  cursor: pointer;
  transition: background var(--transition), transform var(--transition);
}

.dot--active {
  background: var(--theme-accent);
}

.dot:hover {
  transform: scaleY(1.4);
}

.scoring-formula {
  margin-top: var(--space-md);
  font-size: 0.72rem;
  color: var(--theme-text-muted);
  background: var(--theme-bg-page);
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  line-height: 1.6;
  word-break: break-all;
}

/* ── Planning / Gantt ── */
.project-planning {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.gantt-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 3px;
}

.gantt-cell {
  appearance: none;
  border: none;
  height: 26px;
  background: var(--theme-border);
  cursor: pointer;
  position: relative;
  transition: opacity var(--transition), filter var(--transition);
  border-radius: 4px;
  padding: 0;
}

.gantt-cell--active {
  border-radius: 0;
}

.gantt-cell--editable:hover {
  filter: brightness(1.15);
}

.gantt-month-label {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.58rem;
  color: var(--theme-text-muted);
  white-space: nowrap;
  pointer-events: none;
}

.project-pilote {
  font-size: 0.8rem;
  color: var(--theme-text-muted);
  margin-top: var(--space-lg);
}

.project-pilote strong {
  color: var(--theme-text);
}

/* ── Synthèse ── */
.synthese-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.synthese-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
}

.synthese-bloc {
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg) var(--space-xl);
}

.synthese-bloc-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--theme-text-muted);
  margin-bottom: var(--space-sm);
}

.synthese-bloc-text {
  font-size: 0.9rem;
  color: var(--theme-text);
  line-height: 1.55;
  margin: 0;
  font-style: italic;
}

.synthese-projects {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.synthese-project-row {
  display: flex;
  gap: var(--space-lg);
  align-items: flex-start;
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg) var(--space-xl);
}

.synthese-rank {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 700;
  opacity: 0.7;
  flex-shrink: 0;
  width: 36px;
  line-height: 1;
  margin-top: 2px;
}

.synthese-project-main {
  flex: 1;
  min-width: 0;
}

.synthese-project-top {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
  flex-wrap: wrap;
}

.synthese-project-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--theme-text);
}

.synthese-thematique {
  font-size: 0.75rem;
  color: var(--theme-text-muted);
  font-style: italic;
}

.synthese-score {
  font-size: 0.82rem;
  font-weight: 800;
  margin-left: auto;
}

.synthese-problematique {
  font-size: 0.82rem;
  color: var(--theme-text-muted);
  margin: 0 0 var(--space-md);
  line-height: 1.4;
}

.empty-state {
  font-size: 0.88rem;
  color: var(--theme-text-muted);
  font-style: italic;
  padding: var(--space-xl);
  text-align: center;
  background: var(--theme-bg-card);
  border: 1px dashed var(--theme-border);
  border-radius: var(--radius-lg);
}

/* ── Coefficients Panel ── */
.coef-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.coef-panel {
  background: var(--theme-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  width: 420px;
  max-width: 95vw;
  box-shadow: var(--shadow-lg);
}

.coef-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.coef-panel-header h3 {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: var(--theme-text);
}

.close-btn {
  appearance: none;
  border: none;
  background: transparent;
  font-size: 1rem;
  cursor: pointer;
  color: var(--theme-text-muted);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.coef-panel-hint {
  font-size: 0.82rem;
  color: var(--theme-text-muted);
  margin: 0 0 var(--space-lg);
  line-height: 1.5;
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--theme-border);
}

.coef-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--theme-border);
}

.coef-key {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--theme-text);
}

.coef-dots {
  display: flex;
  gap: var(--space-sm);
}

.coef-dot {
  appearance: none;
  border: 1px solid var(--theme-border);
  background: transparent;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  color: var(--theme-text-muted);
  font-family: var(--font-body);
  transition: all var(--transition);
}

.coef-dot--active {
  background: var(--theme-accent);
  border-color: var(--theme-accent);
  color: #fff;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .project-sections {
    grid-template-columns: 1fr;
  }
  .synthese-header {
    grid-template-columns: 1fr;
  }
  .ps-sidebar {
    width: 200px;
  }
}

@media (max-width: 640px) {
  .ps-root {
    flex-direction: column;
  }
  .ps-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    padding: var(--space-md);
  }
  .ps-main {
    padding: var(--space-md);
  }
}
`
