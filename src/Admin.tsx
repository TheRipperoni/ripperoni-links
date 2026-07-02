import { useState, useEffect, useRef } from 'react'
import { getLinks, addLink, updateLink, deleteLink } from './store.ts'
import type { Link } from './store.ts'
import {
  isTwoFactorEnabled,
  getConfiguredSecret,
  verifyToken,
  generateSecret,
  saveSecret,
  clearSecret,
  getOtpAuthUri,
} from './totp.ts'
import QRCode from 'qrcode'
import './Admin.css'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin'

interface GradientPreset {
  label: string
  value: string
}

const GRADIENT_PRESETS: GradientPreset[] = [
  { label: 'Purple Pink', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'Pink Orange', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: 'Blue Cyan', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: 'Sky Blue', value: 'linear-gradient(135deg, #0284ff 0%, #38bdf8 100%)' },
  { label: 'Teal Cyan', value: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)' },
  { label: 'Orange Red', value: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' },
  { label: 'Red Yellow', value: 'linear-gradient(135deg, #ff5e5b 0%, #ffb347 100%)' },
  { label: 'Green Teal', value: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' },
  { label: 'Indigo Purple', value: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
  { label: 'Rose Pink', value: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)' },
]

interface LoginScreenProps {
  onLogin: () => void
}

function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      onLogin()
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  return (
    <div className="admin-overlay">
      <div className="admin-panel admin-login">
        <h2>Admin Login</h2>
        <p>Enter the admin password to manage your links.</p>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              placeholder="Enter password"
              autoFocus
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Log In
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface TwoFactorScreenProps {
  onVerified: () => void
  onBack: () => void
}

function TwoFactorScreen({ onVerified, onBack }: TwoFactorScreenProps) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (token.length !== 6) return
    setVerifying(true)
    setError('')
    const secret = getConfiguredSecret()
    if (!secret) {
      setError('2FA is not configured')
      setVerifying(false)
      return
    }
    const valid = await verifyToken(secret, token)
    if (valid) {
      onVerified()
    } else {
      setError('Invalid code. Try again.')
      setToken('')
      setVerifying(false)
    }
  }

  return (
    <div className="admin-overlay">
      <div className="admin-panel admin-login">
        <h2>Two-Factor Authentication</h2>
        <p>Enter the 6-digit code from your authenticator app.</p>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Authentication Code
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={token}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                setToken(digits)
                setError('')
              }}
              placeholder="000000"
              autoFocus
              disabled={verifying}
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={token.length !== 6 || verifying}
            >
              {verifying ? 'Verifying…' : 'Verify'}
            </button>
            <button type="button" className="btn btn-cancel" onClick={onBack} disabled={verifying}>
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TwoFactorSetup() {
  const [enabled, setEnabled] = useState(isTwoFactorEnabled())
  const [showSetup, setShowSetup] = useState(false)
  const [secret, setSecret] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [verifySuccess, setVerifySuccess] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const isEnvManaged = !!import.meta.env.VITE_2FA_SECRET

  function startSetup() {
    const newSecret = generateSecret()
    setSecret(newSecret)
    setShowSetup(true)
    setVerifyCode('')
    setVerifyError('')
    setVerifySuccess(false)
  }

  useEffect(() => {
    if (showSetup && secret && canvasRef.current) {
      const uri = getOtpAuthUri(secret)
      QRCode.toCanvas(canvasRef.current, uri, {
        width: 200,
        margin: 2,
        color: { dark: '#ffffff', light: '#1e1b4b' },
      })
    }
  }, [showSetup, secret])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (verifyCode.length !== 6) return
    setVerifying(true)
    setVerifyError('')
    const valid = await verifyToken(secret, verifyCode)
    if (valid) {
      saveSecret(secret)
      setVerifySuccess(true)
      setEnabled(true)
      setVerifying(false)
    } else {
      setVerifyError('Invalid code. Make sure your authenticator app is set up correctly.')
      setVerifyCode('')
      setVerifying(false)
    }
  }

  function handleDisable() {
    if (isEnvManaged) return
    if (window.confirm('Disable two-factor authentication? This reduces account security.')) {
      clearSecret()
      setEnabled(false)
      setShowSetup(false)
      setSecret('')
    }
  }

  if (showSetup && !verifySuccess) {
    return (
      <div className="two-factor-setup">
        <h3>Set Up Two-Factor Authentication</h3>
        <p className="two-factor-info">
          Scan this QR code with your authenticator app (e.g. Google Authenticator, Authy).
        </p>
        <div className="qr-code-wrapper">
          <canvas ref={canvasRef} aria-label="QR code for two-factor authentication setup" />
        </div>
        <p className="two-factor-secret">
          Or enter this key manually: <code>{secret}</code>
        </p>
        <p className="two-factor-info">
          After scanning, enter the 6-digit code from the app to verify setup.
        </p>
        <form className="admin-form" onSubmit={handleVerify}>
          <label>
            Verification Code
            <input
              type="text"
              inputMode="numeric"
              value={verifyCode}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                setVerifyCode(digits)
                setVerifyError('')
              }}
              placeholder="000000"
              autoFocus
              disabled={verifying}
            />
          </label>
          {verifyError && <p className="login-error">{verifyError}</p>}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={verifyCode.length !== 6 || verifying}
            >
              {verifying ? 'Verifying…' : 'Verify & Enable'}
            </button>
            <button
              type="button"
              className="btn btn-cancel"
              onClick={() => {
                setShowSetup(false)
                setSecret('')
              }}
              disabled={verifying}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="two-factor-section">
      <h3>Two-Factor Authentication</h3>
      <p className="two-factor-status">
        Status:{' '}
        <span className={enabled ? 'status-enabled' : 'status-disabled'}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </p>
      {verifySuccess && (
        <p className="two-factor-success">Two-factor authentication is now enabled.</p>
      )}
      {isEnvManaged && enabled && (
        <p className="two-factor-info">
          2FA is managed via the <code>VITE_2FA_SECRET</code> environment variable and cannot be
          disabled from here.
        </p>
      )}
      <div className="form-actions">
        {!enabled && !showSetup && (
          <button className="btn btn-primary" onClick={startSetup}>
            Enable Two-Factor Auth
          </button>
        )}
        {enabled && !isEnvManaged && (
          <button className="btn btn-danger" onClick={handleDisable}>
            Disable Two-Factor Auth
          </button>
        )}
      </div>
    </div>
  )
}

