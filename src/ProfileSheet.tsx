import { useState } from 'react'

export interface ProfileSheetProps {
  firstName: string
  lastName: string
  jobTitle: string
  direction: string
  mission: string
  vision: string
  role: string
}

function roleColor(role: string) {
  const normalized = role.toLowerCase()
  if (normalized.includes('consultant')) return '#8E3B46'
  if (normalized.includes('codir')) return '#8E3B46'
  if (normalized.includes('pilote')) return '#4C86A8'
  return '#6B7280'
}

function roleRights(role: string) {
  const normalized = role.toLowerCase()
  const isConsultant = normalized.includes('consultant')
  const isCodir = normalized.includes('codir')
  const isPilote = normalized.includes('pilote')
  return [
    { label: 'Saisie des projets de direction', allowed: isConsultant || isCodir },
    { label: 'Pilotage des projets assignés', allowed: isConsultant || isCodir || isPilote },
    { label: 'Accès synthèse DG', allowed: isConsultant || isCodir },
    { label: 'Modification de la fiche entreprise', allowed: isConsultant },
  ]
}

export default function ProfileSheet(props: ProfileSheetProps) {
  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState(props.firstName)
  const [lastName, setLastName] = useState(props.lastName)
  const [jobTitle, setJobTitle] = useState(props.jobTitle)
  const [direction, setDirection] = useState(props.direction)
  const [mission, setMission] = useState(props.mission)
  const [vision, setVision] = useState(props.vision)

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?'
  const roleBadgeColor = roleColor(props.role)
  const rights = roleRights(props.role)

  return (
    <div className="psh-root">
      <style>{CSS}</style>
      <section className="psh-card">
        <header className="psh-header">
          <div className="psh-avatar">{initials}</div>
          <div className="psh-heading">
            {editing ? (
              <div className="psh-name-grid">
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="psh-input" />
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="psh-input" />
              </div>
            ) : (
              <h2>{firstName} {lastName}</h2>
            )}
            {editing ? (
              <div className="psh-name-grid">
                <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="psh-input" />
                <input value={direction} onChange={(e) => setDirection(e.target.value)} className="psh-input" />
              </div>
            ) : (
              <p>{jobTitle || '—'} · {direction || '—'}</p>
            )}
          </div>
          <span className="psh-role" style={{ background: roleBadgeColor }}>
            {props.role}
          </span>
        </header>

        <section className="psh-section">
          <h3>Mon périmètre</h3>
          {editing ? (
            <div className="psh-field-list">
              <label>
                <span>Direction</span>
                <input value={direction} onChange={(e) => setDirection(e.target.value)} className="psh-input" />
              </label>
              <label>
                <span>Mission</span>
                <textarea value={mission} onChange={(e) => setMission(e.target.value)} className="psh-input psh-textarea" />
              </label>
              <label>
                <span>Vision</span>
                <textarea value={vision} onChange={(e) => setVision(e.target.value)} className="psh-input psh-textarea" />
              </label>
            </div>
          ) : (
            <div className="psh-info">
              <p><strong>Direction :</strong> {direction || '— Non renseignée —'}</p>
              <p><strong>Mission :</strong> {mission || '— Non renseignée —'}</p>
              <p><strong>Vision :</strong> {vision || '— Non renseignée —'}</p>
            </div>
          )}
        </section>

        <section className="psh-section">
          <h3>Mes droits</h3>
          <ul className="psh-rights">
            {rights.map((item) => (
              <li key={item.label}>
                <span className={item.allowed ? 'psh-check psh-check--ok' : 'psh-check psh-check--no'}>
                  {item.allowed ? '✓' : '✗'}
                </span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="psh-actions">
          {editing ? (
            <button type="button" className="psh-btn" onClick={() => setEditing(false)}>
              Enregistrer
            </button>
          ) : (
            <button type="button" className="psh-btn" onClick={() => setEditing(true)}>
              Modifier mon profil
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

const CSS = `
.psh-root {
  display: flex;
  justify-content: center;
}

.psh-card {
  width: 100%;
  max-width: 640px;
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border);
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.12);
}

.psh-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.psh-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #4C86A8;
  color: white;
  display: grid;
  place-items: center;
  font-size: 20px;
  font-weight: 700;
}

.psh-heading { flex: 1; }
.psh-heading h2 {
  margin: 0;
  font-family: 'Playfair Display', serif;
  font-size: 28px;
}
.psh-heading p {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--theme-text-muted);
}

.psh-role {
  color: white;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 700;
}

.psh-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--theme-border);
}

.psh-section h3 {
  margin: 0 0 12px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--theme-text-muted);
}

.psh-info p {
  margin: 6px 0;
  color: var(--theme-text);
}

.psh-rights {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.psh-rights li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--theme-text);
}

.psh-check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
}

.psh-check--ok { background: rgba(16,185,129,0.15); color: #10B981; }
.psh-check--no { background: rgba(107,114,128,0.15); color: #6B7280; }

.psh-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.psh-btn {
  height: 46px;
  border: none;
  border-radius: 12px;
  background: #8E3B46;
  color: white;
  font-weight: 700;
  padding: 0 16px;
}

.psh-name-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.psh-input {
  border: 1px solid var(--theme-border);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--theme-bg-page);
  color: var(--theme-text);
}

.psh-textarea {
  min-height: 80px;
  resize: vertical;
}

.psh-field-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.psh-field-list label span {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--theme-text-muted);
}
`
