import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
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
import type { Workspace } from './lib/types'
import { MEMBER_PROFILE_STORAGE_KEY } from './lib/memberProfileStorage'
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
  | { source: 'superadmin' }
import { getCurrentUser, isPlatformSuperadmin, signOut } from './lib/auth'
import { supabase } from './lib/supabase'
import {
  applyThemeToDocument,
  getStoredTheme,
  persistTheme,
  type ThemeMode,
} from './themeStorage'

const Login = lazy(() => import('./pages/Login'))
const SettingsPage = lazy(() => import('./pages/Settings'))
const ProjectSelector = lazy(() => import('./ProjectSelector'))
const MemberOnboarding = lazy(() => import('./MemberOnboarding'))
const OnboardingFlow = lazy(() => import('./OnboardingFlow'))
const CompanySheet = lazy(() => import('./CompanySheet'))
const ProfileSheet = lazy(() => import('./ProfileSheet'))
const DashboardDG = lazy(() => import('./pages/DashboardDG'))
const MaturityRoadmap = lazy(() => import('./MaturityRoadmap'))

const navItems = [
  { id: 'fabrique', label: 'La Fabrique', group: null },
  { id: 'dg', label: 'Vue décideur', group: null },
  { id: 'workspace', label: 'Mon Espace', group: 'fabrique' },
] as const

const cards = [
  {
    id: 'fabrique',
    title: 'La Fabrique',
    description:
      'Prototyper, itérer et industrialiser les leviers de transformation directement dans le produit.',
    icon: '⚙',
  },
  {
    id: 'sens',
    title: 'Sens',
    description:
      'Aligner vision, enjeux et trajectoire pour que chaque équipe comprenne le « pourquoi » du changement.',
    icon: '◇',
  },
  {
    id: 'roles',
    title: 'Rôles & Rythmes',
    description:
      'Clarifier qui fait quoi, à quel rythme, et comment synchroniser les décisions sans friction.',
    icon: '◎',
  },
  {
    id: 'dg',
    title: 'Vue décideur',
    description:
      'Consolider la lecture inter-directions avec KPI, top BUILD et trajectoire macro pour les arbitrages décideur.',
    icon: '◈',
  },
] as const

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

function readStoredProfile(): StoredMemberProfile | null {
  try {
    const raw = localStorage.getItem(MEMBER_PROFILE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredMemberProfile) : null
  } catch {
    return null
  }
}

