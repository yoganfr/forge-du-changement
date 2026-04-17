import { useEffect, useLayoutEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import './App.css'
import ProjectSelector from './ProjectSelector'
import MemberOnboarding from './MemberOnboarding'
import OnboardingFlow from './OnboardingFlow'
import CompanySheet from './CompanySheet'
import ProfileSheet from './ProfileSheet'
import Login from './pages/Login'
import type { StoredMemberProfile } from './ProfileSheet'
import type { OnboardingFlowProps } from './OnboardingFlow'
import { getWorkspace } from './lib/api'
import { getCurrentUser, isSuperAdmin, signOut } from './lib/auth'
import { supabase } from './lib/supabase'
import {
  applyThemeToDocument,
  getStoredTheme,
  persistTheme,
  type ThemeMode,
} from './themeStorage'

const navItems = [
  { id: 'sens', label: 'Sens', group: null },
  { id: 'roles', label: 'Rôles & Rythmes', group: null },
  { id: 'fabrique', label: 'La Fabrique', group: null },
  { id: 'workspace', label: 'Mon Espace', group: 'fabrique' },
] as const

const cards = [
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
    id: 'fabrique',
    title: 'La Fabrique',
    description:
      'Prototyper, itérer et industrialiser les leviers de transformation directement dans le produit.',
    icon: '⚙',
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
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
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
  const storedRole = localStorage.getItem('lfdc-user-role') as AppUserRole | null
  const currentUserRole: AppUserRole = storedRole ?? 'consultant'
  const canManageWorkspaces = currentUserRole === 'consultant' || currentUserRole === 'admin'

  useLayoutEffect(() => {
    applyThemeToDocument(theme)
    persistTheme(theme)
  }, [theme])

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
        setWorkspaceName(workspace.company_name)
        setCompanyLogo(workspace.logo_url)
        setWorkspaceData((prev) => ({
          workspace,
          companyName: workspace.company_name,
          sector: workspace.sector ?? prev?.sector ?? 'Non renseigné',
          size: workspace.size ?? prev?.size ?? 'Non renseigné',
          companyLogo: workspace.logo_url,
          members: prev?.members ?? [],
        }))
      } catch {
        if (cancelled) return
        localStorage.removeItem('workspaceId')
        setWorkspaceId(null)
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
          setCompanyLogo(data.workspace.logo_url)
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
            {canManageWorkspaces && (
              <button
                type="button"
                className="dashboard__admin-btn"
                onClick={() => setShowWorkspaceOnboarding(true)}
              >
                + Entreprise
              </button>
            )}
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
            <button
              type="button"
              className="dashboard__logout-btn"
              onClick={() => {
                void signOut()
                localStorage.removeItem('workspaceId')
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
          {activeNav === 'home' || (!['fabrique', 'workspace', 'sens', 'roles', 'company'].includes(activeNav)) ? (
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
                    ? { ...prev, companyName: data.companyName, sector: data.sector, size: data.size }
                    : prev,
                )
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
