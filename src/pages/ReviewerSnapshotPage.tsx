import { useCallback, useEffect, useMemo, useState } from 'react'
import RoadmapTimelineGrid from '../RoadmapTimelineGrid'
import {
  createReviewFeedback,
  deleteReviewFeedback,
  getProjet,
  getReviewerRowForUser,
  getRoadmapSnapshotById,
  listRoadmapSnapshotItems,
  listReviewerFeedbacks,
  submitReviewerReview,
  updateReviewFeedback,
} from '../lib/api'
import type { RoadmapReviewFeedback, RoadmapSnapshotReviewer } from '../lib/api/roadmapReviews'
import { buildTimelineColumns } from '../lib/roadmapTimelineColumns'
import type { TimelineColumn } from '../lib/roadmapTimelineColumns'
import { assignRoadmapProjectColors } from '../lib/projectRoadmapColor'
import { buildChantiersAndJalonsFromSnapshotItems } from '../lib/reviewerSnapshotRoadmap'
import type { Axe, Chantier, Jalon } from '../lib/types'
import { AXES, AXE_META } from '../lib/axeMeta'
import { getCurrentUser, isPlatformSuperadmin } from '../lib/auth'
import '../MaturityRoadmap.css'

const REVIEWER_ROUTE_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function canEditFeedback(fb: RoadmapReviewFeedback, reviewerStatus: string | null): boolean {
  if (reviewerStatus === 'closed') return false
  if (fb.kind === 'reaction') {
    return !fb.reaction_acknowledged_at
  }
  return reviewerStatus === 'draft'
}

function canDeleteFeedback(reviewerStatus: string | null): boolean {
  return reviewerStatus === 'draft'
}

type EmptyStatePedagogiqueProps = {
  illustration: 'feedback' | 'list' | 'search'
  title: string
  hint: string
}

function EmptyStatePedagogique({ illustration, title, hint }: EmptyStatePedagogiqueProps) {
  const svgMap: Record<string, React.ReactNode> = {
    feedback: (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="8" y="12" width="48" height="36" rx="4" />
        <path d="M20 56 L24 48 L32 48" />
        <line x1="18" y1="24" x2="46" y2="24" strokeLinecap="round" />
        <line x1="18" y1="32" x2="38" y2="32" strokeLinecap="round" />
      </svg>
    ),
    list: (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="8" y="8" width="48" height="48" rx="4" />
        <line x1="18" y1="20" x2="46" y2="20" strokeLinecap="round" />
        <line x1="18" y1="32" x2="46" y2="32" strokeLinecap="round" />
        <line x1="18" y1="44" x2="36" y2="44" strokeLinecap="round" />
      </svg>
    ),
    search: (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="28" cy="28" r="16" />
        <line x1="40" y1="40" x2="54" y2="54" strokeLinecap="round" strokeWidth="3" />
      </svg>
    ),
  }
  return (
    <div className="empty-state-pedagogique">
      <div className="empty-state-pedagogique__illu" aria-hidden="true">
        {svgMap[illustration]}
      </div>
      <p className="empty-state-pedagogique__title">{title}</p>
      <p className="empty-state-pedagogique__hint">{hint}</p>
    </div>
  )
}

type Props = {
  snapshotId: string
  /** Super-admin : ouvrir la revue « comme » ce reviewer (`?reviewer=` dans l’URL). */
  observerReviewerUserId?: string | null
  onExit: () => void
}

type Selection =
  | { kind: 'chantier'; chantier: Chantier }
  | { kind: 'jalon'; chantier: Chantier; jalon: Jalon }

function deadlineUrgency(
  deadlineIso: string | null,
  now: number,
  snapshotStartIso: string | null | undefined,
): 'overdue' | 'green' | 'orange' | 'red' | 'none' {
  if (!deadlineIso) return 'none'
  const end = Date.parse(deadlineIso)
  if (!Number.isFinite(end)) return 'none'
  if (now > end) return 'overdue'

  const startTrim = snapshotStartIso?.trim() ?? ''
  if (!startTrim) return 'none'
  const start = Date.parse(startTrim)
  if (!Number.isFinite(start)) return 'none'
  const total = end - start
  if (total <= 0) return 'red'
  const ratio = (end - now) / total
  if (ratio >= 0.5) return 'green'
  if (ratio >= 0.3) return 'orange'
  return 'red'
}

