import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  analyzeDiscoursWithAI,
  getOrCreateDiscoursForWorkspace,
  getWorkspace,
  getWorkspaceUsers,
  updateVersionBlocs,
  updateVersionScore,
} from '../lib/api'
import { computeRuleBasedDiscoursScore } from '../lib/discours/scoring'
import { countJargonOccurrences, findAbstractPhrases, flattenDiscoursText } from '../lib/discours/jargon'
import { PERFORMATIVE_BLOCS, emptyBlocsPayload, emptyCard } from '../lib/discours/blocs'
import type { DiscoursBloc, DiscoursField, DiscoursSubField } from '../lib/discours/blocs'
import type {
  DiscoursBlocsPayload,
  DiscoursFieldValue,
  DiscoursScoreSnapshot,
  TransformationDiscourse,
  TransformationDiscourseVersion,
  User,
  Workspace,
} from '../lib/types'
import type { AppUserRole } from '../lib/appRole'

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
type AiState = 'idle' | 'loading' | 'error'

/**
 * Peuvent éditer le discours : superadmin plateforme, consultant owner, admin
 * du workspace et le membre CODIR « dirigeant » désigné. Le pilote projet a
 * accès en lecture seule (il voit la vue décideur mais ne la modifie pas).
 */
const EDIT_ROLES: ReadonlyArray<AppUserRole> = ['consultant', 'admin']
const MIN_AI_ANALYSIS_CHARS = 400

const DIAGNOSTIC_DIMENSIONS: ReadonlyArray<{
  key: keyof DiscoursScoreSnapshot['dimensions']
  label: string
}> = [
  { key: 'clarte_strategique', label: 'Clarté stratégique' },
  { key: 'force_narrative', label: 'Force narrative' },
  { key: 'credibilite_manageriale', label: 'Crédibilité managériale' },
  { key: 'pouvoir_mobilisateur', label: 'Pouvoir mobilisateur' },
  { key: 'performativite_collective', label: 'Performativité collective' },
]

type BlocWritingGuidance = {
  expectedOutput: string
  incompletePrompt: string
  completePrompt: string
  checks: string[]
}

const BLOC_WRITING_GUIDANCE: Record<string, BlocWritingGuidance> = {
  nous_reconnaitre: {
    expectedOutput: 'Installer un « nous » légitime avant de demander un mouvement.',
    incompletePrompt: 'Ancre le bloc dans des acquis concrets, puis explicite ce qui doit survivre à la transformation.',
    completePrompt: 'Relis en vérifiant que la fierté reste lucide : ni autosatisfaction, ni rupture brutale avec l’histoire.',
    checks: [
      'Les acquis sont observables et spécifiques.',
      'Le lien entre passé utile et transformation future est explicite.',
      'Le texte parle au collectif avec un vrai sujet « nous ».',
    ],
  },
  nommer_la_bascule: {
    expectedOutput: 'Faire sentir que le statu quo coûte plus cher que l’effort.',
    incompletePrompt: 'Relie chaque fait de contexte à un impact CODIR puis à un risque clair si rien ne change.',
    completePrompt: 'Relis en cherchant la bascule : le lecteur doit comprendre pourquoi maintenant, sans dramatisation gratuite.',
    checks: [
      'Chaque changement part d’un fait, pas d’une opinion.',
      'Le risque du statu quo est plus net que la peur du changement.',
      'L’urgence reste juste, crédible et actionnable.',
    ],
  },
  futur_desirable: {
    expectedOutput: 'Donner envie d’entrer dans l’effort par un futur désirable et vérifiable.',
    incompletePrompt: 'Formule le cap en une phrase, puis rends-le tangible pour clients, équipes et entreprise.',
    completePrompt: 'Relis en vérifiant que le futur promis se voit dans des preuves concrètes, pas seulement dans des intentions.',
    checks: [
      'L’ambition contient un verbe de mouvement.',
      'Le bénéfice est visible pour plusieurs parties prenantes.',
      'Les preuves de réussite permettraient de dire : « nous y sommes ».',
    ],
  },
  nouveaux_principes: {
    expectedOutput: 'Transformer le slogan en règles de décision et de comportement.',
    incompletePrompt: 'Pour chaque principe, précise ce qu’il veut dire, ce qu’il change et ce qu’il exige du CODIR.',
    completePrompt: 'Relis en retirant les principes trop abstraits : chacun doit pouvoir guider un arbitrage réel.',
    checks: [
      'Les principes sont formulés comme des règles d’action.',
      'Le changement par rapport à aujourd’hui est nommé.',
      'L’exigence dirigeante est explicite et assumée.',
    ],
  },
  concentrer_efforts: {
    expectedOutput: 'Transformer l’ambition en choix rares, lisibles et exécutables.',
    incompletePrompt: 'Garde seulement les priorités qui concentrent l’énergie, puis nomme ce qu’il faut simplifier pour les rendre faisables.',
    completePrompt: 'Relis en supprimant tout ce qui ressemble à une liste d’envies : une priorité doit créer un renoncement.',
    checks: [
      'Chaque priorité est un choix stratégique, pas un thème.',
      'Les simplifications retirent réellement de la friction.',
      'L’ensemble reste assez court pour orienter l’exécution.',
    ],
  },
  reconnaitre_epreuves: {
    expectedOutput: 'Autoriser la lucidité sans casser l’élan.',
    incompletePrompt: 'Nomme les risques externes, métiers, managériaux et humains, puis assume ce que les dirigeants devront changer.',
    completePrompt: 'Relis en vérifiant que les difficultés sont dicibles mais pas paralysantes.',
    checks: [
      'Les obstacles sont nommés sans euphémisme.',
      'La part de responsabilité dirigeante est présente.',
      'Les doutes ouvrent la discussion au lieu de fermer le débat.',
    ],
  },
  distribuer_roles: {
    expectedOutput: 'Faire du collectif un acteur réel de la transformation.',
    incompletePrompt: 'Clarifie ton engagement, le contrat CODIR, les attentes envers les managers et l’espace ouvert à la contribution.',
    completePrompt: 'Relis en vérifiant que chacun comprend ce qui dépend de lui et ce qui sera tenu par la gouvernance.',
    checks: [
      'Le dirigeant prend une part visible de l’engagement.',
      'Le non négociable et le discutable sont distingués.',
      'La contribution attendue n’est pas seulement descendante.',
    ],
  },
  sceller_engagement: {
    expectedOutput: 'Transformer la fin du discours en première action collective.',
    incompletePrompt: 'Conclue sur le sens de l’effort, les demandes à 30 jours, une date et un engagement personnel.',
    completePrompt: 'Relis en vérifiant que la dernière partie donne envie d’agir dès la sortie du séminaire.',
    checks: [
      'Les demandes à 30 jours sont concrètes et peu nombreuses.',
      'La prochaine étape est datée ou très clairement située.',
      'La phrase finale engage le dirigeant autant que le collectif.',
    ],
  },
}

