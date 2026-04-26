import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  analyzeDiscoursWithAI,
  freezeNewVersion,
  getOrCreateDiscoursForWorkspace,
  getWorkspace,
  getWorkspaceUsers,
  listVersionsForDiscourse,
  softDeleteDiscourseVersion,
  setDiscourseCurrentVersion,
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
type DiscoursViewMode = 'edit' | 'export'

/**
 * Peuvent éditer le discours : superadmin plateforme, consultant owner, admin
 * du workspace et le membre CODIR « dirigeant » désigné. Le pilote projet a
 * accès en lecture seule (il voit la vue décideur mais ne la modifie pas).
 */
const EDIT_ROLES: ReadonlyArray<AppUserRole> = ['consultant', 'admin']
const MIN_AI_ANALYSIS_CHARS = 400

const TOP_LEVEL_REQUIRED_FIELD_KEYS: ReadonlyArray<string> = PERFORMATIVE_BLOCS.flatMap((bloc) =>
  bloc.fields
    .filter((f) => !f.optional)
    .filter((f) => f.kind !== 'cards')
    .map((f) => `${bloc.key}.${f.key}`),
)

const TOP_LEVEL_REQUIRED_FIELD_COUNT = TOP_LEVEL_REQUIRED_FIELD_KEYS.length
const AI_GAP_FIELD_THRESHOLD = Math.max(2, Math.ceil(TOP_LEVEL_REQUIRED_FIELD_COUNT * 0.2))

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

function parseMajorMinorFromVersionLabel(
  versionLabel: string,
): { major: number; minor: number | null } | null {
  const v = versionLabel.replace(/^DELETED:/iu, '').trim()

  // Supporte :
  // - v1 / V2 -> { major, minor: null }
  // - 1.1 / 1.2 -> { major, minor }
  // - 2.0 -> { major, minor: 0 } (utilisé pour la “référence collective”)
  const mDot = /^(\d+)\.(\d+)$/iu.exec(v)
  if (mDot) {
    return { major: Number(mDot[1]), minor: Number(mDot[2]) }
  }

  const mV = /^v(\d+)$/iu.exec(v) ?? /^V(\d+)$/iu.exec(v)
  if (mV) {
    return { major: Number(mV[1]), minor: null }
  }

  return null
}

function inferMajor(versionLabel: string | null | undefined): number {
  if (!versionLabel) return 1
  const parsed = parseMajorMinorFromVersionLabel(versionLabel)
  if (!parsed) return 1
  return parsed.major
}

function formatVersionLabelForUi(versionLabel: string): string {
  const parsed = parseMajorMinorFromVersionLabel(versionLabel)
  if (!parsed) return versionLabel

  // Harmonisation : toujours “V{major}” et “V{major}.{minor}”
  if (parsed.minor == null) return `V${parsed.major}`
  if (parsed.minor === 0) return `V${parsed.major}`
  return `V${parsed.major}.${parsed.minor}`
}

function computeNextMinorVersionLabel(
  loadedVersions: TransformationDiscourseVersion[],
  major: number,
): string {
  const minors = loadedVersions
    .map((v) => parseMajorMinorFromVersionLabel(v.version_label))
    .filter((p): p is { major: number; minor: number } => Boolean(p && p.major === major && p.minor != null))
    .map((p) => p.minor)

  const maxMinor = minors.length ? Math.max(...minors) : 0
  const nextMinor = maxMinor + 1
  return `${major}.${nextMinor}`
}

type BlocWritingGuidance = {
  expectedOutput: string
  incompletePrompt: string
  completePrompt: string
  checks: string[]
}

