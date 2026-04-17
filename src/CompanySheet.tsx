import { useMemo, useState } from 'react'

export interface CompanySheetProps {
  companyName: string
  sector: string
  size: string
  members: Array<{ email: string; role: string }>
  currentUserRole: 'consultant' | 'codir' | 'pilote' | 'contributeur'
}

function getRoleLabel(role: CompanySheetProps['currentUserRole']) {
  if (role === 'consultant') return 'Consultant'
  if (role === 'codir') return 'Membre CODIR'
  if (role === 'pilote') return 'Pilote'
  return 'Contributeur'
}

function getRoleColor(role: string) {
  if (role.toLowerCase().includes('consultant')) return '#8E3B46'
  if (role.toLowerCase().includes('codir')) return '#8E3B46'
  if (role.toLowerCase().includes('pilote')) return '#4C86A8'
  return '#6B7280'
}

function getInitials(companyName: string) {
  const words = companyName.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  return words.map((word) => word[0]?.toUpperCase() ?? '').join('') || 'LF'
}

function getEmailName(email: string) {
  return email.split('@')[0] ?? email
}

export default function CompanySheet({
  companyName,
  sector,
  size,
  members,
  currentUserRole,
}: CompanySheetProps) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(companyName)
  const [draftSector, setDraftSector] = useState(sector)
  const [draftSize, setDraftSize] = useState(size)
  const roleLabel = getRoleLabel(currentUserRole)
  const roleColor = currentUserRole === 'consultant' ? '#8E3B46' : '#4C86A8'
  const initials = useMemo(() => getInitials(draftName), [draftName])

  return (
    <div className="cs-root">
      <style>{CSS}</style>
      <section className="cs-card">
        <header className="cs-header">
          <div className="cs-avatar">{initials}</div>
          <div className="cs-heading">
            {editing ? (
              <input value={draftName} onChange={(e) => setDraftName(e.target.value)} className="cs-edit-input cs-edit-input--title" />
            ) : (
              <h2>{draftName}</h2>
            )}
            {editing ? (
              <div className="cs-inline-fields">
                <input value={draftSector} onChange={(e) => setDraftSector(e.target.value)} className="cs-edit-input" />
                <input value={draftSize} onChange={(e) => setDraftSize(e.target.value)} className="cs-edit-input" />
              </div>
            ) : (
              <p>{draftSector} · {draftSize}</p>
            )}
          </div>
          <span className="cs-role-badge" style={{ background: roleColor }}>{roleLabel}</span>
        </header>

        <div className="cs-section">
          <h3>Informations générales</h3>
          <div className="cs-info-grid">
            <div>
              <span className="cs-label">Secteur d’activité</span>
              <strong>{draftSector}</strong>
            </div>
            <div>
              <span className="cs-label">Taille</span>
              <strong>{draftSize}</strong>
            </div>
          </div>
        </div>

        <div className="cs-section">
          <h3>Membres de l&apos;espace</h3>
          <div className="cs-members">
            {members.map((member, idx) => {
              const active = idx % 2 === 0
              const badgeColor = getRoleColor(member.role)
              return (
                <div key={`${member.email}-${idx}`} className="cs-member-row">
                  <div className="cs-member-avatar" style={{ background: badgeColor }}>
                    {getInitials(getEmailName(member.email))}
                  </div>
                  <div className="cs-member-main">
                    <span className="cs-member-email">{member.email}</span>
                  </div>
                  <span className="cs-member-role" style={{ borderColor: badgeColor, color: badgeColor }}>
                    {member.role}
                  </span>
                  <span className={active ? 'cs-status cs-status--active' : 'cs-status cs-status--invited'}>
                    {active ? 'Actif' : 'Invité'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {currentUserRole === 'consultant' ? (
          <div className="cs-actions">
            {editing ? (
              <button type="button" className="cs-primary-btn" onClick={() => setEditing(false)}>
                Enregistrer
              </button>
            ) : (
              <button type="button" className="cs-primary-btn" onClick={() => setEditing(true)}>
                Modifier la fiche
              </button>
            )}
          </div>
        ) : (
          <p className="cs-note">
            Seul le consultant ou chef de projet peut modifier ces informations.
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
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
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
  justify-content: flex-end;
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

.cs-inline-fields {
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr;
  margin-top: 8px;
}
`
