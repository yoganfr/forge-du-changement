import { useEffect, useState } from 'react'
import {
  createUser,
  getAcceptedInvitationAwaitingUserRow,
  getWorkspaceDirections,
  markInvitationsAcceptedForWorkspaceEmail,
  updateUser,
} from './lib/api'
import type { Direction, User } from './lib/types'
import { formatClientErrorMessage } from './lib/formatClientErrorMessage'
import type { ProfileDirectionType } from './lib/profileDirectionResolve'
import { resolveOrCreateMemberDirection } from './lib/profileDirectionResolve'
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

function mapProfileDirectionTypeToDb(t: ProfileDirectionType): User['direction_type'] {
  if (t === 'metier') return 'Métier'
  if (t === 'geographique') return 'Géographique'
  return 'Fonctionnel'
}

function directionTypeFromDbRow(type: Direction['type']): User['direction_type'] {
  if (type === 'Métier' || type === 'Géographique' || type === 'Fonctionnel') return type
  return 'Fonctionnel'
}

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

  /** Directions métier du workspace (hors transverse) — étape 2 invitation. */
  const [nonTransverseDirections, setNonTransverseDirections] = useState<Direction[]>([])
  const [directionsLoading, setDirectionsLoading] = useState(false)
  const [directionSyncError, setDirectionSyncError] = useState<string | null>(null)
  /** `direction_id` porté par l’invitation (ex. contributeur invité par un CODIR en revue). */
  const [invitationDirectionId, setInvitationDirectionId] = useState<string | null>(null)
  const [invitationDirectionNom, setInvitationDirectionNom] = useState<string | null>(null)
  /** Choix CODIR / contributeur sans direction sur l’invitation : id réel ou `__new__`. */
  const [memberDirectionPick, setMemberDirectionPick] = useState('')
  const [newDirectionName, setNewDirectionName] = useState('')
  const [newDirectionType, setNewDirectionType] = useState<ProfileDirectionType>('fonctionnel')

  useEffect(() => {
    if (step !== 2 || mode !== 'invitation' || !workspaceId) return
    let cancelled = false
    setDirectionSyncError(null)
    setDirectionsLoading(true)
    void (async () => {
      try {
        const dirs = await getWorkspaceDirections(workspaceId)
        if (cancelled) return
        const nonT = dirs.filter((d) => !d.is_transverse)
        setNonTransverseDirections(nonT)

        const {
          data: { session },
        } = await supabase.auth.getSession()
        const em = session?.user?.email?.trim().toLowerCase() ?? ''
        let invDir: string | null = null
        if (em) {
          try {
            const inv = await getAcceptedInvitationAwaitingUserRow(em)
            invDir = inv?.direction_id ?? null
          } catch {
            /* RLS */
          }
        }
        if (cancelled) return
        setInvitationDirectionId(invDir)
        if (invDir) {
          const row = nonT.find((d) => d.id === invDir)
          setInvitationDirectionNom(row?.nom ?? null)
        } else {
          setInvitationDirectionNom(null)
        }

        if (dbRole === 'codir' && invDir && nonT.some((d) => d.id === invDir)) {
          setMemberDirectionPick(invDir)
        } else if (dbRole === 'codir' && nonT.length === 0) {
          setMemberDirectionPick('__new__')
        } else {
          setMemberDirectionPick('')
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Impossible de charger les directions.'
          setDirectionSyncError(msg)
        }
      } finally {
        if (!cancelled) setDirectionsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [step, mode, workspaceId, dbRole])

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
    const authUserId = session?.user?.id?.trim()
    const authEmail = session?.user?.email?.trim().toLowerCase()
    if (!authEmail) throw new Error('Session sans email.')
    if (!authUserId) throw new Error('Session sans identifiant utilisateur.')

    let invitationDirId: string | null = null
    let inheritedTrigram: string | null = null
    try {
      const accepted = await getAcceptedInvitationAwaitingUserRow(authEmail)
      invitationDirId = accepted?.direction_id ?? null
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

    let resolvedDirectionId: string | null = null
    let resolvedDirectionNom: string | null = null
    let resolvedDirectionType: User['direction_type'] = 'Fonctionnel'

    if (mode === 'invitation' && workspaceId && (dbRole === 'codir' || dbRole === 'contributeur')) {
      if (dbRole === 'contributeur' && invitationDirId) {
        const dirs = await getWorkspaceDirections(workspaceId)
        const row = dirs.find((d) => d.id === invitationDirId)
        resolvedDirectionId = invitationDirId
        resolvedDirectionNom = row?.nom?.trim() ?? null
        resolvedDirectionType = directionTypeFromDbRow(row?.type ?? null)
      } else if (dbRole === 'codir' || (dbRole === 'contributeur' && !invitationDirId)) {
        if (!memberDirectionPick) {
          throw new Error('Indiquez votre direction dans l’entreprise (liste ou création).')
        }
        if (memberDirectionPick === '__new__') {
          const nm = newDirectionName.trim()
          if (!nm) {
            throw new Error('Saisissez le nom de la nouvelle direction.')
          }
          try {
            resolvedDirectionId = await resolveOrCreateMemberDirection(
              workspaceId,
              nm,
              newDirectionType,
            )
          } catch (dirErr) {
            const detail = formatClientErrorMessage(dirErr)
            throw new Error(
              `Impossible de créer la direction (« ${detail} »). Vérifiez vos droits ou demandez à un consultant d’initialiser les directions.`,
            )
          }
          if (!resolvedDirectionId) {
            throw new Error('La direction n’a pas pu être créée. Réessayez ou contactez un administrateur.')
          }
          resolvedDirectionNom = nm
          resolvedDirectionType = mapProfileDirectionTypeToDb(newDirectionType)
        } else {
          const dirsFresh = await getWorkspaceDirections(workspaceId)
          const row = dirsFresh.filter((d) => !d.is_transverse).find((d) => d.id === memberDirectionPick)
          if (!row) {
            throw new Error('Direction choisie introuvable. Rechargez la page et réessayez.')
          }
          resolvedDirectionId = row.id
          resolvedDirectionNom = row.nom?.trim() ?? null
          resolvedDirectionType = directionTypeFromDbRow(row.type)
        }
      }
    }

    const created = await createUser({
      id: authUserId,
      workspace_id: workspaceId,
      email: authEmail,
      prenom,
      nom,
      job_title: job || null,
      avatar_url: null,
      role: dbRole,
      direction_type: resolvedDirectionType,
      direction_nom: resolvedDirectionNom,
      direction_id: resolvedDirectionId,
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

    if (mode === 'invitation' && workspaceId && (dbRole === 'codir' || dbRole === 'contributeur')) {
      if (directionsLoading) {
        setError('Chargement des directions en cours — patientez un instant puis réessayez.')
        return
      }
      if (directionSyncError) {
        setError(directionSyncError)
        return
      }
      if (dbRole === 'contributeur' && invitationDirectionId) {
        /* direction imposée par l’invitation (ex. CODIR en revue roadmap) */
      } else if (dbRole === 'codir' || (dbRole === 'contributeur' && !invitationDirectionId)) {
        if (!memberDirectionPick) {
          setError('Sélectionnez votre direction dans la liste, ou « Créer une nouvelle direction ».')
          return
        }
        if (memberDirectionPick === '__new__' && !newDirectionName.trim()) {
          setError('Indiquez le nom de la nouvelle direction.')
          return
        }
      }
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

            {mode === 'invitation' && workspaceId && (dbRole === 'codir' || dbRole === 'contributeur') ? (
              <div className="invite-setup__direction-block">
                {directionsLoading ? (
                  <p className="invite-setup__hint">Chargement des directions…</p>
                ) : directionSyncError ? (
                  <p className="invite-setup__error" role="alert">
                    {directionSyncError}
                  </p>
                ) : (
                  <>
                    {dbRole === 'contributeur' && invitationDirectionId ? (
                      <p className="invite-setup__hint">
                        Vous rejoignez la direction{' '}
                        <strong>{invitationDirectionNom ?? 'indiquée sur votre invitation'}</strong>
                        {' '}
                        (rattachement défini par le membre du CODIR qui vous a invité, par exemple lors d’une revue
                        roadmap).
                      </p>
                    ) : null}

                    {dbRole === 'codir' || (dbRole === 'contributeur' && !invitationDirectionId) ? (
                      <>
                        <label className="invite-setup__label" htmlFor="invite-member-direction">
                          Votre direction dans l’entreprise <span className="invite-setup__req">*</span>
                        </label>
                        <select
                          id="invite-member-direction"
                          className="invite-setup__select"
                          value={memberDirectionPick}
                          onChange={(e) => setMemberDirectionPick(e.target.value)}
                          aria-describedby="invite-direction-help"
                        >
                          <option value="">— Choisir une direction —</option>
                          {nonTransverseDirections.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.nom}
                            </option>
                          ))}
                          <option value="__new__">Créer une nouvelle direction…</option>
                        </select>
                        <p id="invite-direction-help" className="invite-setup__hint">
                          Cette direction sert pour <strong>Projets transformants</strong> et votre roadmap une fois
                          les projets validés par le décideur.
                        </p>
                        {memberDirectionPick === '__new__' ? (
                          <>
                            <label className="invite-setup__label" htmlFor="invite-new-dir-name">
                              Nom de la nouvelle direction <span className="invite-setup__req">*</span>
                            </label>
                            <input
                              id="invite-new-dir-name"
                              className="invite-setup__input"
                              value={newDirectionName}
                              onChange={(e) => setNewDirectionName(e.target.value)}
                              placeholder="ex. Direction Ressources Humaines"
                            />
                            <label className="invite-setup__label" htmlFor="invite-new-dir-type">
                              Type de direction
                            </label>
                            <select
                              id="invite-new-dir-type"
                              className="invite-setup__select"
                              value={newDirectionType}
                              onChange={(e) =>
                                setNewDirectionType(e.target.value as ProfileDirectionType)
                              }
                            >
                              <option value="fonctionnel">Fonctionnel</option>
                              <option value="metier">Métier</option>
                              <option value="geographique">Géographique</option>
                            </select>
                          </>
                        ) : null}
                      </>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}

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
  max-width: 460px;
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
.invite-setup__direction-block {
  margin-bottom: 16px;
  padding-top: 4px;
  border-top: 1px solid var(--theme-border);
}
.invite-setup__hint {
  margin: 0 0 12px;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--theme-text-muted);
}
.invite-setup__select {
  font: inherit;
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 10px;
  border-radius: 8px;
  border: 1px solid var(--theme-border);
  background: var(--theme-bg-page);
  color: var(--theme-text);
}
.invite-setup__select:focus {
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
