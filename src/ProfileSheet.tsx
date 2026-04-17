import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createUser,
  getWorkspaceUsers,
  isStorageBucketNotFound,
  updateUser,
  uploadImageToStorage,
} from './lib/api'
import type { User } from './lib/types'

export type DirectionType = 'fonctionnel' | 'metier' | 'geographique'

const STORAGE_KEY = 'lfdc-member-onboarding'

export interface StoredMemberProfile {
  firstName?: string
  lastName?: string
  jobTitle?: string
  directionName?: string
  mission?: string
  vision?: string
  directionType?: DirectionType
  managedCount?: number
  totalEffectif?: number
  avatar?: string | null
}

export interface ProfileSheetProps {
  open: boolean
  onClose: () => void
  workspaceId?: string | null
  firstName: string
  lastName: string
  jobTitle: string
  direction: string
  mission: string
  vision: string
  role: string
  directionType?: DirectionType
  managedCount?: number
  totalEffectif?: number
  avatarUrl?: string | null
  onSaved?: (data: StoredMemberProfile) => void
}

function loadStored(): StoredMemberProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as StoredMemberProfile
  } catch {
    return {}
  }
}

function saveStored(data: StoredMemberProfile) {
  const prev = loadStored()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...data }))
}

function roleBadgeClass(role: string) {
  const n = role.toLowerCase()
  if (n.includes('consultant')) return 'psd-role psd-role--bordeaux'
  return 'psd-role psd-role--bleu'
}

type InlineFieldProps = {
  label: string
  value: string
  onCommit: (v: string) => void
}

function InlineTextField({ label, value, onCommit }: InlineFieldProps) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setLocal(value)
  }, [value, editing])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function commit() {
    if (local !== value) onCommit(local)
    setEditing(false)
  }

  function cancel() {
    setLocal(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="psd-inline psd-inline--edit">
        <span className="psd-inline-label">{label}</span>
        <div className="psd-inline-row">
          <input
            ref={inputRef}
            className="psd-inline-input"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') cancel()
            }}
          />
          <button type="button" className="psd-inline-ok" onClick={commit} aria-label="Valider">✓</button>
          <button type="button" className="psd-inline-x" onClick={cancel} aria-label="Annuler">✗</button>
        </div>
      </div>
    )
  }

  return (
    <button type="button" className="psd-inline psd-inline--read" onClick={() => setEditing(true)}>
      <span className="psd-inline-label">{label}</span>
      <span className="psd-inline-value">
        {value || '—'}
        <span className="psd-pencil" aria-hidden>✎</span>
      </span>
    </button>
  )
}

function InlineNumberField({
  label,
  value,
  suffix,
  onCommit,
}: {
  label: string
  value: number
  suffix: string
  onCommit: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setLocal(String(value))
  }, [value, editing])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function commit() {
    const n = Number(local.replace(/\D/g, '')) || 0
    if (n !== value) onCommit(n)
    setEditing(false)
  }

  function cancel() {
    setLocal(String(value))
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="psd-inline psd-inline--edit">
        <span className="psd-inline-label">{label}</span>
        <div className="psd-inline-row">
          <input
            ref={inputRef}
            type="number"
            min={0}
            className="psd-inline-input psd-inline-input--num"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') cancel()
            }}
          />
          <span className="psd-suffix">{suffix}</span>
          <button type="button" className="psd-inline-ok" onClick={commit} aria-label="Valider">✓</button>
          <button type="button" className="psd-inline-x" onClick={cancel} aria-label="Annuler">✗</button>
        </div>
      </div>
    )
  }

  return (
    <button type="button" className="psd-inline psd-inline--read" onClick={() => setEditing(true)}>
      <span className="psd-inline-label">{label}</span>
      <span className="psd-inline-value">
        {value} {suffix}
        <span className="psd-pencil" aria-hidden>✎</span>
      </span>
    </button>
  )
}

