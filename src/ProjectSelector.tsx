import { useEffect, useRef, useState } from 'react'
import {
  createDirection,
  deleteProjet,
  createProjet,
  getDirectionProjets,
  getWorkspaceDirections,
  updateProjet,
} from './lib/api'
import type { Direction as DbDirection, Projet as DbProjet } from './lib/types'

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
  gains_quantitatifs?: number
  gains_qualitatifs?: string
  contributorDirections: string[]
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

export function generateGanttMonths() {
  const today = new Date()
  const months: Array<{
    key: string
    label: string
    year: number
    monthIndex: number
  }> = []
  for (let i = 0; i < 24; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
    months.push({
      key: `${d.getMonth()}-${d.getFullYear()}`,
      label: d.toLocaleString('fr-FR', { month: 'short' }).replace('.', '').slice(0, 3),
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
    })
  }
  return months
}

const GANTT_MONTHS = generateGanttMonths()

function buildYearSpans(months: typeof GANTT_MONTHS) {
  const spans: { year: number; count: number }[] = []
  for (const m of months) {
    const last = spans[spans.length - 1]
    if (last && last.year === m.year) last.count++
    else spans.push({ year: m.year, count: 1 })
  }
  return spans
}

const DEFAULT_COEFFICIENTS: Coefficients = {
  criticite: 3,
  urgence: 2,
  recurrence: 2,
  temps: 1,
  etp: 1,
  investissement: 1,
}

const CRITERIA_META = {
  criticite: { label: 'Criticité', desc: 'Impact si non réalisé' },
  urgence: { label: 'Urgence', desc: 'Délai avant problème' },
  recurrence: { label: 'Récurrence', desc: 'Fréquence du problème' },
  temps: { label: 'Temps', desc: 'Durée de réalisation' },
  etp: { label: 'ETP', desc: 'Ressources humaines' },
  investissement: { label: 'Investissement', desc: 'Coût capital' },
}

const CRITERIA_DESCRIPTIONS: Record<keyof Scores, Record<number, string>> = {
  criticite: {
    0: 'Non évalué',
    1: 'Conséquences mineures, insignifiantes',
    2: 'Conséquences sans gravité (courte durée, faible coût)',
    3: 'Impacts modérés nécessitant un investissement modéré',
    4: 'Multiples impacts nécessitant un investissement conséquent',
    5: 'Menace pour la viabilité du business model',
  },
  urgence: {
    0: 'Non évalué',
    1: 'Dans plus de 2 ans',
    2: 'Dans 1 à 2 ans',
    3: 'Dans 6 mois à 1 an',
    4: 'Dans 3 à 6 mois',
    5: 'Dans moins de 3 mois',
  },
  recurrence: {
    0: 'Non évalué',
    1: 'Pas de récurrence',
    2: 'Faiblement récurrent',
    3: 'Modérément récurrent',
    4: 'Fortement récurrent',
    5: 'Très fortement récurrent',
  },
  temps: {
    0: 'Non évalué',
    1: 'Moins de 3 mois',
    2: 'De 3 à 6 mois',
    3: 'De 6 mois à 1 an',
    4: 'De 1 an à 2 ans',
    5: '2 ans et plus',
  },
  etp: {
    0: 'Non évalué',
    1: 'Moins de 50 jours homme',
    2: 'Entre 50 et 100 jours homme',
    3: 'Entre 100 et 250 jours homme',
    4: 'Entre 250 et 500 jours homme',
    5: 'Plus de 500 jours homme',
  },
  investissement: {
    0: 'Non évalué',
    1: 'Moins de 20 000€',
    2: 'Entre 20 000€ et 30 000€',
    3: 'Entre 30 000€ et 50 000€',
    4: 'Entre 50 000€ et 200 000€',
    5: 'Plus de 200 000€',
  },
}

const PERIMETRE_COLORS = ['#8E3B46', '#a67d48', '#8f5f32', '#7a5a42', '#6b4a38', '#5c3d2e']

const DIR_PERIM_ID = 'perim-direction'
const TRANS_PERIM_ID = 'perim-transverse'

const SIMULATED_DIRECTIONS = [
  'Direction Financière',
  'Direction IT',
  'Direction Marketing',
  'Direction Opérations',
] as const

function emptyPlanning(): Record<string, boolean> {
  return Object.fromEntries(GANTT_MONTHS.map((m) => [m.key, false])) as Record<string, boolean>
}

function createEmptyProject(): Project {
  return {
    id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    thematique: '',
    problematique: '',
    description: '',
    type: 'RUN',
    scores: {
      criticite: 0,
      urgence: 0,
      recurrence: 0,
      temps: 0,
      etp: 0,
      investissement: 0,
    },
    competences_dispo: true,
    selected_for_transfo: false,
    planning: emptyPlanning(),
    pilote: '',
    gains_quantitatifs: undefined,
    gains_qualitatifs: '',
    contributorDirections: [],
  }
}

function buildInitialPerimetres(directionLabel: string): Perimetre[] {
  const dn = directionLabel.trim() || 'Ma direction'
  return [
    {
      id: DIR_PERIM_ID,
      name: dn,
      color: PERIMETRE_COLORS[0],
      mission: '',
      vision: '',
      projects: [],
    },
    {
      id: TRANS_PERIM_ID,
      name: 'Projets transverses',
      color: PERIMETRE_COLORS[1],
      mission: '',
      vision: '',
      projects: [],
    },
  ]
}

function mapDbProjetToProject(p: DbProjet): Project {
  return {
    id: p.id,
    name: p.nom ?? '',
    thematique: p.thematique ?? '',
    problematique: p.problematique ?? '',
    description: p.description ?? '',
    type: p.type,
    scores: {
      criticite: p.score_criticite ?? 0,
      urgence: p.score_urgence ?? 0,
      recurrence: p.score_recurrence ?? 0,
      temps: p.score_temps ?? 0,
      etp: p.score_etp ?? 0,
      investissement: p.score_investissement ?? 0,
    },
    competences_dispo: p.competences_dispo ?? true,
    selected_for_transfo: p.selected_for_transfo ?? false,
    planning: { ...emptyPlanning(), ...(p.planning ?? {}) },
    pilote: p.pilote ?? '',
    gains_quantitatifs: p.gains_quantitatifs ?? undefined,
    gains_qualitatifs: p.gains_qualitatifs ?? '',
    contributorDirections: p.directions_contributrices ?? [],
  }
}

function mapProjectToDbProjet(
  p: Project,
  directionId: string,
  workspaceId: string,
): Partial<DbProjet> {
  const withDefaults: Project = {
    ...p,
    planning: { ...emptyPlanning(), ...p.planning },
  }
  return {
    direction_id: directionId,
    workspace_id: workspaceId,
    nom: withDefaults.name.trim() || 'Nouveau projet',
    thematique: withDefaults.thematique || null,
    problematique: withDefaults.problematique || null,
    description: withDefaults.description || null,
    type: withDefaults.type,
    score_criticite: withDefaults.scores.criticite,
    score_urgence: withDefaults.scores.urgence,
    score_recurrence: withDefaults.scores.recurrence,
    score_temps: withDefaults.scores.temps,
    score_etp: withDefaults.scores.etp,
    score_investissement: withDefaults.scores.investissement,
    competences_dispo: withDefaults.competences_dispo,
    selected_for_transfo: withDefaults.selected_for_transfo,
    pilote: withDefaults.pilote || null,
    gains_quantitatifs: withDefaults.gains_quantitatifs ?? null,
    gains_qualitatifs: withDefaults.gains_qualitatifs || null,
    planning: withDefaults.planning,
    directions_contributrices: withDefaults.contributorDirections,
    updated_at: new Date().toISOString(),
  } as Partial<DbProjet>
}

// ─── Calcul du score ────────────────────────────────────────────────────────

function computeScore(project: Project, coefs: Coefficients): number {
  if (Object.values(project.scores).reduce((a, b) => a + b, 0) === 0) return 0

  const { scores } = project
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

  const normalise = (scoreBrut / scoreMax) * 100
  return Math.round(normalise)
}

function getScoreColor(score: number): string {
  if (score === 0) return 'var(--theme-text-muted)'
  if (score >= 75) return 'var(--score-critical)'
  if (score >= 50) return 'var(--score-caramel-4)'
  if (score >= 25) return 'var(--score-caramel-3)'
  return 'var(--score-caramel-2)'
}

function getScoreLabel(score: number): string {
  if (score === 0) return 'Non évalué'
  if (score >= 75) return 'Critique'
  if (score >= 50) return 'Élevé'
  if (score >= 25) return 'Modéré'
  return 'Faible'
}

// ─── Données de démo ─────────────────────────────────────────────────────────

