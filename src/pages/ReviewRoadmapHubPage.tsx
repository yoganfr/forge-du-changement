import { useEffect, useState } from 'react'
import { listReviewerAssignmentsForWorkspace } from '../lib/api'
import type { ReviewerWorkspaceAssignment } from '../lib/api/roadmapReviews'

const REVIEWER_STATUS_LABEL: Record<string, string> = {
  pending: 'Invitation envoyée',
  draft: 'En cours',
  submitted: 'Soumis',
  closed: 'Clôturé',
}

type Props = {
  workspaceId: string | null
  currentAppUserId: string | null
  onOpenReview: (snapshotId: string) => void
}

export default function ReviewRoadmapHubPage({ workspaceId, currentAppUserId, onOpenReview }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<ReviewerWorkspaceAssignment[]>([])

  useEffect(() => {
    let cancelled = false
    if (!workspaceId || !currentAppUserId) {
      setLoading(false)
      setRows([])
      return
    }
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const list = await listReviewerAssignmentsForWorkspace(workspaceId, currentAppUserId)
        if (!cancelled) setRows(list)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Impossible de charger vos revues'
        if (!cancelled) setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workspaceId, currentAppUserId])

  if (!workspaceId) {
    return (
      <section className="dashboard__module-panel">
        <h2>Review Roadmap</h2>
        <p style={{ color: 'var(--theme-text-muted, #57534e)' }}>
          Sélectionnez un espace entreprise pour afficher vos revues assignées.
        </p>
      </section>
    )
  }

  if (!currentAppUserId) {
    return (
      <section className="dashboard__module-panel">
        <h2>Review Roadmap</h2>
        <p style={{ color: 'var(--theme-text-muted, #57534e)' }}>
          Profil utilisateur indisponible. Rechargez la page ou reconnectez-vous.
        </p>
      </section>
    )
  }

  return (
    <section className="dashboard__module-panel">
      <h2>Review Roadmap</h2>
      <p style={{ marginBottom: '1.25rem', color: 'var(--theme-text-muted, #57534e)', maxWidth: '52rem' }}>
        Retrouvez ici les revues de roadmap auxquelles vous êtes invité·e. Ouvrez une ligne pour saisir vos
        feedbacks et soumettre votre revue avant la date limite fixée par le CODIR.
      </p>

      {loading ? <p style={{ color: 'var(--theme-text-muted, #57534e)' }}>Chargement…</p> : null}
      {error ? <p role="alert" style={{ color: 'var(--theme-danger, #b91c1c)' }}>{error}</p> : null}

      {!loading && !error && rows.length === 0 ? (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--theme-border-subtle, rgba(0,0,0,.1))',
            background: 'var(--theme-bg-elevated, rgba(0,0,0,.03))',
            maxWidth: '52rem',
          }}
        >
          <p style={{ margin: 0 }}>Aucune revue ne vous est assignée sur cet espace pour le moment.</p>
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.92rem', color: 'var(--theme-text-muted, #57534e)' }}>
            Le CODIR doit ouvrir une revue sur un snapshot figé et vous inclure comme reviewer (même email que
            votre compte). Vous pouvez aussi utiliser un lien direct{' '}
            <code style={{ fontSize: '0.85em' }}>/review/&lt;id_snapshot&gt;</code> qui vous a été communiqué.
          </p>
        </div>
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="review-hub-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--theme-border-subtle, rgba(0,0,0,.12))' }}>
                <th style={{ padding: '0.5rem 0.75rem 0.5rem 0' }}>Snapshot</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Deadline</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Votre statut</th>
                <th style={{ padding: '0.5rem 0 0.5rem 0.75rem', width: '9rem' }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.snapshot_id} style={{ borderBottom: '1px solid var(--theme-border-subtle, rgba(0,0,0,.08))' }}>
                  <td style={{ padding: '0.65rem 0.75rem 0.65rem 0', verticalAlign: 'middle' }}>
                    <strong>{r.snapshot_label}</strong>
                    <div style={{ fontSize: '0.82rem', color: 'var(--theme-text-muted, #57534e)' }}>
                      Snapshot · {r.snapshot_status === 'in_review' ? 'En revue' : r.snapshot_status}
                    </div>
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', verticalAlign: 'middle' }}>
                    {r.review_deadline
                      ? new Date(r.review_deadline).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
                      : '—'}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', verticalAlign: 'middle' }}>
                    {REVIEWER_STATUS_LABEL[r.reviewer_status] ?? r.reviewer_status}
                  </td>
                  <td style={{ padding: '0.65rem 0 0.65rem 0.75rem', verticalAlign: 'middle' }}>
                    <button
                      type="button"
                      className="settings-page__btn settings-page__btn--primary"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.88rem' }}
                      onClick={() => onOpenReview(r.snapshot_id)}
                    >
                      Ouvrir la revue
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
