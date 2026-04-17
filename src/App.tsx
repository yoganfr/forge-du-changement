import { useLayoutEffect, useState } from 'react'
import './App.css'
import ProjectSelector from './ProjectSelector'
import {
  applyThemeToDocument,
  getStoredTheme,
  persistTheme,
  type ThemeMode,
} from './themeStorage'

const navItems = [
  { id: 'sens', label: 'Sens' },
  { id: 'roles', label: 'Rôles & Rythmes' },
  { id: 'fabrique', label: 'La Fabrique' },
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

function App() {
  const [activeNav, setActiveNav] = useState<string>(navItems[0].id)
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme())

  useLayoutEffect(() => {
    applyThemeToDocument(theme)
    persistTheme(theme)
  }, [theme])

  return (
    <div className="dashboard">
      <aside className="dashboard__sidebar" aria-label="Navigation principale">
        <div className="dashboard__brand">
          <span className="dashboard__brand-mark" aria-hidden="true" />
          <span className="dashboard__brand-text">La Forge</span>
        </div>
        <nav className="dashboard__nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                activeNav === item.id
                  ? 'dashboard__nav-item dashboard__nav-item--active'
                  : 'dashboard__nav-item'
              }
              onClick={() => setActiveNav(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <p className="dashboard__sidebar-foot">Espace SaaS — accès sécurisé</p>
      </aside>

      <div className="dashboard__main">
        <header className="dashboard__header">
          <div className="dashboard__header-main">
            <h1 className="dashboard__title">La Forge du Changement</h1>
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
            <span className="dashboard__header-badge">Tableau de bord</span>
          </div>
        </header>

        <main className="dashboard__content">
          {activeNav === 'fabrique' ? (
            <ProjectSelector />
          ) : (
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
          )}
        </main>
      </div>
    </div>
  )
}

export default App
