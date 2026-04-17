import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getWorkspaceInvitations,
  getWorkspaceUsers,
  updateWorkspace,
} from './lib/api'

export interface CompanyMember {
  email: string
  role: string
  status?: 'invité' | 'actif'
}

export interface CompanySheetProps {
  workspaceId?: string | null
  companyName: string
  sector: string
  size: string
  members: CompanyMember[]
  currentUserRole: 'consultant' | 'admin' | 'codir' | 'pilote' | 'contributeur'
  companyLogo?: string | null
  onCompanyUpdate?: (data: {
    companyName: string
    sector: string
    size: string
    logo: string | null
  }) => void
}

function getRoleLabel(role: CompanySheetProps['currentUserRole']) {
  if (role === 'consultant') return 'Consultant'
  if (role === 'admin') return 'Administrateur'
  if (role === 'codir') return 'Membre CODIR'
  if (role === 'pilote') return 'Pilote'
  return 'Contributeur'
}

function getInitials(companyName: string) {
  const words = companyName.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  return words.map((word) => word[0]?.toUpperCase() ?? '').join('') || 'LF'
}

function getEmailLocal(email: string) {
  return email.split('@')[0] ?? email
}

function memberAvatarColor(role: string) {
  const r = role.toLowerCase()
  if (r.includes('codir') || r.includes('membre')) return '#8E3B46'
  if (r.includes('pilote')) return '#4C86A8'
  return '#6B7280'
}

function canEditCompany(role: CompanySheetProps['currentUserRole']) {
  return role === 'consultant' || role === 'admin'
}

