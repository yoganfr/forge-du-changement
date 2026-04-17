import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  getCurrentUser,
  isSuperAdmin,
  sendMagicLink,
  signInWithEmail,
  signInWithGoogle,
  signOut,
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
    if (isSuperAdmin(userEmail)) return

    const appUser = await getCurrentUser()
    if (!appUser) {
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
        {error && <div className="login-error-banner">{error}</div>}
        <div className="login-brand">
          <div className="login-brand-mark">◈</div>
          <h1>La Forge du Changement</h1>
          <p>Acces reserve aux membres invites</p>
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
        </form>
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
  background: var(--theme-bg-page);
  padding: 24px;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 480px;
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border);
  border-radius: 24px;
  padding: 48px;
  box-shadow: var(--shadow-lg);
  box-sizing: border-box;
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

.login-brand-mark {
  width: 36px;
  height: 36px;
  margin: 0 auto 10px;
  display: grid;
  place-items: center;
  color: #8E3B46;
}

.login-brand h1 {
  margin: 0;
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-text);
}

.login-brand p {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--theme-text-muted);
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
}

.login-field input,
.login-modal input {
  width: 100%;
  height: 48px;
  border-radius: 10px;
  border: 1px solid var(--theme-border);
  background: var(--theme-bg-page);
  color: var(--theme-text);
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

.login-primary-btn {
  width: 100%;
  height: 52px;
  border-radius: 12px;
  border: none;
  background: #8E3B46;
  color: #fff;
  font-family: 'Playfair Display', serif;
  font-size: 17px;
  font-weight: 700;
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
  color: var(--theme-text-muted);
  font-size: 13px;
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
  height: 52px;
  border-radius: 12px;
  border: 1px solid var(--theme-border);
  background: transparent;
  color: var(--theme-text);
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
