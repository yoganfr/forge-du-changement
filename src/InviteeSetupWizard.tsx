import { useState } from 'react'
import {
  createUser,
  getAcceptedInvitationAwaitingUserRow,
  markInvitationsAcceptedForWorkspaceEmail,
  updateUser,
} from './lib/api'
import type { User } from './lib/types'
import { supabase } from './lib/supabase'

export type InviteeSetupWizardProps = {
  companyName: string
  workspaceId: string
  /** Création depuis invitation (`users` absent) ou complétion profil vide */
  mode: 'invitation' | 'incomplete_profile'
  dbRole: User['role']
  existingUserId: string | null
  onCompleted: () => Promise<void>
}

const MIN_PASSWORD_LEN = 8

export default function InviteeSetupWizard({
  companyName,
  workspaceId,
  mode,
  dbRole,
  existingUserId,
  onCompleted,
}: InviteeSetupWizardProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function persistProfile(): Promise<void> {
    const prenom = firstName.trim()
    const nom = lastName.trim()
    const job = jobTitle.trim()
    if (!prenom || !nom) {
      throw new Error('Le prénom et le nom sont obligatoires.')
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const authEmail = session?.user?.email?.trim().toLowerCase()
    if (!authEmail) throw new Error('Session sans email.')

    let inheritedDirectionId: string | null = null
    let inheritedTrigram: string | null = null
    try {
      const accepted = await getAcceptedInvitationAwaitingUserRow(authEmail)
      inheritedDirectionId = accepted?.direction_id ?? null
      inheritedTrigram = accepted?.trigram?.trim().toUpperCase() || null
    } catch {
      /* idem ProfileSheet */
    }

    if (mode === 'incomplete_profile' && existingUserId) {
      await updateUser(
        existingUserId,
        {
          prenom,
          nom,
          job_title: job || null,
          status: 'actif',
        },
        { workspace_id: workspaceId },
      )
      return
    }

    const created = await createUser({
      workspace_id: workspaceId,
      email: authEmail,
      prenom,
      nom,
      job_title: job || null,
      avatar_url: null,
      role: dbRole,
      direction_type: 'Fonctionnel',
      direction_nom: null,
      direction_id: inheritedDirectionId,
      managed_count: 0,
      total_effectif: 0,
      trigram: inheritedTrigram,
      status: 'actif',
    })
    try {
      await markInvitationsAcceptedForWorkspaceEmail(workspaceId, authEmail)
    } catch {
      /* idempotent */
    }
    localStorage.setItem('lfdc-user-id', created.id)
  }

  async function handleFinish() {
    setError(null)
    const pwd = password.trim()
    const pwd2 = passwordConfirm.trim()
    if (pwd || pwd2) {
      if (pwd.length < MIN_PASSWORD_LEN) {
        setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères, ou laissez vide.`)
        return
      }
      if (pwd !== pwd2) {
        setError('Les mots de passe ne correspondent pas.')
        return
      }
    }

    const prenom = firstName.trim()
    const nom = lastName.trim()
    if (!prenom || !nom) {
      setError('Indiquez votre prénom et votre nom.')
      return
    }

    setSubmitting(true)
    try {
      if (pwd) {
        const { error: pwdErr } = await supabase.auth.updateUser({ password: pwd })
        // `same_password` ne doit pas bloquer la creation du profil : un retry apres
        // un echec partiel (ex. profil non cree) re-soumet souvent le meme mot de passe.
        if (pwdErr && (pwdErr as { code?: string }).code !== 'same_password') {
          throw pwdErr
        }
      }
      // Synchroniser les jetons locaux apres changement de mot de passe (ou no-op si pas de pwd).
      const { error: refErr } = await supabase.auth.refreshSession()
      if (refErr) throw refErr
      await persistProfile()
      await onCompleted()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Impossible d’enregistrer votre profil.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="invite-setup">
      <style>{CSS}</style>
      <div className="invite-setup__panel" role="dialog" aria-labelledby="invite-setup-title">
        <p className="invite-setup__step">
          Étape {step} sur 2
        </p>
        <h1 id="invite-setup-title" className="invite-setup__title">
          {step === 1 ? 'Sécuriser votre compte' : 'Votre identité'}
        </h1>
        <p className="invite-setup__lead">
          {step === 1
            ? `Bienvenue dans ${companyName || 'votre espace'}. Vous pouvez définir un mot de passe pour vous connecter avec email et mot de passe (en plus du lien reçu par mail).`
            : 'Renseignez les informations affichées aux autres membres de l’espace.'}
        </p>

        {error ? <p className="invite-setup__error" role="alert">{error}</p> : null}

        {step === 1 ? (
          <>
            <label className="invite-setup__label">
              Mot de passe (facultatif)
              <input
                type="password"
                className="invite-setup__input"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`Au moins ${MIN_PASSWORD_LEN} caractères`}
              />
            </label>
            <label className="invite-setup__label">
              Confirmer le mot de passe
              <input
                type="password"
                className="invite-setup__input"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </label>
            <div className="invite-setup__actions">
              <button
                type="button"
                className="invite-setup__btn invite-setup__btn--secondary"
                onClick={() => {
                  setError(null)
                  setStep(2)
                }}
              >
                Continuer sans mot de passe
              </button>
              <button
                type="button"
                className="invite-setup__btn invite-setup__btn--primary"
                onClick={() => {
                  setError(null)
                  const p = password.trim()
                  const p2 = passwordConfirm.trim()
                  if (!p && !p2) {
                    setError('Saisissez un mot de passe ou utilisez « Continuer sans mot de passe ».')
                    return
                  }
                  if (p.length < MIN_PASSWORD_LEN) {
                    setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères.`)
                    return
                  }
                  if (p !== p2) {
                    setError('Les mots de passe ne correspondent pas.')
                    return
                  }
                  setStep(2)
                }}
              >
                Continuer
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="invite-setup__label">
              Prénom <span className="invite-setup__req">*</span>
              <input
                className="invite-setup__input"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </label>
            <label className="invite-setup__label">
              Nom <span className="invite-setup__req">*</span>
              <input
                className="invite-setup__input"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>
            <label className="invite-setup__label">
              Poste
              <input
                className="invite-setup__input"
                autoComplete="organization-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </label>
            <div className="invite-setup__actions">
              <button
                type="button"
                className="invite-setup__btn invite-setup__btn--secondary"
                disabled={submitting}
                onClick={() => {
                  setError(null)
                  setStep(1)
                }}
              >
                Retour
              </button>
              <button
                type="button"
                className="invite-setup__btn invite-setup__btn--primary"
                disabled={submitting}
                onClick={() => void handleFinish()}
              >
                {submitting ? 'Enregistrement…' : 'Accéder à mon espace'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const CSS = `
.invite-setup {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, var(--theme-bg-page) 92%, black);
  font-family: var(--font-body);
  color: var(--theme-text);
  box-sizing: border-box;
}
.invite-setup__panel {
  width: 100%;
  max-width: 420px;
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-lg, 12px);
  padding: clamp(20px, 4vw, 28px);
  box-shadow: var(--shadow-lg, 0 16px 48px rgba(0,0,0,0.15));
}
.invite-setup__step {
  margin: 0 0 8px;
  font-size: var(--text-sm);
  color: var(--theme-text-muted);
}
.invite-setup__title {
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--theme-text);
}
.invite-setup__lead {
  margin: 0 0 20px;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--theme-text-muted);
}
.invite-setup__error {
  margin: 0 0 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--theme-accent) 12%, transparent);
  color: var(--theme-text);
  font-size: 0.9rem;
}
.invite-setup__label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--theme-text);
}
.invite-setup__req { color: var(--theme-accent); }
.invite-setup__input {
  font: inherit;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--theme-border);
  background: var(--theme-bg-page);
  color: var(--theme-text);
}
.invite-setup__input:focus {
  outline: 2px solid color-mix(in srgb, var(--theme-accent) 45%, transparent);
  outline-offset: 1px;
}
.invite-setup__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
  justify-content: flex-end;
}
.invite-setup__btn {
  appearance: none;
  cursor: pointer;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 0.9rem;
  border: 1px solid var(--theme-border);
}
.invite-setup__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.invite-setup__btn--primary {
  background: var(--theme-accent);
  color: #fff;
  border-color: transparent;
}
.invite-setup__btn--secondary {
  background: transparent;
  color: var(--theme-text);
}
`
