import { useMemo, useState } from 'react'

type DirectionOption = 'Direction Ressources Humaines' | 'Direction des Systèmes d\'Information' | 'Autre'

const DIRECTION_OPTIONS: DirectionOption[] = [
  'Direction Ressources Humaines',
  'Direction des Systèmes d\'Information',
  'Autre',
]

type SavedOnboardingProfile = {
  firstName: string
  lastName: string
  jobTitle: string
  directionName: string
  mission: string
  vision: string
}

function getInitials(firstName: string, lastName: string) {
  const left = firstName.trim()[0] ?? ''
  const right = lastName.trim()[0] ?? ''
  const computed = `${left}${right}`.toUpperCase()
  return computed || 'MF'
}

export default function MemberOnboarding() {
  const [step, setStep] = useState<1 | 2>(1)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [direction, setDirection] = useState<DirectionOption>('Direction Ressources Humaines')
  const [otherDirection, setOtherDirection] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [mission, setMission] = useState('')
  const [vision, setVision] = useState('')

  const canContinue = firstName.trim() && lastName.trim() && jobTitle.trim()
  const initials = useMemo(() => getInitials(firstName, lastName), [firstName, lastName])
  const directionName = direction === 'Autre' ? otherDirection.trim() : direction

  function onAvatarChange(file: File | null) {
    if (!file) {
      setAvatarPreview(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

  function persistProfile() {
    const payload: SavedOnboardingProfile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      jobTitle: jobTitle.trim(),
      directionName,
      mission: mission.trim(),
      vision: vision.trim(),
    }
    localStorage.setItem('lfdc-member-onboarding', JSON.stringify(payload))
  }

  return (
    <div className="mo-root">
      <style>{CSS}</style>
      <main className="mo-main">
        <header className="mo-header">
          <h2 className="mo-title">Onboarding membre invité</h2>
          <p className="mo-subtitle">Complétez votre profil pour rejoindre votre espace de transformation.</p>
        </header>

        <section className="mo-progress-card">
          <div className="mo-progress-top">
            <span>Étape {step}/2</span>
            <span>{step === 1 ? 'Mon identité' : 'Ma direction'}</span>
          </div>
          <div className="mo-progress-track">
            <div className="mo-progress-fill" style={{ width: step === 1 ? '50%' : '100%' }} />
          </div>
        </section>

        {step === 1 ? (
          <section className="mo-card">
            <h3 className="mo-card-title">Étape 1 — Mon identité</h3>
            <div className="mo-grid">
              <label className="mo-field">
                <span>Prénom *</span>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </label>
              <label className="mo-field">
                <span>Nom *</span>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </label>
              <label className="mo-field">
                <span>Poste / Titre *</span>
                <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              </label>
              <label className="mo-field">
                <span>Direction</span>
                <select value={direction} onChange={(e) => setDirection(e.target.value as DirectionOption)}>
                  {DIRECTION_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              {direction === 'Autre' && (
                <label className="mo-field mo-field--full">
                  <span>Nom de la direction</span>
                  <input value={otherDirection} onChange={(e) => setOtherDirection(e.target.value)} />
                </label>
              )}
              <label className="mo-field mo-field--full">
                <span>Avatar (optionnel)</span>
                <input type="file" accept="image/*" onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            <div className="mo-preview">
              <div className="mo-avatar">
                {avatarPreview ? <img src={avatarPreview} alt="Avatar membre" /> : <span>{initials}</span>}
              </div>
              <div>
                <div className="mo-name">{`${firstName || 'Prénom'} ${lastName || 'Nom'}`}</div>
                <div className="mo-meta">{jobTitle || 'Poste'} · {directionName || 'Direction'}</div>
              </div>
            </div>

            <div className="mo-actions">
              <button type="button" className="mo-btn mo-btn--primary" disabled={!canContinue} onClick={() => setStep(2)}>
                Continuer
              </button>
            </div>
          </section>
        ) : (
          <section className="mo-card">
            <h3 className="mo-card-title">Étape 2 — Ma direction</h3>
            <div className="mo-grid">
              <label className="mo-field mo-field--full">
                <span>Nom de ma direction</span>
                <input value={directionName} readOnly />
              </label>
              <label className="mo-field mo-field--full">
                <span>Mission de ma direction</span>
                <textarea
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  placeholder="Décrivez la mission principale..."
                />
              </label>
              <label className="mo-field mo-field--full">
                <span>Vision de ma direction</span>
                <textarea
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  placeholder="Décrivez la vision cible..."
                />
              </label>
            </div>

            <p className="mo-note">
              Ces informations pré-rempliront les champs Mission / Vision dans la vue périmètre correspondante.
            </p>

            <div className="mo-actions">
              <button type="button" className="mo-btn mo-btn--ghost" onClick={() => setStep(1)}>
                Retour
              </button>
              <button type="button" className="mo-btn mo-btn--primary" onClick={persistProfile}>
                Accéder à mon espace
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

const CSS = `
.mo-root {
  background: var(--theme-bg-page);
  color: var(--theme-text);
}

.mo-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.mo-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.mo-title {
  margin: 0;
  font-family: var(--font-display);
  color: var(--theme-text);
  font-size: 1.45rem;
}

.mo-subtitle {
  margin: 0;
  color: var(--theme-text-muted);
  font-size: 0.9rem;
}

.mo-progress-card,
.mo-card {
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

.mo-progress-top {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: var(--theme-text-muted);
  margin-bottom: var(--space-sm);
}

.mo-progress-track {
  height: 10px;
  background: var(--theme-border);
  border-radius: 999px;
  overflow: hidden;
}

.mo-progress-fill {
  height: 100%;
  background: var(--theme-accent);
  transition: width var(--transition);
}

.mo-card-title {
  margin: 0 0 var(--space-md);
  font-size: 1rem;
  color: var(--theme-text);
}

.mo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: var(--space-md);
}

.mo-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--theme-text-muted);
}

.mo-field--full {
  grid-column: 1 / -1;
}

.mo-field input,
.mo-field select,
.mo-field textarea {
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font: inherit;
  color: var(--theme-text);
  background: var(--theme-bg-page);
}

.mo-field textarea {
  min-height: 90px;
  resize: vertical;
}

.mo-preview {
  margin-top: var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border: 1px dashed var(--theme-border);
  border-radius: var(--radius-md);
}

.mo-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--theme-accent);
  color: var(--theme-on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  overflow: hidden;
}

.mo-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mo-name {
  color: var(--theme-text);
  font-weight: 600;
}

.mo-meta {
  color: var(--theme-text-muted);
  font-size: 0.82rem;
}

.mo-note {
  margin: var(--space-md) 0 0;
  color: var(--theme-text-muted);
  font-size: 0.82rem;
  border-top: 1px solid var(--theme-border);
  padding-top: var(--space-md);
}

.mo-actions {
  margin-top: var(--space-lg);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.mo-btn {
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 600;
}

.mo-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.mo-btn--primary {
  background: var(--theme-accent);
  color: var(--theme-on-accent);
}

.mo-btn--ghost {
  background: transparent;
  border: 1px solid var(--theme-border);
  color: var(--theme-text-muted);
}

@media (max-width: 900px) {
  .mo-grid {
    grid-template-columns: 1fr;
  }
}
`