function autoSelectTopBuildProjects(data: Perimetre[], coefs: Coefficients): Perimetre[] {
  return data.map((perimetre) => {
    const topBuildIds = new Set(
      perimetre.projects
        .filter((project) => project.type === 'BUILD')
        .sort((a, b) => computeScore(b, coefs) - computeScore(a, coefs))
        .slice(0, 5)
        .map((project) => project.id),
    )

    return {
      ...perimetre,
      projects: perimetre.projects.map((project) => ({
        ...project,
        selected_for_transfo: topBuildIds.has(project.id),
      })),
    }
  })
}

function applyMemberDirectionPrefill(data: Perimetre[]): Perimetre[] {
  if (typeof window === 'undefined') return data
  const raw = window.localStorage.getItem('lfdc-member-onboarding')
  if (!raw) return data

  try {
    const parsed = JSON.parse(raw) as {
      directionName?: string
      mission?: string
      vision?: string
    }

    const directionName = (parsed.directionName ?? '').trim()
    const mission = (parsed.mission ?? '').trim()
    const vision = (parsed.vision ?? '').trim()

    return data.map((perimetre) => {
      if (perimetre.id !== DIR_PERIM_ID) return perimetre
      return {
        ...perimetre,
        name: directionName || perimetre.name,
        mission: mission || perimetre.mission,
        vision: vision || perimetre.vision,
      }
    })
  } catch {
    return data
  }
}

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
  const yearSpans = buildYearSpans(GANTT_MONTHS)
  const timeMarkers = [
    { index: 0, prefix: 'M0' },
    { index: 5, prefix: 'M6' },
    { index: 11, prefix: 'M12' },
    { index: 17, prefix: 'M18' },
    { index: 23, prefix: 'M24' },
  ].map((m) => {
    const ref = GANTT_MONTHS[m.index]
    return {
      key: `${m.prefix}-${ref.key}`,
      label: `${m.prefix} · ${ref.label} ${String(ref.year).slice(-2)}`,
      colStart: m.index + 1,
    }
  })

  return (
    <div className="gantt-chart-wrap">
      <div className="gantt-time-markers">
        {timeMarkers.map((m) => (
          <span
            key={m.key}
            className="gantt-time-marker"
            style={{ gridColumnStart: m.colStart }}
          >
            {m.label}
          </span>
        ))}
      </div>
      <div className="gantt-head-years">
        {yearSpans.map((s) => (
          <div
            key={s.year}
            className="gantt-year-cell"
            style={{ gridColumn: `span ${s.count}` }}
          >
            {s.year} ({s.count} mois)
          </div>
        ))}
      </div>
      <div className="gantt-head-months">
        {GANTT_MONTHS.map((m) => (
          <span key={m.key} className="gantt-month-short">{m.label}</span>
        ))}
      </div>
      <div className="gantt-grid gantt-grid--24">
        {GANTT_MONTHS.map((m, i) => {
          const key = m.key
          const active = planning[key] ?? false
          const keys = GANTT_MONTHS.map((x) => x.key)
          const prevActive = i > 0 && (planning[keys[i - 1]] ?? false)
          const nextActive = i < 23 && (planning[keys[i + 1]] ?? false)
          const isStart = active && !prevActive
          const isEnd = active && !nextActive
          const title = `${m.label} ${m.year}`
          return (
            <button
              key={key}
              type="button"
              className={`gantt-cell gantt-cell--sm ${active ? 'gantt-cell--active' : ''} ${editable ? 'gantt-cell--editable' : ''}`}
              style={active ? {
                background: color,
                borderTopLeftRadius: isStart ? '999px' : '0',
                borderBottomLeftRadius: isStart ? '999px' : '0',
                borderTopRightRadius: isEnd ? '999px' : '0',
                borderBottomRightRadius: isEnd ? '999px' : '0',
              } : {}}
              onClick={() => editable && onChange?.(key)}
              title={title}
            />
          )
        })}
      </div>
    </div>
  )
}

function MiniGantt24({
  planning,
  color,
}: {
  planning: Record<string, boolean>
  color: string
}) {
  const markers = [
    { idx: 0 },
    { idx: 5 },
    { idx: 11 },
    { idx: 17 },
    { idx: 23 },
  ]
  return (
    <div className="mini-gantt-24-wrap" aria-hidden>
      <div className="mini-gantt-24__markers">
        {markers.map((marker) => {
          const refMonth = GANTT_MONTHS[marker.idx]
          const markerLabel = `${refMonth.label} ${String(refMonth.year).slice(-2)}`
          const markerTitle = `${refMonth.label} ${refMonth.year}`
          const left = `${(marker.idx / 23) * 100}%`
          const isLast = marker.idx === 23
          return (
            <span
              key={`marker-${refMonth.key}`}
              className={`mini-gantt-24__marker ${isLast ? 'mini-gantt-24__marker--end' : ''}`}
              style={{ left }}
              title={markerTitle}
            >
              {markerLabel}
            </span>
          )
        })}
      </div>
      <div className="mini-gantt-24">
        {GANTT_MONTHS.map((m) => {
          const on = planning[m.key] ?? false
          const title = `${m.label} ${m.year}`
          return (
            <span
              key={m.key}
              className={`mini-gantt-24__cell ${on ? 'mini-gantt-24__cell--on' : ''}`}
              style={on ? { background: color } : undefined}
              title={title}
            />
          )
        })}
      </div>
    </div>
  )
}

function ScoreRing40({ score }: { score: number }) {
  const isZero = score === 0
  const c = 100.53
  const dash = isZero ? '0 94.2' : `${(score / 100) * c} ${c}`
  return (
    <div className="score-ring-40 score-ring-40--header">
      <svg className="score-ring-40__svg" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="3" />
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke={isZero ? 'var(--theme-border)' : getScoreColor(score)}
          strokeWidth="3"
          strokeDasharray={dash}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
        />
      </svg>
      <span className="score-ring-40__val" style={{ color: isZero ? 'var(--theme-text-muted)' : getScoreColor(score) }}>
        {isZero ? '—' : score}
      </span>
    </div>
  )
}

