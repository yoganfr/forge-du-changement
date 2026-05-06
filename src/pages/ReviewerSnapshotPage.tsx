import { useCallback, useEffect, useMemo, useState } from 'react'
import RoadmapTimelineGrid from '../RoadmapTimelineGrid'
import {
  createReviewFeedback,
  getProjet,
  getReviewerRowForUser,
  getRoadmapSnapshotById,
  listRoadmapSnapshotItems,
  listReviewerFeedbacks,
  submitReviewerReview,
} from '../lib/api'
import type { RoadmapReviewFeedback, RoadmapSnapshotReviewer } from '../lib/api/roadmapReviews'
import { buildTimelineColumns } from '../lib/roadmapTimelineColumns'
import type { TimelineColumn } from '../lib/roadmapTimelineColumns'
import { assignRoadmapProjectColors } from '../lib/projectRoadmapColor'
import { buildChantiersAndJalonsFromSnapshotItems } from '../lib/reviewerSnapshotRoadmap'
import type { Axe, Chantier, Jalon } from '../lib/types'
import { getCurrentUser } from '../lib/auth'
import '../MaturityRoadmap.css'

type Props = {
  snapshotId: string
  onExit: () => void
}

type Selection =
  | { kind: 'chantier'; chantier: Chantier }
  | { kind: 'jalon'; chantier: Chantier; jalon: Jalon }

function deadlineUrgency(
  deadlineIso: string | null,
  now: number,
  snapshotStartIso: string,
): 'overdue' | 'green' | 'orange' | 'red' | 'none' {
  if (!deadlineIso) return 'none'
  const end = Date.parse(deadlineIso)
  const start = Date.parse(snapshotStartIso)
  if (!Number.isFinite(end) || !Number.isFinite(start)) return 'none'
  if (now > end) return 'overdue'
  const total = end - start
  if (total <= 0) return 'red'
  const ratio = (end - now) / total
  if (ratio >= 0.5) return 'green'
  if (ratio >= 0.3) return 'orange'
  return 'red'
}

const AXES: Axe[] = ['PROCESSUS', 'ORGANISATION', 'OUTILS', 'KPI']

