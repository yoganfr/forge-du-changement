import { useEffect, useMemo, useState } from 'react'
import {
  createReviewFeedback,
  getRoadmapSnapshotById,
  listRoadmapSnapshotItems,
  listReviewerFeedbacks,
  submitReviewerReview,
} from '../lib/api'
import { getCurrentUser } from '../lib/auth'

type Props = {
  snapshotId: string
  onExit: () => void
}

type SnapshotItem = {
  kind: 'chantier' | 'jalon'
  source_id: string
  payload: Record<string, unknown>
}

export default function ReviewerSnapshotPage({ snapshotId, onExit }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [deadline, setDeadline] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('draft')
  const [items, setItems] = useState<SnapshotItem[]>([])
  const [reviewerUserId, setReviewerUserId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [kind, setKind] = useState<'reaction' | 'decision'>('reaction')
  const [feedbacks, setFeedbacks] = useState<Array<{ id: string; kind: string; comment: string | null; constat: string | null; proposition: string | null; benefice: string | null }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [nowTs, setNowTs] = useState<number>(() => Date.now())

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const me = await getCurrentUser()
        if (!me) throw new Error('Utilisateur introuvable')
        const [snapshot, snapItems, myFeedbacks] = await Promise.all([
          getRoadmapSnapshotById(snapshotId),
          listRoadmapSnapshotItems(snapshotId),
          listReviewerFeedbacks(snapshotId, me.id),
        ])
        if (cancelled) return
        if (!snapshot) throw new Error('Snapshot introuvable')
        setReviewerUserId(me.id)
        setLabel(snapshot.label)
        setDeadline(snapshot.review_deadline ?? null)
        setStatus(snapshot.status)
        setItems((snapItems as SnapshotItem[]).filter((x) => x.kind === 'chantier'))
        setFeedbacks(myFeedbacks)
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

  const grouped = useMemo(() => {
    return items.map((it) => {
      const payload = it.payload ?? {}
      return {
        id: it.source_id,
        projet: String(payload.projet_id ?? 'Projet'),
        title: String(payload.nom ?? 'Chantier'),
        axe: String(payload.axe ?? '—'),
      }
    })
  }, [items])

  async function handleAddFeedback() {
    if (!reviewerUserId) return
    const value = comment.trim()
    if (!value) return
    await createReviewFeedback({
      snapshot_id: snapshotId,
      reviewer_user_id: reviewerUserId,
      kind,
      target_type: 'projet',
      target_id: null,
      comment: kind === 'reaction' ? value : null,
      constat: kind === 'decision' ? value : null,
      proposition: null,
      benefice: null,
      projet_pere_id: null,
      axe: null,
      titre_chantier: null,
      codir_status: 'pending',
      codir_motivation: null,
      parent_id: null,
    })
    setComment('')
    const rows = await listReviewerFeedbacks(snapshotId, reviewerUserId)
    setFeedbacks(rows)
  }

  async function handleSubmitReview() {
    if (!reviewerUserId) return
    setSubmitting(true)
    try {
      await submitReviewerReview(snapshotId, reviewerUserId)
      setStatus('submitted')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="mr-root"><p className="mr-muted">Chargement de la revue…</p></div>
  if (error) return <div className="mr-root"><p className="mr-error">{error}</p></div>

  const late = useMemo(() => {
    const deadlineMs = deadline ? Date.parse(deadline) : NaN
    if (!Number.isFinite(deadlineMs)) return false
    return deadlineMs < nowTs
  }, [deadline, nowTs])

  return (
    <section className="mr-root">
      <button type="button" className="mr-back" onClick={onExit}>← Retour dashboard</button>
      <h1 className="mr-title">REVUE ROADMAP · {label}</h1>
      <p className="mr-sub">
        Deadline: {deadline ? new Date(deadline).toLocaleString('fr-FR') : 'non définie'} ·
        <strong style={{ marginLeft: 6 }}>{late ? 'En retard' : 'En cours'}</strong>
      </p>

      <article className="mr-panel" style={{ marginBottom: 16 }}>
        <h3>Partie 1 · Projets/chantiers du snapshot</h3>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {grouped.slice(0, 24).map((g) => (
            <li key={g.id}>{g.title} · axe {g.axe} · projet {g.projet}</li>
          ))}
        </ul>
      </article>

      <article className="mr-panel" style={{ marginBottom: 16 }}>
        <h3>Partie 2 · Commentaire reviewer</h3>
        <div className="mr-field">
          <label htmlFor="review-kind">Type</label>
          <select id="review-kind" value={kind} onChange={(e) => setKind(e.target.value as 'reaction' | 'decision')}>
            <option value="reaction">Réaction</option>
            <option value="decision">Demande de décision</option>
          </select>
        </div>
        <div className="mr-field">
          <label htmlFor="review-comment">Commentaire</label>
          <textarea id="review-comment" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <button type="button" className="mr-btn-primary" onClick={() => { void handleAddFeedback() }}>
          Enregistrer le feedback
        </button>
      </article>

      <article className="mr-panel" style={{ marginBottom: 16 }}>
        <h3>Partie 3 · Feedbacks saisis</h3>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {feedbacks.length === 0 ? <li>Aucun feedback pour le moment.</li> : null}
          {feedbacks.map((f) => (
            <li key={f.id}><strong>{f.kind}</strong> · {f.comment ?? f.constat ?? f.proposition ?? f.benefice ?? '—'}</li>
          ))}
        </ul>
      </article>

      <div className="mr-drawer-actions">
        <button
          type="button"
          className="mr-btn-primary"
          onClick={() => { void handleSubmitReview() }}
          disabled={status === 'submitted' || submitting}
        >
          {status === 'submitted' ? 'Revue soumise' : submitting ? 'Soumission…' : 'Soumettre ma review'}
        </button>
      </div>
    </section>
  )
}
