import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import './App.css'
import type { StoredMemberProfile } from './ProfileSheet'
import type { OnboardingFlowProps } from './OnboardingFlow'
import {
  getAcceptedInvitationAwaitingUserRow,
  getDirectionProjets,
  getRoadmapEligibleProjects,
  getLatestPendingInvitationForEmail,
  getWorkspace,
  getWorkspaceDirections,
  listWorkspaces,
  markInvitationsAcceptedForWorkspaceEmail,
} from './lib/api'
import { invalidateCache } from './lib/api/cache'
import type { Workspace } from './lib/types'
import {
  memberProfileStorageKey,
  migrateLegacyMemberProfileIfNeeded,
} from './lib/memberProfileStorage'
import { gravatarAvatarUrl } from './lib/gravatarUrl'
import UserAvatarImg from './UserAvatarImg'
import {
  clearWorkspaceSnapshot,
  readInitialCompanyLogo,
  readWorkspaceLogoUrl,
  readWorkspaceSnapshot,
  normalizeWorkspaceLogoUrl,
  writeWorkspaceLogoUrl,
  writeWorkspaceSnapshot,
} from './lib/workspaceSnapshot'
import { appRoleFromDbUser, invitationRoleToStoredRole, type AppUserRole } from './lib/appRole'
import type { User as AppDbUser } from './lib/types'

/** Rôle issu de `public.users` ou d’une invitation ; pas de lecture depuis localStorage. */
type ServerAccess =
  | { source: 'users'; dbUser: AppDbUser }
  | { source: 'invitation'; role: AppUserRole; workspaceId: string }
  /** `dbProfile` : ligne `public.users` pour l’email courant (avatar, noms), même si l’accès métier est « super-admin ». */
  | { source: 'superadmin'; dbProfile: AppDbUser | null }
import {
  getCurrentUser,
  isMfaEnrollmentRequiredForSuperadmin,
  isPlatformSuperadmin,
  signOut,
} from './lib/auth'
import { supabase } from './lib/supabase'
import {
  applyThemeToDocument,
  getStoredTheme,
  persistTheme,
  type ThemeMode,
} from './themeStorage'

const Login = lazy(() => import('./pages/Login'))
const SettingsPage = lazy(() => import('./pages/Settings'))
const WorkspaceHome = lazy(() => import('./pages/WorkspaceHome'))
const ProjectSelector = lazy(() => import('./ProjectSelector'))
const OnboardingFlow = lazy(() => import('./OnboardingFlow'))
const CompanySheet = lazy(() => import('./CompanySheet'))
const ProfileSheet = lazy(() => import('./ProfileSheet'))
const DashboardDG = lazy(() => import('./pages/DashboardDG'))
const DiscoursTransformationPage = lazy(() => import('./pages/DiscoursTransformation'))
const MaturityRoadmap = lazy(() => import('./MaturityRoadmap'))
const ReviewerSnapshotPage = lazy(() => import('./pages/ReviewerSnapshotPage'))

type JourneyModuleId =
  | 'projects'
  | 'roadmap'
  | 'review'
  | 'feedbacks'
  | 'pae_codir'
  | 'kickoff'
  | 'suivi_codir'
  | 'pae_contrib'
  | 'suivi_contrib'
  | 'dg'
  | 'discours_transfo'

type JourneyModule = {
  id: JourneyModuleId
  label: string
  subtitle?: string
  status: 'active' | 'soon'
}

const CODIR_JOURNEY_MODULES: readonly JourneyModule[] = [
  {
    id: 'projects',
    label: 'Projets transformants',
    subtitle: 'Je veux sélectionner et prioriser mes projets transformants',
    status: 'active',
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    subtitle: 'Je veux décliner mes projets transformants en Maturity Roadmaps',
    status: 'active',
  },
  {
    id: 'feedbacks',
    label: 'Feedbacks Roadmap',
    subtitle: 'Je veux répondre et arbitrer les feedbacks de mon équipe sur ma Maturity Roadmap V1',
    status: 'soon',
  },
  {
    id: 'pae_codir',
    label: "Plans d'actions d'Equipe (PAE) & Plans de charge (version membre CODIR)",
    subtitle: "J'affecte les jalons de ma Maturity Roadmaps V2 à des Managers pour réalisation de Plans d'actions d'Equipe (PAE) et plans de charge",
    status: 'soon',
  },
  {
    id: 'kickoff',
    label: 'Kick-off',
    subtitle: 'Je prépare ma présentation de ma Maturity Roadmaps V2 et des PAE',
    status: 'soon',
  },
  {
    id: 'suivi_codir',
    label: 'Suivi PAE (vue membre CODIR)',
    subtitle: "Je peux suivre la réalisation des plans d'action dans le temps (vers suivi PAE). Je mets à jour la Maturity Roadmap en fonction de la réalisation réelle",
    status: 'soon',
  },
]

const CONTRIBUTEUR_JOURNEY_MODULES: readonly JourneyModule[] = [
  {
    id: 'review',
    label: 'Review Roadmap',
    subtitle: "J'apporte mes feedbacks à la Maturity Roadmap de ma Direction",
    status: 'active',
  },
  {
    id: 'pae_contrib',
    label: "Plans d'actions d'Equipe (PAE) & Plans de charge (version contributeur)",
    subtitle: "Je souhaite créer mon plan de charge et mon plan d'action pour les Jalons de la Maturity Roadmap qui m'ont été affectés",
    status: 'soon',
  },
  {
    id: 'suivi_contrib',
    label: 'Suivi PAE (vue contributeur)',
    subtitle: "J'effectue le bon niveau de reporting lorsque je réalise mes PAE (vers Suivi PAE vue contributeur). Je décline de nouveaux jalons en PAE et plans de charge",
    status: 'soon',
  },
]

/** Entrées du menu « Vue décideur » (navbar), distinct du parcours de transformation. */
const DECIDEUR_VIEW_MODULES: readonly JourneyModule[] = [
  {
    id: 'discours_transfo',
    label: 'Discours de transformation',
    subtitle: 'Cadrage et narration de la transformation pour le comité de direction',
    status: 'active',
  },
  {
    id: 'dg',
    label: 'Cockpit Projet transfo',
    subtitle: 'Vue décideur consolidée : validation des projets BUILD, synthèses et arbitrages',
    status: 'active',
  },
]


type OnboardingData = OnboardingFlowProps extends { onComplete: (data: infer T) => void } ? T : never

const APP_SHELL_FALLBACK = (
  <div
    style={{
      minHeight: '100svh',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--theme-bg-page)',
      color: 'var(--theme-text)',
    }}
  >
    <p>Chargement...</p>
  </div>
)

function readStoredProfile(email?: string | null): StoredMemberProfile | null {
  try {
    migrateLegacyMemberProfileIfNeeded(email)
    const raw = localStorage.getItem(memberProfileStorageKey(email))
    return raw ? (JSON.parse(raw) as StoredMemberProfile) : null
  } catch {
    return null
  }
}