// ─── Score Badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const isZero = score === 0
  const color = isZero ? 'var(--theme-border)' : getScoreColor(score)
  const dash = isZero ? '0 94.2' : `${(score / 100) * 94.2} 94.2`
  return (
    <div className="score-badge" style={{ '--score-color': color } as React.CSSProperties}>
      <svg className="score-ring" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={dash}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span className="score-value" style={{ color: isZero ? 'var(--theme-text-muted)' : color }}>{isZero ? '—' : score}</span>
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
  const selectedDescription = CRITERIA_DESCRIPTIONS[criteriaKey][value]
  const scoreBand =
    value >= 5 ? 'critical' : value >= 4 ? 'high' : value >= 3 ? 'medium' : value >= 1 ? 'low' : 'none'

  function renderIcon() {
    const commonFill = { width: 32, height: 32, viewBox: '0 0 24 24', fill: 'currentColor' }
    const commonStroke = { width: 32, height: 32, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
    if (criteriaKey === 'criticite') {
      return (
        <svg {...commonFill}>
          <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
        </svg>
      )
    }
    if (criteriaKey === 'urgence') {
      return (
        <svg {...commonFill}>
          <path d="M13.2 2.2c1.4 1.8 2.6 4 2.6 6.1 0 1.7-.8 3.3-2.2 4.2.1-.7-.1-1.5-.6-2.1-.9 1.1-1.9 2.6-1.9 4.2 0 1.5.9 2.8 2.2 3.4-3.4.9-6.8-1.6-6.8-5.2 0-3.1 2.3-5.1 3.9-7.2.7-.9 1.3-2.1 1.6-3.4.4 0 .8 0 1.2.1z" />
        </svg>
      )
    }
    if (criteriaKey === 'recurrence') {
      return (
        <svg {...commonStroke}>
          <path d="M5 5l7 7 7-7" />
          <path d="M5 12l7 7 7-7" />
        </svg>
      )
    }
    if (criteriaKey === 'temps') {
      return (
        <svg {...commonFill}>
          <path d="M7 2h2v2h6V2h2v2h1.5A2.5 2.5 0 0 1 21 6.5v13A2.5 2.5 0 0 1 18.5 22h-13A2.5 2.5 0 0 1 3 19.5v-13A2.5 2.5 0 0 1 5.5 4H7V2zm12 7H5v10.5c0 .3.2.5.5.5h13c.3 0 .5-.2.5-.5V9z" />
        </svg>
      )
    }
    if (criteriaKey === 'etp') {
      return (
        <svg {...commonFill}>
          <path d="M8 7a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm8 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM2 21c0-3.3 2.8-5.5 6.2-5.5S14.4 17.7 14.4 21H2zm13.2 0c.3-2.4 2.1-4 4.8-4H22v2h-2v2h-2v-2h-2.8z" />
        </svg>
      )
    }
    return (
      <svg {...commonFill}>
        <path d="M8.6 2h6.8l1.6 2.2-2.1 2.6H9.1L7 4.2 8.6 2zm.9 6.4h5c2.8 0 5 2.3 5 5v3.7c0 2.7-2.2 4.9-5 4.9h-5c-2.8 0-5-2.2-5-4.9v-3.7c0-2.7 2.2-5 5-5zm2.4 1.8v2h-1.7v1.7h1.7v1.9h1.7v-1.9h1.7v-1.7h-1.7v-2h-1.7z" />
        </svg>
      )
  }

  return (
    <div className={`critere-row critere-row--enhanced critere-row--bar critere-row--${criteriaKey}`} title={`Coefficient: ×${coef}`}>
      <div className="critere-title-above">{meta.label}</div>
      <div className="critere-bar">
        <div className="critere-icon-pane" aria-hidden>
          <span className="critere-icon">{renderIcon()}</span>
        </div>
        <div className="critere-middle-pane">
          <div className="critere-title-row" />
          <div className="critere-grid critere-grid--six">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`critere-square ${n === value ? `critere-square--active critere-square--level-${n}` : ''}`}
                onClick={() => onChange(n)}
                aria-label={`${meta.label} : ${n}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className={`critere-value-pane critere-value-pane--${scoreBand}`}>
          <span className="critere-val">{value}/5</span>
        </div>
      </div>
      <div className="critere-level-desc">{selectedDescription || meta.desc}</div>
    </div>
  )
}

// ─── Fiche Projet (édition) ───────────────────────────────────────────────────

function ProjectCard({
  project,
  coefs,
  perimColor,
  dgRank,
  isTransverse,
  expanded,
  onToggleExpand,
  onToggleTransfo,
  onSaveProject,
  onDeleteProject,
  onPatchProject,
}: {
  project: Project
  coefs: Coefficients
  perimColor: string
  dgRank?: number
  isTransverse: boolean
  expanded: boolean
  onToggleExpand: () => void
  onToggleTransfo: () => void
  onSaveProject: (updates: Partial<Project>) => void
  onDeleteProject: () => void
  onPatchProject: (updates: Partial<Project>) => void
}) {
  const [draft, setDraft] = useState<Project>(project)
  const [pilotageError, setPilotageError] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const hasMountedRef = useRef(false)

  useEffect(() => {
    if (expanded) {
      setDraft(project)
      setPilotageError(false)
      setConfirmDelete(false)
    }
  }, [expanded, project])

  useEffect(() => {
    if (!expanded) return
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    const same =
      JSON.stringify({ ...project, planning: { ...emptyPlanning(), ...project.planning } }) ===
      JSON.stringify({ ...draft, planning: { ...emptyPlanning(), ...draft.planning } })
    if (same) return

    const timer = window.setTimeout(() => {
      if (isTransverse && draft.contributorDirections.length === 0) return
      onSaveProject({
        ...draft,
        planning: { ...emptyPlanning(), ...draft.planning },
      })
    }, 700)

    return () => {
      window.clearTimeout(timer)
    }
  }, [draft, expanded, isTransverse, onSaveProject, project])

  const displayScoreCollapsed = computeScore(project, coefs)
  const score = computeScore(draft, coefs)

  const updateDraftScore = (key: keyof Scores, v: number) => {
    setDraft((prev) => ({ ...prev, scores: { ...prev.scores, [key]: v } }))
  }

  const toggleDraftPlanning = (key: string) => {
    setDraft((prev) => {
      const merged = { ...emptyPlanning(), ...prev.planning }
      return { ...prev, planning: { ...merged, [key]: !merged[key] } }
    })
  }

  const toggleContributor = (label: string) => {
    setDraft((prev) => {
      const has = prev.contributorDirections.includes(label)
      const contributorDirections = has
        ? prev.contributorDirections.filter((d) => d !== label)
        : [...prev.contributorDirections, label]
      return { ...prev, contributorDirections }
    })
    setPilotageError(false)
  }

  const formula = `${(Object.keys(coefs) as Array<keyof Coefficients>).map((k) => `${draft.scores[k]}×${coefs[k]}`).join(' + ')}`
  const criteriaRows = (Object.keys(CRITERIA_META) as Array<keyof Scores>).map((key) => {
    const level = draft.scores[key]
    const description = CRITERIA_DESCRIPTIONS[key][level] ?? ''
    const points = level * coefs[key]
    return {
      key,
      label: CRITERIA_META[key].label,
      level,
      description: description.length > 30 ? `${description.slice(0, 30)}...` : description,
      coef: coefs[key],
      points,
    }
  })
  const scoreMax = (Object.keys(coefs) as Array<keyof Coefficients>).reduce((acc, key) => acc + (5 * coefs[key]), 0)
  const scoreRaw = criteriaRows.reduce((acc, row) => acc + row.points, 0)
  const scoreFinal = computeScore(draft, coefs)
  const evalLevels = [1, 2, 3, 4, 5] as const

  const titleLine = project.name.trim() || 'Nouveau projet'

  function handleCancel() {
    setDraft(project)
    onToggleExpand()
  }

  function handleDelete() {
    setConfirmDelete(false)
    onDeleteProject()
    onToggleExpand()
  }

  const contribLabel = isTransverse ? 'Directions co-pilotes *' : 'Directions contributrices'
  const contribRequired = isTransverse

  return (
    <div
      className={`project-card ${project.selected_for_transfo ? 'project-card--selected' : ''}`}
      style={{ '--perim-color': perimColor } as React.CSSProperties}
    >
      <div
        className="project-card__header project-card__header--compact"
        onClick={() => {
          if (!expanded) setDraft(project)
          onToggleExpand()
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!expanded) setDraft(project)
            onToggleExpand()
          }
        }}
      >
        <div className="project-card__header-main">
          <span className={`type-badge type-badge--${project.type.toLowerCase()}`}>{project.type}</span>
          <span className="project-name-compact">{titleLine}</span>
          <MiniGantt24 planning={project.planning} color={perimColor} />
        </div>
        <div className="project-card__header-right">
          <ScoreRing40 score={displayScoreCollapsed} />
          <div className="project-card__header-actions">
            {project.type === 'BUILD' && (
              <button
                type="button"
                className={`transfo-toggle ${project.selected_for_transfo ? 'transfo-toggle--on' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleTransfo()
                }}
                title="Retenir pour le DG"
              >
                {project.selected_for_transfo ? `★ #${dgRank} DG` : '☆ Retenir'}
              </button>
            )}
            <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="project-card__body">
          <div className="project-sections project-sections--editor">
            <div className="project-editor-col project-editor-col--full">
              <div className="section-title">Identification du projet</div>
              <div className="identification-grid">
                <div className="identification-cell">
                  <label className="project-field">
                    <span>Thématique *</span>
                    <input value={draft.thematique} onChange={(e) => setDraft((p) => ({ ...p, thematique: e.target.value }))} placeholder="Ex: Digitalisation RH" />
                  </label>
                </div>
                <div className="identification-cell">
                  <div className="project-field">
                    <span>Type de projet *</span>
                    <div className="type-pills">
                      <button type="button" className={draft.type === 'RUN' ? 'type-pill type-pill--active' : 'type-pill'} onClick={() => setDraft((p) => ({ ...p, type: 'RUN' }))}>RUN — Amélioration continue</button>
                      <button type="button" className={draft.type === 'BUILD' ? 'type-pill type-pill--active' : 'type-pill'} onClick={() => setDraft((p) => ({ ...p, type: 'BUILD' }))}>BUILD — Projet transformant</button>
                    </div>
                    {draft.type === 'BUILD' && <div className="eligible-note">⭐ Éligible top 5 DG</div>}
                  </div>
                </div>

                <div className="identification-cell">
                  <label className="project-field">
                    <span>Sujet / Projet *</span>
                    <input
                      value={draft.name}
                      onChange={(e) => {
                        const v = e.target.value
                        setDraft((p) => ({ ...p, name: v }))
                        onPatchProject({ name: v })
                      }}
                      placeholder="Nom court du projet"
                    />
                  </label>
                </div>
                <div className="identification-cell">
                  <label className="project-field">
                    <span>Gains quantitatifs (€)</span>
                    <div className="input-prefix-wrap">
                      <span className="input-prefix">€</span>
                      <input type="number" value={draft.gains_quantitatifs ?? ''} onChange={(e) => setDraft((p) => ({ ...p, gains_quantitatifs: Number(e.target.value || 0) }))} placeholder="0" />
                    </div>
                  </label>
                </div>

                <div className="identification-cell">
                  <label className="project-field">
                    <span>Description / Problématique *</span>
                    <textarea rows={4} value={draft.problematique} onChange={(e) => setDraft((p) => ({ ...p, problematique: e.target.value }))} placeholder="Décrivez le problème que ce projet résout..." />
                  </label>
                </div>
                <div className="identification-cell">
                  <label className="project-field">
                    <span>Gains qualitatifs</span>
                    <textarea rows={2} value={draft.gains_qualitatifs ?? ''} onChange={(e) => setDraft((p) => ({ ...p, gains_qualitatifs: e.target.value }))} placeholder="Bénéfices non financiers attendus..." />
                  </label>
                </div>
              </div>
            </div>

            <div className="eval-section-opener">Indice de criticité</div>

            <div className="project-eval-layout">
              <div className="project-eval-header">
                <div className="section-title">Tables d&apos;évaluation (1 à 5)</div>
                <div className="score-badge-wrap score-badge-wrap--side">
                  <ScoreBadge score={score} />
                </div>
              </div>
              {(Object.keys(CRITERIA_META) as Array<keyof Scores>).map((k) => (
                <div key={`eval-row-${k}`} className="project-eval-row">
                  <div className="eval-legend-card">
                    <div className="eval-legend-title">{CRITERIA_META[k].label}</div>
                    <table className="eval-legend-table">
                      <tbody>
                        {evalLevels.map((lvl) => (
                          <tr key={`${k}-${lvl}`}>
                            <td className="eval-legend-level">{lvl}</td>
                            <td>{CRITERIA_DESCRIPTIONS[k][lvl]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <CritereSlider
                    key={k}
                    criteriaKey={k}
                    value={draft.scores[k]}
                    coef={coefs[k]}
                    onChange={(v) => updateDraftScore(k, v)}
                  />
                </div>
              ))}

              <div className="project-eval-extras">
                <div className="competence-toggle">
                  <span>Compétences disponibles en interne ?</span>
                  <div className="toggle-options">
                    <button type="button" className={draft.competences_dispo ? 'toggle-pill toggle-pill--yes' : 'toggle-pill'} onClick={() => setDraft((p) => ({ ...p, competences_dispo: true }))}>OUI</button>
                    <button type="button" className={!draft.competences_dispo ? 'toggle-pill toggle-pill--no' : 'toggle-pill'} onClick={() => setDraft((p) => ({ ...p, competences_dispo: false }))}>NON</button>
                  </div>
                </div>

                <div className="score-summary">
                  <div className="score-summary-formula">
                    Score = ({formula}) normalisé
                  </div>
                  <div className="score-summary-value" style={{ color: getScoreColor(score) }}>{score}/100</div>
                </div>
              </div>
            </div>
          </div>

          <div className="project-planning project-planning--section-a">
            <div className="section-title">Planning prévisionnel</div>
            <GanttPilules planning={draft.planning} color={perimColor} editable onChange={toggleDraftPlanning} />
            <div className="recap-block">
              <div className="recap-title">Récapitulatif de l&apos;évaluation</div>
              <table className="recap-table">
                <thead>
                  <tr>
                    <th>Dimension</th>
                    <th>Niveau</th>
                    <th>Description</th>
                    <th>Coef</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {criteriaRows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.label}</td>
                      <td>{row.level}/5</td>
                      <td>{row.description}</td>
                      <td>×{row.coef}</td>
                      <td className="recap-points">{row.points}</td>
                    </tr>
                  ))}
                  <tr className="recap-total">
                    <td>TOTAL</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td className="recap-points">{scoreRaw}</td>
                  </tr>
                </tbody>
              </table>
              <div className="recap-lines">
                <div>Score brut : {scoreRaw} / {scoreMax} (max pondéré)</div>
                <div>Score final : <span className="recap-final-badge" style={{ background: scoreFinal === 0 ? 'color-mix(in srgb, var(--theme-text-muted) 35%, var(--theme-border))' : getScoreColor(scoreFinal) }}>{scoreFinal} — {getScoreLabel(scoreFinal)}</span></div>
              </div>
            </div>
          </div>

          <div className="pilotage-section">
            <div className="section-title">Pilotage &amp; contributeurs</div>
            {isTransverse && (
              <div className="pilotage-transverse-note">
                Un projet transverse implique plusieurs directions. Il apparaîtra dans l&apos;espace de chaque direction co-pilote sélectionnée.
              </div>
            )}
            <label className="project-field">
              <span>Pilote pressenti du projet</span>
              <input value={draft.pilote} onChange={(e) => setDraft((p) => ({ ...p, pilote: e.target.value }))} placeholder="Nom du pilote" />
            </label>
            <div className="project-field">
              <span>
                {contribLabel}
              </span>
              <div className="contrib-pills">
                {SIMULATED_DIRECTIONS.map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    className={`contrib-pill ${draft.contributorDirections.includes(dir) ? 'contrib-pill--active' : ''}`}
                    onClick={() => toggleContributor(dir)}
                  >
                    {dir}
                  </button>
                ))}
              </div>
              {pilotageError && contribRequired && (
                <div className="pilotage-err">Sélectionnez au moins une direction co-pilote.</div>
              )}
              <p className="pilotage-hint">Ces directions seront notifiées et auront accès à ce projet</p>
            </div>
          </div>

          <div className="project-form-actions project-form-actions--footer">
            <button type="button" className="project-btn project-btn--ghost" onClick={handleCancel}>Annuler</button>
            <button type="button" className="project-btn project-btn--danger" onClick={() => setConfirmDelete(true)}>Supprimer</button>
          </div>

          {confirmDelete && (
            <div className="project-delete-popin-backdrop" onClick={() => setConfirmDelete(false)}>
              <div className="project-delete-popin" onClick={(e) => e.stopPropagation()}>
                <h4>Supprimer ce projet ?</h4>
                <p>Cette action est définitive. Voulez-vous continuer ?</p>
                <div className="project-delete-popin-actions">
                  <button type="button" className="project-btn project-btn--ghost" onClick={() => setConfirmDelete(false)}>Annuler</button>
                  <button type="button" className="project-btn project-btn--danger" onClick={handleDelete}>Supprimer définitivement</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Vue Synthèse ─────────────────────────────────────────────────────────────

function SyntheseView({ perimetre, coefs }: { perimetre: Perimetre; coefs: Coefficients }) {
  const selected = perimetre.projects
    .filter((p) => p.type === 'BUILD')
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
        Projets soumis au DG ({selected.length}/5)
      </div>

      {selected.length === 0 && (
        <div className="empty-state">Aucun projet BUILD retenu pour le DG.</div>
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
                  <span className="synthese-score" style={{ color: getScoreColor(score) }}>{score === 0 ? '—' : score}pts</span>
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
  isTransverse,
  expandedProjectId,
  onExpandedChange,
  onUpdateProject,
  onDeleteProject,
  onPatchProject,
}: {
  perimetre: Perimetre
  coefs: Coefficients
  isTransverse: boolean
  expandedProjectId: string | null
  onExpandedChange: (id: string | null) => void
  onUpdateProject: (perimId: string, projId: string, updates: Partial<Project>) => Promise<void> | void
  onDeleteProject: (perimId: string, projId: string) => Promise<void> | void
  onPatchProject: (perimId: string, projId: string, updates: Partial<Project>) => void
}) {
  const [mode, setMode] = useState<'edition' | 'synthese'>('edition')
  const buildProjects = perimetre.projects
    .filter((p) => p.type === 'BUILD')
    .sort((a, b) => computeScore(b, coefs) - computeScore(a, coefs))
  const runProjects = perimetre.projects
    .filter((p) => p.type === 'RUN')
    .sort((a, b) => computeScore(b, coefs) - computeScore(a, coefs))
  const selectedBuilds = buildProjects.filter((p) => p.selected_for_transfo)
  const selectedCount = selectedBuilds.length
  const dgRanks = new Map(selectedBuilds.map((project, index) => [project.id, index + 1]))

  return (
    <div className="perimetre-view">
      <div className="perimetre-toolbar-row">
        <div className="perimetre-stats-inline">
          <span>{perimetre.projects.length} projet{perimetre.projects.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span style={{ color: perimetre.color }}>{selectedCount}/5 soumis au DG</span>
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
            📋 Synthèse DG
          </button>
        </div>
      </div>

      {mode === 'edition' ? (
        <div className="projects-list">
          <div className="projects-group-header">
            <span>Projets BUILD — classés par indice de criticité</span>
            <span className="projects-group-count">{selectedCount}/5 retenus</span>
          </div>
          {buildProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              coefs={coefs}
              perimColor={perimetre.color}
              isTransverse={isTransverse}
              expanded={expandedProjectId === project.id}
              onToggleExpand={() => onExpandedChange(expandedProjectId === project.id ? null : project.id)}
              dgRank={dgRanks.get(project.id)}
              onToggleTransfo={() => {
                if (!project.selected_for_transfo && selectedCount >= 5) return
                onUpdateProject(perimetre.id, project.id, { selected_for_transfo: !project.selected_for_transfo })
              }}
              onSaveProject={(updates) => onUpdateProject(perimetre.id, project.id, updates)}
              onDeleteProject={() => onDeleteProject(perimetre.id, project.id)}
              onPatchProject={(updates) => onPatchProject(perimetre.id, project.id, updates)}
            />
          ))}

          <div className="projects-group-header projects-group-header--run">
            <span>Projets RUN — amélioration continue</span>
          </div>
          {runProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              coefs={coefs}
              perimColor={perimetre.color}
              isTransverse={isTransverse}
              expanded={expandedProjectId === project.id}
              onToggleExpand={() => onExpandedChange(expandedProjectId === project.id ? null : project.id)}
              onToggleTransfo={() => {}}
              onSaveProject={(updates) => onUpdateProject(perimetre.id, project.id, updates)}
              onDeleteProject={() => onDeleteProject(perimetre.id, project.id)}
              onPatchProject={(updates) => onPatchProject(perimetre.id, project.id, updates)}
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

function CoefPanel({
  coefs,
  onChange,
  onClose,
}: {
  coefs: Coefficients
  onChange: (k: keyof Coefficients, v: number) => void
  onClose: () => void
}) {
  return (
    <div className="coef-overlay" onClick={onClose}>
      <div className="coef-panel coef-panel--wide" onClick={(e) => e.stopPropagation()}>
        <div className="coef-panel-header">
          <h3>Coefficients de scoring</h3>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>
        <p className="coef-panel-hint">
          Adaptez les poids selon le contexte client. La dimension « Criticité » est pondérée ×3 par défaut car c&apos;est le critère stratégique central.
        </p>
        {(Object.keys(coefs) as Array<keyof Coefficients>).map((k) => (
          <div key={k} className="coef-row">
            <span className="coef-key">{CRITERIA_META[k].label}</span>
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

export interface ProjectSelectorProps {
  memberDirectionName?: string
  workspaceId?: string | null
}

export default function ProjectSelector({ memberDirectionName = 'Ma direction', workspaceId = null }: ProjectSelectorProps) {
  const [perimetres, setPerimetres] = useState<Perimetre[]>(() =>
    applyMemberDirectionPrefill(
      autoSelectTopBuildProjects(buildInitialPerimetres(memberDirectionName), DEFAULT_COEFFICIENTS),
    ),
  )
  const [activeId, setActiveId] = useState<string>(DIR_PERIM_ID)
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
  const [coefs, setCoefs] = useState<Coefficients>(DEFAULT_COEFFICIENTS)
  const [showCoefs, setShowCoefs] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const pendingCreateRef = useRef<Record<string, Promise<string>>>({})

  useEffect(() => {
    const name = memberDirectionName.trim() || 'Ma direction'
    setPerimetres((prev) => prev.map((p) => (p.id === DIR_PERIM_ID ? { ...p, name } : p)))
  }, [memberDirectionName])

  useEffect(() => {
    if (!workspaceId) return
    let cancelled = false
    void (async () => {
      setSyncLoading(true)
      setSyncError(null)
      try {
        let directions = await getWorkspaceDirections(workspaceId)

        if (directions.length === 0) {
          const createdDirection = await createDirection({
            workspace_id: workspaceId,
            nom: memberDirectionName.trim() || 'Ma direction',
            type: 'Fonctionnel',
            mission: null,
            vision: null,
            color: PERIMETRE_COLORS[0],
            is_transverse: false,
          })
          const createdTransverse = await createDirection({
            workspace_id: workspaceId,
            nom: 'Projets transverses',
            type: null,
            mission: null,
            vision: null,
            color: PERIMETRE_COLORS[1],
            is_transverse: true,
          })
          directions = [createdDirection as DbDirection, createdTransverse as DbDirection]
        }

        const hydrated = await Promise.all(
          directions.map(async (d, idx) => {
            const projets = await getDirectionProjets(d.id)
            return {
              id: d.id,
              name: d.nom,
              color: d.color || PERIMETRE_COLORS[idx % PERIMETRE_COLORS.length],
              mission: d.mission ?? '',
              vision: d.vision ?? '',
              projects: projets.map(mapDbProjetToProject),
            } as Perimetre
          }),
        )

        if (cancelled) return
        setPerimetres(hydrated)
        if (!hydrated.find((p) => p.id === activeId)) {
          setActiveId(hydrated[0]?.id ?? DIR_PERIM_ID)
        }
      } catch (error) {
        if (cancelled) return
        const message = typeof error === 'object' && error && 'message' in error
          ? String((error as { message?: unknown }).message ?? '')
          : ''
        setSyncError(message || 'Erreur de synchronisation Supabase')
      } finally {
        if (!cancelled) setSyncLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workspaceId, memberDirectionName])

  const active = perimetres.find((p) => p.id === activeId) ?? perimetres[0]
  const directionPerimetre = perimetres.find((p) => p.id === DIR_PERIM_ID)
  const transPerimetre = perimetres.find((p) => p.id === TRANS_PERIM_ID)
  const isTransverse = activeId === TRANS_PERIM_ID

  function updateProjectLocal(perimId: string, projId: string, updates: Partial<Project>) {
    setPerimetres((prev) =>
      prev.map((p) =>
        p.id !== perimId ? p : {
          ...p,
          projects: p.projects.map((pr) =>
            pr.id !== projId ? pr : { ...pr, ...updates },
          ),
        },
      ),
    )
  }

  async function persistProject(perimId: string, projId: string, updates: Partial<Project>) {
    updateProjectLocal(perimId, projId, updates)
    if (!workspaceId) return

    const perimetre = perimetres.find((p) => p.id === perimId)
    const current = perimetre?.projects.find((pr) => pr.id === projId)
    const merged = current ? { ...current, ...updates } as Project : null
    if (!merged) return

    try {
      if (merged.id.startsWith('proj-')) {
        if (!pendingCreateRef.current[projId]) {
          pendingCreateRef.current[projId] = (async () => {
            const created = await createProjet(mapProjectToDbProjet(merged, perimId, workspaceId))
            const hydrated = mapDbProjetToProject(created as DbProjet)
            setPerimetres((prev) =>
              prev.map((p) =>
                p.id !== perimId ? p : {
                  ...p,
                  projects: p.projects.map((pr) => (pr.id === projId ? hydrated : pr)),
                },
              ),
            )
            setExpandedProjectId(hydrated.id)
            return hydrated.id
          })().finally(() => {
            delete pendingCreateRef.current[projId]
          })
        }
        const realId = await pendingCreateRef.current[projId]
        const updated = await updateProjet(realId, mapProjectToDbProjet(merged, perimId, workspaceId))
        const hydrated = mapDbProjetToProject(updated as DbProjet)
        setPerimetres((prev) =>
          prev.map((p) =>
            p.id !== perimId ? p : {
              ...p,
              projects: p.projects.map((pr) => (pr.id === realId || pr.id === projId ? hydrated : pr)),
            },
          ),
        )
      } else {
        const updated = await updateProjet(merged.id, mapProjectToDbProjet(merged, perimId, workspaceId))
        const hydrated = mapDbProjetToProject(updated as DbProjet)
        setPerimetres((prev) =>
          prev.map((p) =>
            p.id !== perimId ? p : {
              ...p,
              projects: p.projects.map((pr) => (pr.id === merged.id ? hydrated : pr)),
            },
          ),
        )
      }
    } catch (error) {
      const message = typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: unknown }).message ?? '')
        : ''
      setSyncError(message || 'Erreur lors de la sauvegarde du projet')
    }
  }

  async function removeProject(perimId: string, projId: string) {
    setPerimetres((prev) =>
      prev.map((p) =>
        p.id !== perimId ? p : { ...p, projects: p.projects.filter((pr) => pr.id !== projId) },
      ),
    )
    if (!workspaceId) return
    if (projId.startsWith('proj-')) return
    try {
      await deleteProjet(projId)
    } catch (error) {
      const message = typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: unknown }).message ?? '')
        : ''
      setSyncError(message || 'Erreur lors de la suppression du projet')
    }
  }

  function addProject() {
    if (!active) return
    const empty = createEmptyProject()
    setPerimetres((prev) =>
      prev.map((p) =>
        p.id === active.id ? { ...p, projects: [empty, ...p.projects] } : p,
      ),
    )
    setExpandedProjectId(empty.id)
  }

  function selectTab(id: string) {
    setActiveId(id)
    setExpandedProjectId(null)
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ps-root">
        <main className="ps-main">
          <div className="ps-page-header">
            <div>
              <h1 className="ps-page-title">Sélection de projets transformants</h1>
              <p className="ps-page-sub">Les projets BUILD sont classés par indice de criticité — le top 5 est soumis au DG</p>
            </div>
            <div className="ps-legend">
              <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--score-critical)' }} />≥75</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--score-caramel-4)' }} />≥50</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--score-caramel-3)' }} />≥25</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--score-caramel-2)' }} />&lt;25</span>
            </div>
          </div>

          <div className="ps-toolbar">
            <div className="ps-pills">
              {directionPerimetre && (
                <button
                  type="button"
                  className={`ps-pill ${activeId === DIR_PERIM_ID ? 'ps-pill--active' : ''}`}
                  onClick={() => selectTab(DIR_PERIM_ID)}
                >
                  {directionPerimetre.name}
                  <span className="ps-pill-dot" style={{ background: directionPerimetre.color }} aria-hidden />
                </button>
              )}
              {transPerimetre && (
                <button
                  type="button"
                  className={`ps-pill ${activeId === TRANS_PERIM_ID ? 'ps-pill--active' : ''}`}
                  onClick={() => selectTab(TRANS_PERIM_ID)}
                >
                  Projets transverses
                  <span className="ps-pill-dot" style={{ background: transPerimetre.color }} aria-hidden />
                </button>
              )}
            </div>
            <div className="ps-toolbar-right">
              <button type="button" className="ps-add-project" onClick={addProject}>
                + Ajouter un projet →
              </button>
              <button type="button" className="ps-coef-fab" onClick={() => setShowCoefs(true)} title="Coefficients">
                ⚙
              </button>
            </div>
          </div>

          {active && (
            <PerimetreView
              perimetre={active}
              coefs={coefs}
              isTransverse={isTransverse}
              expandedProjectId={expandedProjectId}
              onExpandedChange={setExpandedProjectId}
              onUpdateProject={persistProject}
              onDeleteProject={removeProject}
              onPatchProject={updateProjectLocal}
            />
          )}
          {syncLoading && <p className="ps-sync-note">Synchronisation en cours...</p>}
          {syncError && <p className="ps-sync-err">{syncError}</p>}
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
  min-height: 100svh;
  background: transparent;
  color: var(--theme-text);
  font-family: var(--font-body);
  font-size: var(--fs-base);
}

/* ── Toolbar onglets ── */
.ps-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
  margin-bottom: var(--space-md);
}

.ps-pills {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ps-pill {
  appearance: none;
  border: 1px solid var(--theme-border);
  background: transparent;
  border-radius: 999px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-text-muted);
  cursor: pointer;
  font-family: var(--font-body);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s;
}

.ps-pill:hover {
  color: var(--theme-text);
  border-color: color-mix(in srgb, var(--theme-accent) 35%, var(--theme-border));
}

.ps-pill--active {
  background: var(--theme-bg-card);
  border-color: var(--theme-accent);
  color: var(--theme-text);
  box-shadow: 0 0 0 3px rgba(142, 59, 70, 0.08);
}

.ps-pill-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ps-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.ps-add-project {
  appearance: none;
  border: none;
  background: var(--theme-accent);
  color: #fff;
  border-radius: var(--radius-md);
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: var(--font-body);
  transition: transform 0.15s, background 0.2s, filter 0.2s;
}

.ps-add-project:hover {
  filter: brightness(0.92);
  transform: translateY(-1px);
}

.ps-coef-fab {
  appearance: none;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  border: 1px solid var(--theme-border);
  background: var(--theme-bg-card);
  color: var(--theme-text-muted);
  cursor: pointer;
  font-size: 1.1rem;
  transition: border-color 0.2s, color 0.2s;
}

.ps-coef-fab:hover {
  border-color: var(--theme-accent);
  color: var(--theme-text);
}

/* ── Main ── */
.ps-main {
  flex: 1;
  min-width: 0;
  width: 100%;
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
  font-size: var(--text-2xl);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--orecchiette-50);
  margin: 0 0 var(--space-xs);
}

[data-theme='dark'] .ps-page-title {
  color: var(--orecchiette-800);
}

.ps-page-sub {
  font-family: var(--font-body);
  font-size: var(--text-lg);
  font-weight: 400;
  line-height: 1.6;
  color: color-mix(in srgb, var(--theme-text) 85%, var(--theme-bg-page));
  margin: 0;
}

.ps-sync-note {
  margin: 0;
  font-size: 12px;
  color: color-mix(in srgb, var(--theme-text) 82%, var(--theme-bg-card));
}

.ps-sync-err {
  margin: 0;
  font-size: 12px;
  color: #B91C1C;
}

.ps-empty {
  min-height: 48svh;
  border: 1px dashed var(--theme-border);
  border-radius: var(--radius-lg);
  background: var(--theme-bg-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  padding: var(--space-xl);
}

.ps-empty-icon {
  width: 48px;
  height: 48px;
  color: var(--theme-text-muted);
}

.ps-empty h3 {
  margin: 0;
  color: var(--theme-text);
  font-family: var(--font-display);
  font-size: 1.15rem;
}

.ps-empty p {
  margin: 0;
  color: var(--theme-text-muted);
  font-size: 0.85rem;
}

.ps-empty-btn {
  margin-top: 4px;
  border: 1px solid #8E3B46;
  background: #8E3B46;
  color: #fff;
  border-radius: 10px;
  padding: 9px 14px;
  font-weight: 700;
  font-size: 0.82rem;
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
  color: color-mix(in srgb, var(--theme-text) 80%, var(--theme-bg-card));
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
  background: var(--glass-bg-chip);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: 5px;
  box-shadow: var(--glass-highlight);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
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
  background: color-mix(in srgb, var(--glass-bg-card) 88%, var(--brand-bordeaux) 12%);
  color: var(--theme-text);
  box-shadow: var(--shadow-sm);
}

/* ── Projet Card ── */
.projects-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.projects-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  background: var(--glass-bg-chip);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-highlight);
  backdrop-filter: blur(14px) saturate(1.25);
  -webkit-backdrop-filter: blur(14px) saturate(1.25);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--theme-text-muted);
}