interface LinkFormProps {
  initialData?: Link | null
  onSubmit: (link: Link) => void
  onCancel?: () => void
}

function LinkForm({ initialData, onSubmit, onCancel }: LinkFormProps) {
  const [label, setLabel] = useState(initialData?.label || '')
  const [url, setUrl] = useState(initialData?.url || '')
  const [gradient, setGradient] = useState(initialData?.gradient || GRADIENT_PRESETS[0].value)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || !url.trim()) return
    onSubmit({ label: label.trim(), url: url.trim(), gradient })
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <label>
        Label
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. GitHub"
          required
        />
      </label>
      <label>
        URL
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="e.g. https://github.com/username"
          required
        />
      </label>
      <label>
        Gradient
        <input
          type="text"
          value={gradient}
          onChange={(e) => setGradient(e.target.value)}
          placeholder="linear-gradient(...)"
        />
      </label>
      <div className="gradient-presets">
        {GRADIENT_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={`gradient-swatch${gradient === p.value ? ' selected' : ''}`}
            style={{ background: p.value }}
            onClick={() => setGradient(p.value)}
            aria-label={p.label}
            title={p.label}
          />
        ))}
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {initialData ? 'Save Changes' : 'Add Link'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

interface AdminProps {
  onClose: () => void
}

export default function Admin({ onClose }: AdminProps) {
  const [links, setLinks] = useState<Link[]>([])
  const [authenticated, setAuthenticated] = useState(false)
  const [passwordDone, setPasswordDone] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  useEffect(() => {
    if (authenticated) {
      setLinks(getLinks())
    }
  }, [authenticated])

  useEffect(() => {
    if (passwordDone && !isTwoFactorEnabled()) {
      setAuthenticated(true)
    }
  }, [passwordDone])

  function refreshLinks() {
    setLinks(getLinks())
  }

  function handleAdd(link: Link) {
    addLink(link)
    refreshLinks()
    setEditingIndex(null)
  }

  function handleUpdate(index: number, link: Link) {
    updateLink(index, link)
    refreshLinks()
    setEditingIndex(null)
  }

  function handleDelete(index: number) {
    if (window.confirm(`Delete "${links[index].label}"?`)) {
      deleteLink(index)
      refreshLinks()
      if (editingIndex === index) setEditingIndex(null)
    }
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    const updated = getLinks()
    const [item] = updated.splice(index, 1)
    updated.splice(index - 1, 0, item)
    setLinks(updated)
    window.localStorage.setItem('linktree-links', JSON.stringify(updated))
    if (editingIndex === index) setEditingIndex(index - 1)
  }

  function handleMoveDown(index: number) {
    const updated = getLinks()
    if (index >= updated.length - 1) return
    const [item] = updated.splice(index, 1)
    updated.splice(index + 1, 0, item)
    setLinks(updated)
    window.localStorage.setItem('linktree-links', JSON.stringify(updated))
    if (editingIndex === index) setEditingIndex(index + 1)
  }

  if (!passwordDone) {
    return <LoginScreen onLogin={() => setPasswordDone(true)} />
  }

  if (!authenticated && isTwoFactorEnabled()) {
    return (
      <TwoFactorScreen
        onVerified={() => setAuthenticated(true)}
        onBack={() => setPasswordDone(false)}
      />
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="admin-overlay">
      <div className="admin-panel" style={{ position: 'relative' }}>
        <button className="admin-close" onClick={onClose} aria-label="Close admin panel">
          &times;
        </button>

        <h2>Admin Portal</h2>

        <h3>{editingIndex !== null ? 'Edit Link' : 'Add New Link'}</h3>
        <LinkForm
          initialData={editingIndex !== null ? links[editingIndex] : null}
          onSubmit={(link) =>
            editingIndex !== null ? handleUpdate(editingIndex, link) : handleAdd(link)
          }
          onCancel={editingIndex !== null ? () => setEditingIndex(null) : undefined}
        />

        <h3>Current Links</h3>
        {links.length === 0 ? (
          <div className="empty-state">No links yet. Add one above!</div>
        ) : (
          <div className="link-list">
            {links.map((link, index) => (
              <div key={index} className="link-item">
                <div
                  className="link-item-gradient"
                  style={{ background: link.gradient }}
                  aria-hidden="true"
                />
                <div className="link-item-info">
                  <div className="link-item-label">{link.label}</div>
                  <div className="link-item-url">{link.url}</div>
                </div>
                <div className="link-item-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    aria-label="Move up"
                    title="Move up"
                  >
                    &uarr;
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === links.length - 1}
                    aria-label="Move down"
                    title="Move down"
                  >
                    &darr;
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditingIndex(index)}
                    aria-label="Edit"
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(index)}
                    aria-label="Delete"
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <TwoFactorSetup />

        <div className="form-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close Admin
          </button>
        </div>
      </div>
    </div>
  )
}