function profileInitials(profile: StoredMemberProfile | null): string {
  return `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase() || '?'
}

function asTrimmedString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t.length > 0 ? t : null
}

function avatarUrlFromMetadataRecord(rec: Record<string, unknown> | undefined | null): string | null {
  if (!rec) return null
  return (
    asTrimmedString(rec.avatar_url)
    ?? asTrimmedString(rec.picture)
    ?? asTrimmedString((rec as { image_url?: unknown }).image_url)
    ?? asTrimmedString((rec as { photo_url?: unknown }).photo_url)
    ?? asTrimmedString((rec as { profile_image_url?: unknown }).profile_image_url)
    ?? null
  )
}

const GOOGLE_AVATAR_HOST_RE = /\.(googleusercontent\.com|ggpht\.com)\b/i
const IMAGE_PATH_RE = /\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i

/** Parcourt un JSON de métadonnées (claims Google parfois imbriqués) pour trouver une URL de portrait. */
function scrapeAvatarUrlFromUnknown(obj: unknown, depth = 0): string | null {
  if (depth > 10 || obj == null) return null
  if (typeof obj === 'string') {
    const t = obj.trim()
    if (t.length < 12 || t.length > 4096) return null
    if (!/^https?:\/\//i.test(t)) return null
    if (GOOGLE_AVATAR_HOST_RE.test(t) || IMAGE_PATH_RE.test(t)) return t
    return null
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const hit = scrapeAvatarUrlFromUnknown(item, depth + 1)
      if (hit) return hit
    }
    return null
  }
  if (typeof obj === 'object') {
    for (const v of Object.values(obj as Record<string, unknown>)) {
      const hit = scrapeAvatarUrlFromUnknown(v, depth + 1)
      if (hit) return hit
    }
  }
  return null
}

/**
 * Photo fournie par le fournisseur OAuth (Google, etc.).
 * Préférer `getUser()` côté session : `getSession().user` (JWT) peut omettre `picture` / identities sur certains clients.
 */
function resolveAuthUserAvatarUrl(user: User): string | null {
  const meta = user.user_metadata as Record<string, unknown> | undefined
  const fromExplicit = avatarUrlFromMetadataRecord(meta)
  if (fromExplicit) return fromExplicit
  const fromMetaDeep = scrapeAvatarUrlFromUnknown(meta)
  if (fromMetaDeep) return fromMetaDeep
  for (const identity of user.identities ?? []) {
    const data = identity.identity_data as Record<string, unknown> | undefined
    const fromIdentity = avatarUrlFromMetadataRecord(data)
    if (fromIdentity) return fromIdentity
    const fromIdDeep = scrapeAvatarUrlFromUnknown(data)
    if (fromIdDeep) return fromIdDeep
  }
  return null
}

/** Prénom / nom / photo issus du JWT Auth (Google, etc.) — utile sur un appareil sans cache `localStorage`. */
function profilePatchFromAuthUser(user: User): Partial<StoredMemberProfile> {
  const patch: Partial<StoredMemberProfile> = {}
  const meta = user.user_metadata as Record<string, unknown> | undefined
  const gn = asTrimmedString(meta?.given_name)
  const fn = asTrimmedString(meta?.family_name)
  const full = asTrimmedString(meta?.full_name)
  if (gn) patch.firstName = gn
  if (fn) patch.lastName = fn
  if (!patch.firstName && full) {
    const parts = full.split(/\s+/).filter(Boolean)
    if (parts[0]) patch.firstName = parts[0]
    if (parts.length > 1) patch.lastName = parts.slice(1).join(' ')
  }
  const av = resolveAuthUserAvatarUrl(user)
  if (av) patch.avatar = av
  return patch
}

/** Champs profil issus de `public.users` (source de vérité hors appareil). */
function profilePatchFromDbUser(db: AppDbUser): Partial<StoredMemberProfile> {
  const patch: Partial<StoredMemberProfile> = {}
  const prenom = db.prenom?.trim()
  const nom = db.nom?.trim()
  if (prenom) patch.firstName = prenom
  if (nom) patch.lastName = nom
  const job = db.job_title?.trim()
  if (job) patch.jobTitle = job
  const dir = db.direction_nom?.trim()
  if (dir) patch.directionName = dir
  const av = db.avatar_url?.trim()
  if (av) patch.avatar = av
  if (db.direction_type) {
    patch.directionType =
      db.direction_type === 'Métier'
        ? 'metier'
        : db.direction_type === 'Géographique'
          ? 'geographique'
          : 'fonctionnel'
  }
  // Ne pas pousser des 0 depuis la base : souvent un doublon email « stub » écrase alors le cache local à chaque reco.
  if (typeof db.managed_count === 'number' && Number.isFinite(db.managed_count) && db.managed_count > 0) {
    patch.managedCount = db.managed_count
  }
  if (typeof db.total_effectif === 'number' && Number.isFinite(db.total_effectif) && db.total_effectif > 0) {
    patch.totalEffectif = db.total_effectif
  }
  return patch
}

function normalizeRoleLabel(role: AppUserRole): string {
  if (role === 'consultant') return 'Consultant'
  if (role === 'admin') return 'Admin'
  if (role === 'pilote') return 'Pilote'
  if (role === 'contributeur') return 'Contributeur'
  return 'Membre CODIR'
}

/**
 * Qui peut **voir** la vue décideur (menu + pages).
 * - Superadmin plateforme : oui
 * - Consultant owner, admin du workspace : oui
 * - Pilote projet : oui (en lecture seule)
 * - Membre CODIR **tagué dirigeant** du workspace : oui
 * - Membre CODIR non dirigeant, contributeur : non (menu invisible)
 */
function canViewDecideurView(
  role: AppUserRole,
  isPlatformSuperadmin: boolean,
  isWorkspaceDirigeant: boolean,
): boolean {
  if (isPlatformSuperadmin) return true
  if (role === 'consultant' || role === 'admin' || role === 'pilote') return true
  return isWorkspaceDirigeant
}

/**
 * Qui peut **agir** dans la vue décideur (valider / révoquer / éditer le discours).
 * - Superadmin, consultant owner, admin du workspace : oui
 * - Dirigeant tagué : oui
 * - Pilote projet : non (lecture seule)
 */
function canActOnDecideurValidation(
  role: AppUserRole,
  isPlatformSuperadmin: boolean,
  isWorkspaceDirigeant: boolean,
): boolean {
  if (isPlatformSuperadmin) return true
  if (role === 'consultant' || role === 'admin') return true
  return isWorkspaceDirigeant
}

function resolveJourneyVisibility(role: AppUserRole, isPlatformSuperadmin: boolean): {
  showCodirSection: boolean
  showContributeurSection: boolean
} {
  if (isPlatformSuperadmin) {
    return { showCodirSection: true, showContributeurSection: true }
  }
  if (role === 'contributeur') {
    return { showCodirSection: false, showContributeurSection: true }
  }
  if (role === 'consultant' || role === 'admin' || role === 'pilote') {
    return { showCodirSection: true, showContributeurSection: true }
  }
  return { showCodirSection: true, showContributeurSection: false }
}

type DashboardMainNavProps = {
  activeNav: string
  codirModules: readonly JourneyModule[]
  contributeurModules: readonly JourneyModule[]
  showCodirSection: boolean
  showContributeurSection: boolean
  onNavigate: (navId: string) => void
  onOpenRoadmap: () => void
  onGoHome: () => void
  className: string
  mobileMode?: boolean
  id?: string
  onItemPick?: () => void
  userDisplayName?: string | null
}

function DashboardMainNav({
  activeNav,
  codirModules,
  contributeurModules,
  showCodirSection,
  showContributeurSection,
  onNavigate,
  onOpenRoadmap,
  onGoHome,
  className,
  mobileMode = false,
  id,
  onItemPick,
  userDisplayName,
}: DashboardMainNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

  function pick(module: JourneyModule) {
    if (module.status === 'soon') return
    if (module.id === 'roadmap') {
      onOpenRoadmap()
    } else {
      onNavigate(module.id)
    }
    onItemPick?.()
    setMenuOpen(false)
  }

  function renderModuleItem(module: JourneyModule) {
    const isActive = activeNav === module.id
    const isSoon = module.status === 'soon'
    return (
      <button
        key={module.id}
        type="button"
        className={[
          'dashboard__nav-item',
          isActive ? 'dashboard__nav-item--active' : '',
          isSoon ? 'dashboard__nav-item--soon' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => pick(module)}
        disabled={isSoon}
        aria-disabled={isSoon}
      >
        <span className="dashboard__nav-item-main">
          <span className="dashboard__nav-item-label">{module.label}</span>
          {isSoon ? <span className="dashboard__nav-badge-soon">Bientôt</span> : null}
          {isActive && !isSoon ? (
            <span className="dashboard__nav-badge-current" aria-label="Étape en cours">
              Étape en cours
            </span>
          ) : null}
        </span>
        {module.subtitle ? (
          <span className="dashboard__nav-item-subtitle">{module.subtitle}</span>
        ) : null}
      </button>
    )
  }

  function openMenuWithDelay() {
    if (mobileMode) return
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setMenuOpen(true)
  }

  function closeMenuWithDelay() {
    if (mobileMode) return
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(() => {
      setMenuOpen(false)
      closeTimerRef.current = null
    }, 180)
  }

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
  }, [])

  function renderSection(title: string, modules: readonly JourneyModule[]) {
    if (modules.length === 0) return null
    return (
      <section key={title} className="dashboard__journey-section">
        <span className="dashboard__nav-section-label">{title}</span>
        <div className="dashboard__journey-section-items">
          {modules.map(renderModuleItem)}
        </div>
      </section>
    )
  }

  return (
    <nav id={id} className={className} aria-label="Navigation principale">
      {mobileMode ? (
        (() => {
          const bothSections = showCodirSection && showContributeurSection
          const cleanName = userDisplayName?.trim()
          const singleLabel = cleanName ? `Parcours de ${cleanName}` : 'Mon parcours de transformation'
          const codirLabel = bothSections ? 'Parcours membre CODIR' : singleLabel
          const contributeurLabel = bothSections ? 'Parcours membre contributeur' : singleLabel
          return (
            <>
              {showCodirSection ? renderSection(codirLabel, codirModules) : null}
              {showContributeurSection ? renderSection(contributeurLabel, contributeurModules) : null}
            </>
          )
        })()
      ) : (
        <div
          className="dashboard__journey-menu"
          onMouseEnter={openMenuWithDelay}
          onMouseLeave={closeMenuWithDelay}
        >
          <button
            type="button"
            className={`dashboard__nav-journey-trigger ${menuOpen ? 'dashboard__nav-journey-trigger--open' : ''}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => {
              onGoHome()
              setMenuOpen((v) => !v)
            }}
          >
            Mon parcours de transformation
          </button>
          {menuOpen ? (
            <div className="dashboard__journey-popover" role="menu">
              {showCodirSection ? renderSection('Parcours membre CODIR', codirModules) : null}
              {showContributeurSection ? renderSection('Parcours membre contributeur', contributeurModules) : null}
            </div>
          ) : null}
        </div>
      )}
    </nav>
  )
}