export default function DiscoursTransformationPage({
  workspaceId,
  currentAppUserId,
  currentUserRole,
  platformSuperadmin,
}: {
  workspaceId: string | null
  currentAppUserId: string | null
  currentUserRole: AppUserRole
  platformSuperadmin: boolean
}) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([])
  const [, setDiscourse] = useState<TransformationDiscourse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState<TransformationDiscourseVersion | null>(null)
  const [blocs, setBlocs] = useState<DiscoursBlocsPayload>(() => emptyBlocsPayload())
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [scoreSaveState, setScoreSaveState] = useState<'idle' | 'saving' | 'error'>('idle')
  const [aiState, setAiState] = useState<AiState>('idle')
  const [aiError, setAiError] = useState<string | null>(null)
  const [scoreBaselineFingerprint, setScoreBaselineFingerprint] = useState<string | null>(null)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [ws, users, discResult] = await Promise.all([
        getWorkspace(workspaceId),
        getWorkspaceUsers(workspaceId).catch(() => [] as User[]),
        getOrCreateDiscoursForWorkspace(workspaceId),
      ])
      setWorkspace(ws)
      setWorkspaceUsers(users)
      setDiscourse(discResult.discourse)
      setVersion(discResult.currentVersion)
      const payload = mergeWithModel(discResult.currentVersion?.blocs ?? null)
      const payloadFingerprint = JSON.stringify(payload)
      setBlocs(payload)
      lastSavedRef.current = payloadFingerprint
      setScoreBaselineFingerprint(
        discResult.currentVersion?.score_snapshot
          ? discResult.currentVersion.score_snapshot.blocs_fingerprint ?? payloadFingerprint
          : null,
      )
      setSaveState('idle')
    } catch (e) {
      console.error('[DiscoursTransformation] load failed', e)
      setError("Impossible de charger le discours de transformation.")
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  const dirigeantUserId = workspace?.dirigeant_user_id ?? null
  const dirigeantUser = useMemo(
    () => workspaceUsers.find((u) => u.id === dirigeantUserId) ?? null,
    [workspaceUsers, dirigeantUserId],
  )
  const dirigeantDisplayName = dirigeantUser
    ? [dirigeantUser.prenom, dirigeantUser.nom].filter(Boolean).join(' ').trim() || dirigeantUser.email
    : null

  const canEdit =
    platformSuperadmin ||
    EDIT_ROLES.includes(currentUserRole) ||
    (currentAppUserId != null && dirigeantUserId != null && currentAppUserId === dirigeantUserId)

  useEffect(() => {
    void load()
  }, [load])

  const persist = useCallback(
    async (next: DiscoursBlocsPayload) => {
      if (!version) return
      if (!canEdit) return
      try {
        setSaveState('saving')
        const updated = await updateVersionBlocs(version.id, next)
        setVersion(updated)
        lastSavedRef.current = JSON.stringify(next)
        setSaveState('saved')
        setTimeout(() => {
          setSaveState((s) => (s === 'saved' ? 'idle' : s))
        }, 1800)
      } catch (e) {
        console.error('[DiscoursTransformation] save failed', e)
        setSaveState('error')
      }
    },
    [version, canEdit],
  )

  const scheduleSave = useCallback(
    (next: DiscoursBlocsPayload) => {
      if (!canEdit || !version) return
      setSaveState('dirty')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        if (JSON.stringify(next) !== lastSavedRef.current) {
          void persist(next)
        }
      }, 800)
    },
    [canEdit, version, persist],
  )

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const handleFieldChange = useCallback(
    (blocKey: string, fieldKey: string, value: DiscoursFieldValue) => {
      setBlocs((prev) => {
        const nextBlocFields = { ...(prev[blocKey] ?? {}), [fieldKey]: value }
        const next = { ...prev, [blocKey]: nextBlocFields }
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave],
  )

  const completion = useMemo(() => computeCompletion(blocs), [blocs])
  const currentBlocsFingerprint = useMemo(() => JSON.stringify(blocs), [blocs])
  const ruleSnapshot = useMemo(() => computeRuleBasedDiscoursScore(blocs), [blocs])
  const flatForDiag = useMemo(() => flattenDiscoursText(blocs), [blocs])
  const usefulCharCount = useMemo(() => flatForDiag.replace(/\s/g, '').length, [flatForDiag])
  const jargonHits = useMemo(() => countJargonOccurrences(flatForDiag), [flatForDiag])
  const abstractHits = useMemo(() => findAbstractPhrases(flatForDiag, 4), [flatForDiag])
  const savedSnapshot = version?.score_snapshot ?? null
  const savedSnapshotFingerprint = savedSnapshot?.blocs_fingerprint ?? scoreBaselineFingerprint
  const savedSnapshotIsStale =
    Boolean(savedSnapshot) &&
    Boolean(savedSnapshotFingerprint) &&
    savedSnapshotFingerprint !== currentBlocsFingerprint

  const saveDiagnostic = useCallback(async () => {
    if (!version?.id || !canEdit) return
    const snap = computeRuleBasedDiscoursScore(blocs)
    setScoreSaveState('saving')
    try {
      const updated = await updateVersionScore(version.id, snap)
      setVersion(updated)
      setScoreBaselineFingerprint(currentBlocsFingerprint)
      setScoreSaveState('idle')
    } catch (e) {
      console.error('[DiscoursTransformation] enregistrement diagnostic échoué', e)
      setScoreSaveState('error')
    }
  }, [version?.id, canEdit, blocs, currentBlocsFingerprint])

  const runAiAndSave = useCallback(async () => {
    if (!workspaceId || !version?.id || !canEdit) return
    if (usefulCharCount < MIN_AI_ANALYSIS_CHARS) {
      setAiError(`Écrire au moins ${MIN_AI_ANALYSIS_CHARS} caractères utiles avant de lancer l’analyse.`)
      setAiState('error')
      return
    }
    setAiError(null)
    setAiState('loading')
    try {
      const rawSnap = await analyzeDiscoursWithAI(workspaceId, flatForDiag, blocs, currentBlocsFingerprint)
      const snap = { ...rawSnap, blocs_fingerprint: currentBlocsFingerprint }
      const updated = await updateVersionScore(version.id, snap)
      setVersion(updated)
      setScoreBaselineFingerprint(currentBlocsFingerprint)
      setAiState('idle')
    } catch (e) {
      console.error('[DiscoursTransformation] analyse IA', e)
      setAiError(e instanceof Error ? e.message : 'Analyse IA impossible.')
      setAiState('error')
    }
  }, [workspaceId, version?.id, canEdit, flatForDiag, usefulCharCount, blocs, currentBlocsFingerprint])

  if (!workspaceId) {
    return (
      <section className="dashboard__module-panel">
        <div className="dashboard__module-panel-inner">
          <h2>Discours de transformation</h2>
          <p>Aucun espace entreprise sélectionné.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard__module-panel discours-module-panel" aria-labelledby="discours-title">
      <div className="dashboard__module-panel-deco" aria-hidden />
      <span className="dashboard__module-panel-blob dashboard__module-panel-blob--green" aria-hidden />
      <span className="dashboard__module-panel-blob dashboard__module-panel-blob--caramel" aria-hidden />
      <div className="dashboard__module-panel-inner discours-grid">
        <header className="discours-intro">
          <div className="discours-intro__row">
            <div>
              <h2 id="discours-title" className="discours-intro__title">Discours de transformation</h2>
              <p className="discours-intro__subtitle">
                Cadrage narratif du CODIR. Huit blocs performatifs pour constituer le collectif,
                nommer la bascule, dire le futur désirable et sceller l’engagement.
              </p>
            </div>
            <SaveBadge state={saveState} readOnly={!canEdit} />
          </div>

          <div className="discours-status-strip">
            <span>
              <strong>Dirigeant du discours :</strong>{' '}
              {dirigeantDisplayName ?? (dirigeantUserId ? '(membre CODIR)' : 'non désigné')}
            </span>
            <span>
              <strong>Version en cours :</strong> {version?.version_label ?? '—'}
            </span>
            <span>
              <strong>Complétude :</strong>{' '}
              {completion.filled}/{completion.total} champs ({completion.percent}%)
            </span>
            {!canEdit && (
              <span className="discours-status-strip__warn">
                Lecture seule — édition réservée au dirigeant désigné, aux consultants et admins.
              </span>
            )}
          </div>

          {error && (
            <div role="alert" className="discours-error-banner">
              {error}
            </div>
          )}
        </header>

        <aside className="discours-manifest" aria-label="Intention du module">
          <p>
            Ce que vous allez écrire ici, ce n’est pas seulement un texte : c’est un
            <strong> acte performatif</strong> — ce que vous direz au séminaire fait le cadrage
            autant qu’il le décrit. Vous engagez le collectif par la parole, pas seulement par le contenu.
          </p>
          <p>
            Ce discours sera aussi la <strong>première brique de controverse</strong> avec le CODIR :
            le moment où l’intelligence du désaccord utile entre en jeu, où se clarifient
            non&nbsp;négociable, débat et co-construction.
          </p>
          <p>
            En travaillant bloc par bloc dans ce module, vous préparez une <strong>V1 solide</strong> ;
            une fois évoluée en <strong>V2</strong> (affinée après échanges), ce récit deviendra une
            fondation pour le sens de la transformation engagée — ce à quoi l’entreprise pourra se
            référer quand les projets et les roadmaps prendront le relais.
          </p>
          <p className="discours-manifest__outro">
            L’outil vous aide à structurer et à peaufiner ; l’incarnation reste la vôtre.
            Quand vous êtes prêt, commencez à rédiger.
          </p>
        </aside>

        <DiscoursDiagnosticPanel
          hidden={loading}
          canEdit={canEdit}
          hasVersion={Boolean(version?.id)}
          hasWorkspace={Boolean(workspaceId)}
          ruleSnapshot={ruleSnapshot}
          savedSnapshot={savedSnapshot}
          savedSnapshotIsStale={savedSnapshotIsStale}
          jargonHits={jargonHits}
          abstractHits={abstractHits}
          usefulCharCount={usefulCharCount}
          aiState={aiState}
          aiError={aiError}
          scoreSaveState={scoreSaveState}
          onSaveRules={() => {
            void saveDiagnostic()
          }}
          onRunAi={() => {
            void runAiAndSave()
          }}
        />

        {loading ? (
          <p>Chargement…</p>
        ) : (
          <div className="discours-writing-grid">
            {PERFORMATIVE_BLOCS.map((bloc) => {
              const values = blocs[bloc.key] ?? {}
              return (
                <div className="discours-writing-row" key={bloc.key}>
                  <BlocEditor
                    bloc={bloc}
                    values={values}
                    readOnly={!canEdit}
                    onChange={(fieldKey, value) => handleFieldChange(bloc.key, fieldKey, value)}
                  />
                  <BlocGuidancePanel
                    bloc={bloc}
                    values={values}
                    feedbackSnapshot={savedSnapshot?.source === 'ai' && !savedSnapshotIsStale ? savedSnapshot : ruleSnapshot}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

// ───────────────────────── Badge sauvegarde ──────────────────────────────────
function SaveBadge({ state, readOnly }: { state: SaveState; readOnly: boolean }) {
  if (readOnly) return <span className="discours-save-badge">Lecture seule</span>
  const labels: Record<SaveState, { text: string; mod: string }> = {
    idle: { text: 'Enregistré', mod: '' },
    dirty: { text: 'Modifications non sauvegardées…', mod: 'discours-save-badge--dirty' },
    saving: { text: 'Enregistrement…', mod: 'discours-save-badge--saving' },
    saved: { text: 'Enregistré ✓', mod: 'discours-save-badge--saved' },
    error: { text: 'Échec de la sauvegarde', mod: 'discours-save-badge--error' },
  }
  const { text, mod } = labels[state]
  return <span className={`discours-save-badge ${mod}`.trim()}>{text}</span>
}

// ───────────────────────── Éditeur de bloc ───────────────────────────────────
function DiscoursDiagnosticPanel({
  hidden,
  canEdit,
  hasVersion,
  hasWorkspace,
  ruleSnapshot,
  savedSnapshot,
  savedSnapshotIsStale,
  jargonHits,
  abstractHits,
  usefulCharCount,
  aiState,
  aiError,
  scoreSaveState,
  onSaveRules,
  onRunAi,
}: {
  hidden: boolean
  canEdit: boolean
  hasVersion: boolean
  hasWorkspace: boolean
  ruleSnapshot: DiscoursScoreSnapshot
  savedSnapshot: DiscoursScoreSnapshot | null
  savedSnapshotIsStale: boolean
  jargonHits: number
  abstractHits: ReadonlyArray<{ phrase: string; wordCount: number; reason: string }>
  usefulCharCount: number
  aiState: AiState
  aiError: string | null
  scoreSaveState: 'idle' | 'saving' | 'error'
  onSaveRules: () => void
  onRunAi: () => void
}) {
  const aiReady = usefulCharCount >= MIN_AI_ANALYSIS_CHARS
  const hasAiSnapshot = savedSnapshot?.source === 'ai' && !savedSnapshotIsStale
  const displayedSnapshot = savedSnapshotIsStale ? ruleSnapshot : savedSnapshot ?? ruleSnapshot
  const snapshotLabel = savedSnapshot
    ? savedSnapshotIsStale
      ? 'Aperçu local après modifications'
      : savedSnapshot.source === 'ai'
      ? 'Dernière analyse IA'
      : 'Dernier diagnostic enregistré'
    : 'Aperçu local non enregistré'
  const snapshotDate = savedSnapshot?.computed_at
    ? new Date(savedSnapshot.computed_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    : null
  const aiDisabled =
    !hasVersion || !hasWorkspace || !canEdit || !aiReady || aiState === 'loading' || scoreSaveState === 'saving'
  const rulesDisabled = !hasVersion || !canEdit || scoreSaveState === 'saving' || aiState === 'loading'

  return (
    <aside className="discours-diagnostics" aria-labelledby="discours-diag-title" hidden={hidden}>
      <div className="discours-diagnostics__head">
        <div>
          <p className="discours-diagnostics__eyebrow">Revue qualité</p>
          <h3 id="discours-diag-title" className="discours-diagnostics__title">Analyse du discours</h3>
          <p className="discours-diagnostics__intro">
            Les jauges locales donnent un aperçu immédiat. L’analyse IA enregistre une lecture plus qualitative
            de la version courante via OpenRouter.
          </p>
        </div>
        <div
          className={`discours-ai-status ${hasAiSnapshot ? 'discours-ai-status--ready' : ''} ${
            savedSnapshotIsStale ? 'discours-ai-status--stale' : ''
          }`.trim()}
        >
          <span className="discours-ai-status__dot" aria-hidden />
          <span>{savedSnapshotIsStale ? 'IA à relancer' : hasAiSnapshot ? 'IA enregistrée' : 'IA à lancer'}</span>
        </div>
      </div>

      <div className="discours-diagnostics__layout">
        <section className="discours-score-card" aria-label={snapshotLabel}>
          <div className="discours-score-card__top">
            <span className="discours-score-card__label">{snapshotLabel}</span>
            <span className="discours-score-card__source">
              {savedSnapshotIsStale ? 'Local' : savedSnapshot ? (savedSnapshot.source === 'ai' ? 'IA' : 'Règles') : 'Local'}
            </span>
          </div>
          <div className="discours-score-card__score">
            <strong>{displayedSnapshot.total}</strong>
            <span>/100</span>
          </div>
          <p className="discours-score-card__meta">
            Niveau {displayedSnapshot.niveau} · {snapshotDate ?? `${usefulCharCount} caractères utiles`}
          </p>
          {displayedSnapshot.synthese && (
            <p className="discours-score-card__synthese">{displayedSnapshot.synthese}</p>
          )}
          {savedSnapshotIsStale && (
            <p className="discours-score-card__model">Le texte a changé depuis la dernière analyse IA.</p>
          )}
          {!savedSnapshotIsStale && savedSnapshot?.openrouter_model && (
            <p className="discours-score-card__model">Modèle : {savedSnapshot.openrouter_model}</p>
          )}
          {!savedSnapshotIsStale && savedSnapshot?.model_requested && !savedSnapshot.openrouter_model && (
            <p className="discours-score-card__model">Modèle demandé : {savedSnapshot.model_requested}</p>
          )}
        </section>

        <section className="discours-diagnostics__dimensions" aria-label="Dimensions du diagnostic">
          <ul className="discours-diagnostics__dim" role="list">
            {DIAGNOSTIC_DIMENSIONS.map(({ key, label }) => {
              const value = displayedSnapshot.dimensions[key]
              return (
                <li key={key}>
                  <span>{label}</span>
                  <meter className="discours-diagnostics__meter" min={0} max={20} value={value} title={label} />
                  <span className="discours-diagnostics__dim-v">{value} / 20</span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <div className="discours-diagnostics__insights">
        <InsightList title="Forces" items={displayedSnapshot.forces} empty="Aucune force marquée pour l’instant." />
        <InsightList title="Vigilances" items={displayedSnapshot.vigilances} empty="Aucune vigilance critique détectée." />
        <InsightList
          title="Prochaines actions"
          items={displayedSnapshot.recommandations}
          ordered
          empty="Compléter le discours pour obtenir des recommandations."
        />
      </div>

      <div className="discours-diagnostics__quality">
        <span>Mots d’alerte : <strong>{jargonHits}</strong></span>
        <span>Phrases longues détectées : <strong>{abstractHits.length}</strong></span>
        <span>
          Seuil IA : <strong>{Math.min(usefulCharCount, MIN_AI_ANALYSIS_CHARS)}</strong> / {MIN_AI_ANALYSIS_CHARS}
        </span>
      </div>

      {abstractHits.length > 0 && (
        <details className="discours-diagnostics__details">
          <summary>Phrases à simplifier</summary>
          <ul>
            {abstractHits.map((h) => (
              <li key={h.phrase}>
                <em>({h.wordCount} mots)</em> {h.reason} — <q>{h.phrase}</q>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="discours-diagnostics__actions">
        <div className="discours-diagnostics__row-btns">
          <button
            type="button"
            className="discours-diagnostics__ai"
            disabled={aiDisabled}
            title={!aiReady ? `Encore ${MIN_AI_ANALYSIS_CHARS - usefulCharCount} caractères utiles avant analyse IA` : undefined}
            onClick={onRunAi}
          >
            {aiState === 'loading' ? 'Analyse IA en cours…' : hasAiSnapshot ? 'Relancer l’analyse IA' : 'Analyser avec l’IA'}
          </button>
          <button type="button" className="discours-diagnostics__save" disabled={rulesDisabled} onClick={onSaveRules}>
            {scoreSaveState === 'saving' ? 'Enregistrement…' : 'Enregistrer l’aperçu local'}
          </button>
        </div>
        {!canEdit && (
          <span className="discours-diagnostics__hint">Lecture seule : l’analyse est réservée aux rôles autorisés.</span>
        )}
        {!aiReady && canEdit && (
          <span className="discours-diagnostics__hint">
            L’analyse IA se débloque après {MIN_AI_ANALYSIS_CHARS} caractères utiles pour éviter un résultat pauvre.
          </span>
        )}
        {aiError && <span className="discours-diagnostics__err" role="alert">{aiError}</span>}
        {scoreSaveState === 'error' && !aiError && (
          <span className="discours-diagnostics__err" role="alert">Échec d’enregistrement. Réessaye.</span>
        )}
      </div>
    </aside>
  )
}

function InsightList({
  title,
  items,
  empty,
  ordered = false,
}: {
  title: string
  items: string[]
  empty: string
  ordered?: boolean
}) {
  const ListTag = ordered ? 'ol' : 'ul'
  return (
    <section className="discours-diagnostics__block">
      <h4 className="discours-diagnostics__subh">{title}</h4>
      {items.length > 0 ? (
        <ListTag>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ListTag>
      ) : (
        <p className="discours-diagnostics__empty">{empty}</p>
      )}
    </section>
  )
}

function BlocGuidancePanel({
  bloc,
  values,
  feedbackSnapshot,
}: {
  bloc: DiscoursBloc
  values: Record<string, DiscoursFieldValue>
  feedbackSnapshot: DiscoursScoreSnapshot
}) {
  const progress = computeBlocProgress(bloc, values)
  const hasWrittenContent = hasBlocWrittenContent(values)
  const guidance = BLOC_WRITING_GUIDANCE[bloc.key]
  const targetedFeedback = feedbackSnapshot.bloc_feedback?.[bloc.key] ?? null
  const feedbackItems = targetedFeedback?.recommandations ?? []
  const hasFeedback =
    Boolean(targetedFeedback?.synthese) ||
    Boolean(targetedFeedback?.vigilances?.length) ||
    feedbackItems.length > 0
  const nextHelp =
    progress.missingLabels.length > 0
      ? guidance.incompletePrompt
      : guidance.completePrompt
  const firstMissing = progress.missingLabels[0]
  const feedbackTitle =
    feedbackSnapshot.source === 'ai' ? 'Retour IA à appliquer ici' : 'Retour local ciblé'

  return (
    <aside className="discours-guidance-card" aria-label={`Guidage ${bloc.title}`}>
      <div className="discours-guidance-card__head">
        <span className="discours-guidance-card__step">Bloc {bloc.order}</span>
        <span className={`discours-guidance-card__status ${progress.percent === 100 ? 'discours-guidance-card__status--done' : ''}`.trim()}>
          {progress.percent}%
        </span>
      </div>
      <h4 className="discours-guidance-card__title">{bloc.title}</h4>

      <div className="discours-guidance-card__section">
        <strong>{progress.missingLabels.length > 0 ? 'À compléter maintenant' : 'Relecture conseillée'}</strong>
        {progress.missingLabels.length > 0 ? (
          <ul>
            {progress.missingLabels.slice(0, 4).map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        ) : (
          <p>Vérifier que le bloc produit bien l’effet recherché : {bloc.effetsRecherches.join(', ')}.</p>
        )}
      </div>

      <div className="discours-guidance-card__section discours-guidance-card__section--soft">
        <strong>Relance d’écriture</strong>
        <p>{nextHelp}</p>
        {firstMissing && <p>Point à traiter en priorité : {firstMissing}.</p>}
      </div>

      {hasWrittenContent && (
        <div className="discours-guidance-card__section">
          <strong>Critères de qualité locaux</strong>
          <ul>
            {guidance.checks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
        </div>
      )}

      {hasWrittenContent && hasFeedback && targetedFeedback && (
        <div className="discours-guidance-card__section discours-guidance-card__section--ai">
          <strong>{feedbackTitle}</strong>
          {targetedFeedback.synthese && <p>{targetedFeedback.synthese}</p>}
          {targetedFeedback.vigilances && targetedFeedback.vigilances.length > 0 && (
            <ul>
              {targetedFeedback.vigilances.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {feedbackItems.length > 0 && (
            <ul>
              {feedbackItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  )
}

function BlocEditor({
  bloc,
  values,
  readOnly,
  onChange,
}: {
  bloc: DiscoursBloc
  values: Record<string, DiscoursFieldValue>
  readOnly: boolean
  onChange: (fieldKey: string, value: DiscoursFieldValue) => void
}) {
  // Si un champ est de type `cards` ou `long` dominant, on préfère la colonne unique
  // pour favoriser la lecture narrative. Les champs `text` courts peuvent rester en 2 cols.
  const hasCards = bloc.fields.some((f) => f.kind === 'cards')
  const allLongOrList = bloc.fields.every((f) => f.kind !== 'text')
  const singleColumn = hasCards || allLongOrList

  return (
    <article className="discours-card" aria-labelledby={`bloc-${bloc.key}-title`}>
      <header className="discours-card__header">
        <div className="discours-card__title-row">
          <span className="discours-card__index">{bloc.order}</span>
          <h3 id={`bloc-${bloc.key}-title`} className="discours-card__title">{bloc.title}</h3>
          <span className="discours-card__subtitle">{bloc.subtitle}</span>
        </div>
        <p className="discours-card__meta">
          <strong>But :</strong> {bloc.but}
        </p>
        <p className="discours-card__meta">
          <strong>Effet performatif :</strong> {bloc.effetPerformatif} — {bloc.effetsRecherches.join(' · ')}
        </p>
      </header>

      <div className={`discours-fields ${singleColumn ? 'discours-fields--single' : ''}`.trim()}>
        {bloc.fields.map((field) => (
          <FieldEditor
            key={field.key}
            blocKey={bloc.key}
            field={field}
            value={values[field.key] ?? (field.kind === 'list' ? [] : field.kind === 'cards' ? [] : '')}
            readOnly={readOnly}
            onChange={(v) => onChange(field.key, v)}
          />
        ))}
      </div>

      <footer className="discours-card__question">
        <strong>Question séminaire :</strong> {bloc.questionSeminaire}
      </footer>
    </article>
  )
}

// ───────────────────────── Champ individuel ──────────────────────────────────
function FieldEditor({
  blocKey,
  field,
  value,
  readOnly,
  onChange,
}: {
  blocKey: string
  field: DiscoursField
  value: DiscoursFieldValue
  readOnly: boolean
  onChange: (v: DiscoursFieldValue) => void
}) {
  const labelId = `field-${blocKey}-${field.key}`
  const aide = field.aide ? (
    <span className="discours-field__aide">{field.aide}</span>
  ) : null

  // ── Cartouches empilés (kind: 'cards') ────────────────────────────────────
  if (field.kind === 'cards') {
    const raw = Array.isArray(value) ? (value as Array<Record<string, string>>) : []
    const cards = raw.filter((c): c is Record<string, string> => typeof c === 'object' && c !== null)
    const minCards = field.minCards ?? 1
    const maxCards = field.maxCards ?? (field.subFields ? 5 : 1)

    const updateCard = (i: number, subKey: string, v: string) => {
      const next = cards.map((c, idx) => (idx === i ? { ...c, [subKey]: v } : c))
      onChange(next)
    }
    const removeCard = (i: number) => {
      if (i < minCards) return
      onChange(cards.filter((_, idx) => idx !== i))
    }
    const addCard = () => {
      if (cards.length >= maxCards) return
      onChange([...cards, emptyCard(field)])
    }

    return (
      <div className="discours-field">
        <label htmlFor={labelId} className="discours-field__label">
          {field.label}
          {field.optional && <span className="discours-field__optional">— optionnel</span>}
        </label>
        {aide}
        <div className="discours-subcards">
          {cards.map((card, i) => (
            <div key={i} className="discours-subcard">
              <div className="discours-subcard__header">
                <h4 className="discours-subcard__title">
                  {field.cardTitle ? field.cardTitle(i) : `Élément #${i + 1}`}
                </h4>
                {!readOnly && i >= minCards && (
                  <button
                    type="button"
                    className="discours-subcard__remove"
                    onClick={() => removeCard(i)}
                    aria-label={`Supprimer ${field.cardTitle ? field.cardTitle(i) : `l'élément #${i + 1}`}`}
                  >
                    ×
                  </button>
                )}
              </div>
              {(field.subFields ?? []).map((sub) => (
                <SubFieldEditor
                  key={sub.key}
                  id={`${labelId}-${i}-${sub.key}`}
                  sub={sub}
                  value={card[sub.key] ?? ''}
                  readOnly={readOnly}
                  onChange={(v) => updateCard(i, sub.key, v)}
                />
              ))}
            </div>
          ))}
          {!readOnly && cards.length < maxCards && (
            <div className="discours-subcards--add-row">
              <button type="button" className="discours-subcards__add" onClick={addCard}>
                {field.addLabel ?? '+ Ajouter un cartouche'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Liste de puces (kind: 'list') ─────────────────────────────────────────
  if (field.kind === 'list') {
    const items: string[] = Array.isArray(value) ? (value as string[]) : []
    const max = field.max ?? 10
    const rows = Math.max(items.length, 1)
    return (
      <div className="discours-field">
        <label htmlFor={labelId} className="discours-field__label">
          {field.label}
          {field.optional && <span className="discours-field__optional">— optionnel</span>}
        </label>
        {aide}
        <ul className="discours-list">
          {Array.from({ length: rows }).map((_, i) => {
            const v = items[i] ?? ''
            return (
              <li key={i} className="discours-list__item">
                <AutoTextarea
                  id={i === 0 ? labelId : `${labelId}-${i}`}
                  value={v}
                  readOnly={readOnly}
                  placeholder={`Élément ${i + 1}`}
                  onChange={(nextValue) => {
                    const next = [...items]
                    next[i] = nextValue
                    while (next.length && !next[next.length - 1]) next.pop()
                    onChange(next)
                  }}
                />
                {!readOnly && items[i] != null && items[i] !== '' && (
                  <button
                    type="button"
                    className="discours-list__btn"
                    onClick={() => onChange(items.filter((_, j) => j !== i))}
                    aria-label="Supprimer cet élément"
                  >
                    ×
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        {!readOnly && items.length < max && (
          <button
            type="button"
            className="discours-list__add"
            onClick={() => onChange([...items, ''])}
          >
            + Ajouter un élément
          </button>
        )}
      </div>
    )
  }

  // ── Champs simples (text / long) ──────────────────────────────────────────
  const text = typeof value === 'string' ? value : ''
  return (
    <div className="discours-field">
      <label htmlFor={labelId} className="discours-field__label">
        {field.label}
        {field.optional && <span className="discours-field__optional">— optionnel</span>}
      </label>
      {aide}
      <AutoTextarea
        id={labelId}
        value={text}
        readOnly={readOnly}
        onChange={(v) => onChange(v ? v : null)}
      />
    </div>
  )
}

// ─── Sous-champ d'un cartouche (text / long) avec AutoTextarea ───────────────
function SubFieldEditor({
  id,
  sub,
  value,
  readOnly,
  onChange,
}: {
  id: string
  sub: DiscoursSubField
  value: string
  readOnly: boolean
  onChange: (v: string) => void
}) {
  return (
    <div className="discours-field">
      <label htmlFor={id} className="discours-field__label">{sub.label}</label>
      {sub.aide && <span className="discours-field__aide">{sub.aide}</span>}
      <AutoTextarea id={id} value={value} readOnly={readOnly} onChange={onChange} />
    </div>
  )
}

// ─── Textarea qui s'adapte à la hauteur du contenu ───────────────────────────
function AutoTextarea({
  id,
  value,
  readOnly,
  placeholder,
  onChange,
}: {
  id?: string
  value: string
  readOnly?: boolean
  placeholder?: string
  onChange: (v: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Recalcule la hauteur à chaque changement de valeur et au premier rendu.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  // Sécurité : recalcule si la fenêtre est redimensionnée (retour à la ligne).
  useEffect(() => {
    const onResize = () => {
      const el = ref.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <textarea
      id={id}
      ref={ref}
      value={value}
      readOnly={readOnly}
      placeholder={placeholder}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

// ───────────────────────── Helpers ───────────────────────────────────────────
function mergeWithModel(raw: unknown): DiscoursBlocsPayload {
  const base = emptyBlocsPayload()
  if (!raw || typeof raw !== 'object') return base
  const stored = raw as Record<string, Record<string, unknown>>
  for (const bloc of PERFORMATIVE_BLOCS) {
    const storedBloc = stored[bloc.key]
    if (!storedBloc || typeof storedBloc !== 'object') continue
    for (const field of bloc.fields) {
      const v = storedBloc[field.key]
      if (field.kind === 'list') {
        base[bloc.key][field.key] = Array.isArray(v)
          ? v.filter((x): x is string => typeof x === 'string')
          : []
      } else if (field.kind === 'cards') {
        const minCards = field.minCards ?? 1
        const maxCards = field.maxCards ?? 5
        const subKeys = (field.subFields ?? []).map((s) => s.key)
        const normalized: Array<Record<string, string>> = []
        if (Array.isArray(v)) {
          for (const c of v) {
            if (c && typeof c === 'object' && !Array.isArray(c)) {
              const entry: Record<string, string> = {}
              for (const k of subKeys) {
                const val = (c as Record<string, unknown>)[k]
                entry[k] = typeof val === 'string' ? val : ''
              }
              normalized.push(entry)
            }
          }
        }
        while (normalized.length < minCards) normalized.push(emptyCard(field))
        if (normalized.length > maxCards) normalized.length = maxCards
        base[bloc.key][field.key] = normalized
      } else if (typeof v === 'string') {
        base[bloc.key][field.key] = v
      } else if (v == null) {
        base[bloc.key][field.key] = null
      }
    }
  }
  return base
}

function computeCompletion(blocs: DiscoursBlocsPayload): { filled: number; total: number; percent: number } {
  let filled = 0
  let total = 0
  for (const bloc of PERFORMATIVE_BLOCS) {
    for (const field of bloc.fields) {
      if (field.optional) continue
      const v = blocs[bloc.key]?.[field.key]
      if (field.kind === 'cards') {
        const minCards = field.minCards ?? 1
        const subKeys = (field.subFields ?? []).map((s) => s.key)
        total += minCards * subKeys.length
        const cards = Array.isArray(v) ? (v as Array<Record<string, string>>) : []
        for (let i = 0; i < minCards; i += 1) {
          const card = cards[i] ?? {}
          for (const k of subKeys) {
            if (typeof card[k] === 'string' && card[k].trim().length > 0) filled += 1
          }
        }
      } else if (field.kind === 'list') {
        total += 1
        if (Array.isArray(v) && v.some((s) => typeof s === 'string' && s.trim().length > 0)) {
          filled += 1
        }
      } else {
        total += 1
        if (typeof v === 'string' && v.trim().length > 0) filled += 1
      }
    }
  }
  const percent = total === 0 ? 0 : Math.round((filled / total) * 100)
  return { filled, total, percent }
}

function hasBlocWrittenContent(values: Record<string, DiscoursFieldValue>): boolean {
  return Object.values(values).some((value) => {
    if (typeof value === 'string') return value.trim().length > 0
    if (!Array.isArray(value)) return false
    return value.some((item) => {
      if (typeof item === 'string') return item.trim().length > 0
      if (!item || typeof item !== 'object') return false
      return Object.values(item).some((fieldValue) => fieldValue.trim().length > 0)
    })
  })
}

function computeBlocProgress(
  bloc: DiscoursBloc,
  values: Record<string, DiscoursFieldValue>,
): {
  filled: number
  total: number
  percent: number
  missingLabels: string[]
  nextMissingField: DiscoursField | null
} {
  let filled = 0
  let total = 0
  const missingLabels: string[] = []
  let nextMissingField: DiscoursField | null = null

  for (const field of bloc.fields) {
    if (field.optional) continue
    const value = values[field.key]
    if (field.kind === 'cards') {
      const minCards = field.minCards ?? 1
      const subFields = field.subFields ?? []
      const cards = Array.isArray(value) ? (value as Array<Record<string, string>>) : []
      total += minCards * subFields.length
      for (let i = 0; i < minCards; i += 1) {
        const card = cards[i] ?? {}
        for (const sub of subFields) {
          if (typeof card[sub.key] === 'string' && card[sub.key].trim().length > 0) {
            filled += 1
          } else {
            missingLabels.push(`${field.cardTitle ? field.cardTitle(i) : field.label} · ${sub.label}`)
            nextMissingField ??= field
          }
        }
      }
    } else if (field.kind === 'list') {
      total += 1
      if (Array.isArray(value) && value.some((item) => typeof item === 'string' && item.trim().length > 0)) {
        filled += 1
      } else {
        missingLabels.push(field.label)
        nextMissingField ??= field
      }
    } else {
      total += 1
      if (typeof value === 'string' && value.trim().length > 0) {
        filled += 1
      } else {
        missingLabels.push(field.label)
        nextMissingField ??= field
      }
    }
  }

  const percent = total === 0 ? 100 : Math.round((filled / total) * 100)
  return { filled, total, percent, missingLabels, nextMissingField }
}
