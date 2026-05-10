import { useEffect, useMemo, useRef, useState } from 'react'
import { sendInvitationMagicLink } from './lib/auth'
import {
  createInvitation,
  getWorkspaceDirections,
  getWorkspaceInvitations,
  getWorkspaceUsers,
  isStorageBucketNotFound,
  insertAuditEvent,
  listWorkspaceAuditEvents,
  listWorkspaces,
  invokeRemoveMemberAuthCleanup,
  removeWorkspaceMember,
  setWorkspaceDirigeant,
  updateWorkspace,
  uploadImageToStorage,
} from './lib/api'
import type { AuditEvent, Direction, Invitation, User } from './lib/types'

export interface CompanyMember {
  email: string
  role: string
  status?: 'invité' | 'actif'
  /** Synthèse invitation + profil / connexion */
  detail?: string
  pillLabel?: string
  pillVariant?: 'active' | 'invited' | 'pending' | 'expired' | 'inactive'
  /** `public.users.id` lorsque la personne a un profil dans l’espace */
  userRecordId?: string
}

type InviteFormRole = 'Membre CODIR' | 'Pilote de projet' | 'Contributeur'

const INVITE_ROLE_OPTIONS: InviteFormRole[] = ['Membre CODIR', 'Pilote de projet', 'Contributeur']
const REMOTE_PAGE_SIZE = 500

function mapApiRoleToLabel(role: string): string {
  const r = role.toLowerCase()
  if (r === 'codir') return 'Membre CODIR'
  if (r === 'pilote') return 'Pilote de projet'
  if (r === 'contributeur') return 'Contributeur'
  if (r === 'consultant') return 'Consultant'
  return role
}

// REF-7b.0 : categories d'accordeon dans la section "Membres de l'espace".
type MemberGroupKey = 'super_admin' | 'admin' | 'consultant' | 'codir' | 'pilote' | 'contributeur' | 'autre'

function normalizeMemberGroup(role: string): MemberGroupKey {
  const r = role.toLowerCase()
  if (r.includes('super')) return 'super_admin'
  if (r === 'admin' || r.includes('administrateur')) return 'admin'
  if (r.includes('consultant')) return 'consultant'
  if (r.includes('codir')) return 'codir'
  if (r.includes('pilote')) return 'pilote'
  if (r.includes('contributeur')) return 'contributeur'
  return 'autre'
}

const MEMBER_GROUP_ORDER: MemberGroupKey[] = [
  'super_admin',
  'admin',
  'consultant',
  'codir',
  'pilote',
  'contributeur',
  'autre',
]

const MEMBER_GROUP_LABEL: Record<MemberGroupKey, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  consultant: 'Consultants',
  codir: 'Membres CODIR',
  pilote: 'Pilotes de projet',
  contributeur: 'Contributeurs',
  autre: 'Autres',
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
      userRecordId: user.id,
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
  /** Pour empêcher le retrait de soi-même et les contrôles métier */
  currentUserEmail?: string | null
  companyLogo?: string | null
  /** Membre CODIR désigné comme « dirigeant » porteur du Discours de transformation. */
  dirigeantUserId?: string | null
  onCompanyUpdate?: (data: {
    companyName: string
    sector: string
    size: string
    logo: string | null
  }) => void
  /** Remonté à App.tsx après une affectation/retrait pour rafraîchir le workspace. */
  onDirigeantChange?: (userId: string | null) => void
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