type DashboardDecideurNavProps = {
  activeNav: string
  onNavigate: (navId: string) => void
  onGoHome: () => void
  className: string
  mobileMode?: boolean
  id?: string
  onItemPick?: () => void
}

function DashboardDecideurNav({
  activeNav,
  onNavigate,
  onGoHome,
  className,
  mobileMode = false,
  id,
  onItemPick,
}: DashboardDecideurNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

  function pick(module: JourneyModule) {
    if (module.status === 'soon') return
    onNavigate(module.id)
    onItemPick?.()
    setMenuOpen(false)
  }

  function renderModuleItem(module: JourneyModule) {
    const isActive = activeNav === module.id
    const isSoon = module.status === 'soon'
    return (
      <button
        key={module.id}
        type="button"
        className={[
          'dashboard__nav-item',
          isActive ? 'dashboard__nav-item--active' : '',
          isSoon ? 'dashboard__nav-item--soon' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => pick(module)}
        disabled={isSoon}
        aria-disabled={isSoon}
      >
        <span className="dashboard__nav-item-main">
          <span className="dashboard__nav-item-label">{module.label}</span>
          {isSoon ? <span className="dashboard__nav-badge-soon">Bientôt</span> : null}
          {isActive && !isSoon ? (
            <span className="dashboard__nav-badge-current" aria-label="Étape en cours">
              Étape en cours
            </span>
          ) : null}
        </span>
        {module.subtitle ? (
          <span className="dashboard__nav-item-subtitle">{module.subtitle}</span>
        ) : null}
      </button>
    )
  }

  function openMenuWithDelay() {
    if (mobileMode) return
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setMenuOpen(true)
  }

  function closeMenuWithDelay() {
    if (mobileMode) return
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(() => {
      setMenuOpen(false)
      closeTimerRef.current = null
    }, 180)
  }

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
  }, [])

  return (
    <nav id={id} className={className} aria-label="Vue décideur">
      {mobileMode ? (
        <>
          <span className="dashboard__nav-journey-title">Vue décideur</span>
          <section className="dashboard__journey-section">
            <div className="dashboard__journey-section-items">
              {DECIDEUR_VIEW_MODULES.map(renderModuleItem)}
            </div>
          </section>
        </>
      ) : (
        <div
          className="dashboard__journey-menu"
          onMouseEnter={openMenuWithDelay}
          onMouseLeave={closeMenuWithDelay}
        >
          <button
            type="button"
            className={`dashboard__nav-journey-trigger ${menuOpen ? 'dashboard__nav-journey-trigger--open' : ''}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => {
              onGoHome()
              setMenuOpen((v) => !v)
            }}
          >
            Vue décideur
          </button>
          {menuOpen ? (
            <div className="dashboard__journey-popover dashboard__journey-popover--decideur" role="menu">
              <section className="dashboard__journey-section">
                <div className="dashboard__journey-section-items">
                  {DECIDEUR_VIEW_MODULES.map(renderModuleItem)}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      )}
    </nav>
  )
}

function ModulePlaceholder({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <section className="dashboard__module-panel">
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  )
}

function App() {
  const debugLog = useCallback((payload: {
    runId: string
    hypothesisId: string
    location: string
    message: string
    data: Record<string, unknown>
  }) => {
    // #region agent log
    fetch('http://127.0.0.1:7271/ingest/4a825d9f-9e80-4d72-a03f-6e97efcd6511',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cf4629'},body:JSON.stringify({sessionId:'cf4629',runId:payload.runId,hypothesisId:payload.hypothesisId,location:payload.location,message:payload.message,data:payload.data,timestamp:Date.now()})}).catch(()=>{})
    // #endregion
  }, [])

  const readReviewSnapshotFromUrl = useCallback((): string | null => {
    const path = window.location.pathname
    const m = path.match(/^\/review\/([0-9a-f-]{16,})$/i)
    return m?.[1] ?? null
  }, [])
  const [authLoading, setAuthLoading] = useState(true)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => localStorage.getItem('workspaceId'))
  const [workspaceData, setWorkspaceData] = useState<OnboardingData | null>(null)
  const [workspaceName, setWorkspaceName] = useState('La Forge')
  const [companyLogo, setCompanyLogo] = useState<string | null>(readInitialCompanyLogo)
  const [storedProfile, setStoredProfile] = useState<StoredMemberProfile | null>(null)
  const [userInitials, setUserInitials] = useState('?')
  const [activeNav, setActiveNav] = useState<string>('home')
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme())
  const [platformSuperadmin, setPlatformSuperadmin] = useState(false)
  const normalizedActiveNav = useMemo(() => {
    const known = [
      'home',
      'settings',
      'company',
      'projects',
      'review',
      'feedbacks',
      'pae_codir',
      'kickoff',
      'suivi_codir',
      'pae_contrib',
      'suivi_contrib',
      'dg',
      'discours_transfo',
    ] as const
    return known.includes(activeNav as (typeof known)[number]) ? activeNav : 'home'
  }, [activeNav])

  const [maturityRoadmapOpen, setMaturityRoadmapOpen] = useState(false)
  const [roadmapFocusProjetId, setRoadmapFocusProjetId] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showWorkspaceOnboarding, setShowWorkspaceOnboarding] = useState(false)
  const [workspacesCatalog, setWorkspacesCatalog] = useState<Workspace[]>([])
  const [workspacesLoading, setWorkspacesLoading] = useState(false)
  const [workspacesError, setWorkspacesError] = useState<string | null>(null)
  const [serverAccess, setServerAccess] = useState<ServerAccess | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mfaEnrollmentRequired, setMfaEnrollmentRequired] = useState(false)
  const [reviewSnapshotId, setReviewSnapshotId] = useState<string | null>(() => {
    const path = window.location.pathname
    const m = path.match(/^\/review\/([0-9a-f-]{16,})$/i)
    return m?.[1] ?? null
  })

  const currentUserRole: AppUserRole =
    serverAccess?.source === 'superadmin'
      ? 'consultant'
      : serverAccess?.source === 'invitation'
        ? serverAccess.role
        : serverAccess?.source === 'users'
          ? appRoleFromDbUser(serverAccess.dbUser)
          : 'consultant'

  /** Identifiant public.users.id de l'utilisateur courant (utile pour les ACLs côté UI). */
  const currentAppUserId: string | null =
    serverAccess?.source === 'users'
      ? serverAccess.dbUser.id
      : serverAccess?.source === 'superadmin'
        ? serverAccess.dbProfile?.id ?? null
        : null

  /** L'utilisateur courant est-il le membre CODIR « dirigeant » désigné pour ce workspace ? */
  const isWorkspaceDirigeant: boolean =
    currentAppUserId != null &&
    workspaceData?.workspace?.dirigeant_user_id != null &&
    workspaceData.workspace.dirigeant_user_id === currentAppUserId

  /** Paramètres globaux : rôle issu du serveur ou super-admin (RPC). */
  const canAccessSettings =
    platformSuperadmin ||
    (serverAccess?.source === 'users' &&
      (serverAccess.dbUser.role === 'consultant' || serverAccess.dbUser.role === 'admin')) ||
    (serverAccess?.source === 'invitation' &&
      (serverAccess.role === 'consultant' || serverAccess.role === 'admin')) ||
    serverAccess?.source === 'superadmin'

  /**
   * Fiche entreprise : accessible en édition aux rôles de pilotage
   * (super admin plateforme, consultant owner du workspace, admin & pilote côté client).
   * Les membres CODIR (dirigeant ou non) et contributeurs n'y ont pas accès.
   */
  const canViewCompanySheet =
    platformSuperadmin ||
    currentUserRole === 'consultant' ||
    currentUserRole === 'admin' ||
    currentUserRole === 'pilote'

  const exitRoadmap = useCallback(() => {
    setMaturityRoadmapOpen(false)
    setRoadmapFocusProjetId(null)
  }, [])

  const navigateToMainNav = useCallback(
    (navId: string) => {
      exitRoadmap()
      setActiveNav(navId)
    },
    [exitRoadmap],
  )

  const closeMobileNav = useCallback(() => {
    // #region agent log
    debugLog({
      runId: 'hamburger-overlap',
      hypothesisId: 'H3',
      location: 'src/App.tsx:closeMobileNav',
      message: 'Fermeture menu mobile',
      data: { mobileNavOpenBeforeClose: mobileNavOpen, innerWidth: window.innerWidth, innerHeight: window.innerHeight },
    })
    // #endregion
    setMobileNavOpen(false)
  }, [debugLog, mobileNavOpen])

  const handleLogout = useCallback(() => {
    void signOut()
    localStorage.removeItem('workspaceId')
    clearWorkspaceSnapshot()
    // Ne pas supprimer le cache « Mon profil » : il est indexé par email et doit survivre déco/reco.
    setWorkspaceId(null)
    setWorkspaceData(null)
    setCompanyLogo(null)
    setWorkspaceName('La Forge')
    setServerAccess(null)
    setMobileNavOpen(false)
    navigateToMainNav('home')
    setAuthUser(null)
  }, [navigateToMainNav])

  useEffect(() => {
    if (!mobileNavOpen) return
    // #region agent log
    debugLog({
      runId: 'hamburger-overlap',
      hypothesisId: 'H1',
      location: 'src/App.tsx:mobileNavOpenEffect:enter',
      message: 'Ouverture menu mobile detectee',
      data: { mobileNavOpen, innerWidth: window.innerWidth, innerHeight: window.innerHeight, scrollY: window.scrollY },
    })
    // #endregion

    const frameId = window.requestAnimationFrame(() => {
      const panel = document.querySelector('.dashboard__mobile-nav-panel') as HTMLElement | null
      const layer = document.querySelector('.dashboard__mobile-nav-layer') as HTMLElement | null
      const topbarActions = document.querySelector('.dashboard__topbar-actions') as HTMLElement | null
      const topbarSecondary = document.querySelector('.dashboard__topbar-actions-secondary') as HTMLElement | null
      const drawerItems = Array.from(document.querySelectorAll('.dashboard__nav--drawer .dashboard__nav-item')) as HTMLElement[]
      const drawerItemMetrics = drawerItems.slice(0, 3).map((item, index) => {
        const subtitle = item.querySelector('.dashboard__nav-item-subtitle') as HTMLElement | null
        const label = item.querySelector('.dashboard__nav-item-label') as HTMLElement | null
        const itemRect = item.getBoundingClientRect()
        const subtitleRect = subtitle?.getBoundingClientRect() ?? null
        const labelRect = label?.getBoundingClientRect() ?? null
        return {
          index,
          className: item.className,
          clientHeight: item.clientHeight,
          scrollHeight: item.scrollHeight,
          overflowY: window.getComputedStyle(item).overflowY,
          display: window.getComputedStyle(item).display,
          flexDirection: window.getComputedStyle(item).flexDirection,
          alignItems: window.getComputedStyle(item).alignItems,
          itemRect,
          labelRect,
          subtitleRect,
          subtitleExists: Boolean(subtitle),
          subtitleTextLength: subtitle?.textContent?.trim().length ?? 0,
        }
      })
      const panelRect = panel?.getBoundingClientRect() ?? null
      const topbarRect = topbarActions?.getBoundingClientRect() ?? null
      const overlap =
        panelRect && topbarRect
          ? !(panelRect.right < topbarRect.left || panelRect.left > topbarRect.right || panelRect.bottom < topbarRect.top || panelRect.top > topbarRect.bottom)
          : null
      // #region agent log
      debugLog({
        runId: 'hamburger-overlap',
        hypothesisId: 'H2',
        location: 'src/App.tsx:mobileNavOpenEffect:layout',
        message: 'Mesures overlay mobile/topbar',
        data: {
          panelRect,
          topbarRect,
          hasOverlap: overlap,
          layerAlignItems: layer ? window.getComputedStyle(layer).alignItems : null,
          layerJustifyContent: layer ? window.getComputedStyle(layer).justifyContent : null,
          topbarSecondaryDisplay: topbarSecondary ? window.getComputedStyle(topbarSecondary).display : null,
          topbarActionsDisplay: topbarActions ? window.getComputedStyle(topbarActions).display : null,
        },
      })
      // #endregion
      // #region agent log
      debugLog({
        runId: 'hamburger-overlap',
        hypothesisId: 'H5',
        location: 'src/App.tsx:mobileNavOpenEffect:drawer-items',
        message: 'Mesures des items drawer mobile',
        data: {
          itemCount: drawerItems.length,
          firstItems: drawerItemMetrics,
        },
      })
      // #endregion
    })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [debugLog, mobileNavOpen])

  useEffect(() => {
    const onPop = () => setReviewSnapshotId(readReviewSnapshotFromUrl())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [readReviewSnapshotFromUrl])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(min-width: 769px)')
    const onChange = () => {
      // #region agent log
      debugLog({
        runId: 'hamburger-overlap',
        hypothesisId: 'H4',
        location: 'src/App.tsx:mobileMq:onChange',
        message: 'Changement media query mobile',
        data: { mqMatchesDesktop: mq.matches, innerWidth: window.innerWidth, mobileNavOpenBeforeChange: mobileNavOpen },
      })
      // #endregion
      if (mq.matches) setMobileNavOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [debugLog, mobileNavOpen])

  useLayoutEffect(() => {
    applyThemeToDocument(theme)
    persistTheme(theme)
  }, [theme])

  useEffect(() => {
    if (activeNav === 'settings' && !canAccessSettings) {
      navigateToMainNav('home')
    }
  }, [activeNav, canAccessSettings, navigateToMainNav])

  useEffect(() => {
    if (
      (activeNav === 'dg' || activeNav === 'discours_transfo') &&
      !canViewDecideurView(currentUserRole, platformSuperadmin, isWorkspaceDirigeant)
    ) {
      navigateToMainNav('home')
    }
  }, [activeNav, currentUserRole, platformSuperadmin, isWorkspaceDirigeant, navigateToMainNav])

  useEffect(() => {
    if (activeNav === 'company' && !canViewCompanySheet) {
      navigateToMainNav('home')
    }
  }, [activeNav, canViewCompanySheet, navigateToMainNav])

  const refreshWorkspacesCatalog = useCallback(async () => {
    if (!canAccessSettings) return
    setWorkspacesLoading(true)
    setWorkspacesError(null)
    try {
      invalidateCache(['workspaces:list'])
      const list = await listWorkspaces()
      setWorkspacesCatalog(list)
    } catch (err) {
      const message =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message?: unknown }).message ?? '').trim()
          : ''
      setWorkspacesError(message || 'Impossible de charger la liste des entreprises.')
      setWorkspacesCatalog([])
    } finally {
      setWorkspacesLoading(false)
    }
  }, [canAccessSettings])

  useEffect(() => {
    if (activeNav !== 'settings' || !canAccessSettings) return
    void refreshWorkspacesCatalog()
  }, [activeNav, canAccessSettings, refreshWorkspacesCatalog])

  /** OAuth : ne pas recalculer à chaque TOKEN_REFRESHED (nouvelle ref `user`) si l’URL photo est inchangée. */
  const oauthAvatarHydrationKey = useMemo(() => {
    if (!authUser) return ''
    return `${authUser.id}|${resolveAuthUserAvatarUrl(authUser) ?? ''}`
  }, [authUser])

  /** Recharge le cache profil pour l’email connecté (clé par email, migration legacy). */
  useEffect(() => {
    const email = authUser?.email?.trim().toLowerCase()
    if (!email) {
      setStoredProfile(null)
      setUserInitials('?')
      return
    }
    migrateLegacyMemberProfileIfNeeded(email)
    const p = readStoredProfile(email)
    setStoredProfile(p)
    setUserInitials(profileInitials(p))
  }, [authUser?.email])

  /**
   * Mobile / autre appareil : pas de `localStorage` partagé avec le desktop — on remplit depuis
   * `public.users` (getCurrentUser si besoin) puis les métadonnées OAuth. Le cache local (`prev`) gagne en dernier.
   */
  useEffect(() => {
    const email = authUser?.email?.trim().toLowerCase()
    if (!email || !authUser) return

    let cancelled = false

    void (async () => {
      let dbRow: AppDbUser | null =
        serverAccess?.source === 'users'
          ? serverAccess.dbUser
          : serverAccess?.source === 'superadmin'
            ? serverAccess.dbProfile
            : null

      if (!dbRow) {
        const row = await getCurrentUser()
        if (cancelled) return
        dbRow = row
      }

      const patchDb = dbRow ? profilePatchFromDbUser(dbRow) : {}
      const patchAuth = profilePatchFromAuthUser(authUser)
      const prev = readStoredProfile(email) ?? {}
      // Auth → base → cache : la base bat Google sur les champs renseignés ; le cache bat tout pour les retouches locales.
      const next: StoredMemberProfile = { ...patchAuth, ...patchDb, ...prev }

      const nDb = Object.keys(patchDb).length
      const nAuth = Object.keys(patchAuth).length
      if (nDb === 0 && nAuth === 0) return

      try {
        if (JSON.stringify(prev) === JSON.stringify(next)) return
      } catch {
        /* continuer */
      }

      try {
        localStorage.setItem(memberProfileStorageKey(email), JSON.stringify(next))
      } catch {
        /* quota ou mode privé */
      }
      if (!cancelled) {
        setStoredProfile(next)
        setUserInitials(profileInitials(next))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [serverAccess, oauthAvatarHydrationKey, authUser, authUser?.email, authUser?.id])

  const handleSelectWorkspaceFromSettings = useCallback((id: string) => {
    localStorage.setItem('workspaceId', id)
    setWorkspaceId(id)
    navigateToMainNav('company')
  }, [navigateToMainNav])

  const handleOpenRoadmapFromWorkspace = useCallback(async () => {
    if (!workspaceId) {
      navigateToMainNav('projects')
      return
    }

    const directions = await getWorkspaceDirections(workspaceId)
    if (directions.length === 0) {
      navigateToMainNav('projects')
      window.alert('Aucune direction disponible. Créez d’abord vos directions et projets transformants.')
      return
    }

    const eligible = await getRoadmapEligibleProjects(workspaceId)
    if (eligible.length === 0) {
      let pendingDg = false
      for (const d of directions) {
        const directionProjects = await getDirectionProjets(d.id)
        if (
          directionProjects.some(
            (p) => p.type === 'BUILD' && p.selected_for_transfo && !p.dg_validated_transfo,
          )
        ) {
          pendingDg = true
          break
        }
      }
      navigateToMainNav(pendingDg ? 'dg' : 'projects')
      window.alert(
        pendingDg
          ? 'Votre projet BUILD est soumis au décideur mais pas encore validé pour la roadmap. Ouvrez le menu « Vue décideur », puis « Cockpit Projet transfo », et validez le projet (section « Projets BUILD soumis pour la roadmap »).'
          : 'Aucun projet BUILD validé par le décideur pour la roadmap. Créez un projet transformant BUILD, retenez-le pour le décideur, puis validez-le dans le Cockpit Projet transfo (menu « Vue décideur »).',
      )
      return
    }

    setRoadmapFocusProjetId(null)
    setMaturityRoadmapOpen(true)
  }, [workspaceId, navigateToMainNav])

  const reconcileAuthSession = useCallback(async (user: User) => {
    try {
      const email = user.email ?? ''
      const emailNorm = email.trim().toLowerCase()
      const invitedUser = await getCurrentUser()
      const platformSuper = await isPlatformSuperadmin()
      const skipInvFetch = Boolean(invitedUser) || platformSuper
      const pendingInv = skipInvFetch ? null : await getLatestPendingInvitationForEmail(emailNorm)
      const acceptedInv = skipInvFetch ? null : await getAcceptedInvitationAwaitingUserRow(emailNorm)
      const invBootstrap = pendingInv ?? acceptedInv

      if (platformSuper || invitedUser) {
        setPlatformSuperadmin(platformSuper)
        if (platformSuper) {
          const requiresMfa = await isMfaEnrollmentRequiredForSuperadmin()
          setMfaEnrollmentRequired(requiresMfa)
        } else {
          setMfaEnrollmentRequired(false)
        }
        setAuthUser(user)
        if (invitedUser) {
          setServerAccess({ source: 'users', dbUser: invitedUser })
          if (invitedUser.workspace_id) {
            const isConsultantMember = invitedUser.role === 'consultant'
            if (!isConsultantMember) {
              localStorage.setItem('workspaceId', invitedUser.workspace_id)
              setWorkspaceId(invitedUser.workspace_id)
            }
          }
        } else if (platformSuper) {
          setServerAccess({ source: 'superadmin', dbProfile: invitedUser ?? null })
        } else {
          setServerAccess(null)
        }
        try {
          if (invitedUser?.workspace_id && invitedUser.email) {
            await markInvitationsAcceptedForWorkspaceEmail(invitedUser.workspace_id, invitedUser.email)
          }
        } catch {
          /* alignement statut invitation : best-effort */
        }
        return
      }
      if (invBootstrap?.workspace_id) {
        setPlatformSuperadmin(false)
        setAuthUser(user)
        localStorage.setItem('workspaceId', invBootstrap.workspace_id)
        setWorkspaceId(invBootstrap.workspace_id)
        localStorage.removeItem('lfdc-user-id')
        setServerAccess({
          source: 'invitation',
          role: invitationRoleToStoredRole(invBootstrap.role),
          workspaceId: invBootstrap.workspace_id,
        })
        return
      }
      setServerAccess(null)
      await signOut()
      setPlatformSuperadmin(false)
      setMfaEnrollmentRequired(false)
      setAuthUser(null)
    } finally {
      invalidateCache(['workspace-users:', 'workspaces:list'])
    }
  }, [])

  useEffect(() => {
    let alive = true

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!alive) return
      const sessionUser = session?.user ?? null
      if (!sessionUser) {
        setAuthUser(null)
        setPlatformSuperadmin(false)
        setServerAccess(null)
        setAuthLoading(false)
        return
      }

      const { data: freshData, error: freshErr } = await supabase.auth.getUser()
      if (!alive) return
      const freshUser = !freshErr && freshData?.user ? freshData.user : null
      const resolvedUser = freshUser ?? sessionUser

      await reconcileAuthSession(resolvedUser)
      if (!alive) return
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        const sessionUser = session?.user ?? null
        if (!sessionUser) {
          setAuthUser(null)
          setPlatformSuperadmin(false)
          setServerAccess(null)
          setAuthLoading(false)
          return
        }

        const { data: freshData, error: freshErr } = await supabase.auth.getUser()
        const freshUser = !freshErr && freshData?.user ? freshData.user : null
        const resolvedUser = freshUser ?? sessionUser

        await reconcileAuthSession(resolvedUser)
        setAuthLoading(false)
      })()
    })

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [reconcileAuthSession])

  /** Quand l’email Auth est confirmé, aligner `invitations.status` pour que la liste côté consultant ne reste pas bloquée sur « en attente ». */
  useEffect(() => {
    if (!authUser?.email_confirmed_at || !authUser.email) return
    const email = authUser.email.trim().toLowerCase()
    void (async () => {
      try {
        const pending = await getLatestPendingInvitationForEmail(email)
        if (pending?.workspace_id) {
          await markInvitationsAcceptedForWorkspaceEmail(pending.workspace_id, email)
        }
      } catch {
        /* Nécessite en base la policy UPDATE invitations pour l’invité (voir message déploiement). */
      }
    })()
  }, [authUser?.id, authUser?.email, authUser?.email_confirmed_at])

  useEffect(() => {
    if (!authUser) return
    if (!workspaceId) return
    let cancelled = false
    void (async () => {
      try {
        const workspace = await getWorkspace(workspaceId)
        if (cancelled) return
        const snap = readWorkspaceSnapshot()
        const snapLogo =
          snap?.id === workspace.id ? normalizeWorkspaceLogoUrl(snap.logo_url) : null
        const cachedLogo = readWorkspaceLogoUrl(workspace.id)
        const logoFromApi = normalizeWorkspaceLogoUrl(workspace.logo_url)
        const logoMerged = logoFromApi || cachedLogo || snapLogo
        setWorkspaceName(workspace.company_name)
        setCompanyLogo(logoMerged)
        if (logoFromApi) {
          writeWorkspaceLogoUrl(workspace.id, logoFromApi)
        } else if (logoMerged) {
          writeWorkspaceLogoUrl(workspace.id, logoMerged)
        }
        writeWorkspaceSnapshot({
          id: workspace.id,
          company_name: workspace.company_name,
          sector: workspace.sector,
          size: workspace.size,
          logo_url: logoMerged,
        })
        setWorkspaceData((prev) => ({
          workspace: { ...workspace, logo_url: logoMerged },
          companyName: workspace.company_name,
          sector: workspace.sector ?? prev?.sector ?? 'Non renseigné',
          size: workspace.size ?? prev?.size ?? 'Non renseigné',
          companyLogo: logoMerged,
          members: prev?.members ?? [],
        }))
      } catch {
        if (cancelled) return
        const snap = readWorkspaceSnapshot()
        if (snap && snap.id === workspaceId) {
          setWorkspaceName(snap.company_name)
          const fallback =
            normalizeWorkspaceLogoUrl(snap.logo_url) || readWorkspaceLogoUrl(workspaceId)
          setCompanyLogo(fallback)
          if (fallback) writeWorkspaceLogoUrl(workspaceId, fallback)
          setWorkspaceData((prev) => {
            const workspaceFallback: Workspace = {
              id: snap.id,
              company_name: snap.company_name,
              sector: snap.sector,
              size: snap.size as Workspace['size'],
              logo_url: snap.logo_url,
              created_at: prev?.workspace?.created_at ?? '',
              trigram_convention: 'prenom_nom_3',
              current_step: prev?.workspace?.current_step ?? null,
              dirigeant_user_id: prev?.workspace?.dirigeant_user_id ?? null,
            }
            return {
              workspace: prev?.workspace ?? workspaceFallback,
              companyName: snap.company_name,
              sector: snap.sector ?? 'Non renseigné',
              size: snap.size ?? 'Non renseigné',
              companyLogo: snap.logo_url,
              members: prev?.members ?? [],
            }
          })
        } else {
          localStorage.removeItem('workspaceId')
          clearWorkspaceSnapshot()
          setWorkspaceId(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authUser, workspaceId])

  if (authLoading) {
    return APP_SHELL_FALLBACK
  }

  if (!authUser) {
    return (
      <Suspense fallback={APP_SHELL_FALLBACK}>
        <Login
          onAuthenticated={(user) => {
            setAuthUser(user)
          }}
        />
      </Suspense>
    )
  }

  const authMeta = (authUser.user_metadata ?? {}) as Record<string, unknown>
  const fullName = typeof authMeta.full_name === 'string' ? authMeta.full_name.trim() : ''
  const givenName = typeof authMeta.given_name === 'string' ? authMeta.given_name.trim() : ''
  const familyName = typeof authMeta.family_name === 'string' ? authMeta.family_name.trim() : ''
  const fallbackFirstName = storedProfile?.firstName || givenName || (fullName ? fullName.split(' ')[0] : '')
  const fallbackLastName =
    storedProfile?.lastName
    || familyName
    || (fullName && fullName.includes(' ') ? fullName.split(' ').slice(1).join(' ') : '')
  const workspaceWelcomeName = [fallbackFirstName, fallbackLastName].filter(Boolean).join(' ').trim()
  const profileRoleLabel = platformSuperadmin ? 'Super admin plateforme' : normalizeRoleLabel(currentUserRole)
  const canViewDecideur = canViewDecideurView(currentUserRole, platformSuperadmin, isWorkspaceDirigeant)
  const canActDecideur = canActOnDecideurValidation(currentUserRole, platformSuperadmin, isWorkspaceDirigeant)
  const { showCodirSection, showContributeurSection } = resolveJourneyVisibility(
    currentUserRole,
    platformSuperadmin,
  )
  const codirModules = CODIR_JOURNEY_MODULES
  const contributeurModules = CONTRIBUTEUR_JOURNEY_MODULES
  const avatarFromDb =
    serverAccess?.source === 'users'
      ? serverAccess.dbUser.avatar_url?.trim() || null
      : serverAccess?.source === 'superadmin'
        ? serverAccess.dbProfile?.avatar_url?.trim() || null
        : null
  const avatarFromAuth = resolveAuthUserAvatarUrl(authUser)
  const avatarFromGravatar = gravatarAvatarUrl(authUser.email)
  const avatarDisplayUrl =
    storedProfile?.avatar?.trim()
    || avatarFromDb
    || avatarFromAuth
    || avatarFromGravatar
    || null

  if (showWorkspaceOnboarding) {
    return (
      <Suspense fallback={APP_SHELL_FALLBACK}>
        <OnboardingFlow
          onCancel={() => setShowWorkspaceOnboarding(false)}
            onComplete={async (data) => {
            localStorage.setItem('workspaceId', data.workspace.id)
            setWorkspaceId(data.workspace.id)
            setWorkspaceName(data.workspace.company_name)
            const logo =
              normalizeWorkspaceLogoUrl(data.workspace.logo_url)
              ?? normalizeWorkspaceLogoUrl(data.companyLogo)
            setCompanyLogo(logo)
            writeWorkspaceLogoUrl(data.workspace.id, logo)
            writeWorkspaceSnapshot({
              id: data.workspace.id,
              company_name: data.workspace.company_name,
              sector: data.workspace.sector,
              size: data.workspace.size,
              logo_url: logo,
            })
            const nextProfile = readStoredProfile(authUser?.email)
            setStoredProfile(nextProfile)
            setUserInitials(profileInitials(nextProfile))
            setWorkspaceData(data)
            navigateToMainNav('company')
            setShowWorkspaceOnboarding(false)
            void refreshWorkspacesCatalog()
            const {
              data: { session },
            } = await supabase.auth.getSession()
            if (session?.user) {
              await reconcileAuthSession(session.user)
            }
          }}
        />
      </Suspense>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard__topbar">
        <div className="dashboard__topbar-inner">
          <div className="dashboard__topbar-leading">
            <button
              type="button"
              className="dashboard__brand"
              onClick={() => navigateToMainNav('home')}
              aria-label="Retour à l'accueil"
            >
              <div className="dashboard__brand-mark">
                {companyLogo
                  ? <img src={companyLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                  : <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 700, lineHeight: 1 }}>
                    {workspaceName.slice(0, 2).toUpperCase()}
                  </span>
                }
              </div>
              <span className="dashboard__brand-stack">
                <span className="dashboard__brand-product">La Forge du Changement</span>
                <span className="dashboard__brand-text">{workspaceName}</span>
              </span>
            </button>

            <button
              type="button"
              className="dashboard__menu-btn"
              aria-label={mobileNavOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileNavOpen}
              aria-haspopup="dialog"
              aria-controls={mobileNavOpen ? 'dashboard-mobile-nav' : undefined}
              onClick={() =>
                setMobileNavOpen((o) => {
                  const next = !o
                  // #region agent log
                  debugLog({
                    runId: 'hamburger-overlap',
                    hypothesisId: 'H1',
                    location: 'src/App.tsx:menuBtn:onClick',
                    message: 'Toggle menu hamburger',
                    data: { before: o, after: next, innerWidth: window.innerWidth, innerHeight: window.innerHeight },
                  })
                  // #endregion
                  return next
                })
              }
            >
              <span className="dashboard__menu-bars" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>

          <div className="dashboard__nav-strip dashboard__nav--desktop">
            <DashboardMainNav
              activeNav={activeNav}
              codirModules={codirModules}
              contributeurModules={contributeurModules}
              showCodirSection={showCodirSection}
              showContributeurSection={showContributeurSection}
              onNavigate={navigateToMainNav}
              onOpenRoadmap={() => { void handleOpenRoadmapFromWorkspace() }}
              onGoHome={() => navigateToMainNav('home')}
              className="dashboard__nav"
              userDisplayName={workspaceWelcomeName}
            />
            {canViewDecideur ? (
              <DashboardDecideurNav
                activeNav={activeNav}
                onNavigate={navigateToMainNav}
                onGoHome={() => navigateToMainNav('home')}
                className="dashboard__nav"
              />
            ) : null}
          </div>

          <div className="dashboard__topbar-actions">
            <button
              type="button"
              className="dashboard__theme-toggle"
              onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
              aria-pressed={theme === 'dark'}
              aria-label={
                theme === 'light'
                  ? 'Activer le thème sombre'
                  : 'Activer le thème clair'
              }
              title={
                theme === 'light'
                  ? 'Activer le thème sombre'
                  : 'Activer le thème clair'
              }
            >
              {theme === 'light' ? '☾' : '☀'}
            </button>
            <button
              type="button"
              className="user-badge dashboard__topbar-user-orb"
                onClick={() => setShowProfile(true)}
              title="Mon profil"
              aria-label="Mon profil"
            >
              <div className="user-badge-avatar">
                <UserAvatarImg src={avatarDisplayUrl} initials={userInitials} />
              </div>
            </button>
            <div className="dashboard__topbar-actions-secondary">
              {canViewCompanySheet ? (
                <button
                  type="button"
                  className="company-badge"
                  onClick={() => navigateToMainNav('company')}
                  aria-label={`Ouvrir la fiche ${workspaceName}`}
                  title={`Ouvrir la fiche ${workspaceName}`}
                >
                  <span className="company-badge-initials">
                    {workspaceName.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="company-badge-name">{workspaceName}</span>
                </button>
              ) : (
                <div
                  className="company-badge company-badge--readonly"
                  aria-label={`Espace ${workspaceName}`}
                >
                  <span className="company-badge-initials">
                    {workspaceName.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="company-badge-name">{workspaceName}</span>
                </div>
              )}
              {canAccessSettings && (
                <button
                  type="button"
                  className={
                    [
                      'dashboard__settings-btn',
                      activeNav === 'settings' ? 'dashboard__settings-btn--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                  }
                  onClick={() => navigateToMainNav('settings')}
                  aria-label="Paramètres"
                  title="Paramètres"
                >
                  ⚙
                </button>
              )}
              <button type="button" className="dashboard__logout-btn" onClick={handleLogout}>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileNavOpen ? (
        <div className="dashboard__mobile-nav-layer" role="presentation">
          <button
            type="button"
            className="dashboard__mobile-nav-backdrop"
            aria-label="Fermer le menu"
            onClick={closeMobileNav}
          />
          <div
            className="dashboard__mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div className="dashboard__mobile-nav-head">
              <span className="dashboard__mobile-nav-title">Menu</span>
              <button type="button" className="dashboard__mobile-nav-close" onClick={closeMobileNav} aria-label="Fermer">
                ✕
              </button>
            </div>
            <DashboardMainNav
              id="dashboard-mobile-nav"
              activeNav={activeNav}
              codirModules={codirModules}
              contributeurModules={contributeurModules}
              showCodirSection={showCodirSection}
              showContributeurSection={showContributeurSection}
              onNavigate={navigateToMainNav}
              onOpenRoadmap={() => { void handleOpenRoadmapFromWorkspace() }}
              onGoHome={() => navigateToMainNav('home')}
              className="dashboard__nav dashboard__nav--drawer"
              mobileMode
              userDisplayName={workspaceWelcomeName}
              onItemPick={closeMobileNav}
            />
            {canViewDecideur ? (
              <DashboardDecideurNav
                activeNav={activeNav}
                onNavigate={navigateToMainNav}
                onGoHome={() => navigateToMainNav('home')}
                className="dashboard__nav dashboard__nav--drawer"
                mobileMode
                onItemPick={closeMobileNav}
              />
            ) : null}

            <div className="dashboard__mobile-nav-account">
              <span className="dashboard__mobile-nav-account-label">Compte et espace</span>
              {canViewCompanySheet ? (
                <button
                  type="button"
                  className="dashboard__mobile-nav-action"
                  onClick={() => {
                    navigateToMainNav('company')
                    closeMobileNav()
                  }}
                >
                  <span className="dashboard__mobile-nav-action-mark" aria-hidden>
                    {workspaceName.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="dashboard__mobile-nav-action-text">{workspaceName}</span>
                </button>
              ) : (
                <div
                  className="dashboard__mobile-nav-action dashboard__mobile-nav-action--readonly"
                  aria-label={`Espace ${workspaceName}`}
                >
                  <span className="dashboard__mobile-nav-action-mark" aria-hidden>
                    {workspaceName.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="dashboard__mobile-nav-action-text">{workspaceName}</span>
                </div>
              )}
              <button
                type="button"
                className="dashboard__mobile-nav-action"
                onClick={() => {
                  setShowProfile(true)
                  closeMobileNav()
                }}
              >
                <span className="dashboard__mobile-nav-action-avatar" aria-hidden>
                  <UserAvatarImg src={avatarDisplayUrl} initials={userInitials} />
                </span>
                <span className="dashboard__mobile-nav-action-text">Mon profil</span>
              </button>
              {canAccessSettings && (
                <button
                  type="button"
                  className={`dashboard__mobile-nav-action ${activeNav === 'settings' ? 'dashboard__mobile-nav-action--active' : ''}`}
                  onClick={() => {
                    navigateToMainNav('settings')
                    closeMobileNav()
                  }}
                >
                  <span className="dashboard__mobile-nav-action-text">Paramètres</span>
                </button>
              )}
              <button type="button" className="dashboard__mobile-nav-action dashboard__mobile-nav-action--danger" onClick={handleLogout}>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="dashboard__main">
        <main className="dashboard__content">
          <Suspense fallback={<p>Chargement du module…</p>}>
            {reviewSnapshotId ? (
              <ReviewerSnapshotPage
                snapshotId={reviewSnapshotId}
                onExit={() => {
                  window.history.pushState({}, '', '/')
                  setReviewSnapshotId(null)
                }}
              />
            ) : maturityRoadmapOpen && workspaceId ? (
              <MaturityRoadmap
                workspaceId={workspaceId}
                focusProjetId={roadmapFocusProjetId}
                onBack={exitRoadmap}
              />
            ) : normalizedActiveNav === 'home' ? (
              <WorkspaceHome
                currentStep={workspaceData?.workspace.current_step ?? null}
                currentUserRole={currentUserRole}
                loggedInUserName={workspaceWelcomeName || fallbackFirstName || fullName || authUser.email || null}
                navigateToMainNav={navigateToMainNav}
                onOpenRoadmap={() => { void handleOpenRoadmapFromWorkspace() }}
              />
            ) : normalizedActiveNav === 'settings' ? (
              <SettingsPage
                workspaceId={workspaceId}
                workspaceName={workspaceName}
                workspaces={workspacesCatalog}
                workspacesLoading={workspacesLoading}
                workspacesError={workspacesError}
                onRefreshWorkspaces={() => { void refreshWorkspacesCatalog() }}
                onSelectWorkspace={handleSelectWorkspaceFromSettings}
                onAddWorkspace={() => setShowWorkspaceOnboarding(true)}
              />
            ) : normalizedActiveNav === 'projects' ? (
              <ProjectSelector
                memberDirectionName={storedProfile?.directionName ?? 'Ma direction'}
                memberProfileEmail={authUser?.email ?? null}
                workspaceId={workspaceId}
                onOpenRoadmap={(projetId) => {
                  setRoadmapFocusProjetId(projetId)
                  setMaturityRoadmapOpen(true)
                }}
              />
            ) : normalizedActiveNav === 'dg' ? (
              canViewDecideur ? (
                <DashboardDG workspaceId={workspaceId} canActOnDecideurValidation={canActDecideur} />
              ) : <></>
            ) : normalizedActiveNav === 'discours_transfo' ? (
              canViewDecideur ? (
                <DiscoursTransformationPage
                  workspaceId={workspaceId}
                  currentAppUserId={currentAppUserId}
                  currentUserRole={currentUserRole}
                  platformSuperadmin={platformSuperadmin}
                />
              ) : <></>
            ) : normalizedActiveNav === 'review' ? (
              <ModulePlaceholder
                title="Review Roadmap"
                message="Cette page est dédiée à la revue roadmap. Vous pourrez y retrouver vos revues assignées et leur statut."
              />
            ) : normalizedActiveNav === 'feedbacks' ? (
              <ModulePlaceholder
                title="Feedbacks Roadmap"
                message="Module dédié aux arbitrages des feedbacks roadmap (version membre CODIR)."
              />
            ) : normalizedActiveNav === 'pae_codir' ? (
              <ModulePlaceholder
                title="Plans d'actions d'Equipe (PAE) & Plans de charge (version membre CODIR)"
                message="Module en préparation. Le menu est prêt et l'entrée est alignée sur la terminologie canonique."
              />
            ) : normalizedActiveNav === 'kickoff' ? (
              <ModulePlaceholder
                title="Kick-off"
                message="Module en préparation. L'étape est référencée dans le parcours de transformation."
              />
            ) : normalizedActiveNav === 'suivi_codir' ? (
              <ModulePlaceholder
                title="Suivi PAE (vue membre CODIR)"
                message="Module en préparation pour le suivi des plans d'action côté membre CODIR."
              />
            ) : normalizedActiveNav === 'pae_contrib' ? (
              <ModulePlaceholder
                title="Plans d'actions d'Equipe (PAE) & Plans de charge (version contributeur)"
                message="Module en préparation pour la déclinaison opérationnelle côté contributeur."
              />
            ) : normalizedActiveNav === 'suivi_contrib' ? (
              <ModulePlaceholder
                title="Suivi PAE (vue contributeur)"
                message="Module en préparation pour le reporting PAE côté contributeur."
              />
            ) : normalizedActiveNav === 'company' && canViewCompanySheet ? (
              <CompanySheet
                workspaceId={workspaceId}
                companyName={workspaceData?.companyName ?? workspaceName}
                sector={workspaceData?.sector ?? 'Non renseigné'}
                size={workspaceData?.size ?? 'Non renseigné'}
                members={workspaceData?.members ?? []}
                currentUserRole={currentUserRole}
                companyLogo={companyLogo}
                dirigeantUserId={workspaceData?.workspace?.dirigeant_user_id ?? null}
                onDirigeantChange={(userId) => {
                  setWorkspaceData((prev) =>
                    prev
                      ? {
                          ...prev,
                          workspace: prev.workspace
                            ? { ...prev.workspace, dirigeant_user_id: userId }
                            : prev.workspace,
                        }
                      : prev,
                  )
                }}
                onCompanyUpdate={(data) => {
                  setCompanyLogo(data.logo)
                  setWorkspaceName(data.companyName)
                  setWorkspaceData((prev) =>
                    prev
                      ? {
                          ...prev,
                          companyName: data.companyName,
                          sector: data.sector,
                          size: data.size,
                          companyLogo: data.logo,
                          workspace: prev.workspace
                            ? {
                                ...prev.workspace,
                                company_name: data.companyName,
                                sector: data.sector === 'Non renseigné' ? null : data.sector,
                                size:
                                  data.size === 'Non renseigné'
                                    ? null
                                    : (data.size as Workspace['size']),
                                logo_url: data.logo,
                              }
                            : prev.workspace,
                        }
                      : prev,
                  )
                  if (workspaceId) {
                    writeWorkspaceLogoUrl(workspaceId, data.logo)
                    writeWorkspaceSnapshot({
                      id: workspaceId,
                      company_name: data.companyName,
                      sector: data.sector === 'Non renseigné' ? null : data.sector,
                      size: data.size === 'Non renseigné' ? null : data.size,
                      logo_url: data.logo,
                    })
                  }
                }}
              />
            ) : (
              <></>
            )}
          </Suspense>
        </main>
      </div>

      <Suspense fallback={null}>
        <ProfileSheet
          open={showProfile}
          onClose={() => setShowProfile(false)}
          workspaceId={workspaceId}
          storageEmail={authUser?.email ?? null}
          firstName={fallbackFirstName}
          lastName={fallbackLastName}
          jobTitle={storedProfile?.jobTitle ?? ''}
          direction={storedProfile?.directionName ?? ''}
          mission={storedProfile?.mission ?? ''}
          vision={storedProfile?.vision ?? ''}
          role={profileRoleLabel}
          directionType={storedProfile?.directionType}
          managedCount={storedProfile?.managedCount}
          totalEffectif={storedProfile?.totalEffectif}
          avatarUrl={avatarDisplayUrl}
          isPlatformSuperadmin={platformSuperadmin}
          onSaved={async () => {
            const nextProfile = readStoredProfile(authUser?.email)
            setStoredProfile(nextProfile)
            setUserInitials(profileInitials(nextProfile))
            const row = await getCurrentUser()
            if (row) setServerAccess({ source: 'users', dbUser: row })
            if (platformSuperadmin) {
              const requiresMfa = await isMfaEnrollmentRequiredForSuperadmin()
              setMfaEnrollmentRequired(requiresMfa)
            }
          }}
        />
      </Suspense>
      {mfaEnrollmentRequired && platformSuperadmin && !showProfile && (
        <div className="dashboard__mfa-guard" role="alertdialog" aria-modal="true" aria-label="MFA requis">
          <div className="dashboard__mfa-guard-card">
            <h3>MFA requis pour le compte super-admin</h3>
            <p>
              Activez l’authentification multi-facteurs (TOTP) dans votre profil avant de continuer.
            </p>
            <div className="dashboard__mfa-guard-actions">
              <button
                type="button"
                onClick={() => setShowProfile(true)}
              >
                Ouvrir mon profil
              </button>
              <button type="button" onClick={handleLogout}>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
