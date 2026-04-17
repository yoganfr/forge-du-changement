import { useEffect, useMemo, useRef, useState } from 'react'
import { sendInvitationMagicLink } from './lib/auth'
import {
  createInvitation,
  getWorkspaceInvitations,
  getWorkspaceUsers,
  isStorageBucketNotFound,
  updateWorkspace,
  uploadImageToStorage,
} from './lib/api'
import type { Invitation, User } from './lib/types'

export interface CompanyMember {
  email: string
  role: string
  status?: 'invité' | 'actif'
  /** Synthèse invitation + profil / connexion */
  detail?: string
  pillLabel?: string
  pillVariant?: 'active' | 'invited' | 'pending' | 'expired' | 'inactive'
}

type InviteFormRole = 'Membre CODIR' | 'Pilote de projet' | 'Contributeur'

const INVITE_ROLE_OPTIONS: InviteFormRole[] = ['Membre CODIR', 'Pilote de projet', 'Contributeur']

function mapApiRoleToLabel(role: string): string {
  const r = role.toLowerCase()
  if (r === 'codir') return 'Membre CODIR'
  if (r === 'pilote') return 'Pilote de projet'
  if (r === 'contributeur') return 'Contributeur'
  if (r === 'consultant') return 'Consultant'
  return role
}

function toInvitationRole(role: InviteFormRole): 'codir' | 'pilote' | 'contributeur' {
  if (role === 'Membre CODIR') return 'codir'
  if (role === 'Pilote de projet') return 'pilote'
  return 'contributeur'
}

function summarizeUserRow(user: User, invitation: Invitation | undefined): { detail: string; pillLabel: string; pillVariant: CompanyMember['pillVariant'] } {
  const bits: string[] = []
  if (invitation) {
    if (invitation.status === 'en_attente') bits.push('Invitation en attente d’acceptation')
    else if (invitation.status === 'expiree') bits.push('Dernière invitation expirée')
    else if (invitation.status === 'acceptee') bits.push('Email de connexion confirmé (Supabase Auth)')
    else bits.push('Invitation mise à jour')
  }
  if (user.status === 'actif') {
    bits.push('Profil rattaché à l’espace — compte actif (connexion enregistrée)')
    return { detail: bits.join(' · '), pillLabel: 'Actif', pillVariant: 'active' }
  }
  if (user.status === 'invite') {
    bits.push('Profil invité : pas encore compte actif / première connexion à finaliser')
    return { detail: bits.join(' · '), pillLabel: 'Invité', pillVariant: 'invited' }
  }
  bits.push('Compte marqué inactif')
  return { detail: bits.join(' · '), pillLabel: 'Inactif', pillVariant: 'inactive' }
}

function summarizeInviteOnlyRow(inv: Invitation): { detail: string; pillLabel: string; pillVariant: CompanyMember['pillVariant'] } {
  if (inv.status === 'en_attente') {
    return {
      detail: 'Invitation envoyée — la personne n’a pas encore accepté ni créé de profil actif dans cet espace.',
      pillLabel: 'En attente',
      pillVariant: 'pending',
    }
  }
  if (inv.status === 'expiree') {
    return {
      detail: 'Invitation expirée — renvoyer une invitation si la personne doit rejoindre l’espace.',
      pillLabel: 'Expirée',
      pillVariant: 'expired',
    }
  }
  return {
    detail:
      'Email confirmé côté Auth — complétez votre profil via « Mon profil » pour activer le compte dans l’espace.',
    pillLabel: 'Acceptée',
    pillVariant: 'invited',
  }
}

function mergeUsersAndInvitations(users: User[], invitations: Invitation[]): CompanyMember[] {
  const key = (e: string) => e.trim().toLowerCase()
  const byEmail = new Map<string, CompanyMember>()
  const invByEmail = new Map<string, Invitation>()
  for (const inv of invitations) {
    invByEmail.set(key(inv.email), inv)
  }
  for (const user of users) {
    const k = key(user.email)
    const invitation = invByEmail.get(k)
    const { detail, pillLabel, pillVariant } = summarizeUserRow(user, invitation)
    byEmail.set(k, {
      email: user.email,
      role: mapApiRoleToLabel(user.role),
      status: user.status === 'actif' ? 'actif' : 'invité',
      detail,
      pillLabel,
      pillVariant,
    })
  }
  for (const inv of invitations) {
    const k = key(inv.email)
    if (byEmail.has(k)) continue
    const { detail, pillLabel, pillVariant } = summarizeInviteOnlyRow(inv)
    byEmail.set(k, {
      email: inv.email,
      role: mapApiRoleToLabel(inv.role),
      status: 'invité',
      detail,
      pillLabel,
      pillVariant,
    })
  }
  return Array.from(byEmail.values()).sort((a, b) => a.email.localeCompare(b.email, 'fr'))
}

function inviteApiErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim()
    if (message) return message
  }
  return 'Impossible d’envoyer l’invitation.'
}

function pillClass(variant: CompanyMember['pillVariant']): string {
  if (variant === 'active') return 'cs-status cs-status--active'
  if (variant === 'pending') return 'cs-status cs-status--pending'
  if (variant === 'expired') return 'cs-status cs-status--expired'
  if (variant === 'inactive') return 'cs-status cs-status--inactive'
  return 'cs-status cs-status--invited'
}

/** Lignes où un renvoi du magic link Auth a encore du sens (pas encore compte actif dans l’espace). */
function memberCanReceiveInviteResend(member: CompanyMember): boolean {
  const pillVariant = member.pillVariant ?? (member.status === 'actif' ? 'active' : 'invited')
  return pillVariant !== 'active'
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

/** Inviter des membres entreprise (unitaire, lot CSV, renvoi mail) : consultants + CODIR. */
function canInviteMembers(role: CompanySheetProps['currentUserRole']) {
  return role === 'consultant' || role === 'admin' || role === 'codir'
}

function parseRoleCell(raw: string | undefined): InviteFormRole {
  if (!raw?.trim()) return 'Contributeur'
  const t = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (t.includes('codir') || t === 'codir') return 'Membre CODIR'
  if (t.includes('pilote') || t.includes('chef') || t === 'pilote') return 'Pilote de projet'
  return 'Contributeur'
}

function parseInvitationCsv(
  raw: string,
  defaultRole: InviteFormRole,
): { rows: Array<{ email: string; role: InviteFormRole }>; lineErrors: string[] } {
  const lines = raw
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return { rows: [], lineErrors: ['Aucune ligne à traiter.'] }
  let start = 0
  if (/^email\b/i.test(lines[0])) start = 1
  const rows: Array<{ email: string; role: InviteFormRole }> = []
  const lineErrors: string[] = []
  for (let i = start; i < lines.length; i++) {
    const lineNum = i + 1
    const line = lines[i]
    const parts = line.includes(';') ? line.split(';') : line.split(',')
    const email = parts[0]?.trim().toLowerCase() ?? ''
    const roleCell = parts[1]?.trim()
    if (!email) {
      lineErrors.push(`Ligne ${lineNum} : email manquant`)
      continue
    }
    if (!email.includes('@')) {
      lineErrors.push(`Ligne ${lineNum} : email invalide (${email})`)
      continue
    }
    rows.push({ email, role: roleCell ? parseRoleCell(roleCell) : defaultRole })
  }
  const seen = new Set<string>()
  const deduped: Array<{ email: string; role: InviteFormRole }> = []
  for (const r of rows) {
    if (seen.has(r.email)) continue
    seen.add(r.email)
    deduped.push(r)
  }
  return { rows: deduped, lineErrors }
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
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [remoteMembers, setRemoteMembers] = useState<CompanyMember[] | null>(null)
  const [membersRefreshKey, setMembersRefreshKey] = useState(0)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<InviteFormRole>('Contributeur')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [resendingEmail, setResendingEmail] = useState<string | null>(null)
  const [resendBanner, setResendBanner] = useState<{ ok: boolean; text: string } | null>(null)
  const [csvText, setCsvText] = useState('')
  const [batchDefaultRole, setBatchDefaultRole] = useState<InviteFormRole>('Contributeur')
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [batchSummary, setBatchSummary] = useState<string | null>(null)

  useEffect(() => {
    setLogoUrl(companyLogoProp ?? null)
    setLogoFile(null)
  }, [companyLogoProp])

  useEffect(() => {
    setDraftName(companyName)
    setDraftSector(sector)
    setDraftSize(size)
  }, [companyName, sector, size])

  const roleLabel = getRoleLabel(currentUserRole)
  const roleColor =
    currentUserRole === 'consultant' || currentUserRole === 'admin' || currentUserRole === 'codir'
      ? '#8E3B46'
      : '#4C86A8'
  const initials = useMemo(() => getInitials(draftName), [draftName])
  const canEdit = canEditCompany(currentUserRole)
  const canInvite = canInviteMembers(currentUserRole)
  const mergedMembers = remoteMembers ?? members

  function onLogoFile(file: File | null) {
    if (!file) {
      setLogoUrl(null)
      setLogoFile(null)
      return
    }
    setLogoFile(file)
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
        setRemoteMembers(mergeUsersAndInvitations(users, invitations))
      } catch {
        setRemoteMembers(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workspaceId, membersRefreshKey])

  async function submitSingleInvitation() {
    if (!workspaceId) return
    const email = inviteEmail.trim().toLowerCase()
    setInviteError(null)
    setInviteSuccess(null)
    if (!email || !email.includes('@')) {
      setInviteError('Saisissez une adresse email valide.')
      return
    }
    setInviteSubmitting(true)
    try {
      await createInvitation({
        workspace_id: workspaceId,
        email,
        role: toInvitationRole(inviteRole),
      })
      try {
        await sendInvitationMagicLink(email)
        setInviteSuccess(
          `Invitation enregistrée. Un email avec un lien de connexion a été envoyé à ${email}.`,
        )
      } catch (mailErr) {
        setInviteSuccess(
          `Invitation enregistrée pour ${email}. L’email automatique n’a pas pu être envoyé (${inviteApiErrorMessage(mailErr)}). Vérifiez Auth → Email dans Supabase, ou utilisez « Mot de passe oublié » sur l’écran de connexion.`,
        )
      }
      setInviteEmail('')
      setMembersRefreshKey((k) => k + 1)
    } catch (err) {
      setInviteError(inviteApiErrorMessage(err))
    } finally {
      setInviteSubmitting(false)
    }
  }

  async function submitBatchInvitations() {
    if (!workspaceId) return
    setInviteError(null)
    setInviteSuccess(null)
    setBatchSummary(null)
    const { rows, lineErrors } = parseInvitationCsv(csvText, batchDefaultRole)
    if (rows.length === 0 && lineErrors.length > 0) {
      setInviteError(lineErrors.join(' '))
      return
    }
    if (rows.length === 0) {
      setInviteError('Collez au moins une ligne avec une adresse email.')
      return
    }
    setBatchSubmitting(true)
    try {
      let ok = 0
      let mailFail = 0
      const rowErrors: string[] = [...lineErrors]
      for (const { email, role } of rows) {
        try {
          await createInvitation({
            workspace_id: workspaceId,
            email,
            role: toInvitationRole(role),
          })
          ok += 1
          try {
            await sendInvitationMagicLink(email)
          } catch {
            mailFail += 1
          }
        } catch (e) {
          rowErrors.push(`${email} : ${inviteApiErrorMessage(e)}`)
        }
      }
      setCsvText('')
      setMembersRefreshKey((k) => k + 1)
      const parts = [`${ok} invitation(s) enregistrée(s).`]
      if (mailFail > 0) {
        parts.push(`${mailFail} email(s) de connexion non envoyés (réessayez ou « Renvoyer l’email »).`)
      }
      if (rowErrors.length > 0) {
        parts.push(`Détail : ${rowErrors.slice(0, 8).join(' ')}${rowErrors.length > 8 ? '…' : ''}`)
      }
      setBatchSummary(parts.join(' '))
    } finally {
      setBatchSubmitting(false)
    }
  }

  async function resendInvitationEmail(rawEmail: string) {
    const email = rawEmail.trim().toLowerCase()
    if (!email) return
    setResendBanner(null)
    setResendingEmail(email)
    try {
      await sendInvitationMagicLink(email)
      setResendBanner({ ok: true, text: `Lien de connexion renvoyé à ${email}.` })
    } catch (err) {
      setResendBanner({ ok: false, text: inviteApiErrorMessage(err) })
    } finally {
      setResendingEmail(null)
    }
  }

  async function persist() {
    setSaveError(null)
    setSaving(true)
    try {
      const remoteBefore =
        (companyLogoProp?.startsWith('http') ? companyLogoProp : null)
        ?? (logoUrl?.startsWith('http') ? logoUrl : null)

      let logoForDb: string | null = remoteBefore

      if (logoUrl === null && !logoFile) {
        logoForDb = null
      } else if (workspaceId && logoFile) {
        try {
          logoForDb = await uploadImageToStorage({
            file: logoFile,
            folder: 'workspaces/logos',
            filenamePrefix: draftName.trim() || 'workspace',
          })
        } catch (uploadError) {
          if (isStorageBucketNotFound(uploadError)) {
            setSaveError("Bucket Storage introuvable (assets). Le logo n'a pas été uploadé, mais les autres modifications seront enregistrées.")
            logoForDb = remoteBefore
          } else {
            throw uploadError
          }
        }
      } else if (!logoFile && logoUrl?.startsWith('http')) {
        logoForDb = logoUrl
      }

      if (workspaceId) {
        let updated = await updateWorkspace(workspaceId, {
          company_name: draftName.trim() || companyName,
          sector: draftSector || null,
          size: (draftSize || null) as 'PME' | 'ETI' | 'Grand groupe' | null,
          logo_url: logoForDb,
        })
        if (logoForDb && !updated.logo_url) {
          updated = await updateWorkspace(workspaceId, { logo_url: logoForDb })
        }
        setLogoFile(null)
        setLogoUrl(updated.logo_url ?? null)
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
                const pillLabel =
                  member.pillLabel ?? (member.status === 'actif' ? 'Actif' : 'Invité')
                const pillVariant = member.pillVariant ?? (member.status === 'actif' ? 'active' : 'invited')
                const emailKey = member.email.trim().toLowerCase()
                const showResend =
                  canInvite && workspaceId && memberCanReceiveInviteResend(member)
                return (
                  <div key={`${member.email}-${idx}`} className="cs-member-row">
                    <div className="cs-member-avatar" style={{ background: badgeColor }}>
                      {getInitials(getEmailLocal(member.email))}
                    </div>
                    <div className="cs-member-main">
                      <span className="cs-member-email">{member.email}</span>
                      {member.detail && (
                        <span className="cs-member-detail">{member.detail}</span>
                      )}
                      {showResend && (
                        <button
                          type="button"
                          className="cs-member-resend"
                          disabled={resendingEmail === emailKey}
                          onClick={() => { void resendInvitationEmail(member.email) }}
                        >
                          {resendingEmail === emailKey ? 'Envoi en cours…' : 'Renvoyer l’email de connexion'}
                        </button>
                      )}
                    </div>
                    <span className="cs-member-role" style={{ borderColor: badgeColor, color: badgeColor }}>
                      {member.role}
                    </span>
                    <span className={pillClass(pillVariant)}>
                      {pillLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          {resendBanner && (
            <p
              className={
                resendBanner.ok ? 'cs-invite-msg cs-invite-msg--ok cs-resend-banner' : 'cs-invite-msg cs-invite-msg--error cs-resend-banner'
              }
            >
              {resendBanner.text}
            </p>
          )}
        </div>

        {canInvite && workspaceId && (
          <div className="cs-section cs-section--invite">
            <h3>Inviter un membre</h3>
            <p className="cs-invite-lead">
              Une invitation est créée dans l’espace ; le statut de chaque personne (acceptation, profil, connexion)
              apparaît dans la liste ci-dessus après actualisation. Les{' '}
              <strong>consultants</strong> (y compris invités sur le dossier) et les{' '}
              <strong>membres CODIR</strong> peuvent inviter des personnes de l’entreprise cliente.
            </p>
            <p className="cs-invite-warn">
              Si vous êtes connecté en tant que consultant sur ce navigateur, ouvrez le lien reçu par l’invité dans un
              autre navigateur ou une fenêtre privée : sinon la session consultant est remplacée par celle de l’invité
              et vous ne verrez plus qu’un seul espace entreprise.
            </p>
            <div className="cs-invite-row">
              <label className="cs-invite-field">
                <span className="cs-label">Email</span>
                <input
                  type="email"
                  className="cs-edit-input"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="prenom.nom@entreprise.com"
                  autoComplete="email"
                />
              </label>
              <label className="cs-invite-field cs-invite-field--role">
                <span className="cs-label">Rôle</span>
                <select
                  className="cs-edit-input cs-edit-input--select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as InviteFormRole)}
                >
                  {INVITE_ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="cs-invite-submit"
                onClick={() => { void submitSingleInvitation() }}
                disabled={inviteSubmitting}
              >
                {inviteSubmitting ? 'Envoi…' : 'Envoyer l’invitation'}
              </button>
            </div>
            {inviteError && <p className="cs-invite-msg cs-invite-msg--error">{inviteError}</p>}
            {inviteSuccess && <p className="cs-invite-msg cs-invite-msg--ok">{inviteSuccess}</p>}

            <h4 className="cs-invite-batch-title">Invitation par lot (CSV)</h4>
            <label className="cs-batch-file-label">
              <span className="cs-label">Importer un fichier .csv</span>
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                className="cs-batch-file"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    setCsvText(typeof reader.result === 'string' ? reader.result : '')
                  }
                  reader.readAsText(f, 'UTF-8')
                  e.target.value = ''
                }}
              />
            </label>
            <p className="cs-invite-batch-hint">
              Après accord avec le client sur la liste des personnes : une ligne par email. Colonnes{' '}
              <strong>email</strong> puis <strong>role</strong> (séparateur virgule ou point-virgule). Rôle optionnel :
              sinon le rôle par défaut ci-dessous s’applique. Valeurs reconnues : codir / pilote / contributeur, ou
              Membre CODIR / Pilote de projet / Contributeur. Première ligne optionnelle :{' '}
              <code>email,role</code>
            </p>
            <label className="cs-invite-field cs-invite-field--batch-role">
              <span className="cs-label">Rôle par défaut (si absent par ligne)</span>
              <select
                className="cs-edit-input cs-edit-input--select"
                value={batchDefaultRole}
                onChange={(e) => setBatchDefaultRole(e.target.value as InviteFormRole)}
              >
                {INVITE_ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
            <textarea
              className="cs-csv-textarea"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={'email,role\njean.dupont@client.fr,codir\nmarie@client.fr\npierre@client.fr,pilote'}
              rows={6}
              spellCheck={false}
            />
            <button
              type="button"
              className="cs-invite-submit cs-invite-submit--batch"
              onClick={() => { void submitBatchInvitations() }}
              disabled={batchSubmitting || !csvText.trim()}
            >
              {batchSubmitting ? 'Traitement…' : 'Lancer les invitations depuis le CSV'}
            </button>
            {batchSummary && <p className="cs-invite-msg cs-invite-msg--ok">{batchSummary}</p>}
          </div>
        )}

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

        {!canEdit && canInvite && (
          <p className="cs-note">
            Seul le consultant ou l’administrateur peut modifier la fiche entreprise (logo, nom, secteur). Vous pouvez
            inviter des membres ci-dessus.
          </p>
        )}
        {!canEdit && !canInvite && (
          <p className="cs-note">
            Seuls le consultant, l’administrateur ou un membre CODIR peuvent inviter des membres. Seul le consultant ou
            l’administrateur peut modifier la fiche entreprise.
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
  font-family: var(--font-display);
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
  text-transform: none;
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
  grid-template-columns: 32px minmax(0, 1fr) auto auto;
  gap: 10px;
  align-items: start;
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
  align-self: center;
}

.cs-member-row > .cs-member-role,
.cs-member-row > .cs-status {
  align-self: center;
}

.cs-member-email {
  font-size: 14px;
  color: var(--theme-text);
}

.cs-member-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.cs-member-detail {
  font-size: 11px;
  line-height: 1.4;
  color: var(--theme-text-muted);
}

.cs-member-resend {
  align-self: flex-start;
  margin-top: 6px;
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--theme-accent);
  text-decoration: underline;
  cursor: pointer;
  font-family: var(--font-body);
}

.cs-member-resend:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  text-decoration: none;
}

.cs-resend-banner {
  margin-top: 10px;
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
.cs-status--invited { color: #B45309; }
.cs-status--pending { color: #4C86A8; }
.cs-status--expired { color: #B91C1C; }
.cs-status--inactive { color: var(--theme-text-muted); }

.cs-section--invite {
  margin-top: 8px;
}

.cs-invite-lead {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--theme-text-muted);
}

.cs-invite-warn {
  margin: 0 0 14px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, #b45309 35%, var(--theme-border));
  background: color-mix(in srgb, #b45309 8%, var(--theme-bg-page));
  font-size: 11px;
  line-height: 1.45;
  color: var(--theme-text);
}

.cs-invite-batch-title {
  margin: 20px 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--theme-text);
}

.cs-invite-batch-hint {
  margin: 0 0 10px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--theme-text-muted);
}

.cs-invite-field--batch-role {
  flex: 0 0 220px;
  margin-bottom: 10px;
}

.cs-csv-textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 120px;
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid var(--theme-border);
  border-radius: 10px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.4;
  color: var(--theme-text);
  background: var(--theme-bg-page);
  resize: vertical;
}

.cs-invite-submit--batch {
  margin-top: 4px;
}

.cs-batch-file-label {
  display: block;
  margin-bottom: 8px;
}

.cs-batch-file {
  font-size: 12px;
  max-width: 100%;
}

.cs-invite-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-end;
}

.cs-invite-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 200px;
  min-width: 0;
}

.cs-invite-field--role {
  flex: 0 0 200px;
}

.cs-edit-input--select {
  cursor: pointer;
}

.cs-invite-submit {
  height: 40px;
  border: none;
  border-radius: 10px;
  background: #4C86A8;
  color: white;
  font-weight: 700;
  padding: 0 14px;
  font-size: 13px;
  cursor: pointer;
  align-self: flex-end;
}

.cs-invite-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.cs-invite-msg {
  margin: 8px 0 0;
  font-size: 12px;
}

.cs-invite-msg--error { color: #B91C1C; }
.cs-invite-msg--ok { color: #10B981; }

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
  font-family: var(--font-display);
  font-size: 24px;
}
`