export default function ProfileSheet({
  open,
  onClose,
  workspaceId = null,
  firstName: firstNameProp,
  lastName: lastNameProp,
  jobTitle: jobTitleProp,
  direction: directionProp,
  mission: missionProp,
  vision: visionProp,
  role,
  directionType: directionTypeProp = 'fonctionnel',
  managedCount: managedCountProp = 0,
  totalEffectif: totalEffectifProp = 0,
  avatarUrl: avatarUrlProp = null,
  onSaved,
}: ProfileSheetProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dirty, setDirty] = useState(false)
  const markDirty = useCallback(() => setDirty(true), [])

  const [firstName, setFirstName] = useState(firstNameProp)
  const [lastName, setLastName] = useState(lastNameProp)
  const [jobTitle, setJobTitle] = useState(jobTitleProp)
  const [directionName, setDirectionName] = useState(directionProp)
  const [directionType, setDirectionType] = useState<DirectionType>(directionTypeProp)
  const [managedCount, setManagedCount] = useState(managedCountProp)
  const [totalEffectif, setTotalEffectif] = useState(totalEffectifProp)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(avatarUrlProp)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => localStorage.getItem('lfdc-user-id'))
  useEffect(() => {
    if (!open) return
    const s = loadStored()
    setFirstName(s.firstName ?? firstNameProp)
    setLastName(s.lastName ?? lastNameProp)
    setJobTitle(s.jobTitle ?? jobTitleProp)
    setDirectionName(s.directionName ?? directionProp)
    setDirectionType(s.directionType ?? directionTypeProp)
    setManagedCount(s.managedCount ?? managedCountProp)
    setTotalEffectif(s.totalEffectif ?? totalEffectifProp)
    setAvatarUrl(s.avatar ?? avatarUrlProp ?? null)
    setAvatarFile(null)
    setDirty(false)
  }, [open, firstNameProp, lastNameProp, jobTitleProp, directionProp, directionTypeProp, managedCountProp, totalEffectifProp, avatarUrlProp])

  useEffect(() => {
    if (!open || !workspaceId) return
    let cancelled = false
    void (async () => {
      try {
        const users = await getWorkspaceUsers(workspaceId)
        if (cancelled || users.length === 0) return
        const storedId = localStorage.getItem('lfdc-user-id')
        const selected = users.find((u) => u.id === storedId) ?? users[0]
        if (cancelled || !selected) return
        setCurrentUserId(selected.id)
        localStorage.setItem('lfdc-user-id', selected.id)
        setFirstName(selected.prenom ?? firstNameProp)
        setLastName(selected.nom ?? lastNameProp)
        setJobTitle(selected.job_title ?? jobTitleProp)
        setDirectionName(selected.direction_nom ?? directionProp)
        setManagedCount(selected.managed_count ?? managedCountProp)
        setTotalEffectif(selected.total_effectif ?? totalEffectifProp)
        setAvatarUrl(selected.avatar_url ?? avatarUrlProp ?? null)
      } catch {
        // Keep local fallback if Supabase fetch fails
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, workspaceId, firstNameProp, lastNameProp, jobTitleProp, directionProp, managedCountProp, totalEffectifProp, avatarUrlProp])

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?'

  async function persistAll() {
    let avatarUrlToPersist = avatarUrl
    if (workspaceId && avatarFile) {
      try {
        avatarUrlToPersist = await uploadImageToStorage({
          file: avatarFile,
          folder: 'users/avatars',
          filenamePrefix: `${firstName || 'user'}-${lastName || ''}`.trim() || 'user',
        })
      } catch (uploadError) {
        if (isStorageBucketNotFound(uploadError)) {
          // Storage bucket missing: keep current avatar value and continue saving profile fields.
          avatarUrlToPersist = avatarUrl
        } else {
          avatarUrlToPersist = avatarUrl
        }
      }
    }

    const prev = loadStored()
    const payload: StoredMemberProfile = {
      ...prev,
      firstName,
      lastName,
      jobTitle,
      directionName,
      mission: prev.mission ?? missionProp,
      vision: prev.vision ?? visionProp,
      directionType,
      managedCount,
      totalEffectif,
      avatar: avatarUrlToPersist,
    }
    saveStored(payload)
    if (workspaceId) {
      try {
        const roleDb: User['role'] = role.toLowerCase().includes('consultant')
          ? 'consultant'
          : role.toLowerCase().includes('pilote')
            ? 'pilote'
            : role.toLowerCase().includes('contributeur')
              ? 'contributeur'
              : 'codir'

        if (currentUserId) {
          await updateUser(currentUserId, {
            prenom: firstName || null,
            nom: lastName || null,
            job_title: jobTitle || null,
            avatar_url: avatarUrlToPersist,
            direction_type: directionType === 'metier' ? 'Métier' : directionType === 'geographique' ? 'Géographique' : 'Fonctionnel',
            direction_nom: directionName || null,
            managed_count: managedCount,
            total_effectif: totalEffectif,
          })
        } else {
          const created = await createUser({
            workspace_id: workspaceId,
            email: `user-${Date.now()}@local.lfdc`,
            prenom: firstName || null,
            nom: lastName || null,
            job_title: jobTitle || null,
            avatar_url: avatarUrlToPersist,
            role: roleDb,
            direction_type: directionType === 'metier' ? 'Métier' : directionType === 'geographique' ? 'Géographique' : 'Fonctionnel',
            direction_nom: directionName || null,
            managed_count: managedCount,
            total_effectif: totalEffectif,
            status: 'actif',
          })
          setCurrentUserId(created.id)
          localStorage.setItem('lfdc-user-id', created.id)
        }
      } catch {
        // Keep UX resilient even if backend update fails
      }
    }
    onSaved?.(payload)
    setDirty(false)
    onClose()
  }

  function onAvatarFile(f: File | null) {
    if (!f) return
    setAvatarFile(f)
    const reader = new FileReader()
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : null
      setAvatarUrl(url)
      markDirty()
    }
    reader.readAsDataURL(f)
  }

  if (!open) return null

  return (
    <>
      <style>{CSS}</style>
      <div className="psd-overlay" role="presentation" onClick={onClose} />
      <aside className="psd-drawer" aria-label="Mon profil">
        <button type="button" className="psd-close" onClick={onClose} aria-label="Fermer">✕</button>
        <h2 className="psd-drawer-title">Mon profil</h2>

        <div className="psd-avatar-block">
          <div className="psd-avatar-lg">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="psd-avatar-img" />
              : <span>{initials}</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="psd-file" onChange={(e) => onAvatarFile(e.target.files?.[0] ?? null)} />
          <button type="button" className="psd-change-photo" onClick={() => fileRef.current?.click()}>
            Changer la photo
          </button>
        </div>

        <div className="psd-name-block">
          <div className="psd-name">{firstName} {lastName}</div>
          <div className="psd-job">{jobTitle || '—'}</div>
          <span className={roleBadgeClass(role)}>{role}</span>
        </div>

        <hr className="psd-sep" />

        <section className="psd-block">
          <h3 className="psd-block-title">Mon périmètre</h3>
          <div className="psd-pill-row">
            {(['fonctionnel', 'metier', 'geographique'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`psd-type-pill ${directionType === t ? 'psd-type-pill--on' : ''}`}
                onClick={() => {
                  setDirectionType(t)
                  markDirty()
                }}
              >
                {t === 'fonctionnel' ? 'Fonctionnel' : t === 'metier' ? 'Métier' : 'Géographique'}
              </button>
            ))}
          </div>

          <InlineTextField
            label="Nom de ma direction"
            value={directionName}
            onCommit={(v) => { setDirectionName(v); markDirty() }}
          />

          <InlineNumberField
            label="Nombre de personnes managées en direct"
            value={managedCount}
            suffix="personnes"
            onCommit={(v) => { setManagedCount(v); markDirty() }}
          />

          <InlineNumberField
            label="Effectif global du périmètre"
            value={totalEffectif}
            suffix="personnes"
            onCommit={(v) => { setTotalEffectif(v); markDirty() }}
          />

          <p className="psd-note">Ces données aident le consultant à calibrer la charge de transformation.</p>
        </section>

        <hr className="psd-sep" />

        <section className="psd-block">
          <InlineTextField
            label="Prénom"
            value={firstName}
            onCommit={(v) => { setFirstName(v); markDirty() }}
          />
          <InlineTextField
            label="Nom"
            value={lastName}
            onCommit={(v) => { setLastName(v); markDirty() }}
          />
          <InlineTextField
            label="Poste"
            value={jobTitle}
            onCommit={(v) => { setJobTitle(v); markDirty() }}
          />
        </section>

        {dirty && (
          <button type="button" className="psd-save-all" onClick={persistAll}>
            Enregistrer les modifications
          </button>
        )}
      </aside>
    </>
  )
}