function profileInitials(profile: StoredMemberProfile | null): string {
  return `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase() || '?'
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
  if (typeof db.managed_count === 'number' && Number.isFinite(db.managed_count)) {
    patch.managedCount = db.managed_count
  }
  if (typeof db.total_effectif === 'number' && Number.isFinite(db.total_effectif)) {
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

function canViewDecideurView(role: AppUserRole, isPlatformSuperadmin: boolean): boolean {
  if (isPlatformSuperadmin) return true
  return role === 'consultant' || role === 'admin' || role === 'pilote'
}

function canActOnDecideurValidation(role: AppUserRole, isPlatformSuperadmin: boolean): boolean {
  return canViewDecideurView(role, isPlatformSuperadmin)
}

type DashboardMainNavProps = {
  activeNav: string
  canViewDecideur: boolean
  onNavigate: (navId: string) => void
  className: string
  id?: string
  onItemPick?: () => void
}

function DashboardMainNav({
  activeNav,
  canViewDecideur,
  onNavigate,
  className,
  id,
  onItemPick,
}: DashboardMainNavProps) {
  function pick(navId: string) {
    onNavigate(navId)
    onItemPick?.()
  }

  return (
    <nav id={id} className={className} aria-label="Navigation principale">
      {navItems
        .filter((item) => item.group === null)
        .filter((item) => (item.id === 'dg' ? canViewDecideur : true))
        .map((item) => (
          <button
            key={item.id}
            type="button"
            className={[
              'dashboard__nav-item',
              activeNav === item.id ? 'dashboard__nav-item--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => pick(item.id)}
          >
            {item.label}
          </button>
        ))}
      <span className="dashboard__nav-divider" aria-hidden="true" />
      <span className="dashboard__nav-section-label">Espace</span>
      {navItems.filter((item) => item.group === 'fabrique').map((item) => (
        <button
          key={item.id}
          type="button"
          className={[
            'dashboard__nav-item',
            'dashboard__nav-item--sub',
            activeNav === item.id ? 'dashboard__nav-item--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => pick(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}

function App() {
  const [authLoading, setAuthLoading] = useState(true)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => localStorage.getItem('workspaceId'))
  const [workspaceData, setWorkspaceData] = useState<OnboardingData | null>(null)
  const [workspaceName, setWorkspaceName] = useState('La Forge')
  const [companyLogo, setCompanyLogo] = useState<string | null>(readInitialCompanyLogo)
  const [storedProfile, setStoredProfile] = useState<StoredMemberProfile | null>(() => readStoredProfile())
  const [userInitials, setUserInitials] = useState(() => profileInitials(readStoredProfile()))
  const [activeNav, setActiveNav] = useState<string>('home')
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme())
  const [platformSuperadmin, setPlatformSuperadmin] = useState(false)
  const normalizedActiveNav = useMemo(() => {
    const known = ['fabrique', 'workspace', 'sens', 'roles', 'company', 'settings', 'dg'] as const
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

  const currentUserRole: AppUserRole =
    serverAccess?.source === 'superadmin'
      ? 'consultant'
      : serverAccess?.source === 'invitation'
        ? serverAccess.role
        : serverAccess?.source === 'users'
          ? appRoleFromDbUser(serverAccess.dbUser)
          : 'consultant'

  /** Paramètres globaux : rôle issu du serveur ou super-admin (RPC). */
  const canAccessSettings =
    platformSuperadmin ||
    (serverAccess?.source === 'users' &&
      (serverAccess.dbUser.role === 'consultant' || serverAccess.dbUser.role === 'admin')) ||
    (serverAccess?.source === 'invitation' &&
      (serverAccess.role === 'consultant' || serverAccess.role === 'admin')) ||
    serverAccess?.source === 'superadmin'

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
    setMobileNavOpen(false)
  }, [])

  const handleLogout = useCallback(() => {
    void signOut()
    localStorage.removeItem('workspaceId')
    clearWorkspaceSnapshot()
    localStorage.removeItem(MEMBER_PROFILE_STORAGE_KEY)
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [mobileNavOpen])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(min-width: 769px)')
    const onChange = () => {
      if (mq.matches) setMobileNavOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

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
    if (activeNav === 'dg' && !canViewDecideurView(currentUserRole, platformSuperadmin)) {
      navigateToMainNav('home')
    }
  }, [activeNav, currentUserRole, platformSuperadmin, navigateToMainNav])

  const refreshWorkspacesCatalog = useCallback(async () => {
    if (!canAccessSettings) return
    setWorkspacesLoading(true)
    setWorkspacesError(null)
    try {
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

  /** Mobile / autre appareil : le cache `localStorage` peut être vide alors que le profil existe en base. */
  useEffect(() => {
    if (serverAccess?.source !== 'users') return
    const patch = profilePatchFromDbUser(serverAccess.dbUser)
    if (Object.keys(patch).length === 0) return

    const prev = readStoredProfile() ?? {}
    const next: StoredMemberProfile = { ...prev, ...patch }
    try {
      localStorage.setItem(MEMBER_PROFILE_STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* quota ou mode privé : l’état React reste utile pour la session courante */
    }
    setStoredProfile(next)
    setUserInitials(profileInitials(next))
  }, [serverAccess])

  const handleSelectWorkspaceFromSettings = useCallback((id: string) => {
    localStorage.setItem('workspaceId', id)
    setWorkspaceId(id)
    navigateToMainNav('company')
  }, [navigateToMainNav])

  const handleOpenRoadmapFromWorkspace = useCallback(async () => {
    if (!workspaceId) {
      navigateToMainNav('fabrique')
      return
    }

    const directions = await getWorkspaceDirections(workspaceId)
    if (directions.length === 0) {
      navigateToMainNav('fabrique')
      window.alert('Aucune direction disponible. Créez d’abord vos directions et projets dans La Fabrique.')
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
      navigateToMainNav(pendingDg ? 'dg' : 'fabrique')
      window.alert(
        pendingDg
          ? 'Votre projet BUILD est soumis au décideur mais pas encore validé pour la roadmap. Ouvrez la Vue décideur et validez le projet (section « Projets BUILD soumis pour la roadmap »).'
          : 'Aucun projet BUILD validé par le décideur pour la roadmap. Créez un BUILD dans La Fabrique, retenez-le pour le décideur, puis validez-le dans la Vue décideur.',
      )
      return
    }

    setRoadmapFocusProjetId(null)
    setMaturityRoadmapOpen(true)
  }, [workspaceId, navigateToMainNav])

  const reconcileAuthSession = useCallback(async (user: User) => {
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
        setServerAccess({ source: 'superadmin' })
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
    setAuthUser(null)
  }, [])

  useEffect(() => {
    let alive = true

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!alive) return
      const user = session?.user ?? null
      if (!user) {
        setAuthUser(null)
        setPlatformSuperadmin(false)
        setServerAccess(null)
        setAuthLoading(false)
        return
      }

      await reconcileAuthSession(user)
      if (!alive) return
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        const user = session?.user ?? null
        if (!user) {
          setAuthUser(null)
          setPlatformSuperadmin(false)
          setServerAccess(null)
          setAuthLoading(false)
          return
        }

        await reconcileAuthSession(user)
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
          setWorkspaceData((prev) => ({
            workspace: prev?.workspace ?? {
              id: snap.id,
              company_name: snap.company_name,
              sector: snap.sector,
              size: snap.size as Workspace['size'],
              logo_url: snap.logo_url,
              created_at: prev?.workspace?.created_at ?? '',
            },
            companyName: snap.company_name,
            sector: snap.sector ?? 'Non renseigné',
            size: snap.size ?? 'Non renseigné',
            companyLogo: snap.logo_url,
            members: prev?.members ?? [],
          }))
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
  const profileRoleLabel = platformSuperadmin ? 'Super admin plateforme' : normalizeRoleLabel(currentUserRole)
  const canViewDecideur = canViewDecideurView(currentUserRole, platformSuperadmin)
  const canActDecideur = canActOnDecideurValidation(currentUserRole, platformSuperadmin)
  const avatarFromDb =
    serverAccess?.source === 'users' ? serverAccess.dbUser.avatar_url?.trim() || null : null
  const avatarDisplayUrl = storedProfile?.avatar?.trim() || avatarFromDb || null

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
            const nextProfile = readStoredProfile()
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
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            <span className="dashboard__menu-bars" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </button>

          <DashboardMainNav
            activeNav={activeNav}
            canViewDecideur={canViewDecideur}
            onNavigate={navigateToMainNav}
            className="dashboard__nav dashboard__nav--top dashboard__nav--desktop"
          />

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
                {avatarDisplayUrl
                  ? <img src={avatarDisplayUrl} alt="" referrerPolicy="no-referrer" />
                  : userInitials}
              </div>
            </button>
            <div className="dashboard__topbar-actions-secondary">
              <button
                type="button"
                className="company-badge"
                onClick={() => navigateToMainNav('company')}
              >
                <span className="company-badge-initials">
                  {workspaceName.slice(0, 2).toUpperCase()}
                </span>
                <span className="company-badge-name">{workspaceName}</span>
              </button>
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
            <button
              type="button"
              className={`dashboard__mobile-nav-home ${activeNav === 'home' ? 'dashboard__mobile-nav-home--active' : ''}`}
              onClick={() => {
                navigateToMainNav('home')
                closeMobileNav()
              }}
            >
              Accueil — choix des modules
            </button>
            <DashboardMainNav
              id="dashboard-mobile-nav"
              activeNav={activeNav}
              canViewDecideur={canViewDecideur}
              onNavigate={navigateToMainNav}
              className="dashboard__nav dashboard__nav--drawer"
              onItemPick={closeMobileNav}
            />

            <div className="dashboard__mobile-nav-account">
              <span className="dashboard__mobile-nav-account-label">Compte et espace</span>
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
              <button
                type="button"
                className="dashboard__mobile-nav-action"
                onClick={() => {
                  setShowProfile(true)
                  closeMobileNav()
                }}
              >
                <span className="dashboard__mobile-nav-action-avatar" aria-hidden>
                  {avatarDisplayUrl
                    ? <img src={avatarDisplayUrl} alt="" referrerPolicy="no-referrer" />
                    : userInitials}
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
            {maturityRoadmapOpen && workspaceId ? (
              <MaturityRoadmap
                workspaceId={workspaceId}
                focusProjetId={roadmapFocusProjetId}
                onBack={exitRoadmap}
              />
            ) : normalizedActiveNav === 'home' ? (
            <div className="dashboard__module-panel">
              <div className="dashboard__module-panel-deco" aria-hidden="true" />
              <div
                className="dashboard__module-panel-blob dashboard__module-panel-blob--green"
                aria-hidden="true"
              />
              <div
                className="dashboard__module-panel-blob dashboard__module-panel-blob--caramel"
                aria-hidden="true"
              />
              <div className="dashboard__module-panel-inner">
                <p className="dashboard__intro">
                  Choisissez un module pour poursuivre votre parcours de transformation.
                </p>
                <div className="dashboard__cards" role="list">
                  {cards
                    .filter((card) => (card.id === 'dg' ? canViewDecideur : true))
                    .map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      className={`dashboard__card dashboard__card--${card.id}`}
                      role="listitem"
                      onClick={() => navigateToMainNav(card.id)}
                    >
                      <span className="dashboard__card-icon" aria-hidden="true">
                        {card.icon}
                      </span>
                      <span className="dashboard__card-title">{card.title}</span>
                      <span className="dashboard__card-desc">{card.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
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
            ) : normalizedActiveNav === 'fabrique' ? (
              <ProjectSelector
                memberDirectionName={storedProfile?.directionName ?? 'Ma direction'}
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
            ) : normalizedActiveNav === 'company' ? (
              <CompanySheet
                workspaceId={workspaceId}
                companyName={workspaceData?.companyName ?? workspaceName}
                sector={workspaceData?.sector ?? 'Non renseigné'}
                size={workspaceData?.size ?? 'Non renseigné'}
                members={workspaceData?.members ?? []}
                currentUserRole={currentUserRole}
                companyLogo={companyLogo}
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
            ) : normalizedActiveNav === 'workspace' ? (
              <MemberOnboarding
                firstName={storedProfile?.firstName}
                direction={storedProfile?.directionName || 'votre direction'}
                role="codir"
                onNavigate={navigateToMainNav}
                onOpenRoadmap={() => { void handleOpenRoadmapFromWorkspace() }}
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
          onSaved={async () => {
            const nextProfile = readStoredProfile()
            setStoredProfile(nextProfile)
            setUserInitials(profileInitials(nextProfile))
            const row = await getCurrentUser()
            if (row) setServerAccess({ source: 'users', dbUser: row })
          }}
        />
      </Suspense>
    </div>
  )
}

export default App