const BLOC_WRITING_GUIDANCE: Record<string, BlocWritingGuidance> = {
  nous_reconnaitre: {
    expectedOutput: 'Installer un « nous » légitime avant de demander un mouvement.',
    incompletePrompt: 'Ancrez le bloc dans des acquis concrets, puis explicitez ce qui doit survivre à la transformation.',
    completePrompt: 'Relisez en vérifiant que la fierté reste lucide : ni autosatisfaction, ni rupture brutale avec l’histoire.',
    checks: [
      'Les acquis sont observables et spécifiques.',
      'Le lien entre passé utile et transformation future est explicite.',
      'Le texte parle au collectif avec un vrai sujet « nous ».',
    ],
  },
  nommer_la_bascule: {
    expectedOutput: 'Faire sentir que le statu quo coûte plus cher que l’effort.',
    incompletePrompt: 'Reliez chaque fait de contexte à un impact CODIR puis à un risque clair si rien ne change.',
    completePrompt: 'Relisez en cherchant la bascule : le lecteur doit comprendre pourquoi maintenant, sans dramatisation gratuite.',
    checks: [
      'Chaque changement part d’un fait, pas d’une opinion.',
      'Le risque du statu quo est plus net que la peur du changement.',
      'L’urgence reste juste, crédible et actionnable.',
    ],
  },
  futur_desirable: {
    expectedOutput: 'Donner envie d’entrer dans l’effort par un futur désirable et vérifiable.',
    incompletePrompt: 'Formulez le cap en une phrase, puis rendez-le tangible pour clients, équipes et entreprise.',
    completePrompt: 'Relisez en vérifiant que le futur promis se voit dans des preuves concrètes, pas seulement dans des intentions.',
    checks: [
      'L’ambition contient un verbe de mouvement.',
      'Le bénéfice est visible pour plusieurs parties prenantes.',
      'Les preuves de réussite permettraient de dire : « nous y sommes ».',
    ],
  },
  nouveaux_principes: {
    expectedOutput: 'Transformer le slogan en règles de décision et de comportement.',
    incompletePrompt: 'Pour chaque principe, précisez ce qu’il veut dire, ce qu’il change et ce qu’il exige du CODIR.',
    completePrompt: 'Relisez en retirant les principes trop abstraits : chacun doit pouvoir guider un arbitrage réel.',
    checks: [
      'Les principes sont formulés comme des règles d’action.',
      'Le changement par rapport à aujourd’hui est nommé.',
      'L’exigence dirigeante est explicite et assumée.',
    ],
  },
  concentrer_efforts: {
    expectedOutput: 'Transformer l’ambition en choix rares, lisibles et exécutables.',
    incompletePrompt: 'Gardez seulement les priorités qui concentrent l’énergie, puis nommez ce qu’il faut simplifier pour les rendre faisables.',
    completePrompt: 'Relisez en supprimant tout ce qui ressemble à une liste d’envies : une priorité doit créer un renoncement.',
    checks: [
      'Chaque priorité est un choix stratégique, pas un thème.',
      'Les simplifications retirent réellement de la friction.',
      'L’ensemble reste assez court pour orienter l’exécution.',
    ],
  },
  reconnaitre_epreuves: {
    expectedOutput: 'Autoriser la lucidité sans casser l’élan.',
    incompletePrompt: 'Nommez les risques externes, métiers, managériaux et humains, puis assumez ce que les dirigeants devront changer.',
    completePrompt: 'Relisez en vérifiant que les difficultés sont dicibles mais pas paralysantes.',
    checks: [
      'Les obstacles sont nommés sans euphémisme.',
      'La part de responsabilité dirigeante est présente.',
      'Les doutes ouvrent la discussion au lieu de fermer le débat.',
    ],
  },
  distribuer_roles: {
    expectedOutput: 'Faire du collectif un acteur réel de la transformation.',
    incompletePrompt: 'Clarifiez votre engagement, le contrat CODIR, les attentes envers les managers et l’espace ouvert à la contribution.',
    completePrompt: 'Relisez en vérifiant que chacun comprend ce qui dépend de lui et ce qui sera tenu par la gouvernance.',
    checks: [
      'Le dirigeant prend une part visible de l’engagement.',
      'Le non négociable et le discutable sont distingués.',
      'La contribution attendue n’est pas seulement descendante.',
    ],
  },
  sceller_engagement: {
    expectedOutput: 'Transformer la fin du discours en première action collective.',
    incompletePrompt: 'Concluez sur le sens de l’effort, les demandes à 30 jours, une date et un engagement personnel.',
    completePrompt: 'Relisez en vérifiant que la dernière partie donne envie d’agir dès la sortie du séminaire.',
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
  const [discourse, setDiscourse] = useState<TransformationDiscourse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState<TransformationDiscourseVersion | null>(null)
  const [versions, setVersions] = useState<TransformationDiscourseVersion[]>([])
  const [selectedExportVersionId, setSelectedExportVersionId] = useState<string | null>(null)
  const [pdfPrintedAtLabel, setPdfPrintedAtLabel] = useState<string | null>(null)
  const [freezeState, setFreezeState] = useState<'idle' | 'saving' | 'error'>('idle')
  const [freezeError, setFreezeError] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteState, setDeleteState] = useState<'idle' | 'saving' | 'error'>('idle')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteTargetVersionId, setDeleteTargetVersionId] = useState<string | null>(null)
  const [blocs, setBlocs] = useState<DiscoursBlocsPayload>(() => emptyBlocsPayload())
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [aiState, setAiState] = useState<AiState>('idle')
  const [aiError, setAiError] = useState<string | null>(null)
  const [scoreBaselineFingerprint, setScoreBaselineFingerprint] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<DiscoursViewMode>('edit')

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

      // Historique des versions enregistrées (pour le menu dropdown en mode export).
      if (discResult.discourse) {
        const loadedVersions = await listVersionsForDiscourse(discResult.discourse.id).catch(() => [] as TransformationDiscourseVersion[])

        const visibleAfterDelete = loadedVersions.filter(
          (v) => !v.version_label.trim().toUpperCase().startsWith('DELETED:'),
        )

        const parseMajorMinor = (versionLabel: string): { major: number; minor: number } => {
          const label = versionLabel.replace(/^DELETED:/iu, '').trim()
          const mDot = /^(\d+)\.(\d+)$/iu.exec(label)
          if (mDot) return { major: Number(mDot[1]), minor: Number(mDot[2]) }
          const mV = /^v(\d+)$/iu.exec(label) ?? /^V(\d+)$/iu.exec(label)
          if (mV) return { major: Number(mV[1]), minor: 0 }
          return { major: 0, minor: 0 }
        }

        const highestVisibleVersion = visibleAfterDelete.reduce<TransformationDiscourseVersion | null>(
          (best, v) => {
            if (!best) return v
            const pb = parseMajorMinor(best.version_label)
            const pv = parseMajorMinor(v.version_label)
            if (pv.major !== pb.major) return pv.major > pb.major ? v : best
            return pv.minor > pb.minor ? v : best
          },
          null,
        )

        const currentFromDb = discResult.currentVersion
        const currentIsDeleted = Boolean(currentFromDb?.version_label?.startsWith?.('DELETED:'))
        const useCurrent = currentFromDb && !currentIsDeleted ? currentFromDb : highestVisibleVersion

        setVersions(loadedVersions)
        setSelectedExportVersionId(useCurrent?.id ?? null)
        setVersion(useCurrent ?? null)
        const payload = mergeWithModel(useCurrent?.blocs ?? null)
        const payloadFingerprint = JSON.stringify(payload)
        setBlocs(payload)
        lastSavedRef.current = payloadFingerprint
        setScoreBaselineFingerprint(
          useCurrent?.score_snapshot ? useCurrent.score_snapshot.blocs_fingerprint ?? payloadFingerprint : null,
        )
      } else {
        setVersions([])
        setSelectedExportVersionId(null)
        setVersion(null)
        setBlocs(emptyBlocsPayload())
        lastSavedRef.current = JSON.stringify(emptyBlocsPayload())
        setScoreBaselineFingerprint(null)
      }
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

  const selectedExportVersion = useMemo(
    () => versions.find((v) => v.id === selectedExportVersionId) ?? null,
    [versions, selectedExportVersionId],
  )

  const visibleVersions = useMemo(
    () => versions.filter((v) => !v.version_label.trim().toUpperCase().startsWith('DELETED:')),
    [versions],
  )

  const highestVisibleVersion = useMemo(() => {
    if (visibleVersions.length === 0) return null
    return visibleVersions.reduce((best, v) => {
      const pb = parseMajorMinorFromVersionLabel(best.version_label)
      const pv = parseMajorMinorFromVersionLabel(v.version_label)
      const bbMajor = pb?.major ?? 0
      const vbMajor = pv?.major ?? 0
      if (vbMajor !== bbMajor) return vbMajor > bbMajor ? v : best
      const bbMinor = pb?.minor ?? 0
      const vbMinor = pv?.minor ?? 0
      return vbMinor > bbMinor ? v : best
    })
  }, [visibleVersions])

  const selectedVisibleExportVersion = useMemo(() => {
    if (!selectedExportVersion) {
      return highestVisibleVersion
    }
    if (selectedExportVersion.version_label.trim().toUpperCase().startsWith('DELETED:')) {
      return highestVisibleVersion
    }
    return selectedExportVersion
  }, [selectedExportVersion, highestVisibleVersion])

  const exportBlocs = useMemo(() => {
    if (selectedVisibleExportVersion?.blocs) return mergeWithModel(selectedVisibleExportVersion.blocs)
    return blocs
  }, [selectedVisibleExportVersion, blocs])

  const freezeSourceVersion = useMemo(() => {
    // En “Lecture / Export”, on veut figer/enregistrer à partir de la version sélectionnée
    // dans le dropdown (sinon on risque d’enregistrer sous le mauvais major).
    if (selectedVisibleExportVersion) return selectedVisibleExportVersion
    if (version) return version

    // Cas “aucune version visible” : on autorise quand même l’enregistrement en
    // créant une “source locale” à partir du contenu courant (seed de dev inclus).
    if (!discourse) return null
    return {
      id: 'local-source',
      discourse_id: discourse.id,
      version_label: 'v1',
      blocs,
      score_snapshot: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies TransformationDiscourseVersion
  }, [selectedVisibleExportVersion, version, discourse, blocs])

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

  const flushPendingSave = useCallback(async () => {
    if (!canEdit || !version) return
    if (saveState !== 'dirty') return
    if (JSON.stringify(blocs) === lastSavedRef.current) return
    await persist(blocs)
  }, [canEdit, version, saveState, blocs, persist])

  const handleFreezeVersion = useCallback(async () => {
    if (!discourse || !freezeSourceVersion) return
    if (!canEdit) return
    if (freezeState === 'saving') return

    setFreezeError(null)
    try {
      await flushPendingSave()
      setFreezeState('saving')

      const major = inferMajor(freezeSourceVersion.version_label)
      const visibleMajor1Exists = visibleVersions.some(
        (v) => parseMajorMinorFromVersionLabel(v.version_label)?.major === 1,
      )
      const nextLabel = !visibleMajor1Exists
        ? 'v1'
        : computeNextMinorVersionLabel(visibleVersions, major)
      const newVersion = await freezeNewVersion(discourse.id, freezeSourceVersion, nextLabel)

      // Rafraîchissement local : on bascule sur la nouvelle version courante pour cohérence d'édition.
      const updatedVersionsFromDb = await listVersionsForDiscourse(discourse.id).catch(() => [])
      // Important : même si la liste renvoyée est vide (RLS), on sait que `newVersion` existe
      // puisqu'on l’a récupérée via `freezeNewVersion()` (insert + returning).
      const mergedVersions = [newVersion, ...updatedVersionsFromDb.filter((v) => v.id !== newVersion.id)]
      setVersions(mergedVersions)
      setSelectedExportVersionId(newVersion.id)
      setVersion(newVersion)
      setBlocs(mergeWithModel(newVersion.blocs ?? null))
      const baselineFingerprint =
        newVersion.score_snapshot?.blocs_fingerprint ?? JSON.stringify(mergeWithModel(newVersion.blocs ?? null))
      setScoreBaselineFingerprint(baselineFingerprint)
      setSaveState('saved')
      setFreezeState('idle')
    } catch (e) {
      console.error('[DiscoursTransformation] freeze failed', e)
      setFreezeState('error')
      setFreezeError("Impossible d'enregistrer la version pour le moment.")
    }
  }, [
    discourse,
    freezeSourceVersion,
    canEdit,
    freezeState,
    flushPendingSave,
    visibleVersions,
  ])

  const handleFreezeV2AfterEchangesCodir = useCallback(async () => {
    if (!discourse || !freezeSourceVersion) return
    if (!canEdit) return
    if (freezeState === 'saving') return

    setFreezeError(null)
    try {
      await flushPendingSave()
      setFreezeState('saving')

      // Référence collective V2 : on code la version sous la forme “2.0” (major=2, minor=0),
      // et on l’affiche en “V2” côté UI.
      const targetLabel = '2.0'

      const alreadyExists = visibleVersions.some((v) => v.version_label.trim() === targetLabel)
      if (alreadyExists) {
        // Basculer quand même sur la version existante pour garantir l’effet “nouvelle référence”.
        const existing = visibleVersions.find((v) => v.version_label.trim() === targetLabel)
        if (existing) {
          setSelectedExportVersionId(existing.id)
          setVersion(existing)
          setBlocs(mergeWithModel(existing.blocs ?? null))
          setSaveState('idle')
          setFreezeState('idle')
          return
        }
      }

      const newVersion = await freezeNewVersion(discourse.id, freezeSourceVersion, targetLabel)
      const updatedVersionsFromDb = await listVersionsForDiscourse(discourse.id).catch(() => [])
      const mergedVersions = [newVersion, ...updatedVersionsFromDb.filter((v) => v.id !== newVersion.id)]
      setVersions(mergedVersions)
      setSelectedExportVersionId(newVersion.id)
      setVersion(newVersion)
      setBlocs(mergeWithModel(newVersion.blocs ?? null))
      const baselineFingerprint =
        newVersion.score_snapshot?.blocs_fingerprint ?? JSON.stringify(mergeWithModel(newVersion.blocs ?? null))
      setScoreBaselineFingerprint(baselineFingerprint)
      setSaveState('saved')
      setFreezeState('idle')
    } catch (e) {
      console.error('[DiscoursTransformation] freeze V2 failed', e)
      setFreezeState('error')
      setFreezeError("Impossible de figer la V2 pour le moment.")
    }
  }, [discourse, freezeSourceVersion, canEdit, freezeState, flushPendingSave, visibleVersions])

  const formatDateForPdf = useCallback((d: Date) => {
    // Date lisible, alignée FR et sans dépendre du format local navigateur.
    try {
      return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'long' }).format(d)
    } catch {
      return d.toLocaleDateString('fr-FR')
    }
  }, [])

  const handlePrintPdf = useCallback(() => {
    const dateLabel = formatDateForPdf(new Date())
    setPdfPrintedAtLabel(dateLabel)
    document.body.classList.add('discours-printing')

    // Attente d'une frame pour que React mette à jour l'en-tête imprimable avant l'ouverture du dialogue.
    window.setTimeout(() => {
      window.print()
      window.setTimeout(() => document.body.classList.remove('discours-printing'), 200)
    }, 80)
  }, [formatDateForPdf])

  const handleConfirmDeleteVersion = useCallback(async () => {
    if (!discourse || !deleteTargetVersionId) return
    if (!canEdit) return
    if (deleteState === 'saving') return

    const versionRow = versions.find((v) => v.id === deleteTargetVersionId) ?? null
    if (!versionRow) return

    setDeleteError(null)
    setDeleteState('saving')
    try {
      await softDeleteDiscourseVersion(deleteTargetVersionId, versionRow.version_label)

      const updatedVersions = await listVersionsForDiscourse(discourse.id)
      setVersions(updatedVersions)

      const visibleAfterDelete = updatedVersions.filter(
        (v) => !v.version_label.trim().toUpperCase().startsWith('DELETED:'),
      )

      if (visibleAfterDelete.length === 0) {
        setSelectedExportVersionId(null)
        setVersion(null)
        setBlocs(emptyBlocsPayload())
        lastSavedRef.current = JSON.stringify(emptyBlocsPayload())
        setDeleteConfirmOpen(false)
        setDeleteState('idle')
        return
      }

      // Cohérence demandée : en “édition”, on repasse sur la version la plus élevée
      // encore existante (major puis minor). Exemple : si V2 existe, elle prime.
      const bestVisible = visibleAfterDelete.reduce((best, v) => {
        const pb = parseMajorMinorFromVersionLabel(best.version_label)
        const pv = parseMajorMinorFromVersionLabel(v.version_label)
        const bbMajor = pb?.major ?? 0
        const vbMajor = pv?.major ?? 0
        if (vbMajor !== bbMajor) return pv && vbMajor > bbMajor ? v : best
        const bbMinor = pb?.minor ?? 0
        const vbMinor = pv?.minor ?? 0
        return vbMinor >= bbMinor ? v : best
      })

      // Important : on met aussi à jour la version courante côté base pour que
      // le rechargement ne “revienne” pas sur une version DELETED.
      if (version?.id === deleteTargetVersionId) {
        await setDiscourseCurrentVersion(discourse.id, bestVisible.id)
      }

      setSelectedExportVersionId(bestVisible.id)
      setVersion(bestVisible)
      setBlocs(mergeWithModel(bestVisible.blocs ?? null))
      setSaveState('idle')
      setDeleteConfirmOpen(false)
      setDeleteState('idle')
    } catch (e) {
      console.error('[DiscoursTransformation] delete version failed', e)
      setDeleteState('error')
      setDeleteError("Impossible de supprimer la version pour le moment.")
    }
  }, [
    discourse,
    deleteTargetVersionId,
    versions,
    canEdit,
    deleteState,
    version,
  ])

  const selectedExportVersionDisplayLabel = useMemo(() => {
    if (!selectedVisibleExportVersion?.version_label) return '—'
    return formatVersionLabelForUi(selectedVisibleExportVersion.version_label)
  }, [selectedVisibleExportVersion])

  const deleteTargetVersion = useMemo(() => {
    if (!deleteTargetVersionId) return null
    return versions.find((v) => v.id === deleteTargetVersionId) ?? null
  }, [versions, deleteTargetVersionId])

  const deleteTargetVersionDisplayLabel = useMemo(() => {
    if (!deleteTargetVersion?.version_label) return '—'
    return formatVersionLabelForUi(deleteTargetVersion.version_label)
  }, [deleteTargetVersion])

  const currentVersionMajor = useMemo(() => inferMajor(version?.version_label ?? null), [version?.version_label])
  const canFreezeV2 = canEdit && currentVersionMajor < 2
  const v2AlreadyExists = visibleVersions.some(
    (v) => parseMajorMinorFromVersionLabel(v.version_label)?.major === 2 && parseMajorMinorFromVersionLabel(v.version_label)?.minor === 0,
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
  const currentWrittenMetrics = useMemo(() => computeWrittenMetrics(blocs), [blocs])
  const currentTopLevelWrittenMetrics = useMemo(() => computeTopLevelWrittenMetrics(blocs), [blocs])
  const savedSnapshot = version?.score_snapshot ?? null
  const savedSnapshotFingerprint = savedSnapshot?.blocs_fingerprint ?? scoreBaselineFingerprint
  const savedSnapshotIsStale =
    Boolean(savedSnapshot) &&
    Boolean(savedSnapshotFingerprint) &&
    savedSnapshotFingerprint !== currentBlocsFingerprint

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
      const snap = {
        ...rawSnap,
        blocs_fingerprint: currentBlocsFingerprint,
        ...currentWrittenMetrics,
        ...currentTopLevelWrittenMetrics,
      }
      const updated = await updateVersionScore(version.id, snap)
      setVersion(updated)
      setScoreBaselineFingerprint(currentBlocsFingerprint)
      setAiState('idle')
    } catch (e) {
      console.error('[DiscoursTransformation] analyse IA', e)
      setAiError(e instanceof Error ? e.message : 'Analyse IA impossible.')
      setAiState('error')
    }
  }, [
    workspaceId,
    version,
    canEdit,
    flatForDiag,
    usefulCharCount,
    blocs,
    currentBlocsFingerprint,
    currentWrittenMetrics,
    currentTopLevelWrittenMetrics,
  ])

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
            <div className="discours-header-actions">
              {viewMode === 'edit' && <SaveBadge state={saveState} readOnly={!canEdit} />}
              <DiscoursViewToggle mode={viewMode} onModeChange={setViewMode} />
            </div>
          </div>

          {viewMode === 'edit' && (
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
          )}

          {error && (
            <div role="alert" className="discours-error-banner">
              {error}
            </div>
          )}
        </header>

        {viewMode === 'edit' && (
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
        )}

        {viewMode === 'edit' && (
          <DiscoursDiagnosticPanel
            hidden={loading}
            canEdit={canEdit}
            hasVersion={Boolean(version?.id)}
            hasWorkspace={Boolean(workspaceId)}
            ruleSnapshot={ruleSnapshot}
            savedSnapshot={savedSnapshot}
            savedSnapshotIsStale={savedSnapshotIsStale}
            currentTopLevelWrittenMetrics={currentTopLevelWrittenMetrics}
            jargonHits={jargonHits}
            abstractHits={abstractHits}
            usefulCharCount={usefulCharCount}
            aiState={aiState}
            aiError={aiError}
            onRunAi={() => {
              void runAiAndSave()
            }}
          />
        )}

        {loading ? (
          <p>Chargement…</p>
        ) : viewMode === 'edit' ? (
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
        ) : (
          <div className="discours-print-scope">
            <div className="discours-export-controls discours-no-print" aria-label="Actions d'export et impression">
              <div className="discours-export-controls__left">
                <label className="discours-export-version-label" htmlFor="discours-version-select">
                  Version enregistrée
                </label>
                <select
                  id="discours-version-select"
                  className="discours-export-version-select"
                  value={selectedVisibleExportVersion?.id ?? ''}
                  onChange={(e) => setSelectedExportVersionId(e.target.value)}
                >
                  {visibleVersions.length === 0 ? (
                    <option value="" disabled>
                      Aucune version enregistrée
                    </option>
                  ) : (
                    visibleVersions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {formatVersionLabelForUi(v.version_label)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="discours-export-controls__right">
                {canEdit && (
                  <button
                    type="button"
                    className="discours-freeze-btn"
                    disabled={freezeState === 'saving'}
                    onClick={() => {
                      void handleFreezeVersion()
                    }}
                    title={
                      saveState === 'dirty'
                        ? "Enregistrement en attente : l’app va d’abord sauvegarder la version en cours."
                        : "Geler la version courante et l'ajouter à l'historique"
                    }
                  >
                    {freezeState === 'saving' ? 'Enregistrement…' : "Enregistrer la version"}
                  </button>
                )}

                {canEdit && (
                  <button
                    type="button"
                    className="discours-freeze-btn"
                    disabled={freezeState === 'saving' || !canFreezeV2 || v2AlreadyExists}
                    onClick={() => {
                      void handleFreezeV2AfterEchangesCodir()
                    }}
                    title={
                      !canFreezeV2
                        ? 'La référence collective V2 a déjà été atteinte.'
                        : v2AlreadyExists
                          ? 'La V2 existe déjà, vous pouvez passer dessus via le menu.'
                          : "Figer la V2 après échanges CODIR (devient la nouvelle référence collective)"
                    }
                  >
                    {freezeState === 'saving' ? 'Fermeture…' : 'Figer la V2 après échanges CODIR'}
                  </button>
                )}

                {canEdit && selectedVisibleExportVersion && (
                  <button
                    type="button"
                    className="discours-delete-btn"
                    disabled={deleteState === 'saving'}
                    onClick={() => {
                      setDeleteError(null)
                      setDeleteState('idle')
                      setDeleteTargetVersionId(selectedVisibleExportVersion.id)
                      setDeleteConfirmOpen(true)
                    }}
                    title="Supprimer la version actuellement lue (soft-delete récupérable)"
                  >
                    Supprimer la version
                  </button>
                )}

                <button
                  type="button"
                  className="discours-print-btn"
                  onClick={() => handlePrintPdf()}
                >
                  Imprimer PDF
                </button>
              </div>

              {freezeError && (
                <div className="discours-error-banner" role="alert" aria-live="polite">
                  {freezeError}
                </div>
              )}

              {deleteConfirmOpen && deleteTargetVersion && (
                <div
                  className="discours-version-delete-popin-backdrop discours-no-print"
                  onClick={() => setDeleteConfirmOpen(false)}
                  role="presentation"
                >
                  <div
                    className="discours-version-delete-popin"
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Confirmation de suppression version"
                  >
                    <h4>Supprimer la version {deleteTargetVersionDisplayLabel} ?</h4>
                    <p>
                      Cette action est un soft-delete récupérable : la version reste en base, mais elle est masquée de l’interface.
                      En cas de besoin, un retour arrière est possible.
                    </p>
                    {deleteError && (
                      <div className="discours-error-banner" role="alert" aria-live="polite">
                        {deleteError}
                      </div>
                    )}
                    <div className="discours-version-delete-popin-actions">
                      <button
                        type="button"
                        className="discours-delete-popin-cancel"
                        disabled={deleteState === 'saving'}
                        onClick={() => setDeleteConfirmOpen(false)}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        className="discours-delete-popin-confirm"
                        disabled={deleteState === 'saving'}
                        onClick={() => {
                          void handleConfirmDeleteVersion()
                        }}
                      >
                        {deleteState === 'saving' ? 'Suppression…' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="discours-print-only" aria-hidden={false}>
              <div className="discours-print-line">Discours de transformation</div>
              <div className="discours-print-line">
                Nom du dirigeant : {dirigeantDisplayName ?? (dirigeantUserId ? '(membre CODIR)' : '—')}
              </div>
              <div className="discours-print-line">
                Version du document enregistré : {selectedExportVersionDisplayLabel}
              </div>
              <div className="discours-print-line">
                Date d'impression PDF : {pdfPrintedAtLabel ?? '—'}
              </div>
            </div>

            <DiscoursExportView blocs={exportBlocs} />
          </div>
        )}
      </div>
    </section>
  )
}

function DiscoursViewToggle({
  mode,
  onModeChange,
}: {
  mode: DiscoursViewMode
  onModeChange: (m: DiscoursViewMode) => void
}) {
  const isExport = mode === 'export'
  return (
    <div className="discours-view-toggle" role="group" aria-label="Mode d’affichage du discours">
      <button
        type="button"
        className={`discours-view-toggle__btn ${!isExport ? 'discours-view-toggle__btn--active' : ''}`.trim()}
        aria-pressed={!isExport}
        onClick={() => onModeChange('edit')}
      >
        Édition
      </button>
      <button
        type="button"
        className={`discours-view-toggle__btn ${isExport ? 'discours-view-toggle__btn--active' : ''}`.trim()}
        aria-pressed={isExport}
        onClick={() => onModeChange('export')}
      >
        Lecture / Export
      </button>
    </div>
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

function normalizeNonEmptyText(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length ? t : null
}

type WrittenMetrics = {
  written_bloc_keys: string[]
  written_chars_by_bloc: Record<string, number>
  written_chars_total: number
}

type TopLevelWrittenMetrics = {
  written_top_level_field_keys: string[]
  written_top_level_chars_by_field: Record<string, number>
  written_top_level_chars_total: number
}

function flattenBlocUsefulChars(value: unknown): number {
  // Compte les "caractères utiles" (sans espaces) à partir des champs non vides d’un bloc.
  const parts: string[] = []
  const walk = (v: unknown): void => {
    if (v == null) return
    if (typeof v === 'string') {
      const t = v.trim()
      if (t.length) parts.push(t)
      return
    }
    if (Array.isArray(v)) {
      for (const item of v) walk(item)
      return
    }
    if (typeof v === 'object') {
      for (const s of Object.values(v as Record<string, unknown>)) walk(s)
    }
  }
  walk(value)
  const flat = parts.join('\n')
  return flat.replace(/\s/g, '').length
}

function computeWrittenMetrics(blocs: DiscoursBlocsPayload): WrittenMetrics {
  const written_bloc_keys: string[] = []
  const written_chars_by_bloc: Record<string, number> = {}
  let written_chars_total = 0

  for (const bloc of PERFORMATIVE_BLOCS) {
    const blocKey = bloc.key
    const chars = flattenBlocUsefulChars(blocs[blocKey])
    if (chars > 0) written_bloc_keys.push(blocKey)
    written_chars_by_bloc[blocKey] = chars
    written_chars_total += chars
  }

  return { written_bloc_keys, written_chars_by_bloc, written_chars_total }
}

function computeTopLevelWrittenMetrics(blocs: DiscoursBlocsPayload): TopLevelWrittenMetrics {
  const written_top_level_field_keys: string[] = []
  const written_top_level_chars_by_field: Record<string, number> = {}
  let written_top_level_chars_total = 0

  for (const bloc of PERFORMATIVE_BLOCS) {
    const blocKey = bloc.key
    for (const field of bloc.fields) {
      if (field.optional) continue
      if (field.kind === 'cards') continue // rec2: ignorer les sous-champs de cards

      const topKey = `${blocKey}.${field.key}`
      let chars = 0

      const raw = blocs[blocKey]?.[field.key]
      if (typeof raw === 'string') {
        const t = raw.trim()
        chars = t.length ? t.replace(/\s/g, '').length : 0
      } else if (field.kind === 'list' && Array.isArray(raw)) {
        const items = raw.filter((x): x is string => typeof x === 'string')
        chars = items.reduce((acc, it) => acc + it.trim().replace(/\s/g, '').length, 0)
      }

      written_top_level_chars_by_field[topKey] = chars
      if (chars > 0) written_top_level_field_keys.push(topKey)
      written_top_level_chars_total += chars
    }
  }

  return { written_top_level_field_keys, written_top_level_chars_by_field, written_top_level_chars_total }
}

function DiscoursExportView({ blocs }: { blocs: DiscoursBlocsPayload }) {
  const exportDisplayLabel = (label: string): string => {
    // En mode export, on allège certains accroches rédactionnelles (ex: "(maximum !)")
    // sans toucher au mode édition.
    return label.replace(/\s*\(maximum\s*!\s*\)\s*$/iu, '').trim()
  }

  return (
    <div className="discours-export-view" aria-label="Lecture du discours">
      <div className="discours-export-grid">
        {PERFORMATIVE_BLOCS.map((bloc) => {
          const blocValues = blocs[bloc.key] ?? {}

          const hasAny = bloc.fields.some((f) => {
            const fieldVal = (blocValues as Record<string, unknown>)[f.key]
            if (f.kind === 'list') {
              const items = Array.isArray(fieldVal) ? fieldVal : []
              return items.some((x) => typeof x === 'string' && x.trim().length > 0)
            }
            if (f.kind === 'cards') {
              const cards = Array.isArray(fieldVal) ? fieldVal : []
              const subFields = f.subFields ?? []
              return cards.some((c) => {
                if (!c || typeof c !== 'object' || Array.isArray(c)) return false
                return subFields.some((sf) => {
                  const sv = (c as Record<string, unknown>)[sf.key]
                  return typeof sv === 'string' && sv.trim().length > 0
                })
              })
            }
            return typeof fieldVal === 'string' && fieldVal.trim().length > 0
          })

          return (
            <section key={bloc.key} className="discours-export-bloc">
              <h3 className="discours-export-bloc__title">
                {bloc.order}. {bloc.title}
              </h3>
              <p className="discours-export-bloc__subtitle">{bloc.subtitle}</p>

              <div className="discours-export-bloc__content">
                {hasAny
                  ? bloc.fields.map((field) => {
                      const rawVal = (blocValues as Record<string, unknown>)[field.key]

                      if (field.kind === 'text' || field.kind === 'long') {
                        const t = normalizeNonEmptyText(rawVal)
                        if (!t) return null
                        return (
                          <div key={field.key} className="discours-export-field">
                        <div className="discours-export-field__label">{exportDisplayLabel(field.label)}</div>
                            <p className="discours-export-field__value">{t}</p>
                          </div>
                        )
                      }

                      if (field.kind === 'list') {
                        const items = Array.isArray(rawVal)
                          ? rawVal
                              .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
                              .map((x) => x.trim())
                          : []
                        if (!items.length) return null
                        return (
                          <div key={field.key} className="discours-export-field">
                            <div className="discours-export-field__label">{exportDisplayLabel(field.label)}</div>
                            <ul className="discours-export-list">
                              {items.map((it, i) => (
                                <li key={`${field.key}-${i}`} className="discours-export-list__item">
                                  {it}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      }

                      // field.kind === 'cards'
                      const cards = Array.isArray(rawVal) ? rawVal : []
                      const subFields = field.subFields ?? []
                      const titleSub =
                        subFields.find((sf) => sf.key === 'intitule') ??
                        subFields.find((sf) => /intitul(e|é) du principe/i.test(sf.label))
                      const titleSubKey = titleSub?.key ?? null
                      const meaningfulCards = cards
                        .filter((c) => Boolean(c && typeof c === 'object' && !Array.isArray(c)))
                        .filter((c) =>
                          subFields.some((sf) => {
                            const sv = (c as Record<string, unknown>)[sf.key]
                            return typeof sv === 'string' && sv.trim().length > 0
                          }),
                        ) as Array<Record<string, unknown>>

                      if (!meaningfulCards.length) return null

                      return (
                        <div key={field.key} className="discours-export-field">
                      <div className="discours-export-field__label">{exportDisplayLabel(field.label)}</div>
                          <div className="discours-export-cards">
                            {meaningfulCards.map((card, i) => {
                                const titleFromCard =
                                  titleSubKey ? normalizeNonEmptyText((card as Record<string, unknown>)[titleSubKey]) : null
                                const cardTitle =
                                  titleFromCard ??
                                  (field.cardTitle ? field.cardTitle(i) : `Élément #${i + 1}`)
                              return (
                                <div key={`${field.key}-card-${i}`} className="discours-export-card">
                                  <div className="discours-export-card__title">{cardTitle}</div>
                                  <div className="discours-export-card__body">
                                    {subFields.map((sf) => {
                                        if (titleSubKey && sf.key === titleSubKey) return null
                                      const sv = normalizeNonEmptyText((card as Record<string, unknown>)[sf.key])
                                      if (!sv) return null
                                      return (
                                        <div key={sf.key} className="discours-export-card-field">
                                          <div className="discours-export-card-field__label">{sf.label}</div>
                                          <div className="discours-export-card-field__value">{sv}</div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })
                  : null}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
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
  currentTopLevelWrittenMetrics,
  jargonHits,
  abstractHits,
  usefulCharCount,
  aiState,
  aiError,
  onRunAi,
}: {
  hidden: boolean
  canEdit: boolean
  hasVersion: boolean
  hasWorkspace: boolean
  ruleSnapshot: DiscoursScoreSnapshot
  savedSnapshot: DiscoursScoreSnapshot | null
  savedSnapshotIsStale: boolean
  currentTopLevelWrittenMetrics: TopLevelWrittenMetrics
  jargonHits: number
  abstractHits: ReadonlyArray<{ phrase: string; wordCount: number; reason: string }>
  usefulCharCount: number
  aiState: AiState
  aiError: string | null
  onRunAi: () => void
}) {
  const aiReady = usefulCharCount >= MIN_AI_ANALYSIS_CHARS
  const hasAiSnapshot = savedSnapshot?.source === 'ai' && !savedSnapshotIsStale
  const displayedSnapshot = savedSnapshotIsStale ? ruleSnapshot : savedSnapshot ?? ruleSnapshot
  const snapshotLabel = savedSnapshot
    ? savedSnapshotIsStale
      ? 'Aperçu local (après modifications)'
      : savedSnapshot.source === 'ai'
      ? 'Dernière analyse IA'
      : 'Dernier diagnostic local'
    : 'Aperçu local (non enregistré)'
  const snapshotDate = savedSnapshot?.computed_at
    ? new Date(savedSnapshot.computed_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    : null
  const aiDisabled =
    !hasVersion || !hasWorkspace || !canEdit || !aiReady || aiState === 'loading'

  // Référence : la dernière analyse IA enregistrée (même si le texte courant a changé => snapshot "stale").
  const lastAi = savedSnapshot?.source === 'ai' ? savedSnapshot : null

  const currentTopKeys = currentTopLevelWrittenMetrics.written_top_level_field_keys
  const currentTopTotalChars = currentTopLevelWrittenMetrics.written_top_level_chars_total
  const currentCharsByField = currentTopLevelWrittenMetrics.written_top_level_chars_by_field

  // Compatibilité : certains snapshots IA existants (avant cette feature)
  // n'ont pas encore les métriques top-level. On retombe sur les métriques
  // précédentes (written_chars_total) pour que l'UX reste cohérente.
  const lastTopKeys = lastAi?.written_top_level_field_keys ?? []
  const lastCharsByField = lastAi?.written_top_level_chars_by_field ?? {}
  const lastTopTotalChars = lastAi?.written_top_level_chars_total ?? lastAi?.written_chars_total ?? 0

  const haveTopMetrics = Boolean(lastAi?.written_top_level_field_keys?.length)
  const newFieldsCount = haveTopMetrics ? currentTopKeys.filter((k) => !lastTopKeys.includes(k)).length : 0

  const changedFieldsCount = haveTopMetrics
    ? currentTopKeys
        .filter((k) => lastTopKeys.includes(k))
        .filter((k) => {
          const prev = lastCharsByField[k] ?? 0
          const now = currentCharsByField[k] ?? 0
          if (prev <= 0) return false
          const delta = Math.abs(now - prev)
          const deltaRel = prev > 0 ? delta / prev : 0
          return delta >= 40 || deltaRel > 0.2
        }).length
    : 0

  const diffFields = haveTopMetrics ? newFieldsCount + changedFieldsCount : AI_GAP_FIELD_THRESHOLD
  const deltaRel =
    lastTopTotalChars > 0 ? Math.abs(currentTopTotalChars - lastTopTotalChars) / lastTopTotalChars : currentTopTotalChars > 0 ? 1 : 0
  const deltaCharsAbs = Math.abs(currentTopTotalChars - lastTopTotalChars)

  const isBigGap =
    diffFields >= AI_GAP_FIELD_THRESHOLD &&
    deltaRel > 0.2 &&
    (deltaCharsAbs >= 120 || currentTopTotalChars >= 300)

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
              {savedSnapshotIsStale
                ? 'Aperçu local'
                : savedSnapshot
                  ? savedSnapshot.source === 'ai'
                    ? 'Analyse IA'
                    : 'Diagnostic local'
                  : 'Aperçu local'}
            </span>
          </div>
          {displayedSnapshot.synthese && (
            <p className="discours-score-card__synthese">{displayedSnapshot.synthese}</p>
          )}
          <div className="discours-score-card__score">
            <strong>{displayedSnapshot.total}</strong>
            <span>/100</span>
          </div>
          <p className="discours-score-card__meta">
            Niveau {displayedSnapshot.niveau} · <strong>Score basé sur les parties déjà rédigées</strong> ·{' '}
            {snapshotDate ?? `${usefulCharCount} caractères utiles`}
          </p>
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

          <div className="discours-level-legend" aria-label="Interprétation des niveaux">
            <div className="discours-level-legend__line">
              <strong>Niveau 1</strong> : &lt; 45 — le discours est encore en construction
            </div>
            <div className="discours-level-legend__line">
              <strong>Niveau 2</strong> : 45–69 — le discours est solide et peut gagner en puissance
            </div>
            <div className="discours-level-legend__line">
              <strong>Niveau 3</strong> : ≥ 70 — le discours est fortement mobilisateur
            </div>
          </div>
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
      </div>
      {isBigGap && lastAi && (
        <div className="discours-gap-inline" role="status" aria-live="polite">
          <strong>Fort écart depuis la dernière IA.</strong> Relancer l’analyse IA est recommandé pour actualiser la lecture.
        </div>
      )}
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
    const subFields = field.subFields ?? []
    const titleSub =
      subFields.find((s) => s.key === 'intitule') ??
      subFields.find((s) => /intitul(e|é) du principe/i.test(s.label))
    const titleSubKey = titleSub?.key ?? null

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
                {titleSubKey ? (
                  <input
                    className="discours-subcard__titleInput"
                    type="text"
                    value={card[titleSubKey] ?? ''}
                    placeholder=""
                    readOnly={readOnly}
                    aria-label="Intitulé du principe"
                    onChange={(e) => updateCard(i, titleSubKey, e.target.value ? e.target.value : '')}
                  />
                ) : (
                  <h4 className="discours-subcard__title">
                    {field.cardTitle ? field.cardTitle(i) : `Élément #${i + 1}`}
                  </h4>
                )}
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
              {(field.subFields ?? [])
                .filter((sub) => sub.key !== titleSubKey)
                .map((sub) => (
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
