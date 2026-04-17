import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import './App.css'
import ProjectSelector from './ProjectSelector'
import MemberOnboarding from './MemberOnboarding'
import OnboardingFlow from './OnboardingFlow'
import CompanySheet from './CompanySheet'
import ProfileSheet from './ProfileSheet'
import Login from './pages/Login'
import SettingsPage from './pages/Settings'
import type { StoredMemberProfile } from './ProfileSheet'
import type { OnboardingFlowProps } from './OnboardingFlow'
import { getWorkspace, listWorkspaces } from './lib/api'
import type { Workspace } from './lib/types'
import {
  clearWorkspaceSnapshot,
  readInitialCompanyLogo,
  readWorkspaceLogoUrl,
  readWorkspaceSnapshot,
  normalizeWorkspaceLogoUrl,
  writeWorkspaceLogoUrl,
  writeWorkspaceSnapshot,
} from './lib/workspaceSnapshot'
import { getCurrentUser, isSuperAdmin, signOut } from './lib/auth'
import { supabase } from './lib/supabase'
import {
  applyThemeToDocument,
  getStoredTheme,
  persistTheme,
  type ThemeMode,
} from './themeStorage'

const navItems = [
  { id: 'fabrique', label: 'La Fabrique', group: null },
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
] as const

type OnboardingData = OnboardingFlowProps extends { onComplete: (data: infer T) => void } ? T : never
type AppUserRole = 'consultant' | 'admin' | 'codir' | 'pilote' | 'contributeur'

