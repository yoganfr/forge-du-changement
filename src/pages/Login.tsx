import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  isPlatformSuperadmin,
  sendMagicLink,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  userCanAccessApp,
} from '../lib/auth'

interface LoginProps {
  onAuthenticated?: (user: User) => void
  forcedMessage?: string | null
}

function mapAuthErrorMessage(message: string): string {
  const normalized = message.toLowerCase()
  if (
    normalized.includes('invalid login credentials')
    || normalized.includes('invalid_credentials')
  ) {
    return 'Email ou mot de passe incorrect'
  }
  return message || 'Une erreur est survenue, veuillez réessayer'
}

export default function Login({ onAuthenticated, forcedMessage }: LoginProps) {
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null)
  const [sendingMagicLink, setSendingMagicLink] = useState(false)

  async function ensureInvitedAccess(userEmail: string | undefined) {
    if (!userEmail) throw new Error('Cet email n\'est pas invité dans l\'application')
    if (await isPlatformSuperadmin()) return

    const allowed = await userCanAccessApp(userEmail)
    if (!allowed) {
      await signOut()
      throw new Error('Cet email n\'est pas invité dans l\'application')
    }
  }

  async function handleEmailLogin() {
    setError(null)
    setLoading(true)
    try {
      const { user } = await signInWithEmail(email.trim(), password)
      await ensureInvitedAccess(user.email)
      onAuthenticated?.(user)
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message === 'Cet email n\'est pas invité dans l\'application') {
        setError(message)
      } else {
        setError(mapAuthErrorMessage(message))
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setError(mapAuthErrorMessage(message))
    }
  }

  async function handleSendMagicLink() {
    if (!forgotEmail.trim()) return
    setSendingMagicLink(true)
    setError(null)
    setForgotSuccess(null)
    try {
      await sendMagicLink(forgotEmail.trim().toLowerCase())
      setForgotSuccess(`Un lien vous a ete envoye a ${forgotEmail.trim().toLowerCase()}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setError(mapAuthErrorMessage(message))
    } finally {
      setSendingMagicLink(false)
    }
  }

  return (
    <div className="login-page">
      <style>{CSS}</style>
      <div className="login-card">
        {forcedMessage ? <div className="login-error-banner">{forcedMessage}</div> : null}
        {!showAuthForm ? (
          <div className="login-landing">
            <div className="login-brand">
              <div className="login-brand-mark" aria-hidden="true">◈</div>
              <h1>Bienvenue sur la Forge du Changement</h1>
              <p className="login-brand-lead">
                Connectez-vous pour accéder à votre espace de pilotage.
              </p>
            </div>
            <button
              type="button"
              className="login-primary-btn"
              onClick={() => setShowAuthForm(true)}
            >
              Se connecter
            </button>
          </div>
        ) : (
          <>
            {error && <div className="login-error-banner">{error}</div>}
            <div className="login-brand">
              <div className="login-brand-mark" aria-hidden="true">◈</div>
              <h1>La Forge du Changement</h1>
              <p className="login-brand-lead">
                Accès réservé aux membres invités — pilotez votre transformation avec clarté et rythme.
              </p>
            </div>

            <form
              className="login-form"
              onSubmit={(e) => {
                e.preventDefault()
                void handleEmailLogin()
              }}
            >
              <label className="login-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@entreprise.fr"
                  required
                />
              </label>

              <label className="login-field">
                <span>Mot de passe</span>
                <div className="login-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    required
                  />
                  <button
                    type="button"
                    className="login-toggle-password"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
              </label>

              <button type="button" className="login-forgot-link" onClick={() => setShowForgotModal(true)}>
                Mot de passe oublie ?
              </button>

              <button type="submit" className="login-primary-btn" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>

              <div className="login-separator">
                <span>ou</span>
              </div>

              <button type="button" className="login-google-btn" onClick={() => { void handleGoogleLogin() }}>
                <span aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-5.9S8.8 5.9 12 5.9c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.6 3.5 14.5 2.6 12 2.6 6.9 2.6 2.8 6.8 2.8 11.9S6.9 21.2 12 21.2c6.9 0 8.6-4.8 8.6-7.3 0-.5 0-.8-.1-1.2H12z" />
                  </svg>
                </span>
                Continuer avec Google
              </button>
              <button
                type="button"
                className="login-back-link"
                onClick={() => {
                  setError(null)
                  setShowAuthForm(false)
                }}
              >
                ← Retour
              </button>
            </form>
          </>
        )}
      </div>

      {showForgotModal && (
        <div className="login-modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Recevoir un lien de connexion</h3>
            <p>Saisissez votre email pour recevoir un magic link.</p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="vous@entreprise.fr"
            />
            {forgotSuccess && <div className="login-success-banner">{forgotSuccess}</div>}
            <div className="login-modal-actions">
              <button type="button" onClick={() => setShowForgotModal(false)}>
                Fermer
              </button>
              <button
                type="button"
                className="login-modal-primary"
                onClick={() => { void handleSendMagicLink() }}
                disabled={sendingMagicLink}
              >
                {sendingMagicLink ? 'Envoi...' : 'Envoyer le lien de connexion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const CSS = `
.login-page {
  min-height: 100svh;
  display: grid;
  place-items: center;
  padding: clamp(20px, 4vw, 40px);
  box-sizing: border-box;
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--theme-text);
  background: var(--theme-bg-page);
}

.login-card {
  width: 100%;
  max-width: min(480px, 100%);
  box-sizing: border-box;
  border-radius: var(--radius-lg);
  padding: clamp(36px, 5vw, 52px);
  background: var(--theme-bg-card);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-lg);
}

.login-brand {
  text-align: center;
  margin-bottom: 32px;
}

.login-brand-mark {
  display: block;
  font-size: 3.5rem;
  line-height: 1;
  color: var(--theme-accent);
  margin: 0 auto 20px;
}

.login-brand h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 1.2rem + 2vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--theme-text);
}