export default function CompanySheet({
  workspaceId = null,
  companyName,
  sector,
  size,
  members,
  currentUserRole,
  companyLogo: companyLogoProp = null,
  onCompanyUpdate,
}: CompanySheetProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(companyName)
  const [draftSector, setDraftSector] = useState(sector)
  const [draftSize, setDraftSize] = useState(size)
  const [logoUrl, setLogoUrl] = useState<string | null>(companyLogoProp ?? null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [remoteMembers, setRemoteMembers] = useState<CompanyMember[] | null>(null)

  useEffect(() => {
    setLogoUrl(companyLogoProp ?? null)
  }, [companyLogoProp])

  useEffect(() => {
    setDraftName(companyName)
    setDraftSector(sector)
    setDraftSize(size)
  }, [companyName, sector, size])

  const roleLabel = getRoleLabel(currentUserRole)
  const roleColor = currentUserRole === 'consultant' || currentUserRole === 'admin' ? '#8E3B46' : '#4C86A8'
  const initials = useMemo(() => getInitials(draftName), [draftName])
  const canEdit = canEditCompany(currentUserRole)
  const mergedMembers = remoteMembers ?? members

  function onLogoFile(file: File | null) {
    if (!file) {
      setLogoUrl(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogoUrl(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (!workspaceId) return
    let cancelled = false
    void (async () => {
      try {
        const [users, invitations] = await Promise.all([
          getWorkspaceUsers(workspaceId),
          getWorkspaceInvitations(workspaceId),
        ])
        if (cancelled) return

        const byEmail = new Map<string, CompanyMember>()
        for (const user of users) {
          byEmail.set(user.email, {
            email: user.email,
            role: user.role,
            status: user.status === 'actif' ? 'actif' : 'invité',
          })
        }
        for (const inv of invitations) {
          if (!byEmail.has(inv.email)) {
            byEmail.set(inv.email, {
              email: inv.email,
              role: inv.role,
              status: inv.status === 'acceptee' ? 'actif' : 'invité',
            })
          }
        }
        setRemoteMembers(Array.from(byEmail.values()))
      } catch {
        // fallback on props members
        setRemoteMembers(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workspaceId])

  async function persist() {
    setSaveError(null)
    setSaving(true)
    try {
      const logoForDb = logoUrl && logoUrl.startsWith('http') ? logoUrl : null
      if (workspaceId) {
        const updated = await updateWorkspace(workspaceId, {
          company_name: draftName.trim() || companyName,
          sector: draftSector || null,
          size: (draftSize || null) as 'PME' | 'ETI' | 'Grand groupe' | null,
          logo_url: logoForDb,
        })
        onCompanyUpdate?.({
          companyName: updated.company_name,
          sector: updated.sector ?? 'Non renseigné',
          size: updated.size ?? 'Non renseigné',
          logo: updated.logo_url,
        })
      } else {
        onCompanyUpdate?.({
          companyName: draftName,
          sector: draftSector,
          size: draftSize,
          logo: logoUrl,
        })
      }
      setEditing(false)
    } catch (error) {
      const message = typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: unknown }).message ?? '')
        : ''
      setSaveError(message || 'Impossible d’enregistrer les modifications')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cs-root">
      <style>{CSS}</style>
      <section className="cs-card">
        <header className="cs-header">
          <div className="cs-logo-block">
            <div className="cs-avatar cs-avatar--lg">
              {logoUrl
                ? <img src={logoUrl} alt="" className="cs-avatar-img" />
                : <span>{initials}</span>}
            </div>
            {canEdit && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="cs-file"
                  onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)}
                />
                <button type="button" className="cs-change-logo" onClick={() => fileRef.current?.click()}>
                  Changer le logo
                </button>
              </>
            )}
          </div>
          <div className="cs-heading">
            {canEdit && editing ? (
              <input value={draftName} onChange={(e) => setDraftName(e.target.value)} className="cs-edit-input cs-edit-input--title" />
            ) : (
              <h2>{draftName}</h2>
            )}
            {!editing && (
              <p>{draftSector} · {draftSize}</p>
            )}
          </div>
          <span className="cs-role-badge" style={{ background: roleColor }}>{roleLabel}</span>
        </header>

        <div className="cs-section">
          <h3>Informations générales</h3>
          <div className="cs-info-grid">
            <div>
              <span className="cs-label">Secteur d&apos;activité</span>
              {canEdit && editing ? (
                <input value={draftSector} onChange={(e) => setDraftSector(e.target.value)} className="cs-edit-input" />
              ) : (
                <strong>{draftSector}</strong>
              )}
            </div>
            <div>
              <span className="cs-label">Taille</span>
              {canEdit && editing ? (
                <input value={draftSize} onChange={(e) => setDraftSize(e.target.value)} className="cs-edit-input" />
              ) : (
                <strong>{draftSize}</strong>
              )}
            </div>
          </div>
        </div>

        <div className="cs-section">
          <h3>Membres de l&apos;espace</h3>
          {mergedMembers.length === 0 ? (
            <p className="cs-members-empty">Aucun membre invité pour le moment</p>
          ) : (
            <div className="cs-members">
              {mergedMembers.map((member, idx) => {
                const badgeColor = memberAvatarColor(member.role)
                const status = member.status ?? 'invité'
                const isActive = status === 'actif'
                return (
                  <div key={`${member.email}-${idx}`} className="cs-member-row">
                    <div className="cs-member-avatar" style={{ background: badgeColor }}>
                      {getInitials(getEmailLocal(member.email))}
                    </div>
                    <div className="cs-member-main">
                      <span className="cs-member-email">{member.email}</span>
                    </div>
                    <span className="cs-member-role" style={{ borderColor: badgeColor, color: badgeColor }}>
                      {member.role}
                    </span>
                    <span className={isActive ? 'cs-status cs-status--active' : 'cs-status cs-status--invited'}>
                      {isActive ? 'Actif' : 'Invité'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {canEdit && (
          <div className="cs-actions">
            {editing ? (
              <>
                {saveError && <p className="cs-save-error">{saveError}</p>}
                <button type="button" className="cs-primary-btn" onClick={() => { void persist() }} disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </>
            ) : (
              <button type="button" className="cs-primary-btn" onClick={() => setEditing(true)}>
                Modifier la fiche
              </button>
            )}
          </div>
        )}

        {!canEdit && (
          <p className="cs-note">
            Seul le consultant ou l&apos;administrateur peut modifier ces informations.
          </p>
        )}
      </section>
    </div>
  )
}

const CSS = `
.cs-root {
  display: flex;
  justify-content: center;
  padding: 10px 0 24px;
}

.cs-card {
  width: 100%;
  max-width: 640px;
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border);
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.12);
}

.cs-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 28px;
}

.cs-logo-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.cs-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #8E3B46;
  color: white;
  display: grid;
  place-items: center;
  font-size: 20px;
  font-weight: 700;
  overflow: hidden;
}

.cs-avatar--lg {
  width: 72px;
  height: 72px;
  font-size: 22px;
}

.cs-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cs-file {
  display: none;
}

.cs-change-logo {
  appearance: none;
  border: none;
  background: none;
  font-size: 12px;
  color: var(--theme-accent);
  text-decoration: underline;
  cursor: pointer;
  font-family: var(--font-body);
}

.cs-heading { flex: 1; min-width: 0; }

.cs-heading h2 {
  margin: 0;
  font-family: 'Playfair Display', serif;
  font-size: 32px;
  color: var(--theme-text);
}

.cs-heading p {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--theme-text-muted);
}

.cs-role-badge {
  color: white;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.cs-section {
  border-top: 1px solid var(--theme-border);
  padding-top: 18px;
  margin-top: 18px;
}

.cs-section h3 {
  margin: 0 0 12px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--theme-text-muted);
}

.cs-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.cs-label {
  display: block;
  font-size: 12px;
  color: var(--theme-text-muted);
  margin-bottom: 4px;
}

.cs-members-empty {
  margin: 0;
  font-size: 13px;
  font-style: italic;
  color: var(--theme-text-muted);
}

.cs-members { display: flex; flex-direction: column; gap: 8px; }

.cs-member-row {
  display: grid;
  grid-template-columns: 32px 1fr auto auto;
  gap: 10px;
  align-items: center;
  border: 1px solid var(--theme-border);
  border-radius: 10px;
  padding: 8px 10px;
}

.cs-member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.cs-member-email {
  font-size: 14px;
  color: var(--theme-text);
}

.cs-member-role {
  border: 1px solid;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 600;
}

.cs-status {
  font-size: 11px;
  font-weight: 700;
}

.cs-status--active { color: #10B981; }
.cs-status--invited { color: var(--theme-text-muted); }

.cs-note {
  margin: 24px 0 0;
  font-size: 12px;
  opacity: .5;
  text-align: center;
  color: var(--theme-text);
}

.cs-actions {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  justify-content: flex-end;
}

.cs-save-error {
  margin: 0;
  font-size: 12px;
  color: #B91C1C;
}

.cs-primary-btn {
  height: 46px;
  border: none;
  border-radius: 12px;
  background: #8E3B46;
  color: white;
  font-weight: 700;
  padding: 0 16px;
}

.cs-primary-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.cs-edit-input {
  height: 40px;
  border: 1px solid var(--theme-border);
  border-radius: 10px;
  padding: 0 12px;
  color: var(--theme-text);
  background: var(--theme-bg-page);
}

.cs-edit-input--title {
  height: 46px;
  width: 100%;
  font-family: 'Playfair Display', serif;
  font-size: 24px;
}
`