function formatUserDisplayName(u: User): string {
  const full = `${u.prenom ?? ''} ${u.nom ?? ''}`.trim()
  return full || u.email
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

/** Retrait membre (suppression en base) : consultant + admin entreprise. */
function canRemoveMembers(role: CompanySheetProps['currentUserRole']) {
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

function normalizeLabel(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function normalizeTrigram(raw: string | undefined): string | null {
  if (!raw) return null
  const cleaned = raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
  if (!cleaned) return null
  return cleaned.slice(0, 3)
}

function parseInvitationCsv(
  raw: string,
  defaultRole: InviteFormRole,
): {
  rows: Array<{ email: string; role: InviteFormRole; directionLabel: string | null; trigram: string | null }>
  lineErrors: string[]
} {
  const lines = raw
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return { rows: [], lineErrors: ['Aucune ligne à traiter.'] }
  let start = 0
  let hasHeader = false
  let headerHasRole = false
  let headerHasDirection = false
  let headerHasTrigram = false
  if (/^email\b/i.test(lines[0])) {
    hasHeader = true
    start = 1
    const header = lines[0].includes(';') ? lines[0].split(';') : lines[0].split(',')
    const normalizedHeader = header.map((h) => normalizeLabel(h))
    headerHasRole = normalizedHeader.includes('role')
    headerHasDirection = normalizedHeader.includes('direction')
    headerHasTrigram = normalizedHeader.includes('trigram')
  }
  const rows: Array<{ email: string; role: InviteFormRole; directionLabel: string | null; trigram: string | null }> =
    []
  const lineErrors: string[] = []
  for (let i = start; i < lines.length; i++) {
    const lineNum = i + 1
    const line = lines[i]
    const parts = line.includes(';') ? line.split(';') : line.split(',')
    const email = parts[0]?.trim().toLowerCase() ?? ''
    const roleCell = hasHeader && !headerHasRole ? undefined : parts[1]?.trim()
    const directionCell =
      hasHeader && !headerHasDirection ? undefined : parts[headerHasRole ? 2 : 1]?.trim()
    const trigramCell =
      hasHeader && !headerHasTrigram
        ? undefined
        : parts[headerHasDirection ? (headerHasRole ? 3 : 2) : headerHasRole ? 2 : 1]?.trim()
    if (!email) {
      lineErrors.push(`Ligne ${lineNum} : email manquant`)
      continue
    }
    if (!email.includes('@')) {
      lineErrors.push(`Ligne ${lineNum} : email invalide (${email})`)
      continue
    }
    rows.push({
      email,
      role: roleCell ? parseRoleCell(roleCell) : defaultRole,
      directionLabel: directionCell ? directionCell : null,
      trigram: normalizeTrigram(trigramCell),
    })
  }
  const seen = new Set<string>()
  const deduped: Array<{ email: string; role: InviteFormRole; directionLabel: string | null; trigram: string | null }> = []
  for (const r of rows) {
    if (seen.has(r.email)) continue
    seen.add(r.email)
    deduped.push(r)
  }
  return { rows: deduped, lineErrors }
}

async function processWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return
  let cursor = 0
  const safeLimit = Math.max(1, Math.min(limit, items.length))
  const runners = Array.from({ length: safeLimit }, async () => {
    while (cursor < items.length) {
      const current = items[cursor]
      cursor += 1
      await worker(current)
    }
  })
  await Promise.all(runners)
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function CompanySheet({
  workspaceId = null,
  companyName,
  sector,
  size,
  members,
  currentUserRole,
  currentUserEmail = null,
  companyLogo: companyLogoProp = null,
  dirigeantUserId = null,
  onCompanyUpdate,
  onDirigeantChange,
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
  const [remoteUsers, setRemoteUsers] = useState<User[]>([])
  const [remoteMembersLoading, setRemoteMembersLoading] = useState(false)
  const [membersRefreshKey, setMembersRefreshKey] = useState(0)
  const [dirigeantSaving, setDirigeantSaving] = useState(false)
  const [dirigeantError, setDirigeantError] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<InviteFormRole>('Contributeur')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  // REF-7b.0 : bandeau orange pour succes partiel (ex. invitation enregistree mais email non envoye)
  const [inviteWarning, setInviteWarning] = useState<string | null>(null)
  const [resendingEmail, setResendingEmail] = useState<string | null>(null)
  const [removingEmail, setRemovingEmail] = useState<string | null>(null)
  const [removeMemberConfirm, setRemoveMemberConfirm] = useState<CompanyMember | null>(null)
  const [removeMemberBlocking, setRemoveMemberBlocking] = useState(false)
  const [resendBanner, setResendBanner] = useState<{ ok: boolean; text: string } | null>(null)
  const [csvText, setCsvText] = useState('')
  const [batchDefaultRole, setBatchDefaultRole] = useState<InviteFormRole>('Contributeur')
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [batchSummary, setBatchSummary] = useState<string | null>(null)
  const [batchSummaryTone, setBatchSummaryTone] = useState<'ok' | 'warning'>('ok')
  const [batchAuditEvents, setBatchAuditEvents] = useState<AuditEvent[]>([])
  const [batchAuditLoading, setBatchAuditLoading] = useState(false)
  const [userEmailById, setUserEmailById] = useState<Record<string, string>>({})
  const [workspaceDirections, setWorkspaceDirections] = useState<Direction[]>([])
  const [inviteDirectionId, setInviteDirectionId] = useState<string>('')
  const [trigramConvention, setTrigramConvention] = useState<'prenom_nom_3' | 'nom_prenom_3' | 'custom'>('prenom_nom_3')
  const [draftTrigramConvention, setDraftTrigramConvention] = useState<'prenom_nom_3' | 'nom_prenom_3' | 'custom'>('prenom_nom_3')

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
  const canRemove = canRemoveMembers(currentUserRole)
  const mergedMembers = remoteMembers ?? members

  /** Membres CODIR actifs, éligibles au rôle de « dirigeant » porteur du discours. */
  const codirCandidates = useMemo(() => {
    return remoteUsers
      .filter((u) => u.role?.toLowerCase() === 'codir' && u.status === 'actif')
      .slice()
      .sort((a, b) => {
        const an = `${a.nom ?? ''} ${a.prenom ?? ''}`.trim().toLowerCase()
        const bn = `${b.nom ?? ''} ${b.prenom ?? ''}`.trim().toLowerCase()
        if (an && bn) return an.localeCompare(bn, 'fr')
        return a.email.localeCompare(b.email, 'fr')
      })
  }, [remoteUsers])

  const currentDirigeant = useMemo(
    () => (dirigeantUserId ? remoteUsers.find((u) => u.id === dirigeantUserId) ?? null : null),
    [dirigeantUserId, remoteUsers],
  )

  // REF-7b.0 : preferences UI (expand par groupe + filtre en attente) persistees par workspace dans localStorage.
  const localStorageKey = workspaceId ? `cs-members-prefs:${workspaceId}` : null
  type GroupPrefs = { groups: Record<MemberGroupKey, boolean>; onlyPending: boolean }
  function defaultPrefs(): GroupPrefs {
    const groups: Record<MemberGroupKey, boolean> = {
      super_admin: false,
      admin: false,
      consultant: false,
      codir: false,
      pilote: false,
      contributeur: false,
      autre: false,
    }
    groups[normalizeMemberGroup(currentUserRole ?? '')] = true
    return { groups, onlyPending: false }
  }
  const initialPrefs = (): GroupPrefs => {
    if (!localStorageKey) return defaultPrefs()
    try {
      const raw = localStorage.getItem(localStorageKey)
      if (!raw) return defaultPrefs()
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return defaultPrefs()
      const base = defaultPrefs()
      if (parsed.groups && typeof parsed.groups === 'object') {
        for (const key of MEMBER_GROUP_ORDER) {
          if (typeof parsed.groups[key] === 'boolean') base.groups[key] = parsed.groups[key]
        }
      }
      if (typeof parsed.onlyPending === 'boolean') base.onlyPending = parsed.onlyPending
      return base
    } catch {
      return defaultPrefs()
    }
  }
  const [expandedGroups, setExpandedGroups] = useState<Record<MemberGroupKey, boolean>>(() => initialPrefs().groups)
  const [onlyPending, setOnlyPending] = useState<boolean>(() => initialPrefs().onlyPending)
  useEffect(() => {
    if (!localStorageKey) return
    try {
      localStorage.setItem(localStorageKey, JSON.stringify({ groups: expandedGroups, onlyPending }))
    } catch {
      /* quota depasse : on ignore silencieusement */
    }
  }, [expandedGroups, onlyPending, localStorageKey])
  function toggleGroup(key: MemberGroupKey) {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const filteredMembers = useMemo(() => {
    if (!onlyPending) return mergedMembers
    return mergedMembers.filter((m) => {
      const variant = m.pillVariant ?? (m.status === 'actif' ? 'active' : 'invited')
      return variant !== 'active' && variant !== 'inactive'
    })
  }, [mergedMembers, onlyPending])

  // REF-7b.0 : regroupement des membres par role (accordeon par categorie)
  // pour anticiper l'arrivee massive de reviewers (REF-7b.2 et +).
  const groupedMembers = useMemo(() => {
    const groups: Record<MemberGroupKey, CompanyMember[]> = {
      super_admin: [],
      admin: [],
      consultant: [],
      codir: [],
      pilote: [],
      contributeur: [],
      autre: [],
    }
    for (const m of filteredMembers) {
      groups[normalizeMemberGroup(m.role)].push(m)
    }
    return groups
  }, [filteredMembers])

  const hasAnyCollapsedGroup = MEMBER_GROUP_ORDER.some(
    (key) => groupedMembers[key].length > 0 && !expandedGroups[key],
  )
  function toggleAllGroups() {
    const allExpanded = !hasAnyCollapsedGroup
    const target: Record<MemberGroupKey, boolean> = {
      super_admin: !allExpanded,
      admin: !allExpanded,
      consultant: !allExpanded,
      codir: !allExpanded,
      pilote: !allExpanded,
      contributeur: !allExpanded,
      autre: !allExpanded,
    }
    setExpandedGroups(target)
  }

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
    async function fetchAllUsers(workspace: string): Promise<User[]> {
      const all: User[] = []
      let offset = 0
      while (true) {
        const page = await getWorkspaceUsers(workspace, { limit: REMOTE_PAGE_SIZE, offset })
        all.push(...page)
        if (page.length < REMOTE_PAGE_SIZE) break
        offset += REMOTE_PAGE_SIZE
      }
      return all
    }
    async function fetchAllInvitations(workspace: string): Promise<Invitation[]> {
      const all: Invitation[] = []
      let offset = 0
      while (true) {
        const page = await getWorkspaceInvitations(workspace, { limit: REMOTE_PAGE_SIZE, offset })
        all.push(...page)
        if (page.length < REMOTE_PAGE_SIZE) break
        offset += REMOTE_PAGE_SIZE
      }
      return all
    }
    void (async () => {
      setRemoteMembersLoading(true)
      try {
        const [users, invitations] = await Promise.all([
          fetchAllUsers(workspaceId),
          fetchAllInvitations(workspaceId),
        ])
        if (cancelled) return
        setRemoteUsers(users)
        setUserEmailById(
          users.reduce<Record<string, string>>((acc, user) => {
            acc[user.id] = user.email
            return acc
          }, {}),
        )
        setRemoteMembers(mergeUsersAndInvitations(users, invitations))
      } catch {
        if (cancelled) return
        setRemoteUsers([])
        setRemoteMembers(null)
      } finally {
        if (!cancelled) setRemoteMembersLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workspaceId, membersRefreshKey])

  useEffect(() => {
    if (!workspaceId) return
    let cancelled = false
    void (async () => {
      try {
        const directions = await getWorkspaceDirections(workspaceId)
        if (!cancelled) setWorkspaceDirections(directions)
      } catch {
        if (!cancelled) setWorkspaceDirections([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workspaceId])

  // REF-7b.0 : convention trigramme stockee au niveau workspace, editable par consultant/admin.
  useEffect(() => {
    if (!workspaceId) return
    let cancelled = false
    void (async () => {
      try {
        const all = await listWorkspaces()
        if (cancelled) return
        const current = all.find((w) => w.id === workspaceId)
        const convention = current?.trigram_convention ?? 'prenom_nom_3'
        setTrigramConvention(convention)
        setDraftTrigramConvention(convention)
      } catch {
        /* RLS ou reseau : on garde le defaut */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId) return
    let cancelled = false
    void (async () => {
      setBatchAuditLoading(true)
      try {
        const events = await listWorkspaceAuditEvents(workspaceId, ['invitation_batch_import'], 20)
        if (cancelled) return
        setBatchAuditEvents(events)
      } catch {
        if (!cancelled) setBatchAuditEvents([])
      } finally {
        if (!cancelled) setBatchAuditLoading(false)
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
    setInviteWarning(null)
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
        direction_id:
          currentUserRole === 'consultant' || currentUserRole === 'admin'
            ? inviteDirectionId || null
            : undefined,
      })
      try {
        await sendInvitationMagicLink(email)
        setInviteSuccess(
          `Invitation enregistrée. Un email avec un lien de connexion a été envoyé à ${email}.`,
        )
      } catch (mailErr) {
        setInviteWarning(
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
    setInviteWarning(null)
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
      const batchHash = await sha256Hex(csvText)
      let ok = 0
      let mailFail = 0
      const rowErrors: string[] = [...lineErrors]
      const directionByLabel = new Map<string, string>()
      for (const d of workspaceDirections) directionByLabel.set(normalizeLabel(d.nom), d.id)
      await processWithConcurrency(rows, 4, async ({ email, role, directionLabel, trigram }) => {
        try {
          let directionId: string | null | undefined = undefined
          if (directionLabel) {
            directionId = directionByLabel.get(normalizeLabel(directionLabel)) ?? null
            if (!directionId) {
              rowErrors.push(`${email} : direction inconnue (${directionLabel})`)
              return
            }
          }
          await createInvitation({
            workspace_id: workspaceId,
            email,
            role: toInvitationRole(role),
            direction_id: directionId,
            trigram,
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
      })
      setCsvText('')
      const parts = [`${ok} invitation(s) enregistrée(s).`]
      if (mailFail > 0) {
        parts.push(`${mailFail} email(s) de connexion non envoyés (réessayez ou « Renvoyer l’email »).`)
      }
      if (rowErrors.length > 0) {
        parts.push(`Détail : ${rowErrors.slice(0, 8).join(' ')}${rowErrors.length > 8 ? '…' : ''}`)
      }
      setBatchSummary(parts.join(' '))
      setBatchSummaryTone(mailFail > 0 || rowErrors.length > 0 ? 'warning' : 'ok')
      await insertAuditEvent({
        workspace_id: workspaceId,
        action: 'invitation_batch_import',
        payload: {
          count_ok: ok,
          count_mail_fail: mailFail,
          count_errors: rowErrors.length,
          sample_errors: rowErrors.slice(0, 5),
          csv_hash: batchHash,
          default_role: toInvitationRole(batchDefaultRole),
        },
      })
      setMembersRefreshKey((k) => k + 1)
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

  function openRemoveMemberConfirm(member: CompanyMember) {
    if (!workspaceId) return
    const emailNorm = member.email.trim().toLowerCase()
    if (currentUserEmail && emailNorm === currentUserEmail.trim().toLowerCase()) {
      window.alert('Vous ne pouvez pas retirer votre propre compte depuis cet écran.')
      return
    }
    const row = remoteUsers.find((u) => u.email.trim().toLowerCase() === emailNorm)
    if (row?.is_platform_superadmin) {
      window.alert(
        'Les comptes super-admin plateforme ne peuvent pas être retirés depuis la fiche entreprise.',
      )
      return
    }
    setRemoveMemberConfirm(member)
  }

  async function executeRemoveMember(member: CompanyMember) {
    if (!workspaceId || removeMemberBlocking) return
    const emailNorm = member.email.trim().toLowerCase()
    setRemoveMemberBlocking(true)
    setRemoveMemberConfirm(null)
    setRemovingEmail(emailNorm)
    try {
      const wasDirigeant = Boolean(
        member.userRecordId && dirigeantUserId && member.userRecordId === dirigeantUserId,
      )
      await removeWorkspaceMember({
        workspaceId,
        email: member.email,
        userId: member.userRecordId ?? null,
        workspaceDirigeantUserId: dirigeantUserId ?? null,
      })
      if (wasDirigeant) onDirigeantChange?.(null)
      setMembersRefreshKey((k) => k + 1)

      const cleanup = await invokeRemoveMemberAuthCleanup({
        workspaceId,
        email: member.email,
      })
      let suffix = ''
      if (cleanup.ok === false) {
        suffix =
          ' Le compte de connexion n’a pas pu être supprimé automatiquement — réessayez plus tard ou depuis le tableau Supabase si besoin.'
      } else if (cleanup.ok && cleanup.auth_deleted) {
        suffix = ' Le compte de connexion a été supprimé.'
      }

      setResendBanner({
        ok: true,
        text: `${member.email} a été retiré(e) de l’espace.${suffix}`,
      })
    } catch (err) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? String((err as { message?: unknown }).message ?? '')
          : ''
      window.alert(
        message ||
          'Impossible de retirer ce membre. Vérifiez vos droits ou des données liées en base (contrôle RLS).',
      )
    } finally {
      setRemovingEmail(null)
      setRemoveMemberBlocking(false)
    }
  }

  async function submitDirigeantChange(nextUserId: string | null) {
    if (!workspaceId) return
    if ((dirigeantUserId ?? null) === nextUserId) return
    setDirigeantError(null)
    setDirigeantSaving(true)
    try {
      const updated = await setWorkspaceDirigeant(workspaceId, nextUserId)
      onDirigeantChange?.(updated.dirigeant_user_id ?? null)
    } catch (err) {
      const message =
        typeof err === 'object' && err && 'message' in err
          ? String((err as { message?: unknown }).message ?? '')
          : ''
      setDirigeantError(message || 'Impossible de mettre à jour le dirigeant désigné.')
    } finally {
      setDirigeantSaving(false)
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
          trigram_convention: draftTrigramConvention,
        })
        if (logoForDb && !updated.logo_url) {
          updated = await updateWorkspace(workspaceId, { logo_url: logoForDb })
        }
        setLogoFile(null)
        setLogoUrl(updated.logo_url ?? null)
        setTrigramConvention(updated.trigram_convention ?? 'prenom_nom_3')
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

  useEffect(() => {
    if (!removeMemberConfirm) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setRemoveMemberConfirm(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [removeMemberConfirm])

  return (
    <div className="cs-root">
      <style>{CSS}</style>
      {removeMemberConfirm && (
        <div
          className="cs-remove-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRemoveMemberConfirm(null)
          }}
        >
          <div
            className="cs-remove-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cs-remove-modal-title"
            aria-describedby="cs-remove-modal-desc"
          >
            <h4 id="cs-remove-modal-title" className="cs-remove-modal-title">
              Retirer ce participant ?
            </h4>
            <p id="cs-remove-modal-desc" className="cs-remove-modal-desc">
              <strong>{removeMemberConfirm.email}</strong> sera retiré(e) de cet espace : profil applicatif
              et invitations liées à cet espace seront supprimés en base.
            </p>
            <p className="cs-remove-modal-note">
              Si cette personne n’a plus aucun profil ni invitation active sur la plateforme, son compte de
              connexion Supabase sera supprimé automatiquement. Sinon (ex. consultant sur un autre espace),
              seul le rattachement à cet espace est retiré.
            </p>
            <div className="cs-remove-modal-actions">
              <button
                type="button"
                className="cs-remove-modal-btn cs-remove-modal-btn--ghost"
                onClick={() => setRemoveMemberConfirm(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="cs-remove-modal-btn cs-remove-modal-btn--danger"
                disabled={removeMemberBlocking}
                onClick={() => {
                  void executeRemoveMember(removeMemberConfirm)
                }}
              >
                Retirer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
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
            <div>
              <span className="cs-label">Convention trigramme</span>
              {canEdit && editing ? (
                <select
                  value={draftTrigramConvention}
                  onChange={(e) => setDraftTrigramConvention(e.target.value as 'prenom_nom_3' | 'nom_prenom_3' | 'custom')}
                  className="cs-edit-input"
                >
                  <option value="prenom_nom_3">Prénom + Nom (ex : MAD = MArie Dupont)</option>
                  <option value="nom_prenom_3">Nom + Prénom (ex : DUM = DUpont Marie)</option>
                  <option value="custom">Personnalisée (édition manuelle)</option>
                </select>
              ) : (
                <strong>
                  {trigramConvention === 'nom_prenom_3'
                    ? 'Nom + Prénom'
                    : trigramConvention === 'custom'
                      ? 'Personnalisée'
                      : 'Prénom + Nom'}
                </strong>
              )}
            </div>
          </div>
        </div>

        {workspaceId && (
          <div className="cs-section cs-section--dirigeant">
            <h3>Dirigeant porteur du Discours de transformation</h3>
            <p className="cs-dirigeant-lead">
              Ce membre <strong>CODIR</strong> est désigné « dirigeant » du workspace. Il porte la V1
              du Discours de transformation et peut le rédiger / modifier depuis la Vue décideur,
              en plus des consultants et des administrateurs. Les autres membres ont un accès en
              lecture seule (pilotes) ou n’y accèdent pas (codir non désigné, contributeurs).
            </p>

            <div className="cs-dirigeant-current">
              <span className="cs-label">Dirigeant actuel</span>
              {currentDirigeant ? (
                <div className="cs-dirigeant-chip">
                  <div
                    className="cs-member-avatar"
                    style={{ background: memberAvatarColor('codir') }}
                  >
                    {getInitials(
                      `${currentDirigeant.prenom ?? ''} ${currentDirigeant.nom ?? ''}`.trim() ||
                        getEmailLocal(currentDirigeant.email),
                    )}
                  </div>
                  <div className="cs-dirigeant-chip-main">
                    <strong>{formatUserDisplayName(currentDirigeant)}</strong>
                    <span>{currentDirigeant.email}</span>
                    {currentDirigeant.direction_nom && (
                      <span className="cs-dirigeant-chip-detail">
                        {currentDirigeant.direction_nom}
                      </span>
                    )}
                  </div>
                </div>
              ) : dirigeantUserId ? (
                <p className="cs-dirigeant-empty">
                  Un dirigeant est désigné (id : {dirigeantUserId}) mais son profil n’est pas
                  visible dans la liste des membres de cet espace.
                </p>
              ) : (
                <p className="cs-dirigeant-empty">Aucun dirigeant désigné pour le moment.</p>
              )}
            </div>

            {canEdit ? (
              <div className="cs-dirigeant-editor">
                <label className="cs-invite-field">
                  <span className="cs-label">
                    Désigner un membre CODIR ({codirCandidates.length} éligible
                    {codirCandidates.length > 1 ? 's' : ''})
                  </span>
                  <select
                    className="cs-edit-input cs-edit-input--select"
                    value={dirigeantUserId ?? ''}
                    disabled={dirigeantSaving || codirCandidates.length === 0}
                    onChange={(e) => {
                      const v = e.target.value
                      void submitDirigeantChange(v === '' ? null : v)
                    }}
                  >
                    <option value="">— Aucun dirigeant désigné —</option>
                    {codirCandidates.map((u) => (
                      <option key={u.id} value={u.id}>
                        {formatUserDisplayName(u)} ({u.email})
                      </option>
                    ))}
                  </select>
                </label>
                {currentDirigeant && (
                  <button
                    type="button"
                    className="cs-dirigeant-clear"
                    onClick={() => { void submitDirigeantChange(null) }}
                    disabled={dirigeantSaving}
                  >
                    Retirer la désignation
                  </button>
                )}
                {codirCandidates.length === 0 && (
                  <p className="cs-invite-batch-hint">
                    Aucun membre CODIR actif dans cet espace. Invitez d’abord un membre CODIR
                    (ou attendez qu’il ait activé son compte) avant de le désigner.
                  </p>
                )}
                {dirigeantSaving && (
                  <p className="cs-invite-batch-hint">Enregistrement…</p>
                )}
                {dirigeantError && (
                  <p className="cs-invite-msg cs-invite-msg--error">{dirigeantError}</p>
                )}
              </div>
            ) : (
              <p className="cs-invite-batch-hint">
                Seuls le consultant owner et l’administrateur peuvent désigner ou retirer le
                dirigeant porteur du discours.
              </p>
            )}
          </div>
        )}

        <div className="cs-section">
          <h3>Membres de l&apos;espace</h3>
          {mergedMembers.length === 0 ? (
            <p className="cs-members-empty">Aucun membre invité pour le moment</p>
          ) : (
            <>
              <div className="cs-members-meta">
                <span>
                  {mergedMembers.length} membre(s) au total
                  {onlyPending && mergedMembers.length !== filteredMembers.length && (
                    <> · {filteredMembers.length} en attente</>
                  )}
                </span>
                {remoteMembersLoading && <span>Actualisation…</span>}
              </div>
              <div className="cs-members-toolbar">
                <button
                  type="button"
                  className="cs-members-toolbar-btn"
                  onClick={toggleAllGroups}
                  disabled={filteredMembers.length === 0}
                >
                  {hasAnyCollapsedGroup ? 'Tout déplier' : 'Tout replier'}
                </button>
                <label className="cs-members-toolbar-check">
                  <input
                    type="checkbox"
                    checked={onlyPending}
                    onChange={(e) => setOnlyPending(e.target.checked)}
                  />
                  <span>Afficher uniquement les invitations en attente</span>
                </label>
              </div>
              <div className="cs-members-groups">
                {MEMBER_GROUP_ORDER.map((groupKey) => {
                  const rows = groupedMembers[groupKey]
                  if (rows.length === 0) return null
                  const expanded = expandedGroups[groupKey]
                  return (
                    <div key={groupKey} className={`cs-members-group${expanded ? ' cs-members-group--open' : ''}`}>
                      <button
                        type="button"
                        className="cs-members-group-header"
                        onClick={() => toggleGroup(groupKey)}
                        aria-expanded={expanded}
                      >
                        <span className="cs-members-group-caret" aria-hidden>
                          {expanded ? '▾' : '▸'}
                        </span>
                        <span className="cs-members-group-label">{MEMBER_GROUP_LABEL[groupKey]}</span>
                        <span className="cs-members-group-count">{rows.length}</span>
                      </button>
                      {expanded && (
                        <div className="cs-members">
                          {rows.map((member) => {
                            const badgeColor = memberAvatarColor(member.role)
                            const pillLabel =
                              member.pillLabel ?? (member.status === 'actif' ? 'Actif' : 'Invité')
                            const pillVariant = member.pillVariant ?? (member.status === 'actif' ? 'active' : 'invited')
                            const emailKey = member.email.trim().toLowerCase()
                            const showResend =
                              canInvite && workspaceId && memberCanReceiveInviteResend(member)
                            return (
                              <div key={member.email.toLowerCase()} className="cs-member-row">
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
                                {canRemove && workspaceId ? (
                                  <button
                                    type="button"
                                    className="cs-member-remove"
                                    disabled={removingEmail === emailKey}
                                    onClick={() => {
                                      openRemoveMemberConfirm(member)
                                    }}
                                  >
                                    {removingEmail === emailKey ? 'Suppression…' : 'Retirer'}
                                  </button>
                                ) : null}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
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
              {(currentUserRole === 'consultant' || currentUserRole === 'admin') && (
                <label className="cs-invite-field cs-invite-field--role">
                  <span className="cs-label">Direction (optionnel)</span>
                  <select
                    className="cs-edit-input cs-edit-input--select"
                    value={inviteDirectionId}
                    onChange={(e) => setInviteDirectionId(e.target.value)}
                  >
                    <option value="">Aucune</option>
                    {workspaceDirections.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nom}
                      </option>
                    ))}
                  </select>
                </label>
              )}
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
            {inviteWarning && <p className="cs-invite-msg cs-invite-msg--warning">{inviteWarning}</p>}

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
              <strong>email</strong>, puis optionnellement <strong>role</strong>, <strong>direction</strong>,{' '}
              <strong>trigram</strong> (séparateur virgule ou point-virgule). Rôle optionnel : sinon le rôle par défaut
              ci-dessous s’applique. Valeurs reconnues : codir / pilote / contributeur, ou Membre CODIR / Pilote de
              projet / Contributeur. Première ligne optionnelle : <code>email,role,direction,trigram</code>
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
              placeholder={'email,role,direction,trigram\njean.dupont@client.fr,codir,Finance,JDU\nmarie@client.fr,contributeur,Finance,\npierre@client.fr,pilote,,PMA'}
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
            {batchSummary && (
              <p className={`cs-invite-msg cs-invite-msg--${batchSummaryTone}`}>{batchSummary}</p>
            )}
            <div className="cs-batch-history">
              <h4 className="cs-invite-batch-title">Historique des imports CSV</h4>
              {batchAuditLoading ? (
                <p className="cs-invite-batch-hint">Chargement…</p>
              ) : batchAuditEvents.length === 0 ? (
                <p className="cs-invite-batch-hint">Aucun import lot enregistré pour le moment.</p>
              ) : (
                <div className="cs-batch-history-list">
                  {batchAuditEvents.map((event) => {
                    const payload = (event.payload ?? {}) as Record<string, unknown>
                    const actorEmail = event.actor_user_id ? userEmailById[event.actor_user_id] : null
                    const createdAt = new Date(event.created_at).toLocaleString('fr-FR')
                    const ok = Number(payload.count_ok ?? 0)
                    const failed = Number(payload.count_errors ?? 0)
                    const mailFail = Number(payload.count_mail_fail ?? 0)
                    return (
                      <div key={event.id} className="cs-batch-history-item">
                        <strong>{createdAt}</strong>
                        <span>
                          {actorEmail ? `par ${actorEmail}` : 'par utilisateur inconnu'} · {ok} OK · {failed} erreurs · {mailFail} emails non envoyés
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 0 24px;
  position: relative;
}

.cs-remove-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 12000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, var(--theme-text) 35%, transparent);
  backdrop-filter: blur(4px);
}

.cs-remove-modal {
  width: 100%;
  max-width: 420px;
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border);
  border-radius: 16px;
  padding: 22px 22px 18px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
}

.cs-remove-modal-title {
  margin: 0 0 10px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--theme-text);
}

.cs-remove-modal-desc {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--theme-text);
}

.cs-remove-modal-note {
  margin: 0 0 18px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--theme-text-muted);
}

.cs-remove-modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.cs-remove-modal-btn {
  appearance: none;
  cursor: pointer;
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-body);
  border: 1px solid transparent;
}

.cs-remove-modal-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.cs-remove-modal-btn--ghost {
  background: transparent;
  border-color: var(--theme-border);
  color: var(--theme-text-muted);
}

.cs-remove-modal-btn--ghost:hover:not(:disabled) {
  background: color-mix(in srgb, var(--theme-text) 6%, transparent);
  color: var(--theme-text);
}

.cs-remove-modal-btn--danger {
  background: color-mix(in srgb, #B91C1C 12%, transparent);
  border-color: color-mix(in srgb, #B91C1C 45%, var(--theme-border));
  color: #B91C1C;
}

.cs-remove-modal-btn--danger:hover:not(:disabled) {
  background: color-mix(in srgb, #B91C1C 20%, transparent);
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

.cs-members-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.cs-members-toolbar-btn {
  border: 1px solid var(--theme-border);
  border-radius: 8px;
  background: var(--theme-bg-page);
  color: var(--theme-text);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 120ms ease;
}
.cs-members-toolbar-btn:hover:not(:disabled) {
  background: var(--theme-surface-hover, rgba(255,255,255,0.04));
}
.cs-members-toolbar-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.cs-members-toolbar-check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--theme-text-muted);
  cursor: pointer;
  user-select: none;
}
.cs-members-toolbar-check input[type='checkbox'] {
  cursor: pointer;
}

.cs-members-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cs-members-group {
  border: 1px solid var(--theme-border-soft, rgba(255,255,255,0.08));
  border-radius: 10px;
  background: var(--theme-surface-subtle, rgba(255,255,255,0.02));
  overflow: hidden;
}
.cs-members-group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: inherit;
  font: inherit;
  text-align: left;
  transition: background-color 120ms ease;
}
.cs-members-group-header:hover {
  background: var(--theme-surface-hover, rgba(255,255,255,0.04));
}
.cs-members-group-caret {
  width: 14px;
  display: inline-block;
  font-size: 11px;
  color: var(--theme-text-muted);
}
.cs-members-group-label {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.cs-members-group-count {
  min-width: 26px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--theme-surface-strong, rgba(255,255,255,0.08));
  color: var(--theme-text);
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}
.cs-members-group--open .cs-members {
  padding: 4px 12px 12px;
}

.cs-members-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--theme-text-muted);
}

.cs-member-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto auto auto;
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
.cs-member-row > .cs-status,
.cs-member-row > .cs-member-remove {
  align-self: center;
}

.cs-member-remove {
  appearance: none;
  cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--theme-accent) 65%, var(--theme-border));
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-body);
  color: var(--theme-accent);
  background: color-mix(in srgb, var(--theme-accent) 10%, transparent);
  white-space: nowrap;
}

.cs-member-remove:hover:not(:disabled) {
  background: color-mix(in srgb, var(--theme-accent) 18%, transparent);
}

.cs-member-remove:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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

.cs-section--dirigeant h3 {
  color: #8E3B46;
  letter-spacing: 0.04em;
  text-transform: none;
  font-size: 13px;
  font-weight: 700;
}

.cs-dirigeant-lead {
  margin: 0 0 14px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--theme-text-muted);
}

.cs-dirigeant-lead strong {
  color: var(--theme-text);
  font-weight: 700;
}

.cs-dirigeant-current {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.cs-dirigeant-chip {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--theme-border);
  border-left: 3px solid #8E3B46;
  border-radius: 10px;
  background: var(--theme-bg-page);
}

.cs-dirigeant-chip-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cs-dirigeant-chip-main strong {
  font-size: 14px;
  color: var(--theme-text);
  font-weight: 700;
}

.cs-dirigeant-chip-main span {
  font-size: 12px;
  color: var(--theme-text-muted);
}

.cs-dirigeant-chip-detail {
  font-style: italic;
}

.cs-dirigeant-empty {
  margin: 0;
  font-size: 12px;
  font-style: italic;
  color: var(--theme-text-muted);
}

.cs-dirigeant-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cs-dirigeant-clear {
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 600;
  color: #B91C1C;
  text-decoration: underline;
  cursor: pointer;
  font-family: var(--font-body);
}

.cs-dirigeant-clear:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  text-decoration: none;
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

.cs-batch-history {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--theme-border);
}

.cs-batch-history-list {
  display: grid;
  gap: 8px;
}

.cs-batch-history-item {
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid var(--theme-border);
  border-radius: 8px;
  font-size: 12px;
  color: var(--theme-text-muted);
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
.cs-invite-msg--warning { color: #B45309; }

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