.login-brand-lead {
  margin: 10px auto 0;
  max-width: 34ch;
  font-size: var(--text-sm);
  line-height: 1.55;
  color: var(--theme-text-muted);
}

.login-landing {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-error-banner {
  margin-bottom: 16px;
  border: 1px solid color-mix(in srgb, var(--score-critical) 40%, transparent);
  background: color-mix(in srgb, var(--score-critical) 10%, transparent);
  color: var(--score-critical);
  border-radius: var(--ui-radius-control);
  padding: 10px 14px;
  font-size: var(--text-xs);
  font-weight: 600;
}

.login-success-banner {
  margin-top: 12px;
  border: 1px solid color-mix(in srgb, var(--score-ok) 40%, transparent);
  background: color-mix(in srgb, var(--score-ok) 10%, transparent);
  color: var(--score-ok);
  border-radius: var(--ui-radius-control);
  padding: 10px 14px;
  font-size: var(--text-xs);
  font-weight: 600;
}

.login-field span {
  display: block;
  margin-bottom: 6px;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--theme-text);
  letter-spacing: 0.02em;
}

.login-field input,
.login-modal input {
  width: 100%;
  height: 48px;
  border-radius: var(--ui-radius-control);
  border: 1px solid var(--theme-border);
  background: var(--theme-bg-raised);
  color: var(--theme-text);
  padding: 0 14px;
  box-sizing: border-box;
  font-family: var(--font-body);
  font-size: var(--text-sm);
}

.login-field input:focus,
.login-modal input:focus {
  border-color: var(--theme-accent);
  box-shadow: var(--ui-focus-ring);
  outline: none;
}

.login-password-wrap {
  position: relative;
}

.login-password-wrap input {
  padding-right: 84px;
}

.login-toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--text-xs);
  color: var(--theme-accent);
  background: none;
  border: none;
  cursor: pointer;
}

.login-forgot-link,
.login-back-link {
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-xs);
  color: var(--theme-accent);
}

.login-forgot-link { align-self: flex-end; }
.login-back-link   { align-self: center; }

.login-primary-btn {
  width: 100%;
  height: 52px;
  border-radius: var(--ui-radius-control);
  border: none;
  background: var(--theme-accent);
  color: #fff;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: filter .15s, transform .15s, box-shadow .2s;
}

.login-primary-btn:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.login-primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-separator {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--theme-text-muted);
  font-size: var(--text-xs);
}

.login-separator::before,
.login-separator::after {
  content: '';
  height: 1px;
  flex: 1;
  background: var(--theme-border);
}

.login-google-btn {
  width: 100%;
  height: 48px;
  border-radius: var(--ui-radius-control);
  border: 1px solid var(--theme-border);
  background: var(--theme-bg-raised);
  color: var(--theme-text);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: background .15s;
}

.login-google-btn:hover {
  background: var(--theme-bg-card);
}

.login-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 50;
}

.login-modal {
  width: min(420px, 100%);
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border);
  border-radius: var(--ui-radius-panel);
  padding: 24px;
  box-shadow: var(--shadow-lg);
}

.login-modal h3 {
  margin: 0 0 6px;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  color: var(--theme-text);
}

.login-modal p {
  margin: 0 0 12px;
  font-size: var(--text-sm);
  color: var(--theme-text-muted);
}

.login-modal-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.login-modal-actions button {
  height: 40px;
  border-radius: var(--ui-radius-control);
  padding: 0 14px;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--theme-border);
  background: var(--theme-bg-raised);
  color: var(--theme-text);
}

.login-modal-primary {
  background: var(--theme-accent) !important;
  border-color: var(--theme-accent) !important;
  color: #fff !important;
}
`