export default function ReviewerSnapshotPage({
  snapshotId,
  observerReviewerUserId = null,
  onExit,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [frozenAt, setFrozenAt] = useState<string>('')
  const [deadline, setDeadline] = useState<string | null>(null)
  const [reviewerRow, setReviewerRow] = useState<RoadmapSnapshotReviewer | null>(null)
  const [reviewerUserId, setReviewerUserId] = useState<string | null>(null)
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [jalonsByChantier, setJalonsByChantier] = useState<Record<string, Jalon[]>>({})
  const [projetNomById, setProjetNomById] = useState<Record<string, string>>({})
  const [feedbacks, setFeedbacks] = useState<RoadmapReviewFeedback[]>([])
  const [selection, setSelection] = useState<Selection | null>(null)
  const [fbKind, setFbKind] = useState<'reaction' | 'decision'>('reaction')
  const [fbReactionText, setFbReactionText] = useState('')
  const [fbConstat, setFbConstat] = useState('')
  const [fbProposition, setFbProposition] = useState('')
  const [fbBenefice, setFbBenefice] = useState('')
  const [fbSaving, setFbSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [nowTs, setNowTs] = useState<number>(() => Date.now())
  const [propProjetId, setPropProjetId] = useState('')
  const [propAxe, setPropAxe] = useState<Axe>('PROCESSUS')
  const [propTitre, setPropTitre] = useState('')
  const [propConstat, setPropConstat] = useState('')
  const [propProposition, setPropProposition] = useState('')
  const [propBenefice, setPropBenefice] = useState('')
  const [propSaving, setPropSaving] = useState(false)
  const [editingFeedback, setEditingFeedback] = useState<RoadmapReviewFeedback | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  const timelineColumns = useMemo<TimelineColumn[]>(() => {
    const anchor = frozenAt ? new Date(frozenAt) : new Date()
    return buildTimelineColumns(anchor)
  }, [frozenAt])

  const projectColorById = useMemo(() => {
    const ids = [...new Set(chantiers.map((c) => c.projet_id).filter(Boolean))]
    return assignRoadmapProjectColors(ids)
  }, [chantiers])

  const [observerReadOnly, setObserverReadOnly] = useState(false)

  const reviewerStatus = reviewerRow?.status ?? null
  const reviewLocked = reviewerStatus === 'submitted' || reviewerStatus === 'closed'
  const editsDisabled = reviewLocked || observerReadOnly

  const urgency = useMemo(() => deadlineUrgency(deadline, nowTs, frozenAt || null), [deadline, nowTs, frozenAt])

  const feedbackCounts = useMemo(() => {
    let reactions = 0
    let decisions = 0
    let propositions = 0
    for (const f of feedbacks) {
      if (f.kind === 'reaction') reactions++
      else if (f.kind === 'decision') decisions++
      else if (f.kind === 'proposition_chantier') propositions++
    }
    return { reactions, decisions, propositions }
  }, [feedbacks])

  const reloadFeedbacks = useCallback(async () => {
    if (!reviewerUserId) return
    const rows = await listReviewerFeedbacks(snapshotId, reviewerUserId)
    setFeedbacks(rows)
  }, [snapshotId, reviewerUserId])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      setObserverReadOnly(false)
      try {
        const me = await getCurrentUser()
        if (!me) throw new Error('Utilisateur introuvable')
        const superAdmin = await isPlatformSuperadmin()
        let targetReviewerId = me.id
        const rawObserver = observerReviewerUserId?.trim() ?? ''
        if (rawObserver) {
          if (!REVIEWER_ROUTE_UUID_RE.test(rawObserver)) {
            throw new Error('Paramètre reviewer invalide.')
          }
          if (!superAdmin) {
            /* Ignore toute tentative de contournement par query string. */
          } else {
            targetReviewerId = rawObserver
          }
        }

        const [snapshot, snapItems, assignment] = await Promise.all([
          getRoadmapSnapshotById(snapshotId),
          listRoadmapSnapshotItems(snapshotId),
          getReviewerRowForUser(snapshotId, targetReviewerId),
        ])
        if (cancelled) return
        if (!snapshot) throw new Error('Snapshot introuvable')
        if (!assignment) {
          if (superAdmin) {
            throw new Error(
              'Aucune assignation reviewer pour ce compte sur ce snapshot. Utilisez le hub Review Roadmap ou un lien avec ?reviewer=.',
            )
          }
          throw new Error("Vous n'êtes pas invité sur cette revue.")
        }

        setObserverReadOnly(superAdmin && targetReviewerId !== me.id)

        const { chantiers: chs, jalonsByChantier: jb } = buildChantiersAndJalonsFromSnapshotItems(snapItems)
        const projetIds = [...new Set(chs.map((c) => c.projet_id).filter(Boolean))]
        const noms: Record<string, string> = {}
        await Promise.all(
          projetIds.map(async (pid) => {
            try {
              const p = await getProjet(pid)
              if (p?.nom) noms[pid] = p.nom
            } catch {
              /* ignore */
            }
          }),
        )

        setReviewerUserId(targetReviewerId)
        setReviewerRow(assignment)
        setLabel(snapshot.label)
        setFrozenAt(snapshot.frozen_at)
        setDeadline(snapshot.review_deadline ?? null)
        setChantiers(chs)
        setJalonsByChantier(jb)
        setProjetNomById(noms)

        const myFb = await listReviewerFeedbacks(snapshotId, targetReviewerId)
        if (!cancelled) setFeedbacks(myFb)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur chargement revue'
        if (!cancelled) setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [snapshotId, observerReviewerUserId])

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const openJalon = useCallback((jalon: Jalon, chantierId: string) => {
    const ch = chantiers.find((c) => c.id === chantierId)
    if (!ch) return
    setSelection({ kind: 'jalon', chantier: ch, jalon })
    setFbKind('reaction')
    setFbReactionText('')
    setFbConstat('')
    setFbProposition('')
    setFbBenefice('')
  }, [chantiers])

  const onChantierCellClick = useCallback(
    (chantierId: string | null) => {
      if (!chantierId) return
      const ch = chantiers.find((c) => c.id === chantierId)
      if (!ch) return
      setSelection({ kind: 'chantier', chantier: ch })
      setFbKind('reaction')
      setFbReactionText('')
      setFbConstat('')
      setFbProposition('')
      setFbBenefice('')
    },
    [chantiers],
  )

  async function handleSaveSidebarFeedback() {
    if (!reviewerUserId || !selection || editsDisabled) return
    setFbSaving(true)
    try {
      const targetType = selection.kind === 'jalon' ? 'jalon' : 'chantier'
      const targetId = selection.kind === 'jalon' ? selection.jalon.id : selection.chantier.id

      if (fbKind === 'reaction') {
        const text = fbReactionText.trim()
        if (!text) return
        await createReviewFeedback({
          snapshot_id: snapshotId,
          reviewer_user_id: reviewerUserId,
          kind: 'reaction',
          target_type: targetType,
          target_id: targetId,
          comment: text,
          constat: null,
          proposition: null,
          benefice: null,
          projet_pere_id: null,
          axe: null,
          titre_chantier: null,
          codir_status: 'pending',
          codir_motivation: null,
          parent_id: null,
        })
        setFbReactionText('')
      } else {
        const c = fbConstat.trim()
        const p = fbProposition.trim()
        const b = fbBenefice.trim()
        if (!c || !p || !b) return
        await createReviewFeedback({
          snapshot_id: snapshotId,
          reviewer_user_id: reviewerUserId,
          kind: 'decision',
          target_type: targetType,
          target_id: targetId,
          comment: null,
          constat: c,
          proposition: p,
          benefice: b,
          projet_pere_id: null,
          axe: null,
          titre_chantier: null,
          codir_status: 'pending',
          codir_motivation: null,
          parent_id: null,
        })
        setFbConstat('')
        setFbProposition('')
        setFbBenefice('')
      }
      await reloadFeedbacks()
    } finally {
      setFbSaving(false)
    }
  }

  function handleEditFeedback(fb: RoadmapReviewFeedback) {
    if (!canEditFeedback(fb, reviewerStatus)) return
    setEditingFeedback(fb)
    setFbKind(fb.kind === 'proposition_chantier' ? 'reaction' : fb.kind)
    if (fb.kind === 'reaction') {
      setFbReactionText(fb.comment ?? '')
    } else {
      setFbConstat(fb.constat ?? '')
      setFbProposition(fb.proposition ?? '')
      setFbBenefice(fb.benefice ?? '')
    }
    if (fb.target_id) {
      const ch = chantiers.find((c) => c.id === fb.target_id)
      if (ch) {
        setSelection({ kind: 'chantier', chantier: ch })
      } else {
        for (const [cId, jalons] of Object.entries(jalonsByChantier)) {
          const j = jalons.find((jl) => jl.id === fb.target_id)
          if (j) {
            const parentCh = chantiers.find((c) => c.id === cId)
            if (parentCh) setSelection({ kind: 'jalon', chantier: parentCh, jalon: j })
            break
          }
        }
      }
    }
  }

  function cancelEdit() {
    setEditingFeedback(null)
    setFbReactionText('')
    setFbConstat('')
    setFbProposition('')
    setFbBenefice('')
  }

  async function handleUpdateFeedback() {
    if (!editingFeedback) return
    setFbSaving(true)
    try {
      const updates =
        editingFeedback.kind === 'reaction'
          ? { comment: fbReactionText.trim() || null }
          : {
              constat: fbConstat.trim() || null,
              proposition: fbProposition.trim() || null,
              benefice: fbBenefice.trim() || null,
            }
      await updateReviewFeedback(editingFeedback.id, updates)
      await reloadFeedbacks()
      cancelEdit()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur modification'
      alert(msg)
    } finally {
      setFbSaving(false)
    }
  }

  async function handleDeleteFeedback(fbId: string) {
    if (confirmingDeleteId !== fbId) {
      setConfirmingDeleteId(fbId)
      return
    }
    setFbSaving(true)
    try {
      await deleteReviewFeedback(fbId)
      await reloadFeedbacks()
      if (editingFeedback?.id === fbId) cancelEdit()
      setConfirmingDeleteId(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur suppression'
      alert(msg)
    } finally {
      setFbSaving(false)
    }
  }

  async function handleSubmitPropositionChantier() {
    if (!reviewerUserId || editsDisabled) return
    const pid = propProjetId.trim()
    const titre = propTitre.trim()
    const c = propConstat.trim()
    const p = propProposition.trim()
    const b = propBenefice.trim()
    if (!pid || !titre || !c || !p || !b) return
    setPropSaving(true)
    try {
      await createReviewFeedback({
        snapshot_id: snapshotId,
        reviewer_user_id: reviewerUserId,
        kind: 'proposition_chantier',
        target_type: 'proposition',
        target_id: null,
        comment: null,
        constat: c,
        proposition: p,
        benefice: b,
        projet_pere_id: pid,
        axe: propAxe,
        titre_chantier: titre,
        codir_status: 'pending',
        codir_motivation: null,
        parent_id: null,
      })
      setPropTitre('')
      setPropConstat('')
      setPropProposition('')
      setPropBenefice('')
      await reloadFeedbacks()
    } finally {
      setPropSaving(false)
    }
  }

  async function confirmSubmitReview() {
    if (!reviewerUserId || observerReadOnly) return
    setSubmitting(true)
    try {
      await submitReviewerReview(snapshotId, reviewerUserId)
      const row = await getReviewerRowForUser(snapshotId, reviewerUserId)
      setReviewerRow(row)
      setSubmitModalOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const projetOptions = useMemo(() => {
    const ids = [...new Set(chantiers.map((c) => c.projet_id).filter(Boolean))]
    return ids.map((id) => ({ id, nom: projetNomById[id] ?? id }))
  }, [chantiers, projetNomById])

  if (loading) {
    return (
      <div className="mr-root">
        <p className="mr-muted">Chargement de la revue…</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="mr-root">
        <p className="mr-error">{error}</p>
        <button type="button" className="mr-back" onClick={onExit}>
          Retour
        </button>
      </div>
    )
  }

  const bandClass =
    urgency === 'overdue'
      ? 'reviewer-deadline--overdue'
      : urgency === 'green'
        ? 'reviewer-deadline--green'
        : urgency === 'orange'
          ? 'reviewer-deadline--orange'
          : urgency === 'red'
            ? 'reviewer-deadline--red'
            : 'reviewer-deadline--neutral'

  return (
    <section className="mr-root reviewer-page">
      <button type="button" className="mr-back" onClick={onExit}>
        ← Retour dashboard
      </button>
      <header className="reviewer-header">
        <h1 className="mr-title">REVUE ROADMAP · {label}</h1>
      </header>

      {observerReadOnly ? (
        <p
          className="mr-muted"
          style={{
            margin: '0 0 1rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--theme-border-subtle, rgba(0,0,0,.12))',
            background: 'var(--theme-bg-elevated, rgba(0,0,0,.03))',
            maxWidth: '52rem',
          }}
        >
          <strong>Super-admin :</strong> lecture de la revue telle que saisie par le reviewer désigné — pas
          d’édition ni de soumission à sa place (REF-7b.2 §6.4).
        </p>
      ) : null}

      <div className={`reviewer-deadline-band ${bandClass}`} role="status">
        <div>
          <strong>Deadline</strong>{' '}
          {deadline ? new Date(deadline).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) : 'non définie'}
        </div>
        <div className="reviewer-deadline-band__state">
          {urgency === 'overdue' ? 'En retard — la page reste consultable' : null}
          {urgency === 'green' ? 'Temps restant confortable' : null}
          {urgency === 'orange' ? 'Moins de la moitié du temps restant' : null}
          {urgency === 'red' ? 'Moins de 30 % du temps restant' : null}
          {urgency === 'none' && deadline ? null : null}
{urgency === 'none' && !deadline ? 'Aucune échéance renseignée' : null}
        </div>
        <button
          type="button"
          className="mr-btn-primary"
          disabled={editsDisabled || submitting}
          onClick={() => setSubmitModalOpen(true)}
        >
          {reviewLocked ? 'Revue soumise' : observerReadOnly ? 'Lecture seule' : 'Soumettre ma review'}
        </button>
      </div>

      {reviewerRow?.submitted_at && reviewerStatus === 'draft' && (
        <div className="mr-review-banner mr-review-banner--info" role="status">
          <p className="mr-review-banner__title">Votre revue a été rouverte</p>
          <p className="mr-review-banner__multi">
            Le CODIR vous a permis de modifier vos feedbacks. Vous pouvez compléter ou corriger vos contributions.
          </p>
        </div>
      )}

      <div className="reviewer-layout">
        <div className="reviewer-layout__grid">
          <h2 className="reviewer-section-title">Roadmap figée (lecture seule)</h2>
          <p className="mr-muted" style={{ marginBottom: 12 }}>
            Cliquez un chantier ou un jalon pour commenter dans le panneau de droite.
          </p>
          <div className="mr-tgrid-wrap">
            <RoadmapTimelineGrid
              chantiers={chantiers}
              jalonsByChantier={jalonsByChantier}
              timelineColumns={timelineColumns}
              axeFilter="all"
              readOnly
              projectColorById={projectColorById}
              projetNomById={projetNomById}
              onOpenJalon={openJalon}
              onQuickAddInCell={() => {}}
              onChantierCellClick={onChantierCellClick}
              pci={null}
            />
          </div>
        </div>

        <aside className="reviewer-layout__sidebar" aria-label="Commentaires reviewer">
          <h2 className="reviewer-section-title">
            {observerReadOnly ? 'Commentaires du reviewer (lecture seule)' : 'Votre commentaire'}
          </h2>
          {!selection ? (
            <p className="mr-muted">Sélectionnez un chantier ou un jalon dans la grille.</p>
          ) : (
            <>
              <p className="reviewer-selection-context">
                {selection.kind === 'jalon' ? (
                  <>
                    Jalon <strong>{selection.jalon.nom || 'Sans titre'}</strong> — chantier{' '}
                    <strong>{selection.chantier.nom}</strong>
                  </>
                ) : (
                  <>
                    Chantier <strong>{selection.chantier.nom}</strong>
                  </>
                )}
              </p>
              <div className="reviewer-sidebar__scrollable">
              <div className="mr-field">
                <label htmlFor="fb-kind">Type</label>
                <select
                  id="fb-kind"
                  value={fbKind}
                  disabled={editsDisabled}
                  onChange={(e) => setFbKind(e.target.value as 'reaction' | 'decision')}
                >
                  <option value="reaction">Réaction</option>
                  <option value="decision">Demande de décision</option>
                </select>
              </div>
              {fbKind === 'reaction' ? (
                <div className="mr-field">
                  <label htmlFor="fb-react">Commentaire</label>
                  <textarea
                    id="fb-react"
                    value={fbReactionText}
                    disabled={editsDisabled}
                    onChange={(e) => setFbReactionText(e.target.value)}
                    rows={4}
                  />
                </div>
              ) : (
                <>
                  <div className="mr-field">
                    <label htmlFor="fb-constat">Constat</label>
                    <textarea
                      id="fb-constat"
                      value={fbConstat}
                      disabled={editsDisabled}
                      onChange={(e) => setFbConstat(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="mr-field">
                    <label htmlFor="fb-prop">Proposition</label>
                    <textarea
                      id="fb-prop"
                      value={fbProposition}
                      disabled={editsDisabled}
                      onChange={(e) => setFbProposition(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="mr-field">
                    <label htmlFor="fb-ben">Bénéfice anticipé</label>
                    <textarea
                      id="fb-ben"
                      value={fbBenefice}
                      disabled={editsDisabled}
                      onChange={(e) => setFbBenefice(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}
              {editingFeedback ? (
                <div className="reviewer-sidebar__actions">
                  <button
                    type="button"
                    className="mr-btn-primary"
                    disabled={fbSaving}
                    onClick={() => void handleUpdateFeedback()}
                  >
                    {fbSaving ? 'Enregistrement…' : 'Mettre à jour'}
                  </button>
                  <button type="button" className="mr-back" onClick={cancelEdit}>
                    Annuler
                  </button>
                  {canDeleteFeedback(reviewerStatus) && (
                    <button
                      type="button"
                      className="mr-btn-danger"
                      disabled={fbSaving}
                      onClick={() => void handleDeleteFeedback(editingFeedback.id)}
                    >
                      {confirmingDeleteId === editingFeedback.id ? 'Confirmer ?' : 'Supprimer'}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="mr-btn-primary"
                  disabled={editsDisabled || fbSaving}
                  onClick={() => void handleSaveSidebarFeedback()}
                >
                  {fbSaving ? 'Enregistrement…' : 'Enregistrer le feedback'}
                </button>
              )}
              </div>
            </>
          )}
        </aside>
      </div>

      <section className="reviewer-part3 mr-panel">
        <h2 className="reviewer-section-title">Proposer un nouveau chantier</h2>
        <p className="mr-muted">
          Pour décaler une échéance, utilisez un commentaire sur le chantier ou le jalon concerné.
        </p>
        <div className="reviewer-part3__form">
          <div className="mr-field">
            <label htmlFor="prop-projet">Projet transformant</label>
            <select
              id="prop-projet"
              value={propProjetId}
              disabled={editsDisabled}
              onChange={(e) => setPropProjetId(e.target.value)}
            >
              <option value="">— Choisir —</option>
              {projetOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="mr-field">
            <label htmlFor="prop-axe">Axe</label>
            <select
              id="prop-axe"
              value={propAxe}
              disabled={editsDisabled}
              onChange={(e) => setPropAxe(e.target.value as Axe)}
            >
              {AXES.map((a) => (
                <option key={a} value={a}>
                  {AXE_META[a].title}
                </option>
              ))}
            </select>
          </div>
          <div className="mr-field">
            <label htmlFor="prop-titre">Titre du chantier</label>
            <input
              id="prop-titre"
              value={propTitre}
              disabled={editsDisabled}
              onChange={(e) => setPropTitre(e.target.value)}
            />
          </div>
          <div className="mr-field">
            <label htmlFor="prop-c">Constat</label>
            <textarea
              id="prop-c"
              value={propConstat}
              disabled={editsDisabled}
              onChange={(e) => setPropConstat(e.target.value)}
              rows={2}
            />
          </div>
          <div className="mr-field">
            <label htmlFor="prop-p">Proposition</label>
            <textarea
              id="prop-p"
              value={propProposition}
              disabled={editsDisabled}
              onChange={(e) => setPropProposition(e.target.value)}
              rows={2}
            />
          </div>
          <div className="mr-field">
            <label htmlFor="prop-b">Bénéfice anticipé</label>
            <textarea
              id="prop-b"
              value={propBenefice}
              disabled={editsDisabled}
              onChange={(e) => setPropBenefice(e.target.value)}
              rows={2}
            />
          </div>
          <button
            type="button"
            className="mr-btn-primary"
            disabled={editsDisabled || propSaving}
            onClick={() => void handleSubmitPropositionChantier()}
          >
            {propSaving ? 'Envoi…' : 'Soumettre au CODIR'}
          </button>
        </div>

        <h3 style={{ marginTop: 20 }}>Vos propositions et feedbacks</h3>
        {feedbacks.length === 0 ? (
          <EmptyStatePedagogique
            illustration="feedback"
            title="Aucun feedback pour le moment"
            hint="Cliquez un chantier ou un jalon dans la grille pour commenter."
          />
        ) : (
          <ul className="reviewer-fb-list">
            {feedbacks.map((f) => {
            const preview =
              f.kind === 'reaction'
                ? f.comment
                : f.kind === 'proposition_chantier'
                  ? `${f.titre_chantier ?? 'Proposition'} — ${f.constat ?? ''}`
                  : [f.constat, f.proposition, f.benefice].filter(Boolean).join(' · ')
            const editable = canEditFeedback(f, reviewerStatus)
            return (
              <li
                key={f.id}
                className={editable ? 'reviewer-fb-item--editable' : ''}
                onClick={editable ? () => handleEditFeedback(f) : undefined}
                onKeyDown={editable ? (e) => e.key === 'Enter' && handleEditFeedback(f) : undefined}
                tabIndex={editable ? 0 : undefined}
                role={editable ? 'button' : undefined}
              >
                <span className="reviewer-fb-kind">{f.kind}</span>
                {f.kind === 'reaction' && f.reaction_acknowledged_at && (
                  <span className="reviewer-fb-ack" title="Lu par le CODIR">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </span>
                )}
                {f.codir_status && f.codir_status !== 'pending' && (
                  <div className="reviewer-fb-arbitrage">
                    <span className={`mr-review-status-badge mr-review-status-badge--${f.codir_status}`}>
                      {f.codir_status === 'ok'
                        ? 'Validé'
                        : f.codir_status === 'nok'
                          ? 'Refusé'
                          : f.codir_status === 'noted'
                            ? 'Noté'
                            : 'Sous condition'}
                    </span>
                    {f.codir_motivation && (
                      <p className="reviewer-fb-motivation">{f.codir_motivation}</p>
                    )}
                  </div>
                )}
                <div className="reviewer-fb-preview">{preview || '—'}</div>
              </li>
            )
          })}
          </ul>
        )}
      </section>

      {submitModalOpen ? (
        <div className="reviewer-modal-backdrop" role="presentation" onClick={() => setSubmitModalOpen(false)}>
          <div
            className="reviewer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-review-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="submit-review-title">Soumettre votre revue ?</h2>
            <p>
              Réactions : <strong>{feedbackCounts.reactions}</strong> · Demandes de décision :{' '}
              <strong>{feedbackCounts.decisions}</strong> · Propositions chantier :{' '}
              <strong>{feedbackCounts.propositions}</strong>
            </p>
            <p className="mr-muted">Le CODIR sera notifié. Vous ne pourrez plus ajouter de nouveaux feedbacks.</p>
            <div className="reviewer-modal__actions">
              <button type="button" className="mr-back" onClick={() => setSubmitModalOpen(false)}>
                Annuler
              </button>
              <button
                type="button"
                className="mr-btn-primary"
                disabled={submitting}
                onClick={() => void confirmSubmitReview()}
              >
                {submitting ? 'Envoi…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        .reviewer-page { max-width: 1400px; margin: 0 auto; padding-bottom: 48px; }
        .reviewer-section-title { font-size: 1.05rem; margin: 0 0 8px; }
        .reviewer-deadline-band {
          display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px;
          padding: 12px 16px; border-radius: var(--radius-md, 8px); margin: 16px 0 20px;
          border: 1px solid var(--theme-border-subtle, rgba(0,0,0,.12));
        }
        .reviewer-deadline-band__state { flex: 1; min-width: 200px; font-size: 0.9rem; }
        .reviewer-deadline--green { background: color-mix(in srgb, var(--theme-success, #166534) 12%, transparent); }
        .reviewer-deadline--orange { background: color-mix(in srgb, var(--theme-warning, #c2410c) 14%, transparent); }
        .reviewer-deadline--red { background: color-mix(in srgb, var(--theme-danger, #b91c1c) 14%, transparent); }
        .reviewer-deadline--overdue { background: color-mix(in srgb, var(--theme-fg-muted, #57534e) 16%, transparent); }
        .reviewer-deadline--neutral { background: var(--theme-bg-elevated, rgba(0,0,0,.03)); }
        .reviewer-layout {
          display: flex; gap: 20px; align-items: flex-start;
        }
        @media (max-width: 1024px) {
          .reviewer-layout { flex-direction: column; }
        }
        .reviewer-layout__grid { 
          flex: 1; min-width: 0;
        }
        .reviewer-layout__sidebar {
          position: sticky;
          top: 80px;
          flex-shrink: 0;
          width: 320px;
          max-height: calc(100vh - 100px);
          display: flex; flex-direction: column;
          padding: 16px; border-radius: var(--radius-md, 8px);
          border: 1px solid var(--theme-border-subtle, rgba(0,0,0,.12));
          background: var(--theme-bg-card, #fff);
          overflow: hidden;
        }
        .reviewer-layout__sidebar > h2 { flex-shrink: 0; }
        .reviewer-layout__sidebar > p { flex-shrink: 0; }
        .reviewer-sidebar__scrollable {
          flex: 1; overflow-y: auto; min-height: 0;
          display: flex; flex-direction: column; gap: 12px;
        }
        .reviewer-selection-context { font-size: 0.92rem; margin-bottom: 12px; }
        .reviewer-part3 { margin-top: 28px; }
        .reviewer-part3__form { display: grid; gap: 12px; max-width: 640px; }
        .reviewer-fb-list { list-style: none; padding: 0; margin: 12px 0 0; }
        .reviewer-fb-list li { padding: 10px 0; border-bottom: 1px solid var(--theme-border-subtle, rgba(0,0,0,.08)); }
        .reviewer-fb-kind { font-weight: 600; text-transform: uppercase; font-size: 0.75rem; }
        .reviewer-fb-codir { font-size: 0.85rem; }
        .reviewer-fb-preview { margin-top: 4px; font-size: 0.9rem; }
        .reviewer-modal-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1200;
          display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .reviewer-modal {
          background: var(--theme-bg-card, #fff); border-radius: var(--radius-md, 8px);
          max-width: 440px; width: 100%; padding: 20px 24px;
          border: 1px solid var(--theme-border-subtle, rgba(0,0,0,.12));
        }
        .reviewer-modal__actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
        .reviewer-sidebar__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .reviewer-fb-item--editable { cursor: pointer; }
        .reviewer-fb-item--editable:hover { background: var(--theme-bg-hover, rgba(0,0,0,.04)); }
        .reviewer-fb-item--editable:focus { outline: 2px solid var(--theme-focus-ring, #0066cc); outline-offset: 2px; }
        .mr-btn-danger {
          background: color-mix(in srgb, var(--theme-danger, #b91c1c) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--theme-danger, #b91c1c) 30%, transparent);
          color: var(--theme-danger, #b91c1c);
          padding: 8px 16px;
          border-radius: var(--ui-radius-sm, 6px);
          font-size: 0.875rem;
          cursor: pointer;
        }
        .mr-btn-danger:hover { background: color-mix(in srgb, var(--theme-danger, #b91c1c) 18%, transparent); }
        .reviewer-fb-ack {
          display: inline-flex;
          align-items: center;
          color: var(--theme-text-muted);
          margin-left: var(--space-xs, 6px);
          vertical-align: middle;
        }
        .reviewer-fb-arbitrage {
          margin-top: var(--space-xs, 6px);
        }
        .reviewer-fb-motivation {
          margin: var(--space-xs, 6px) 0 0;
          font-size: var(--text-sm);
          color: var(--theme-text-muted);
          font-style: italic;
        }
      `}</style>
    </section>
  )
}