const CSS = `
.psd-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 49;
}

.psd-drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 420px;
  max-width: 100vw;
  background: var(--theme-bg-card);
  border-left: 1px solid var(--theme-border);
  box-shadow: -8px 0 32px rgba(0,0,0,0.2);
  padding: 32px;
  z-index: 50;
  overflow-y: auto;
  font-family: var(--font-body);
  color: var(--theme-text);
}

.psd-close {
  position: absolute;
  top: 20px;
  right: 20px;
  appearance: none;
  border: none;
  background: transparent;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--theme-text-muted);
  line-height: 1;
}

.psd-close:hover {
  color: var(--theme-text);
}

.psd-drawer-title {
  margin: 0 0 24px;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--theme-text);
}

.psd-avatar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.psd-avatar-lg {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #4C86A8;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 26px;
  font-weight: 700;
  overflow: hidden;
}

.psd-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.psd-file {
  display: none;
}

.psd-change-photo {
  appearance: none;
  border: none;
  background: none;
  font-size: 12px;
  color: var(--theme-accent);
  text-decoration: underline;
  cursor: pointer;
  font-family: var(--font-body);
}

.psd-name-block {
  text-align: center;
  margin-bottom: 8px;
}

.psd-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--theme-text);
}

.psd-job {
  font-size: 14px;
  color: var(--theme-text-muted);
  margin: 6px 0 10px;
}

.psd-role {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}

.psd-role--bordeaux {
  background: #8E3B46;
}

.psd-role--bleu {
  background: #4C86A8;
}

.psd-sep {
  border: none;
  border-top: 1px solid var(--theme-border);
  margin: 20px 0;
}

.psd-block-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: none;
  color: var(--theme-text-muted);
  margin: 0 0 12px;
}

.psd-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.psd-type-pill {
  appearance: none;
  border: 1px solid var(--theme-border);
  background: transparent;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--theme-text-muted);
  cursor: pointer;
  font-family: var(--font-body);
}

.psd-type-pill--on {
  border-color: var(--theme-accent);
  background: color-mix(in srgb, var(--theme-accent) 12%, transparent);
  color: var(--theme-text);
}

.psd-inline {
  display: block;
  width: 100%;
  text-align: left;
  margin-bottom: 12px;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
}

.psd-inline-label {
  display: block;
  font-size: 11px;
  color: var(--theme-text-muted);
  margin-bottom: 4px;
}

.psd-inline-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 14px;
  color: var(--theme-text);
  width: 100%;
}

.psd-pencil {
  opacity: 0.35;
  font-size: 12px;
  transition: opacity 0.15s;
}

.psd-inline--read:hover .psd-pencil {
  opacity: 1;
}

.psd-inline-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.psd-inline-input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--theme-border);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  background: var(--theme-bg-page);
  color: var(--theme-text);
}

.psd-inline-input:focus {
  outline: none;
  border-color: var(--theme-accent);
  box-shadow: 0 0 0 3px rgba(142,59,70,0.12);
}

.psd-inline-input--num {
  max-width: 100px;
}

.psd-suffix {
  font-size: 12px;
  color: var(--theme-text-muted);
}

.psd-inline-ok, .psd-inline-x {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--theme-border);
  background: var(--theme-bg-page);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.psd-inline-ok {
  color: #10B981;
}

.psd-inline-x {
  color: var(--theme-text-muted);
}

.psd-note {
  font-size: 11px;
  font-style: italic;
  color: var(--theme-text-muted);
  margin: 8px 0 0;
  line-height: 1.4;
}

.psd-save-all {
  margin-top: 24px;
  width: 100%;
  height: 46px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--theme-accent);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  font-family: var(--font-body);
}

.psd-save-all:hover {
  filter: brightness(0.95);
}
`
