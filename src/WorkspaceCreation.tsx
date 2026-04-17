import { useMemo, useState } from 'react'

type CompanySize = 'PME' | 'ETI' | 'Grand groupe'
type MemberRole = 'Membre CODIR' | 'Pilote' | 'Contributeur'

type Invite = {
  email: string
  role: MemberRole
}

const SECTORS = ['Industrie', 'Services', 'Santé', 'Éducation', 'Public', 'Autre'] as const
const SIZES: CompanySize[] = ['PME', 'ETI', 'Grand groupe']
const DEFAULT_ROLE: MemberRole = 'Contributeur'

function getInitials(value: string) {
  const chunks = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
  if (chunks.length === 0) return 'LF'
  return chunks.map((part) => part[0]?.toUpperCase() ?? '').join('')
}

export default function WorkspaceCreation() {
  const [step, setStep] = useState<1 | 2>(1)
  const [companyName, setCompanyName] = useState('')
  const [sector, setSector] = useState<(typeof SECTORS)[number]>(SECTORS[0])
  const [size, setSize] = useState<CompanySize>('PME')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [emailInput, setEmailInput] = useState('')
  const [invites, setInvites] = useState<Invite[]>([])

  const initials = useMemo(() => getInitials(companyName), [companyName])

  function onLogoChange(file: File | null) {
    if (!file) {
      setLogoPreview(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

  function addInvite() {
    const email = emailInput.trim().toLowerCase()
    if (!email || !email.includes('@')) return
    if (invites.some((item) => item.email === email)) return
    setInvites((prev) => [...prev, { email, role: DEFAULT_ROLE }])
    setEmailInput('')
  }

  function removeInvite(email: string) {
    setInvites((prev) => prev.filter((item) => item.email !== email))
  }

  function updateRole(email: string, role: MemberRole) {
    setInvites((prev) => prev.map((item) => (item.email === email ? { ...item, role } : item)))
  }

  const canGoNext = companyName.trim().length > 0

  return (
    <div className="wf-root">
      <style>{CSS}</style>
      <main className="wf-main">
        <header className="wf-header">
          <h2 className="wf-title">Création d&apos;un espace entreprise</h2>
          <p className="wf-subtitle">Configurez votre client puis invitez les membres du collectif.</p>
        </header>

        <section className="wf-progress-card">
          <div className="wf-progress-top">
            <span>Étape {step}/2</span>
            <span>{step === 1 ? 'L’entreprise cliente' : 'Inviter les membres'}</span>
          </div>
          <div className="wf-progress-track">
            <div className="wf-progress-fill" style={{ width: step === 1 ? '50%' : '100%' }} />
          </div>
        </section>

        {step === 1 ? (
          <section className="wf-card">
            <h3 className="wf-card-title">Étape 1 — L’entreprise cliente</h3>
            <div className="wf-grid">
              <label className="wf-field">
                <span>Nom de l&apos;entreprise *</span>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Forge Industries"
                />
              </label>

              <label className="wf-field">
                <span>Secteur d&apos;activité</span>
                <select value={sector} onChange={(e) => setSector(e.target.value as (typeof SECTORS)[number])}>
                  {SECTORS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="wf-field">
                <span>Taille</span>
                <select value={size} onChange={(e) => setSize(e.target.value as CompanySize)}>
                  {SIZES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="wf-field">
                <span>Logo (optionnel)</span>
                <input type="file" accept="image/*" onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            <div className="wf-company-preview">
              <div className="wf-logo">
                {logoPreview ? <img src={logoPreview} alt="Logo entreprise" /> : <span>{initials}</span>}
              </div>
              <div>
                <div className="wf-company-name">{companyName || 'Nom entreprise'}</div>
                <div className="wf-company-meta">
                  {sector} · {size}
                </div>
              </div>
            </div>

            <div className="wf-actions">
              <button
                type="button"
                className="wf-btn wf-btn--primary"
                disabled={!canGoNext}
                onClick={() => setStep(2)}
              >
                Continuer
              </button>
            </div>
          </section>
        ) : (
          <section className="wf-card">
            <h3 className="wf-card-title">Étape 2 — Inviter les membres</h3>

            <div className="wf-invite-row">
              <input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="prenom.nom@entreprise.fr"
              />
              <button type="button" className="wf-btn wf-btn--secondary" onClick={addInvite}>
                Ajouter
              </button>
            </div>

            <div className="wf-list">
              {invites.length === 0 ? (
                <p className="wf-empty">Aucune invitation ajoutée pour le moment.</p>
              ) : (
                invites.map((invite) => (
                  <div key={invite.email} className="wf-list-item">
                    <div className="wf-list-email">{invite.email}</div>
                    <select
                      value={invite.role}
                      onChange={(e) => updateRole(invite.email, e.target.value as MemberRole)}
                    >
                      <option value="Membre CODIR">Membre CODIR</option>
                      <option value="Pilote">Pilote</option>
                      <option value="Contributeur">Contributeur</option>
                    </select>
                    <button type="button" className="wf-remove" onClick={() => removeInvite(invite.email)}>
                      Supprimer
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="wf-role-help">
              <p><strong>Membre CODIR</strong> : peut saisir ses projets et sa direction.</p>
              <p><strong>Pilote</strong> : accès aux projets dont il est pilote.</p>
              <p><strong>Contributeur</strong> : lecture et contribution partielle.</p>
            </div>

            <div className="wf-actions">
              <button type="button" className="wf-btn wf-btn--ghost" onClick={() => setStep(1)}>
                Retour
              </button>
              <button type="button" className="wf-btn wf-btn--primary">
                Envoyer les invitations et créer l&apos;espace
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

const CSS = `
.wf-root {
  background: var(--theme-bg-page);
  color: var(--theme-text);
}

.wf-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.wf-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.wf-title {
  margin: 0;
  font-family: var(--font-display);
  color: var(--theme-text);
  font-size: 1.45rem;
}

.wf-subtitle {
  margin: 0;
  color: var(--theme-text-muted);
  font-size: 0.9rem;
}

.wf-progress-card,
.wf-card {
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

.wf-progress-top {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: var(--theme-text-muted);
  margin-bottom: var(--space-sm);
}

.wf-progress-track {
  height: 10px;
  background: var(--theme-border);
  border-radius: 999px;
  overflow: hidden;
}

.wf-progress-fill {
  height: 100%;
  background: var(--theme-accent);
  transition: width var(--transition);
}

.wf-card-title {
  margin: 0 0 var(--space-md);
  font-size: 1rem;
  color: var(--theme-text);
}

.wf-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: var(--space-md);
}

.wf-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--theme-text-muted);
}

.wf-field input,
.wf-field select,
.wf-invite-row input,
.wf-list-item select {
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font: inherit;
  color: var(--theme-text);
  background: var(--theme-bg-page);
}

.wf-company-preview {
  margin-top: var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border: 1px dashed var(--theme-border);
  border-radius: var(--radius-md);
}

.wf-logo {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #8e3b46;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  overflow: hidden;
}

.wf-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wf-company-name {
  color: var(--theme-text);
  font-weight: 600;
}

.wf-company-meta {
  color: var(--theme-text-muted);
  font-size: 0.82rem;
}

.wf-invite-row {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.wf-invite-row input {
  flex: 1;
}

.wf-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.wf-list-item {
  display: grid;
  grid-template-columns: 1fr 220px auto;
  gap: var(--space-sm);
  align-items: center;
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  background: var(--theme-bg-page);
}

.wf-list-email {
  color: var(--theme-text);
  font-size: 0.9rem;
}

.wf-empty {
  margin: 0;
  color: var(--theme-text-muted);
  font-size: 0.85rem;
  padding: var(--space-md);
  border: 1px dashed var(--theme-border);
  border-radius: var(--radius-md);
}

.wf-remove {
  color: var(--theme-text-muted);
  padding: 8px 10px;
  border-radius: var(--radius-sm);
}

.wf-remove:hover {
  background: var(--theme-border);
}

.wf-role-help {
  margin-top: var(--space-md);
  border-top: 1px solid var(--theme-border);
  padding-top: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--theme-text-muted);
  font-size: 0.82rem;
}

.wf-role-help p {
  margin: 0;
}

.wf-actions {
  margin-top: var(--space-lg);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.wf-btn {
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 600;
}

.wf-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.wf-btn--primary {
  background: var(--theme-accent);
  color: var(--theme-on-accent);
}

.wf-btn--secondary {
  background: var(--theme-bg-card);
  color: var(--theme-text);
  border: 1px solid var(--theme-border);
}

.wf-btn--ghost {
  background: transparent;
  border: 1px solid var(--theme-border);
  color: var(--theme-text-muted);
}

@media (max-width: 900px) {
  .wf-grid {
    grid-template-columns: 1fr;
  }
  .wf-list-item {
    grid-template-columns: 1fr;
  }
}
`
