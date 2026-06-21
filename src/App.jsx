import './App.css'

const links = [
  {
    label: 'GitHub',
    url: 'https://github.com/TheRipperoni',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    label: 'Keysmash',
    url: 'https://keysmash.ripperoni.com/',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    label: 'Bubbles',
    url: 'https://bubbles.ripperoni.com/',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    label: 'Bluesky',
    url: 'https://bsky.app/profile/ripperoni.com',
    gradient: 'linear-gradient(135deg, #0284ff 0%, #38bdf8 100%)',
  },
  {
    label: 'BSKY TTRPG',
    url: 'https://bsky.app/profile/bskyttrpg.bsky.social',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
  },
  {
    label: 'Timed Mutes',
    url: 'https://mutes.ripperoni.com/',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
  },
]

function App() {
  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <div className="background-blob blob-1" aria-hidden="true" />
      <div className="background-blob blob-2" aria-hidden="true" />
      <div className="background-blob blob-3" aria-hidden="true" />

      <main className="container" id="main-content" tabIndex={-1}>
        <div className="profile">
          <div className="avatar-wrapper">
            <div className="avatar-ring" aria-hidden="true" />
            <div className="avatar">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ripperoni's avatar">
                <circle cx="50" cy="35" r="22" fill="currentColor" opacity="0.9" />
                <path d="M12 92c0-21 17-38 38-38s38 17 38 38" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.9" />
              </svg>
            </div>
          </div>
          <h1 className="name">Ripperoni</h1>
          <p className="bio">ripp</p>
        </div>

        <div className="links">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-card"
              style={{ '--gradient': link.gradient }}
              aria-label={`${link.label} (opens in new tab)`}
            >
              <span className="link-label">{link.label}</span>
              <span className="link-arrow" aria-hidden="true">→</span>
            </a>
          ))}
        </div>

        <div className="socials">
          <a href="https://github.com/TheRipperoni" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="GitHub (opens in new tab)">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
        </div>

        <footer className="footer">
          <p>&copy; 2026 Ripperoni</p>
        </footer>
      </main>
    </div>
  )
}

export default App
