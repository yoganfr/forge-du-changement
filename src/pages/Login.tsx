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

export default function Login({ onAuthenticated }: LoginProps) {
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
      {/* Fonds décoratifs mesh — purement visuels */}
      <div className="login-page__mesh" aria-hidden="true" />
      <div className="login-card">
        {!showAuthForm ? (
          <div className="login-landing">
            <div className="login-brand">
              <p className="login-brand-kicker">Forge du Changement</p>
              <div className="login-brand-mark">◈</div>
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
              <p className="login-brand-kicker">Forge du Changement</p>
              <div className="login-brand-mark">◈</div>
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
  position: relative;
  isolation: isolate;
  min-height: 100svh;
  display: grid;
  place-items: center;
  padding: clamp(20px, 4vw, 40px);
  box-sizing: border-box;
  overflow-x: hidden;
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.6;
  /* Mesh #ffeeb3 ↔ #f1872a */
  background-color: #ffeeb3;
  background-image:
    radial-gradient(ellipse 100% 70% at 15% 20%, rgba(241, 135, 42, 0.42) 0%, transparent 58%),
    radial-gradient(ellipse 90% 80% at 88% 15%, rgba(255, 238, 179, 0.95) 0%, transparent 52%),
    radial-gradient(ellipse 85% 75% at 75% 85%, rgba(241, 135, 42, 0.38) 0%, transparent 55%),
    radial-gradient(ellipse 70% 60% at 10% 90%, rgba(255, 238, 179, 0.75) 0%, transparent 50%),
    linear-gradient(152deg, #ffeeb3 0%, #f1872a 42%, #ffeeb3 100%);
  background-attachment: fixed;
}

.login-page__mesh {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.55;
  background:
    radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.22) 0%, transparent 35%),
    radial-gradient(circle at 70% 60%, rgba(241, 135, 42, 0.15) 0%, transparent 40%);
  mix-blend-mode: soft-light;
}

.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: min(520px, 100%);
  box-sizing: border-box;
  border-radius: 28px;
  padding: clamp(36px, 5vw, 52px);
  /* Vitre : 12 % blanc + 40px flou */
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(40px) saturate(1.25);
  -webkit-backdrop-filter: blur(40px) saturate(1.25);
  /* Bordure duo : haut Caramel 100, côtés Orecchiette 200 */
  border-top: 1.5px solid #fdd284;
  border-left: 1.5px solid #d1a035;
  border-right: 1.5px solid #d1a035;
  border-bottom: 1.5px solid #d1a035;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.42),
    inset 0 -1px 0 rgba(71, 0, 0, 0.04),
    0 28px 56px -20px rgba(71, 0, 0, 0.14);
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .login-card {
    background: color-mix(in srgb, #fffef8 88%, #ffeeb3);
  }
}

.login-error-banner {
  margin-bottom: 16px;
  border: 1px solid rgba(239,68,68,0.4);
  background: rgba(239,68,68,0.12);
  color: #B91C1C;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
}

.login-success-banner {
  margin-top: 12px;
  border: 1px solid rgba(16,185,129,0.4);
  background: rgba(16,185,129,0.12);
  color: #065F46;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
}

.login-brand {
  text-align: center;
  margin-bottom: 28px;
}

.login-brand-kicker {
  margin: 0 0 14px;
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: none;
  color: color-mix(in srgb, #470000 72%, #bf651a);
}

.login-brand-mark {
  width: 40px;
  height: 40px;
  margin: 0 auto 12px;
  display: grid;
  place-items: center;
  color: #8E3B46;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, #fdd284 70%, #d1a035);
  background: rgba(255, 255, 255, 0.25);
  font-size: 1.1rem;
}

.login-brand-lead {
  margin: 12px 0 0;
  max-width: 36ch;
  margin-left: auto;
  margin-right: auto;
  font-size: 15px;
  line-height: 1.55;
  font-weight: 500;
  color: color-mix(in srgb, #470000 72%, #bf651a);
}

.login-brand h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-hero);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.1;
  color: #470000;
}

.login-landing {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-field span {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #470000;
}

.login-field input,
.login-modal input {
  width: 100%;
  height: 48px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, #d1a035 55%, rgba(255, 255, 255, 0.6));
  background: rgba(255, 255, 255, 0.55);
  color: #470000;
  padding: 0 14px;
  box-sizing: border-box;
}

.login-field input:focus,
.login-modal input:focus {
  border-color: #8E3B46;
  box-shadow: 0 0 0 3px rgba(142,59,70,0.15);
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
  font-size: 12px;
  color: #8E3B46;
}

.login-forgot-link {
  align-self: flex-end;
  font-size: 13px;
  color: #8E3B46;
}

.login-back-link {
  align-self: center;
  font-size: 13px;
  color: #8E3B46;
}

.login-primary-btn {
  width: 100%;
  height: 52px;
  border-radius: 12px;
  border: none;
  background: #8E3B46;
  color: #fff;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.02em;
  transition: transform .15s, box-shadow .2s, filter .2s;
}

.login-primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(142,59,70,0.28);
}

.login-separator {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 2px 0;
  color: color-mix(in srgb, #470000 55%, #f1872a);
  font-size: 13px;
}

.login-separator::before,
.login-separator::after {
  content: '';
  height: 1px;
  flex: 1;
  background: color-mix(in srgb, #d1a035 40%, transparent);
}

.login-google-btn {
  width: 100%;
  height: 52px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, #d1a035 50%, rgba(255, 255, 255, 0.5));
  background: rgba(255, 255, 255, 0.2);
  color: #470000;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.login-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: grid;
  place-items: center;
  padding: 16px;
}

.login-modal {
  width: min(420px, 100%);
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border);
  border-radius: 16px;
  padding: 22px;
  box-shadow: var(--shadow-lg);
}

.login-modal h3 {
  margin: 0 0 6px;
}

.login-modal p {
  margin: 0 0 12px;
  font-size: 13px;
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
  border-radius: 10px;
  padding: 0 12px;
}

.login-modal-primary {
  background: #8E3B46;
  border: 1px solid #8E3B46;
  color: white;
  font-weight: 700;
}
`
