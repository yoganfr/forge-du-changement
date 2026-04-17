import { useState } from 'react'
import {
  createInvitation,
  createWorkspace,
  isStorageBucketNotFound,
  uploadImageToStorage,
} from './lib/api'
import type { Workspace } from './lib/types'

type MemberRole = 'Membre CODIR' | 'Pilote de projet' | 'Contributeur'

export interface OnboardingFlowProps {
  onCancel?: () => void
  onComplete: (data: {
    workspace: Workspace
    companyName: string
    sector: string
    size: string
    companyLogo: string | null
    members: Array<{ email: string; role: string }>
  }) => void
}

type Errors = Record<string, string>

const STEP_LABELS = ["L'entreprise", 'Les membres']
const SECTORS = ['Industrie', 'Services', 'Santé', 'Éducation', 'Public', 'Retail', 'Autre']
const SIZES = ['PME', 'ETI', 'Grand groupe'] as const
const ROLE_OPTIONS: MemberRole[] = ['Membre CODIR', 'Pilote de projet', 'Contributeur']

function getInitialsFromEmail(email: string) {
  const local = email.split('@')[0] ?? ''
  const chunks = local.split(/[.\-_]/).filter(Boolean)
  const raw = (chunks[0]?.[0] ?? '') + (chunks[1]?.[0] ?? '')
  return (raw || local.slice(0, 2) || '??').toUpperCase()
}

function roleColor(role: MemberRole) {
  if (role === 'Membre CODIR') return '#8E3B46'
  if (role === 'Pilote de projet') return '#4C86A8'
  return '#6B7280'
}

function toInvitationRole(role: MemberRole): 'codir' | 'pilote' | 'contributeur' {
  if (role === 'Membre CODIR') return 'codir'
  if (role === 'Pilote de projet') return 'pilote'
  return 'contributeur'
}

function getApiErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim()
    if (message) return message
  }
  return 'Une erreur est survenue, veuillez réessayer'
}