export default function ReviewerSnapshotPage({ snapshotId, onExit }: Props) {
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

  const timelineColumns = useMemo<TimelineColumn[]>(() => {
    const anchor = frozenAt ? new Date(frozenAt) : new Date()
    return buildTimelineColumns(anchor)
  }, [frozenAt])

  const projectColorById = useMemo(() => {
    const ids = [...new Set(chantiers.map((c) => c.projet_id).filter(Boolean))]
    return assignRoadmapProjectColors(ids)
  }, [chantiers])

  const reviewerStatus = reviewerRow?.status ?? null
  const reviewLocked = reviewerStatus === 'submitted' || reviewerStatus === 'closed'

  const urgency = useMemo(
    () => deadlineUrgency(deadline, nowTs, frozenAt || new Date(0).toISOString()),
    [deadline, nowTs, frozenAt],
  )

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
      try {
        const me = await getCurrentUser()
        if (!me) throw new Error('Utilisateur introuvable')
        const [snapshot, snapItems, assignment] = await Promise.all([
          getRoadmapSnapshotById(snapshotId),
          listRoadmapSnapshotItems(snapshotId),
          getReviewerRowForUser(snapshotId, me.id),
        ])
        if (cancelled) return
        if (!snapshot) throw new Error('Snapshot introuvable')
        if (!assignment) throw new Error("Vous n'êtes pas invité sur cette revue.")

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

        setReviewerUserId(me.id)
        setReviewerRow(assignment)
        setLabel(snapshot.label)
        setFrozenAt(snapshot.frozen_at)
        setDeadline(snapshot.review_deadline ?? null)
        setChantiers(chs)
        setJalonsByChantier(jb)
        setProjetNomById(noms)

        const myFb = await listReviewerFeedbacks(snapshotId, me.id)
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
  }, [snapshotId])

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
    if (!reviewerUserId || !selection || reviewLocked) return
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

  async function handleSubmitPropositionChantier() {
    if (!reviewerUserId || reviewLocked) return
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
    if (!reviewerUserId) return
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
          disabled={reviewLocked || submitting}
          onClick={() => setSubmitModalOpen(true)}
        >
          {reviewLocked ? 'Revue soumise' : 'Soumettre ma review'}
        </button>
      </div>

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
          <h2 className="reviewer-section-title">Votre commentaire</h2>
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
              <div className="mr-field">
                <label htmlFor="fb-kind">Type</label>
                <select
                  id="fb-kind"
                  value={fbKind}
                  disabled={reviewLocked}
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
                    disabled={reviewLocked}
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
                      disabled={reviewLocked}
                      onChange={(e) => setFbConstat(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="mr-field">
                    <label htmlFor="fb-prop">Proposition</label>
                    <textarea
                      id="fb-prop"
                      value={fbProposition}
                      disabled={reviewLocked}
                      onChange={(e) => setFbProposition(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="mr-field">
                    <label htmlFor="fb-ben">Bénéfice anticipé</label>
                    <textarea
                      id="fb-ben"
                      value={fbBenefice}
                      disabled={reviewLocked}
                      onChange={(e) => setFbBenefice(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}
              <button
                type="button"
                className="mr-btn-primary"
                disabled={reviewLocked || fbSaving}
                onClick={() => void handleSaveSidebarFeedback()}
              >
                {fbSaving ? 'Enregistrement…' : 'Enregistrer le feedback'}
              </button>
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
              disabled={reviewLocked}
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
              disabled={reviewLocked}
              onChange={(e) => setPropAxe(e.target.value as Axe)}
            >
              {AXES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="mr-field">
            <label htmlFor="prop-titre">Titre du chantier</label>
            <input
              id="prop-titre"
              value={propTitre}
              disabled={reviewLocked}
              onChange={(e) => setPropTitre(e.target.value)}
            />
          </div>
          <div className="mr-field">
            <label htmlFor="prop-c">Constat</label>
            <textarea
              id="prop-c"
              value={propConstat}
              disabled={reviewLocked}
              onChange={(e) => setPropConstat(e.target.value)}
              rows={2}
            />
          </div>
          <div className="mr-field">
            <label htmlFor="prop-p">Proposition</label>
            <textarea
              id="prop-p"
              value={propProposition}
              disabled={reviewLocked}
              onChange={(e) => setPropProposition(e.target.value)}
              rows={2}
            />
          </div>
          <div className="mr-field">
            <label htmlFor="prop-b">Bénéfice anticipé</label>
            <textarea
              id="prop-b"
              value={propBenefice}
              disabled={reviewLocked}
              onChange={(e) => setPropBenefice(e.target.value)}
              rows={2}
            />
          </div>
          <button
            type="button"
            className="mr-btn-primary"
            disabled={reviewLocked || propSaving}
            onClick={() => void handleSubmitPropositionChantier()}
          >
            {propSaving ? 'Envoi…' : 'Soumettre au CODIR'}
          </button>
        </div>

        <h3 style={{ marginTop: 20 }}>Vos propositions et feedbacks</h3>
        <ul className="reviewer-fb-list">
          {feedbacks.length === 0 ? <li className="mr-muted">Aucun élément pour le moment.</li> : null}
          {feedbacks.map((f) => {
            const preview =
              f.kind === 'reaction'
                ? f.comment
                : f.kind === 'proposition_chantier'
                  ? `${f.titre_chantier ?? 'Proposition'} — ${f.constat ?? ''}`
                  : [f.constat, f.proposition, f.benefice].filter(Boolean).join(' · ')
            return (
              <li key={f.id}>
                <span className="reviewer-fb-kind">{f.kind}</span>
                {f.codir_status && f.codir_status !== 'pending' ? (
                  <span className="reviewer-fb-codir"> · CODIR : {f.codir_status}</span>
                ) : null}
                <div className="reviewer-fb-preview">{preview || '—'}</div>
              </li>
            )
          })}
        </ul>
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
          display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: start;
        }
        @media (max-width: 1024px) {
          .reviewer-layout { grid-template-columns: 1fr; }
        }
        .reviewer-layout__grid { min-width: 0; }
        .reviewer-layout__sidebar {
          position: sticky; top: 12px;
          padding: 16px; border-radius: var(--radius-md, 8px);
          border: 1px solid var(--theme-border-subtle, rgba(0,0,0,.12));
          background: var(--theme-bg-card, #fff);
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
      `}</style>
    </section>
  )
}