.projects-group-header--run {
  margin-top: var(--space-lg);
}

.projects-group-count {
  color: var(--theme-text-muted);
}

.project-card {
  position: relative;
  background: var(--glass-bg-card);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-highlight), var(--glass-shadow), var(--shadow-sm);
  border-radius: var(--radius-lg);
  overflow: hidden;
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  transition: border-color var(--transition), box-shadow var(--transition);
}

.project-card--selected {
  border-color: color-mix(in srgb, var(--perim-color) 55%, var(--glass-border));
  box-shadow: var(--glass-highlight), 0 0 0 1px color-mix(in srgb, var(--perim-color) 45%, transparent), var(--glass-shadow), var(--shadow-sm);
}

.project-card__header {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg) var(--space-xl);
  cursor: pointer;
  transition: background var(--transition);
}

.project-card__header--compact {
  flex-wrap: nowrap;
  gap: 14px;
  padding: 16px 20px;
  align-items: center;
  justify-content: space-between;
}

.project-card__header-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.project-card__header--compact .type-badge {
  flex-shrink: 0;
}

.project-name-compact {
  flex: 1;
  min-width: 48px;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  color: var(--theme-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-card__header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.project-card__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.mini-gantt-24-wrap {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-shrink: 1;
  min-width: 0;
  max-width: min(360px, 55vw);
  margin-right: 14px;
  padding-right: 10px;
  box-sizing: border-box;
}

.mini-gantt-24__markers {
  position: relative;
  height: 12px;
  min-width: 180px;
}

.mini-gantt-24__marker {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-size: 8px;
  line-height: 1;
  font-weight: 700;
  color: var(--theme-text-muted);
  text-align: center;
  white-space: nowrap;
}

.mini-gantt-24__marker--end {
  transform: translateX(-100%);
}

.mini-gantt-24 {
  display: flex;
  flex-direction: row;
  gap: 2px;
  flex-shrink: 1;
  min-width: 0;
  align-items: center;
  max-width: min(360px, 55vw);
  overflow: hidden;
}

.mini-gantt-24__cell {
  width: 10px;
  min-width: 9px;
  flex: 1 0 9px;
  max-width: 12px;
  height: 18px;
  border-radius: 2px;
  background: var(--theme-border);
  flex-shrink: 0;
}

.score-ring-40 {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  align-self: center;
}

.score-ring-40__svg {
  width: 40px;
  height: 40px;
  display: block;
}

.score-ring-40__val {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  pointer-events: none;
}

.perimetre-toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
  margin-bottom: var(--space-sm);
}

.perimetre-stats-inline {
  font-size: 0.82rem;
  color: var(--theme-text-muted);
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.pilotage-section {
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--theme-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.pilotage-transverse-note {
  background: rgba(142, 59, 70, 0.06);
  border-left: 3px solid var(--theme-accent);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--theme-text-muted);
  line-height: 1.45;
}

.contrib-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.contrib-pill {
  appearance: none;
  border: 1px solid var(--theme-border);
  background: transparent;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--theme-text-muted);
  cursor: pointer;
  font-family: var(--font-body);
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}

.contrib-pill--active {
  background: var(--theme-accent);
  border-color: var(--theme-accent);
  color: #fff;
}

.pilotage-hint {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--theme-text-muted);
  font-style: italic;
}

