import { useLayoutEffect, useState } from 'react'
import './App.css'
import ProjectSelector from './ProjectSelector'
import MemberOnboarding from './MemberOnboarding'
import OnboardingFlow from './OnboardingFlow'
import CompanySheet from './CompanySheet'
import ProfileSheet from './ProfileSheet.tsx'
import type { OnboardingFlowProps } from './OnboardingFlow'
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

function App() {
  const [workspaceData, setWorkspaceData] = useState<OnboardingData | null>(null)
  const [onboardingDone, setOnboardingDone] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('La Forge')
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [userInitials, setUserInitials] = useState('?')
  const [activeNav, setActiveNav] = useState<string>('home')
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme())
  const isFabriqueGroupActive = ['fabrique', 'workspace'].includes(activeNav)
  const storedProfile = (() => {
    try {
      const raw = localStorage.getItem('lfdc-member-onboarding')
      return raw ? JSON.parse(raw) as { firstName?: string; lastName?: string; jobTitle?: string; directionName?: string; mission?: string; vision?: string } : null
    } catch {
      return null
    }
  })()

  useLayoutEffect(() => {
    applyThemeToDocument(theme)
    persistTheme(theme)
  }, [theme])

  if (!onboardingDone) {
    return (
      <OnboardingFlow
        onComplete={(data) => {
          setOnboardingDone(true)
          setWorkspaceName(data.companyName)
          setCompanyLogo(data.companyLogo)
          setUserInitials(`${storedProfile?.firstName?.[0] ?? ''}${storedProfile?.lastName?.[0] ?? ''}`.toUpperCase() || '?')
          setWorkspaceData(data)
        }}
      />
    )
  }

  return (
    <div className="dashboard">
      <aside className="dashboard__sidebar" aria-label="Navigation principale">
        <button
          type="button"
          className="dashboard__brand"
          onClick={() => setActiveNav('home')}
          aria-label="Retour à l'accueil"
        >
          <div className="dashboard__brand-mark">
            {companyLogo
              ? <img src={companyLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
              : <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>
                {workspaceName.slice(0, 2).toUpperCase()}
              </span>
            }
          </div>
          <span className="dashboard__brand-text">{workspaceName}</span>
        </button>
        <nav className="dashboard__nav">
          {navItems.filter((item) => item.group === null).map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                [
                  'dashboard__nav-item',
                  activeNav === item.id ? 'dashboard__nav-item--active' : '',
                  item.group === 'fabrique' && isFabriqueGroupActive ? 'dashboard__nav-item--child' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
              }
              onClick={() => setActiveNav(item.id)}
            >
              {item.label}
            </button>
          ))}
          <div style={{
            height: '1px',
            background: 'rgba(255,255,255,0.06)',
            margin: '2px 0 2px 16px',
          }} />
          <div style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--theme-accent)',
            padding: '4px 0 2px 16px',
            opacity: 0.8,
          }}>
            Espace de travail
          </div>
          {navItems.filter((item) => item.group === 'fabrique').map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                [
                  'dashboard__nav-item',
                  activeNav === item.id ? 'dashboard__nav-item--active' : '',
                  isFabriqueGroupActive ? 'dashboard__nav-item--child' : '',
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
        <div className="dashboard__sidebar-foot">
          <p>Espace SaaS — accès sécurisé</p>
          <button
            type="button"
            className="dashboard__reset-btn"
            onClick={() => setOnboardingDone(false)}
          >
            ↺ Recommencer
          </button>
        </div>
      </aside>

      <div className="dashboard__main">
        <header className="dashboard__header">
          <div className="dashboard__header-main">
            <h1
              className="dashboard__title"
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveNav('home')}
              title="Retour à l'accueil"
            >
              La Forge du Changement
            </h1>
          </div>
          <div className="dashboard__header-actions">
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
              onClick={() => setActiveNav('profile')}
              title="Mon profil"
            >
              <div className="user-badge-avatar">
                {userInitials}
              </div>
            </button>
          </div>
        </header>

        <main className="dashboard__content">
          {activeNav === 'home' || (!['fabrique', 'workspace', 'profile', 'sens', 'roles', 'company'].includes(activeNav)) ? (
            <>
              <p className="dashboard__intro">
                Choisissez un module pour poursuivre votre parcours de transformation.
              </p>
              <div className="dashboard__cards" role="list">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className="dashboard__card"
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
            </>
          ) : activeNav === 'fabrique' ? (
            <ProjectSelector />
          ) : activeNav === 'company' ? (
            <CompanySheet
              companyName={workspaceData?.companyName ?? workspaceName}
              sector={workspaceData?.sector ?? 'Non renseigné'}
              size={workspaceData?.size ?? 'Non renseigné'}
              members={workspaceData?.members ?? []}
              currentUserRole="consultant"
            />
          ) : activeNav === 'workspace' ? (
            <MemberOnboarding
              firstName={storedProfile?.firstName}
              direction={storedProfile?.directionName || 'votre direction'}
              role="codir"
              onNavigate={setActiveNav}
            />
          ) : activeNav === 'profile' ? (
            <ProfileSheet
              firstName={storedProfile?.firstName ?? ''}
              lastName={storedProfile?.lastName ?? ''}
              jobTitle={storedProfile?.jobTitle ?? ''}
              direction={storedProfile?.directionName ?? ''}
              mission={storedProfile?.mission ?? ''}
              vision={storedProfile?.vision ?? ''}
              role="codir"
            />
          ) : (
            <></>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
