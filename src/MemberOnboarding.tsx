export interface MemberOnboardingProps {
  firstName?: string
  direction?: string
  role?: string
  onNavigate: (id: string) => void
}

export default function MemberOnboarding({
  firstName = 'vous',
  direction = 'votre direction',
  role = 'Membre CODIR',
  onNavigate,
}: MemberOnboardingProps) {
  return (
    <div className="mo-root">
      <style>{CSS}</style>
      <main className="mo-main">
        <header className="mo-header">
          <h2 className="mo-title">Bonjour {firstName} 👋</h2>
          <p className="mo-subtitle">
            Espace {direction} · {role}
          </p>
        </header>

        <section className="mo-grid">
          <button type="button" className="mo-card mo-card--active" onClick={() => onNavigate('fabrique')}>
            <span className="mo-icon">{ICON_PENCIL}</span>
            <h3>Saisir mes projets</h3>
            <p>Évaluer vos projets RUN & BUILD sur les 6 dimensions de criticité</p>
            <span className="mo-cta">Ouvrir →</span>
          </button>

          <button type="button" className="mo-card mo-card--active" onClick={() => onNavigate('fabrique')}>
            <span className="mo-icon">{ICON_LIST}</span>
            <h3>Vue synthèse</h3>
            <p>Visualiser le classement et le top 5 BUILD soumis au DG</p>
            <span className="mo-cta">Ouvrir →</span>
          </button>

          <div className="mo-card mo-card--disabled">
            <span className="mo-soon">Bientôt disponible</span>
            <span className="mo-icon mo-icon--muted">{ICON_TIMELINE}</span>
            <h3>Ma roadmap</h3>
            <p>Construire ma feuille de route de transformation par axe</p>
          </div>

          <div className="mo-card mo-card--disabled">
            <span className="mo-soon">Bientôt disponible</span>
            <span className="mo-icon mo-icon--muted">{ICON_CHECKLIST}</span>
            <h3>Plans d&apos;actions</h3>
            <p>Piloter les actions managériales et suivre la charge par équipe</p>
          </div>
        </section>
      </main>
    </div>
  )
}

const CSS = `
.mo-root {
  background: var(--theme-bg-page);
  color: var(--theme-text);
}

.mo-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.mo-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.mo-title {
  margin: 0;
  font-family: var(--font-display);
  color: var(--theme-text);
  font-size: 28px;
  font-weight: 700;
}

.mo-subtitle {
  margin: 0;
  color: var(--theme-text-muted);
  font-size: 14px;
}

.mo-card {
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border);
  border-radius: var(--radius-lg);
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
}

.mo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
}

.mo-card h3 {
  margin: 0;
  color: var(--theme-text);
  font-size: 1.05rem;
}

.mo-card p {
  margin: 0;
  color: var(--theme-text-muted);
  font-size: 0.88rem;
  line-height: 1.45;
}

.mo-card--active {
  cursor: pointer;
  transition:
    transform .2s,
    box-shadow .2s,
    border-color .2s;
}

.mo-card--active:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.12);
  border-color: var(--theme-accent);
}

.mo-card--disabled {
  opacity: .45;
  cursor: default;
  position: relative;
}

.mo-soon {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 10px;
  font-weight: 700;
  color: var(--theme-text-muted);
  border: 1px solid var(--theme-border);
  border-radius: 999px;
  padding: 3px 8px;
}

.mo-icon {
  color: #8E3B46;
}

.mo-icon--muted {
  color: #6B7280;
}

.mo-cta {
  margin-top: auto;
  font-size: 13px;
  font-weight: 600;
  color: #8E3B46;
}

@media (max-width: 900px) {
  .mo-grid {
    grid-template-columns: 1fr;
  }
}
`

const ICON_PENCIL = (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M4 20h4l10-10-4-4L4 16z" />
    <path d="M13 7l4 4" />
  </svg>
)

const ICON_LIST = (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M9 7h10M9 12h10M9 17h10" />
    <path d="M4 7l1.2 1.2L7 6.5M4 12l1.2 1.2L7 11.5M4 17l1.2 1.2L7 16.5" />
  </svg>
)

const ICON_TIMELINE = (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M4 6h16M4 12h10M4 18h16" />
    <circle cx="18" cy="12" r="2" />
  </svg>
)

const ICON_CHECKLIST = (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path d="M9 7h10M9 12h10M9 17h10" />
    <path d="M4 7h1M4 12h1M4 17h1" />
  </svg>
)