.pilotage-err {
  margin-top: 6px;
  font-size: 12px;
  color: var(--score-critical);
  font-weight: 600;
}

.project-planning--section-a {
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--theme-border);
}

.project-form-actions--footer {
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--theme-border);
}

.project-card__header:hover {
  background: color-mix(in srgb, var(--theme-border) 44%, var(--theme-bg-card));
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
  background: color-mix(in srgb, var(--score-caramel-3) 18%, transparent);
  color: var(--score-caramel-4);
  border: 1px solid color-mix(in srgb, var(--score-caramel-3) 65%, var(--theme-border));
}

.project-thematique {
  font-size: 0.75rem;
  color: var(--theme-text-muted);
  font-style: italic;
}

.competence-warn {
  font-size: 0.72rem;
  color: var(--score-caramel-4);
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
  gap: 6px;
  position: relative;
  width: 110px;
  min-height: 120px;
  justify-content: flex-start;
}

.score-ring {
  width: 80px;
  height: 80px;
}

.score-value {
  position: absolute;
  width: 80px;
  height: 80px;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  display: grid;
  place-items: center;
  font-size: 24px;
  font-weight: 800;
  font-family: var(--font-display);
  line-height: 1;
  pointer-events: none;
  text-align: center;
}

.score-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: static;
  transform: none;
  margin-top: 14px;
  white-space: nowrap;
  line-height: 1.2;
  text-align: center;
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
  padding: var(--space-2xl) var(--space-2xl) var(--space-3xl);
  border-top: 1px solid var(--glass-border);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--glass-bg-chip) 35%, transparent) 0%,
    transparent 48%
  );
  backdrop-filter: blur(10px) saturate(1.15);
  -webkit-backdrop-filter: blur(10px) saturate(1.15);
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
  gap: var(--space-2xl);
}