export default function OnboardingFlow({ onCancel, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1)
  const [prevStep, setPrevStep] = useState(1)
  const [errors, setErrors] = useState<Errors>({})

  const [companyName, setCompanyName] = useState('')
  const [sector, setSector] = useState(SECTORS[0])
  const [size, setSize] = useState<(typeof SIZES)[number]>('PME')
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null)

  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState<MemberRole>('Contributeur')
  const [members, setMembers] = useState<Array<{ email: string; role: MemberRole }>>([])
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [submittingStep1, setSubmittingStep1] = useState(false)
  const [submittingStep2, setSubmittingStep2] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const stepDirectionClass = step >= prevStep ? 'of-step--forward' : 'of-step--backward'
  const completedCount = Math.min(step - 1, 1)

  function goTo(nextStep: number) {
    setPrevStep(step)
    setStep(nextStep)
  }

  async function validateStep1() {
    const nextErrors: Errors = {}
    if (!companyName.trim()) nextErrors.companyName = 'Ce champ est obligatoire'
    if (!sector.trim()) nextErrors.sector = 'Ce champ est obligatoire'
    if (!size.trim()) nextErrors.size = 'Ce champ est obligatoire'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length !== 0) return

    setApiError(null)
    setSubmittingStep1(true)
    try {
      let logoUrlForDb: string | null = null
      if (companyLogoFile) {
        try {
          logoUrlForDb = await uploadImageToStorage({
            file: companyLogoFile,
            folder: 'workspaces/logos',
            filenamePrefix: companyName.trim() || 'workspace',
          })
        } catch (uploadError) {
          if (isStorageBucketNotFound(uploadError)) {
            // Keep flow working even if storage bucket is missing.
            logoUrlForDb = null
            setApiError("Bucket Storage introuvable (assets). L'espace sera créé sans logo.")
          } else {
            throw uploadError
          }
        }
      } else if (companyLogo && companyLogo.startsWith('http')) {
        logoUrlForDb = companyLogo
      }
      const workspace = await createWorkspace({
        company_name: companyName.trim(),
        sector,
        size,
        logo_url: logoUrlForDb,
      })
      setCompanyLogo(logoUrlForDb)
      setWorkspaceId(workspace.id)
      goTo(2)
    } catch (error) {
      setApiError(getApiErrorMessage(error))
    } finally {
      setSubmittingStep1(false)
    }
  }

  function addMember() {
    const email = memberEmail.trim().toLowerCase()
    if (!email) return
    if (!email.includes('@')) {
      setErrors((prev) => ({ ...prev, memberEmail: 'Adresse email invalide' }))
      return
    }
    if (members.some((member) => member.email === email)) return
    setMembers((prev) => [...prev, { email, role: memberRole }])
    setMemberEmail('')
    setErrors((prev) => {
      const next = { ...prev }
      delete next.memberEmail
      return next
    })
  }

  function removeMember(email: string) {
    setMembers((prev) => prev.filter((member) => member.email !== email))
  }

  function onLogoChange(file: File | null) {
    if (!file) {
      setCompanyLogo(null)
      setCompanyLogoFile(null)
      return
    }
    setCompanyLogoFile(file)
    const reader = new FileReader()
    reader.onload = () => setCompanyLogo(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

  async function submitInvitations() {
    if (!workspaceId) {
      setApiError('Une erreur est survenue, veuillez réessayer')
      return
    }
    setApiError(null)
    setSubmittingStep2(true)
    try {
      for (const member of members) {
        await createInvitation({
          workspace_id: workspaceId,
          email: member.email,
          role: toInvitationRole(member.role),
        })
      }
      onComplete({
        workspace: {
          id: workspaceId,
          company_name: companyName.trim(),
          sector,
          size,
          logo_url: companyLogo && companyLogo.startsWith('http') ? companyLogo : null,
          created_at: new Date().toISOString(),
        },
        companyName: companyName.trim(),
        sector,
        size,
        companyLogo,
        members: members.map((member) => ({ email: member.email, role: member.role })),
      })
    } catch (error) {
      setApiError(getApiErrorMessage(error))
    } finally {
      setSubmittingStep2(false)
    }
  }

  return (
    <div className="of-page">
      <style>{CSS}</style>
      <div className="of-shell">
        <div className="of-progress-wrap">
          <div className="of-progress-track" />
          <div className="of-progress-track of-progress-track--filled" style={{ width: `${(completedCount / 2) * 100}%` }} />
          <div className="of-progress-steps">
            {STEP_LABELS.map((label, index) => {
              const stepNumber = index + 1
              const state =
                stepNumber < step ? 'passed' : stepNumber === step ? 'active' : 'future'
              return (
                <div key={label} className="of-step-point">
                  <div className={`of-step-circle of-step-circle--${state}`}>
                    {state === 'passed' ? '✓' : stepNumber}
                  </div>
                  <div className="of-step-label">{label}</div>
                </div>
              )
            })}
          </div>
        </div>

        <section className="of-card">
          {apiError && (
            <div className="of-api-error">
              {apiError}
            </div>
          )}
          {step === 1 && (
            <div className={`of-step ${stepDirectionClass}`} key="step-1">
              <div className="of-icon">{ICON_FORGE}</div>
              <h2>Créer votre espace de transformation</h2>
              <p className="of-subtitle">
                Configuré par le consultant ou le chef de projet — prend moins de 2 minutes
              </p>
              {onCancel && (
                <button type="button" className="of-cancel-btn" onClick={onCancel}>
                  ← Retour à l&apos;accueil
                </button>
              )}

              <label className="of-field">
                <span className="of-label of-label--required">Nom de l&apos;entreprise</span>
                <input
                  className={errors.companyName ? 'of-input of-input--error' : 'of-input'}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                {errors.companyName && <span className="of-error">{errors.companyName}</span>}
              </label>

              <label className="of-field">
                <span className="of-label of-label--required">Secteur d&apos;activité</span>
                <select
                  className={errors.sector ? 'of-input of-input--error' : 'of-input'}
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                >
                  {SECTORS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {errors.sector && <span className="of-error">{errors.sector}</span>}
              </label>

              <div className="of-field">
                <span className="of-label of-label--required">Taille de l&apos;organisation</span>
                <div className="of-pills">
                  {SIZES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={size === option ? 'of-pill of-pill--active' : 'of-pill'}
                      onClick={() => setSize(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {errors.size && <span className="of-error">{errors.size}</span>}
              </div>

              <label className="of-field">
                <span className="of-label">Logo entreprise</span>
                <input className="of-input of-input-file" type="file" accept="image/*" onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)} />
              </label>

              <button
                type="button"
                className={`of-primary-btn ${submittingStep1 ? 'of-primary-btn--loading' : ''}`}
                onClick={() => { void validateStep1() }}
                disabled={submittingStep1}
              >
                {submittingStep1 ? 'Création en cours...' : "Créer l'espace →"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className={`of-step ${stepDirectionClass}`} key="step-2">
              <div className="of-icon">{ICON_MEMBERS}</div>
              <h2>Inviter votre équipe</h2>
              <p className="of-subtitle">
                Qui va contribuer à la transformation ? Vous pouvez inviter d&apos;autres personnes plus tard.
              </p>

              <div className="of-member-row">
                <input
                  className={errors.memberEmail ? 'of-input of-input--error' : 'of-input'}
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="email@entreprise.fr"
                />
                <select
                  className="of-input of-role-select"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as MemberRole)}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button type="button" className="of-add-btn" onClick={addMember}>
                  +
                </button>
              </div>
              {errors.memberEmail && <span className="of-error">{errors.memberEmail}</span>}

              <div className="of-members-list">
                {members.map((member) => (
                  <div key={member.email} className="of-member-item">
                    <div className="of-member-avatar" style={{ background: roleColor(member.role) }}>
                      {getInitialsFromEmail(member.email)}
                    </div>
                    <span className="of-member-email">{member.email}</span>
                    <span className="of-role-badge" style={{ color: roleColor(member.role), borderColor: roleColor(member.role) }}>
                      {member.role}
                    </span>
                    <button type="button" className="of-remove-btn" onClick={() => removeMember(member.email)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={`of-primary-btn ${submittingStep2 ? 'of-primary-btn--loading' : ''}`}
                onClick={() => { void submitInvitations() }}
                disabled={submittingStep2}
              >
                {submittingStep2 ? 'Création en cours...' : members.length > 0 ? 'Envoyer les invitations →' : 'Continuer →'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const ICON_FORGE = (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.7">
    <rect x="4" y="10" width="10" height="8" rx="2" />
    <path d="M14 10l6-3v11l-6-2z" />
  </svg>
)

const ICON_MEMBERS = (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.7">
    <circle cx="8" cy="8" r="3" />
    <circle cx="16" cy="9" r="2.5" />
    <path d="M3.5 18c0-3 2.3-5 4.5-5s4.5 2 4.5 5" />
    <path d="M13 18c.2-2.2 1.9-3.8 3.8-3.8S20.5 15.8 20.8 18" />
  </svg>
)

const CSS = `
.of-page {
  min-height: 100svh;
  background: var(--theme-bg-page);
  font-size: var(--fs-base);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.of-shell {
  width: 100%;
  max-width: 760px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.of-progress-wrap {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  position: relative;
  padding-top: 8px;
}

.of-progress-track {
  position: absolute;
  top: 24px;
  left: 40px;
  right: 40px;
  height: 1px;
  background: var(--theme-border);
}

.of-progress-track--filled {
  right: auto;
  background: var(--theme-accent);
  transition: width 280ms cubic-bezier(0.4, 0, 0.2, 1);
}

.of-progress-steps {
  position: relative;
  display: flex;
  justify-content: space-between;
}

.of-step-point {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.of-step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
}

.of-step-circle--passed {
  background: #10B981;
  color: #fff;
}

.of-step-circle--active {
  background: #fff;
  border: 2px solid var(--theme-accent);
  color: var(--theme-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--theme-accent) 22%, transparent);
}

.of-step-circle--future {
  background: transparent;
  border: 1px solid var(--theme-border);
  color: var(--theme-text-muted);
}

.of-step-label {
  font-size: 11px;
  color: var(--theme-text-muted);
}

.of-card {
  max-width: 560px;
  margin: 0 auto;
  width: 100%;
  padding: 48px;
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border);
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
  box-sizing: border-box;
  overflow: hidden;
}

.of-api-error {
  margin-bottom: 16px;
  border: 1px solid rgba(239,68,68,0.4);
  background: rgba(239,68,68,0.12);
  color: #B91C1C;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
}

.of-step {
  animation: ofSlideIn 280ms cubic-bezier(0.4, 0, 0.2, 1);
}

.of-step--forward { --of-x: 40px; }
.of-step--backward { --of-x: -40px; }

@keyframes ofSlideIn {
  from { opacity: 0; transform: translateX(var(--of-x)); }
  to { opacity: 1; transform: translateX(0); }
}

.of-icon {
  width: 32px;
  height: 32px;
  color: var(--theme-accent);
  margin-bottom: 12px;
}

.of-step h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--fs-title);
  font-weight: 700;
  color: var(--theme-text);
}

.of-subtitle {
  margin: 8px 0 32px;
  font-size: var(--fs-small);
  color: var(--theme-text-muted);
}

.of-cancel-btn {
  margin: -14px 0 18px;
  color: var(--theme-text-muted);
  font-size: var(--fs-small);
  font-weight: 600;
  text-decoration: underline;
}

.of-field { display: block; margin-bottom: 14px; }

.of-label {
  font-size: var(--fs-small);
  font-weight: 600;
  color: var(--theme-text);
  margin-bottom: 6px;
  display: block;
}

.of-label--required::after { content: ' •'; color: var(--theme-accent); }

.of-input {
  width: 100%;
  height: 48px;
  border: 1px solid var(--theme-border);
  border-radius: 10px;
  padding: 0 16px;
  font-size: var(--fs-base);
  background: var(--theme-bg-page);
  color: var(--theme-text);
  transition: border-color .2s, box-shadow .2s;
  box-sizing: border-box;
}

.of-input-file {
  padding-top: 10px;
}

.of-input:focus {
  border-color: var(--theme-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-accent) 18%, transparent);
  outline: none;
}

.of-input--error {
  border-color: #EF4444;
}

.of-error {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #EF4444;
}

.of-pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.of-pill {
  border: 1px solid var(--theme-border);
  border-radius: 999px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  color: var(--theme-text);
}

.of-pill--active {
  background: #8E3B46;
  border-color: #8E3B46;
  color: #fff;
}

.of-member-row {
  display: grid;
  grid-template-columns: 1fr 180px 40px;
  gap: 10px;
  margin-bottom: 10px;
}

.of-role-select { padding-right: 8px; }

.of-add-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--theme-accent);
  color: #fff;
  font-size: 22px;
  line-height: 1;
}

.of-members-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0 10px;
}

.of-member-item {
  display: grid;
  grid-template-columns: 32px 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--theme-border);
  border-radius: 10px;
}

.of-member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
}

.of-member-email {
  font-size: 14px;
  color: var(--theme-text);
  overflow: hidden;
  text-overflow: ellipsis;
}

.of-role-badge {
  border: 1px solid;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
}

.of-remove-btn {
  color: var(--theme-text-muted);
  font-size: 14px;
}

.of-link-btn {
  margin: 4px 0 14px;
  font-size: 13px;
  color: var(--theme-text-muted);
  text-decoration: underline;
}

.of-textarea {
  min-height: 88px;
  height: auto;
  padding: 10px 16px;
  resize: vertical;
}

.of-primary-btn {
  width: 100%;
  height: 52px;
  background: var(--theme-accent);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  font-family: var(--font-display);
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background .2s, transform .1s, box-shadow .2s;
}

.of-primary-btn:hover {
  background: color-mix(in srgb, var(--theme-accent) 84%, black);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--theme-accent) 34%, transparent);
}

.of-primary-btn:active { transform: translateY(0); }

.of-primary-btn:disabled,
.of-primary-btn--loading {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@media (max-width: 760px) {
  .of-card { padding: 28px 18px; }
  .of-member-row { grid-template-columns: 1fr; }
}
`
