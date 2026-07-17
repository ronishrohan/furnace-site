import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../hooks/useTheme.js'
import CommandTeaser, { ScrambledText } from './CommandTeaser.jsx'

const VERSION_FALLBACK = '0.0.0'
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

const chromeLink =
  'font-mono text-[12px] sm:text-[14px] uppercase text-white/95 no-underline cursor-pointer hover:text-accent hover-accent-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4'

const activeLink =
  'font-mono text-[12px] sm:text-[14px] uppercase no-underline text-accent accent-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4'

const themeToggle =
  'border-0 bg-none font-mono text-[12px] sm:text-[14px] text-white/95 px-2.5 py-1.5 cursor-pointer hover:text-accent hover-accent-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2'

export default function Chrome() {
  const location = useLocation()
  const navigate = useNavigate()
  const isDocs = location.pathname.startsWith('/docs')
  const isChangelog = location.pathname === '/changelog'
  const [version, setVersion] = useState(VERSION_FALLBACK)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuButton = useRef(null)
  const { isNight, toggleTheme } = useTheme()

  useEffect(() => {
    const controller = new AbortController()

    async function fetchVersion() {
      try {
        const response = await fetch('https://registry.npmjs.org/cook-furnace/latest', {
          signal: controller.signal,
        })
        if (!response.ok) return
        const data = await response.json()
        if (
          !controller.signal.aborted
          && typeof data.version === 'string'
          && VERSION_PATTERN.test(data.version)
        ) {
          setVersion(data.version)
        }
      } catch {
        // Keep the stable fallback for network errors and malformed responses.
      }
    }

    fetchVersion()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return undefined
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      setMobileMenuOpen(false)
      mobileMenuButton.current?.focus()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mobileMenuOpen])

  const handleFeatures = (e) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    navigate('/', {
      replace: location.pathname === '/',
      state: { scrollToHomeSection: 'features-section' },
    })
  }

  const handleTalkToUs = (e) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    navigate('/', {
      replace: location.pathname === '/',
      state: { scrollToHomeSection: 'site-footer' },
    })
  }

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-[1000] flex h-14 items-center justify-between px-4 md:hidden">
        <Link to="/" className="flex shrink-0 items-center gap-2 no-underline opacity-85 hover:opacity-100">
          <img
            src="/assets/brand/furnace-logo.svg"
            alt="Furnace"
            width="18"
            height="18"
            style={{ imageRendering: 'pixelated' }}
            className="[filter:brightness(0)_invert(1)] night:[filter:none]"
          />
          <span className="font-mono text-[16px] uppercase whitespace-nowrap text-white/90">FURNACE</span>
        </Link>
        <button
          ref={mobileMenuButton}
          type="button"
          className={`${chromeLink} border border-white/35 bg-black/10 px-3 py-2`}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-site-menu"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? 'Close' : 'Menu'}
        </button>
        {mobileMenuOpen && (
          <div
            id="mobile-site-menu"
            className="fixed right-4 top-14 flex min-w-[190px] flex-col items-end gap-4 border border-white/30 bg-[#1a1a1a]/95 px-5 py-5 text-right shadow-2xl"
          >
            <a href="#features-section" onClick={handleFeatures} className={chromeLink}>Features</a>
            <Link to="/docs" className={isDocs ? activeLink : chromeLink} aria-current={isDocs ? 'page' : undefined}>Docs</Link>
            <Link to="/changelog" className={isChangelog ? activeLink : chromeLink} aria-current={isChangelog ? 'page' : undefined}>Changelog</Link>
            <a href="https://github.com/amoreX/furnace" target="_blank" rel="noopener noreferrer" className={chromeLink}>GitHub</a>
            {!isDocs && (
              <button type="button" onClick={handleTalkToUs} className={`${chromeLink} border-0 bg-transparent p-0`}>
                Talk To Us
              </button>
            )}
            <button
              type="button"
              aria-label="Toggle color theme"
              className={`${themeToggle} px-0`}
              onClick={toggleTheme}
            >
              <span>{isNight ? 'DAY' : 'NIGHT'}</span>
            </button>
          </div>
        )}
      </nav>

      {/* Logo — top left */}
      {!isDocs && (
        <Link to="/" className="fixed left-[75px] top-[75px] z-[1000] hidden md:flex items-center gap-2.5 no-underline group opacity-85 hover:opacity-100">
          <img
            src="/assets/brand/furnace-logo.svg"
            alt="Furnace"
            width="20"
            height="20"
            style={{ imageRendering: 'pixelated' }}
            className="[filter:brightness(0)_invert(1)] night:[filter:none]"
          />
          <span
            className="accent-glow-target font-mono text-[18px] uppercase whitespace-nowrap text-white/90 tracking-[0] group-hover:text-accent"
          >
            FURNACE
          </span>
          <span className="font-mono text-[18px] text-white/55 whitespace-nowrap group-hover:text-accent">
            · <ScrambledText command={`v${version}`} label="Furnace version" />
          </span>
        </Link>
      )}

      {/* Nav — top right */}
      <nav className="fixed top-[75px] right-[75px] z-[200] hidden md:flex flex-col items-end gap-2">
        <a
          href="#features-section"
          onClick={handleFeatures}
          className={chromeLink}
        >
          Features
        </a>
        <Link
          to="/docs"
          className={isDocs ? activeLink : chromeLink}
          aria-current={isDocs ? 'page' : undefined}
        >
          Docs
        </Link>
        <Link
          to="/changelog"
          className={isChangelog ? activeLink : chromeLink}
          aria-current={isChangelog ? 'page' : undefined}
        >
          Changelog
        </Link>
        <a href="https://github.com/amoreX/furnace" target="_blank" rel="noopener noreferrer" className={chromeLink}>
          GitHub
        </a>
        {!isDocs && (
          <button
            type="button"
            onClick={handleTalkToUs}
            className={`${chromeLink} border-0 bg-transparent p-0`}
          >
            Talk To Us
          </button>
        )}
      </nav>

      {/* Footer label — bottom left */}
      {!isDocs && !isChangelog && (
        <div className="fixed bottom-[75px] left-[75px] right-[180px] z-[200] hidden md:flex items-center gap-3 min-w-0">
          <a
            href="https://github.com/amoreX/furnace/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[14px] text-white/95 no-underline hover:underline cursor-pointer whitespace-nowrap"
          >
            FOUND SOMETHING WRONG? OPEN AN ISSUE
          </a>
          <span className="text-white/30 text-[8px] sm:text-[10px] select-none min-[2000px]:hidden">■</span>
          <div className="min-w-0 overflow-hidden min-[2000px]:hidden">
            <CommandTeaser className="block truncate font-mono text-[11px] sm:text-[14px] text-white/65 whitespace-nowrap" />
          </div>
        </div>
      )}

      {/* Theme toggle — bottom right */}
      <div className="fixed bottom-[75px] right-[75px] z-[200] hidden md:flex items-center gap-4">
        <button
          id="theme-toggle"
          type="button"
          aria-label="Toggle color theme"
          className={themeToggle}
          onClick={toggleTheme}
        >
          <span className="value">{isNight ? 'DAY' : 'NIGHT'}</span>
        </button>
      </div>
    </>
  )
}
