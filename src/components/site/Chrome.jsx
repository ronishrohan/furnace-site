import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../hooks/useTheme.js'

const VERSION_FALLBACK = '0.0.0'
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

function useAnimatedVersion(target) {
  const [display, setDisplay] = useState(VERSION_FALLBACK)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!target) return
    const [, core, suffix = ''] = target.match(/^(\d+\.\d+\.\d+)(.*)$/) || []
    if (!core) return
    const parts = core.split('.').map(Number)
    // Segments with target=0 stay at 0; others roll one full extra cycle before landing
    const totals = parts.map((v) => (v === 0 ? 0 : v + 10))
    const DURATION = 400
    const start = performance.now()

    function tick(now) {
      const t = Math.min(Math.max((now - start) / DURATION, 0), 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = parts.map((v, i) => {
        if (v === 0) return 0
        const raw = Math.floor(eased * totals[i])
        return ((raw % 10) + 10) % 10  // safe modulo, always non-negative
      })
      setDisplay(`${current.join('.')}${suffix}`)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else setDisplay(target)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target])

  return display
}

const chromeLink =
  'font-mono text-[14px] uppercase text-white/95 no-underline cursor-pointer hover:text-accent hover-accent-glow'

const activeLink =
  'font-mono text-[14px] uppercase no-underline text-accent accent-glow'

const themeToggle =
  'border-0 bg-none font-mono text-[14px] text-white/95 px-2.5 py-1.5 cursor-pointer hover:text-accent hover-accent-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2'

export default function Chrome() {
  const location = useLocation()
  const navigate = useNavigate()
  const isDocs = location.pathname.startsWith('/docs')
  const [version, setVersion] = useState(VERSION_FALLBACK)
  const animatedVersion = useAnimatedVersion(version)
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

  const handleFeatures = (e) => {
    e.preventDefault()
    navigate('/', {
      replace: location.pathname === '/',
      state: { scrollToHomeSection: 'features-section' },
    })
  }

  return (
    <>
      {/* Logo — top left */}
      {!isDocs && (
        <Link to="/" className="fixed left-[75px] top-[75px] z-[1000] flex items-center gap-2.5 no-underline group opacity-85 hover:opacity-100">
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
        <div className="fixed bottom-[75px] left-[75px] z-[200] flex items-center gap-3">
          <a
            href="https://www.npmjs.com/package/cook-furnace"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[14px] text-white/95 px-2.5 py-1.5 no-underline hover:underline cursor-pointer"
          >
            FURNACE · v{animatedVersion}
          </a>
          <span className="text-white/30 text-[10px] select-none">■</span>
          <a
            href="https://github.com/amoreX/furnace/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[14px] text-white/95 px-2.5 py-1.5 no-underline hover:underline cursor-pointer"
          >
            OPEN AN ISSUE
          </a>
          <span className="text-white/30 text-[10px] select-none">■</span>
          <button
            type="button"
            onClick={() => { const root = document.getElementById('root'); if (root) root.scrollTo({ top: root.scrollHeight, behavior: 'smooth' }) }}
            className="font-mono text-[14px] text-white/95 px-2.5 py-1.5 bg-transparent border-0 no-underline hover:underline cursor-pointer"
          >
            TALK TO US
          </button>
        </div>
      )}

      {/* Theme toggle — bottom right */}
      <div className="fixed bottom-[75px] right-[75px] z-[200] flex items-center gap-4">
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
