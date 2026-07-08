import { Link, useLocation, useNavigate } from 'react-router-dom'

const chromeLink =
  'font-mono text-[14px] uppercase text-white/95 no-underline cursor-pointer hover:text-accent hover:[text-shadow:0_0_8px_rgba(91,141,239,0.8)]'

const activeLink =
  'font-mono text-[14px] uppercase no-underline text-accent [text-shadow:0_0_8px_rgba(91,141,239,0.6)]'

const themeToggle =
  'border-0 bg-none font-mono text-[14px] text-white/95 px-2.5 py-1.5 cursor-pointer hover:text-accent hover:[text-shadow:0_0_8px_rgba(91,141,239,0.6)]'

export default function Chrome() {
  const location = useLocation()
  const navigate = useNavigate()
  const isDocs = location.pathname.startsWith('/docs')

  const handleFeatures = (e) => {
    e.preventDefault()
    if (location.pathname === '/') {
      document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => {
        document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  return (
    <>
      {/* Logo — top left */}
      {!isDocs && (
        <Link to="/" className="fixed left-[75px] top-[75px] z-[1000] block no-underline">
          <span
            id="logo"
            className="block font-mono text-[18px] uppercase whitespace-nowrap text-white/90 opacity-85 tracking-[0] hover:text-accent hover:[text-shadow:0_0_8px_rgba(91,141,239,0.6)] hover:opacity-100"
          >
            FURNACE
          </span>
        </Link>
      )}

      {/* Nav — top right */}
      <nav className="fixed top-[75px] right-[75px] z-[200] flex flex-col items-end gap-2">
        <a
          href="#features-section"
          onClick={handleFeatures}
          className={chromeLink}
        >
          Features
        </a>
        <Link to="/quickstart" className={chromeLink}>
          Quickstart
        </Link>
        <Link
          to={isDocs ? '/' : '/docs'}
          className={isDocs ? activeLink : chromeLink}
        >
          Docs
        </Link>
        <a href="https://github.com/amoreX/furnace" target="_blank" rel="noopener noreferrer" className={chromeLink}>
          GitHub
        </a>
      </nav>

      {/* Footer label — bottom left */}
      {!isDocs && (
        <div id="site-footer" className="fixed bottom-[75px] left-[75px] z-[200] font-mono text-[14px] text-white/95 px-2.5 py-1.5">
          FURNACE · MIT · v0.1.2
        </div>
      )}

      {/* Theme toggle — bottom right */}
      <div className="fixed bottom-[75px] right-[75px] z-[200] flex items-center gap-4">
        <button
          id="theme-toggle"
          type="button"
          aria-label="Toggle color theme"
          className={themeToggle}
        >
          <span className="value"></span>
        </button>
      </div>
    </>
  )
}