.project-sections--editor {
  align-items: start;
}

.project-editor-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.project-editor-col--full {
  grid-column: 1 / -1;
}

.identification-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2xl) var(--space-2xl);
}

.identification-cell {
  display: flex;
  flex-direction: column;
}

.eval-section-opener {
  grid-column: 1 / -1;
  text-align: center;
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--theme-text-muted);
  margin-top: 2px;
}

.project-eval-layout {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.project-eval-header {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.25fr);
  gap: var(--space-2xl);
  align-items: center;
}

.project-eval-header .section-title {
  margin-bottom: 0;
}

.project-eval-row {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.25fr);
  gap: var(--space-2xl);
  align-items: center;
}

.project-eval-extras {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.25fr);
  gap: var(--space-2xl);
  align-items: start;
}

.eval-legend-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.eval-legend-card {
  border: none;
  border-radius: 14px;
  background: transparent;
  box-shadow: none;
  overflow: hidden;
}

.eval-legend-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--theme-text-muted);
  padding: 0 4px 12px;
  background: transparent;
}

.eval-legend-table {
  width: 100%;
  border-collapse: collapse;
}

.eval-legend-table td {
  padding: 12px 10px;
  font-size: 0.8rem;
  line-height: 1.45;
  color: color-mix(in srgb, var(--theme-text) 88%, var(--theme-bg-card));
  border-top: 1px solid color-mix(in srgb, var(--theme-border) 12%, transparent);
}