function App() {
  const [authLoading, setAuthLoading] = useState(true)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => localStorage.getItem('workspaceId'))
  const [workspaceData, setWorkspaceData] = useState<OnboardingData | null>(null)
  const [workspaceName, setWorkspaceName] = useState('La Forge')
  const [companyLogo, setCompanyLogo] = useState<string | null>(readInitialCompanyLogo)
  const [userInitials, setUserInitials] = useState('?')
  const [activeNav, setActiveNav] = useState<string>('home')
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme())
  const storedProfile = (() => {
    try {
      const raw = localStorage.getItem('lfdc-member-onboarding')
      return raw ? JSON.parse(raw) as StoredMemberProfile : null
    } catch {
      return null
    }
  })()

  const [showProfile, setShowProfile] = useState(false)
  const [showWorkspaceOnboarding, setShowWorkspaceOnboarding] = useState(false)
  const [workspacesCatalog, setWorkspacesCatalog] = useState<Workspace[]>([])
  const [workspacesLoading, setWorkspacesLoading] = useState(false)
  const [workspacesError, setWorkspacesError] = useState<string | null>(null)
  const storedRole = localStorage.getItem('lfdc-user-role') as AppUserRole | null
  const currentUserRole: AppUserRole = storedRole ?? 'consultant'
  /** Paramètres globaux de l’espace : consultants et administrateurs. */
  const canAccessSettings = currentUserRole === 'consultant' || currentUserRole === 'admin'

  useLayoutEffect(() => {
    applyThemeToDocument(theme)
    persistTheme(theme)
  }, [theme])

  useEffect(() => {
    if (activeNav === 'settings' && !canAccessSettings) {
      setActiveNav('home')
    }
  }, [activeNav, canAccessSettings])

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

  const handleSelectWorkspaceFromSettings = useCallback((id: string) => {
    localStorage.setItem('workspaceId', id)
    setWorkspaceId(id)
    setActiveNav('company')
  }, [])

  useEffect(() => {
    let alive = true

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!alive) return
      const user = session?.user ?? null
      if (!user) {
        setAuthUser(null)
        setAuthLoading(false)
        return
      }

      const email = user.email ?? ''
      const invitedUser = await getCurrentUser()
      if (!alive) return
      if (isSuperAdmin(email) || invitedUser) {
        setAuthUser(user)
      } else {
        await signOut()
        setAuthUser(null)
      }
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        const user = session?.user ?? null
        if (!user) {
          setAuthUser(null)
          setAuthLoading(false)
          return
        }

        const email = user.email ?? ''
        const invitedUser = await getCurrentUser()
        if (isSuperAdmin(email) || invitedUser) {
          setAuthUser(user)
        } else {
          await signOut()
          setAuthUser(null)
        }
        setAuthLoading(false)
      })()
    })

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [])

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
    return (
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
  }

  if (!authUser) {
    return (
      <Login
        onAuthenticated={(user) => {
          setAuthUser(user)
        }}
      />
    )
  }

  if (showWorkspaceOnboarding) {
    return (
      <OnboardingFlow
        onCancel={() => setShowWorkspaceOnboarding(false)}
        onComplete={(data) => {
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
          try {
            const raw = localStorage.getItem('lfdc-member-onboarding')
            const p = raw ? JSON.parse(raw) as StoredMemberProfile : {}
            const u = `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase() || '?'
            setUserInitials(u)
          } catch {
            setUserInitials('?')
          }
          setWorkspaceData(data)
          setActiveNav('company')
          setShowWorkspaceOnboarding(false)
          void refreshWorkspacesCatalog()
        }}
      />
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard__topbar">
        <div className="dashboard__topbar-inner">
          <button
            type="button"
            className="dashboard__brand"
            onClick={() => setActiveNav('home')}
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

          <nav className="dashboard__nav dashboard__nav--top" aria-label="Navigation principale">
            {navItems.filter((item) => item.group === null).map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  [
                    'dashboard__nav-item',
                    activeNav === item.id ? 'dashboard__nav-item--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
                onClick={() => setActiveNav(item.id)}
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
                className={
                  [
                    'dashboard__nav-item',
                    'dashboard__nav-item--sub',
                    activeNav === item.id ? 'dashboard__nav-item--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
                onClick={() => setActiveNav(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

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
              className="company-badge"
              onClick={() => setActiveNav('company')}
            >
              <span className="company-badge-initials">
                {workspaceName.slice(0, 2).toUpperCase()}
              </span>
              <span className="company-badge-name">{workspaceName}</span>
            </button>
            <button
              type="button"
              className="user-badge"
              onClick={() => setShowProfile(true)}
              title="Mon profil"
            >
              <div className="user-badge-avatar">
                {storedProfile?.avatar
                  ? <img src={storedProfile.avatar} alt="" />
                  : userInitials}
              </div>
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
                onClick={() => setActiveNav('settings')}
                aria-label="Paramètres"
                title="Paramètres"
              >
                ⚙
              </button>
            )}
            <button
              type="button"
              className="dashboard__logout-btn"
              onClick={() => {
                void signOut()
                localStorage.removeItem('workspaceId')
                clearWorkspaceSnapshot()
                localStorage.removeItem('lfdc-member-onboarding')
                setWorkspaceId(null)
                setWorkspaceData(null)
                setCompanyLogo(null)
                setWorkspaceName('La Forge')
                setActiveNav('home')
                setAuthUser(null)
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard__main">
        <main className="dashboard__content">
          {activeNav === 'home' || (!['fabrique', 'workspace', 'sens', 'roles', 'company', 'settings'].includes(activeNav)) ? (
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
                  {cards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      className={`dashboard__card dashboard__card--${card.id}`}
                      role="listitem"
                      onClick={() => setActiveNav(card.id)}
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
          ) : activeNav === 'settings' ? (
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
          ) : activeNav === 'fabrique' ? (
            <ProjectSelector
              memberDirectionName={storedProfile?.directionName ?? 'Ma direction'}
              workspaceId={workspaceId}
            />
          ) : activeNav === 'company' ? (
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
          ) : activeNav === 'workspace' ? (
            <MemberOnboarding
              firstName={storedProfile?.firstName}
              direction={storedProfile?.directionName || 'votre direction'}
              role="codir"
              onNavigate={setActiveNav}
            />
          ) : (
            <></>
          )}
        </main>
      </div>

      <ProfileSheet
        open={showProfile}
        onClose={() => setShowProfile(false)}
        workspaceId={workspaceId}
        firstName={storedProfile?.firstName ?? ''}
        lastName={storedProfile?.lastName ?? ''}
        jobTitle={storedProfile?.jobTitle ?? ''}
        direction={storedProfile?.directionName ?? ''}
        mission={storedProfile?.mission ?? ''}
        vision={storedProfile?.vision ?? ''}
        role="codir"
        directionType={storedProfile?.directionType}
        managedCount={storedProfile?.managedCount}
        totalEffectif={storedProfile?.totalEffectif}
        avatarUrl={storedProfile?.avatar ?? null}
        onSaved={() => {
          try {
            const raw = localStorage.getItem('lfdc-member-onboarding')
            const p = raw ? JSON.parse(raw) as StoredMemberProfile : {}
            setUserInitials(`${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase() || '?')
          } catch { /* ignore */ }
        }}
      />
    </div>
  )
}

export default App