.eval-legend-level {
  width: 32px;
  text-align: center;
  font-weight: 800;
  color: var(--theme-text);
}

.project-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.project-field span {
  font-size: var(--fs-small);
  font-weight: 700;
  color: var(--theme-text);
}

.project-field input,
.project-field textarea {
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  height: 48px;
  padding: 0 16px;
  font-family: var(--font-body);
  background: var(--glass-bg-chip);
  color: var(--theme-text);
  box-shadow: var(--glass-highlight);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.project-field textarea {
  height: auto;
  padding: 14px 16px;
  resize: vertical;
}

.project-field input:focus,
.project-field textarea:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--brand-bordeaux) 55%, var(--glass-border));
  box-shadow: var(--glass-highlight), 0 0 0 3px color-mix(in srgb, var(--brand-bordeaux) 18%, transparent);
}

.input-prefix-wrap {
  position: relative;
}

.input-prefix {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--theme-text-muted);
}

.input-prefix-wrap input {
  padding-left: 28px;
}

.type-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.type-pill {
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  padding: 9px 16px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--glass-bg-chip);
  color: var(--theme-text-muted);
  backdrop-filter: blur(10px) saturate(1.15);
  -webkit-backdrop-filter: blur(10px) saturate(1.15);
  box-shadow: var(--glass-highlight);
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}

.type-pill--active {
  background: color-mix(in srgb, var(--brand-bordeaux) 92%, black 8%);
  border-color: color-mix(in srgb, var(--brand-bordeaux) 70%, var(--glass-border));
  color: #fff;
  box-shadow: var(--glass-highlight), 0 4px 20px color-mix(in srgb, var(--brand-bordeaux) 22%, transparent);
}

.eligible-note {
  margin-top: 4px;
  font-size: 11px;
  color: var(--score-caramel-3);
}

.section-title {
  font-size: var(--fs-small);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--theme-text-muted);
  margin-bottom: var(--space-md);
}

.section-title--score {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--theme-text-muted);
}

/* ── Critère Slider ── */
.critere-row {
  margin-bottom: var(--space-lg);
}

.critere-row--enhanced {
  padding: var(--space-md) var(--space-lg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  background: color-mix(in srgb, var(--glass-bg-chip) 55%, transparent);
  box-shadow: var(--glass-highlight);
  backdrop-filter: blur(14px) saturate(1.2);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
}

.critere-row--bar {
  padding: 0;
  border: none;
  background: transparent;
}

.critere-bar {
  display: grid;
  grid-template-columns: 94px 1fr 102px;
  min-height: 88px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--glass-border) 65%, rgba(0,0,0,0.15));
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}

.critere-icon-pane {
  background: var(--critere-pane-icon);
  display: grid;
  place-items: center;
  color: #f4f0ec;
}

.critere-icon {
  width: 68px;
  height: 68px;
  display: grid;
  place-items: center;
}

.critere-middle-pane {
  background: var(--critere-pane-mid);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.critere-title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.critere-title-above {
  font-size: var(--fs-small);
  font-weight: 800;
  color: var(--theme-text);
  text-align: center;
  margin: 0 0 8px;
}

.critere-value-pane {
  background: color-mix(in srgb, var(--theme-border) 76%, var(--theme-bg-card));
  display: grid;
  place-items: center;
}

.critere-value-pane--none {
  background: color-mix(in srgb, var(--theme-border) 76%, var(--theme-bg-card));
}

.critere-value-pane--low {
  background: var(--score-caramel-1);
}

.critere-value-pane--medium {
  background: var(--score-caramel-2);
}

.critere-value-pane--high {
  background: var(--score-caramel-3);
}

.critere-value-pane--critical {
  background: var(--score-critical);
}

.critere-name {
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--theme-on-accent);
  text-align: center;
}

.critere-coef-inline {
  font-size: 0.78rem;
  color: color-mix(in srgb, var(--theme-on-accent) 90%, transparent);
  font-weight: 700;
  text-align: center;
}

.critere-desc {
  font-size: 0.72rem;
  color: var(--theme-text-muted);
}

.critere-val {
  font-size: 1.9rem;
  font-family: var(--font-display);
  font-weight: 900;
  color: var(--critere-val-ink);
  line-height: 1;
  letter-spacing: 0.01em;
}

.critere-grid {
  display: grid;
  grid-template-columns: repeat(5, 34px);
  gap: 6px;
  justify-content: center;
}

.critere-grid--six {
  grid-template-columns: repeat(5, minmax(34px, 1fr));
  max-width: 100%;
}

.critere-square {
  width: 34px;
  height: 34px;
  max-width: 100%;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, rgba(255,255,255,0.22), var(--theme-border) 35%);
  background: var(--critere-square-bg);
  cursor: pointer;
  transition: background var(--transition), border-color var(--transition), box-shadow var(--transition);
  color: rgba(255, 250, 246, 0.92);
  font-weight: 800;
  font-size: 0.95rem;
}

.critere-square:hover {
  background: var(--critere-square-bg-hover);
  border-color: color-mix(in srgb, rgba(255,255,255,0.35), var(--theme-border) 25%);
}

.critere-square--active {
  color: #ffffff;
  border-color: rgba(255,255,255,0.34);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);
}

.critere-square--level-1 {
  color: var(--score-caramel-1);
}

.critere-square--level-2 {
  color: var(--score-caramel-2);
}

.critere-square--level-3 {
  color: var(--score-caramel-3);
}

.critere-square--level-4 {
  color: var(--score-caramel-4);
}

.critere-square--level-5 {
  color: var(--score-critical);
}

.critere-value-pane--low .critere-val,
.critere-value-pane--medium .critere-val,
.critere-value-pane--high .critere-val {
  color: var(--critere-val-ink);
}

.critere-value-pane--critical .critere-val {
  color: #fff;
}

.critere-row--urgence .critere-icon,
.critere-row--etp .critere-icon,
.critere-row--investissement .critere-icon {
  color: #f3dde0;
}

.critere-row--criticite .critere-icon,
.critere-row--recurrence .critere-icon,
.critere-row--temps .critere-icon {
  color: #f8f8f8;
}

.critere-level-desc {
  font-size: 12px;
  color: var(--theme-text-muted);
  font-style: italic;
  margin: 8px 12px 10px;
}

.project-scoring-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}

.project-scoring-head--stack {
  align-items: center;
  flex-direction: column;
}

.score-badge-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
}

.score-badge-wrap--side {
  justify-content: flex-start;
}

.competence-toggle {
  border: 1px solid var(--theme-border);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toggle-options {
  display: flex;
  gap: 8px;
}

.toggle-pill {
  border: 1px solid var(--theme-border);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.74rem;
  font-weight: 700;
}

.toggle-pill--yes {
  background: color-mix(in srgb, var(--score-caramel-2) 14%, transparent);
  border-color: color-mix(in srgb, var(--score-caramel-3) 55%, var(--theme-border));
  color: var(--score-caramel-4);
}

.toggle-pill--no {
  background: color-mix(in srgb, var(--score-caramel-4) 12%, transparent);
  border-color: color-mix(in srgb, var(--score-caramel-4) 45%, var(--theme-border));
  color: var(--score-critical);
}

.score-summary {
  background: var(--theme-bg-page);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--theme-border);
}

.score-summary-formula {
  font-size: 12px;
  color: var(--theme-text-muted);
  line-height: 1.45;
}

.score-summary-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 800;
}

.project-form-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.project-btn {
  height: 40px;
  border-radius: 10px;
  padding: 0 12px;
  font-weight: 700;
  font-size: 0.82rem;
}

.project-btn--ghost {
  background: transparent;
  border: 1px solid var(--theme-border);
  color: var(--theme-text-muted);
}

.project-btn--primary {
  background: #8E3B46;
  border: 1px solid #8E3B46;
  color: white;
}

.project-btn--danger {
  background: color-mix(in srgb, var(--score-critical) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--score-critical) 45%, var(--theme-border));
  color: var(--score-critical);
}

.project-btn--danger:hover {
  background: rgba(239,68,68,0.18);
}

.project-delete-popin-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: grid;
  place-items: center;
  z-index: 120;
}

.project-delete-popin {
  width: min(92vw, 420px);
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border);
  border-radius: 14px;
  padding: 18px;
  box-shadow: var(--shadow-lg);
}

.project-delete-popin h4 {
  margin: 0 0 8px;
  font-size: 1rem;
  color: var(--theme-text);
}

.project-delete-popin p {
  margin: 0;
  font-size: 0.86rem;
  color: var(--theme-text-muted);
}

.project-delete-popin-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.recap-block {
  margin-top: 14px;
  background: var(--theme-bg-card);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--theme-border);
  box-shadow: var(--shadow-sm);
}

.recap-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--theme-text);
  margin-bottom: 10px;
}

.recap-table {
  width: 100%;
  border-collapse: collapse;
}

.recap-table th {
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--theme-text-muted);
  padding: 6px 6px 8px;
}

.recap-table td {
  font-size: 13px;
  color: var(--theme-text);
  padding: 7px 6px;
  border-bottom: 1px solid var(--theme-border);
}

.recap-points {
  font-weight: 700;
  color: var(--theme-accent);
}

.recap-total td {
  font-weight: 700;
  border-top: 2px solid var(--theme-border);
  border-bottom: none;
}

.recap-lines {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--theme-text-muted);
}

.recap-final-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  color: #fff;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 700;
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

.gantt-chart-wrap {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 4px;
}

.gantt-time-markers {
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  gap: 2px;
  margin-bottom: 4px;
}

.gantt-time-marker {
  font-size: 10px;
  font-weight: 700;
  color: var(--theme-text-muted);
  text-align: center;
  white-space: nowrap;
  transform: translateX(-50%);
}

.gantt-head-years {
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  gap: 2px;
  margin-bottom: 2px;
}

.gantt-year-cell {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--theme-text-muted);
  text-align: center;
  border-bottom: 1px solid var(--theme-border);
  padding-bottom: 2px;
  min-width: 0;
}

.gantt-head-months {
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  gap: 2px;
  margin-bottom: 4px;
}

.gantt-month-short {
  font-size: 9px;
  color: var(--theme-text-muted);
  text-align: center;
  padding: 2px 0 4px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gantt-grid--24 {
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  gap: 2px;
  min-width: 480px;
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

.gantt-cell--sm {
  height: 10px;
  border-radius: 2px;
  min-width: 0;
}

.gantt-cell--active {
  border-radius: 0;
}

.gantt-cell--editable:hover {
  filter: brightness(1.15);
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
  background: var(--glass-bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  width: 420px;
  max-width: 95vw;
  box-shadow: var(--glass-highlight), var(--glass-shadow), var(--shadow-lg);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
}

.coef-panel--wide {
  width: min(480px, 95vw);
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
  .project-sections--editor {
    grid-template-columns: 1fr;
  }
  .project-editor-col--full {
    grid-column: auto;
  }
  .identification-grid {
    grid-template-columns: 1fr;
  }
  .project-eval-layout {
    grid-column: auto;
  }
  .project-eval-header,
  .project-eval-row,
  .project-eval-extras {
    grid-template-columns: 1fr;
  }
  .project-field input,
  .project-field textarea {
    font-size: 16px;
  }
  .project-scoring-head {
    align-items: flex-start;
    flex-direction: column;
  }
  .type-pills {
    flex-direction: column;
  }
  .type-pill {
    width: 100%;
    text-align: left;
  }
  .project-form-actions {
    flex-direction: column;
  }
  .project-btn {
    width: 100%;
  }
  .critere-grid {
    grid-template-columns: repeat(5, minmax(32px, 1fr));
  }
  .critere-square {
    width: 100%;
    height: 32px;
    font-size: 0.9rem;
  }
  .critere-bar {
    grid-template-columns: 84px 1fr 88px;
  }
  .critere-icon {
    width: 58px;
    height: 58px;
  }
  .critere-val {
    font-size: 1.6rem;
  }
  .score-summary-value {
    font-size: 24px;
  }
  .synthese-header {
    grid-template-columns: 1fr;
  }
  .ps-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .ps-toolbar-right {
    margin-left: 0;
    width: 100%;
    justify-content: stretch;
  }
  .ps-add-project {
    flex: 1;
  }
}

@media (max-width: 1200px) and (min-width: 901px) {
  .project-eval-layout {
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 8px;
    scroll-snap-type: x mandatory;
    scrollbar-width: thin;
  }

  .project-eval-header,
  .project-eval-row,
  .project-eval-extras {
    min-width: 980px;
    scroll-snap-align: start;
  }
}

@media (max-width: 640px) {
  .ps-main {
    padding: var(--space-md);
  }
  .project-card__header--compact {
    flex-wrap: wrap;
  }
  .project-card__header-main {
    flex-wrap: wrap;
    width: 100%;
  }
  .critere-bar {
    grid-template-columns: 66px 1fr 72px;
    min-height: 74px;
  }
  .critere-middle-pane {
    padding: 8px;
  }
  .critere-name {
    font-size: 0.8rem;
  }
  .critere-coef-inline {
    font-size: 0.68rem;
  }
  .critere-val {
    font-size: 1.35rem;
  }
  .critere-icon {
    width: 46px;
    height: 46px;
  }
  .mini-gantt-24-wrap {
    order: 3;
    width: 100%;
    max-width: none;
  }
  .project-card__header-right {
    margin-left: auto;
  }
  .project-card__body {
    padding: var(--space-md);
  }
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .project-card {
    background: var(--theme-bg-card);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
`
